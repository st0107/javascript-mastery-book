# Strings, Numbers, and Dates

## Introduction

A shipping label, a price, and an expiry time all look simple in a UI. Their storage contracts are different. A label needs a definition of ?character?; a price needs units and a rounding policy; an expiry needs a time zone and boundary policy. This chapter connects those choices to the JavaScript values that implement them.

The running examples format bounded integer cents and check a UTC access window. They reject unsupported input instead of relying on convenient coercion. The examples are deliberately small enough to inspect line by line.

## Learning Objectives

By the end, you can:

- Distinguish UTF-16 code units, Unicode code points, and grapheme clusters.
- Use immutable string transformations and bounded regular-expression validation.
- Explain finite values, safe integers, binary floating-point rounding, and BigInt.
- Separate an instant from its local calendar presentation.
- Validate canonical UTC timestamps and half-open time windows.
- Test negative values, overflow, malformed dates, and exact boundary instants.

## Prerequisites

Read [Conversion and Coercion](../chapter-04/01-introduction.md). You should recognize primitive values, strict equality, logical expressions, and basic function calls. A function declaration groups a calculation under a name; `return` sends its result to the caller. The full functions chapter follows Control Flow.

Examples use arrays as small lists and `throw` to reject invalid arguments. These constructs receive dedicated treatment later in this volume; their local purpose is explained when used here.

## Running Guide

Use Node.js 20 or later from the repository root:

```sh
node code/volume-1/chapter-05/example-00-value-model.js
node code/volume-1/chapter-05/example-01-money-formatting.js
node code/volume-1/chapter-05/example-02-date-window.js
node code/volume-1/chapter-05/example-03-text-number-challenges.js
```

JavaScript fences run independently. Their output is fixed: dates use UTC and numeric examples use an explicit locale. Production applications must select their own display locale; a formatted price is presentation text, not a storage format.

## First Experiment

```js
const label = 'A\u{1F680}';
const amountCents = 1299;
const instant = new Date('2026-07-06T10:00:00.000Z');

console.log(label.length, Array.from(label).length);
console.log(amountCents / 100);
console.log(instant.toISOString());
// Expected output:
// 3 2
// 12.99
// 2026-07-06T10:00:00.000Z
```

The rocket uses two code units but one code point. Dividing cents produces a Number suitable for the bounded formatter, while storage remains integer cents. The ISO string explicitly identifies UTC.

Continue with [theory](02-theory.md), then the [internal model](03-internal-working.md).
