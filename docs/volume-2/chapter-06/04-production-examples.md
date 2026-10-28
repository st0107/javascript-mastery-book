# Production Examples

## Lazy Batches With Owned Export Rows

An export worker receives a synchronous iterable of trusted application records. It should request records only when the consumer requests another batch. Each accepted record has exactly two own data fields: an `id` containing 1–32 ASCII letters, digits, underscores, or hyphens, and integer `cents` from zero through 1,000,000,000. Accepted records have `Object.prototype` or `null` as their prototype. Accessors, extra string or symbol keys, and other object kinds are rejected. This contract excludes hostile proxies; descriptor inspection can invoke their traps.

The consumer owns each new batch array. Its rows are detached, frozen snapshots containing only primitive values, so later mutation of input records cannot rewrite an already emitted batch. Array mutation is allowed: the producer never reuses a yielded array. The generator object itself is a one-shot iterator.

`batchExportRows` is an ordinary function around a generator. It validates batch size immediately, before any source iteration. Iterability and individual records are checked only when execution reaches them during `next()`. A failure in a later batch cannot retract rows that the consumer already processed.

```js
'use strict';

function snapshotExportRow(input) {
  if (input === null || typeof input !== 'object') throw new TypeError('Expected an export record');
  const prototype = Object.getPrototypeOf(input);
  if (prototype !== Object.prototype && prototype !== null) throw new TypeError('Unsupported record');
  if (Reflect.ownKeys(input).length !== 2) throw new TypeError('Expected exactly id and cents');
  const id = Object.getOwnPropertyDescriptor(input, 'id');
  const cents = Object.getOwnPropertyDescriptor(input, 'cents');
  if (!id || !cents || !Object.hasOwn(id, 'value') || !Object.hasOwn(cents, 'value')) {
    throw new TypeError('Expected own data fields');
  }
  if (typeof id.value !== 'string' || !/^[A-Za-z0-9_-]{1,32}$/.test(id.value)) {
    throw new TypeError('Invalid export id');
  }
  if (!Number.isInteger(cents.value) || cents.value < 0 || cents.value > 1000000000) {
    throw new RangeError('Invalid cents');
  }
  return Object.freeze({ id: id.value, cents: cents.value });
}

function batchExportRows(source, size) {
  if (!Number.isInteger(size) || size < 1 || size > 1000) {
    throw new RangeError('Batch size must be an integer from 1 through 1000');
  }
  return (function* () {
    let batch = [];
    for (const input of source) {
      batch.push(snapshotExportRow(input));
      if (batch.length === size) {
        const complete = batch;
        batch = [];
        yield complete;
      }
    }
    if (batch.length > 0) yield batch;
  })();
}

const records = [
  { id: 'A', cents: 100 },
  { id: 'B', cents: 200 },
  { id: 'C', cents: 300 }
];
let pulled = 0;
let closed = 0;
function* source() {
  try {
    for (const record of records) {
      pulled += 1;
      yield record;
    }
  } finally {
    closed += 1;
  }
}
const batches = batchExportRows(source(), 2);
console.log(pulled, closed);
for (const batch of batches) {
  records[0].cents = 999;
  console.log(batch.map(record => `${record.id}:${record.cents}`).join(','));
  break;
}
console.log(pulled, closed);
console.log([...batches].length);
// Expected output:
// 0 0
// A:100,B:200
// 2 1
// 0
```

### Pull Counts Are Part of the Contract

A full batch is yielded immediately after its last accepted row, without requesting the next row. Breaking after the first two-row batch therefore consumes exactly two source values. The third row remains unread. A final partial batch is different: the source must first report completion so the producer knows no additional row can fill that batch. An empty source yields no batch.

