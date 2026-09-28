# Theory

## Values, References, and Effects

An expression can produce a value, such as `price * count`, while also causing effects. A property read may invoke a getter; a function call may modify state; assignment writes to a binding or property. A reference identifies a destination such as `cart.count`. The value read from that destination is not itself a writable destination.

This distinction explains why `count++` changes a variable but its result cannot itself be incremented again. It also explains why compound assignment must remember the destination it evaluated.

## Arithmetic and Numeric Domains

| Operator | Meaning and boundary |
| --- | --- |
| `+` | Addition or string concatenation after primitive conversion. |
| `-`, `*`, `/` | Numeric operations; strings may undergo numeric conversion. |
| `%` | Remainder, whose nonzero sign follows the dividend. |
| `**` | Exponentiation, grouped from the right. |
| Unary `+` | Number conversion; rejects BigInt. |
| Unary `-` | Numeric negation for Number or BigInt. |

Number uses floating-point arithmetic. Division by zero can produce infinity, and invalid numeric results can produce `NaN`. BigInt arithmetic uses integers: division truncates toward zero and division by zero throws. Arithmetic generally cannot mix a Number with a BigInt. Compare these domains before trying to fix a result by adding parentheses.

```js
console.log(12 + '3');
console.log(12 - '3');
console.log(-8 % 3);
console.log(7 / 2);
console.log(String(7n / 2n));
try { console.log(7n + 2); } catch (error) { console.log(error.name); }

// Expected output:
// 123
// 9
// -2
// 3.5
// 3
// TypeError
```

The next chapter traces the conversion rules. For now, an API expecting numbers should validate numbers at its boundary; subtraction's permissive conversion does not make a numeric-looking string a trustworthy quantity.

## Precedence Groups; Evaluation Executes

Precedence decides the expression tree. Multiplication binds more tightly than addition, so `a + b * c` groups as `a + (b * c)`. Associativity resolves grouping at the same level: subtraction groups left, exponentiation groups right. Neither rule means that the engine may arbitrarily reorder calls that produce the operands. [MDN: precedence and evaluation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_precedence).

```js
const calls = [];
function read(name, value) { calls.push(name); return value; }
console.log(read('left', 3) + read('middle', 4) * read('right', 5));
console.log(calls.join(','));
console.log(20 - 6 - 2);
console.log(2 ** 3 ** 2);

// Expected output:
// 23
// left,middle,right
// 12
// 512
```

The calls happen left, middle, right. The resulting multiplication is applied before the addition. Parentheses around the multiplication make that grouping visible without changing the call order.

A useful partial precedence ladder, from tighter to looser, is: property access/calls; updates; unary operations; exponentiation; multiplicative; additive; shifts; relational; equality; bitwise AND/XOR/OR; logical AND; logical OR/nullish coalescing; conditional; assignment; comma. This is a reading aid, not permission to mix every group. Unary negation directly to the left of exponentiation requires parentheses, and unparenthesized mixtures of `??` with `&&` or `||` are syntax errors.

## Logical Operators Return Operands

| Expression | When the right operand runs | Result |
| --- | --- | --- |
| `left && right` | Left is truthy | Left if falsy; otherwise right. |
| `left || right` | Left is falsy | Left if truthy; otherwise right. |
| `left ?? right` | Left is null or undefined | Left if present; otherwise right. |

These operators select values. They do not automatically return booleans. `!` does return a boolean, so `!!value` and `Boolean(value)` express truthiness conversion.

```js
let fallbackCalls = 0;
function fallback() { fallbackCalls += 1; return 'fallback'; }
console.log(0 && fallback());
console.log('ready' || fallback());
console.log(false ?? fallback());
console.log(null ?? fallback());
console.log(fallbackCalls);

// Expected output:
// 0
// ready
// false
// fallback
// 1
```

Use `??` when zero, false, or an empty string is meaningful. Use `||` when every falsy value should select a fallback. Neither is universal. An empty display label may intentionally fall back; an explicit zero retry count usually must survive. See [nullish coalescing](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing).

