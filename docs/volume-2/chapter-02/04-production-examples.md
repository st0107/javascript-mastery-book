# Production Examples

At a callback boundary, decide who owns the receiver. A subscription usually belongs to one instance for its whole lifetime, so a stable bound function is useful. A reusable method decorator must preserve the receiver supplied by each caller, so an ordinary forwarding function is useful. These examples make that difference explicit.

Both examples run in Node.js 20 or newer and use no third-party packages. The complete executable files include assertions for failure paths as well as normal calls.

## Example 1: A Shipment Counter With Explicit Subscription Cleanup

A warehouse process publishes `shipped` events. A reporting component needs to count units while it is active, stop observing when its owner finishes, and resume later without creating duplicate registrations.

An unbound class method does not automatically retain its instance when passed to `on`. Node's `EventEmitter` deliberately supplies the emitter as the receiver of an ordinary listener. Creating one bound function connects this listener to the counter instead. Keeping that function also gives `off` the identity it needs for removal. See [Node.js listener receivers](https://nodejs.org/api/events.html#passing-arguments-and-this-to-listeners) and [listener removal](https://nodejs.org/api/events.html#emitterremovelistenereventname-listener).

Run the full example:

```sh
node code/volume-2/chapter-02/example-01-bound-listener.js
# Expected output:
# shipment total 8
# listeners after cleanup 0
# bound listener assertions passed
```

This independently runnable version includes the complete counter implementation and one lifecycle:

```js
'use strict';

const { EventEmitter } = require('node:events');

class ShipmentCounter {
  #source;
  #sink;
  #listener;
  #active = false;
  #units = 0;

  constructor(source, sink) {
    if (!(source instanceof EventEmitter)) {
      throw new TypeError('source must be an EventEmitter');
    }
    if (typeof sink !== 'function') throw new TypeError('sink must be a function');
    this.#source = source;
    this.#sink = sink;
    this.#listener = this.#onShipment.bind(this);
  }

  start() {
    if (this.#active) return false;
    this.#source.on('shipped', this.#listener);
    this.#active = true;
    return true;
  }

  stop() {
    if (!this.#active) return false;
    this.#active = false;
    this.#source.off('shipped', this.#listener);
    return true;
  }

  read() {
    return this.#units;
  }

  #onShipment(event) {
    if (!this.#active) return;
    if (event === null || typeof event !== 'object') {
      throw new TypeError('shipment must be an object');
    }
    const { units } = event;
    if (!Number.isSafeInteger(units) || units <= 0) {
      throw new TypeError('shipment units must be a positive safe integer');
    }
    const total = this.#units + units;
    if (!Number.isSafeInteger(total)) throw new RangeError('total exceeds safe integers');

    this.#units = total;
    const sink = this.#sink;
    sink(Object.freeze({ added: units, total }));
  }
}

const source = new EventEmitter();
const counter = new ShipmentCounter(source, record => {
  console.log(`added ${record.added}; total ${record.total}`);
});

try {
  counter.start();
  counter.start(); // Already active: no duplicate registration.
  source.emit('shipped', { units: 3 });
  source.emit('shipped', { units: 2 });
} finally {
  counter.stop();
}

source.emit('shipped', { units: 100 }); // No listener remains.
console.log(`shipment total ${counter.read()}`);
console.log(`listeners after cleanup ${source.listenerCount('shipped')}`);

// Expected output:
// added 3; total 3
// added 2; total 5
// shipment total 5
// listeners after cleanup 0
// Each accepted event: O(1) counter work and space, excluding the sink.
// Removal may scan O(l) listeners registered for this event.
```

### Execution Steps and Retained References

1. Construction reads the private method and creates one bound function. Its target is the method and its bound receiver is this counter instance.
2. `start` registers that same function, then marks the counter active. A second `start` returns `false` without registering it again.
3. An emission invokes the registered function. Its bound receiver wins over the emitter's supplied receiver, so the method can access the counter's private fields.
4. Validated units are committed to `#units`, then the sink receives an immutable record. The sink is called as a plain function and has no receiver contract.
5. `stop` marks the counter inactive and removes the original function. Repeated stops have no additional effect. A later start reuses that function and continues the existing total.

While active, the important reference path is `source -> registered bound listener -> counter -> sink`. The counter also owns references to its source and listener. Removing the registration breaks the source's ownership of the counter through this subscription. The counter's own reference cycle is not by itself a leak; reachability from live application roots determines whether objects can be collected. The owner should release the counter when its whole lifetime ends.

