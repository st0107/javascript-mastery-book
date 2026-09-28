# Control Flow: Performance and Security

## Count Work, Then Measure

A single scan is O(n) in visited entries. Creating one result object per accepted entry adds O(k) output space. A nested scan over every pair may be O(n squared); an early break reduces some executions but leaves the worst case unchanged.

Prefer an algorithmic reduction before a syntax micro-optimization. Searching repeatedly through the same large list may justify an index or Set, taught in the collections chapter. Replacing for with while alone does not change the amount of work.

## Bound Synchronous Processing

A finite array can still be too large to process responsively in one synchronous call. Put explicit limits at input boundaries. The job example accepts at most 10,000 records, making its operational expectation visible.

A while loop that waits for an external signal without yielding cannot let queued JavaScript callbacks run in the same thread. Real cancellation and scheduling require cooperation with the host and asynchronous design. The synchronous example therefore makes no claim of live shutdown handling.

## Preserve Validation Order

Validate a record before using its fields for a decision. An inherited property or unexpected type should not silently satisfy an authorization or transition rule. The examples require own modeled fields and exact booleans or strings.

These checks are written for ordinary data records. Arbitrary objects can contain getters or proxies whose property access executes code. Decode and validate untrusted serialized input into your accepted data model; a series of field reads is not a sandbox.

## Make Resource Growth Visible

A loop can grow its own input, append unbounded output, or create repeated temporary copies. Identify the retained structures in a review. Do not assume that an early-exit branch bounds output unless every path enforces that limit.

For a queue that intentionally grows, define both a work budget and what happens to unprocessed items. A cap that silently discards remaining work changes the business contract.

## Avoid Timing-Based Correctness

The result of a branch should depend on validated state, not a guessed machine speed. Retry and timeout policies need explicit budgets, clocks, and failure semantics; a large busy loop is not a delay primitive.

Benchmark representative accepted and rejected inputs. Keep logging out of a hot loop when it dominates runtime, but preserve useful aggregate counts or diagnostics at the surrounding boundary.

## Security Is in the Policy

A branch can correctly execute the wrong policy. Test combinations: paid and shipped states, fatal and cancelled flags, a missing required ID, and an inherited field. A single happy path does not establish that an access or workflow check is sound.

Unknown transitions should have a deliberate default. The dispatcher rejects them so they cannot silently advance or overwrite state.
