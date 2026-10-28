# Interview Perspective

## Explain the Protocol Before the Syntax

A strong explanation separates three roles. An iterable supplies a cursor through `Symbol.iterator`. An iterator supplies result objects through `next`. A generator function creates an object that supports both protocols and preserves its execution state across `yield`. An iterable can supply independent cursors, while a generator object represents one ongoing traversal.

Follow that explanation with a concrete contract: does a second loop restart, continue, or see nothing? Does a yielded object belong to the producer or the consumer? What happens if the consumer stops? Saying only that generators are lazy leaves those questions unanswered.

## Prediction 1: Two Directions of a Yield

Predict all four lines before running this program:

```js
'use strict';
function* quote(base) {
  const extra = yield base;
  return base + extra;
}
const cursor = quote(10);
console.log(JSON.stringify(cursor.next(99)));
console.log(JSON.stringify(cursor.next(4)));
console.log(cursor.next().done);
console.log([...quote(10)].join(','));
// Expected output:
// {"value":10,"done":false}
// {"value":14,"done":true}
// true
// 10
```

The first call starts the body. There is no suspended `yield` expression to receive `99`. The second call resumes the existing `yield` with `4`, assigning it to `extra`. The returned `14` is a completion value, so a normal loop does not include it among the yielded values. In the final traversal, the loop supplies no feedback; the internal completion value is `NaN` and is also discarded. A producer expecting meaningful feedback should document manual stepping as part of its API.

**Follow-up:** Does `next()` schedule work for later? No. The caller waits synchronously until the generator yields, returns, or throws. The example performs constant arithmetic and retains constant local state.

## Prediction 2: Stopping Two Different Cursors

```js
'use strict';
const arrayCursor = [1, 2, 3][Symbol.iterator]();
for (const value of arrayCursor) {
  console.log(`array ${value}`);
  break;
}
console.log([...arrayCursor].join(','));

function* numbers() { yield 1; yield 2; yield 3; }
const generatorCursor = numbers();
for (const value of generatorCursor) {
  console.log(`generator ${value}`);
  break;
}
console.log(generatorCursor.next().done);
// Expected output:
// array 1
// 2,3
// generator 1
// true
```

Early loop exit looks for the iterator's optional `return` method. A standard array iterator has no such closing method, so it remains positioned after the first element. This generator has `return`, and its ordinary cleanup-free body completes on closing. The [edge cases](09-edge-cases-debugging.md) explain why a generator that yields inside `finally` needs a more careful answer.

**Follow-up:** Can a custom iterator deliberately remain usable after a `return` call? Its own implementation determines its state. The method name alone does not enforce resource release or permanent completion. State your iterator's lifecycle and test it. See [`for...of` early exit](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...of#early_exiting).

## Prediction 3: Delegation Has a Completion Result

```js
'use strict';
function* section() {
  yield 'row-a';
  yield 'row-b';
  return 2;
}
function* report() {
  const count = yield* section();
  yield `rows:${count}`;
  return 'finished';
}
const cursor = report();
console.log(JSON.stringify(cursor.next()));
console.log(JSON.stringify(cursor.next()));
console.log(JSON.stringify(cursor.next()));
console.log(JSON.stringify(cursor.next()));
// Expected output:
// {"value":"row-a","done":false}
// {"value":"row-b","done":false}
// {"value":"rows:2","done":false}
// {"value":"finished","done":true}
```

`yield*` delegates to the section's iterator. The section's `return 2` completes that delegation and supplies the value of the `yield*` expression; it is not itself a yielded row. The outer generator chooses to expose that count as a separate value. This is useful when a producer yields records while computing completion metadata.

**Follow-up:** Is `yield* source` equivalent to a loop containing `yield value`? They agree for many ordinary value traversals, but delegation also forwards resumption values and handles the delegate's `return` and `throw` methods. Do not claim equivalence for every bidirectional or error-handling contract. See [`yield*`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/yield*).

## Design Question: A Preview Must Not Read the Whole Export

An export preview needs at most twenty rows from a potentially much larger synchronous source. Explain these decisions before implementing it:

1. Define whether the count limits raw rows inspected or accepted rows displayed. A filter can inspect many rows while yielding none.
2. State whether the preview owns the iterator and may close it, or borrows a cursor that a later operation must continue.
3. Validate the count before opening a resource. For zero, do not start the source.
4. Stop without requesting a twenty-first accepted row merely to discover that the limit was reached.
5. Decide whether previews copy primitive fields or expose live objects. Spreading a generator copies the sequence of references, not the underlying records.
6. Cover exhaustion, consumer cancellation, invalid rows, and producer failures with assertions.

The [production examples](04-production-examples.md) and [bounded-consumption exercise](06-exercises-coding-challenges.md) make these choices explicit. Big-O claims should include the upstream work needed to find each row and the bytes retained by the consumer.

## Claims to Correct During an Interview

| Claim | More precise explanation |
| --- | --- |
| A generator is an array with lazy syntax | It is a stateful traversal with suspension, resumption, and completion behavior |
| Every iterable restarts | Restarting requires a fresh cursor or another explicit reset contract |
| `return()` always produces `done: true` immediately | A generator can yield from an active `finally` block during return processing |
| `for...of` always calls `return()` when something fails | Consumer-driven early exits close; a producer's failed `next()` must handle its own cleanup |
| Laziness guarantees constant memory | The source, suspension state, batches, caches, and consumer-retained results all count |
| `yield` gives other tasks time to run | It returns control to the immediate caller; synchronous consumption can still block the event loop |

End a design answer with the contract, its failure paths, and one measured or asserted property. For example: the batcher reads exactly enough rows for the current full batch, and breaking at that yield closes a resource-aware upstream producer.
