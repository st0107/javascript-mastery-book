'use strict';
const assert = require('node:assert/strict');

function formatRun(id, status = 'queued') {
  if (typeof id !== 'string' || id.length === 0 ||
      !['queued', 'running', 'done'].includes(status)) throw new TypeError('Invalid run');
  return `${id}:${status}`;
}
function finish(record) { return { id: record.id, status: 'done' }; }
function sumScores(...scores) {
  if (scores.length > 100) throw new RangeError('Too many scores');
  let total = 0;
  for (const score of scores) {
    if (!Number.isInteger(score) || score < 0 || score > 100) throw new RangeError('Invalid score');
    total += score;
  }
  return total;
}
function applyTwo(a, b, callback) { return [callback(a, 0), callback(b, 1)]; }
function parseTwo(a, b) { return applyTwo(a, b, value => Number.parseInt(value, 10)); }
function stamp(id, now) {
  if (typeof id !== 'string' || typeof now !== 'function') throw new TypeError('Invalid dependency');
  const at = now();
  if (!Number.isSafeInteger(at) || at < 0) throw new TypeError('Invalid timestamp');
  return { id, at };
}
function sumTo(n) {
  if (!Number.isSafeInteger(n) || n < 0 || n > 10000) throw new RangeError('Invalid bound');
  let total = 0;
  for (let term = 1; term <= n; term += 1) total += term;
  return total;
}

assert.equal(formatRun('R1'), 'R1:queued');
assert.equal(formatRun('R1', 'done'), 'R1:done');
for (const value of [null, '', 7]) assert.throws(() => formatRun(value), TypeError);
assert.throws(() => formatRun('R1', null), TypeError);
const input = { id: 'A', status: 'running', extra: true };
const output = finish(input);
assert.deepEqual(output, { id: 'A', status: 'done' });
assert.notEqual(input, output);
assert.equal(input.status, 'running');
assert.equal(sumScores(), 0);
assert.equal(sumScores(...Array(100).fill(100)), 10000);
for (const score of [-1, 101, 0.5, '2', null, NaN]) assert.throws(() => sumScores(score), RangeError);
assert.throws(() => sumScores(...Array(101).fill(0)), RangeError);
assert.deepEqual(parseTwo('10', '10'), [10, 10]);
assert.equal(Number.isNaN(applyTwo('10', '10', Number.parseInt)[1]), true);
let calls = 0;
assert.deepEqual(stamp('A', () => { calls += 1; return 1000; }), { id: 'A', at: 1000 });
assert.equal(calls, 1);
assert.throws(() => stamp('A', null), TypeError);
for (const at of [-1, NaN, Infinity, '1000', 0.5]) assert.throws(() => stamp('A', () => at), TypeError);
const failure = new Error('clock');
assert.throws(() => stamp('A', () => { throw failure; }), error => error === failure);
assert.equal(sumTo(0), 0);
assert.equal(sumTo(4), 10);
assert.equal(sumTo(10000), 50005000);
for (const n of [-1, 10001, '4', 1.5, Infinity]) assert.throws(() => sumTo(n), RangeError);
console.log('six function challenge groups passed');
// Expected output:
// six function challenge groups passed
