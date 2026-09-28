# Errors and Debugging: Professional Field Guide

## Choose a Failure Contract

| Situation | Useful response |
| --- | --- |
| Expected absence | Null or a tagged result |
| Invalid input type | TypeError or a domain category |
| Out-of-range value | RangeError or a domain category |
| Malformed syntax | SyntaxError with safe context |
| Unexpected dependency failure | Propagate or wrap once with cause |
| Competing scope failures | Preserve both under an explicit aggregate policy |
| Wrong answer without a throw | Assertion, reproduction, and state inspection |

Consistency matters more than a favorite error style. Callers must know which outcomes are normal, which reject the request, and which indicate a defect.

## Review a Catch

Identify the exact operation it protects and the failures it can recover from. Verify that unexpected values propagate. Check whether it could swallow AssertionError or an unrelated TypeError.

Ask whether wrapping adds new context. If yes, retain the cause; otherwise rethrow the original value.

## Review a Finally

List all exit paths, including return and throw. Ensure cleanup does not accidentally select a successful result. If cleanup can throw, verify what happens to a pending operation failure.

Acquire before entering the release scope when failed acquisition produces no usable resource. After successful acquisition, release must receive the same resource exactly once.

## Build a Useful Regression

Test the original failure with a minimal realistic input. Add a nearby accepted boundary so a fix cannot merely reject everything. Assert output shape, failure category, mutation policy, call order, and cleanup count where relevant.

A demonstration prints a result. A regression assertion must distinguish the defective implementation from the corrected one.

## References

- [Try/catch/finally](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch): execution and completion.
- [Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error): failure values.
- [Error.cause](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause): retained context.
- [JSON.parse](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse): runtime data parsing.
- [Node assert](https://nodejs.org/api/assert.html): result and failure assertions.
- [Debugger](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/debugger): requesting a pause.

## Further Reading

Read [AggregateError](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AggregateError) for competing failures and [Node debugging guidance](https://nodejs.org/en/learn/getting-started/debugging) for inspector workflows. The asynchronous volume covers Promise rejection, await, and cancellation boundaries.

Continue to [Modules and Execution Modes](../chapter-11/01-introduction.md).

