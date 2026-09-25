# `this`, Call, Apply, and Bind

## Introduction

In [Lexical Scope and Closures](../chapter-01/01-introduction.md), you learned why a function can keep using variables from the environment where it was created. That explains an identifier such as `requestId`. A method reading `this.requestId` adds a different question: which value does this invocation use as its receiver?

A service can work when called as `service.describe()` and fail when the same function is passed to another operation. The function did not forget its source code or its lexical environment. The new call supplied a different receiver.

```js
'use strict';

const shipment = {
  id: 'shipment-17',
  describe(status) {
    return `${this.id}: ${status}`;
  }
};

const detached = shipment.describe;
console.log(shipment.describe('packed'));

try {
  detached('sent');
} catch (error) {
  console.log(error.name);
}

const describeShipment = shipment.describe.bind(shipment);
console.log(describeShipment('sent'));
// Expected output:
// shipment-17: packed
// TypeError
// shipment-17: sent
```

The first call supplies `shipment` through a property reference. The detached strict function receives `undefined`, so reading `this.id` throws. The bound function supplies the chosen receiver when another caller invokes it. These are three calls involving the same method implementation, with different call behavior.

This chapter develops that model before introducing production callbacks and forwarding wrappers. It also explains why arrows, class methods, and constructors require more care than a slogan about the object to the left of a dot.

## Learning Objectives

By the end of this chapter, you should be able to:

- Distinguish lexical name lookup from receiver selection and property lookup.
- Predict `this` for ordinary calls, method calls, explicit calls, arrows, and bound functions.
- Explain strict and non-strict receiver conversion without depending on a browser console.
- Choose between `call`, `apply`, `Reflect.apply`, `bind`, and a wrapper.
- Preserve arguments, return values, exceptions, and receivers when adapting a method.
- Explain partial application, repeated binding, and bound constructor behavior.
- Register and remove callbacks using a stable function identity.
- Diagnose private-field and built-in receiver errors without treating binding as access control.
- Draw the references a bound callback retains and identify its cleanup owner.

## Prerequisites

Read the preceding chapter on closures first. You should understand functions as values, object properties, arrays, strict mode, and basic function calls. Review [Variables and Data Types](../../volume-1/chapter-02/01-introduction.md) for object identity and [JavaScript Execution Model](../../volume-1/chapter-01-execution-model.md) for the call stack.

The chapter introduces the small amount of class and constructor syntax used in its examples. Prototype lookup and inheritance receive their own chapter next. No asynchronous programming knowledge is required: a callback can run immediately, and the Node.js event examples dispatch synchronously.

## Reading and Running the Chapter

Start with [Theory](02-theory.md) and [Internal Working](03-internal-working.md), then read the [production examples](04-production-examples.md). Attempt the [exercises](06-exercises-coding-challenges.md) and [MCQs](07-mcqs.md) before using the [revision sheet](08-revision-summary.md).

Run each JavaScript block independently in a fresh Node.js file unless the text specifies a browser, an ES module, or deliberate non-strict execution. The repository's `.js` companion scripts use CommonJS and Node.js 20 or later:

```bash
node code/volume-2/chapter-02/example-00-receiver-model.js
node code/volume-2/chapter-02/example-01-bound-listener.js
node code/volume-2/chapter-02/example-02-method-adapter.js
node code/volume-2/chapter-02/example-03-binding-challenges.js
node code/volume-2/chapter-02/example-04-edge-cases.js
```

The scripts include assertions and expected output. Predict the receiver before running a script; then change one call expression and explain why the result changes or stays the same.
