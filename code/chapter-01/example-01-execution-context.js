'use strict';
const assert = require('node:assert/strict');
const centsPerCopy = 1200;
function quote(copies) {
  const totalCents = copies * centsPerCopy;
  return totalCents;
}
// Trusted small integer inputs: this lesson isolates call and binding behavior.
assert.equal(quote(2), 2400);
assert.equal(quote(0), 0);
assert.equal(centsPerCopy, 1200);
function readTooSoon() {
  return total;
  const total = 42;
}
function readAfterInitialization() {
  function read() { return total; }
  const total = 42;
  return read();
}
assert.throws(readTooSoon, ReferenceError);
assert.equal(readAfterInitialization(), 42);
console.log('execution context assertions passed');
// Expected output:
// execution context assertions passed

// Time O(1); additional space O(1).
