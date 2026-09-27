# Production Examples

An object creation pattern should make ownership, valid state, and failure behavior easy to explain. This section develops two small application components: a reservation class that protects domain state and a notification factory that composes an injected collaborator. Both examples run independently in Node.js 20 or newer and require no third-party packages.

The examples have different public contracts. Reservation methods require a properly initialized receiver. Notification functions close over their factory's state, so callers can pass them as callbacks without preserving a receiver. Both approaches keep changing state separate for each created object.

## Example 1: A Reservation With Explicit State Transitions

A reservation is created with an identifier and one or more product lines. It starts as a draft, may be confirmed once, and may be cancelled from either draft or confirmed state. Cancellation is idempotent: a second cancellation reports that nothing changed. Confirmation after cancellation is rejected.

The class owns its lines and status. Consumers can request a frozen data snapshot, serialize that snapshot, and explicitly reconstruct a reservation through `fromDTO`. DTO means *data transfer object*: a documented data shape that contains values suitable for storage or transport.

| Operation | Allowed input or state | Result |
| --- | --- | --- |
| Construction | Valid identifier and 1–100 unique product lines | A new draft reservation with copied line data. |
| `confirm()` | Draft | Status becomes confirmed; return `"confirmed"`. |
| `confirm()` | Confirmed or cancelled | Throw without changing the status. |
| `cancel()` | Draft or confirmed | Status becomes cancelled; return `true`. |
| `cancel()` | Cancelled | Preserve the status; return `false`. |
| `snapshot()` | Any initialized reservation | Return a new frozen record, line array, and line records. |
| `Reservation.fromDTO(dto)` | Supported version, valid status, and valid data | Validate and construct a separate reservation. |

The companion assertion program is `code/volume-2/chapter-04/example-01-reservation.js`:

```sh
node code/volume-2/chapter-04/example-01-reservation.js
# Expected output:
# original r-17 confirmed
# restored r-17 cancelled
# reservation assertions passed
```

This independently runnable example contains the complete implementation:

```js
'use strict';

const assert = require('node:assert/strict');

function readDataRecord(value, keys, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value) ||
      Reflect.ownKeys(value).length !== keys.length) {
    throw new TypeError(`${label} has an invalid shape`);
  }
  const result = Object.create(null);
  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !Object.hasOwn(descriptor, 'value')) {
      throw new TypeError(`${label}.${key} must be an own data property`);
    }
    result[key] = descriptor.value;
  }
  return result;
}

function copyLines(lines) {
  if (!Array.isArray(lines) || lines.length < 1 || lines.length > 100) {
    throw new TypeError('lines must contain 1-100 entries');
  }
  const seen = new Set();
  return Array.from({ length: lines.length }, (_, index) => {
    const entry = Object.getOwnPropertyDescriptor(lines, String(index));
    if (!entry || !Object.hasOwn(entry, 'value')) {
      throw new TypeError('lines must contain own data entries without holes');
    }
    const { sku, units } = readDataRecord(entry.value, ['sku', 'units'], 'line');
    if (typeof sku !== 'string' || sku.length < 1 || sku.length > 32 || /[^A-Z0-9-]/.test(sku)) {
      throw new TypeError('sku must contain 1-32 uppercase identifier characters');
    }
    if (!Number.isSafeInteger(units) || units < 1 || units > 10000) {
      throw new TypeError('units must be an integer from 1 through 10000');
    }
    if (seen.has(sku)) throw new TypeError('duplicate sku');
    seen.add(sku);
    return Object.freeze({ sku, units });
  });
}

class Reservation {
  #id;
  #lines;
  #status = 'draft';

  constructor(id, lines) {
    if (typeof id !== 'string' || id.length < 1 || id.length > 64 || /[^A-Za-z0-9_-]/.test(id)) {
      throw new TypeError('id must contain 1-64 identifier characters');
    }
    this.#id = id;
    this.#lines = Object.freeze(copyLines(lines));
  }

  confirm() {
    if (this.#status !== 'draft') throw new Error('only draft reservations can be confirmed');
    this.#status = 'confirmed';
    return this.#status;
  }

  cancel() {
    if (this.#status === 'cancelled') return false;
    this.#status = 'cancelled';
    return true;
  }

  snapshot() {
    return Object.freeze({
      version: 1,
      id: this.#id,
      status: this.#status,
      lines: Object.freeze(this.#lines.map(line => Object.freeze({ ...line })))
    });
  }

  static fromDTO(dto) {
    const { version, id, status, lines } = readDataRecord(
      dto, ['version', 'id', 'status', 'lines'], 'reservation'
    );
    if (version !== 1) throw new TypeError('unsupported reservation version');
    if (!['draft', 'confirmed', 'cancelled'].includes(status)) {
      throw new TypeError('invalid reservation status');
    }
    const reservation = new Reservation(id, lines);
    reservation.#status = status;
    return reservation;
  }
}

const input = [{ sku: 'SKU-17', units: 2 }];
const original = new Reservation('r-17', input);
const separate = new Reservation('r-42', input);
input[0].units = 999;
input.push({ sku: 'SKU-42', units: 1 });
assert.deepEqual(original.snapshot().lines, [{ sku: 'SKU-17', units: 2 }]);
assert.equal(original.confirm(), 'confirmed');
assert.equal(separate.snapshot().status, 'draft');
assert.throws(() => original.confirm(), /only draft/);

const snapshot = original.snapshot();
assert.throws(() => { snapshot.lines[0].units = 10; }, TypeError);
const dto = JSON.parse(JSON.stringify(snapshot));
assert.equal(dto instanceof Reservation, false);
const restored = Reservation.fromDTO(dto);
dto.lines[0].units = 10;
assert.equal(restored.snapshot().lines[0].units, 2);
assert.equal(restored.cancel(), true);
assert.equal(restored.cancel(), false);
assert.throws(() => restored.confirm(), /only draft/);
assert.throws(() => Object.create(Reservation.prototype).snapshot(), TypeError);

console.log(`original ${original.snapshot().id} ${original.snapshot().status}`);
console.log(`restored ${restored.snapshot().id} ${restored.snapshot().status}`);
console.log(`separate ${separate.snapshot().id} ${separate.snapshot().status}`);

// Expected output:
// original r-17 confirmed
// restored r-17 cancelled
// separate r-42 draft

// Construction, hydration, and snapshot: O(n) time and space for n bounded lines,
// assuming average constant-time Set operations and bounded identifier lengths.
// confirm and cancel: O(1) time and additional space.
```

