# Interview Perspective

## What Happens When a Function Is Assigned?

**Question:** Does `const run = processItem` execute `processItem`?

**Answer:** No. The initializer evaluates to a function value and stores it in a new binding. `run(item)` later invokes that function. `const run = processItem(item)` instead executes immediately and stores the returned value, which may not be callable.

**Follow-up:** Does the alias change the function's lexical scope? No. Definition location determines lexical access; the new binding does not rewrite it. Volume 2 develops that point with closures.

## Is JavaScript Pass-by-Reference?

```js
'use strict';
function update(value, record) {
  value = 99;
  record.count += 1;
  record = { count: 99 };
}
let value = 1;
const record = { count: 1 };
update(value, record);
console.log(value, record.count);
// Expected output:
// 1 2
```

**Answer:** Argument values initialize local parameters. Assignments to those parameters do not assign to the caller's bindings. The parameter initially identifies the same record, so its property mutation is visible. Draw two bindings pointing to one object before drawing the local reassignment.

## Does a Callback Run Later?

**Answer:** The receiving API decides. An array transformation may call synchronously; a timer callback is scheduled by the host. Read the contract instead of inferring timing from the word callback. Also establish argument order, number of calls, return handling, receiver, and error behavior.

**Follow-up:** Why can passing a built-in directly be wrong? The receiving API may supply more arguments than expected. A wrapper selects the intended arguments explicitly.

## Does a Default Handle Every Missing-Looking Value?

```js
'use strict';
function choose(value = 'default') { return String(value); }
console.log(choose(), choose(undefined), choose(null), choose(0));
// Expected output:
// default default null 0
```

**Answer:** Only absent arguments and `undefined` trigger this default. Zero and null remain supplied values. Decide whether null is allowed, rejected, or explicitly mapped by a separate rule.

## Why Did an Arrow Return Undefined?

**Answer:** A block body does not implicitly return its final expression. `x => { x + 1; }` returns undefined. Use an expression body or `return`. An object literal expression needs parentheses: `id => ({ id })`.

**Follow-up:** Are arrows interchangeable with methods? No. An arrow has lexical `this` and cannot be used as a constructor. Choose based on receiver and call semantics.

## How Would You Make a Function Testable?

**Answer:** State input and output types, ranges, ownership, effects, and failure behavior. Separate deterministic calculations from I/O. Inject a clock or formatter only when a real dependency needs control. Assert boundaries and invariants, including unchanged caller-owned data after invalid input.

**Whiteboard drill:** Implement a bounded batch calculator, trace a call with an omitted size, then test size zero and a numeric string. Explain why explicit parsing belongs at the external-data boundary rather than inside every calculation.

## What Does Recursion Cost?

**Answer:** Count calls, work per call, retained output, and maximum active depth separately. A linear recursive sum has O(n) calls and normally O(n) stack depth. An iterative loop can do the same arithmetic with O(1) extra state. Do not infer an optimization guarantee from tail-call syntax.
