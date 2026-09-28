'use strict';
const assert = require('node:assert/strict');

function getRuntimeCapabilities(adapter) {
  if (adapter === null || typeof adapter !== 'object') throw new TypeError('adapter must be an object');
  return {
    canWriteText: typeof adapter.writeText === 'function',
    canShowStatus: typeof adapter.showStatus === 'function'
  };
}
assert.deepEqual(getRuntimeCapabilities({}), { canWriteText: false, canShowStatus: false });
assert.deepEqual(getRuntimeCapabilities({ writeText: true, showStatus: null }), {
  canWriteText: false, canShowStatus: false
});
assert.deepEqual(getRuntimeCapabilities({ writeText() {}, showStatus() {} }), {
  canWriteText: true, canShowStatus: true
});
for (const invalid of [null, undefined, 'node', 4, () => {}]) {
  assert.throws(() => getRuntimeCapabilities(invalid), TypeError);
}
const unavailable = { writeText() { throw new Error('quota exceeded'); } };
assert.equal(getRuntimeCapabilities(unavailable).canWriteText, true);
assert.throws(() => unavailable.writeText('report'), /quota exceeded/);
console.log('Capability shape and operation failure checks passed.');

// Expected output:
// Capability shape and operation failure checks passed.

// Constant-size inspection of a trusted adapter; operation cost is separate.
