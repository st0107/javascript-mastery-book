# Revision Sheet and Chapter Summary

## One-Page Revision Sheet

| Situation | Reasoning rule |
| --- | --- |
| `owner.method()` | An ordinary method call supplies `owner` as receiver |
| `const fn = owner.method; fn()` | The later call carries no original owner; a strict ordinary target gets `undefined` |
| `(owner.method)()` | Grouping preserves the property reference |
| `fn.call(owner, a, b)` | Invoke now with the chosen receiver and individual arguments |
| `fn.apply(owner, args)` | Invoke now with array-like arguments; nullish argument list means empty |
| `Reflect.apply(fn, owner, args)` | Explicit forwarding without reading `fn.apply`; requires an array-like object |
| `fn.bind(owner, a)` | Create a new callable identity retaining receiver and leading arguments |
| Call or bind an already bound function | Cannot replace the original bound receiver; more leading arguments can be added |
| Arrow callback | Its `this` resolves through the surrounding environment |
| Class prototype method | Strict, usually shared, and still detachable |
| Instance arrow field | One function per initialization, using that instance's `this` |
| `new Bound(...args)` | Requires a constructible target; forwards bound arguments and ignores bound receiver |
| Non-strict ordinary target | Substitutes global `this` for nullish receivers and boxes primitive receivers |

## A Reliable Prediction Procedure

1. State the environment, including module format when top-level code matters.
2. Find the function value that will actually be invoked.
3. Separate ordinary invocation from construction.
4. Unwrap any bound functions, tracking receiver and argument order.
5. For an arrow, locate the surrounding `this` binding.
6. For an ordinary target, find the supplied receiver and apply that target's strictness rules.
7. Trace property reads, validation, returns, and exceptions using that value.

## Common Mistakes to Catch

- Treating an object property as permanently binding its function.
- Destructuring a method and expecting its owner to survive a plain call.
- Assuming every callback API invokes functions with the same receiver.
- Trying to fix an arrow's lexical `this` with `call` or `bind`.
- Calling `bind` again during cleanup and passing a different function identity.
- Replacing a forwarding wrapper with an arrow and losing dynamic receiver behavior.
- Describing `apply` as accepting every iterable.
- Assuming a bound receiver is copied or frozen.
- Presenting a small wrapper as a complete native `bind` implementation.
- Treating correct receiver selection as application authorization.

## Interview Explanation

An ordinary function's receiver depends on its invocation. A property call supplies its base object; `call` and `apply` supply a receiver explicitly; a bound function saves one for later calls. Strict functions preserve the supplied value, while non-strict ordinary functions substitute or box certain values. An arrow has no own `this` binding and resolves it lexically. Construction has separate rules, including forwarding through constructible bound functions.

Support that explanation with a detached method, a stable bound callback, and an arrow created inside a method. Explain the result before discussing engine storage.

## Chapter Summary

You can now reason about functions along two independent dimensions: their surrounding lexical environment and the receiver supplied for a particular call. Explicit invocation changes the receiver input; it does not rewrite lexical scope. Binding introduces a function identity and retained references; it does not clone an owner. Arrows carry the surrounding `this` binding into a callback, while ordinary wrappers can preserve the receiver chosen by each caller.

Production correctness includes the rest of the call contract: argument order, return values, thrown errors, registration identity, and cleanup. The [production examples](04-production-examples.md) and [exercises](06-exercises-coding-challenges.md) test these properties directly.

## References

- [ECMAScript: call expression evaluation](https://tc39.es/ecma262/multipage/ecmascript-language-expressions.html#sec-evaluatecall).
- [ECMAScript: ordinary receiver binding](https://tc39.es/ecma262/multipage/ordinary-and-exotic-objects-behaviours.html#sec-ordinarycallbindthis).
- [ECMAScript: bound function exotic objects](https://tc39.es/ecma262/multipage/ordinary-and-exotic-objects-behaviours.html#sec-bound-function-exotic-objects).
- [ECMAScript: Function prototype methods](https://tc39.es/ecma262/multipage/fundamental-objects.html#sec-properties-of-the-function-prototype-object).
- [ECMAScript: Reflect.apply](https://tc39.es/ecma262/multipage/reflection.html#sec-reflect.apply).

## Further Reading

- [MDN: this](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this) for runtime contexts and callback examples.
- [MDN: Function.prototype.bind](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind) for partial application and construction.
- [Node.js: EventEmitter receiver behavior](https://nodejs.org/api/events.html#passing-arguments-and-this-to-listeners) for the production listener example.
- [V8 function object definitions](https://github.com/v8/v8/blob/main/src/objects/js-function.tq) for an implementation view of stored bound-function state.

Continue with [Prototypes and Inheritance](../chapter-03/01-introduction.md) to learn how a property lookup finds a shared method; the receiver rules learned here explain what happens when the found method is called.
