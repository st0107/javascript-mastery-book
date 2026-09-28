# Revision Sheet and Summary

## Binding Rules

| Situation | Result |
| --- | --- |
| Read ordinary function-scoped `var` before its initializer | `undefined` |
| Read `let` or `const` before initialization | `ReferenceError` |
| Execute `let name;` | Initializes the binding to `undefined` |
| Reassign initialized `const` | `TypeError` |
| Mutate an ordinary mutable object held by `const` | Allowed by the binding rule |
| Read an inner lexical name before its initializer | The inner TDZ applies; outer value is not substituted |
| Reassign a function parameter | Caller binding is unchanged |
| Mutate a shared argument object | Other holders of that identity can observe it |

## Type Rules

The seven primitive types are Undefined, Null, Boolean, String, Symbol, Number, and BigInt. Objects have identity; arrays and functions are objects. `typeof null` is `object`, `typeof []` is `object`, `typeof NaN` is `number`, and ordinary callable functions report `function`.

Check null with equality, arrays with `Array.isArray`, finite Number values with `Number.isFinite`, and safe integers with `Number.isSafeInteger`. A language type check does not impose application constraints such as positivity, nonempty text, or an allowed status.

## Ownership and Lifetime

Assignment shares an object identity; it does not clone the object's graph. Primitive values cannot be mutated. A normalizer returning validated string fields in a new record gives independent field storage for that schema. A shallow copy containing nested objects still shares those nested identities.

Scope and reachability are different: a call can finish while returned functions or other references retain its data. Semantic diagrams do not promise literal stack/heap allocation or collection timing.

## Summary

A correct explanation names the binding being accessed, its initialization state, the current value's type, and any shared object identity. Those four questions resolve most declaration and mutation surprises without relying on vague hoisting or memory slogans.

Continue to [Operators and Expressions](../chapter-03/01-introduction.md). Return to the [execution-model companion](../chapter-01-execution-model.md) after learning functions.

## References and Further Reading

- [ECMAScript lexical declarations](https://tc39.es/ecma262/multipage/ecmascript-language-statements-and-declarations.html#sec-let-and-const-declarations): creation and initialization rules.
- [MDN const](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/const): immutable bindings and mutable values.
- [MDN typeof](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof): type results and the TDZ exception.
- [ECMAScript environment records](https://tc39.es/ecma262/multipage/executable-code-and-execution-contexts.html#sec-environment-records): formal binding machinery.
- [MDN memory management](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Memory_management): reachability and collection.
