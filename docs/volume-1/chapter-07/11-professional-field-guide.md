# Professional Field Guide

## Write the Function's Promise

Describe a function in terms a caller can rely on: accepted arguments, successful result, changes to supplied objects, dependencies, and failure behavior. For the batch planner, the promise is a bounded numeric calculation with a fresh result record. For the label builder, it includes callback order and validating all IDs before formatting begins.

A long parameter list often mixes independent concerns. A named options record can clarify those concerns, but destructuring it is not validation. Use a focused constructor or parser for the record when the boundary needs stronger guarantees.

## Case Study: A Logger Becomes a Calculator

A utility prints a total and returns nothing. A later caller assigns its result and sends undefined downstream. The fix is to return the calculated value and let the boundary decide whether to log it. Tests should assert the returned value directly; checking that a console message appeared would miss the interface defect.

## Case Study: A Callback Is Invoked Too Soon

A caller writes `register(makeHandler())` where the API expects the handler function itself. This may be intentional if makeHandler is a factory, or a bug if it performs the operation immediately and returns undefined. Trace the initializer and inspect the returned value before changing syntax. Function-producing factories and action functions have different contracts.

Choose names that expose the distinction: createHandler returns a function; handleRecord performs the action. Avoid names that force every reader to inspect the implementation to know which form to pass.

## Case Study: Mutation Hides Behind a Parameter

A helper receives a draft record and updates a nested array. Reassigning the helper's parameter later does not undo that mutation. Reproduce with two references to the same object, then decide whether mutation is authorized. If it is not, copy the specific structure the result owns. A shallow outer spread is insufficient when mutable nested values remain shared.

## Case Study: A Convenient Callback Signature Drifts

An API initially calls a formatter with one argument, then adds an index. A directly supplied built-in now interprets the index as another option. Keep the receiving API signature documented and use adapters at the composition boundary. Regression checks should cover argument order and exact call count when those are part of the promise.

## Review Questions

- Can each branch return the documented type or throw the documented failure?
- Are defaults applied only to values that the domain considers missing?
- Does the function mutate an input or share a nested reference in its output?
- Does the callback contract specify timing, arguments, result, receiver, and failure behavior?
- Are external effects separated from calculations that could be deterministic?
- Can an invalid call perform partial work before it is rejected?
- Do recursion and input size have bounds?
- Are assertions invoking the implementation rather than merely loading its definition?

## Mastery Check

Explain a call without executing it: identify the function value, argument evaluation order, parameter defaults, shared objects, return path, and any callback effects. Then change one argument to null and repeat the reasoning. Continue with [Objects and Data Ownership](../chapter-08/01-introduction.md) to make the shared-reference part of that explanation precise.
