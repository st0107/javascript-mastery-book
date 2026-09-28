# Control Flow: Professional Field Guide

## Choose the Construct From the Decision

| Requirement | Useful starting point |
| --- | --- |
| Several ordered validation checks | Guard clauses |
| One simple selected value | Conditional expression |
| Dispatch on a closed event vocabulary | Switch with explicit default |
| Indexed work with clear bounds | Classic for |
| Consume iterable values | For...of |
| Own object fields | Object.keys or Object.entries |
| Repeat while state permits | While with a visible progress step |
| Perform at least one attempt | Do...while |
| Return the first search result | Small function with early return |
| Exit a tightly scoped nested traversal | Descriptive labeled break |

## Review Loop Correctness

Name the input unit, invariant, progress measure, exit target, and output ownership. For the batch example, the unit is a job; the invariant is the accepted prefix; progress comes from the finite iterator; fatal exits the loop; outputs are fresh records.

Then ask how each assumption could fail. A malformed object can break a field read. A continue can skip a while update. Appending to the traversed input can change termination. Sharing original records can make later callers mutate your source data.

## Review Policy Precedence

Write competing conditions as a small decision table. Valid fatal plus cancelled means stop in this chapter. Invalid plus fatal-looking means skip. Those are application choices, not universal JavaScript rules.

Keep the table beside the tests when the policy matters. Rearranging guards for style can alter precedence even when every individual condition remains present.

## Make Failure Behavior Consistent

For the job batch, invalid entries are an expected skip path; an invalid top-level batch is a caller error. For the state dispatcher, unsupported events are rejected. Do not silently change one contract into the other.

A production service may need counts or structured rejection reasons. Add them as explicit return fields and test them; do not claim diagnostics the function does not return.

## References

- [Loops and iteration](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Loops_and_iteration): language constructs and their schedules.
- [Switch](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/switch): matching, scope, and fallthrough.
- [For...of](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...of): iterable values and early exit.
- [For...in](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...in): enumerable string-key traversal.
- [Continue](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/continue): update behavior and targets.
- [ECMAScript statements](https://tc39.es/ecma262/multipage/ecmascript-language-statements-and-declarations.html): specification-level execution semantics.

## Further Reading

Read [labeled statements](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/label) when reviewing nested exits. Then study [Functions and Callbacks](../chapter-07/01-introduction.md) to place early returns inside clear, reusable operations. Later error-handling material develops throw, catch, and finally; asynchronous volumes explain scheduling and cooperative cancellation.
