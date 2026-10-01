# Interview Perspective

## Explain Conversion Before Quoting an Output

An answer is strongest when it identifies input types, names the operation, traces its requested conversions, and only then states the result. This gives you a method when an interviewer changes `[]` to `{}` or a Number to a BigInt.

## Does Explicit Conversion Validate an Input?

No. Number(true) is 1 and Number('') is 0. Both are valid language conversions but may violate a query schema. A parser should specify source type, accepted syntax, representation, safe range, domain range, and missing-value policy. The [pagination example](04-production-examples.md) checks all of those.

A follow-up may ask why Number.isInteger is insufficient. It accepts integral Numbers outside the safe-integer range; the original decimal digits may already have rounded. Number.isSafeInteger checks the resulting integer range, and grammar/type checks ensure the source itself was acceptable.

## Why Is an Empty Array Truthy but Loosely Equal to False?

Boolean conversion sees an ordinary object and returns true without calling conversion methods. Loose equality applies a different algorithm: false becomes 0; the array becomes an empty string; the string becomes 0. The final numeric equality is true. Do not describe this as the array being "both true and false."

```js
const array = [];
console.log(Boolean(array));
console.log(array == false);
console.log(array === false);
console.log(array == []);
console.log(array == array);

// Expected output:
// true
// true
// false
// false
// true
```

The final two cases compare object identity. Loose equality does not convert two objects just because they look alike.

## What Does the Plus Operator Need to Know?

Binary + obtains primitives and then asks whether either is a string. If so, it concatenates; otherwise it adds same-type numeric values. Subtraction does not have the concatenation branch. For `2 + 3 + '4'`, left grouping first produces 5, then "54". For `'2' + 3 + 4`, both operations concatenate and produce "234".

The follow-up is order: operand expressions are evaluated left to right before the + operation requests primitive conversion. Conversion itself can call user code and throw.

## Why Can Null Compare Greater Than or Equal to Zero but Not Equal It?

Relational comparison converts null numerically to zero. Loose equality's null/undefined rule does not equate null with Number zero. Different operators request different algorithms. It is inaccurate to explain all comparisons as "convert both sides to numbers."

```js
console.log(null >= 0);
console.log(null == 0);
console.log(undefined < 0);
console.log(undefined >= 0);

// Expected output:
// true
// false
// false
// false
```

Undefined converts to NaN for these relational comparisons. That also explains why `>=` is not universally equivalent to negating `<`.

## Does Strict Equality Mean Every Value Equals Itself?

No: NaN === NaN is false. Object.is considers NaN equal to itself but distinguishes positive and negative zero. Neither operation performs deep structural equality for objects. Choose the equality semantics required by the domain, not whichever name sounds strongest.

## Why Can BigInt Fail to Recover a Large Integer?

If text passed through Number first, the precise digits may already have been lost. BigInt converts that rounded Number. For a large integer identifier, keep the string when textual identity matters, or parse directly to BigInt when arithmetic is required. BigInt is not a blanket fix for decimal fractions.

## What Is the Object Conversion Protocol?

First inspect Symbol.toPrimitive. A callable method receives "string", "number", or "default" and must return a primitive. Without it, ordinary fallback order depends on the hint: toString first for string, valueOf first for number. Default behaves like number for ordinary objects, with built-in exceptions such as Date. Boolean conversion does not use this protocol.

In production, a named conversion method may communicate units and effects better than an implicit hook. Reject arbitrary objects at a string-input boundary before attempting Number conversion.

## Worked Design Prompt

An endpoint receives pageSize as an unknown value. A candidate proposes `parseInt(value, 10) || 25`. Identify four failures: suffixes are accepted, zero and missing data collapse into the same fallback, nonstrings are coerced, and there is no safe/domain upper bound. A complete replacement accepts one documented string grammar, defaults only missing input, checks a safe Number and the page-size bound, and returns an error for supplied invalid data.

Test "25", "0", "25px", "1e2", true, null, undefined, the maximum allowed page size, and the next larger value. Each result should follow the stated contract without relying on accidental coercion.

Consult the [equality rules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Equality) when tracing a new mixed-type case; rehearse the [exercise solutions](06-exercises-coding-challenges.md) as examples of actual boundary design.