## Optional Chaining Protects a Specified Boundary

`object?.field` returns undefined when `object` is nullish. `object?.[key]` also skips evaluation of the key in that case. `method?.()` skips a call only when the method is nullish; an existing nonfunction still throws.

```js
let keyReads = 0;
const missing = null;
console.log(missing?.[keyReads++]);
console.log(keyReads);
console.log(missing?.profile.name);
try { console.log((missing?.profile).name); } catch (error) { console.log(error.name); }
try { ({ run: 3 }).run?.(); } catch (error) { console.log(error.name); }

// Expected output:
// undefined
// 0
// undefined
// TypeError
// TypeError
```

The continuous chain short-circuits when its guarded base is nullish. Parentheses end that chain before the following ordinary access. Also, if an existing object lacks `profile`, `object?.profile.name` still throws; write `object?.profile?.name` only if both absences are allowed. An undeclared identifier is not rescued by optional chaining. [MDN: optional chaining](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining).

Do not hide a required dependency behind `?.`. If a payment handler must exist, validate and fail explicitly rather than silently skipping it.

## Assignment and Updates

Assignment returns the assigned value. `a = b = 4` groups as `a = (b = 4)`. A compound assignment such as `target[key()] += 2` evaluates its destination once, reads the old value, computes, then writes. Expanding it carelessly into two property expressions may call `key()` twice.

Logical assignments `&&=`, `||=`, and `??=` additionally skip the write when their condition does not select the right side. This matters for setters and even for `const`: a skipped assignment does not attempt to change the binding.

```js
let count = 5;
console.log(count++);
console.log(++count);
const fixed = 0;
console.log(fixed ??= 9);
let reads = 0;
const limits = { retry: 0 };
function key() { reads += 1; return 'retry'; }
limits[key()] += 2;
console.log(limits.retry, reads);

// Expected output:
// 5
// 7
// 0
// 2 1
```

Prefer standalone updates in business logic. Combining several increments, assignments, and calls in one expression increases the number of intermediate states a reviewer must reconstruct.

## Comparisons and Conditional Expressions

Strict equality `===` does not coerce differing operand types; object equality compares identity. Loose equality `==` follows a conversion algorithm. Relational operators may compare strings lexicographically or convert operands numerically. A chained comparison is not a mathematical range test: `0 < count < 10` compares a boolean to 10 after the first comparison.

```js
const count = 50;
console.log(0 < count < 10);
console.log(0 < count && count < 10);
console.log('12' < '3');
console.log('12' < 3);
console.log(count < 10 ? 'small' : 'large');

// Expected output:
// true
// false
// true
// false
// large
```

The conditional operator evaluates its condition and exactly one branch. Use it for a small value choice. Several dependent actions, exceptions, or state updates deserve statements with named intermediate results.

## Bitwise Operations Have a Narrow Numeric Model

For Number operands, bitwise operations work on 32-bit integer representations. They discard fractional parts and wrap large values into that range. Unsigned right shift `>>>` produces an unsigned 32-bit Number; signed right shift `>>` preserves a sign bit. Shift counts use their low five bits for Number shifts.

```js
const READ = 1;
const WRITE = 2;
const EXECUTE = 4;
const permissions = READ | WRITE;
console.log((permissions & READ) !== 0);
console.log((permissions & EXECUTE) !== 0);
console.log(permissions & ~WRITE);
console.log(-1 >>> 0);
console.log(2 ** 32 | 0);
console.log(1 << 32);

// Expected output:
// true
// false
// 1
// 4294967295
// 0
// 1
```

Bit masks suit a deliberately bounded flag schema. They are a poor replacement for safe-integer validation or general truncation. BigInt supports its own bitwise operations without Number's 32-bit truncation, but it has no unsigned right shift. The [ECMAScript expression algorithms](https://tc39.es/ecma262/multipage/ecmascript-language-expressions.html) define these operations separately.
