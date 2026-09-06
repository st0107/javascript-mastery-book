# Performance and Security Notes

## Separate Language Semantics From Engine Storage

The specification models a function's relationship to its creation environment through `[[Environment]]`. Environment Records explain binding lookup; they do not require engines to allocate one literal heap object for each box in a teaching diagram. The implementation must preserve observable behavior, while its allocation and optimization choices may vary. See the ECMAScript sections on [function objects](https://tc39.es/ecma262/multipage/ordinary-and-exotic-objects-behaviours.html#sec-ecmascript-function-objects) and [Environment Records](https://tc39.es/ecma262/multipage/executable-code-and-execution-contexts.html#sec-environment-records).

Consequently, neither “every closure copies all outer variables” nor “every local stays allocated until the last closure dies” is a reliable performance model. Source code tells you which relationships the program needs; measurements show how a particular runtime represents and retains them.

For a practical review, count factory calls, long-lived returned functions, active registrations, and the size of reachable application data. Those quantities usually lead to a clearer investigation than assuming a fixed number of bytes per closure.

## The Cost of the Chapter's Designs

| Operation | Work and storage to account for |
| --- | --- |
| Create a request logger | Validate bounded strings and create one returned function. Its required context includes metadata and the sink. |
| Emit one record | Validate the bounded event name, construct a fixed-size record, then pay the sink's cost. |
| Read the store | Constant-time return of the current value; no copy is made. |
| Update to an `Object.is`-equal value | Constant-time comparison and return, with no notification snapshot. |
| Update a changed value with `s` listeners | `O(s)` bookkeeping time and temporary storage, plus listener execution time and any data they allocate. |
| Maintain subscriptions | `O(s)` registry entries, plus the graphs referenced by the listeners and stored value. |

The store uses a `Set`. Insertion and deletion are commonly treated as expected constant-time operations in engineering estimates, but ECMAScript requires average sublinear access rather than one particular hash-table implementation. See [ECMAScript: Set Objects](https://tc39.es/ecma262/multipage/keyed-collections.html#sec-set-objects).

The logger demo intentionally collects records in an array so assertions can inspect them. Keeping that sink in a long-running service would retain every record until something removed it. A production sink needs a deliberate retention or transport policy. The closure factory is not the unbounded part of that particular design; the collecting array is.

Snapshotting listeners trades an `O(s)` allocation for clear notification timing. Removing that allocation changes the iteration problem: additions and removals may affect an active traversal. Measure whether the allocation matters before replacing a documented and tested contract.

## Lifetime Matters More Than Syntax Alone

A short function can retain a large graph if it references a large object. Conversely, thousands of small functions may fit a workload comfortably if their lifetimes are short and their captured data is small. There is no universal threshold that makes closures “too expensive.”

Consider a page preview listener that accesses a document model. If the application keeps that listener in a global registry after closing the preview, the listener may keep the model reachable. Replacing the arrow with an ordinary function does not fix the ownership error. Unregister the callback when the preview closes and release any saved cleanup function when it is no longer needed.

A practical measurement sequence is to establish a baseline, repeat the real lifecycle operation, run the intended cleanup, and compare retained objects. Investigate reference paths for objects that continue to accumulate. Allocation activity by itself is not proof of a leak. Chrome documents heap snapshots and allocation profiling for this work in [Fix memory problems](https://developer.chrome.com/docs/devtools/memory-problems).

Avoid timing one tiny closure call once and presenting the result as a language guarantee. A useful comparison holds behavior constant, uses realistic call counts and data sizes, includes warm-up appropriate to the runtime, and records the runtime version. Measure allocation and retained memory separately from elapsed time.

## Closure Privacy Is an API Boundary

The subscription store does not expose its `value` binding as an object property. That prevents ordinary consumers from directly reassigning the binding through the returned API. It still exposes capabilities: `update` can replace the value, `read` can return it, and a returned object may itself be mutable.

This distinction suggests a useful application design: give a rendering component only the `read` and `subscribe` functions when it does not need to publish changes. That narrows what the component can do through this API. It does not establish an authentication system or protect against a user controlling the JavaScript runtime.

Do not embed a server secret in browser code and expect a closure to make it confidential. A browser user can inspect and modify client execution. Enforce authorization for protected server operations on the server. OWASP explicitly advises against relying on client-side access-control checks; see the [Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html#never-rely-on-client-side-access-control-checks).

## Validate What Crosses the Closure Boundary

A captured string is not trustworthy merely because it is hard to access as an object property. If a callback eventually inserts that string into HTML, executes it as code, or sends it to a privileged operation, the destination still needs its normal validation and handling rules.

The request logger applies a narrower, concrete policy: copy a few named fields; bound their sizes; reject control characters in the route; and accept identifier-shaped event names. It does not accept a whole request body or arbitrary extra properties. Use a normalized route template and an appropriate request identifier at the call site. A string validator cannot determine whether someone placed confidential data in an otherwise valid string.

Logging systems should exclude credentials and other sensitive data and handle untrusted event content safely. OWASP discusses these requirements in its [Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html#data-to-exclude). Closure design can reduce how much data reaches the sink, but the sink and its surrounding system still own storage access, retention, and output encoding.

Do not use direct `eval` to offer callers a “private expression” language inside a factory. Direct evaluation can resolve names through the caller's lexical environment, so accepting a string here permits code execution with access to surrounding bindings. See [ECMAScript: PerformEval](https://tc39.es/ecma262/multipage/global-object.html#sec-performeval). Prefer a small set of named operations or a parser for the particular data format the application actually needs.

## Security Review of the Subscription Store

The factory is a coordination utility for cooperating application code. Any holder of `update` can publish any JavaScript value because this generic store has no domain validator. If a particular store represents order status, wrap or specialize that operation with allowed-transition checks before sharing it.

Subscriber callbacks execute synchronously and are trusted to finish. Catching their exceptions lets later subscribers run; it cannot stop a callback that never returns. Untrusted plug-ins require a separate execution and capability design. The closure and its `try` block are not a sandbox.

The store also does not supply quotas. Repeated subscriptions consume memory and increase dispatch work. Assign subscription ownership to components or sessions, call cleanup when their lifetimes end, and choose an application limit if subscriptions can be driven by external input.

## Best Practices

- Keep captured context small and meaningful; prefer selected primitives when later object mutations must not change it.
- Review the lifetime of sinks, caches, registries, and cleanup functions along with the returned callback.
- Share only the operations a consumer needs, while enforcing actual authorization at the protected boundary.
- Choose a state ownership policy and document whether reads expose objects, copies, or immutable values.
- Profile a real workload before replacing closure factories with another representation.
- Treat synchronous callback failure, asynchronous rejection, cleanup, and resource limits as separate contracts.

The aim is a design whose lifetime and authority match its purpose: a request logger owns just enough context to identify that request, and a store owns just enough shared state to coordinate its subscribers.
