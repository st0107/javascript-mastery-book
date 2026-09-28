'use strict';
const assert = require('node:assert/strict');

function normalizeUser(input) {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('user object required');
  }
  const { id, email } = input;
  if (typeof id !== 'string' || typeof email !== 'string') {
    throw new TypeError('id and email must be strings');
  }
  const cleanId = id.trim();
  const cleanEmail = email.trim().toLowerCase();
  if (cleanId === '' || cleanEmail === '') throw new RangeError('fields must be nonempty');
  return { id: cleanId, email: cleanEmail };
}
const raw = Object.freeze({ id: ' U-1 ', email: ' LEA@EXAMPLE.COM ', role: 'admin' });
const normalized = normalizeUser(raw);
assert.deepEqual(normalized, { id: 'U-1', email: 'lea@example.com' });
assert.notEqual(normalized, raw);
assert.equal(Object.hasOwn(normalized, 'role'), false);
normalized.id = 'changed';
assert.equal(raw.id, ' U-1 ');
for (const input of [undefined, null, [], 'user', {}, { id: 1, email: 'a' }, { id: 'u', email: null }]) {
  assert.throws(() => normalizeUser(input), TypeError);
}
for (const input of [{ id: ' ', email: 'a' }, { id: 'u', email: ' ' }]) {
  assert.throws(() => normalizeUser(input), RangeError);
}
console.log('User record type, normalization, and ownership checks passed.');

// Expected output:
// User record type, normalization, and ownership checks passed.

// O(L) time and resulting text storage for total input field length L.
