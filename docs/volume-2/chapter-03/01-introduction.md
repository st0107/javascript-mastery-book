# Prototypes and Inheritance

## Introduction

In [`this`, Call, Apply, and Bind](../chapter-02/01-introduction.md), you learned how a call selects its receiver. This chapter answers the question that comes just before that call: where does JavaScript find the property containing the function?

An object does not need its own copy of every method it can use. It can delegate a missing property lookup to another object, its **prototype**. Several job records can share one description method while keeping separate IDs and statuses.

```js
'use strict';

const jobBehavior = {
  describe() { return `${this.id}: ${this.status}`; }
};

const first = Object.create(jobBehavior);
first.id = 'job-17';
first.status = 'queued';

const second = Object.create(jobBehavior);
second.id = 'job-18';
second.status = 'running';

console.log(first.describe());
console.log(second.describe());
console.log(Object.hasOwn(first, 'describe'));
console.log(first.describe === second.describe);
// Expected output:
// job-17: queued
// job-18: running
// false
// true
```

Neither record owns `describe`. Both find the same function through `jobBehavior`. The property call still supplies the record as `this`, so one shared implementation reads two different sets of state. Lookup location and call receiver are separate facts.

Inheritance is useful when objects should share behavior or participate in a stable specialization relationship. It also creates dependencies: changing a shared object can affect many descendants, and putting mutable state on that object can make unrelated instances interfere. The chapter teaches how to identify those relationships before choosing an implementation.

## Learning Objectives

By the end of this chapter, you should be able to:

- Trace own and inherited property reads until the prototype chain reaches `null`.
- Distinguish an object's internal prototype from a constructor's `.prototype` property.
- Explain why an own property containing `undefined` still hides an inherited value.
- Predict shadowing, deletion, inherited getters, and descriptor-sensitive assignment.
- Share method functions while keeping each instance's mutable state separate.
- Use `Object.create`, `Object.getPrototypeOf`, `Object.hasOwn`, and own-key inspection deliberately.
- Explain ordinary construction, constructor prototype replacement, and the limits of `instanceof`.
- Draw the instance and constructor chains established by `class extends`.
- Distinguish language prototypes from an engine's object-shape metadata.
- Recognize prototype-pollution risks and validate data without trusting inherited defaults.

## Prerequisites

Read the preceding chapters on [lexical scope](../chapter-01/01-introduction.md) and [receivers](../chapter-02/01-introduction.md). You should be comfortable with object identity, arrays, property access, ordinary functions, and strict mode.

The chapter introduces property descriptors only where they change lookup or assignment. The later chapter on descriptors covers their full API. Classes appear here to expose their prototype relationships; **Classes and Object Creation Patterns**, the next chapter, will develop their initialization and design rules in greater depth.

## Reading and Running the Chapter

Read [Theory](02-theory.md) and [Internal Working](03-internal-working.md), then work through the [production patterns](04-production-examples.md). Use the [exercises](06-exercises-coding-challenges.md), [MCQs](07-mcqs.md), and [revision sheet](08-revision-summary.md) to test your predictions.

JavaScript blocks are independent programs for Node.js 20 or later unless explicitly stated otherwise. The companion scripts use assertions and require no third-party packages:

```bash
node code/volume-2/chapter-03/example-00-prototype-model.js
node code/volume-2/chapter-03/example-01-shared-records.js
node code/volume-2/chapter-03/example-02-safe-options.js
node code/volume-2/chapter-03/example-03-prototype-challenges.js
node code/volume-2/chapter-03/example-04-edge-cases.js
```

All examples that change a prototype use local objects created for that example. None require modifying `Object.prototype`, `Array.prototype`, or other shared built-ins.
