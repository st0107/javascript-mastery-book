'use strict';
const assert = require('node:assert/strict');

function parseBoolean(value, fieldName) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new TypeError(fieldName + ' must be "true" or "false"');
}

function parseCacheSettings(input = {}) {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('settings must be a data record');
  }
  const raw = input.CACHE_ENABLED === undefined ? 'false' : input.CACHE_ENABLED;
  return Object.freeze({ cacheEnabled: parseBoolean(raw, 'CACHE_ENABLED') });
}

assert.equal(parseBoolean('false', 'CACHE_ENABLED'), false);
assert.equal(parseBoolean('true', 'CACHE_ENABLED'), true);
assert.throws(() => parseBoolean('False', 'CACHE_ENABLED'), TypeError);
assert.throws(() => parseBoolean(false, 'CACHE_ENABLED'), TypeError);
console.log(JSON.stringify(parseCacheSettings({ CACHE_ENABLED: 'false' })));
console.log(JSON.stringify(parseCacheSettings({ CACHE_ENABLED: 'true' })));
console.log(JSON.stringify(parseCacheSettings()));

// Expected output:
// {"cacheEnabled":false}
// {"cacheEnabled":true}
// {"cacheEnabled":false}

// Fixed accepted literals and a one-field output: O(1) work and storage.

for (const value of ['', 'TRUE', 'FALSE', ' true', 'false ', '1', '0', 0, 1, null, undefined, [], {}]) {
  assert.throws(() => parseBoolean(value, 'CACHE_ENABLED'), TypeError);
}
assert.throws(() => parseCacheSettings({ CACHE_ENABLED: null }), TypeError);
assert.throws(() => parseCacheSettings(null), TypeError);
const original = { CACHE_ENABLED: 'true' };
const result = parseCacheSettings(original);
assert.deepEqual(original, { CACHE_ENABLED: 'true' });
assert.equal(Object.isFrozen(result), true);
