'use strict';

{
'use strict';
const assert = require('node:assert/strict');

function reportLabel(copies, centsPerCopy) {
  return `${copies} reports: ${copies * centsPerCopy} cents`;
}
const label = reportLabel(3, 250);
assert.equal(label, '3 reports: 750 cents');
console.log(label);

// Expected output:
// 3 reports: 750 cents
}

{
'use strict';
const assert = require('node:assert/strict');

function canAttemptWrite(adapter) {
  return adapter !== null && adapter !== undefined &&
    typeof adapter.writeText === 'function';
}
assert.equal(canAttemptWrite({ writeText() {} }), true);
for (const adapter of [null, undefined, {}, { writeText: true }]) {
  assert.equal(canAttemptWrite(adapter), false);
}
console.log(canAttemptWrite({ writeText() {} }), canAttemptWrite({}));

// Expected output:
// true false
}

{
'use strict';
const assert = require('node:assert/strict');

function checkoutCents(value) {
  if (!Number.isSafeInteger(value)) throw new TypeError('safe integer cents required');
  if (value < 1 || value > 100_000_000) throw new RangeError('checkout range exceeded');
  return value;
}
assert.equal(checkoutCents(1), 1);
assert.equal(checkoutCents(100_000_000), 100_000_000);
for (const value of ['25', null, NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
  assert.throws(() => checkoutCents(value), TypeError);
}
for (const value of [0, -1, 100_000_001]) {
  assert.throws(() => checkoutCents(value), RangeError);
}
console.log(checkoutCents(2599));

// Expected output:
// 2599
}

{
'use strict';
const assert = require('node:assert/strict');

function formatStatus(text, formatter) {
  if (typeof text !== 'string') throw new TypeError('text required');
  if (formatter === undefined) return `Status: ${text}`;
  if (typeof formatter !== 'function') throw new TypeError('formatter must be callable');
  return formatter(text);
}
const failure = new Error('format failed');
assert.throws(() => formatStatus('ready', null), TypeError);
assert.throws(() => formatStatus('ready', () => { throw failure; }), error => error === failure);
console.log(formatStatus('ready'));
console.log(formatStatus('ready', text => text.toUpperCase()));

// Expected output:
// Status: ready
// READY
}

{
'use strict';
const assert = require('node:assert/strict');

function exportTitle(title, writeText) {
  if (typeof title !== 'string' || title.trim() === '') throw new TypeError('title required');
  if (typeof writeText !== 'function') throw new TypeError('writer required');
  const normalized = title.trim();
  writeText(normalized);
  return normalized.length;
}
const writes = [];
const writer = text => writes.push(text);
assert.throws(() => exportTitle('   ', writer), TypeError);
assert.equal(writes.length, 0);
assert.equal(exportTitle('  Report  ', writer), 6);
assert.deepEqual(writes, ['Report']);
assert.throws(() => exportTitle('Report', () => { throw new Error('offline'); }), /offline/);
console.log(writes.join('|'));

// Expected output:
// Report
}

{
'use strict';
const assert = require('node:assert/strict');

function summarizeAmounts(values) {
  if (!Array.isArray(values)) throw new TypeError('array required');
  let accepted = 0;
  let rejected = 0;
  for (const value of values) {
    if (Number.isSafeInteger(value) && value >= 1 && value <= 100_000_000) accepted += 1;
    else rejected += 1;
  }
  return { accepted, rejected };
}
const input = Object.freeze([1, '1', 0, 100_000_000, Infinity]);
assert.deepEqual(summarizeAmounts(input), { accepted: 2, rejected: 3 });
assert.deepEqual(summarizeAmounts([]), { accepted: 0, rejected: 0 });
assert.throws(() => summarizeAmounts(null), TypeError);
console.log(JSON.stringify(summarizeAmounts(input)));

// Expected output:
// {"accepted":2,"rejected":3}
}
