'use strict';
const assert = require('node:assert/strict');

function validateCheckoutAmount(amountInCents) {
  if (!Number.isSafeInteger(amountInCents)) {
    throw new TypeError('amount must be a safe integer Number of cents');
  }
  if (amountInCents < 1 || amountInCents > 100_000_000) {
    throw new RangeError('amount is outside the checkout range');
  }
  return { amountInCents, valid: true };
}
for (const amount of [1, 2599, 100_000_000]) {
  assert.deepEqual(validateCheckoutAmount(amount), { amountInCents: amount, valid: true });
}
for (const amount of [0, -1, 100_000_001, Number.MAX_SAFE_INTEGER]) {
  assert.throws(() => validateCheckoutAmount(amount), RangeError);
}
for (const amount of ['2599', true, null, undefined, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
  assert.throws(() => validateCheckoutAmount(amount), TypeError);
}
console.log('Checkout type and range checks passed.');

// Expected output:
// Checkout type and range checks passed.

// Fixed-size numeric checks use O(1) time and auxiliary space.
