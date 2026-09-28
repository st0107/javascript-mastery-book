'use strict';
const assert = require('node:assert/strict');

function resolveRetryPolicy(config = {}) {
  if (config === null || typeof config !== 'object' || Array.isArray(config)) {
    throw new TypeError('config must be a data record');
  }
  const retries = config.retries ?? 3;
  const timeoutMs = config.timeoutMs ?? 1500;
  const enabled = config.enabled ?? true;
  if (!Number.isSafeInteger(retries) || retries < 0 || retries > 10) {
    throw new RangeError('retries must be an integer from 0 through 10');
  }
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 60000) {
    throw new RangeError('timeoutMs must be an integer from 1 through 60000');
  }
  if (typeof enabled !== 'boolean') throw new TypeError('enabled must be boolean');
  return Object.freeze({ retries, timeoutMs, enabled });
}

const supplied = { retries: 0, enabled: false };
const result = resolveRetryPolicy(supplied);
assert.deepEqual(result, { retries: 0, timeoutMs: 1500, enabled: false });
assert.equal(Object.isFrozen(result), true);
assert.notEqual(result, supplied);
assert.deepEqual(supplied, { retries: 0, enabled: false });
assert.throws(() => resolveRetryPolicy({ retries: -1 }), RangeError);
assert.throws(() => resolveRetryPolicy({ enabled: 'false' }), TypeError);
console.log(JSON.stringify(result));
console.log(JSON.stringify(resolveRetryPolicy({ retries: null })));

// Expected output:
// {"retries":0,"timeoutMs":1500,"enabled":false}
// {"retries":3,"timeoutMs":1500,"enabled":true}

// O(1) time and new storage for the fixed three-field schema.

for (const retries of [0, 10]) assert.equal(resolveRetryPolicy({ retries }).retries, retries);
for (const retries of [-1, 11, 0.5, NaN, Infinity, '0', true]) {
  assert.throws(() => resolveRetryPolicy({ retries }), RangeError);
}
for (const timeoutMs of [0, 60001, '1500', NaN]) {
  assert.throws(() => resolveRetryPolicy({ timeoutMs }), RangeError);
}
for (const root of [null, [], true, 'config']) {
  assert.throws(() => resolveRetryPolicy(root), TypeError);
}
assert.equal(resolveRetryPolicy({ timeoutMs: 60000 }).timeoutMs, 60000);
assert.throws(() => { result.retries = 9; }, TypeError);
