'use strict';
const assert = require('node:assert/strict');
const calls = [];
function read(label, value) { calls.push(label); return value; }
assert.equal(read('a', 3) + read('b', 4) * read('c', 5), 23);
assert.deepEqual(calls, ['a', 'b', 'c']);
let skipped = 0;
assert.equal(0 ?? ++skipped, 0);
assert.equal(false && ++skipped, false);
assert.equal(skipped, 0);
const state = { count: 1 };
const alias = state;
const before = state.count++;
assert.equal(before, 1);
assert.equal(alias.count, 2);
assert.equal((7 & 5) === 5, true);
console.log(calls.join(','));
console.log(before, alias.count, skipped);

// Expected output:
// a,b,c
// 1 2 0
