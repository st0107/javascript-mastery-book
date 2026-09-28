# Errors and Debugging

## Introduction

A program can reject invalid input, fail because a dependency throws, or produce the wrong answer without throwing anything. Those situations need different responses. Error handling controls failure propagation; debugging gathers evidence about the cause; assertions state behavior the program must satisfy.

This chapter develops those skills through a bounded JSON import parser and a synchronous resource helper. The parser distinguishes malformed JSON from invalid domain data. The resource helper calls cleanup exactly once after successful acquisition and preserves both failures when operation and cleanup fail together.

## Learning Objectives

By the end, you can:

- Distinguish source syntax, runtime exceptions, and logical defects.
- Throw an Error, choose an appropriate built-in type, and preserve a cause.
- Trace try, catch, finally, rethrow, and pending return behavior.
- Handle expected failures without swallowing unrelated defects.
- Explain why a synchronous catch does not surround a later callback invocation.
- Choose explicit result values or exceptions for an API contract.
- Reduce a failure to a deterministic reproduction and inspect a call stack.
- Write assertions for results, failure types, side effects, and cleanup.

## Prerequisites

Read [Functions and Callbacks](../chapter-07/01-introduction.md), [Objects](../chapter-08/01-introduction.md), and [Arrays and Collections](../chapter-09/01-introduction.md). You should understand function calls, object identity, arrays, and loop exits.

Examples use Node's built-in assertion module. `require('node:assert/strict')` loads it in the CommonJS companion scripts. The next chapter explains module and execution modes. No package installation is needed.

## Running Guide

Use Node.js 20 or later:

```sh
node code/volume-1/chapter-10/example-00-error-model.js
node code/volume-1/chapter-10/example-01-import-parser.js
node code/volume-1/chapter-10/example-02-safe-cleanup.js
node code/volume-1/chapter-10/example-03-error-challenges.js
```

Each JavaScript example runs independently. It catches intentional errors and prints stable names or application-defined messages, not engine-specific stack strings.

## First Experiment

```js
function requireCount(value) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError('Count must be a nonnegative safe integer.');
  }
  return value;
}
try {
  requireCount(-1);
  console.log('unreachable');
} catch (error) {
  console.log(error.name);
}
console.log('continued after handling');
// Expected output:
// RangeError
// continued after handling
```

Throwing skips the remainder of the protected operation. The catch handles the failure; execution then continues after the construct. It does not resume at the statement that threw.

Read [theory](02-theory.md), then follow the [execution model](03-internal-working.md).
