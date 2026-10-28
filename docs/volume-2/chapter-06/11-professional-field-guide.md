# Professional Field Guide

## Choose the Smallest Traversal Contract That Fits

| Requirement | Suitable starting point | Contract to make explicit |
| --- | --- | --- |
| Small finite result needed repeatedly | An owned array | Snapshot depth and mutation policy |
| Independent passes over a stable sequence | Iterable returning a fresh iterator | What remains stable between passes |
| Read the next item of an ongoing operation | Iterator or generator object | Single-consumer ownership and closing |
| Compose pull-based transformations | Generator stages | Validation timing, inspected-input limits, and cleanup propagation |
| Feed commands back into suspended work | Generator driven manually | Priming, accepted feedback, error recovery, and completion |
| Read from an owned synchronous resource | Generator with acquisition and non-yielding cleanup | Exhaustion, abandonment, and cleanup errors |
| Wait for network or stream data | An asynchronous abstraction | Async iteration, cancellation, and buffering; see Volume 3 |

Do not introduce a generator merely to replace a short array loop. It is valuable when suspended progress, deferred work, traversal composition, or resource lifetime is part of the API being expressed.

## Review 1: The Export Preview Reads One Row Too Many

The interface promises to inspect at most twenty source rows. The implementation loops over the source and checks its counter at the start of the loop body. When the counter already equals twenty, the loop has still called `next` to obtain the twenty-first value before executing that check. A logging source reveals the extra read even though the preview contains only twenty rows.

Move the stopping decision to the point after processing the final allowed value and before another pull. Handle zero before iterator acquisition. Test with an upstream read counter and a source that would throw if asked for one more item. State whether the consumer owns and closes that upstream cursor. The [exercises](06-exercises-coding-challenges.md) make a bounded-consumption contract concrete.

For a filtered source, distinguish twenty inspected source results from twenty accepted display rows. Put the budget before the expensive filter when the intent is to bound raw work.

## Review 2: Two Readers Accidentally Share Progress

A repository returns one generator object and stores it in a field named `rows`. A preview consumes the first few entries. A later exporter receives that same object and starts from its current position, or finds it completed because the preview's loop closed it.

Decide whether the repository exposes a single-use stream or a repeatable collection. For a repeatable API, a method such as `iterateRows()` should obtain a fresh traversal. If it reads a changing data source, fresh traversal still does not guarantee identical data; a separate snapshot or transaction policy would be required. For a single-use API, make ownership visible and avoid handing the cursor to unrelated consumers.

Tests should interleave two cursors and assert whether their progress is independent. Reusing the same generator function is safe for creating separate execution states; reusing the same generator object shares one state.

## Review 3: Cleanup Lives in a Generator That Never Started

An ordinary factory opens a cursor and returns a generator that will close it in `finally`. The caller cancels before the first `next`, then calls `return`. The generator body has never entered its `try` block, so that cleanup never runs.

Place acquisition inside the body and place all resource-dependent work inside its cleanup boundary, as in the [managed cursor example](04-production-examples.md). Alternatively, expose an explicit owner object with disposal independent of whether iteration starts. Do not rely on garbage collection to close a resource promptly.

Also test the started-but-abandoned case. A consumer manually calling `next` owns the responsibility to close when it stops. A loop's automatic early-exit behavior does not run when code simply retains a cursor and walks away.

## Review 4: The Batch Container Is Fresh but the Rows Keep Changing

A generator yields a new array for each batch, but each array contains the same mutable row object reused by a parser. After another pull, previously displayed rows all show the last parsed value. Container identity was tested; record identity and value lifetime were not.

Choose between borrowed buffers valid only until the next pull and detached values safe to retain. For a public export or UI preview, a small primitive record copy is often easier to consume correctly. State whether nested fields are shared, copied, or excluded. The [ownership failure example](09-edge-cases-debugging.md) demonstrates why array spread alone does not solve this problem.

## Acceptance Checklist

Before approving an iteration API, a reviewer should be able to answer:

- Which object represents the sequence and which object represents current progress?
- Can traversal restart, and are simultaneous cursors independent?
- What is validated at API creation, first resume, and each subsequent item?
- What limits bound inspected inputs, emitted results, retained bytes, and work per pull?
- Which values are detached, immutable, live, or borrowed?
- Does early exit close an owned cursor without reading an extra item?
- Does the producer clean up when its own read operation fails?
- What happens if cleanup also fails, or if the generator was never started?
- Can callbacks reenter the same generator or mutate its source?
- Does the implementation require newer helper APIs beyond the documented runtime baseline?

## Operational Evidence

Prefer counters for opened and closed cursors, inspected rows, emitted batches, and failed validations. Keep sensitive record contents out of default diagnostic logs. Assert lifecycle properties with a deterministic in-memory source before introducing an external service or real file handles.

For performance claims, record the consumer's behavior: all rows consumed, first match, fixed preview, or early cancellation. Those are different workloads. Measure the complete pipeline with its actual validation and copying; removing the ownership work from a benchmark would change the API being measured.

## Ready for the Next Chapter

You are ready to continue when you can implement a fresh traversal, explain a manually stepped generator, and account for its source references and cleanup on every supported exit. **Functional Programming in JavaScript** will use that foundation to reason about transformations, effects, and composition without hiding their costs or state.
