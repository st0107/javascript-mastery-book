# Iterators and Generators

## Introduction

[Descriptors, Immutability, and Proxies](../chapter-05/01-introduction.md) described objects through the operations they permit. Iteration is another operation contract: a consumer asks a producer for the next result, rather than requiring every result to exist in an array first.

That contract is useful for reading selected records, producing bounded batches, traversing structures, and stopping work once a consumer has enough information. A generator function makes a stateful producer easier to write: local variables and control flow survive a suspension at `yield`. The producer still runs synchronously when the consumer resumes it.

```js
'use strict';
const reads = [];
function* queuedIds(rows) {
  for (const row of rows) {
    reads.push(row.id);
    if (row.state === 'queued') yield row.id;
  }
}

const rows = [
  { id: 'job-1', state: 'done' },
  { id: 'job-2', state: 'queued' },
  { id: 'job-3', state: 'queued' }
];
const pending = queuedIds(rows);
console.log(reads.length);
console.log(pending.next().value);
console.log(reads.join(','));
console.log([...pending].join(','));
console.log(pending.next().done);
// Expected output:
// 0
// job-2
// job-1,job-2
// job-3
// true
```

Calling the function creates a generator without scanning the rows. Its first `next()` scans until it finds a queued row. Spreading that same generator consumes only the remaining results. The original array is still retained and the row objects are still shared; laziness did not create a snapshot or make the source disappear.

The chapter treats these as API design decisions: whether traversal can restart, when validation happens, how much work one request can trigger, who owns yielded values, and how resources are released if consumption stops early.

## Learning Objectives

By the end of this chapter, you should be able to:

- Distinguish an iterable, an iterator, an iterable iterator, and a generator function.
- Explain result objects, completion values, and why `done` determines whether a value enters a loop body.
- Design fresh cursors for repeatable traversals and recognize single-use cursors.
- Trace suspended generator state through `next`, `return`, and `throw`.
- Send values into suspended `yield` expressions and explain the first `next` argument.
- Use `yield*` to delegate traversal and capture a delegate's completion value.
- Distinguish consumer-driven closing from producer failures and normal exhaustion.
- Place acquisition and cleanup so an unstarted or partially consumed generator has a clear lifecycle.
- Build lazy transformations with bounded reads and explicit value ownership.
- Explain retained memory, synchronous work, mutation during traversal, and runtime compatibility.

## Prerequisites

Review [functions and callbacks](../../volume-1/chapter-07/01-introduction.md), [arrays and collections](../../volume-1/chapter-09/01-introduction.md), [errors and `finally`](../../volume-1/chapter-10/01-introduction.md), and [closures](../chapter-01/01-introduction.md). Familiarity with computed property names and `Symbol.iterator` is helpful; the protocol is developed from first principles in [Theory](02-theory.md).

## Reading and Running the Chapter

Read [Theory](02-theory.md) and the [execution and memory traces](03-internal-working.md), then examine the [batched export and managed cursor](04-production-examples.md). Attempt the [six exercises](06-exercises-coding-challenges.md) before opening their solutions. Use the [interview questions](05-interview-perspective.md), [MCQs](07-mcqs.md), and [revision sheet](08-revision-summary.md) to check your explanations.

Every JavaScript fence is an independent Node.js 20-or-later program. The chapter uses synchronous iteration and generator syntax supported by that baseline; it does not require the newer global `Iterator` helper APIs. Async iteration and scheduling receive their own treatment in Volume 3.

```bash
node code/volume-2/chapter-06/example-00-iterator-model.js
node code/volume-2/chapter-06/example-01-batched-export.js
node code/volume-2/chapter-06/example-02-managed-cursor.js
node code/volume-2/chapter-06/example-03-iterator-challenges.js
node code/volume-2/chapter-06/example-04-edge-cases.js
npm run docs:volume2:test -- --chapter 06
```

The next chapter, **Functional Programming in JavaScript**, builds on these traversal contracts to separate transformations, effects, and composition.
