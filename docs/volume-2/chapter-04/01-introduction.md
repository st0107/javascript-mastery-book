# Classes and Object Creation Patterns

## Introduction

[Prototypes and Inheritance](../chapter-03/01-introduction.md) explained how objects share behavior. This chapter asks how to create those objects with valid state, keep that state under control, and select a design that stays understandable as requirements change.

A class groups a construction procedure with related behavior. That grouping is useful when every instance must obey the same rules. A seat allowance, for example, should never become negative or accept a fractional reservation.

```js
'use strict';

class SeatAllowance {
  #remaining;

  constructor(capacity) {
    if (!Number.isSafeInteger(capacity) || capacity < 0) {
      throw new RangeError('Capacity must be a nonnegative safe integer');
    }
    this.#remaining = capacity;
  }

  reserve(count) {
    if (!Number.isSafeInteger(count) || count < 1 || count > this.#remaining) {
      throw new RangeError('Reservation exceeds the available allowance');
    }
    this.#remaining -= count;
    return this.#remaining;
  }

  get remaining() { return this.#remaining; }
}

const morning = new SeatAllowance(3);
const evening = new SeatAllowance(3);
console.log(morning.reserve(2));
console.log(evening.remaining);
console.log(morning.reserve === evening.reserve);
console.log(Object.keys(morning).length);
// Expected output:
// 1
// 3
// true
// 0
```

The two instances have independent private state and share one public `reserve` method through their prototype. The constructor establishes a rule, and the method preserves it. The rule would be incomplete if callers could replace the stored balance directly or mutate an exposed internal container.

Classes are one option. A closure factory can keep state in a lexical environment. An object literal can implement a small injected dependency. `Object.create` can establish deliberate delegation. The right choice depends on ownership, lifetime, receiver requirements, and the operations the abstraction promises.

## Learning Objectives

By the end of this chapter, you should be able to:

- Explain the additional semantics of classes beyond prototype-based method sharing.
- Locate instance fields, prototype methods, static members, and private elements.
- Trace class definition separately from instance construction.
- Predict base and derived initialization order, including the danger of calling overrides during construction.
- Explain why a public field declaration differs from ordinary assignment.
- Distinguish a private-name check from a prototype relationship or an authorization check.
- Keep an invariant intact across construction, methods, snapshots, and hydration.
- Choose between a class, a closure factory, a plain record, and explicit delegation.
- Compose injected capabilities without creating a large inheritance hierarchy.
- Evaluate memory and performance trade-offs using the target runtime and workload.

## Prerequisites

You should understand [closures](../chapter-01/01-introduction.md), [call receivers](../chapter-02/01-introduction.md), and [prototype relationships](../chapter-03/01-introduction.md). The examples use arrays, validation, exceptions, and own-property inspection from earlier chapters.

This chapter introduces descriptors and proxies only where they affect class behavior. The next chapter, **Descriptors, Immutability, and Proxies**, will develop their full APIs and invariants. No decorator syntax, transpiler, framework, or TypeScript knowledge is required.

## Reading and Running the Chapter

Start with [Theory](02-theory.md) and [Internal Working](03-internal-working.md). Apply the model to [production examples](04-production-examples.md), then attempt the [exercises](06-exercises-coding-challenges.md) before reading their solutions. The [interview material](05-interview-perspective.md) and [revision sheet](08-revision-summary.md) help turn predictions into concise explanations.

JavaScript blocks are independent programs for Node.js 20 or later unless stated otherwise. Companion programs include assertions and require no third-party dependencies:

```bash
node code/volume-2/chapter-04/example-00-class-model.js
node code/volume-2/chapter-04/example-01-reservation.js
node code/volume-2/chapter-04/example-02-notifier-factory.js
node code/volume-2/chapter-04/example-03-creation-challenges.js
node code/volume-2/chapter-04/example-04-edge-cases.js
```

Treat the production examples as explicit local contracts. A class does not supply persistence, concurrency control, input authorization, or a delivery guarantee merely by hiding its fields.
