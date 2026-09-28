# Theory

## Binding, Value, and Object Identity

A binding associates a name with a value in an environment. Evaluating an identifier reads that binding. Assignment to an identifier changes a mutable binding's value; assignment to a property changes the target object if that property permits it. The operations are different even when they use the same `=` token.

```js
'use strict';

let selected = { id: 'A', status: 'queued' };
const original = selected;
selected.status = 'ready';
selected = { id: 'B', status: 'queued' };
console.log(original.id, original.status);
console.log(selected.id, selected === original);

// Expected output:
// A ready
// B false
```

The first two bindings initially designate one object. Mutation changes that object's status. Replacement changes only `selected`; `original` still designates the first object. This model avoids the misleading idea that every assignment duplicates a whole object graph.

## Declaration Forms

| Rule | `var` | `let` | `const` |
| --- | --- | --- | --- |
| Ordinary scope | Nearest function, or top-level script/module scope | Enclosing block or top-level scope | Enclosing block or top-level scope |
| Initial state before its declaration executes | Initialized to `undefined` | Uninitialized | Uninitialized |
| Ordinary declaration without initializer | Allowed | Allowed; initializes to `undefined` when reached | Not allowed |
| Reassignment after initialization | Allowed | Allowed | Throws `TypeError` |
| Repeating the same declaration name in one scope | Often permitted for `var`; conflicts with lexical declarations are errors | Duplicate lexical declaration is an early error | Duplicate lexical declaration is an early error |

`for...of` and `for...in` loop declarations are special forms that can initialize a fresh `const` binding from each iterated value without a source `=` initializer. Use `const` for a binding that will keep its value, `let` for deliberate reassignment, and understand `var` when reading existing code. Choosing `const` does not promise deep immutability or greater execution speed.

```js
'use strict';

function inspectDeclarations() {
  console.log(legacy);
  var legacy = 'ready';
  let pending;
  console.log(legacy, pending);
  if (true) {
    var visibleAfterBlock = 3;
    const onlyInside = 7;
    console.log(onlyInside);
  }
  console.log(visibleAfterBlock);
}
inspectDeclarations();

// Expected output:
// undefined
// ready undefined
// 7
// 3
```

