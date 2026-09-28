# Theory

## Definition, Value, and Invocation

A function declaration introduces a binding and a function. A function expression produces a function value where an expression is expected. An arrow is another function-expression form. Defining a body does not execute it; a call evaluates arguments and invokes the selected function. [MDN: functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions).

```js
'use strict';
console.log(double(3));
function double(value) { return value * 2; }
const triple = function (value) { return value * 3; };
const quadruple = value => value * 4;
console.log(triple(3), quadruple(3));
// Expected output:
// 6
// 9 12
```

The declaration is available before its statement in this scope. The expressions assigned to `const` are available only after those declarations initialize. Do not extend the simple declaration rule to every sloppy-mode block declaration; use modules or strict code with declarations in clear scopes.

A function can be stored in a variable, an array, or an object property; passed as an argument; or returned. These operations copy the function value, not its body. Calling a non-callable value such as `undefined` throws a `TypeError`.

## Arguments Become Local Parameter Values

The names in a definition are parameters. Values supplied by a call are arguments. Missing arguments ordinarily initialize their parameters to `undefined`; extra arguments do not automatically cause an error. Validate the domain contract explicitly.

```js
'use strict';
function inspect(first, second) {
  console.log(first, second);
}
inspect('ready');
inspect('ready', 'queued', 'ignored by this body');
// Expected output:
// ready undefined
// ready queued
```

JavaScript passes values. When the value identifies an object, caller and callee can reach the same object. Reassigning the local parameter does not reassign the caller's variable, but mutating that object can be observed by the caller.

```js
'use strict';
function revise(record) {
  record.status = 'reviewed';
  record = { status: 'local replacement' };
  return record.status;
}
const original = { status: 'draft' };
console.log(revise(original));
console.log(original.status);
// Expected output:
// local replacement
// reviewed
```

Do not describe this as pass-by-reference: the caller's binding itself was never handed to the callee. Ownership determines whether mutation is appropriate. A calculation can instead return a new record and leave the original untouched.

## Return Values and Completion

`return expression` evaluates an expression, completes this invocation, and gives the resulting value to the caller. Reaching the end of a normal function, or using `return;`, produces `undefined`. Logging is an effect; it is not a return value.

```js
'use strict';
function label(id) {
  if (id === '') return 'missing';
  return `item:${id}`;
}
function announce(message) { console.log(message); }
console.log(label('7'));
console.log(announce('saved'));
// Expected output:
// item:7
// saved
// undefined
```

A newline immediately after `return` can end that statement through automatic semicolon insertion. Keep a returned expression on the same line or open parentheses on that line. A thrown error is another completion path: statements after the throw do not run unless control is later resumed outside the throwing invocation by a handler.

## Defaults Express a Missing-Value Policy

Default parameter expressions run when the corresponding argument is missing or explicitly `undefined`. They do not run for `null`, `false`, zero, or an empty string. Defaults are evaluated at call time, from left to right, and can refer to earlier parameters. [MDN: default parameters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Default_parameters).

```js
'use strict';
function settings(limit = 10, offset = limit * 2) {
  return `${limit}:${offset}`;
}
console.log(settings());
console.log(settings(0));
console.log(settings(null));
console.log(settings(undefined, 4));
// Expected output:
// 10:20
// 0:0
// null:0
// 10:4
```

The `null` example demonstrates the rule, not a recommended numeric contract. A domain API should reject `null` when a number is required. Likewise, `function f(options = {})` does not make `f(null)` a valid call. Default object/array expressions create fresh values per call; defaults referencing an outer object retain that shared reference.

Parameter initialization has its own ordering and scope rules. A default cannot safely read a later uninitialized parameter, and cannot use a variable declared only inside the function body. Keep complicated preparation in the body so its dependencies are visible.

## Rest Collects Arguments; Spread Supplies Them

A final rest parameter gathers the remaining argument values into a real array. Spread at a call site expands an iterable into separate arguments. They use the same punctuation for different operations. [MDN: rest parameters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/rest_parameters).

