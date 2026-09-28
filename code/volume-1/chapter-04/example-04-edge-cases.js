'use strict';
const assert = require('node:assert/strict');
assert.equal(Number(''), 0);
assert.equal(Number(' '), 0);
assert.equal(Number(null), 0);
assert.equal(Number.isNaN(Number('false')), true);
assert.equal(Boolean('false'), true);
assert.equal(Number.isNaN('false'), false);
assert.equal(isNaN('false'), true);
assert.equal(Number.isInteger(9007199254740992), true);
assert.equal(Number.isSafeInteger(9007199254740992), false);
assert.equal(Number('9007199254740992'), Number('9007199254740993'));
assert.notEqual(BigInt('9007199254740992'), BigInt('9007199254740993'));
assert.equal(null >= 0, true);
assert.equal(null == 0, false);
assert.equal(undefined < 0, false);
assert.equal(undefined >= 0, false);
assert.equal(Object.is(NaN, NaN), true);
assert.equal(Object.is(0, -0), false);
assert.throws(() => BigInt('1.5'), SyntaxError);
assert.throws(() => BigInt(1.5), RangeError);
assert.throws(() => +1n, TypeError);
assert.throws(() => Number(Symbol('id')), TypeError);
assert.throws(() => Number({ [Symbol.toPrimitive]() { return {}; } }), TypeError);
let calls = 0;
const object = { valueOf() { calls += 1; return 0; } };
assert.equal(Boolean(object), true);
assert.equal(calls, 0);
assert.equal(Number(object), 0);
assert.equal(calls, 1);
console.log('coercion edge cases passed');

// Expected output:
// coercion edge cases passed