### Construction and Ownership

1. `new Reservation(...)` creates an instance and initializes the class's private fields. The constructor checks the identifier before accepting the line data.
2. `copyLines` validates the array bounds, requires each position to be an own data entry, checks each line's exact record shape, and rejects duplicate product identifiers.
3. Each accepted line becomes a fresh record containing only a string and an integer. The class freezes those records and the new array before keeping its reference.
4. The constructor returns normally only after initialization succeeds. It neither registers the unfinished instance with another service nor invokes an overridable instance method.
5. Later method calls read or change this reservation's private status. Two instances share their prototype methods but have independent private values and line arrays.

The memory model has three separate layers: caller-owned input, reservation-owned validated lines, and caller-visible snapshot data. Mutating the first layer cannot change the other two. A snapshot also records the status at the moment of the call; subsequent cancellation does not retroactively change an earlier snapshot.

The constructor assigns `#id` before validating all lines, but it never exposes `this`. If validation throws, the caller receives no reservation. This is sufficient for the local construction contract; it would cease to be sufficient if the constructor published itself to a registry or called collaborators before validation finished.

### Why Both Copying and Freezing Appear

Copying establishes ownership. Freezing protects the published snapshot's ordinary properties against later changes. The implementation explicitly handles each object layer in its known schema: snapshot record, line array, and line records. The leaves are strings and numbers, so there are no remaining mutable nested objects in that snapshot.

