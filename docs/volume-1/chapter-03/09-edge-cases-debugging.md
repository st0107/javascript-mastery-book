# Edge Cases and Debugging

## Start With the Skipped Operation

When a fallback unexpectedly runs, inspect the left value and its type. Zero retries, a false flag, and an empty label are all falsy but may be valid settings. Defaulting is a domain decision, not a repair for every suspicious value.

```js
for (const value of [0, false, '', null, undefined]) {
  console.log(JSON.stringify([typeof value, value || 'default', value ?? 'default']));
}

// Expected output:
// ["number","default",0]
// ["boolean","default",false]
// ["string","default",""]
// ["object","default","default"]
// ["undefined","default","default"]
```

JSON makes an empty string visible here. It does not preserve undefined values in every position, so include typeof when that distinction matters.

## Optional Chains Do Not Catch Exceptions

```js
const broken = { get profile() { throw new Error('profile unavailable'); } };
try { console.log(broken?.profile?.name); }
catch (error) { console.log(error.message); }
const partial = {};
try { console.log(partial?.profile.name); }
catch (error) { console.log(error.name); }
console.log(partial?.profile?.name);

// Expected output:
// profile unavailable
// TypeError
// undefined
```

In the first case the root exists, so the getter runs and throws. In the second only the root is guarded; the missing profile reaches an ordinary property access. The third explicitly permits both absences. Decide whether missing profile data is actually acceptable before adding another optional boundary.

## Compound Assignment Is Not Text Substitution

```js
const trace = [];
let stored = 5;
const record = {
  get count() { trace.push('read'); return stored; },
  set count(value) { trace.push('write'); stored = value; }
};
record.count ??= 9;
console.log(trace.join(','));
trace.length = 0;
record.count = record.count ?? 9;
console.log(trace.join(','));

// Expected output:
// read
// read,write
```

The second form writes even when no fallback was needed. A setter may persist data, invalidate a cache, or reject a change. Likewise, expanding `record[key()] += 1` by repeating `key()` may choose a different property or repeat work.

## Range Tests and Numeric Shortcuts

```js
const count = 25;
console.log(0 < count < 10);
console.log(count > 0 && count < 10);
console.log(2147483648 | 0);
console.log(Math.trunc(2147483648.75));
console.log(-5 % 3);

// Expected output:
// true
// false
// -2147483648
// 2147483648
// -2
```

The chained comparison becomes `true < 10`. The bitwise expression wraps to signed 32-bit range; Math.trunc discards a fraction without that wrapping. Neither validates an application's maximum count. Remainder may be negative; a nonnegative-modulo formula is a separate domain choice.

## Syntax Errors Need a Parsing Diagnosis

An unparenthesized mixture such as `a ?? b || c` is invalid syntax. Choose `(a ?? b) || c` or `a ?? (b || c)` according to the intended policy; they can differ when a is falsy but present. Likewise, write `-(2 ** 2)` or `(-2) ** 2` rather than an unparenthesized unary minus to the left of exponentiation. A same-file try statement cannot execute when that file fails to parse.

## A Reproducible Debugging Procedure

1. Preserve the original inputs; inspecting a later mutated object can mislead.
2. Parenthesize grouping without changing operand order.
3. Annotate each operand's value and type.
4. Record getter, function, and setter calls in a local trace array.
5. Stop at the first throw and mark skipped operands.
6. Assert the smallest failing case and its neighboring valid case.

For the [feature gate](04-production-examples.md), test an enabled member with a missing list and with one matching ID. Both must return booleans and neither may throw. The companion is `code/volume-1/chapter-03/example-04-edge-cases.js`.

The [optional-chaining reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining) documents continuous-chain boundaries; the [precedence reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_precedence) separates grouping from evaluation.
