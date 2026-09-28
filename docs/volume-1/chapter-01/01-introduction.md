# Introduction to JavaScript

JavaScript is a programming language used inside many hosts: browser pages, browser workers, Node.js processes, and other runtimes. Its core rules stay recognizable across those environments, but the available capabilities differ. A calculation can run unchanged in a page and a server; code that reads `document` needs a host that supplies a document.

This chapter establishes three layers you should keep separate:

| Layer | Responsibility | Example |
| --- | --- | --- |
| Language | Meaning of declarations, values, expressions, and function calls | `const total = 1200 + 300` |
| Engine | Implements execution, representation, compilation, and garbage collection | V8, SpiderMonkey, JavaScriptCore |
| Host | Supplies loading, scheduling, I/O, and environment-specific capabilities | Browser document APIs; Node file APIs |

A runtime usually combines an engine with host facilities. A package manager, bundler, or framework is another part of the ecosystem; none changes the meaning of a standard addition expression by itself.

## Learning Objectives

After working through the examples, you should be able to:

- Run a small JavaScript program and predict its output.
- Separate a language rule from an engine implementation and a host API.
- Explain why standardization, deployment support, and proposal maturity are different questions.
- Describe a conceptual source-to-execution pipeline without claiming every engine uses one design.
- Detect the capability an operation needs and design a testable boundary around it.
- Share a validated calculation between hosts while keeping server-side authority.
- Diagnose an unavailable host API before changing the calculation.

## Prerequisites and Running the Examples

No prior JavaScript knowledge is required for the first example. Later sections use short named functions: a function receives inputs between parentheses and returns an output with `return`. An object groups named values between braces. Those constructs are introduced as needed; the later fundamentals chapters develop them systematically.

Use a text editor and Node.js 20 or later. The examples deliberately use features available in Node 20; this is a reproducibility baseline, not a recommendation to deploy an unsupported runtime. Save an example in a `.js` file in this repository and run it from a terminal:

```sh
node code/volume-1/chapter-01/example-01-runtime-detection.js
node code/volume-1/chapter-01/example-02-shared-validation.js
```

Every JavaScript block in this chapter runs independently. Expected-output comments show the exact printed text. `console.log` asks the host to print a value; it is not part of the ECMAScript language specification.

```js
'use strict';

const bookTitle = 'JavaScript';
const copies = 3;
const centsPerCopy = 1500;
console.log(bookTitle);
console.log(copies * centsPerCopy);

// Expected output:
// JavaScript
// 4500
```

Read the first line as a strict-mode directive, the three declarations as names for values, and the two final statements as printing requests. Prices are integer cents here; validation and safe ranges are introduced in the production section.

## Reading Path

Start with [theory](02-theory.md), then follow the [execution trace and diagrams](03-internal-working.md). Apply the model in [production examples](04-production-examples.md) and the [six exercises](06-exercises-coding-challenges.md). Use [the revision sheet](08-revision-summary.md) after attempting the [MCQs](07-mcqs.md).

The separate [execution-model companion](../chapter-01-execution-model.md) develops function calls and lexical environments after you have studied variable and function basics. It preserves a stable reading destination for later closure material; it is not a competing Chapter 1.
