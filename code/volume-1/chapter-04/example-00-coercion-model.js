'use strict';
const assert = require('node:assert/strict');
assert.equal(Number(''), 0);
assert.equal(Number(null), 0);
assert.equal(Number.isNaN(Number(undefined)), true);
assert.equal(Boolean('false'), true);
assert.equal(Boolean([]), true);
assert.equal([] == false, true);
assert.equal([] === false, false);
const hints = [];
const record = {
  [Symbol.toPrimitive](hint) {
    hints.push(hint);
    return hint === 'string' ? 'USD 12' : 12;
  }
};
assert.equal(String(record), 'USD 12');
assert.equal(Number(record), 12);
assert.equal(record + 2, 14);
assert.deepEqual(hints, ['string', 'number', 'default']);
console.log(hints.join(','));
console.log('coercion model passed');

// Expected output:
// string,number,default
// coercion model passed
