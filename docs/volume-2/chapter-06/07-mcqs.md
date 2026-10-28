# MCQs

Choose an answer before reading the explanation. Assume synchronous iteration, ordinary unmodified built-ins, and no custom prototype changes unless the question states otherwise.

## 1. Iterator or Iterable?

An object has a valid `next()` method but no `Symbol.iterator` method. Which statement follows?

- **A.** It must work directly in `for...of`.
- **B.** It can satisfy the iterator protocol without satisfying the iterable protocol.
- **C.** It is automatically an array-like object.
- **D.** Its `next()` method is never callable directly.

**Answer: B.** Direct iteration through `next()` and obtaining an iterator through `Symbol.iterator` are separate contracts. `for...of` needs the latter entry point.

## 2. Independent Traversals

An API promises independent progress for each traversal of a stored range. Which implementation shape best fits?

- **A.** Store one generator object and return it from every iterator-method call.
- **B.** Reset one shared index whenever `next()` is called.
- **C.** Make all iterators share a mutable cursor variable.
- **D.** Return a fresh generator from each `Symbol.iterator` call.

**Answer: D.** Separate generator instances have separate progress. Shared source values can be safe when their ownership is explicit; a shared cursor defeats independent traversal.

## 3. Missing Result Properties

A custom iterator's `next()` returns `{}`. How does a normal synchronous iteration consumer interpret it?

- **A.** A yielded `undefined` value with a falsy completion flag.
- **B.** Immediate completion because `done` is absent.
- **C.** A syntax error before iteration starts.
- **D.** Automatic use of the previous yielded value.

**Answer: A.** The result is an object. Its absent `done` is falsy, and its absent `value` reads as undefined. An iterator that always returns `{}` never signals completion.

## 4. Terminal Values

A generator yields `'row'` and then executes `return 7`. What does spreading a fresh instance produce?

- **A.** `['row', 7]`
- **B.** `[7]`
- **C.** `['row']`
- **D.** An exception because generators cannot return values.

**Answer: C.** The terminal result has true `done`; ordinary value iteration excludes it. A manual driver or a delegating `yield*` expression can observe its completion value.

## 5. When Does the Body Run?

An ordinary generator function contains validation as its first body statement. When does that statement normally run?

- **A.** At function declaration.
- **B.** When the function is called to create the generator object.
- **C.** When the generator object is inspected in a debugger, as a language requirement.
- **D.** When the generator is first resumed with `next()`.

**Answer: D.** Creating the object leaves the body suspended before execution. An ordinary wrapper function can perform eager validation before returning that generator.

## 6. The First Sent Value

A generator's first body statement is `const input = yield 'ready';`. The caller starts it with `next(99)`. What happens to `99`?

- **A.** It becomes `input` immediately.
- **B.** It is not delivered to a suspended yield because none exists yet.
- **C.** It replaces `'ready'` in the returned result.
- **D.** It makes the generator complete.

**Answer: B.** The first call starts execution until the first yield. A later `next(value)` supplies the result of that suspended yield expression.

## 7. Breaking a Loop

A `for...of` loop breaks after receiving one value from an active generator inside a `try...finally`. Its `finally` only logs a marker. What normally happens?

- **A.** Iterator closing calls `return()`, causing the entered `finally` to run.
- **B.** The loop calls `throw()` with a special break exception.
- **C.** The engine drains all remaining yielded values first.
- **D.** Cleanup waits for a guaranteed garbage-collection callback.

**Answer: A.** A break is an early consumer exit. Iterator closing uses the optional return method; generator control flow then runs the entered cleanup block.

## 8. A Producer's Own Failure

A custom iterator's `next()` throws before delivering a result. Does `for...of` guarantee a subsequent call to that iterator's `return()`?

- **A.** Yes, exactly once for every error from every protocol operation.
- **B.** Yes, but only when the error is a `TypeError`.
- **C.** No; the producer must handle cleanup for its own failed pull.
- **D.** No error reaches the caller because iteration retries automatically.

**Answer: C.** Failure while advancing the producer differs from abrupt completion in the consumer's loop body. Resource acquisition and pull failure need an explicit producer-side policy.

## 9. Closing Before Starting

A fresh generator has never received `next()`. Its first body statement enters a `try...finally`. The caller invokes `return('cancel')`. Which result is expected?

