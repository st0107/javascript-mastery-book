# Modules and Execution Modes

## Introduction

Splitting a program into files creates a new question: how does one file obtain a value from another? Modules answer that question with explicit interfaces and a loader. A module can hide a helper, expose a calculation, and declare its dependencies. Understanding its execution mode also explains why a snippet works in a browser console but fails in a Node.js file.

```js
// Runtime: Node.js ES module
import assert from 'node:assert/strict';
const result = [2, 4, 6].map(value => value / 2);
assert.deepEqual(result, [1, 2, 3]);
console.log(JSON.stringify(result));
console.log(this === undefined);
// Expected output:
// [1,2,3]
// true
```

The import selects a Node built-in dependency. The array remains local to this module. At module top level, `this` is undefined; moving the same expression to another execution mode can change its meaning.

## Learning Objectives

- Identify browser classic scripts, browser modules, Node CommonJS, and Node ES modules.
- Select a file extension or package setting deliberately.
- Define named and default exports and import them with the corresponding syntax.
- Explain live bindings, shared module state, and shallow object ownership across an interface.
- Trace resolution, linking, and evaluation without treating imports as textual substitution.
- Separate reusable library definitions from application startup effects.
- Diagnose missing files, mismatched exports, cycles, and strict-mode errors.
- Recognize dynamic import and top-level await while leaving promise scheduling to Volume 3.

## Prerequisites

Read [Functions and Callbacks](../chapter-07/01-introduction.md), [Objects and Data Ownership](../chapter-08/01-introduction.md), [Arrays and Collections](../chapter-09/01-introduction.md), and [Errors and Debugging](../chapter-10/01-introduction.md). You should be able to return a value, validate an argument, and distinguish mutation from assignment.

## Running the Examples

The baseline is Node.js 20+. Blocks marked `Runtime: Node.js ES module` must run as `.mjs` files or through `node --input-type=module`; other `js` blocks use CommonJS. The examples do not depend on automatic format detection, which has changed across Node releases.

This chapter is a self-contained module project in `code/volume-1/chapter-11`. Relative imports in its snippets refer to files in that folder. Keep those files together, or run the assertion entries from the repository root:

```bash
node code/volume-1/chapter-11/example-00-module-model.mjs
node code/volume-1/chapter-11/example-01-quote.mjs
node code/volume-1/chapter-11/example-02-report.mjs
node code/volume-1/chapter-11/example-03-module-challenges.mjs
node code/volume-1/chapter-11/example-04-commonjs.cjs
```

Library files intentionally produce no output when run alone. Their entries import and exercise them. Browser examples are described separately; a Node built-in import cannot run in a browser unchanged. Start with [Theory](02-theory.md).
