# Chapter 1 Interview Questions

## Core Questions

1. What is an execution context?
2. What is the call stack?
3. What is the difference between creation phase and execution phase?
4. How does JavaScript resolve identifiers?
5. What is the temporal dead zone?

## FAANG-Style Follow-ups

1. If a nested function uses an outer variable after the outer function returns, where does the value come from?
2. Why can `var` sometimes return `undefined` instead of throwing?
3. How would you explain the call stack to a junior engineer?
4. What performance problems can come from repeatedly creating closures in hot paths?
5. Why is `eval` dangerous for both security and optimization?

## Whiteboard Prompt

Draw the memory and call stack for:

```js
const rate = 0.2;

function tax(amount) {
  return amount * rate;
}

function total(amount) {
  return amount + tax(amount);
}

console.log(total(100));
```

Expected explanation: `total` is pushed first, `tax` is pushed during the call, `rate` is resolved through the outer lexical environment, and both function contexts are popped after returning.

