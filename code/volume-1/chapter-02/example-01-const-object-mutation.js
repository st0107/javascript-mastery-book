'use strict';
const assert = require('node:assert/strict');

const account = { id: 'acct_100', status: 'active' };
const observer = account;
account.status = 'suspended';
assert.equal(observer.status, 'suspended');
assert.equal(observer, account);
assert.throws(() => { account = { id: 'acct_200', status: 'active' }; }, TypeError);
let selection = account;
selection = { id: 'acct_200', status: 'active' };
assert.notEqual(selection, account);
assert.equal(account.id, 'acct_100');
console.log('Binding replacement and shared mutation checks passed.');

// Expected output:
// Binding replacement and shared mutation checks passed.

// O(1) work and additional objects for this fixed-sized trace.
