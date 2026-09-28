'use strict';

const assert = require('node:assert/strict');

function reduceOrderState(state, event) {
  if (state === null || typeof state !== 'object' || Array.isArray(state) ||
      !Object.hasOwn(state, 'paid') || typeof state.paid !== 'boolean' ||
      !Object.hasOwn(state, 'shipped') || typeof state.shipped !== 'boolean') {
    throw new TypeError('Expected paid and shipped booleans.');
  }
  if (state.shipped && !state.paid) throw new RangeError('Shipped requires paid.');
  if (event === null || typeof event !== 'object' || Array.isArray(event) ||
      !Object.hasOwn(event, 'type') || typeof event.type !== 'string') {
    throw new TypeError('Expected an event type.');
  }
  switch (event.type) {
    case 'PAID':
      return { paid: true, shipped: state.shipped };
    case 'SHIPPED':
      if (!state.paid) throw new RangeError('Pay before shipping.');
      return { paid: true, shipped: true };
    default:
      throw new RangeError('Unsupported event type.');
  }
}

const initial = Object.freeze({ paid: false, shipped: false });
const event = Object.freeze({ type: 'PAID' });
const paid = reduceOrderState(initial, event);
const shipped = reduceOrderState(paid, { type: 'SHIPPED' });
assert.deepEqual(initial, { paid: false, shipped: false });
assert.deepEqual(event, { type: 'PAID' });
assert.deepEqual(paid, { paid: true, shipped: false });
assert.deepEqual(shipped, { paid: true, shipped: true });
assert.notEqual(paid, initial);
assert.deepEqual(reduceOrderState(shipped, { type: 'PAID' }), shipped);
assert.deepEqual(reduceOrderState(shipped, { type: 'SHIPPED' }), shipped);
assert.throws(() => reduceOrderState(initial, { type: 'SHIPPED' }), RangeError);
assert.throws(() => reduceOrderState({ paid: false, shipped: true }, event), RangeError);
assert.throws(() => reduceOrderState(initial, { type: 'REFUND' }), RangeError);
for (const bad of [null, [], {}, { paid: 'false', shipped: false }, Object.create(initial)]) {
  assert.throws(() => reduceOrderState(bad, event), TypeError);
}
for (const bad of [null, [], {}, { type: 1 }, Object.create(event)]) {
  assert.throws(() => reduceOrderState(initial, bad), TypeError);
}
console.log(JSON.stringify(shipped));
console.log('Order transitions and input ownership passed.');
// Expected output:
// {"paid":true,"shipped":true}
// Order transitions and input ownership passed.

// Time/space: O(1), fixed state projection and event set.
