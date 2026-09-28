'use strict';

const assert = require('node:assert/strict');
const text = 'e\u0301\u{1F680}';
const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
assert.equal(text.length, 4);
assert.equal(Array.from(text).length, 3);
assert.equal(Array.from(segmenter.segment(text)).length, 2);
assert.equal(text.normalize('NFC'), '\u00e9\u{1F680}');
assert.equal(0.1 + 0.2 === 0.3, false);
assert.equal(Number.isSafeInteger(2 ** 53), false);
assert.equal(String(BigInt('9007199254740993') + 1n), '9007199254740994');
const first = new Date('2026-01-01T00:00:00.000Z');
const alias = first;
const snapshot = new Date(first.getTime());
alias.setUTCDate(2);
assert.equal(first.toISOString(), '2026-01-02T00:00:00.000Z');
assert.equal(snapshot.toISOString(), '2026-01-01T00:00:00.000Z');
console.log('Text units, numeric precision, and Date ownership passed.');
// Expected output:
// Text units, numeric precision, and Date ownership passed.
