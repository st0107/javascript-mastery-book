# Theory

## 1. Separate the Sequence from Its Cursor

An **iterable** supplies a way to obtain a cursor. An **iterator** is that cursor: calling its `next()` method advances a traversal. Keeping these roles separate lets a consumer request values without knowing whether they come from an array, a calculation, or an application-owned data source.

| Role | Required operation | Result |
| --- | --- | --- |
| Synchronous iterable | `[Symbol.iterator]()` | An iterator object |
| Synchronous iterator | `next()` | An object describing one step |
| Iterable iterator | Both operations; its iterator method commonly returns `this` | A cursor usable directly by `for...of` |

The step result convention is `{ value, done }`. A falsy `done` means that `value` is the next sequence element. A truthy `done` marks completion; that result's `value` is a completion value, not another element. Omitting `done` behaves like false. Prefer explicit booleans when implementing a protocol. Returning a primitive from `next()` violates the contract that language consumers enforce. See the [iteration protocols](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols).

```js
'use strict';

const cursor = {
  position: 0,
  next() {
    if (this.position >= 2) return { value: undefined, done: true };
    this.position += 1;
    return { value: `item-${this.position}`, done: false };
  },
  [Symbol.iterator]() { return this; }
};
console.log(cursor[Symbol.iterator]() === cursor);
console.log(cursor.next().value);
console.log([...cursor].join(','));
console.log(cursor.next().done);
// Expected output:
// true
// item-1
// item-2
// true
```

The first manual read consumes an element. Spreading the same cursor continues at its current position. This implementation stays completed once its limit is reached; a well-behaved iterator should not unexpectedly restart after completion. The protocol does not require an iterator to be iterable, so an object with only `next()` is not necessarily accepted by `for...of`.

## 2. A Fresh Cursor Enables Independent Traversals

A sequence object can create a fresh iterator on each call. That permits nested loops and repeated passes without sharing one position counter. It does not guarantee that the underlying values form a snapshot.

```js
'use strict';

const tickets = {
  *[Symbol.iterator]() {
    yield 'T-10';
    yield 'T-11';
  }
};
const first = tickets[Symbol.iterator]();
const second = tickets[Symbol.iterator]();
console.log(first === second);
console.log(first.next().value, second.next().value);
console.log([...tickets].join(','));
console.log([...tickets].join(','));
// Expected output:
// false
// T-10 T-10
// T-10,T-11
// T-10,T-11
```

Here each generator call creates independent traversal state, and the two literal strings are stable. An iterable that reads a mutable array could create fresh cursors while observing different data on later passes. Define **cursor independence**, **repeatability**, and **snapshot ownership** separately. A generator function is a factory for generator objects; an individual generator object is normally a one-shot cursor.

## 3. Consumers Decide What Completion Means

`for...of`, array spread, and array destructuring consume iteration values. They do not append a generator's final `return` value. A manual caller can inspect that value in the step that first reports completion.

```js
'use strict';

function* exportIds() {
  yield 'E-3';
  return 'export complete';
}
console.log([...exportIds()].join(','));
const cursor = exportIds();
console.log(JSON.stringify(cursor.next()));
console.log(JSON.stringify(cursor.next()));
console.log(cursor.next().done, cursor.next().value === undefined);
// Expected output:
// E-3
// {"value":"E-3","done":false}
// {"value":"export complete","done":true}
// true true
```

Do not use a final return value as the last data record in an export; yield that record instead. Subsequent `next()` calls on a completed generator return `done: true` with `value: undefined`, rather than replaying its original completion value.

`for...in` enumerates enumerable string property keys and is a different operation. Object spread copies own enumerable properties; it does not consume `[Symbol.iterator]`. `Array.from` can consume an iterable or, when no iterator method is supplied, an array-like object. A `{ length: 2, 0: 'a' }` record is not iterable merely because it has indexed properties.

## 4. Generator Bodies Start on the First Resume

