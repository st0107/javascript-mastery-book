'use strict';

function formatMoneyFromCents(cents, locale, currency) {
  if (!Number.isInteger(cents)) {
    throw new TypeError('Money must be stored as integer cents.');
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency
  }).format(cents / 100);
}

console.log(formatMoneyFromCents(1299, 'en-US', 'USD'));
