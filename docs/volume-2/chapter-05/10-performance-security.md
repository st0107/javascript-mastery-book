# Performance and Security Notes

## Count the Whole Operation

A descriptor lookup for one ordinary property is different from enumerating every own key, reconstructing a record, or traversing a graph. Use costs that match the accepted representation:

| Operation | Useful cost model and limitation |
| --- | --- |
| Fixed-schema primitive validation | Constant work after bounded input is available |
| Enumerating or copying `k` ordinary own properties | `O(k)` time and temporary/output space |
| Traversing a supported graph with `v` objects and `e` edges | `O(v + e)` traversal with visited-state bookkeeping, plus actual property work |
| One proxy trap | Handler cost plus all forwarded operations and invariant checks; may invoke arbitrary user code |
| Retaining a log of `r` reads | `O(r)` retained space, even if each append is inexpensive |

These are source-level models, not universal complexity guarantees for arbitrary proxies or exotic objects. A getter can perform I/O through a host API, allocate large data, or run another traversal. A handler can make a single apparent property read expensive. Input bounds need to apply before the expensive work, not only to the accepted result.

## Avoid Accidental Allocation in Hot Paths

Creating a wrapper per read, binding a method on every lookup, or copying an entire configuration inside a tight loop adds allocation and changes identity behavior. Create stable adapters at a clear boundary and reuse them where their lifecycle permits. Do not cache indefinitely merely to keep identities stable; the cache itself becomes a retaining path.

Freezing is a contract decision. It is not an instruction requiring an engine to optimize an object, and a proxy is not guaranteed to have a fixed slowdown factor. Compare warmed, representative workloads on the supported runtime, retain the same correctness checks, and include allocation and garbage-collection effects in the measurement. [V8 fast properties](https://v8.dev/blog/fast-properties) provides implementation context rather than a performance promise for every JavaScript engine.

## Bound Diagnostics

```js
'use strict';
const events = [];
const target = { state: 'ready', progress: 25 };
const view = new Proxy(target, {
  get(object, key, receiver) {
    if (events.length < 2) events.push(String(key));
    return Reflect.get(object, key, receiver);
  }
});
void view.state;
void view.progress;
void view.state;
console.log(events.join(','));
console.log(events.length);
// Expected output:
// state,progress
// 2
```

This example deliberately stops recording after two reads; it does not pretend to be a complete audit trail. A production logger should define sampling, redaction, retention, and overflow behavior. Logging whole values can expose secrets or retain large graphs. Formatting a proxy from within its trap can also create re-entrant work.

## Reflection Is Not a Trust Boundary

Descriptor inspection avoids ordinary property getters, but a proxy can execute `ownKeys`, `getOwnPropertyDescriptor`, or `getPrototypeOf` traps during the inspection. A prototype check does not prove that an object is not a proxy. Do not accept arbitrary same-process objects from untrusted executable code and assume reflection makes them passive.

For data crossing an external boundary, bound and parse its serialized representation, validate a schema, and create owned output values. The [configuration example](04-production-examples.md) documents trusted ordinary-record inputs because it is teaching ownership after that boundary. It rejects unexpected fields and builds null-prototype output records; it does not claim to contain arbitrary attacker-controlled code.

## Hiding Keys Is Not Protecting Secrets

Non-enumerable properties are discoverable through `Object.getOwnPropertyNames`. Symbol properties are discoverable through `Object.getOwnPropertySymbols` and `Reflect.ownKeys`. Proxy key filtering can leave direct reads, `in`, descriptor inspection, or a target alias available. Keep secrets in a representation that the caller does not receive, and authorize operations separately.

A proxy's invariants enforce consistency with its target, not business authorization. A frozen object prevents particular mutations, not all harmful uses of the values it contains. Never describe either mechanism as a security sandbox. [Property enumerability and ownership](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Enumerability_and_ownership_of_properties).

## Publication and Lifecycle Rules

Build and validate a fresh object before exposing it when partial initialization would be harmful. A sequence of descriptor definitions can fail after earlier changes have succeeded. Freezing caller-owned objects can also surprise other consumers holding aliases. Owned snapshots avoid that specific interference.

Revocation disables a particular forwarding object. It cannot retract an already returned token, object, or function, nor reverse a side effect. Prefer primitive-only views when that is enough, document owner capabilities, and test the state before and after release. Independent capabilities require independent lifecycle decisions.
