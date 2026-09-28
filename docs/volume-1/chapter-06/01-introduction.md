# Control Flow

## Introduction

Control flow determines which operations execute, in what order, and when execution stops. An import can skip an invalid row, stop on a fatal record, or process a normal record. Those decisions look like small `if` statements, but their order encodes a business policy.

This chapter uses a synchronous job batch and an order-state dispatcher. The job batch validates each record, gives a valid fatal marker precedence over cancellation, and returns fresh result records. The dispatcher permits payment before shipping and rejects unsupported events. Neither example performs external work or claims retry, persistence, or asynchronous shutdown behavior.

## Learning Objectives

You will learn to:

- Choose branches, switch dispatch, and value-selecting conditional expressions.
- Trace `for`, `while`, and `do...while`, including their update and test positions.
- Distinguish iterable values from enumerable property keys.
- Apply `break`, `continue`, `return`, and labels to the correct target.
- State a loop invariant and a termination argument.
- Validate records before reading fields and preserve deliberate policy precedence.
- Test empty batches, malformed rows, exact limits, and early exits.

## Prerequisites

Read [Operators and Expressions](../chapter-03/01-introduction.md), [Conversion and Coercion](../chapter-04/01-introduction.md), and [Strings, Numbers, and Dates](../chapter-05/01-introduction.md). You should recognize booleans, strict equality, short-circuiting, block-scoped variables, and safe integer checks.

Small examples use functions as named groups of statements and arrays as ordered lists. `return` exits a function with a value; `push` appends to an array. The next chapter systematically teaches functions and callbacks, followed by objects and arrays.

## Running Guide

Run each companion with Node.js 20 or later from the repository root:

```sh
node code/volume-1/chapter-06/example-00-control-flow-model.js
node code/volume-1/chapter-06/example-01-job-runner.js
node code/volume-1/chapter-06/example-02-switch-dispatch.js
node code/volume-1/chapter-06/example-03-control-flow-challenges.js
```

Each JavaScript fence is independent and has exact expected output. Companions include assertions for policy and failure cases.

## First Trace

```js
const priorities = ['normal', 'cancelled', 'normal', 'fatal', 'normal'];
let processed = 0;
for (const priority of priorities) {
  if (priority === 'fatal') break;
  if (priority === 'cancelled') continue;
  processed++;
}
console.log(processed);
// Expected output:
// 2
```

The cancellation skips one iteration. The fatal entry exits the loop, so the final normal entry is never visited. Read [theory](02-theory.md) to see how each control statement chooses its next step.
