# Variables and Data Types

A variable name identifies a binding; a binding holds a value. That value can be a primitive, such as a string, or an object identity shared with other bindings. Keeping these three ideas separate explains why `const` prevents reassignment while an object property can still change.

This chapter follows one record through declaration, initialization, aliasing, mutation, and replacement. It also develops the checks needed when unknown input reaches a function: a `typeof` result is evidence about a value, not a complete business contract.

## Learning Objectives

- Compare the scope, initialization, reassignment, and redeclaration behavior of `var`, `let`, and `const`.
- Identify the seven primitive types and distinguish them from objects.
- Predict a temporal-dead-zone read, including the `typeof` exception.
- Explain dynamic typing without calling JavaScript untyped.
- Trace shared object identity, parameter reassignment, and mutation.
- Build a boundary normalizer that returns a new, explicitly shaped record.
- Explain reachability without claiming that scope exit forces immediate collection.

## Prerequisites and Running Guide

Read [Introduction to JavaScript](../chapter-01/01-introduction.md). Know that a function receives argument values and returns a result, and that an object groups named properties between braces. This chapter explains the value behavior used by those constructs; [Functions and Callbacks](../chapter-07/01-introduction.md) and [Objects and Data Ownership](../chapter-08/01-introduction.md) develop their syntax and API design further.

Run each example independently in Node.js 20 or later. Companion programs contain assertions and expected-output comments:

```sh
node code/volume-1/chapter-02/example-01-const-object-mutation.js
node code/volume-1/chapter-02/example-02-type-guards.js
node code/volume-1/chapter-02/example-03-binding-challenges.js
```

The baseline is for reproducible examples, not a deployment lifecycle recommendation. Files here are CommonJS-compatible and use strict mode explicitly. Do not assume a browser console's top-level behavior is identical to a Node file or an ECMAScript module.

## First Observation

```js
'use strict';

const shipment = { status: 'queued' };
shipment.status = 'ready';
console.log(shipment.status);
try {
  shipment = { status: 'sent' };
} catch (error) {
  console.log(error.name);
}

// Expected output:
// ready
// TypeError
```

The first assignment targets an object property. The second targets the immutable binding. Read [the theory](02-theory.md), then use [the diagrams](03-internal-working.md) to draw the difference before attempting the [exercises](06-exercises-coding-challenges.md).
