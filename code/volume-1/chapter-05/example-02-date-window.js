'use strict';

const assert = require('node:assert/strict');

function isWithinWindow(nowMs, startIso, durationMs) {
  const dateLimit = 8640000000000000;
  const maxDuration = 7 * 24 * 60 * 60 * 1000;
  const canonicalUtc = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
  if (typeof startIso !== 'string' || !canonicalUtc.test(startIso)) {
    throw new TypeError('Expected YYYY-MM-DDTHH:mm:ss.sssZ.');
  }
  const startMs = Date.parse(startIso);
  if (!Number.isFinite(startMs) || new Date(startMs).toISOString() !== startIso) {
    throw new RangeError('Invalid UTC calendar timestamp.');
  }
  if (!Number.isSafeInteger(nowMs) || Math.abs(nowMs) > dateLimit) {
    throw new RangeError('Expected an integer timestamp within the Date range.');
  }
  if (!Number.isSafeInteger(durationMs) || durationMs < 0 || durationMs > maxDuration) {
    throw new RangeError('Expected an integer duration from zero to seven days.');
  }
  const endMs = startMs + durationMs;
  if (!Number.isSafeInteger(endMs) || Math.abs(endMs) > dateLimit) {
    throw new RangeError('Window end is out of range.');
  }
  return nowMs >= startMs && nowMs < endMs;
}

const start = '2026-07-06T10:00:00.000Z';
const startMs = Date.parse(start);
const hour = 3600000;
assert.equal(isWithinWindow(startMs - 1, start, hour), false);
assert.equal(isWithinWindow(startMs, start, hour), true);
assert.equal(isWithinWindow(startMs + hour - 1, start, hour), true);
assert.equal(isWithinWindow(startMs + hour, start, hour), false);
assert.equal(isWithinWindow(startMs, start, 0), false);
assert.equal(isWithinWindow(startMs, start, 604800000), true);
assert.equal(isWithinWindow(Date.parse('2024-02-29T00:00:00.000Z'), '2024-02-29T00:00:00.000Z', 1), true);
for (const invalid of ['July 6, 2026', '2026-07-06', '2026-07-06T10:00:00Z',
  '2026-07-06T10:00:00.000+00:00', null]) {
  assert.throws(() => isWithinWindow(startMs, invalid, hour), TypeError);
}
for (const invalid of ['2026-02-29T00:00:00.000Z', '2026-02-30T00:00:00.000Z',
  '2026-07-06T24:00:00.000Z', '2026-13-01T00:00:00.000Z']) {
  assert.throws(() => isWithinWindow(startMs, invalid, hour), RangeError);
}
for (const invalid of ['3600000', -1, 0.5, NaN, Infinity, 604800001, Number.MAX_SAFE_INTEGER]) {
  assert.throws(() => isWithinWindow(startMs, start, invalid), RangeError);
}
for (const invalid of [String(startMs), NaN, Infinity, 0.1, 8640000000000001, -8640000000000001]) {
  assert.throws(() => isWithinWindow(invalid, start, hour), RangeError);
}
assert.equal(isWithinWindow(8640000000000000, start, hour), false);
console.log(isWithinWindow(startMs + 1800000, start, hour));
console.log('UTC syntax, calendar, numeric, and boundary assertions passed.');
// Expected output:
// true
// UTC syntax, calendar, numeric, and boundary assertions passed.

// Time/space: O(1) for the fixed timestamp grammar and bounded arithmetic.