Calling `bind` again inside `stop` would create a different function. It could have the same target and receiver and still fail to match the registered listener. This is why binding once is both a receiver decision and a lifecycle decision.

### Failure and Lifecycle Contract

| Situation | Defined behavior |
| --- | --- |
| `start` while already active | Return `false`; keep exactly one registration owned by this counter. |
| `stop` while inactive | Return `false`; do nothing further. |
| Stop, then restart | Reuse the bound function and retain the accumulated total. |
| Invalid event or unsafe total | Throw before changing the total or calling the sink. |
| A synchronous sink throws | Keep the committed total and propagate the original error from `emit`. |
| Another listener stops this counter during dispatch | If still inactive when its pending callback runs, the active guard skips the event. |
| Owner exits because work throws | `finally` removes the registration. |

The executable file checks duplicate starts, repeated stops, three restart cycles, separate owners, invalid units, numeric overflow, stopping during dispatch, and a sink exception followed by cleanup. It checks the final listener count instead of relying on a garbage-collection observation.

The source and sink are trusted, synchronous collaborators. This example assumes the owner controls lifecycle changes and the emitter's registration methods and lifecycle hooks have their ordinary behavior. External code must not remove the counter's registration behind its back. A stop followed by a restart before a pending callback runs makes the counter active again; the boolean guard does not identify dispatch generations.

There is no retry or transaction rollback. A reporting exception occurs after the units were counted, so blindly emitting the shipment again would double-count it. For durable event consumption, define event identity and deduplication separately. The sink must complete synchronously; returned promises are ignored by this implementation.

Node dispatch is synchronous, and a thrown listener error interrupts that emission. Removing a listener cannot rewind work that has already run or automatically cancel an invocation selected by an ongoing emission. These are API contracts, separate from the language's binding rules. See [Node.js synchronous dispatch](https://nodejs.org/api/events.html#asynchronous-vs-synchronous) and [removal during an emission](https://nodejs.org/api/events.html#emitterremovelistenereventname-listener).

### Callback Receivers Depend on the API

