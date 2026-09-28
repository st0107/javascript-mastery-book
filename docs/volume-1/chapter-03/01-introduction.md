# Operators and Expressions

An expression computes a value. It may also call a function, read a getter, or change state. Operators determine how those actions combine. A short expression such as `options.retries ?? 3` therefore encodes a policy: use the supplied value unless it is `null` or `undefined`.

This chapter develops a precise reading method: group the expression, evaluate the required operands, apply the operator's conversion rules, and account for effects. It distinguishes arithmetic from concatenation, precedence from evaluation order, and absence from falsiness.

## Learning Objectives

- Predict arithmetic, comparison, assignment, and bitwise results.
- Trace operand evaluation separately from operator grouping.
- Explain which operand `&&`, `||`, and `??` return and when they skip work.
- Place optional chaining where absence is actually allowed.
- Recognize assignment effects and prefix/postfix update results.
- Build defaults and feature gates with explicit validation contracts.

## Prerequisites and Running Guide

Read [Variables and Data Types](../chapter-02/01-introduction.md). Recognize primitive values, object references, property access, and `let` versus `const`. Examples use small functions and arrays: a function groups reusable operations, `return` supplies its result, and an array is an ordered collection. Later foundation chapters develop those constructs systematically.

Each JavaScript block is an independent program with exact output. Run a copied block with Node.js 20 or newer; assertion examples use its built-in `node:assert/strict` module.

```js
const supplied = { retries: 0, enabled: false };
console.log(supplied.retries ?? 3);
console.log(supplied.retries || 3);
console.log(supplied.enabled ?? true);

// Expected output:
// 0
// 3
// false
```

The first expression preserves zero; the second treats it as falsy. Neither validates the domain: `-1 ?? 3` still produces `-1`. Defaults and validation solve different problems.

Study [theory](02-theory.md), follow the [execution traces](03-internal-working.md), then compare the [production contracts](04-production-examples.md). Complete the [six exercises](06-exercises-coding-challenges.md) before using the [MCQs](07-mcqs.md).

Companion programs live in `code/volume-1/chapter-03/`:

```sh
node code/volume-1/chapter-03/example-00-operator-model.js
node code/volume-1/chapter-03/example-01-nullish-config.js
node code/volume-1/chapter-03/example-02-feature-gate.js
node code/volume-1/chapter-03/example-03-operator-challenges.js
node code/volume-1/chapter-03/example-04-edge-cases.js
```

When an expression controls access or resource use, a reviewer should be able to state which values pass and which operations run.