`Object.freeze` itself does not recursively visit referenced objects, and freezing an instance would not freeze its private fields. This implementation's snapshot guarantee comes from explicitly freezing its complete data shape. The specification's [integrity-level operation](https://tc39.es/ecma262/multipage/abstract-operations.html#sec-setintegritylevel) describes the ordinary-property operation.

The internal lines are already immutable, so this particular schema could safely share them with snapshots. Returning fresh copies is an explicit API choice here: every snapshot has its own complete data graph. That costs an additional O(n) allocation per snapshot. If a service creates snapshots frequently, measure this cost and decide whether immutable structural sharing would meet the same consumer contract.

### Hydration Is a New Construction Operation

Serialization stores the public DTO, not the live instance. `JSON.stringify(reservation.snapshot())` produces useful data because the snapshot explicitly exposes its fields. Serializing a fresh reservation directly would omit its private state. Parsing JSON reconstructs ordinary values; it does not run the reservation constructor or restore private elements.

`fromDTO` first checks the version and stored status, then calls `new Reservation` to reuse the identifier and line validation. Its code is inside the class body, so it can install the accepted status on that new initialized instance. This is a named factory with a clear purpose. It always returns a `Reservation`, even if called through a subclass, because it explicitly constructs that class.

The version field makes schema compatibility explicit. Version 2 would require an intentional migration or a separate reader; silently accepting unknown versions would hide incompatible data. Rejecting extra record keys also keeps accidental schema drift visible. Array entries, rather than extra properties on the array object, define the stored lines.

An object made with `Object.create(Reservation.prototype)` can inherit `snapshot` but lacks the required private state. Calling the inherited method fails when it tries to read a private element. Prototype membership is not initialization. The specification's [private read operation](https://tc39.es/ecma262/multipage/abstract-operations.html#sec-privateget) checks the receiving object for that private name.

### Validation and Application Boundaries

`readDataRecord` accepts exact own data properties and does not evaluate ordinary input getters. It also rejects inherited substitutes and extra symbol keys. Those decisions describe a small DTO schema; they do not turn reflection into a sandbox for arbitrary JavaScript objects. A proxy can execute traps when reflection inspects it. At an external transport boundary, parse bounded JSON text before passing data to this API; enforce transport size limits and authenticate the caller there.

Reconstructing a stored confirmed reservation is different from authorizing a request to confirm one. A valid DTO proves only that its values fit this schema. It does not prove ownership, inventory availability, payment, or permission to load that state. Keep the hydration path behind the appropriate service boundary.

This model intentionally supports only the documented transitions. It has no stock database, distributed lock, persistence transaction, or audit trail. A service coordinating inventory and payment must supply those guarantees separately. A subclass that overrides `confirm` is also free to change the public behavior; private state does not make public methods final. Prefer composing this reservation into a service when new policy is needed.

The companion script additionally checks sparse arrays, invalid versions and statuses, duplicate products, invalid quantities, accessor input, nested snapshot mutation, fake receivers, and two instances created from the same input. It verifies that failed operations preserve the supported state contract.

## Example 2: A Notification Factory With an Injected Sink

A local component needs to emit small event records to a synchronous sink. Each channel gets an independent sequence counter, and application code may pass its `notify` function as a callback. This is a useful closure factory: its functions retain the channel, counter, and collaborator without relying on `this`.

The factory accepts the sink behavior as a function instead of choosing a global logger or inheriting from a transport superclass. The caller adapts a receiver-dependent sink once, at the point where the components are assembled.

The companion assertion program is `code/volume-2/chapter-04/example-02-notifier-factory.js`:

```sh
node code/volume-2/chapter-04/example-02-notifier-factory.js
# Expected output:
# orders #1 reservation.confirmed
# support #1 ticket.created
# orders #2 reservation.cancelled
# notifier factory assertions passed
```

This complete implementation can run by itself:

```js
'use strict';

const assert = require('node:assert/strict');

function createNotifier(channel, deliver) {
  if (typeof channel !== 'string' || channel.length < 1 || channel.length > 32 ||
      /[^a-z0-9-]/.test(channel)) {
    throw new TypeError('channel must contain 1-32 lowercase identifier characters');
  }
  if (typeof deliver !== 'function') throw new TypeError('deliver must be a function');
  let delivered = 0;
  let sending = false;

  function notify(event) {
    if (sending) throw new Error('reentrant notification is not supported');
    if (typeof event !== 'string' || event.length < 1 || event.length > 64 ||
        /[^a-z0-9.-]/.test(event)) {
      throw new TypeError('event must contain 1-64 lowercase event characters');
    }
    if (delivered === Number.MAX_SAFE_INTEGER) throw new RangeError('sequence exhausted');
    const record = Object.freeze({ channel, sequence: delivered + 1, event });
    sending = true;
    try {
      deliver(record);
      delivered += 1;
      return record;
    } finally {
      sending = false;
    }
  }

  return Object.freeze({ notify, readCount: () => delivered });
}

const sink = {
  records: [],
  deliver(record) { this.records.push(record); }
};
const deliver = sink.deliver.bind(sink);
const orders = createNotifier('orders', deliver);
const support = createNotifier('support', deliver);
const notifyOrder = orders.notify;
notifyOrder('reservation.confirmed');
support.notify('ticket.created');
notifyOrder.call({ channel: 'wrong' }, 'reservation.cancelled');
assert.equal(orders.readCount(), 2);
assert.equal(support.readCount(), 1);
assert.notEqual(orders.notify, support.notify);
assert.equal(Object.isFrozen(sink.records[0]), true);

let fail = true;
const attempts = [];
const retryable = createNotifier('audit', record => {
  attempts.push(record.sequence);
  if (fail) throw new Error('local sink unavailable');
});
assert.throws(() => retryable.notify('reservation.created'), /unavailable/);
assert.equal(retryable.readCount(), 0);
fail = false;
assert.equal(retryable.notify('reservation.created').sequence, 1);
assert.deepEqual(attempts, [1, 1]);

for (const record of sink.records) {
  console.log(`${record.channel} #${record.sequence} ${record.event}`);
}
console.log(`successful audit deliveries ${retryable.readCount()}`);

// Expected output:
// orders #1 reservation.confirmed
// support #1 ticket.created
// orders #2 reservation.cancelled
// successful audit deliveries 1