- **A.** The body starts and yields every value before returning.
- **B.** The generator completes without entering that body or its `finally`.
- **C.** It throws because `return()` requires prior iteration.
- **D.** The return argument becomes the next yielded value with false `done`.

**Answer: B.** The generator closes from its initial suspended state. Acquire resources inside the body when that body owns their cleanup; an unstarted generator cannot clean up work done elsewhere.

## 10. Yielding During Cleanup

A started generator is suspended in a `try` whose `finally` contains another `yield`. What can its next `return('stop')` call produce?

- **A.** Only `{ value: 'stop', done: true }`.
- **B.** Only a `TypeError`, because yielding in finally is illegal.
- **C.** A guarantee that all cleanup has already finished.
- **D.** A cleanup yield with false `done`, leaving further execution pending.

**Answer: D.** A pending return can be suspended by a yield in finally. Cleanup that must finish during iterator closing should not require the consumer to keep resuming it.

## 11. Delegation's Result

Inside an outer generator, `const total = yield* child();` delegates to a child that yields `2`, yields `3`, and returns `5`. What becomes `total` after normal child completion?

- **A.** `5`
- **B.** `[2, 3]`
- **C.** The child generator object.
- **D.** `undefined` regardless of the child's return statement.

**Answer: A.** The outer generator forwards the yielded values while the `yield*` expression captures the delegate's terminal value. The sum is not computed automatically; it is explicitly returned by this child.

## 12. Recovering an Injected Error

A generator is suspended at a yield inside a matching `try...catch`. Its caller invokes `throw(error)`. Which statement is accurate?

- **A.** A throw call always closes a generator before its catch can run.
- **B.** The argument is silently converted into the result of `next()`.
- **C.** The error is injected at the suspended yield and can be caught, allowing another yield.
- **D.** The caller's stack becomes a second concurrent generator thread.

**Answer: C.** Catching an injected error can let generator execution continue. An uncaught error terminates the generator and propagates to the caller.

## 13. A Zero Limit

A custom `take(source, 0)` promises not to acquire the source. Which placement preserves that promise?

- **A.** Check the limit in the body of the first `for...of` iteration.
- **B.** Return before entering `for...of` or calling `source[Symbol.iterator]()`.
- **C.** Pull one value and discard it if the limit is zero.
- **D.** Spread the source and then slice to zero elements.

**Answer: B.** The iterable method is called before a loop body can run, and the first value is already pulled before a body guard sees it. A zero-demand path must precede acquisition.

## 14. Laziness and Scheduling

A synchronous generator spends five seconds computing its next yield without awaiting or handing work to another execution context. What does laziness guarantee here?

- **A.** The work runs on a background thread.
- **B.** The event loop interrupts the calculation at each loop iteration.
- **C.** The caller receives a promise automatically.
- **D.** Computation starts on demand, but that `next()` call can still block its thread.

**Answer: D.** A synchronous generator is a resumable computation. Demand controls when work starts; it does not provide scheduling, parallelism, or a time budget.

## 15. Snapshot Timing

A generator object is created with an array argument. Its body reads that array only after the first `next()`. The caller mutates the array before that call. Which statement is correct?

- **A.** Creation alone did not snapshot the array; the body may observe the mutation.
- **B.** Every generator clones its arguments deeply at creation.
- **C.** All arrays become frozen when captured by a generator.
- **D.** Mutation is impossible until the generator finishes.

**Answer: A.** Capturing a reference preserves access to an object, not an earlier copy of its contents. A stable view needs deliberate copying or a separate immutable-data contract.

## 16. An Infinite Source

Which consumption strategy has a finite demand bound for an infinite sequence of cheap integer yields?

- **A.** Spread the source into an array, then take the first ten entries.
- **B.** Call `Array.from(source)` and rely on lazy allocation.
- **C.** Consume through a correctly implemented ten-value limit, then complete or close that wrapper.
- **D.** Use `for...of` with no break and wait for automatic exhaustion.

**Answer: C.** Limit demand before materialization. This bounds successful pulls when the limiter does not fetch extra values; it cannot bound arbitrary work inside an individual source pull.

Review the [iteration protocols](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) for consumer and producer responsibilities, then explain the [worked exercises](06-exercises-coding-challenges.md) without relying only on their output.
