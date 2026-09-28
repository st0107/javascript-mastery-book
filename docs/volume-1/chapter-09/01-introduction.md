# Arrays and Collections

Arrays model ordered sequences. Sets model uniqueness and membership. Maps associate keys with values without forcing every key into a string. Choosing among them makes operations and ownership clearer: an invoice has ordered lines, a deduplication step has seen IDs, and a catalog has a product lookup.

This chapter connects collection syntax to behavior that affects real programs: holes differ from stored undefined, copying an array does not copy its records, callbacks receive more arguments than just a value, and sorting needs an explicit numeric comparator.

## Learning Objectives

- Read and update indexed arrays while understanding length and holes.
- Choose map, filter, reduce, find, some, every, and ordinary loops by the required result.
- Distinguish mutation from copying and explain shallow ownership.
- Sort validated numeric values and preserve equal-key ordering.
- Create arrays with Array.from, destructuring, and spread.
- Use Set/Map membership, identity, insertion order, and SameValueZero equality.
- Build a bounded, validated collection pipeline with explicit output ownership.

## Prerequisites and Running Guide

Read [Control Flow](../chapter-06/01-introduction.md), [Functions and Callbacks](../chapter-07/01-introduction.md), and [Objects](../chapter-08/01-introduction.md). Be comfortable with loops, callbacks, property access, reference identity, and shallow object copying.

Every JavaScript block runs independently with Node.js 20 or newer. This baseline includes copying methods such as toSorted. Assertions use node:assert/strict; expected-output comments specify deliberate console output.

```js
const ids = ['p2', 'p1', 'p2'];
const unique = [...new Set(ids)];
const stock = new Map([['p1', 8], ['p2', 3]]);
console.log(ids.join(','));
console.log(unique.join(','));
console.log(stock.get('p2'));

// Expected output:
// p2,p1,p2
// p2,p1
// 3
```

The array preserves repeated positions. The Set preserves first-seen unique IDs. The Map answers a keyed lookup. None requires treating an ID as a numeric quantity.

## Reading and Practice Route

Read [theory](02-theory.md), trace [iteration and references](03-internal-working.md), then review the [validated production pipelines](04-production-examples.md). Solve the [six challenges](06-exercises-coding-challenges.md) before checking their solutions and the [MCQs](07-mcqs.md).

Companion programs live in `code/volume-1/chapter-09/`:

```sh
node code/volume-1/chapter-09/example-00-collection-model.js
node code/volume-1/chapter-09/example-01-order-summary.js
node code/volume-1/chapter-09/example-02-member-index.js
node code/volume-1/chapter-09/example-03-collection-challenges.js
node code/volume-1/chapter-09/example-04-edge-cases.js
```
