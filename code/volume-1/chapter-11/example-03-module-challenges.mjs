import assert from 'node:assert/strict';
import { quoteLine as calculate } from './pricing.mjs';

export function doubleScore(score) {
  if (!Number.isInteger(score) || score < 0 || score > 50) {
    throw new RangeError('score must be an integer from 0 through 50');
  }
  return score * 2;
}
assert.equal(doubleScore(0), 0);
assert.equal(doubleScore(21), 42);
assert.equal(doubleScore(50), 100);
for (const bad of ['2', null, -1, 51, NaN, Infinity, 1.5]) {
  assert.throws(() => doubleScore(bad), RangeError);
}
assert.equal(calculate(175, 2).totalCents, 350);
assert.throws(() => calculate(175, '2'), RangeError);

export function createSequence() {
  let last = 0;
  return function next() {
    if (last === Number.MAX_SAFE_INTEGER) throw new RangeError('sequence exhausted');
    last += 1;
    return last;
  };
}
const first = createSequence();
const second = createSequence();
assert.deepEqual([first(), first(), second()], [1, 2, 1]);
// Exhaustion is reviewed by the explicit bound, not reached by billions of calls.

export function createAnnouncer(write) {
  if (typeof write !== 'function') throw new TypeError('writer required');
  return function announce(name) {
    if (typeof name !== 'string' || name.length === 0 || name.length > 40) {
      throw new TypeError('name must have 1 through 40 characters');
    }
    const line = `ready:${name}`;
    write(line);
    return line;
  };
}
const lines = [];
const announce = createAnnouncer(line => lines.push(line));
assert.equal(lines.length, 0);
assert.equal(announce('worker'), 'ready:worker');
assert.deepEqual(lines, ['ready:worker']);
for (const bad of ['', 'x'.repeat(41), null, 4]) {
  assert.throws(() => announce(bad), TypeError);
}
assert.equal(lines.length, 1);
assert.throws(() => createAnnouncer(null), TypeError);
const failure = new Error('writer failed');
assert.throws(() => createAnnouncer(() => { throw failure; })('worker'), error => error === failure);

const record = { exports: {} };
const alias = record.exports;
alias.ready = true;
record.exports = () => 'started';
assert.equal(alias.ready, true);
assert.equal(record.exports(), 'started');
assert.notStrictEqual(alias, record.exports);

export async function loadBasename() {
  const path = await import('node:path');
  return path.posix.basename('/logs/run.txt');
}
assert.equal(await loadBasename(), 'run.txt');
await assert.rejects(import('./intentionally-missing-module.mjs'), { code: 'ERR_MODULE_NOT_FOUND' });
console.log('six module challenge groups passed');
// Expected output:
// six module challenge groups passed
