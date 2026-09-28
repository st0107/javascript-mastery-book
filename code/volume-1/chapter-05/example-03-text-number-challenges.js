'use strict';

const assert = require('node:assert/strict');

function cleanLabel(value) {
  if (typeof value !== 'string') throw new TypeError('Expected text.');
  const clean = value.normalize('NFC').trim();
  if (clean === '') throw new RangeError('Label is empty.');
  return clean;
}

function takeGraphemes(text, limit) {
  if (typeof text !== 'string') throw new TypeError('Expected text.');
  if (!Number.isSafeInteger(limit) || limit < 0) throw new RangeError('Invalid limit.');
  const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
  const pieces = Array.from(segmenter.segment(text), entry => entry.segment);
  return pieces.slice(0, limit).join('');
}

function parsePrice(text) {
  if (typeof text !== 'string' || !/^(0|[1-9]\d{0,5})\.\d{2}$/.test(text)) {
    throw new TypeError('Expected bounded decimal price text.');
  }
  const [whole, fraction] = text.split('.');
  return Number(whole) * 100 + Number(fraction);
}

function addCounts(left, right) {
  if (!Number.isSafeInteger(left) || !Number.isSafeInteger(right) || left < 0 || right < 0) {
    throw new RangeError('Expected nonnegative safe integers.');
  }
  const total = left + right;
  if (!Number.isSafeInteger(total)) throw new RangeError('Count overflow.');
  return total;
}

function nextId(text) {
  if (typeof text !== 'string' || !/^(0|[1-9]\d{0,29})$/.test(text)) {
    throw new TypeError('Expected a canonical bounded integer ID.');
  }
  return String(BigInt(text) + 1n);
}

function elapsedSeconds(startMs, endMs) {
  const limit = 8640000000000000;
  if (!Number.isSafeInteger(startMs) || !Number.isSafeInteger(endMs) ||
      Math.abs(startMs) > limit || Math.abs(endMs) > limit || endMs < startMs) {
    throw new RangeError('Invalid interval endpoints.');
  }
  const duration = endMs - startMs;
  if (!Number.isSafeInteger(duration)) throw new RangeError('Interval too large.');
  return Math.floor(duration / 1000);
}

assert.equal(cleanLabel(' Cafe\u0301 '), 'Caf\u00e9');
assert.equal(cleanLabel('a  b'), 'a  b');
assert.throws(() => cleanLabel('  '), RangeError);
assert.throws(() => cleanLabel(5), TypeError);
assert.equal(takeGraphemes('e\u0301\u{1F680}Z', 2), 'e\u0301\u{1F680}');
assert.equal(takeGraphemes('abc', 0), '');
assert.equal(takeGraphemes('', 5), '');
assert.throws(() => takeGraphemes('a', -1), RangeError);
assert.equal(parsePrice('19.05'), 1905);
assert.equal(parsePrice('999999.99'), 99999999);
for (const value of ['01.00', ' 1.00', '+1.00', '1e2', '1.0', '1000000.00', true]) {
  assert.throws(() => parsePrice(value), TypeError);
}
assert.equal(addCounts(0, Number.MAX_SAFE_INTEGER), Number.MAX_SAFE_INTEGER);
assert.throws(() => addCounts(Number.MAX_SAFE_INTEGER, 1), RangeError);
assert.throws(() => addCounts('1', 1), RangeError);
assert.equal(nextId('9007199254740993'), '9007199254740994');
assert.equal(nextId('9'.repeat(30)), '1' + '0'.repeat(30));
for (const value of ['00', '-1', '9'.repeat(31), 1]) assert.throws(() => nextId(value), TypeError);
assert.equal(elapsedSeconds(1000, 3999), 2);
assert.equal(elapsedSeconds(1000, 1000), 0);
assert.throws(() => elapsedSeconds(3000, 1000), RangeError);
assert.throws(() => elapsedSeconds(-8640000000000000, 8640000000000000), RangeError);
assert.throws(() => elapsedSeconds('1000', 2000), RangeError);
console.log('Six text, number, and elapsed-time challenges passed.');
// Expected output:
// Six text, number, and elapsed-time challenges passed.

// Complexity: text transforms use O(n) work/storage; numeric operations use bounded inputs.
