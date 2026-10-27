# Descriptors, Immutability, and Proxies

## Introduction

[Classes and Object Creation Patterns](../chapter-04/01-introduction.md) established valid state and deliberate ownership. This chapter examines the property operations through which that state can be observed or changed. A field is more than a name and a value: its descriptor controls whether assignment, enumeration, deletion, and redefinition are allowed.

Those controls apply at a particular boundary. Preventing replacement of a property does not necessarily prevent changes to the object that property references:

```js
'use strict';

const limits = { maxRows: 100 };
const settings = Object.freeze({ format: 'csv', limits });
try {
  settings.format = 'json';
} catch (error) {
  console.log(error.name);
}
limits.maxRows = 250;
console.log(settings.limits.maxRows);
console.log(Object.isFrozen(settings), Object.isFrozen(limits));
console.log(Object.getOwnPropertyDescriptor(settings, 'limits').writable);
// Expected output:
// TypeError
// 250
// true false
// false
```

The frozen root keeps its `limits` reference, but that reference still leads to mutable state. A configuration snapshot therefore needs an ownership policy as well as property restrictions. The [production examples](04-production-examples.md) construct detached, validated data instead of assuming that a shallow freeze creates a stable snapshot.

A proxy introduces a different boundary. It can intercept operations performed through the proxy, while references to the target still address the original object directly. The engine also checks that a proxy does not contradict certain facts about its target. Understanding those invariants prevents traps that work during development and start throwing after a target is sealed or frozen.

## Learning Objectives

By the end of this chapter, you should be able to:

- Read and construct data and accessor descriptors with explicit defaults.
- Distinguish assignment from property definition, including inherited setters.
- Predict which keys an enumeration or copy operation includes and whether it calls getters.
- Explain non-extensibility, sealing, and freezing without promising recursive immutability.
- Identify state that ordinary property freezing does not control.
- Trace `get`, `set`, and `defineProperty` through a proxy and its target.
- Preserve the intended receiver when forwarding through `Reflect`.
- Explain why proxy invariants constrain reported values, descriptors, and key sets.
- Use revocation with an explicit lifecycle and a clear account of escaped values.
- Choose ordinary methods, owned snapshots, descriptors, or proxies based on the actual contract.

## Prerequisites

Review [object ownership](../../volume-1/chapter-08/01-introduction.md), [receivers](../chapter-02/01-introduction.md), [prototype lookup](../chapter-03/01-introduction.md), and [private state in classes](../chapter-04/01-introduction.md). The examples also use exceptions, arrays, and Node's assertion utility. No framework or decorator syntax is required.

## Reading and Running the Chapter

Start with [Theory](02-theory.md), then use [Internal Working](03-internal-working.md) to trace the operations. Attempt the [six exercises](06-exercises-coding-challenges.md) before reading their solutions. The [interview material](05-interview-perspective.md), [MCQs](07-mcqs.md), and [revision sheet](08-revision-summary.md) test explanations as well as predictions.

Every JavaScript fence is an independent Node.js 20-or-later program. Intentional failures are caught, and expected output is recorded. Run the assertion companions from the repository root:

```bash
node code/volume-2/chapter-05/example-00-descriptor-model.js
node code/volume-2/chapter-05/example-01-owned-config.js
node code/volume-2/chapter-05/example-02-revocable-view.js
node code/volume-2/chapter-05/example-03-descriptor-challenges.js
node code/volume-2/chapter-05/example-04-edge-cases.js
npm run docs:volume2:test -- --chapter 05
```

The chapter's boundaries are local JavaScript contracts. Freezing and proxying do not provide a separate execution realm, remote authorization, or a sandbox for arbitrary code. The next chapter, **Iterators and Generators**, will build on explicit operation protocols and stateful objects.
