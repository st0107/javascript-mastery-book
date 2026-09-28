'use strict';
const assert = require('node:assert/strict');

function canAccessBeta(user, feature) {
  if (user === null || typeof user !== 'object' || Array.isArray(user) ||
      feature === null || typeof feature !== 'object' || Array.isArray(feature)) return false;
  if (user.active !== true || feature.enabled !== true) return false;
  if (typeof user.id !== 'string' || user.id.length < 1 || user.id.length > 64) return false;
  if (typeof user.role !== 'string') return false;
  const allowed = feature.allowedUserIds ?? [];
  if (!Array.isArray(allowed) || allowed.length > 1000) return false;
  for (const id of allowed) {
    if (typeof id !== 'string' || id.length < 1 || id.length > 64) return false;
  }
  return user.role === 'staff' || allowed.includes(user.id);
}

const member = { id: 'u1', active: true, role: 'member' };
const enabled = { enabled: true, allowedUserIds: ['u1'] };
assert.equal(canAccessBeta(member, enabled), true);
assert.equal(canAccessBeta(member, { enabled: true }), false);
assert.equal(canAccessBeta(member, { enabled: true, allowedUserIds: 'u1' }), false);
assert.equal(canAccessBeta({ ...member, active: 'false' }, enabled), false);
assert.equal(canAccessBeta(null, enabled), false);
assert.equal(canAccessBeta({ ...member, role: 'staff' }, { enabled: true }), true);
assert.equal(canAccessBeta({ ...member, role: 'staff' }, { enabled: true, allowedUserIds: [null] }), false);
console.log(canAccessBeta(member, enabled));
console.log(canAccessBeta(member, { enabled: true }));
console.log(canAccessBeta(member, { enabled: 'true', allowedUserIds: ['u1'] }));

// Expected output:
// true
// false
// false

// O(n) time for at most 1000 IDs; O(1) additional space.
// A missing list allocates an empty array of constant size.

for (const user of [undefined, null, [], {}, { ...member, id: '' }, { ...member, id: 1 }]) {
  assert.equal(canAccessBeta(user, enabled), false);
}
for (const feature of [undefined, null, [], {}, { enabled: false }, { enabled: true, allowedUserIds: [1] }]) {
  assert.equal(canAccessBeta(member, feature), false);
}
assert.equal(canAccessBeta(member, { enabled: true, allowedUserIds: null }), false);
assert.equal(canAccessBeta(member, { enabled: true, allowedUserIds: new Array(1) }), false);
assert.equal(canAccessBeta(member, { enabled: true, allowedUserIds: Array(1000).fill('u1') }), true);
assert.equal(canAccessBeta(member, { enabled: true, allowedUserIds: Array(1001).fill('u1') }), false);
assert.equal(canAccessBeta({ ...member, id: 'u2' }, enabled), false);
assert.deepEqual(enabled.allowedUserIds, ['u1']);
