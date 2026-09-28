# MCQs

Predict the behavior before reading the expected output and answer. Each program is independent.

## 1. Assigning a Function

After `const run = processItem`, where `processItem` is a function, which statement is correct?

- A. `processItem` has already executed with no arguments.
- B. `run` contains a copy of the most recent return value.
- C. `run` contains the same function value and can invoke it later.
- D. The function now resolves free names from the scope that calls `run`.

**Answer: C.** Assignment stores the function value. Invocation requires a call. An alias does not change lexical scope.

## 2. Missing Arguments

```js
'use strict';
function report(first, second) { return `${first}:${second}`; }
console.log(report('ready'));
// Expected output:
// ready:undefined
```

- A. Missing parameters cause an immediate TypeError.
- B. The omitted parameter receives undefined.
- C. The last supplied value is repeated.
- D. The function is not invoked until both arguments are supplied.

**Answer: B.** JavaScript does not enforce this argument count automatically. Validate required inputs inside the API boundary.

## 3. Logging and Returning

A normal function prints a message and reaches its closing brace. What does its caller receive?

- A. The printed string.
- B. The last expression evaluated in the body.
- C. Null.
- D. Undefined.

**Answer: D.** Console output is an effect. A normal function needs an explicit return expression to return another value.

## 4. A Supplied Null

```js
'use strict';
function choose(value = 5) { return value; }
console.log(choose(undefined), choose(null), choose(0));
// Expected output:
// 5 null 0
```

- A. Only undefined selects the default among these arguments.
- B. Both null and undefined select the default.
- C. All falsy arguments select the default.
- D. Explicit undefined differs from omission and bypasses the default.

**Answer: A.** Parameter defaults apply to missing or undefined arguments, not every falsy value.

## 5. Rest Parameters

What is `values` inside `function collect(...values) {}`?

- A. An alias of the caller's array, regardless of how it calls the function.
- B. The legacy arguments object.
- C. An array containing the collected argument values.
- D. A lazy iterator that executes the caller again when read.

**Answer: C.** Rest collects values into an array. Object values inside it may still identify shared objects.

## 6. Arrow Body Syntax

```js
'use strict';
const first = n => n + 1;
const second = n => { n + 1; };
console.log(first(2), second(2));
// Expected output:
// 3 undefined
```

- A. Both functions return 3.
- B. The block body throws because it lacks return.
- C. Both functions return undefined.
- D. Only the expression body implicitly returns its result.

**Answer: D.** A block body is a statement list. Its final expression is not automatically the returned value.

## 7. Reassignment Versus Mutation

```js
'use strict';
function revise(item) {
  item.value = 2;
  item = { value: 3 };
}
const item = { value: 1 };
revise(item);
console.log(item.value);
// Expected output:
// 2
```

- A. It prints 1 because object arguments are deeply copied.
- B. It prints 2 because mutation reaches the shared object, while reassignment is local.
- C. It prints 3 because the parameter aliases the caller's binding.
- D. Const makes the property write throw.

**Answer: B.** The local parameter and caller initially hold the same object value. They remain different bindings.

## 8. Callback Timing

Which statement is valid for all callback-based APIs?

- A. Timing and invocation rules must be learned from the receiving API's contract.
- B. A callback always runs after the current function returns.
- C. A callback always runs exactly once.
- D. A callback's returned value automatically becomes the outer function's return value.

**Answer: A.** A callback can run synchronously, later, repeatedly, or not at all. Its name alone establishes none of those guarantees.

## 9. Adapting a Signature

An API calls a callback as `(text, index)`. You want decimal parsing. Which callback is appropriate?

- A. `Number.parseInt()`
- B. `Number.parseInt`
- C. `text => Number.parseInt(text, 10)`
- D. `(text, index) => Number.parseInt(text, index)`

**Answer: C.** The wrapper fixes the radix and ignores the unrelated index. Directly passing parseInt lets the index become the radix; calling it immediately passes its result instead of a function.

## 10. Argument Evaluation

```js
'use strict';
const trace = [];
function value(n) { trace.push(n); return n; }
function add(a, b) { trace.push('body'); return a + b; }
add(value(1), value(2));
console.log(trace.join(','));
// Expected output:
// 1,2,body
```

- A. The body runs before either argument expression.
- B. Argument expressions run in order before the body.
- C. The runtime can freely reverse these observable argument effects.
- D. Arguments are evaluated only when their parameters are first read.

**Answer: B.** The call evaluates its arguments before invoking the function body. A throw during argument evaluation can prevent that body from running.

## 11. Arrows and Receivers

Which requirement favors an ordinary object method over an arrow stored in a property?

- A. The function must return an object.
- B. The function needs parameters.
- C. The function must be passed as a value.
- D. A property call should supply the object's receiver as `this`.

**Answer: D.** Arrows capture surrounding this rather than acquiring it from the later call. Both forms can take parameters, return objects, and be stored as values.

## 12. Recursion Depth

A linear recursive traversal visits n records and keeps one active invocation per record. What portable concern remains even when every input terminates?

- A. The runtime can run out of call-stack capacity.
- B. JavaScript forbids recursive declarations.
- C. Every recursive function is automatically asynchronous.
- D. Tail-call-shaped source guarantees constant stack in Node.js.

**Answer: A.** Termination and available stack capacity are separate concerns. Iteration can remove unnecessary active depth.

## 13. Default Allocation

```js
'use strict';
function items(value = []) { value.push('x'); return value; }
console.log(items().length, items().length);
// Expected output:
// 1 1
```

- A. The default array is shared, producing 1 then 2.
- B. Defaults execute only once when the function is defined.
- C. The array expression executes separately for each call that needs the default.
- D. Arrays cannot be used as defaults.

**Answer: C.** The expression creates a fresh array for each of these calls. A default referring to an outer array would instead reuse that array.

## 14. A Callback Throws After Writing

A callback writes to a log array, then throws. Its caller catches the error. What follows automatically?

- A. The log array is restored to its previous state.
- B. The callback is retried once.
- C. Earlier callbacks are undone in reverse order.
- D. No rollback occurs unless the application implements one.

**Answer: D.** Error propagation transfers control. It is not a transaction mechanism.

## 15. A Returned Record

```js
'use strict';
function rename(item, name) { return { id: item.id, name }; }
const before = { id: 'A', name: 'old' };
const after = rename(before, 'new');
console.log(before.name, after.name, before === after);
// Expected output:
// old new false
```

- A. The original is mutated because it was an argument.
- B. A separate outer record is returned and the original stays unchanged.
- C. Both variables refer to the same object with two names.
- D. Returning an object freezes the original automatically.

**Answer: B.** Object construction creates the new outer identity. No automatic copying or freezing occurs merely because a function returns.

## 16. Preserving a Collaborator's Receiver

`printer.format(id)` reads `this.prefix`. A function-taking API will call its argument without a receiver. Which adapter preserves the intended property call?

- A. `id => printer.format(id)`
- B. `printer.format`
- C. `printer.format()`
- D. `() => printer.format`

**Answer: A.** The wrapper invokes the method through printer. B loses that call form, C invokes immediately, and D returns the method without invoking it.
