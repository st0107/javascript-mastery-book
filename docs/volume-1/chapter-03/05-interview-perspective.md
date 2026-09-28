# Interview Perspective

## Explain a Rule, Then Trace It

A strong answer names the operator, states its selection or conversion rule, and accounts for observable effects. Avoid answering only with a memorized output. The interviewer may change an operand from zero to null or insert a getter.

### Does Precedence Mean Multiplication's Operands Run First?

No. Precedence groups the expression. In `readA() + readB() * readC()`, the calls occur A, B, C if none throws; multiplication combines B/C before addition combines that result with A. Mention skipped operands separately for logical operators.

### Why Does a Logical Expression Return Zero?

`&&` returns the first falsy operand it encounters, or the final operand if all preceding operands are truthy. It does not convert that returned value into false. A feature API promising booleans should either use boolean-producing comparisons or explicitly normalize its final result.

```js
console.log('user' && 0);
console.log(Boolean('user' && 0));
console.log(false ?? 'fallback');
console.log(false || 'fallback');

// Expected output:
// 0
// false
// false
// fallback
```

### When Is Nullish Coalescing the Wrong Default?

When the domain intentionally treats an empty string as missing. Conversely, || is wrong when zero or false is meaningful. Neither validates a negative count, an oversized timeout, or a string boolean. State the accepted input policy before selecting an operator.

### Does Optional Chaining Make an Entire Expression Safe?

It protects only the documented nullish boundary along a continuous chain. It does not catch exceptions from getters or callbacks, make nonfunctions callable, or resolve undeclared variables. Parentheses may end the chain before a later ordinary property access.

### Can Logical Assignment Invoke a Setter Less Often?

Yes. `object.count ??= 1` skips the write when count is present. `object.count = object.count ?? 1` writes even then. A getter runs for both forms; a setter can distinguish them. This is an observable semantic difference, not merely an optimization.

### Is a Chained Comparison a Range Check?

No. `0 < count < 10` first produces a boolean, then compares that boolean with 10 after conversion. Use two comparisons joined with &&. Ask whether the bounds are inclusive, then choose <= or < deliberately.

### Why Is a Bitwise Shortcut Dangerous for Counts?

Number bitwise operators use a 32-bit representation. A valid larger integer may wrap and a fraction may be truncated. Use explicit numeric validation. Bit masks remain appropriate for a documented small flag domain.

## Worked Senior Prompt

A configuration helper uses `retries: config.retries || 3` and a feature check uses `feature.allowedUserIds.includes(user.id)`. Product requirements say zero retries is valid and a missing allowlist denies ordinary members.

A complete answer has four parts:

1. Replace the default with `??`, then validate the selected count.
2. Define the list's absence and malformed-data policies before accessing it.
3. Require actual boolean flags rather than trusting strings such as "false".
4. Test zero, false, missing values, malformed lists, and unchanged input ownership.

The [production examples](04-production-examples.md) implement that contract. Optional chaining alone would still leave unclear whether an absent list means deny, error, or unrestricted access.

## Whiteboard Trace

Trace `cache.value ??= build()` under three cases: value is zero; value is undefined; build throws. Draw one property reference, the read, the branch, and the possible write. Expected answers: return zero without build/write; build and store; or propagate the error without the assignment occurring. If build mutates other state before throwing, the operator does not roll that back.

The follow-up is whether this is a correct asynchronous cache. It is not sufficient by itself: promise rejection, concurrent requests, and retry policy need explicit design.
