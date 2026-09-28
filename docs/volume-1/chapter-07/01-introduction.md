# Functions and Callbacks

## Introduction

A function packages an operation behind a name or another function value. Its caller supplies arguments; a particular invocation creates local parameter bindings, executes a body, and returns a value or throws. This lets a program reuse a rule while keeping the work of each call understandable.

```js
'use strict';
function pageCount(total, pageSize) {
  return Math.ceil(total / pageSize);
}
const count = pageCount;
console.log(count(52, 25));
console.log(count === pageCount);
// Expected output:
// 3
// true
```

`count` contains the same function value. Assigning a function does not call it. The parentheses in `count(52, 25)` perform a call. This introductory example assumes valid numbers; the production section turns those assumptions into explicit validation.

## Learning Objectives

- Distinguish a function value, its declaration or expression, and an invocation.
- Trace arguments, parameters, local variables, return values, and thrown errors.
- Explain why parameter reassignment differs from mutation of an argument object.
- Use defaults and rest parameters without silently changing the meaning of `null`, zero, or missing input.
- Select ordinary functions, arrows, and methods according to their call contract.
- Pass a callback with the correct signature and explain when the receiving function invokes it.
- Separate deterministic calculation from logging, mutation, and other effects.
- Trace recursion and choose an iterative implementation when stack depth is unbounded.

## Prerequisites

Read [Variables and Data Types](../chapter-02/01-introduction.md), [Operators and Expressions](../chapter-03/01-introduction.md), and [Control Flow](../chapter-06/01-introduction.md). Here an object literal is a small record of named values, and an array is an ordered collection; the following chapters teach these structures in detail.

## Running the Examples

Each `js` block is an independent Node.js 20+ program with exact expected output. The scripts under `code/volume-1/chapter-07` add assertions for normal and failing calls:

```bash
node code/volume-1/chapter-07/example-00-function-model.js
node code/volume-1/chapter-07/example-01-batch-planning.js
node code/volume-1/chapter-07/example-02-label-callbacks.js
node code/volume-1/chapter-07/example-03-function-challenges.js
```

Read [Theory](02-theory.md), trace [Internal Working](03-internal-working.md), and attempt the [exercises](06-exercises-coding-challenges.md). Deep closure behavior and receiver selection are developed in Volume 2; this chapter supplies the function vocabulary those lessons require.
