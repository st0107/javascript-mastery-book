# Performance and Security

## Measure the Work at the Correct Layer

A constant-sized amount check is unlikely to explain a slow network checkout. Separate validation time, serialization time, host I/O, and downstream latency. Logging inside a benchmark can dominate the operation being measured. Warm-up, runtime version, input distribution, and the observation method also affect measurements.

A calculation that loops over `n` cart rows performs work proportional to `n`; moving it into a helper function does not remove that work. Repeating a full calculation after every row can turn a linear task into quadratic work. Establish an algorithmic cost before investigating engine tiers.

## Main-Thread Work Remains Work

A long synchronous loop occupies its executing thread. Browser page rendering and Node callbacks can be delayed while that thread remains busy. A timer schedules later work; it does not automatically move a CPU-heavy calculation onto another thread. Consider bounded input, incremental processing, or workers when measurements justify them. Scheduling is developed in the asynchronous volume.

## Do Not Treat a Runtime Label as Authority

The presence of `process`, `window`, or `fetch` proves neither the caller's identity nor permission to write a destination. Authorization belongs to the service or resource owner. Test the actual operation and handle its documented failure. Restrict a supplied adapter to the operations the calculation needs instead of passing an entire application container.

## Parse Data as Data

Text received from an API is input to a documented parser and validator. Do not use `eval` or a constructed function to interpret a price, feature flag, or configuration value. Code execution is a much larger capability than data parsing. Parsed data still needs domain checks: a JSON number can be negative, fractional, or already rounded beyond the safe-integer range.

## Shared Validation Does Not Eliminate Server Validation

A browser user can bypass application code and submit a request directly. The server must enforce the type, amount bounds, cart ownership, and authoritative product price. Do not log complete payment payloads just to diagnose a failed type check; record the field name, error class, request identifier, and an appropriate redacted description.

## Review Criteria

Accept a change when its allowed representations and failure behavior are explicit, its expensive work is bounded, and its effect dependencies are testable. Reject an optimization justified solely by "JavaScript is interpreted" or an authorization decision justified by "the client already checked it." Both claims skip the layer that determines the outcome.
