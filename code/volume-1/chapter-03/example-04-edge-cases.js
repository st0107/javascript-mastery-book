'use strict';
const assert = require('node:assert/strict');
const empty = null;
assert.equal(empty?.child.name, undefined);
assert.throws(() => (empty?.child).name, TypeError);
assert.throws(() => ({ run: 3 }).run?.(), TypeError);
assert.equal(0 < 50 < 10, true);
assert.equal(0 < 50 && 50 < 10, false);
assert.equal(2147483648 | 0, -2147483648);
assert.equal(1 << 32, 1);
assert.equal(-8 % 3, -2);
assert.throws(() => 1n + 1, TypeError);
let stored = 0;
let reads = 0;
let writes = 0;
const record = {
  get value() { reads += 1; return stored; },
  set value(next) { writes += 1; stored = next; }
};
record.value ??= 9;
assert.deepEqual([reads, writes, stored], [1, 0, 0]);
record.value ||= 9;
assert.deepEqual([reads, writes, stored], [2, 1, 9]);
console.log('operator edge cases passed');

// Expected output:
// operator edge cases passed
