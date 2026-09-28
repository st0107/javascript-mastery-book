# Volume I: JavaScript Fundamentals

Volume I builds the language foundation used in the later volumes: values and bindings, expressions, validation, control flow, functions, ownership, collections, errors, and modules. Eleven chapters each contain eleven authored sections, including worked exercises, MCQs, production examples, debugging notes, and references.

## Chapters

1. [Introduction to JavaScript](chapter-01/01-introduction.md)
2. [Variables and Data Types](chapter-02/01-introduction.md)
3. [Operators and Expressions](chapter-03/01-introduction.md)
4. [Type Conversion and Coercion](chapter-04/01-introduction.md)
5. [Strings, Numbers, and Dates](chapter-05/01-introduction.md)
6. [Control Flow](chapter-06/01-introduction.md)
7. [Functions and Callbacks](chapter-07/01-introduction.md)
8. [Objects and Data Ownership](chapter-08/01-introduction.md)
9. [Arrays and Collections](chapter-09/01-introduction.md)
10. [Errors and Debugging](chapter-10/01-introduction.md)
11. [Modules and Execution Modes](chapter-11/01-introduction.md)

## Reading Path

Read the [preface](preface.md), then follow the chapters in order. Chapters 1–6 introduce the language and common data boundaries. Chapter 7 establishes function and callback contracts; Chapters 8–9 explain the objects and collections those functions exchange. Chapters 10–11 make failure handling and execution mode explicit.

The [execution-model companion](chapter-01-execution-model.md) can be read after Chapter 7, then revisited after object ownership. It connects calls, bindings, retained state, and defensive snapshots. After Chapter 11, continue with [Lexical Scope and Closures](../volume-2/chapter-01/01-introduction.md) in Volume 2.

Use the [complete section summary](SUMMARY.md) for targeted review. Attempt each exercise before reading its solution and explain an MCQ result before checking the answer.

## Running and Checking Examples

Use Node.js 20 or later for the documented language baseline. Choose a currently supported runtime for deployment. Standalone assertion programs live in `code/volume-1`; the execution-model companion uses `code/chapter-01`. Chapter 11 uses explicit ES module and CommonJS files and keeps its library dependencies in the same directory.

```bash
npm run examples:test
npm run examples:validator:test
npm run docs:examples:test
```

The first command runs every companion, the second checks the validator's failure handling, and the third executes Volume 1's documented JavaScript blocks in fresh processes and verifies their output, local link targets, and embedded diagram sources. Expected-output comments use `(none)` for a library that intentionally prints nothing.

## Publishing

All chapter sections, the preface, and the execution-model companion are included in both site navigation systems and the PDF/EPUB source lists. Build the website with `npm run docs:build`. PDF and EPUB generation additionally require Pandoc; PDF generation also requires a suitable LaTeX engine.
