'use strict';

function validateCheckoutAmount(amountInCents) {
  if (!Number.isInteger(amountInCents)) {
    throw new TypeError('Checkout amount must be an integer number of cents.');
  }

  if (amountInCents <= 0) {
    throw new RangeError('Checkout amount must be positive.');
  }

  return { amountInCents, valid: true };
}

console.log(validateCheckoutAmount(2599));