Calling a `function*` creates a generator object. Body statements wait for the first `next()` call. Argument expressions and parameter initialization still happen when the function is called; a default parameter can therefore have effects before the body starts. Keep parameter defaults simple when promising lazy work. The [generator declaration](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*) supplies the language machinery that a hand-written cursor would otherwise implement.

```js
'use strict';

const events = [];
function* report(label = (events.push('parameter'), 'weekly')) {
  events.push('body');
  yield label;
  events.push('finish');
}
const cursor = report();
console.log(events.join(','));
console.log(cursor.next().value, events.join(','));
console.log(cursor.next().done, events.join(','));
// Expected output:
// parameter
// weekly parameter,body
// true parameter,body,finish
```

The code after a `yield` has not run when that yielded value reaches the caller. It runs only if the generator is resumed in a way that reaches it. Consequently, validation written inside the body is delayed until consumption. Use an ordinary outer function that validates and returns a generator when callers need invalid configuration rejected immediately.

## 5. A Yield Transfers Control in Two Directions

`yield expression` sends a value outward and suspends the body. A later `next(input)` supplies the result of that suspended yield expression. The first `next(input)` has no suspended yield expression waiting for input, so its argument is ignored. Initial configuration belongs in the generator function's arguments. See [Generator.prototype.next](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator/next).

```js
'use strict';

function* approval() {
  const answer = yield 'approve invoice?';
  yield answer === 'yes' ? 'accepted' : 'rejected';
  return 'finished';
}
const cursor = approval();
console.log(cursor.next('yes').value);
console.log(cursor.next('yes').value);
console.log(JSON.stringify(cursor.next()));
// Expected output:
// approve invoice?
// accepted
// {"value":"finished","done":true}
```

A conventional `for...of` loop calls `next()` without a meaningful input argument. A generator designed around a dialogue therefore needs an explicit driver. Giving a consumer the generator object also gives it control over resume, throw, and return operations; that may be more authority than a read-only sequence API should expose.

## 6. Throwing into a Generator Is Different from Throwing in a Consumer

`cursor.throw(error)` resumes a suspended generator with a throw completion at its yield expression. A surrounding generator `try...catch` can handle the injected error and yield another value. An uncaught error escapes to the caller and completes the generator. Calling `.throw(error)` on an already completed generator throws that supplied error.

```js
'use strict';

function* retryPrompt() {
  try {
    yield 'attempt';
  } catch (error) {
    yield `retry:${error.message}`;
  }
  return 'settled';
}
const cursor = retryPrompt();
console.log(cursor.next().value);
console.log(cursor.throw(new Error('offline')).value);
console.log(JSON.stringify(cursor.next()));
try {
  cursor.throw(new Error('late'));
} catch (error) {
  console.log(error.message);
}
// Expected output:
// attempt
// retry:offline
// {"value":"settled","done":true}
// late
```

A throw in a `for...of` loop body does not call the iterator's `throw()` method. The loop instead attempts iterator closing through `return()`. These are distinct protocols: `throw()` injects an error when explicitly driven or forwarded by delegation; `return()` requests completion. See [Generator.prototype.throw](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator/throw).

## 7. Early Exit Has a Cleanup Protocol

When a `for...of` consumer exits early through `break`, an enclosing function's `return`, or an exception from the loop body, it looks for the iterator's optional `return()` method. A generator's return method resumes entered `finally` blocks. Normal exhaustion already executes ordinary body cleanup while reaching the end; the loop does not then make an extra `return()` call.

```js
'use strict';

const events = [];
function* rows() {
  events.push('open');
  try {
    yield 'row-1';
    yield 'row-2';
  } finally {
    events.push('close');
  }
}
for (const row of rows()) {
  events.push(row);
  break;
}
console.log(events.join(','));
events.length = 0;
const cursor = rows();
cursor.next();
console.log(events.join(','));
console.log(cursor.return('cancelled').done, events.join(','));
// Expected output:
// open,row-1,close
// open
// true open,close
```

