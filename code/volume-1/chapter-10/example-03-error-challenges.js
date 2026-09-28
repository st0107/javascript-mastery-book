'use strict';

const assert = require('node:assert/strict');

function requirePositiveCount(value) {
  if (typeof value !== 'number') throw new TypeError('Expected a Number.');
  if (!Number.isSafeInteger(value) || value <= 0) throw new RangeError('Invalid count.');
  return value;
}

function tryJson(text) {
  if (typeof text !== 'string') throw new TypeError('Expected text.');
  if (text.length > 1024) throw new RangeError('Text too long.');
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    return { ok: false, code: 'INVALID_JSON' };
  }
}

function countOrZero(operation) {
  if (typeof operation !== 'function') throw new TypeError('Expected callback.');
  try {
    return operation();
  } catch (error) {
    if (error instanceof RangeError) return 0;
    throw error;
  }
}

function loadWithContext(loader) {
  if (typeof loader !== 'function') throw new TypeError('Expected loader.');
  try {
    return loader();
  } catch (cause) {
    throw new Error('Import unavailable.', { cause });
  }
}

function validateRows(rows, validate) {
  if (!Array.isArray(rows) || typeof validate !== 'function') throw new TypeError('Invalid arguments.');
  const accepted = [];
  const rejected = [];
  for (let index = 0; index < rows.length; index++) {
    try {
      accepted.push(validate(rows[index]));
    } catch (error) {
      if (!(error instanceof TypeError) && !(error instanceof RangeError)) throw error;
      rejected.push(index);
    }
  }
  return { accepted, rejected };
}

function withBusyFlag(state, operation) {
  if (state === null || typeof state !== 'object' || !Object.hasOwn(state, 'busy') ||
      typeof state.busy !== 'boolean' || typeof operation !== 'function') {
    throw new TypeError('Invalid state or callback.');
  }
  if (state.busy) throw new RangeError('Already busy.');
  state.busy = true;
  try {
    return operation();
  } finally {
    state.busy = false;
  }
}

assert.equal(requirePositiveCount(Number.MAX_SAFE_INTEGER), Number.MAX_SAFE_INTEGER);
assert.throws(() => requirePositiveCount('1'), TypeError);
for (const value of [0, -1, NaN, Infinity, 0.5, 2 ** 53]) assert.throws(() => requirePositiveCount(value), RangeError);
assert.deepEqual(tryJson('null'), { ok: true, value: null });
assert.deepEqual(tryJson('{'), { ok: false, code: 'INVALID_JSON' });
assert.throws(() => tryJson(1), TypeError);
assert.throws(() => tryJson(' '.repeat(1025)), RangeError);
assert.equal(countOrZero(() => 7), 7);
assert.equal(countOrZero(() => { throw new RangeError('Expected.'); }), 0);
const unexpected = new TypeError('Unexpected.');
assert.throws(() => countOrZero(() => { throw unexpected; }), error => error === unexpected);
assert.throws(() => loadWithContext(() => { throw unexpected; }), error =>
  error.message === 'Import unavailable.' && error.cause === unexpected);
assert.throws(() => loadWithContext(() => { throw undefined; }), error =>
  Object.hasOwn(error, 'cause') && error.cause === undefined);
assert.deepEqual(validateRows([1, '2', 3], value => {
  if (typeof value !== 'number') throw new TypeError('Expected number.');
  return value * 2;
}), { accepted: [2, 6], rejected: [1] });
const fatal = new Error('Fatal dependency failure.');
assert.throws(() => validateRows([1], () => { throw fatal; }), error => error === fatal);
const state = { busy: false };
assert.equal(withBusyFlag(state, () => { assert.equal(state.busy, true); return 42; }), 42);
assert.equal(state.busy, false);
assert.throws(() => withBusyFlag(state, () => { throw fatal; }), error => error === fatal);
assert.equal(state.busy, false);
assert.throws(() => withBusyFlag({ busy: true }, () => 1), RangeError);
console.log('Six error-handling challenge assertion groups passed.');
// Expected output:
// Six error-handling challenge assertion groups passed.

// Wrapper costs exclude callbacks; parsing and row validation scale with accepted input.

