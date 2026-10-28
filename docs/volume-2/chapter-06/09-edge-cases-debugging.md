# Edge Cases, Debugging, and Failure Modes

## A Result Must Be an Object; Done Is Tested for Truthiness

A callable `next` is only the start of the protocol. A primitive result is invalid. A result with a misleading truthy `done` value ends traversal even if it also carries a value:

```js
'use strict';
const malformed = {
  [Symbol.iterator]() { return this; },
  next() { return 7; }
};
try { [...malformed]; } catch (error) { console.log(error.name); }
const surprising = {
  [Symbol.iterator]() { return this; },
  next() { return { value: 'row', done: 'false' }; }
};
console.log([...surprising].length);
// Expected output:
// TypeError
// 0
```

Use explicit boolean `done` flags when implementing a cursor. An omitted `done` behaves as false; an omitted `value` can therefore yield `undefined`. Do not use a value such as `undefined` as a universal end marker when the protocol already provides `done`.

## Closing Before the First Next Does Not Enter the Body

```js
'use strict';
const events = [];
function* openReport() {
  events.push('open');
  try { yield 'row'; }
  finally { events.push('close'); }
}
const unused = openReport();
console.log(unused.return('cancelled').done, events.length);
const started = openReport();
console.log(started.next().value);
console.log(started.return().done, events.join(','));
// Expected output:
// true 0
// row
// true open,close
```

The unused generator never acquires anything. This is why [resource acquisition belongs inside the managed generator](04-production-examples.md). If an outer function acquires a resource and then returns an unstarted generator containing the cleanup, that generator's `return()` cannot reach a `finally` block it never entered. Such an API needs a separate disposal contract or a different acquisition boundary.

## A Yield Inside Finally Can Delay Cleanup

```js
'use strict';
const events = [];
function* rows() {
  try { yield 'row'; }
  finally {
    events.push('cleanup-start');
    yield 'cleanup-message';
    events.push('cleanup-end');
  }
}
const cursor = rows();
for (const row of cursor) {
  console.log(row);
  break;
}
console.log(events.join(','));
console.log(cursor.next().done);
console.log(events.join(','));
// Expected output:
// row
// cleanup-start
// true
// cleanup-start,cleanup-end
```

The loop calls `return`, but closing checks that the result is an object; it does not keep resuming the generator until `done` becomes true. Here `return` encounters another `yield` and leaves cleanup suspended. The later manual `next` completes it. Keep essential resource-release work free of yields, and do not put it after an optional cleanup notification. [`Generator.prototype.return`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator/return) documents this suspended-finally behavior.

## A Producer Failure Is Different from a Consumer Failure

```js
'use strict';
function demonstrate(failDuringPull) {
  let closes = 0;
  const source = {
    [Symbol.iterator]() { return this; },
    next() {
      if (failDuringPull) throw new Error('pull-error');
      return { value: 'row', done: false };
    },
    return() { closes += 1; return { done: true }; }
  };
  try {
    for (const row of source) { throw new Error('consumer-error'); }
  } catch (error) {
    console.log(error.message, closes);
  }
}
demonstrate(true);
demonstrate(false);
// Expected output:
// pull-error 0
// consumer-error 1
```

If `next` itself fails, the producer must release its own resources. A generator whose read operation is inside `try...finally` can do that as the error leaves its body. An external loop cannot be treated as a universal repair mechanism for a broken iterator. Errors while obtaining a result's `done` or `value` also belong to the iteration step, rather than the loop body. See [iteration error handling](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#error_handling).

## Two Errors Need an Explicit Priority

```js
'use strict';
function brokenCloser() {
  return {
    [Symbol.iterator]() { return this; },
    next() { return { value: 1, done: false }; },
    return() { throw new Error('close-error'); }
  };
}
try {
  for (const value of brokenCloser()) { break; }
} catch (error) { console.log(error.message); }
try {
  for (const value of brokenCloser()) { throw new Error('body-error'); }
} catch (error) { console.log(error.message); }
// Expected output:
// close-error
// body-error
```

During iterator closing, an existing thrown consumer error wins over a closing error. Without that earlier throw, a closing error can replace a normal early exit. This language rule is separate from ordinary `try...finally` inside a producer, where a throw in `finally` can replace an earlier throw from its body. Resource adapters should decide whether to preserve, aggregate, or report cleanup failures and document that policy. Do not assume that every layer uses the same precedence.

## Yielding an Object Does Not Transfer Exclusive Ownership

```js
'use strict';
function* reusedRecord() {
  const row = { id: 0 };
  for (const id of [1, 2]) {
    row.id = id;
    yield row;
  }
}
const shared = [...reusedRecord()];
console.log(shared.map(row => row.id).join(','), shared[0] === shared[1]);
const copied = Array.from(reusedRecord(), row => ({ ...row }));
console.log(copied.map(row => row.id).join(','), copied[0] === copied[1]);
// Expected output:
// 2,2 true
// 1,2 false
```

The first consumer stores the same object twice. The second copies each trusted ordinary row while its current value is available. That shallow copy is sufficient for this primitive-only schema; it would still share nested objects. A producer that reuses a buffer must make its lifetime contract explicit. The [export batcher](04-production-examples.md) instead returns detached record values and fresh batch containers.

## A Generator Cannot Resume Itself While Executing

```js
'use strict';
let cursor;
function* reenter() { yield cursor.next(); }
cursor = reenter();
try { cursor.next(); } catch (error) { console.log(error.name); }
console.log(cursor.next().done);
// Expected output:
// TypeError
// true
```

The inner `next` attempts to resume an already executing generator. Its `TypeError` escapes the outer body and completes that generator. If the body catches such an error, its subsequent control flow can differ. Review callbacks invoked during a pull: they may indirectly call the same cursor again.

## Other Boundaries to Check

- **Live input:** an array iterator reads its source as traversal advances; it is not a snapshot. Mutation can change later values and length. Copy deliberately if a stable view is required.
- **Strings:** string iteration advances by Unicode code points, which can still differ from user-perceived grapheme clusters. Character counts need an explicit definition.
- **Destructuring:** a bounded pattern can close an iterator after obtaining enough elements. A rest element consumes the remainder and may never finish for an infinite source.
- **Promises:** yielding a promise from a synchronous generator exposes that promise as a value to `for...of`; the loop does not await it. An async iterable is a different protocol.
- **Abandonment:** retaining a partially consumed generator without closing it does not run `finally`. Garbage collection is not a deterministic resource-release API.
- **New helpers:** the existence of `Symbol.iterator` does not imply that the runtime exposes every newer `Iterator` helper. Check the exact runtime and API before using them.

## A Debugging Sequence

1. Record which object is the iterable and which is the current iterator; check whether two consumers share a cursor.
2. Log bounded counters for iterator acquisition, `next`, and closing. Avoid serializing sensitive records just to trace progress.
3. Inspect each result's shape and `done` before reasoning about its `value`.
4. Locate the failure: acquisition, producer step, result access, consumer body, or cleanup.
5. Test exhaustion, early exit, never-started disposal, and failure separately.
6. Inspect retained source references and the identity of yielded containers.

Run `node code/volume-2/chapter-06/example-04-edge-cases.js` for assertions around these boundaries.
