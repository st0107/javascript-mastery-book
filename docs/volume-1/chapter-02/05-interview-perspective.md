# Interview Perspective

## What Does const Guarantee?

A `const` binding cannot be reassigned after initialization. It does not recursively freeze the value it holds. Property assignment and identifier assignment target different things. Show the difference with a record rather than saying "const means constant object."

```js
'use strict';

const invoice = { cents: 500 };
const alias = invoice;
alias.cents = 700;
console.log(invoice.cents);
try { invoice = { cents: 900 }; } catch (error) { console.log(error.name); }

// Expected output:
// 700
// TypeError
```

The alias and original designate the same object. The property mutation succeeds; replacing the immutable binding fails. Freezing an object is a separate operation and is shallow, as the later object chapter explains.

## Why Does This Shadowing Fail?

```js
'use strict';

let count = 10;
try {
  const count = count + 1;
  console.log(count);
} catch (error) {
  console.log(error.name);
}
console.log(count);

// Expected output:
// ReferenceError
// 10
```

The initializer's read resolves to the inner `count`, which is uninitialized until its initializer completes. The outer value is not a fallback. Use a different name when an initializer deliberately derives a new value from the outer binding.

## Is JavaScript Pass-by-Reference?

Argument values initialize parameter bindings. For an object, the copied value designates the same object identity. A property mutation can affect the caller's observation; assigning another object to the parameter does not replace the caller's binding. That second fact is why "pass-by-reference" is usually a misleading answer here.

Draw two bindings pointing to object A. Then draw a parameter reassignment as moving only the parameter's arrow. If the interviewer asks about primitive arguments, there is no mutable primitive object whose contents can be altered through the parameter.

## What Is Wrong With typeof x === 'object' as a Record Guard?

It accepts null and arrays as well as ordinary records. A non-null object check plus `!Array.isArray(x)` is a first container check for an ordinary JSON-object contract, not proof that every required field is valid. Inspect field types and business constraints next. Arbitrary JavaScript objects may contain getters, proxies, or unusual prototypes; do not silently promise to handle all of them.

## What Does Hoisting Mean?

It is informal vocabulary for declaration behavior observable before a declaration's textual position. A `var` binding ordinarily starts as undefined; lexical bindings exist but cannot be read until initialization. A function declaration can already be callable before its statement position. State the declaration form and its timing instead of claiming every declaration is simply moved to the top.

## Why Can typeof Throw?

`typeof missingName` returns the string `undefined` when there is no binding for the name. A lexical binding in its TDZ exists and throws when read, including through `typeof`. This distinction is useful when diagnosing a capability check accidentally shadowed by a local declaration.

## Does Leaving a Function Free Its Objects?

Not necessarily. Another binding, object property, collection, or returned function can retain access to data. Unreachable data becomes eligible for collection, with no promised immediate collection time. A local variable and the object it designates can have different useful lifetimes.

## Senior Design Question

A normalizer returns `{ ...input }` and claims callers cannot affect its state. Ask whether any properties contain objects and whether those objects are shared. A new outer record is insufficient to establish nested ownership. For a narrow `{ id, email }` string schema, construct a new record from validated primitive fields. For a nested schema, document copying or immutability at every mutable boundary.
