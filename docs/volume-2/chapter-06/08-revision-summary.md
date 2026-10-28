# Revision Sheet and Chapter Summary

## The Contracts at a Glance

| Concept | Observable contract | Question to ask |
| --- | --- | --- |
| Iterable | `Symbol.iterator` supplies an iterator | Fresh cursor, shared cursor, or another explicit policy? |
| Iterator | `next` returns an object describing a step | Can it finish, fail, or spend unbounded time on one step? |
| Iterable iterator | Implements both protocols; commonly returns itself from `Symbol.iterator` | Are several consumers accidentally sharing progress? |
| Generator function | Creates a generator whose body starts when resumed | Does validation belong at creation or first consumption? |
| `yield value` | Suspends and exposes a value with `done: false` | Who owns that value after the next resume? |
| `next(input)` | Resumes a suspended yield with an input | Has the generator reached its first yield yet? |
| `return value` in the body | Completes with a terminal value | Does the caller need that value, which ordinary loops discard? |
| `yield* source` | Delegates iteration and produces the delegate's completion value | Must feedback, errors, or closing be forwarded? |
| `return(value)` on a generator | Requests a return at its suspended position | Can cleanup itself yield or throw? |
| `throw(error)` on a generator | Injects an exception at its suspended position | Is there an active handler that can recover? |
| Consumer early exit | Attempts the iterator's optional closing method | Does that method actually release the owned resource? |
| Laziness | Defers work until the producer is pulled | How much work and retained memory does each pull involve? |

## One-Minute Explanation

An iterable describes how to obtain a traversal. An iterator describes the next step of one traversal. A generator makes the iterator's state machine implicit in ordinary control flow: yielding suspends the body, and a later resume continues it. A fresh call to a generator function creates a fresh traversal; asking a generator object for its iterator returns that same ongoing traversal.

Correct iteration code also specifies lifecycle and ownership. Normal completion, consumer cancellation, and producer failure take different cleanup paths. Yielded objects can remain shared, and suspended generators can retain their sources. A lazy pipeline reduces unnecessary work only when its consumer stops early and its upstream operations have appropriate bounds.

## Predict This Before Moving On

```js
'use strict';
const events = [];
function* rows() {
  try {
    yield 'first';
    yield 'second';
  } finally {
    events.push('closed');
  }
}
const cursor = rows();
const [first] = cursor;
console.log(first, events.join(','));
console.log(cursor.next().done);
console.log([...rows()].join(','));
// Expected output:
// first closed
// true
// first,second
```

The bounded destructuring pattern obtains one value and then closes the still-active iterator. Its non-yielding `finally` runs. A later call to the generator function creates an independent traversal that can produce both values. The generator object that was closed does not restart.

## Review Checklist

- Return an object for each iterator result and use boolean `done` flags.
- Separate a reusable iterable from a cursor with shared progress.
- Specify eager argument validation and deferred per-item validation.
- Count raw pulls as well as emitted values when enforcing work limits.
- Avoid reading an extra item just to detect that a requested limit was reached.
- Acquire resources inside the lifecycle that will release them.
- Keep essential cleanup free of yields, and document cleanup-error precedence.
- Test source failures separately from consumer failures.
- Copy records when the API promises detached values; a fresh array alone is insufficient.
- Check runtime support before adopting newer iterator helpers.

## Chapter Summary

The [theory](02-theory.md) and [internal traces](03-internal-working.md) connect the iteration protocol to suspended control flow. The [production examples](04-production-examples.md) apply those rules to bounded batches and managed cursor lifetime. The [exercises](06-exercises-coding-challenges.md) develop explicit traversal, transformation, completion, and feedback contracts. The [field guide](11-professional-field-guide.md) turns them into review questions.

Next planned chapter: **Functional Programming in JavaScript**, including how transformations compose and how effects change that reasoning.

## References

- [ECMAScript: iterator abstract operations](https://tc39.es/ecma262/multipage/abstract-operations.html#sec-operations-on-iterator-objects).
- [ECMAScript: generator objects](https://tc39.es/ecma262/multipage/control-abstraction-objects.html#sec-generator-objects).
- [MDN: iteration protocols](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols).
- [MDN: generator functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*).
- [MDN: yield delegation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/yield*).
- [MDN: generator return](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator/return) and [generator throw](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator/throw).

## Further Reading

- [`for...of`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...of) for loop behavior and early-exit examples.
- [`Symbol.iterator`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/iterator) for the iterable entry point.
- [`Iterator`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Iterator) for newer helper APIs and their individual compatibility information; this chapter's exercises remain runnable without them.
- [Volume 3 overview](../../volume-3/index.md) for the planned progression to promises, async iteration, streams, and cancellation.