Function calls have their own declaration instances. A block alone does not create a separate `var` scope. Formal lexical-declaration rules are specified in [ECMAScript let and const declarations](https://tc39.es/ecma262/multipage/ecmascript-language-statements-and-declarations.html#sec-let-and-const-declarations).

## Initialization and the Temporal Dead Zone

An uninitialized binding is not a binding whose value happens to be `undefined`. Reading an uninitialized lexical binding throws `ReferenceError`. The interval from scope entry until that binding's initialization is called its temporal dead zone, or TDZ.

```js
'use strict';

const status = 'outer';
try {
  console.log(status);
  let status = 'inner';
} catch (error) {
  console.log(error.name);
}
let ready;
console.log(ready);
console.log(status);

// Expected output:
// ReferenceError
// undefined
// outer
```

The block's `status` shadows the outer name throughout that block, including before initialization. Lookup finds the inner binding and fails; it does not skip that binding to use the outer value. By contrast, `let ready;` actually executes and initializes `ready` to `undefined`.

"Hoisting" is informal terminology for these declaration effects. It does not mean the engine physically moves source statements. Explain what binding exists and when it initializes instead of saying all declarations behave identically. The [MDN let reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let) provides TDZ and shadowing examples.

## Primitive Values and Objects

JavaScript has seven primitive types: Undefined, Null, Boolean, String, Symbol, Number, and BigInt. Primitives are immutable values. Object is the remaining language type; arrays and functions are objects with additional behavior. A function's special `typeof` result does not make it an eighth primitive type.

| Type | Example | Practical distinction |
| --- | --- | --- |
| Undefined | `undefined` | Common result of an absent property or an initialized declaration without a value. |
| Null | `null` | Explicit absence chosen by the application contract. |
| Boolean | `false` | One of two logical values. |
| String | `'ready'` | Immutable text value. |
| Symbol | `Symbol('id')` | A unique symbol for each direct call; often used as a property key. |
| Number | `42`, `1.5`, `NaN` | Floating-point numeric values, including special values. |
| BigInt | `42n` | Arbitrary-precision integers, subject to available resources. |
| Object | `{ id: 'A' }` | Identity-bearing value with properties; may be mutable. |

The [ECMAScript data types overview](https://tc39.es/ecma262/multipage/overview.html#sec-ecmascript-data-types-and-values) gives the language categories. A business type such as "positive safe integer cents" is a narrower contract built from these types.

```js
'use strict';

let title = 'report';
const previousTitle = title;
title = title.toUpperCase();
console.log(previousTitle, title);
console.log(Symbol('id') === Symbol('id'));
console.log(42n === 42);

// Expected output:
// report REPORT
// false
// false
```

Calling a string method produces a result; it does not mutate the original primitive string. Equal symbol descriptions do not mean equal symbols. BigInt and Number are distinct types; converting or comparing them has additional rules developed in later chapters.

## Dynamic Typing

A mutable binding can successively hold values of different types. Operations use the values currently present, so the same expression can behave differently after reassignment.

```js
'use strict';

let quantity = 4;
console.log(typeof quantity, quantity + 1);
quantity = '4';
console.log(typeof quantity, quantity + 1);

// Expected output:
// number 5
// string 41
```

Dynamic typing does not mean values lack types. It means a binding does not permanently constrain its values to one declared runtime type. For production state, keep the representation stable when practical: parse a form string once, validate it, and pass a Number to numeric code.

## What typeof Can and Cannot Tell You

```js
'use strict';

console.log(typeof null, typeof [], typeof (() => {}));
console.log(typeof NaN, Number.isNaN(NaN));
console.log(Array.isArray([]), Array.isArray({}));
console.log(typeof neverDeclaredHere);
try {
  console.log(typeof pending);
  let pending = 1;
} catch (error) {
  console.log(error.name);
}

// Expected output:
// object object function
// number true
// true false
// undefined
// ReferenceError
```

Use `value === null` for null, `Array.isArray` for arrays, and `Number.isFinite` or `Number.isSafeInteger` for appropriate numeric contracts. `typeof value === 'object'` also accepts null and arrays. `typeof NaN` is `number`, because NaN belongs to the Number type. The undeclared-name exception does not bypass the TDZ of a binding that exists.

Do not generalize browser legacy behavior such as `document.all` into a validation strategy. The examples use ordinary language values. See [MDN typeof](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof) for the compatibility exception and complete operator behavior.

## Passing Values and Sharing Objects

Arguments are passed by value. When that value is an object, the caller and parameter can designate the same object. Mutating its property can be visible to the caller; reassigning the parameter cannot reassign the caller's binding.

```js
'use strict';

function review(record) {
  record.reviewed = true;
  record = { reviewed: false };
  return record;
}
const original = { reviewed: false };
const replacement = review(original);
console.log(original.reviewed, replacement.reviewed, original === replacement);

// Expected output:
// true false false
```

Calling this "objects are passed by reference" often causes the wrong prediction about the parameter reassignment. Say that the object identity is shared, then trace the mutation and rebinding separately.

## Reachability and Representation

A value can remain reachable through another binding, a property, a collection, or a retained function even when one local scope ends. An unreachable object becomes eligible for collection; collection time is not a language-level promise. Cycles alone do not necessarily make a leak; a reachable retention path matters.

Stack/heap drawings are conceptual aids, not universal allocation rules. Engines can optimize away bindings or allocations and use different physical representations. Use semantic diagrams to predict aliases; use profiling to investigate actual memory. [MDN memory management](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Memory_management) explains reachability and collection limitations.
