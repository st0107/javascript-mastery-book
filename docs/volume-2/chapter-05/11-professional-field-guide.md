# Professional Field Guide

## Choose the Smallest Boundary That Meets the Contract

| Requirement | Starting design | Review question |
| --- | --- | --- |
| Identity field must not change | Explicit data descriptor | Must the rest of the record remain mutable? |
| Worker needs stable configuration | Validate, copy supported fields, freeze owned containers | Are any mutable input aliases retained? |
| API methods update controlled state | Class or closure with explicit methods | Does every operation preserve the invariant? |
| Observe generic property reads | Narrow proxy with Reflect forwarding | Which receivers and target types are supported? |
| End property-based access later | Private target and revocable view | Which previously returned values can survive? |
| Omit fields from a report | Construct a projected record | Is an enumeration filter being mistaken for secrecy? |

A proxy is justified by a generic operation protocol, not by the mere presence of validation. If the only write is `setProgress(next)`, a named method often makes validation, failure, and lifecycle behavior clearer than intercepting arbitrary property assignment.

## Review Walkthrough: A Misleading Read-Only Wrapper

A proposed wrapper traps only `set`, returns false, and is named `readOnly`. Its target contains `items`, an array. A reviewer should ask for the precise promise before approving it. Direct property definition and deletion still forward; reading `items` exposes the original array; another owner may retain the raw target. Renaming the wrapper does not fix these routes.

For a stable report, create a detached representation and restrict that supported graph. For a live scalar progress display, the [revocable view](04-production-examples.md) keeps the target private and rejects all supported mutation routes. For arbitrary objects with methods, nested values, built-in state, or private fields, a complete mediation design is much larger. Do not silently expand the small example's claims to that problem.

## Review Walkthrough: A Getter Runs During Copying

A developer writes `{ ...input }` expecting to preserve a computed property. The getter runs once, and the result becomes a writable data property. Later changes to the source no longer recompute that result. If the getter reads mutable external state, the copy's timing also matters.

Decide whether the desired product is a computed interface, a snapshot of values, or a shallow descriptor-preserving reconstruction. Each has a different answer about accessor execution, referenced identities, and future changes. Descriptor copying also preserves the original accessor functions and their closed-over state, so it is not automatically independent.

## Review Walkthrough: Key Filtering Breaks After Seal

A diagnostic proxy omits `_cache` from its own-key list. Later, a lifecycle step seals the target. Now `_cache` is non-configurable and the target is non-extensible, so omitting it violates `ownKeys` invariants. A previously passing test did not cover the full lifecycle.

Keep the key set honest when the target's restrictions require it, or use a separate reporting object whose actual keys match the intended report. Add assertions before and after integrity transitions. Do not catch the TypeError and treat an empty report as a valid result.

## A Practical Completion Checklist

1. Write the input schema, supported object kinds, and ownership of every container.
2. List observable reads, writes, definitions, deletions, enumeration, and lifecycle operations.
3. For each operation, define success, false rejection, and thrown failure separately.
4. Record the intended receiver and whether methods depend on internal or private state.
5. Test non-configurable descriptors, non-extensibility, repeated release, and escaped values.
6. Verify that invalid inputs do not partially update supported state.
7. Measure realistic workloads after preserving the required semantics.

The checklist is complete only when the code and prose agree. “Frozen,” “private,” and “read-only” should each name a concrete guarantee at a concrete boundary.

## Further Reading and Next Step

Review [ValidateAndApplyPropertyDescriptor](https://tc39.es/ecma262/multipage/ordinary-and-exotic-objects-behaviours.html#sec-validateandapplypropertydescriptor) when reasoning about one-way descriptor transitions. Use the [Proxy handler reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/Proxy) to check each trap's invariants instead of extrapolating from `get` to every operation.

Continue with **Iterators and Generators**, the next planned chapter. The same discipline applies there: identify the protocol operations, the state they retain, their completion behavior, and what happens when a consumer stops early.
