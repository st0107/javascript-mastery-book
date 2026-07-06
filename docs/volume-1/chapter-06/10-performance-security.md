# Performance and Security Notes

## Performance Model

Performance in Control Flow starts with clarity. The fastest bug is still a bug. Before optimizing, identify whether the work is constant time, linear in input size, or nested across multiple collections. Then measure the actual path under realistic data.

The engine can optimize predictable code, but it cannot save unclear ownership, unbounded loops, repeated parsing, or accidental allocation in hot paths. Most JavaScript performance work begins with three questions:

1. How many times does this execute?
2. How much memory does each execution allocate?
3. Does the shape or type of the data stay stable?

## Complexity Checklist

- `if`, `else`, `switch`, and ternary expressions: identify whether the operation is constant, linear, or dependent on input size. If it allocates a new object, array, string, date, or closure, decide whether that allocation is required for correctness.
- `for`, `while`, and `do...while` loops: identify whether the operation is constant, linear, or dependent on input size. If it allocates a new object, array, string, date, or closure, decide whether that allocation is required for correctness.
- `for...of` and iterable values: identify whether the operation is constant, linear, or dependent on input size. If it allocates a new object, array, string, date, or closure, decide whether that allocation is required for correctness.
- `for...in` and enumerable property names: identify whether the operation is constant, linear, or dependent on input size. If it allocates a new object, array, string, date, or closure, decide whether that allocation is required for correctness.
- `break`, `continue`, and labels: identify whether the operation is constant, linear, or dependent on input size. If it allocates a new object, array, string, date, or closure, decide whether that allocation is required for correctness.
- Guard clauses and production control-flow design: identify whether the operation is constant, linear, or dependent on input size. If it allocates a new object, array, string, date, or closure, decide whether that allocation is required for correctness.

## Optimization Techniques

- Move loop-invariant work outside loops.
- Prefer one pass when validation, normalization, and selection can be combined cleanly.
- Avoid parsing the same value repeatedly across layers.
- Keep hot data structures shape-stable.
- Do not allocate defensive copies in inner loops unless the copy protects a real ownership boundary.
- Profile before and after changes so optimization does not become folklore.

## Browser Performance

Browser JavaScript shares the main thread with rendering, input handling, style calculation, layout, and painting. A loop that feels acceptable in Node.js can create a frozen UI in a browser tab. For large work, consider chunking, streaming, request scheduling, virtualization, or Web Workers.

The browser also makes memory leaks visible in a different way. A detached DOM node can stay alive if a closure or cache still references it. Event listeners, timers, observers, and global arrays should have clear cleanup paths.

## Node.js Performance

Node.js services can handle many concurrent operations because I/O is asynchronous, but CPU-heavy JavaScript still blocks the main event loop. A synchronous loop over a huge payload can delay unrelated HTTP requests. For expensive work, consider batching, streaming, worker threads, native services, or queue-based processing.

In server code, performance and reliability meet at backpressure. A service that parses and stores unlimited input without limits is both slow and unsafe.

## Security Model

Security for Control Flow is mostly boundary discipline. Values from users, URLs, headers, cookies, local storage, environment variables, files, databases, and third-party services are not trustworthy just because they look friendly in development.

Security-sensitive JavaScript should:

- Validate type, shape, range, and allowed values.
- Avoid dynamic code execution such as `eval` and string-built functions.
- Keep secrets out of browser-delivered code.
- Treat serialization formats as untrusted input.
- Avoid prototype pollution by rejecting dangerous keys such as `__proto__`, `constructor`, and `prototype` when merging objects.
- Log enough context for diagnosis without leaking personal data or secrets.

## Threat Examples

- A query parameter that becomes a number without validation can bypass pagination limits.
- A string that becomes HTML without escaping can create cross-site scripting.
- A JSON object merged into configuration can alter prototypes if keys are not filtered.
- A long input processed by a vulnerable regular expression can pin a CPU core.
- A default value can accidentally grant access when missing data should have failed closed.

## Professional Default

The professional default is explicitness at boundaries and simplicity in the core. Once data is parsed and validated, internal functions can stay smaller, faster, and easier to reason about. This is not ceremony. It is how large JavaScript systems remain debuggable.
