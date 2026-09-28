'use strict';
const assert = require('node:assert/strict');
function buildLabels(ids, format) {
  if (!Array.isArray(ids) || ids.length > 1000) throw new TypeError('Invalid ID list');
  if (typeof format !== 'function') throw new TypeError('Formatter must be callable');
  const input = [];
  for (let index = 0; index < ids.length; index += 1) {
    const id = ids[index];
    if (!Object.hasOwn(ids, index) || typeof id !== 'string' || id.length === 0) {
      throw new TypeError('Each ID must be a nonempty string');
    }
    input.push(id);
  }
  const labels = [];
  for (let index = 0; index < input.length; index += 1) {
    const label = format(input[index], index);
    if (typeof label !== 'string') throw new TypeError('Formatter must return a string');
    labels.push(label);
  }
  return labels;
}
const source = ['A', 'B'];
const labels = buildLabels(source, (id, index) => `${index + 1}. ${id}`);
assert.deepEqual(source, ['A', 'B']);
assert.deepEqual(labels, ['1. A', '2. B']);
let calls = 0;
assert.throws(() => buildLabels(['A', null], () => { calls += 1; return ''; }), TypeError);
assert.equal(calls, 0);
assert.throws(() => buildLabels(new Array(1), id => id), TypeError);
assert.throws(() => buildLabels(['A'], () => 7), TypeError);
const failure = new Error('formatter failed');
assert.throws(() => buildLabels(['A'], () => { throw failure; }), error => error === failure);
console.log(labels.join(' | '));
console.log('callback contract assertions passed');
// Expected output:
// 1. A | 2. B
// callback contract assertions passed

// O(n) wrapper work and copied references/results, plus callback work/output text.
