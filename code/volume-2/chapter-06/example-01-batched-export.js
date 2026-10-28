'use strict';

const assert = require('node:assert/strict');

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

function trackedSource(rows, failAt = -1) {
  const stats = { starts: 0, pulls: 0, closes: 0 };
  let index = 0;
  let finished = false;
  const iterator = {
    [Symbol.iterator]() { stats.starts += 1; return this; },
    next() {
      stats.pulls += 1;
      if (index === failAt) throw new Error('Source pull failed');
      if (finished || index === rows.length) {
        finished = true;
        return { done: true };
      }
      return { value: rows[index++], done: false };
    },
    return() { stats.closes += 1; finished = true; return { done: true }; }
  };
  return { iterator, stats };
}

const row = (id, cents = 10) => ({ id, cents });
const early = trackedSource([row('A'), row('B'), row('C')]);
const batches = batchExportRows(early.iterator, 2);
assert.deepEqual(early.stats, { starts: 0, pulls: 0, closes: 0 });
for (const batch of batches) {
  assert.deepEqual(batch.map(item => item.id), ['A', 'B']);
  assert.equal(early.stats.pulls, 2);
  break;
}
assert.deepEqual(early.stats, { starts: 1, pulls: 2, closes: 1 });
assert.deepEqual([...batches], []);

for (const size of [0, -1, 1001, 1.5, NaN, Infinity, '2']) {
  assert.throws(() => batchExportRows(early.iterator, size), RangeError);
}
const untouched = trackedSource([row('A')]);
batchExportRows(untouched.iterator, 1).return();
assert.equal(untouched.stats.starts, 0);
for (const size of [1, 1000]) assert.deepEqual([...batchExportRows([], size)], []);
const invalidSource = batchExportRows(null, 2);
assert.throws(() => invalidSource.next(), TypeError);

const records = [row('A'), row('B'), row('C'), row('D'), row('E')];
const complete = trackedSource(records);
const all = [...batchExportRows(complete.iterator, 2)];
assert.deepEqual(all.map(batch => batch.length), [2, 2, 1]);
assert.equal(complete.stats.pulls, 6); // Five values and one completion result.
assert.equal(complete.stats.closes, 0); // Normal exhaustion does not call return().
assert.notEqual(all[0], all[1]);
assert.notEqual(all[0][0], records[0]);
records[0].cents = 99;
assert.equal(all[0][0].cents, 10);
assert.ok(Object.isFrozen(all[0][0]));
assert.throws(() => { all[0][0].cents = 20; }, TypeError);
all[0].pop();
assert.equal(all[1].length, 2);
assert.equal([...batchExportRows(records, 2)].length, 3);
assert.equal([...batchExportRows(records, 2)].length, 3);

let getterCalls = 0;
const accessor = { cents: 1, get id() { getterCalls += 1; return 'A'; } };
for (const invalid of [null, [], { id: 'A' }, { id: 'A', cents: 1, extra: true },
  { id: 'A', cents: 1, [Symbol('extra')]: true }, accessor,
  { id: '', cents: 1 }, { id: 'x'.repeat(33), cents: 1 }, { id: 1, cents: 1 },
  { id: 'A', cents: -1 }, { id: 'A', cents: 1.5 }, { id: 'A', cents: NaN },
  { id: 'A', cents: 1000000001 }, { id: 'A', cents: '1' }]) {
  const tracked = trackedSource([invalid]);
  assert.throws(() => batchExportRows(tracked.iterator, 2).next());
  assert.equal(tracked.stats.closes, 1);
}
assert.equal(getterCalls, 0);
assert.equal(snapshotExportRow(Object.assign(Object.create(null), row('null-prototype'))).id, 'null-prototype');
assert.equal(snapshotExportRow(row('zero', 0)).cents, 0);
assert.equal(snapshotExportRow(row('upper', 1000000000)).cents, 1000000000);

const laterFailure = trackedSource([row('A'), row('B'), row('bad', -1)]);
const partial = batchExportRows(laterFailure.iterator, 2);
const emitted = partial.next().value;
assert.throws(() => partial.next(), RangeError);
assert.deepEqual(emitted.map(item => item.id), ['A', 'B']);
assert.equal(laterFailure.stats.closes, 1);

// A failure in the source's next() is not a loop-body failure.
const pullFailure = trackedSource([row('A')], 0);
assert.throws(() => batchExportRows(pullFailure.iterator, 2).next(), /Source pull failed/);
assert.equal(pullFailure.stats.closes, 0);

console.log('early exit: 2 pulls, 1 close');
console.log('batch lengths: 2,2,1');
console.log('batched export assertions passed');
// Expected output:
// early exit: 2 pulls, 1 close
// batch lengths: 2,2,1
// batched export assertions passed

// O(n) row processing and O(b) batch storage for n accepted rows and batch size b,
// excluding source work/storage and batches retained by the consumer.
