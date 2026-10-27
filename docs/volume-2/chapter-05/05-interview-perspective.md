# Interview Perspective

## Beginner: Explain the Descriptor Before Predicting the Write

**Question:** Which operation succeeds, and why?

```js
'use strict';
const record = {};
Object.defineProperty(record, 'id', { value: 7 });
console.log(Reflect.set(record, 'id', 8));
console.log(Reflect.defineProperty(record, 'id', { value: 7 }));
try {
  record.id = 8;
} catch (error) {
  console.log(error.name);
}
console.log(record.id);
// Expected output:
// false
// true
// TypeError
// 7
```

**Answer:** A new defined property defaults to non-writable, non-enumerable, and non-configurable. `Reflect.set` reports rejection as false. Redefining the same value is compatible, so that definition returns true. Strict assignment to a different value throws. Explain why the second operation is permitted; “a locked property rejects everything” is too broad.

**Follow-up:** Could the value still change if `writable` initially were true and `configurable` false? Yes. Non-configurability alone does not prohibit value updates to a writable data property. Making it non-writable later is a one-way transition.

## Intermediate: A Frozen Object with Changing Behavior

**Question:** Is this object immutable?

```js
'use strict';
let count = 0;
const counter = Object.freeze({
  get current() { return count; },
  increment() { count += 1; }
});
counter.increment();
console.log(Object.isFrozen(counter), counter.current);
console.log(Object.getOwnPropertyDescriptor(counter, 'increment').writable);
// Expected output:
// true 1
// false
```

**Answer:** Its own property surface is frozen, but invoking the stored function changes a captured binding. Freezing the property holding that function does not freeze the function's effects. Name the representation and operation you mean by “immutable”: this is a fixed interface around mutable closure state, not a stable value snapshot.

**Follow-up:** How would you deliver a stable report? Return an owned record of the relevant primitive values. If the result includes nested containers, define how they are copied and restricted. Do not label a shallow freeze a deep snapshot.

## Senior: Preserve the Receiver

**Question:** Why are these forwarding handlers observably different?

```js
'use strict';
const target = { name: 'target', get label() { return this.name; } };
const correct = new Proxy(target, {
  get(object, key, receiver) { return Reflect.get(object, key, receiver); }
});
const changed = new Proxy(target, {
  get(object, key) { return object[key]; }
});
const receiver = { name: 'caller' };
console.log(Reflect.get(correct, 'label', receiver));
console.log(Reflect.get(changed, 'label', receiver));
// Expected output:
// caller
// target
```

**Answer:** The accessor's `this` comes from the receiver. The first handler forwards it; the second performs a new read with the target as receiver. A proxy can participate in an inherited lookup as well as a direct property access, so always reason about the receiver separately from the target. [Reflect.get](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflect/get).

**Follow-up:** Does preserving the receiver make the wrapper transparent for private fields and Map methods? No. Those operations can require state associated with a particular object identity. A proxy is a different receiver. Binding methods to the target is a separate policy with its own identity, caching, and escape consequences.

## Senior: Explain an Invariant Failure

**Question:** A proxy filters underscore-prefixed keys. It works until the owner calls `Object.preventExtensions(target)`. Why?

**Answer:** For a non-extensible target, the `ownKeys` result must contain exactly the target's own keys. Even a configurable key cannot be omitted then. A non-configurable key cannot be omitted even while the target is extensible. Key filtering must respect current descriptors and extensibility, or the operation throws `TypeError`. Enumeration hiding also does not block direct reads, `in`, or descriptor inspection. [ownKeys invariants](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/Proxy/ownKeys).

**Follow-up:** Should the trap catch the error and return an empty list? That would repeat the invariant violation. Change the policy or use a separate projected record with only the fields you intend to publish.

## Design Question: A Configuration Snapshot for a Worker

**Question:** The caller should be free to reuse its input object. The worker must see fixed configuration values. What boundary would you build?

**Worked answer:** First define a finite schema and accepted value types. Read and validate the required values, construct new containers, and freeze the supported output graph. Keep caller-owned containers out of that graph. Reject unsupported object shapes or normalize them at the input boundary. For arbitrary remote input, parse bounded serialized data rather than invoking unknown JavaScript accessors or proxies. Decide how the worker receives the data and validates the same contract after transport.

The [owned-configuration example](04-production-examples.md) demonstrates a two-level schema. Its approach is easier to defend than a recursive helper that silently treats Map entries, dates, private fields, and accessor effects as ordinary writable properties.

## Design Question: Read Access That Can End

**Question:** Observers need progress reads while a job is active. After release, further reads through the view should fail. What does revocation guarantee?

**Worked answer:** Keep the target private, restrict the exposed fields to primitives, and return a revocable view. Give the owner separate validated operations and a release method. Deny all relevant mutation operations through the view, not only `set`. Revocation ends future forwarded operations through that proxy. It cannot retract already copied values or revoke independent aliases. A shallow wrapper over an arbitrary nested object would not meet the same contract.

## A Strong Answer Checklist

- Name the object identity, operation, key, descriptor kind, and receiver.
- Separate false return values from thrown errors and explain strict mode.
- Trace the successful path before discussing performance.
- Identify aliases and every route through which mutable state can escape.
- State which target types and lifecycle transitions the design supports.
- Explain an invariant with an actual descriptor or key set, not a slogan.

Use the [execution traces](03-internal-working.md) to practice these explanations aloud. The best answer connects a visible result to an operation and then to a design consequence.
