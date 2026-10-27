# Edge Cases, Debugging, and Failure Modes

## A Freeze Can Succeed Without Freezing the State You Meant

Freezing a Map's ordinary own properties does not freeze its entries. Freezing an instance does not freeze its private elements. For typed arrays, a nonempty integer-indexed view introduces another restriction: `Object.freeze(new Uint8Array(1))` throws. A zero-length typed array can be frozen. Do not turn these differences into a universal recursive-freeze utility without a supported-type policy. [Freeze limitations](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze).

```js
'use strict';
const cache = Object.freeze(new Map());
cache.set('job', 'ready');
console.log(Object.isFrozen(cache), cache.get('job'));
try {
  Object.freeze(new Uint8Array(1));
} catch (error) {
  console.log(error.name);
}
console.log(Object.isFrozen(Object.freeze(new Uint8Array(0))));
// Expected output:
// true ready
// TypeError
// true
```

An exception from an integrity operation is not a general transaction boundary. The operation may already have made some changes. Validate the accepted representation before performing a sequence of irreversible restrictions, or construct a fresh owned representation instead.

## An Empty Handler Is Not Transparent for Internal State

```js
'use strict';
const wrappedMap = new Proxy(new Map(), {});
class Counter {
  #value = 0;
  increment() { return ++this.#value; }
}
const wrappedCounter = new Proxy(new Counter(), {});
for (const operation of [() => wrappedMap.size, () => wrappedMap.set('a', 1),
  () => wrappedCounter.increment()]) {
  try { operation(); } catch (error) { console.log(error.name); }
}
// Expected output:
// TypeError
// TypeError
// TypeError
```

The proxy is a different object. A Map accessor or method expects Map's internal state on its receiver; a private field access expects the appropriate private element. The proxy does not acquire those by delegating ordinary property lookup. Binding methods to the target can repair selected calls but changes receiver semantics, method identity, and potentially what gets returned. A method that returns `this` can expose the target. A bound function created on every read also has a new identity each time. Choose a narrow adapter when those consequences are unwelcome. [Proxy forwarding limitations](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy#no_private_field_forwarding).

## A Successful Trap Return Does Not Prove Mutation

```js
'use strict';
const target = { count: 1 };
const view = new Proxy(target, { set() { return true; } });
view.count = 2;
console.log(view.count, target.count);
Object.freeze(target);
try {
  view.count = 2;
} catch (error) {
  console.log(error.name);
}
// Expected output:
// 1 1
// TypeError
```

Before freezing, the handler can report success without storing the value. After freezing, the same report contradicts the locked target value and throws. An invariant check is not an application guarantee that the operation did useful work. Test state as well as returned status. [Set invariants](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/Proxy/set).

## A Partial Guard Leaves Other Mutation Routes Open

```js
'use strict';
const target = { state: 'queued' };
const incomplete = new Proxy(target, { set() { return false; } });
console.log(Reflect.set(incomplete, 'state', 'running'));
Object.defineProperty(incomplete, 'state', { value: 'done' });
console.log(target.state);
console.log(Reflect.deleteProperty(incomplete, 'state'));
console.log(Object.hasOwn(target, 'state'));
// Expected output:
// false
// done
// true
// false
```

The missing definition and deletion traps forward to the target. Similarly, a nested object returned by a read can be mutated directly. “Read-only proxy” is an incomplete specification until the target types, exposed values, mutation operations, and surviving aliases are defined. Compare the scalar-only [progress view](04-production-examples.md).

## SameValue Has Two Useful Surprises

```js
'use strict';
const record = {};
Object.defineProperty(record, 'missing', { value: NaN });
Object.defineProperty(record, 'zero', { value: 0 });
console.log(Reflect.defineProperty(record, 'missing', { value: NaN }));
console.log(Reflect.defineProperty(record, 'zero', { value: -0 }));
console.log(Object.is(record.zero, 0));
// Expected output:
// true
// false
// true
```

Redefining locked data uses SameValue, not ordinary strict equality. Explain that rule before treating a successful redefinition as evidence that a property was writable. [Object.is](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is) exposes the corresponding comparison behavior for values.

## A Repeatable Debugging Procedure

1. Identify whether the operation addresses the target, proxy, child, or an escaped nested value.
2. Record the own descriptor and extensibility state of the relevant target.
3. Separate assignment, definition, deletion, enumeration, and method invocation.
4. Trace the receiver through accessors and forwarded Reflect calls.
5. Check trap return type, target invariants, and strict-mode behavior.
6. Record state before and after failure; do not assume rollback.
7. Reduce the example to ordinary records before introducing Map, typed arrays, private fields, or multiple proxies.

The companion `code/volume-2/chapter-05/example-04-edge-cases.js` asserts shallow ownership, accessor effects, private-state and Map behavior, typed-array freezing, invariants, set-to-define forwarding, and descriptor-copy behavior. Avoid debugging by recursively logging arbitrary objects inside a trap: formatting can itself trigger more observable work.
