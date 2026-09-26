'use strict';

const assert = require('node:assert/strict');
const records = new WeakSet();

function requireRecord(receiver) {
  if (!records.has(receiver)) throw new TypeError('receiver must be a factory-created record');
}

const stockRecordPrototype = Object.freeze(Object.defineProperties({}, {
  reserve: {
    value: function reserve(units) {
      requireRecord(this);
      if (!Number.isSafeInteger(units) || units <= 0) {
        throw new TypeError('units must be a positive safe integer');
      }
      if (units > this.available) throw new RangeError('insufficient stock');
      this.reservations.push(units);
      this.available -= units;
      return this.available;
    }
  },
  reservationLog: {
    value: function reservationLog() {
      requireRecord(this);
      return this.reservations.slice();
    }
  },
  summary: {
    get() {
      requireRecord(this);
      return `${this.sku}: ${this.available} available`;
    }
  }
}));

function createStockRecord(sku, available) {
  if (typeof sku !== 'string' || sku.length === 0 || sku.length > 32 || /[^A-Z0-9-]/.test(sku)) {
    throw new TypeError('sku must contain 1-32 uppercase identifier characters');
  }
  if (!Number.isSafeInteger(available) || available < 0) {
    throw new TypeError('available must be a nonnegative safe integer');
  }
  const record = Object.create(stockRecordPrototype, {
    sku: { value: sku, enumerable: true },
    available: { value: available, writable: true, enumerable: true },
    reservations: { value: [] }
  });
  records.add(record);
  return Object.seal(record);
}

function runDemo() {
  const north = createStockRecord('SKU-17', 10);
  const south = createStockRecord('SKU-42', 4);
  assert.equal(Object.getPrototypeOf(north), stockRecordPrototype);
  assert.equal(Object.getPrototypeOf(south), stockRecordPrototype);
  assert.equal(north.reserve, south.reserve);
  assert.equal(Object.hasOwn(north, 'reserve'), false);
  assert.equal(Object.hasOwn(north, 'reservations'), true);
  assert.notEqual(north.reservations, south.reservations);
  assert.deepEqual(Object.keys(north), ['sku', 'available']);
  assert.equal(north.reserve(3), 7);
  assert.equal(north.reserve(2), 5);
  assert.equal(south.reserve(1), 3);
  assert.deepEqual(north.reservationLog(), [3, 2]);
  assert.deepEqual(south.reservationLog(), [1]);

  const logCopy = north.reservationLog();
  logCopy.push(99);
  assert.deepEqual(north.reservationLog(), [3, 2]);
  for (const invalid of [0, -1, 1.5, NaN, Infinity, '2']) {
    assert.throws(() => north.reserve(invalid), TypeError);
  }
  assert.throws(() => north.reserve(6), RangeError);
  assert.equal(north.available, 5);
  assert.deepEqual(north.reservationLog(), [3, 2]);

  const detached = north.reserve;
  assert.throws(() => detached(1), TypeError);
  assert.equal(detached.call(south, 1), 2);
  assert.throws(() => detached.call({ available: 5, reservations: [] }, 1), TypeError);
  // An uninitialized descendant must not mutate its ancestor's reservation array.
  const descendant = Object.create(north);
  assert.throws(() => descendant.reserve(1), TypeError);
  assert.throws(() => descendant.summary, TypeError);
  assert.deepEqual(north.reservationLog(), [3, 2]);
  assert.throws(() => { north.sku = 'REPLACED'; }, TypeError);
  assert.throws(() => { north.reservations = []; }, TypeError);
  assert.throws(() => { stockRecordPrototype.reserve = () => {}; }, TypeError);

  for (const invalid of ['', 'lowercase', 'A'.repeat(33), 'SKU\n']) {
    assert.throws(() => createStockRecord(invalid, 1), TypeError);
  }
  for (const invalid of [-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => createStockRecord('SKU-1', invalid), TypeError);
  }
  const empty = createStockRecord('SKU-0', 0);
  assert.throws(() => empty.reserve(1), RangeError);
  assert.deepEqual(empty.reservationLog(), []);

  console.log(north.summary);
  console.log(south.summary);
  console.log(`shared reserve method ${north.reserve === south.reserve}`);
  console.log('shared record assertions passed');
}

if (require.main === module) runDemo();
module.exports = { createStockRecord };

// Expected output:
// SKU-17: 5 available
// SKU-42: 2 available
// shared reserve method true
// shared record assertions passed

// reserve: amortized O(1) array append and O(1) arithmetic, retaining one number.
// reservationLog: O(r) time and new storage for r reservations. Each record owns
// O(r) mutable log storage; all records share the prototype method functions.
