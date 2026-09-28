# Errors and Debugging: Performance and Security

## Match the Mechanism to the Contract

Do not throw thousands of exceptions merely to implement ordinary filtering when a boolean or tagged result expresses the expected alternative. Error construction and diagnostics add work, and frequent throwing can behave differently from normal completion.

Avoid the opposite folklore that a try block always makes code slow. Measure the complete workload after correctness is established. Parsing, allocation, validation, and logging often dominate.

## Protect a Small Region

A broad catch around unrelated work can turn a programming defect into a misleading user-input error. Catch only failures the boundary understands. Preserve identity when rethrowing, or add useful context with cause.

Do not report success after an authorization failure or broken invariant. Callers need to distinguish fulfilled contracts from rejected operations.

## Bound Parsing and Retention

The parser checks text length before JSON.parse and validates the decoded schema before producing an explicit projection. A string-length cap does not control the earlier allocation of a request body; its reader needs a separate byte limit.

Retaining an Error retains its cause and objects reachable from that cause. Attach small identifiers and selected metadata rather than entire requests, buffers, or credentials.

## Keep Diagnostics From Leaking Data

Errors can expose paths, internal identifiers, raw payloads, or dependency details. Map expected public failures to safe messages and stable codes. Keep detailed diagnostics at an appropriate internal boundary.

Do not serialize arbitrary thrown values into responses. Some are not serializable, and custom serialization can execute code. Use a bounded response schema.

## Cleanup Is Not a Transaction

Releasing a resource does not undo a payment, file write, or database update. Define side-effect ordering and transaction guarantees separately.

If release can fail, preserve the operation failure according to policy. The synchronous resource helper deliberately aggregates both failures; it does not promise asynchronous lifetime management.

## Debugging and Logging Costs

Breakpoints and detailed object inspection belong in a controlled development workflow. Remove accidental debugger statements from production paths. Avoid logging a secret merely to reproduce a type mismatch.

Repeatedly logging and rethrowing at every layer multiplies noise. Report once at the boundary that has the context to decide what to do, preserving the cause chain for diagnosis.

