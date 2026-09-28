# Performance and Security Notes

## Count Work Inside the Boundary

A function call does not make an algorithm constant time. The batch planner performs bounded arithmetic and returns a fixed-size record. The label builder validates n IDs, stores a snapshot, calls the formatter n times, and retains the resulting strings. Its cost includes the formatter's work and output lengths.

Avoid repeated string parsing or invariant computation inside a callback when the caller could do it once. Preserve correctness: moving a call changes behavior if that call reads changing state or has effects. Measure an equivalent workload before treating the change as an optimization.

## Function Identity and Retention

Calling one function repeatedly differs from creating many functions. A function expression evaluated for each record can create distinct identities; a stored callback can retain objects it needs. An event registry holding a callback can therefore prolong the lifetime of captured data.

Prefer clear lifetimes and stable callback identity when registration/removal requires it. Do not infer physical storage from the memory diagram or assume every conceptual call creates a fixed number of heap objects. Engine optimizations must preserve behavior but can change representation.

## Stack and Argument Limits

Bound recursive depth when processing external structures. An iterative traversal can remove unnecessary call depth, but it still needs a limit on total work. Similarly, avoid spreading an arbitrarily large array into a function call. Iteration handles large collections without relying on a portable maximum argument count.

## Validate at the Public Boundary

Specify types, ranges, maximum input sizes, ownership, and errors. `typeof callback === 'function'` establishes callability for ordinary application values; it does not prove the callback is pure, safe, synchronous, or inexpensive. Validate returned values when the caller relies on a narrower contract.

A callback can read application state, mutate objects, or throw after an effect. Inject only trusted application behavior. Do not compile user text with eval or Function to make it callable. For user-selected behavior, map an allowlisted name to an existing operation and validate that operation's data inputs.

## Preserve the Return and Error Contract

An adapter that logs an error and returns undefined changes the caller's observable behavior. A wrapper around a synchronous function must not secretly introduce promises. State whether errors propagate, are translated, or become explicit result values; use the error-handling chapter to implement that decision.

Avoid logging full arguments when they can contain credentials or personal data. Prefer a field name, error category, and safe identifier. Test invalid data without storing sensitive values in permanent fixtures.

## Measurement Checklist

Measure creation separately from repeated calls, keep console output outside timed regions, and record runtime and input sizes. Compare results and error behavior first. Inspect retained data if memory is the concern. A microbenchmark of arithmetic-only arrows cannot answer whether a real formatting callback allocates too much output.
