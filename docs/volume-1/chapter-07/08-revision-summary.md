# Revision Sheet and Chapter Summary

## Revision Sheet

| Concept | Rule |
| --- | --- |
| Function value | Can be assigned, passed, or returned without being called |
| Invocation | Evaluates arguments, initializes parameters, executes the body, and completes |
| Declaration | Available before its statement in the ordinary scope examples used here |
| Const-bound expression | Readable only after the binding is initialized |
| Parameter | A local binding initialized from an argument value |
| Object argument | Its value may identify the same object visible to the caller |
| Reassignment | Changes the local parameter, not the caller's binding |
| Property mutation | Can change shared state visible outside the function |
| No return expression | A normally completed ordinary call produces undefined |
| Default parameter | Selected by omission or undefined, not by null or all falsy values |
| Rest parameter | Collects remaining argument values into a new array |
| Call spread | Expands an iterable into separate arguments; avoid unbounded argument counts |
| Arrow expression body | Implicitly returns the expression |
| Arrow block body | Requires return for a non-undefined normal result |
| Arrow receiver | Lexical this; ordinary methods choose their receiver through the call |
| Callback | Receiving API defines timing, arguments, return handling, and failures |
| Recursion | Needs progress, a base case, and a practical depth bound |

## Predicting a Call

Resolve the function, evaluate argument effects in order, initialize defaults, and follow the body until it returns, throws, or finishes. Draw bindings separately from objects. At a nested call, suspend the current body until the nested call completes. At a callback boundary, read the receiving API's signature rather than guessing.

## Chapter Summary

Functions turn behavior into values that can be named, reused, and composed. A good function boundary specifies accepted values, returned values, ownership, effects, and errors. Those decisions matter more than choosing the shortest syntax.

Use the [batch planner and label builder](04-production-examples.md) to practice explicit contracts. Use the [exercises](06-exercises-coding-challenges.md) to distinguish returning from logging, copying from mutation, defaults from validation, and callback adaptation from immediate invocation.

## References

- [MDN: functions guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions).
- [MDN: default parameters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Default_parameters).
- [MDN: rest parameters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/rest_parameters).
- [MDN: arrow functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions).
- [ECMAScript: function declaration instantiation](https://tc39.es/ecma262/multipage/ecmascript-language-functions-and-classes.html#sec-functiondeclarationinstantiation).

## Further Reading

Continue with [Objects and Data Ownership](../chapter-08/01-introduction.md), then [Arrays and Collections](../chapter-09/01-introduction.md). Revisit [Errors and Debugging](../chapter-10/01-introduction.md) for error propagation and assertions. Volume 2 develops [lexical scope and closures](../../volume-2/chapter-01/01-introduction.md) and [receiver selection](../../volume-2/chapter-02/01-introduction.md) in depth.