// Factory bookkeeping: O(1) retained state per factory, excluding the sink.
// notify: O(e) event validation for e bounded characters, plus sink work.
// This collecting sink retains O(n) records after n successful deliveries.
```

### Execution Steps and Retained State

1. `createNotifier` validates the channel and collaborator, creates fresh counter and guard bindings, and returns two functions that retain those bindings.
2. A call to `notify` rejects a nested send, invalid event name, or exhausted sequence before asking the sink to do anything.
3. It constructs a record using the next sequence number. All record values are primitive, so freezing that record is sufficient to protect its fields.
4. It marks the notifier as sending and calls the injected sink. A normal return counts as successful synchronous delivery; the counter advances once.
5. The `finally` block clears the guard after either success or failure. The successful call returns the same frozen record that the sink received.

The `orders` and `support` APIs retain different counters even though they share one sink function. Their `notify` functions are different function objects. Changing a call's receiver with `call` cannot change the retained channel because `notify` never reads `this`.

The returned API object is frozen, but the closure bindings remain mutable. Calling `notify` can still increment `delivered`; freezing the API prevents replacing its own properties, not changing everything reachable through its functions. Retaining either function also retains the state and collaborator references that function needs. The sink may hold its own much larger data structures, as the demonstration's growing `records` array does.

### Receiver Adaptation Belongs at Composition Time

The sink's original `deliver` method uses `this.records`. Passing `sink.deliver` directly would lose that receiver when the notifier calls the function. Binding it once supplies a stable adapter. An equivalent adapter is an arrow function that calls `sink.deliver(record)` through the property.

The factory does not guess which receiver a supplied function expects. It accepts a ready-to-call synchronous function. That small contract makes testing straightforward: a test supplies a recording function or a function that throws. Production code can supply a synchronous local journal or an adapter around an appropriate in-memory collaborator.

### Failure and Reentrancy Contract

| Situation | Counter and result |
| --- | --- |
| Invalid event | Throw before calling the sink; counter is unchanged. |
| Sink returns normally | Increment once and return the frozen record. |
| Sink throws | Rethrow the same error, preserve the counter, and clear the sending guard. |
| Retry after a thrown delivery | Reuse the next sequence number because the previous attempt did not advance the counter. |
| Sink calls the same notifier before returning | The nested call throws; if that error escapes the sink, the outer call also fails. |
| Sink catches a nested-call error and returns normally | The outer call succeeds and increments once. |
| Sink returns a promise | Unsupported: the factory does not await it or interpret its eventual settlement. |

The guard handles synchronous reentrancy, which is possible even on a single JavaScript thread. Without it, a sink could call the notifier again before the outer call increments the counter, and both calls could propose the same sequence number. Calling a different notifier uses that notifier's independent guard and counter.

Counter consistency is a local guarantee. A sink may record an event and then throw, as the `attempts` array demonstrates. Retrying can therefore produce duplicate external effects even though the local counter is correct. This factory has no rollback, deduplication key, durable queue, or exactly-once delivery guarantee. A normal return means the injected synchronous contract completed; it is not evidence of remote persistence.

Do not pass an `async` function or a collaborator whose success depends on a returned promise. The factory would increment as soon as that function returned the promise, before the asynchronous work finished. Supporting asynchronous delivery requires an explicit asynchronous API with defined queueing, failure, and concurrency semantics. It is a different contract, rather than a constructor detail.

The companion assertions verify callback extraction, receiver adaptation, independent channels, invalid input, thrown sink errors, sequence reuse, frozen records, reentrancy rejection, and recovery after a failed send.

## Choosing the Pattern From the Contract

| Design question | Reservation class | Notification factory |
| --- | --- | --- |
| Where does changing state live? | Private fields on each initialized instance. | Bindings retained by one factory call's functions. |
| Are public operation functions shared? | Prototype methods are shared. | Each factory call creates its own operation functions. |
| Must the call preserve a receiver? | Yes, for instance methods accessing private fields. | No, for the returned functions. |
| How is data exported? | An explicit versioned snapshot DTO. | A frozen event record passed to the sink. |
| How is a collaborator supplied? | This focused model needs none. | As a validated, synchronous function argument. |
| What does the design intentionally omit? | Persistence and authorization policy. | Durable transport, asynchronous delivery, and deduplication. |

Use a class when shared methods and initialized instance identity fit the domain contract. Use a closure factory when a small capability-oriented API and convenient callback extraction fit the call sites. Either can participate in composition: a service can hold a reservation and receive a notifier without inheriting from either component.

For plain transfer data with no behavior or evolving invariant, an ordinary object may be sufficient. Avoid adding inheritance solely to reuse two validation functions. Share focused helpers when they express the same policy, and keep construction, validation, and external effects understandable as separate operations.

The [interview questions](05-interview-perspective.md) turn these choices into concise explanations. The [performance and security section](10-performance-security.md) examines the cost and limits of private state, per-instance functions, copying, and dependency boundaries.
