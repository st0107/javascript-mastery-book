# Errors and Debugging: Revision and Summary

## Revision Sheet

| Question | Rule |
| --- | --- |
| Does new Error throw? | No; throw transfers control |
| Must a thrown value be an Error? | No; catch may receive any value |
| Can a try catch a syntax failure in its own source? | No; that source never starts executing |
| Can it catch JSON.parse syntax failure? | Yes; parsing input occurs during the active call |
| What happens after throw? | Remaining protected statements are skipped and propagation begins |
| Does catch roll back mutations? | No |
| What should an unexpected caught failure do? | Propagate unless the boundary has a deliberate policy |
| What does cause preserve? | The original value, including identity for an object |
| Does finally run before a return exits? | Yes, during normal language control flow |
| Why avoid return in finally? | It replaces the pending result or failure |
| Can cleanup hide the original error? | Yes, unless the failure policy preserves it |
| Does registration-time catch protect a later callback? | No |
| What detects a wrong answer without a throw? | Domain checks and meaningful assertions |
| Is a stack string a stable API? | No; exact formatting is runtime-dependent |

## Debugging Sequence

1. State expected and observed behavior.
2. Freeze variable inputs: clock, randomness, environment, and dependency results.
3. Reduce to the smallest reproduction that still fails.
4. Pause at the throw or first incorrect state.
5. Inspect local values and the active call chain.
6. Test one hypothesis with a targeted change.
7. Add an assertion for the behavior that was missing.
8. Re-run the relevant normal and failure paths.

## Summary

Exceptions move failure through active calls; they do not undo work or prove that all failures were anticipated. Error objects and causes preserve useful context. Finally manages scope exit, but its own control transfer can replace the original outcome.

The parser defines syntax, shape, and range boundaries separately. The resource helper defines acquisition, operation, and cleanup behavior for synchronous callbacks and preserves competing failures.

Use [the exercises](06-exercises-coding-challenges.md) and [MCQs](07-mcqs.md) to practice. Continue with [Modules and Execution Modes](../chapter-11/01-introduction.md).
