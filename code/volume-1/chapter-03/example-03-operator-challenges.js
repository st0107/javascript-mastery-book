'use strict';

{
const assert = require('node:assert/strict');
function displayLabel(value) {
  const label = value ?? 'Untitled';
  if (typeof label !== 'string') throw new TypeError('label must be a string');
  return label;
}
assert.equal(displayLabel(''), '');
assert.equal(displayLabel(null), 'Untitled');
assert.equal(displayLabel(undefined), 'Untitled');
assert.throws(() => displayLabel(0), TypeError);
console.log(JSON.stringify([displayLabel(''), displayLabel('Report'), displayLabel(null)]));

// Expected output:
// ["","Report","Untitled"]

// O(1) time and additional storage; existing strings are returned unchanged.
}

{
const assert = require('node:assert/strict');
function getOrCompute(record, key, compute) {
  return record[key] ??= compute();
}
let reads = 0;
let computes = 0;
let writes = 0;
let stored;
const record = {
  get value() { reads += 1; return stored; },
  set value(next) { writes += 1; stored = next; }
};
const compute = () => { computes += 1; return 0; };
assert.equal(getOrCompute(record, 'value', compute), 0);
assert.equal(getOrCompute(record, 'value', compute), 0);
assert.deepEqual([reads, computes, writes], [2, 1, 1]);
const fresh = {};
assert.throws(() => getOrCompute(fresh, 'value', () => { throw new Error('failed'); }), /failed/);
assert.equal(Object.hasOwn(fresh, 'value'), false);
console.log(reads, computes, writes);

// Expected output:
// 2 1 1

// O(1) operator bookkeeping, excluding accessor and compute work.
}

{
const assert = require('node:assert/strict');
function hasAllFlags(available, required) {
  for (const mask of [available, required]) {
    if (!Number.isInteger(mask) || mask < 0 || mask > 7) throw new RangeError('invalid mask');
  }
  return (available & required) === required;
}
assert.equal(hasAllFlags(3, 3), true);
assert.equal(hasAllFlags(1, 3), false);
assert.equal(hasAllFlags(0, 0), true);
assert.throws(() => hasAllFlags(2 ** 32 + 1, 1), RangeError);
console.log(hasAllFlags(7, 5), hasAllFlags(2, 5));

// Expected output:
// true false

// O(1) time and space for the fixed three-bit schema.
}

{
const assert = require('node:assert/strict');
function allocateTicket(counter) {
  if (!Number.isSafeInteger(counter.next) || counter.next < 0 ||
      counter.next === Number.MAX_SAFE_INTEGER) throw new RangeError('counter exhausted or invalid');
  return counter.next++;
}
const counter = { next: 4 };
assert.equal(allocateTicket(counter), 4);
assert.equal(counter.next, 5);
const full = { next: Number.MAX_SAFE_INTEGER };
assert.throws(() => allocateTicket(full), RangeError);
assert.equal(full.next, Number.MAX_SAFE_INTEGER);
console.log(allocateTicket(counter), counter.next);

// Expected output:
// 5 6

// O(1) time and space; one documented mutation of a trusted data record.
}

{
const assert = require('node:assert/strict');
function discountedTotal(unitCents, quantity, discountPercent) {
  for (const [value, max] of [[unitCents, 1000000], [quantity, 1000], [discountPercent, 100]]) {
    if (!Number.isInteger(value) || value < 0 || value > max) throw new RangeError('invalid input');
  }
  const subtotal = unitCents * quantity;
  return Math.round(subtotal * (100 - discountPercent) / 100);
}
assert.equal(discountedTotal(199, 2, 10), 358);
assert.equal(discountedTotal(199, 2, 100), 0);
assert.equal(discountedTotal(199, 0, 10), 0);
assert.throws(() => discountedTotal('199', 2, 10), RangeError);
console.log(discountedTotal(199, 2, 10));

// Expected output:
// 358

// O(1) time and space within the stated bounded arithmetic domain.
}

{
const assert = require('node:assert/strict');
function transformOrOriginal(plugin, payload) {
  return plugin?.transform?.(payload) ?? payload;
}
const plugin = { prefix: 'ok:', transform(value) { return this.prefix + value; } };
assert.equal(transformOrOriginal(plugin, 'item'), 'ok:item');
assert.equal(transformOrOriginal(null, 'item'), 'item');
assert.equal(transformOrOriginal({}, 'item'), 'item');
assert.equal(transformOrOriginal({ transform: () => 0 }, 'item'), 0);
assert.equal(transformOrOriginal({ transform: () => false }, 'item'), false);
assert.throws(() => transformOrOriginal({ transform: 3 }, 'item'), TypeError);
console.log(transformOrOriginal(plugin, 'item'));

// Expected output:
// ok:item

// O(1) dispatch overhead, excluding the transformer's work and returned data.
}
