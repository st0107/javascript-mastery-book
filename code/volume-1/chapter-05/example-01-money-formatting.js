'use strict';

const assert = require('node:assert/strict');

function formatMoneyFromCents(cents, locale = 'en-US', currency = 'USD') {
  const allowed = ['USD', 'EUR', 'GBP', 'INR'];
  if (!Number.isSafeInteger(cents) || Math.abs(cents) > 1000000000) {
    throw new RangeError('Expected integer cents within plus or minus 1,000,000,000.');
  }
  if (typeof locale !== 'string' || !allowed.includes(currency)) {
    throw new TypeError('Expected a locale string and a supported two-decimal currency.');
  }
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format((Object.is(cents, -0) ? 0 : cents) / 100);
}

assert.equal(formatMoneyFromCents(1299), '$12.99');
assert.equal(formatMoneyFromCents(-105), '-$1.05');
assert.equal(formatMoneyFromCents(-0), '$0.00');
assert.equal(formatMoneyFromCents(1000000000), '$10,000,000.00');
assert.equal(formatMoneyFromCents(-1000000000), '-$10,000,000.00');
for (const invalid of [1.1, '1299', NaN, Infinity, 2 ** 53, 1000000001, -1000000001]) {
  assert.throws(() => formatMoneyFromCents(invalid), RangeError);
}
for (const currency of ['JPY', 'KWD', 'usd', null]) {
  assert.throws(() => formatMoneyFromCents(100, 'en-US', currency), TypeError);
}
assert.throws(() => formatMoneyFromCents(100, null, 'USD'), TypeError);
console.log(formatMoneyFromCents(1299));
console.log('Money boundaries passed.');
// Expected output:
// $12.99
// Money boundaries passed.

// Time/space: bounded input and output; formatter construction depends on runtime locale data.