Resuming after a full batch continues the loop. Breaking the consumer's `for...of` calls the batch generator's `return()`; leaving its suspended inner `for...of` then closes the source iterator if it provides `return()`. A row-validation exception also occurs inside the inner loop body and initiates that cleanup. The relevant language operation is [IteratorClose](https://tc39.es/ecma262/multipage/abstract-operations.html#sec-iteratorclose).

A source iterator whose own `next()` throws has a different responsibility. The inner `for...of` does not automatically call that iterator's `return()` for a failure in the pull itself. A resource-owning source must clean up its own failed pulls, as the cursor adapter below does. The batcher is not a universal resource manager. Ordinary array iterators own no external resource; a generator source can place its own acquisition and reads inside `try/finally`.

### Validation and Ownership Boundaries

The first call to `batchExportRows(null, 2)` returns a generator; the first `next()` throws because `null` cannot be iterated. In contrast, `batchExportRows([], 0)` throws immediately. This timing is intentional and should appear in API documentation and tests.

Before the first pull, the batcher has not acquired the source iterator. Returning the unstarted batch generator therefore does not call the source's `return()`. A caller that supplies an already opened resource iterator retains responsibility for it if consumption never begins; creating the source lazily avoids that gap.

Each output row copies two validated primitives, so a shallow freeze is sufficient for this schema. The batch array stays mutable, but it is a separate array from every later batch. A future nested field requires an explicit copying and ownership policy; adding a spread operation would not automatically detach nested state.

Calling the function twice with an array starts two independent traversals. Passing the same already consumed generator twice does not restart that source. For replay, pass a fresh source from a factory. A live source can also change between pulls; lazy consumption does not imply a whole-export snapshot or a transaction.

**Cost:** For `n` accepted rows and batch size `b`, row processing is `O(n)` and current batch storage is `O(b)`, excluding source costs and batches retained by the consumer. Accepted records and strings have fixed bounds. Rejecting a malformed record may inspect its complete own-key list or an overlong ID, so ingress limits still matter. Materializing every batch with spread restores `O(n)` result storage. Synchronous pulls run on the caller's thread and may block even though the sequence is lazy.

The companion `code/volume-2/chapter-06/example-01-batched-export.js` checks exact pull counts, normal completion, early closure, empty input, invalid sizes, deferred input failure, row isolation, fresh arrays, accessor rejection, late validation failure, and the distinction between pull failure and loop-body failure.

## A Cursor With Deterministic Cleanup

A cursor can own a database statement, decoder state, or another resource, but this example uses an in-memory factory so the lifecycle is deterministic and independently runnable. The adapter accepts a trusted synchronous factory. A successful call returns a cursor with `read()` and `close()` methods. `read()` returns an ordinary result containing a boolean `done` and, when unfinished, a `value`. Values follow the cursor's ownership contract; this adapter does not clone them.

The factory owns partial acquisition. If opening throws, it must undo any work for which it has already taken responsibility. Once the factory returns a valid cursor, the adapter owns one close attempt on every exit from its active body: normal completion, early return, a consumer's loop exit, a read failure, or an error injected with `throw()`.

Acquisition occurs inside the generator body. Creating an iterator does not open a cursor. Returning from an iterator that was never started also opens nothing. Keeping acquisition outside the generator would create a resource before its cleanup block could ever run.

```js
'use strict';

function readCursor(openCursor) {
  if (typeof openCursor !== 'function') throw new TypeError('Expected a cursor factory');
  return (function* () {
    const cursor = openCursor();
    let failed = false;
    let primaryError;
    try {
      while (true) {
        const step = cursor.read();
        if (step.done) return;
        yield step.value;
      }
    } catch (error) {
      failed = true;
      primaryError = error;
      throw error;
    } finally {
      try {
        cursor.close();
      } catch (closeError) {
        if (failed) {
          throw new AggregateError([primaryError, closeError], 'Cursor operation and close both failed');
        }
        throw closeError;
      }
    }
  })();
}

const events = [];
const values = ['row-A', 'row-B'];
function openMemoryCursor() {
  events.push('open');
  let index = 0;
  return {
    read() {
      events.push('read');
      return index === values.length
        ? { done: true }
        : { value: values[index++], done: false };
    },
    close() { events.push('close'); }
  };
}
const rows = readCursor(openMemoryCursor);
console.log(events.length);
for (const value of rows) {
  console.log(value);
  break;
}
console.log(events.join(' -> '));
console.log(rows.next().done);
// Expected output:
// 0
// row-A
// open -> read -> close
// true
```

### Trace the Ownership Transfer

1. `readCursor` checks that it received a function and creates an iterator. The factory has not run.
2. The first pull invokes the factory, then reads and yields one value.
3. The consumer breaks. Its loop requests `return()` on the suspended generator.
4. The pending return passes through `finally`, which calls `close()` once. There is no cleanup `yield` to suspend that work.
5. The iterator completes. Later `next()` calls do not reopen it; later `return()` calls do not close the same cursor again.

On exhaustion, one read supplies the final completion result, and `finally` closes the cursor. If `read()` throws, that exception originates within the generator's own protected body, so its `finally` still runs. This differs from hoping that a consuming `for...of` will repair an arbitrary source iterator's failed `next()`.

### Make Failure Precedence Explicit

If a read fails and close succeeds, the original read error is rethrown. If both an operation inside the generator and close fail, the adapter throws an `AggregateError` containing the primary error first and the close error second. If only close fails during exhaustion or an explicit return, its error propagates. An attempted close is not a promise that a failing resource was successfully released.

A consumer exception thrown from a `for...of` body is outside this generator. The loop invokes `return()`, rather than injecting the exception with the generator's `throw()` method. Under `IteratorClose`, that already pending loop-body exception takes precedence over a close error. The adapter therefore cannot promise to aggregate an exception it never receives. If recording every close failure is a product requirement, give the resource layer a separate, bounded diagnostic channel.

The cursor factory is deliberately trusted. A function-valued check does not prove a value is callable without throwing, nor validate the cursor it returns. Factories must return the stated interface or clean up before throwing; this is not a generic adapter for malformed results, arbitrary promises, or untrusted JavaScript. Real adapters should also specify whether a failing close is retryable and who owns such retries.

### Abandonment Is Not an Exit Operation

A caller that manually pulls one row and then retains or abandons the suspended iterator has not requested completion. No language rule turns that inactivity into a prompt `close()`. Exhaust the iterator or explicitly call `return()` in the consumer's own `finally` when taking manual ownership. Do not rely on garbage collection for timely cleanup. A [generator return request](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator/return) can run a suspended `finally`, but cleanup code that itself yields would require further resumption; this adapter intentionally has no such yield.

Calling `readCursor(openMemoryCursor)` again creates a new traversal with its own future cursor. Reusing the completed `rows` object does not. A factory that returns the same live cursor repeatedly violates the intended ownership contract.

**Cost:** The adapter performs `O(n)` control work for `n` values and uses `O(1)` bookkeeping state, excluding acquisition, read, close, cursor storage, and retained value graphs. Its current result and cursor references can keep much larger objects reachable. The in-memory fixture already owns its array, so this example does not claim end-to-end constant memory. A synchronous generator cannot make blocking I/O concurrent; asynchronous iteration belongs to the scheduling and asynchronous JavaScript material.

The companion `code/volume-2/chapter-06/example-02-managed-cursor.js` checks unopened return, empty and complete traversal, early break, manual return, repeated calls, consumer errors, read errors, combined read/close errors, close-only errors, injected exceptions, and acquisition failure. These checks make the resource contract observable without requiring a database or network.
