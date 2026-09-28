'use strict';
const assert = require('node:assert/strict');

function createAuditRecorder() {
  const entries = [];
  return function record(event) {
    if (event === null || typeof event !== 'object' || Array.isArray(event)) {
      throw new TypeError('event object required');
    }
    const { id, action } = event;
    if (typeof id !== 'string' || id.trim() === '' ||
        typeof action !== 'string' || action.trim() === '') {
      throw new TypeError('nonempty id and action required');
    }
    entries.push({ id: id.trim(), action: action.trim() });
    return entries.map(entry => ({ id: entry.id, action: entry.action }));
  };
}
const record = createAuditRecorder();
const input = { id: 'A-1', action: 'created' };
const snapshot = record(input);
input.action = 'tampered';
snapshot[0].id = 'changed';
snapshot.push({ id: 'injected', action: 'fake' });
const next = record({ id: 'A-2', action: 'approved' });
assert.deepEqual(next, [
  { id: 'A-1', action: 'created' },
  { id: 'A-2', action: 'approved' }
]);
assert.throws(() => record({ id: 'A-3', action: {} }), TypeError);
assert.equal(createAuditRecorder()({ id: 'B-1', action: 'created' }).length, 1);
console.log(next.map(entry => `${entry.id}:${entry.action}`).join('|'));

// Expected output:
// A-1:created|A-2:approved