Simply stopping manual calls to `next()` does not close the cursor. Garbage collection is not a substitute for this lifecycle. If `next()` itself fails, or a step result is malformed, `for...of` does not automatically call `return()` for that failure. A producer must clean up its own failing operation. The [IteratorClose algorithm](https://tc39.es/ecma262/multipage/abstract-operations.html#sec-iteratorclose) also handles errors from cleanup: a pending consumer throw retains precedence over an error thrown by the close method; an ordinary `break` has no such pending throw to preserve.

A return request is not an unconditional guarantee that the generator is already finished. A `finally` block can itself yield, making `.return()` produce `done: false`. Built-in iterator closing does not repeatedly drain those yielded cleanup steps. Resource cleanup should normally finish without yielding. Calling `.return()` before the first `next()` completes a generator without entering its body, so it cannot execute a body `finally` that was never entered. See the [return method's control flow](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator/return) and the [debugging examples](09-edge-cases-debugging.md).

## 8. Delegation Connects Two Iteration Conversations

`yield* iterable` delegates traversal. It yields the delegate's elements, forwards later resume inputs, and uses the delegate's completion value as the value of the `yield*` expression. This differs from `yield iterable`, which yields the iterable object as one element.

```js
'use strict';

function* detail() {
  const token = yield 'detail';
  return `ack:${token}`;
}
function* envelope() {
  yield 'header';
  const acknowledgement = yield* detail();
  yield acknowledgement;
  return 'end';
}
const cursor = envelope();
console.log(cursor.next().value);
console.log(cursor.next().value);
console.log(cursor.next('seen').value);
console.log(JSON.stringify(cursor.next()));
// Expected output:
// header
// detail
// ack:seen
// {"value":"end","done":true}
```

Delegation also forwards return and throw requests when supported. If the delegate has no `return()`, an outer return request can still complete the outer generator. If it has no `throw()`, delegation attempts its optional `return()` and then raises a `TypeError` when that close succeeds. A delegate can return `done: false` from its control methods, so delegation has more behavior than a loop that only copies values. It does not recursively flatten arbitrary nested arrays. See [`yield*`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/yield*).

## 9. Lazy Pull Does Not Imply Asynchronous Work

The consumer decides when to request the next item. Each synchronous `next()` then runs until a yield, completion, or exception. Long work before the next yield still occupies the current JavaScript thread. A synchronous generator that yields a promise produces that promise as a value; it does not await it, schedule a worker, or establish a concurrency limit.

Lazy composition can avoid constructing intermediate arrays, but not all storage. A pipeline can retain its upstream source, closures, and buffers while suspended. Turning the final iterator into an array still materializes all its produced elements. Never spread an unbounded sequence merely to inspect it. The [production examples](04-production-examples.md) make validation, buffering, and cleanup part of their contracts.

Async iterables use `[Symbol.asyncIterator]` and promise-based steps; async generators and `for await...of` belong to asynchronous consumption. Keep those promises separate from the synchronous lifecycle taught here. Newer iterator helper APIs also have runtime-version and receiver requirements. These examples use the underlying language protocols and run on Node.js 20 without assuming global `Iterator` helpers are available.

## 10. Choose the Interface Before the Implementation

| Need | Useful starting point | Contract to state |
| --- | --- | --- |
| Small stable collection with indexing | Array | Who owns the array and its elements? |
| Multiple independent sequential passes | Iterable that creates fresh cursors | Are values live, copied, or recomputed? |
| One traversal with local suspended state | Generator object | Who owns advancement and early closing? |
| Explicit cursor or unusual state policy | Hand-written iterator | What happens after exhaustion and after failure? |
| Values computed asynchronously | Async iterable | How are errors, cancellation, and buffering handled? |

Generators reduce the code needed to express suspended control flow. They do not remove the need to specify data ownership, finite work, cleanup, or error behavior. Carry those decisions into the [exercises](06-exercises-coding-challenges.md) and [field guide](11-professional-field-guide.md).
