'use strict';
const assert = require('node:assert/strict');

function summarizeOrders(input) {
  if (!Array.isArray(input)) throw new TypeError('orders must be an array');
  if (input.length > 1000) throw new RangeError('at most 1000 orders');
  const seen = new Set();
  const normalized = [];
  for (let index = 0; index < input.length; index += 1) {
    if (!Object.hasOwn(input, index)) throw new TypeError('orders must be dense');
    const row = input[index];
    if (row === null || typeof row !== 'object' || Array.isArray(row)) {
      throw new TypeError('order must be a data record');
    }
    const { id, status, amountCents } = row;
    if (typeof id !== 'string' || id.length < 1 || id.length > 64) {
      throw new TypeError('order id must be a bounded string');
    }
    if (!['paid', 'pending', 'cancelled'].includes(status)) throw new RangeError('unknown status');
    if (!Number.isSafeInteger(amountCents) || amountCents < 0 || amountCents > 100000000) {
      throw new RangeError('amountCents out of range');
    }
    if (seen.has(id)) throw new RangeError('duplicate order id');
    seen.add(id);
    normalized.push({ id, status, amountCents });
  }
  const paid = normalized.filter(row => row.status === 'paid');
  const ordered = paid.toSorted((a, b) =>
    b.amountCents - a.amountCents || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  );
  return {
    paidCount: ordered.length,
    totalCents: ordered.reduce((sum, row) => sum + row.amountCents, 0),
    items: ordered.map(({ id, amountCents }) => ({ id, amountCents }))
  };
}

const input = [
  { id: 'b', status: 'paid', amountCents: 500 },
  { id: 'a', status: 'paid', amountCents: 500 },
  { id: 'c', status: 'pending', amountCents: 900 }
];
const result = summarizeOrders(input);
assert.deepEqual(result, {
  paidCount: 2, totalCents: 1000,
  items: [{ id: 'a', amountCents: 500 }, { id: 'b', amountCents: 500 }]
});
assert.deepEqual(input.map(row => row.id), ['b', 'a', 'c']);
assert.notEqual(result.items[0], input[1]);
assert.throws(() => summarizeOrders(new Array(1)), TypeError);
assert.throws(() => summarizeOrders([input[0], input[0]]), RangeError);
console.log(JSON.stringify(result));
console.log(JSON.stringify(summarizeOrders([])));

// Expected output:
// {"paidCount":2,"totalCents":1000,"items":[{"id":"a","amountCents":500},{"id":"b","amountCents":500}]}
// {"paidCount":0,"totalCents":0,"items":[]}

// O(n) scans plus sorting cost S(p), under usual expected Set lookup costs.
// O(n) owned records/index storage plus the sort implementation's workspace.

const originalAmount = input[1].amountCents;
result.items[0].amountCents = 1;
assert.equal(input[1].amountCents, originalAmount);
input[0].amountCents = 7;
assert.equal(result.items[1].amountCents, 500);
for (const invalid of [null, undefined, {}, 'orders']) {
  assert.throws(() => summarizeOrders(invalid), TypeError);
}
for (const amountCents of [-1, 100000001, NaN, Infinity, '500', 0.5]) {
  assert.throws(() => summarizeOrders([{ id: 'a', status: 'paid', amountCents }]), RangeError);
}
assert.throws(() => summarizeOrders([{ id: 'a', status: 'unknown', amountCents: 1 }]), RangeError);
assert.throws(() => summarizeOrders([{ id: '', status: 'paid', amountCents: 1 }]), TypeError);
assert.throws(() => summarizeOrders([{ id: 'a', status: 'cancelled', amountCents: 'bad' }]), RangeError);
const maximum = Array.from({ length: 1000 }, (_, index) =>
  ({ id: String(index), status: 'paid', amountCents: 100000000 }));
assert.equal(summarizeOrders(maximum).totalCents, 100000000000);
assert.throws(() => summarizeOrders([...maximum, maximum[0]]), RangeError);