```js
'use strict';
function joinTags(prefix, ...tags) {
  return `${prefix}:${tags.join('|')}`;
}
const tags = ['draft', 'review'];
console.log(joinTags('doc', ...tags));
console.log(joinTags('empty'));
// Expected output:
// doc:draft|review
// empty:
```

An ordinary function also has an `arguments` object, but rest communicates which arguments the implementation intends to collect and provides array methods directly. Arrows do not create their own `arguments`. Avoid spreading an unbounded collection into a call: engines impose argument-count limits. Iterate when the input may be large.

## Choose an Arrow for Its Semantics

An expression-bodied arrow implicitly returns its expression. A block-bodied arrow requires an explicit return. Parenthesize an object literal used as the returned expression so braces are not parsed as a body.

```js
'use strict';
const increment = value => value + 1;
const forgotten = value => { value + 1; };
const record = id => ({ id });
console.log(increment(4), forgotten(4));
console.log(record('A').id);
// Expected output:
// 5 undefined
// A
```

An arrow captures surrounding `this`; it does not choose a receiver from a later property call. It is not a constructor and has no own `arguments` binding. Ordinary methods are appropriate when behavior should use the object on which it is called. [MDN: arrow functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions).

```js
'use strict';
const formatter = {
  prefix: 'report',
  format(id) { return `${this.prefix}:${id}`; }
};
console.log(formatter.format('7'));
const detached = formatter.format;
try { detached('7'); } catch (error) { console.log(error.name); }
// Expected output:
// report:7
// TypeError
```

For a callback, `id => formatter.format(id)` deliberately preserves a property call. Volume 2 explains receivers in detail; here the key design question is whether the function expects a receiver or only explicit arguments.

## A Callback Is a Function Supplied to Another Operation

The receiving API decides when the callback runs, how often it runs, which arguments it receives, what its return value means, and how errors propagate. “Callback” does not mean “asynchronous.”

```js
'use strict';
function transformPair(first, second, transform) {
  return [transform(first, 0), transform(second, 1)];
}
const seen = [];
const result = transformPair('a', 'b', (value, index) => {
  seen.push(index);
  return value.toUpperCase();
});
console.log(result.join(','));
console.log(seen.join(','));
// Expected output:
// A,B
// 0,1
```

This API invokes the callback synchronously, twice, in order, with a value and index. Passing a built-in with a different second parameter can change behavior: a callback API's index might be interpreted as a radix or options argument. Use a wrapper to select and adapt the intended arguments. Do not pass `transform()` when the API expects the function value `transform`.

## Local State, Pure Calculation, and Effects

Each ordinary invocation gets new parameter and local bindings. It can still read or mutate reachable outer objects. A pure calculation depends on its explicit inputs and returns a result without externally visible mutation. Reading the current time, generating randomness, logging, and writing shared state make additional dependencies observable.

Inject such dependencies when testing needs control. For example, accept a trusted timestamp argument rather than calling `Date.now()` deep inside a calculation. Do not expose a callback as arbitrary user-supplied executable code; callback injection is a design technique for cooperating application code.

## Recursion Is Repeated Invocation

A recursive function calls itself directly or indirectly. It needs a terminating base case and progress toward that case. Each active call normally consumes stack capacity; a mathematically terminating algorithm can still exceed the runtime's stack limit on large input.

```js
'use strict';
function sumDown(n) {
  if (n === 0) return 0;
  return n + sumDown(n - 1);
}
console.log(sumDown(4));
// Expected output:
// 10

// For this bounded nonnegative-integer domain: O(n) calls and stack depth.
```

This demonstration assumes a small nonnegative integer. Production validation and an iterative alternative belong at the boundary. Do not rely on tail-call optimization for portable Node.js examples. Choose recursion when the data structure and a known depth bound justify it; choose iteration when stack depth is unnecessary.
