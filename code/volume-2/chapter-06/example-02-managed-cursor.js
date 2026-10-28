'use strict';

const assert = require('node:assert/strict');

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

function makeFactory(rows, { readFailure, failAt = -1, closeFailure } = {}) {
  const stats = { opens: 0, reads: 0, closes: 0 };
  return {
    stats,
    open() {
      stats.opens += 1;
      let index = 0;
      let closed = false;
      return {
        read() {
          assert.equal(closed, false);
          stats.reads += 1;
          if (index === failAt) throw readFailure;
          if (index === rows.length) return { done: true };
          return { value: rows[index++], done: false };
        },
        close() {
          assert.equal(closed, false);
          closed = true;
          stats.closes += 1;
          if (closeFailure) throw closeFailure;
        }
      };
    }
  };
}

assert.throws(() => readCursor(null), TypeError);
const unopened = makeFactory(['A']);
const unused = readCursor(unopened.open);
assert.equal(unopened.stats.opens, 0);
assert.deepEqual(unused.return('unused'), { value: 'unused', done: true });
assert.deepEqual(unopened.stats, { opens: 0, reads: 0, closes: 0 });

const normal = makeFactory(['A', 'B']);
assert.deepEqual([...readCursor(normal.open)], ['A', 'B']);
assert.deepEqual(normal.stats, { opens: 1, reads: 3, closes: 1 });
assert.deepEqual([...readCursor(normal.open)], ['A', 'B']);
assert.equal(normal.stats.opens, 2);
assert.equal(normal.stats.closes, 2);
const empty = makeFactory([]);
assert.deepEqual([...readCursor(empty.open)], []);
assert.deepEqual(empty.stats, { opens: 1, reads: 1, closes: 1 });

const early = makeFactory(['A', 'B']);
const earlyIterator = readCursor(early.open);
for (const value of earlyIterator) {
  assert.equal(value, 'A');
  break;
}
assert.deepEqual(early.stats, { opens: 1, reads: 1, closes: 1 });
assert.deepEqual([...earlyIterator], []);
earlyIterator.return();
assert.equal(early.stats.closes, 1);

const manual = makeFactory(['A', 'B']);
const iterator = readCursor(manual.open);
assert.deepEqual(iterator.next(), { value: 'A', done: false });
assert.deepEqual(iterator.return('stopped'), { value: 'stopped', done: true });
assert.deepEqual(manual.stats, { opens: 1, reads: 1, closes: 1 });

const consumerError = new Error('Consumer failed');
const consumer = makeFactory(['A']);
assert.throws(() => {
  for (const value of readCursor(consumer.open)) throw consumerError;
}, error => error === consumerError);
assert.equal(consumer.stats.closes, 1);

const readError = new Error('Read failed');
const readFailure = makeFactory(['A'], { readFailure: readError, failAt: 0 });
assert.throws(() => readCursor(readFailure.open).next(), error => error === readError);
assert.deepEqual(readFailure.stats, { opens: 1, reads: 1, closes: 1 });

const closeError = new Error('Close failed');
const doubleFailure = makeFactory(['A'], {
  readFailure: readError, failAt: 0, closeFailure: closeError
});
assert.throws(() => readCursor(doubleFailure.open).next(), error => {
  assert.ok(error instanceof AggregateError);
  assert.deepEqual(error.errors, [readError, closeError]);
  return true;
});
assert.equal(doubleFailure.stats.closes, 1);

const closeFailure = makeFactory([], { closeFailure: closeError });
assert.throws(() => readCursor(closeFailure.open).next(), error => error === closeError);
const consumerAndClose = makeFactory(['A'], { closeFailure: closeError });
assert.throws(() => {
  for (const value of readCursor(consumerAndClose.open)) throw consumerError;
}, error => error === consumerError); // IteratorClose preserves the loop-body throw.
assert.equal(consumerAndClose.stats.closes, 1);

const injected = makeFactory(['A']);
const injectedIterator = readCursor(injected.open);
injectedIterator.next();
assert.throws(() => injectedIterator.throw(consumerError), error => error === consumerError);
assert.equal(injected.stats.closes, 1);

const acquisitionError = new Error('Open failed');
assert.throws(() => readCursor(() => { throw acquisitionError; }).next(),
  error => error === acquisitionError);

console.log('exhaustion: 1 open, 3 reads, 1 close');
console.log('early exit: 1 open, 1 read, 1 close');
console.log('managed cursor assertions passed');
// Expected output:
// exhaustion: 1 open, 3 reads, 1 close
// early exit: 1 open, 1 read, 1 close
// managed cursor assertions passed

// O(n) adapter work for n values, O(1) adapter state, excluding the cursor,
// acquisition/close costs, and values retained by the consumer.
