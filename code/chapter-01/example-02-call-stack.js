'use strict';

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function buildUserRecord(rawUser) {
  return {
    id: rawUser.id,
    email: normalizeEmail(rawUser.email),
    active: Boolean(rawUser.active)
  };
}

function importUser(rawUser) {
  const user = buildUserRecord(rawUser);
  return `Imported ${user.id} with ${user.email}`;
}

console.log(importUser({ id: 'U-101', email: '  ENGINEER@EXAMPLE.COM ', active: 1 }));

// Expected output:
// Imported U-101 with engineer@example.com
// Stack order: importUser -> buildUserRecord -> normalizeEmail, then returns unwind.

