# Performance and Security Notes

## Compare Equivalent Creation Contracts

A class instance, a closure-backed factory result, and a plain record can all be good representations. Their syntax alone does not establish a speed ranking. Compare the same validation, copying, callback behavior, and lifetime before attributing a difference to the creation pattern.

Separate the work into definition, construction, repeated operations, and cleanup. Evaluating a class inside a repeatedly called factory creates a new class and prototype for each evaluation. Defining the class once and constructing many instances is a different allocation pattern. That distinction matters when measuring either design.

| Representation | Ownership and cost to investigate |
| --- | --- |
| Public fields with shared prototype methods | Per-instance ordinary properties and shared method functions; callers may directly mutate state. |
| Private fields with shared methods | Per-instance private state and receiver checks; ordinary key enumeration does not expose the private elements. |
| Closure factory returning operations | Per-invocation bindings and returned function identities; callbacks can use lexical state without an instance receiver. |
| Arrow fields or constructor-bound callbacks | Separate callable identities for each initialized instance, with retained instance context. |
| Plain data records | Explicit values suited to serialization; validation and behavior must be provided elsewhere. |

For `n` instances sharing `m` method functions, there are `m` shared method identities plus instance state. Creating `m` fresh closures per instance can create `O(nm)` function identities. These are counts, not byte estimates or guarantees about every optimization. A callback that retains a large document can matter more than the small function object itself.

Likewise, making a defensive copy of `k` flat entries adds work and storage proportional to those copied entries in a straightforward implementation. Skipping the copy may be faster while exposing state the API promised to protect; that is a different behavior, not an equivalent optimization.

## Engine Techniques Can Change

V8's class-field implementation has evolved to optimize instance initialization, including specialized inline-cache support for field definitions. Its [class initialization article](https://v8.dev/blog/faster-class-features) describes implementation work and the semantic distinction between public field definition and ordinary assignment.

That history is evidence against treating a benchmark from one engine release as a permanent language rule. It does not imply a current universal ordering among public fields, private fields, and closures. Record the runtime version and measure representative construction counts, method calls, data sizes, and disposal patterns.

Use the language model to explain required behavior. Use profiling to investigate whether initialization, validation, copying, or target work is the actual cost. Do not replace private fields with public state solely because an old benchmark claimed that privacy was expensive.

## A Measurement Procedure

1. Write the behavior contract first: accepted inputs, copied data, callable receiver, return values, and cleanup. Assert that each candidate implements it before measuring.
2. Choose realistic instance counts and payload sizes. Define whether the workload retains instances for later use or creates short-lived objects; those lifetimes can produce different results.
3. Measure construction separately from repeated operations on already-created instances. Keep console output and fixture preparation outside the measured region, and consume results so the measurement represents useful work.
4. Run multiple samples in the target runtime. Record its version, distinguish startup from warmed execution, and inspect variation instead of selecting the fastest sample.
5. Inspect retained objects and allocation activity when memory is the concern. Account for copied payloads, stored callbacks, and caches as well as the representation of each instance.
6. Recheck the full application path. Keep a change only if it improves the relevant workload while preserving its behavior and ownership guarantees.

A tight loop that immediately discards every result cannot answer how a long-lived service behaves when callbacks and caches retain its instances. Use the measurement to investigate a stated workload, and keep the conclusion limited to that workload.

## Privacy Does Not Establish Ownership or Immutability

A private field prevents ordinary external property access to that element. It does not clone the value assigned to it, freeze a referenced object, or stop the class from returning that object. A closure has the same ownership question: a private binding can still contain an externally shared reference.

If a constructor stores a caller-supplied array, decide whether later caller mutation should be observable. If a method returns internal data, decide whether it returns a live view, a snapshot, or a deliberately shared mutable object. A shallow copy separates the outer container while leaving nested references shared.

Freezing the public object surface does not freeze private elements:

```js
'use strict';

class Counter {
  #value = 0;
  increment() { this.#value += 1; return this.#value; }
}

const counter = Object.freeze(new Counter());
console.log(Object.isFrozen(counter));
console.log(counter.increment());
console.log(Reflect.ownKeys(counter).length);

// Expected output:
// true
// 1
// 0
```

`Object.freeze` constrains ordinary own properties and extensibility. Private fields are separate elements, so class methods can still update them. [MDN's private-element reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_elements) describes this distinction. If the API promises an immutable domain value, enforce that promise in its operations and in how it exposes referenced data. The next chapter develops descriptors and freezing in more detail.

## Validate Data Before Establishing Domain State

A constructor or factory is a useful validation boundary when all supported creation paths pass through it. Validate required own fields, reject or deliberately ignore unsupported fields, normalize only according to the domain contract, and establish state only after the relevant checks succeed.

Avoid mass assignment such as `Object.assign(this, input)` for arbitrary external records. Even when it cannot write private elements, it can replace public methods with own properties, reach setters, or change ordinary lookup behavior through special keys on a suitable target. An input property named `'#balance'` remains an ordinary string key; it neither accesses nor safely validates the class's `#balance` element.

A data-transfer object should have an explicit schema. Rehydration should validate that schema and call the intended creation operation. Setting a parsed object's prototype to a class prototype does not initialize private state or prove that domain invariants hold. Likewise, spreading an instance copies selected ordinary own values; it does not recreate the class's methods and private state.

Treat validation as both structural and semantic: a number can be finite yet outside an allowed range, and two individually valid fields can describe an invalid transition. OWASP's [Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html) explains this distinction and the value of allowlisted input structure.

## Private State Is Not an Authorization System

A method with access to a private field may still expose a powerful operation to any holder of the instance. Check whether the consumer should have that capability and validate the operation's inputs. A valid private receiver says nothing about the user's right to act on a particular account or record.

Keep authorization at the protected resource boundary. A browser user's runtime is not a trusted secret store just because the code uses private syntax or closures. Do not place server credentials in client code and expect a creation pattern to protect them.

Narrow interfaces can help cooperating application components: return only the operations they need, and avoid exposing privileged collaborators unnecessarily. This is an API design technique, not a sandbox for untrusted code executing in the same environment.

## Construction Failure Needs a Lifetime Policy

A thrown constructor prevents the caller from receiving a normal result, but does not roll back effects already performed. If the constructor registered a listener, wrote to a registry, or handed `this` to another object, those effects can survive the failure.

Keep ordinary construction focused on local validation and state where possible. Let an explicit factory own multi-step resource acquisition, return only after successful preparation, and release resources acquired before a later failure. If preparation is asynchronous, make the factory's promise and failure behavior visible in its API.

Shared static caches need an ownership and eviction policy too. A static collection retained by a reachable class can keep all of its values alive. Changing that collection from a public field to a private field does not change the retention problem.

## Best Practices

- Compare complete contracts, including validation and copying, before drawing performance conclusions.
- Count long-lived instances, callbacks, and cached values alongside function identities.
- Define whether constructors take ownership, copy inputs, or intentionally retain live references.
- Serialize an explicit data schema and validate it before reconstruction.
- Keep receiver validity, domain validation, and authorization as separate checks.
- Give failed initialization and resource cleanup an explicit owner.