Do not generalize the emitter's receiver to every callback. A plain invocation of an ordinary strict function receives `undefined`; an API can supply a receiver deliberately. For example, `Array.prototype.map` accepts a `thisArg` for an ordinary callback, as specified by [ECMAScript's map algorithm](https://tc39.es/ecma262/multipage/indexed-collections.html#sec-array.prototype.map). An arrow callback instead uses its lexical receiver in either setting. Check the callback API when crossing a runtime or library boundary.

## Example 2: A Method Monitor That Preserves the Caller's Receiver

An inventory service wants to count method calls without changing which warehouse receives a reservation. Binding the monitored method to the first warehouse would silently direct every later invocation to that warehouse. The wrapper must receive `this` dynamically and forward it along with the arguments.

`Reflect.apply(target, this, args)` expresses that operation directly and avoids calling a possibly shadowed `target.apply` property. It performs a call immediately and forwards the target's result or exception. Its argument list must be an array-like object; the rest parameter below provides an array. See [ECMAScript's Reflect.apply definition](https://tc39.es/ecma262/multipage/reflection.html#sec-reflect.apply).

Run the full example:

```sh
node code/volume-2/chapter-02/example-02-method-adapter.js
# Expected output:
# north reserved 3
# south reserved 2
# calls 3 returned 2 threw 1
# method adapter assertions passed
```

This independently runnable version contains the complete monitor and inventory implementation:

```js
'use strict';

const assert = require('node:assert/strict');

function monitorSyncMethod(target) {
  if (typeof target !== 'function') throw new TypeError('target must be a function');
  const counts = { calls: 0, returned: 0, threw: 0 };

  function monitored(...args) {
    if (new.target) throw new TypeError('monitored methods cannot be constructors');
    counts.calls += 1;
    try {
      const result = Reflect.apply(target, this, args);
      counts.returned += 1;
      return result;
    } catch (error) {
      counts.threw += 1;
      throw error;
    }
  }

  return Object.freeze({
    method: monitored,
    readCounts: () => Object.freeze({ ...counts })
  });
}

class StockLedger {
  #available;

  constructor(name, available) {
    if (typeof name !== 'string' || name.length === 0) {
      throw new TypeError('name must be a nonempty string');
    }
    if (!Number.isSafeInteger(available) || available < 0) {
      throw new TypeError('available must be a nonnegative safe integer');
    }
    this.name = name;
    this.#available = available;
  }

  reserve(units) {
    if (!Number.isSafeInteger(units) || units <= 0) {
      throw new TypeError('units must be a positive safe integer');
    }
    if (units > this.#available) throw new RangeError('insufficient stock');
    this.#available -= units;
    return `${this.name} reserved ${units}`;
  }

  read() {
    return this.#available;
  }
}

const monitor = monitorSyncMethod(StockLedger.prototype.reserve);
const north = new StockLedger('north', 10);
const south = new StockLedger('south', 5);
north.reserve = monitor.method;
south.reserve = monitor.method;

console.log(north.reserve(3));
console.log(south.reserve(2));
assert.throws(() => south.reserve(99), RangeError);
assert.equal(north.read(), 7);
assert.equal(south.read(), 3);

const counts = monitor.readCounts();
console.log(`calls ${counts.calls} returned ${counts.returned} threw ${counts.threw}`);

// Expected output:
// north reserved 3
// south reserved 2
// calls 3 returned 2 threw 1
// O(k) argument collection per invocation for k arguments, plus target work.
// The monitor retains O(1) counters and one target reference.
```

### Why the Wrapper Is an Ordinary Function

For `north.reserve(3)`, the property call supplies `north` to `monitored`. The wrapper increments the call count, forwards `north` and `[3]` to the captured target, increments the returned count, and returns the target's result. A call through `south.reserve` follows the same steps with `south`. Both instances deliberately share the monitor's counters, while their private stock remains separate.

The target function object is captured when the monitor is created. The receiving warehouse is supplied on every call. Retained state therefore consists of the target and counters, without fixing a warehouse receiver. During an invocation the wrapper also holds its argument array and active receiver; those references are temporary unless the target retains them.

An arrow used for `monitored` would read `this` from the monitor factory's surrounding execution instead of from `north.reserve(...)`. An arrow is appropriate for `readCounts` because that operation needs only the captured counters and has no receiver-dependent behavior.

The wrapper forwards the target's observable return value unchanged, including object identity, and rethrows the same synchronous exception. It does not clone errors, serialize values, retry the method, or roll back target mutations. Reading metrics returns a frozen snapshot so callers cannot alter the counters.

### The Synchronous Boundary Is Intentional

`returned` means the function returned normally. If a target returns a promise, that promise is forwarded unchanged and the call counts as returned immediately. A later rejection does not increment `threw`. Likewise, generator execution that occurs after the initial call is outside these counters. Use a separately specified asynchronous monitor when the intended measurement is eventual settlement or completion.

The monitor is for callable methods, not constructors. It rejects construction before incrementing any counters. It also does not copy custom target properties, preserve the target's `name` or `length`, or make an arrow or already-bound target accept a new receiver. `Reflect.apply` supplies the receiver; the target's own function kind still determines how it is used.

The executable assertions cover two real instance receivers, detached-call failure, private-field brand rejection, a deliberately bound callback, object return identity, original error identity, unchanged promise identity, and a target with its own misleading `apply` property.

### Choosing a Bound Callback or a Live Lookup

Extracting `north.reserve` still loses its property-call receiver. The monitor preserves what it receives; it cannot infer the owner from which a caller previously extracted it. If a callback must always operate on north, create `north.reserve.bind(north)` once and retain that callback for its lifecycle.

Binding captures the current function and a reference to the receiver. It does not freeze the instance. Changes to the receiver's state remain visible, but replacing `north.reserve` later does not change the captured function. A stored arrow such as `(...args) => north.reserve(...args)` performs a fresh property lookup each time and observes method replacement. Both produce a callback associated with north; the difference is when the method is selected. Store either callback if a later removal operation requires its identity.

For a decorator shared across instances, preserve dynamic `this`. For a callback owned by one instance, explicitly fix the receiver. For an operation that does not depend on a receiver, a plain function receiving its data as arguments is often enough.

## Best Practices

- Keep the registered callback and the cleanup action under the same lifecycle owner.
- Bind once when one instance must remain the receiver; use an ordinary forwarding function when callers must choose it.
- State whether a callback is synchronous and whether a failure occurs before or after application state changes.
- Preserve return values and exceptions deliberately when adapting methods.
- Test receiver correctness with two distinct instances, then test extraction, failure, and cleanup.
- Separate receiver selection from authorization, transaction semantics, and durable event delivery.
