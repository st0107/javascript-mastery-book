# Lexical Scope and Closures

## Introduction

In [Control Flow](../../volume-1/chapter-06/01-introduction.md), you chose which statements execute and when a loop stops. Now consider what happens when a loop creates functions that run later. Which iteration does each function remember? What happens to a local variable after its enclosing function returns? Why can two functions update the same private value while a third function cannot see it?

Lexical scope explains which binding a name refers to. A closure lets a function keep using its surrounding bindings whenever it executes. Together, they let you separate the lifetime of a calculation from the lifetime of the call that prepared it.

A checkout service provides a useful starting point. Each request needs a logger carrying its own request ID. You could pass the ID to every logging call, but forgetting it would be easy. You could put it in a shared variable, but another request could replace it. A factory can instead create a logger whose surrounding state belongs to one request.

```js
'use strict';

function createRequestLabel(requestId) {
  return function label(event) {
    return `${requestId}: ${event}`;
  };
}

const checkout = createRequestLabel('request-17');
const refund = createRequestLabel('request-42');

console.log(checkout('validated'));
console.log(refund('started'));
console.log(checkout('charged'));
// Expected output:
// request-17: validated
// request-42: started
// request-17: charged
```

Both factory calls finish before any label is printed. The two returned functions still use different request IDs. This example accepts trusted strings; the [production examples](04-production-examples.md) add validation and an injected logging destination.

## Learning Objectives

By the end of this chapter, you should be able to:

- Resolve a name through nested function and block scopes without following the caller's local variables.
- Distinguish a binding, its current value, and an object referenced by that value.
- Trace shared state within one factory call and independent state across calls.
- Explain why a returned function works after its creator returns.
- Predict temporal dead zone errors and callbacks created by `var` and `let` loops.
- Design a small closure API with explicit ownership, error behavior, and cleanup.
- Draw a scope chain and a retention graph without presenting them as a literal engine memory layout.
- Defend a closure implementation in an interview using execution steps and observable output.

## Prerequisites

You should be comfortable with `let`, `const`, `var`, functions, object properties, arrays, and loops. Review [Variables and Data Types](../../volume-1/chapter-02/01-introduction.md) if the distinction between reassignment and object mutation is unfamiliar. The earlier [JavaScript Execution Model](../../volume-1/chapter-01-execution-model.md) introduces function calls and the call stack.

A function is a value: you can assign it, pass it as an argument, and return it. A callback is simply a function passed to another operation for that operation to invoke. A callback can run immediately; neither callbacks nor closures require timers or promises.

## Reading and Running the Chapter

Read [Theory](02-theory.md) and [Internal Working](03-internal-working.md) first. Then study the production examples before attempting the [exercises](06-exercises-coding-challenges.md). The [revision sheet](08-revision-summary.md) is intended for recall after you can explain the examples.

JavaScript blocks in this chapter are independent examples. Run each in a fresh Node.js file unless the block specifies a different environment. Companion scripts live in `code/volume-2/chapter-01/` and require no third-party packages:

```bash
node code/volume-2/chapter-01/example-00-scope-model.js
node code/volume-2/chapter-01/example-01-request-logger.js
node code/volume-2/chapter-01/example-02-subscription-store.js
node code/volume-2/chapter-01/example-03-closure-challenges.js
```

The scripts include assertions as well as expected console output. Use them to test a prediction, then change one binding or call order and predict again.
