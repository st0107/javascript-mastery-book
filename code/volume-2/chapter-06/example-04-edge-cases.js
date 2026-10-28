'use strict';
const assert = require('node:assert/strict');

// Malformed results and result getters fail during the producer's step.
for (const next of [
  () => 7,
  () => ({ get done() { throw new Error('done failed'); } }),
  () => ({ done: false, get value() { throw new Error('value failed'); } })
]) {
  let closes = 0;
  const source = {
    [Symbol.iterator]() { return this; },
    next,
    return() { closes += 1; return { done: true }; }
  };
  assert.throws(() => [...source]);
  assert.equal(closes, 0);
}
assert.deepEqual([...{
  [Symbol.iterator]() { return this; },
  next() { return { value: 'hidden', done: 'false' }; }
}], []);

// An unstarted generator has not entered the acquisition/cleanup boundary.
{
  const events = [];
  function* resource() {
    events.push('open');
    try { yield 'row'; }
    finally { events.push('close'); }
  }
  const unused = resource();
  assert.deepEqual(unused.return('cancelled'), { value: 'cancelled', done: true });
  assert.deepEqual(events, []);
  const unstartedThrow = resource();
  const error = new Error('cancelled before start');
  assert.throws(() => unstartedThrow.throw(error), thrown => thrown === error);
  assert.deepEqual(events, []);
  assert.equal(unstartedThrow.next().done, true);
  const active = resource();
  assert.equal(active.next().value, 'row');
  assert.equal(active.return().done, true);
  active.return();
  active.next();
  assert.deepEqual(events, ['open', 'close']);
}

// IteratorClose does not drive a yielding finally block to completion.
{
  const events = [];
  function* deferredCleanup() {
    try { yield 'row'; }
    finally {
      events.push('start');
      yield 'cleanup-message';
      events.push('end');
    }
  }
  const direct = deferredCleanup();
  direct.next();
  assert.deepEqual(direct.return('stopped'), { value: 'cleanup-message', done: false });
  assert.deepEqual(events, ['start']);
  assert.deepEqual(direct.next(), { value: 'stopped', done: true });
  assert.deepEqual(events, ['start', 'end']);
  events.length = 0;
  const loop = deferredCleanup();
  for (const row of loop) { assert.equal(row, 'row'); break; }
  assert.deepEqual(events, ['start']);
  assert.equal(loop.next().done, true);
  assert.deepEqual(events, ['start', 'end']);
}

// Producer failure and consumer failure have different closing paths.
{
  const producerError = new Error('pull');
  const consumerError = new Error('consumer');
  const closeError = new Error('close');
  function source({ failPull = false, failClose = false } = {}) {
    let closes = 0;
    return {
      get closes() { return closes; },
      [Symbol.iterator]() { return this; },
      next() {
        if (failPull) throw producerError;
        return { value: 1, done: false };
      },
      return() {
        closes += 1;
        if (failClose) throw closeError;
        return { done: true };
      }
    };
  }
  const failedPull = source({ failPull: true });
  assert.throws(() => [...failedPull], error => error === producerError);
  assert.equal(failedPull.closes, 0);
  const failedBody = source({ failClose: true });
  assert.throws(() => {
    for (const value of failedBody) { throw consumerError; }
  }, error => error === consumerError);
  assert.equal(failedBody.closes, 1);
  const failedBreak = source({ failClose: true });
  assert.throws(() => {
    for (const value of failedBreak) { break; }
  }, error => error === closeError);
  assert.equal(failedBreak.closes, 1);
}

// Capturing references does not snapshot a reused mutable record.
{
  function* reusedRecord() {
    const row = { id: 0 };
    for (const id of [1, 2]) { row.id = id; yield row; }
  }
  const shared = [...reusedRecord()];
  assert.equal(shared[0], shared[1]);
  assert.deepEqual(shared.map(row => row.id), [2, 2]);
  const copied = Array.from(reusedRecord(), row => ({ ...row }));
  assert.notEqual(copied[0], copied[1]);
  assert.deepEqual(copied.map(row => row.id), [1, 2]);
}

// Reentrancy throws; an uncaught error completes this generator.
{
  let cursor;
  function* reenter() { yield cursor.next(); }
  cursor = reenter();
  assert.throws(() => cursor.next(), TypeError);
  assert.equal(cursor.next().done, true);
  const laterError = new Error('completed');
  assert.throws(() => cursor.throw(laterError), error => error === laterError);
  assert.deepEqual(cursor.return(9), { value: 9, done: true });
}

// Live arrays, bounded destructuring, and synchronous promise values.
{
  const rows = [1, 2];
  const cursor = rows[Symbol.iterator]();
  assert.equal(cursor.next().value, 1);
  rows[1] = 20;
  rows.push(30);
  assert.deepEqual([...cursor], [20, 30]);
  let closed = 0;
  function* resource() {
    try { yield 1; yield 2; }
    finally { closed += 1; }
  }
  const [first] = resource();
  assert.equal(first, 1);
  assert.equal(closed, 1);
  const promise = Promise.resolve('row');
  function* syncValues() { yield promise; }
  assert.equal([...syncValues()][0], promise);
}

console.log('Iterator edge-case assertions passed.');
// Expected output:
// Iterator edge-case assertions passed.

// Each fixture is bounded and uses constant-size test data.
