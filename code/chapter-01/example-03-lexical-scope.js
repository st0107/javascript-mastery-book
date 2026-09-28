'use strict';
const assert = require('node:assert/strict');

const region = 'APAC';
function label(id) {
  return `${region}:${id}`;
}
function runInAnotherScope() {
  const region = 'EU';
  return label('A-7');
}
assert.equal(runInAnotherScope(), 'APAC:A-7');
console.log(runInAnotherScope());

// Expected output:
// APAC:A-7
