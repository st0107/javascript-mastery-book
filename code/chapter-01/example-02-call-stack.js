'use strict';
const assert = require('node:assert/strict');
const trace = [];
function normalizeLabel(label) {
  trace.push('enter normalizeLabel');
  const result = label.trim();
  trace.push('return normalizeLabel');
  return result;
}
function buildRecord(raw) {
  trace.push('enter buildRecord');
  const result = { id: raw.id, label: normalizeLabel(raw.label) };
  trace.push('return buildRecord');
  return result;
}
function importRecord(raw) {
  trace.push('enter importRecord');
  const result = buildRecord(raw);
  trace.push('return importRecord');
  return result;
}
// Trusted ordinary data: this traces synchronous calls, not boundary parsing.
const input = { id: 'A-1', label: '  JavaScript  ' };
const result = importRecord(input);
assert.deepEqual(result, { id: 'A-1', label: 'JavaScript' });
assert.notStrictEqual(result, input);
assert.equal(input.label, '  JavaScript  ');
assert.deepEqual(trace, [
  'enter importRecord', 'enter buildRecord', 'enter normalizeLabel',
  'return normalizeLabel', 'return buildRecord', 'return importRecord'
]);
console.log(trace.join(' -> '));
// Expected output:
// enter importRecord -> enter buildRecord -> enter normalizeLabel -> return normalizeLabel -> return buildRecord -> return importRecord

// Time and output space O(n) for label length n; call depth is bounded at three.
