# Type Conversion and Coercion

A query parameter arrives as the string "25", while a page-size calculation needs a Number. Conversion creates a value in the required type. Validation decides whether the original input and converted result meet the application's rules. Confusing those jobs allows values such as true, an empty string, or an unsafe integer to become apparently valid inputs.

JavaScript also converts values implicitly. Addition, comparisons, conditions, and property keys each request particular conversions. The useful question is which operation requests which type, not whether coercion is always good or always bad.

## Learning Objectives

- Predict String, Number, Boolean, and BigInt conversion results.
- Distinguish full-value conversion from prefix parsing.
- Trace loose equality and relational comparisons from operand types.
- Explain object-to-primitive hints and conversion side effects.
- Preserve identity and original inputs while deriving normalized values.
- Implement bounded pagination and exact boolean parsing with regression assertions.

## Prerequisites and Running Guide

Read [Variables and Data Types](../chapter-02/01-introduction.md) and [Operators and Expressions](../chapter-03/01-introduction.md). Recognize primitive types, object identity, property access, calls, and short-circuit evaluation. Small functions group reusable steps; return supplies a result. Later foundation chapters develop functions, arrays, objects, and exceptions systematically.

Run each JavaScript block independently with Node.js 20 or newer. Expected-output comments specify deliberate console output; assertions use the built-in node:assert/strict module.

```js
const raw = '25';
const parsed = Number(raw);
console.log(typeof raw, typeof parsed);
console.log(parsed + 5);
console.log(raw + 5);
console.log(Number(true));

// Expected output:
// string number
// 30
// 255
// 1
```

The original raw binding still holds a string. Number(true) succeeding is a language conversion rule; it does not make true a valid query parameter.

## Reading and Practice Route

Start with the [conversion rules](02-theory.md), follow the [execution diagrams](03-internal-working.md), and inspect the [production parsers](04-production-examples.md). Attempt the [six challenges](06-exercises-coding-challenges.md) before consulting their solutions, then test your reasoning with the [sixteen MCQs](07-mcqs.md).

Companion programs live in `code/volume-1/chapter-04/`:

```sh
node code/volume-1/chapter-04/example-00-coercion-model.js
node code/volume-1/chapter-04/example-01-query-parser.js
node code/volume-1/chapter-04/example-02-boolean-env.js
node code/volume-1/chapter-04/example-03-coercion-challenges.js
node code/volume-1/chapter-04/example-04-edge-cases.js
```

The chapter treats query/environment values as data. It does not evaluate input as JavaScript or assume an arbitrary object is safe to coerce.
