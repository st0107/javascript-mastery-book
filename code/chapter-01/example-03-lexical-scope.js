'use strict';

function createCurrencyFormatter(locale, currency) {
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency
  });

  return function formatAmount(amount) {
    return formatter.format(amount);
  };
}

const formatUsd = createCurrencyFormatter('en-US', 'USD');

console.log(formatUsd(1299.5));

// Expected output:
// $1,299.50
// The returned function resolves formatter from its outer lexical environment.

