'use strict';

const assert = require('node:assert/strict');

// Construction is ordinary execution; only throw transfers control.
const events = [];
const original = new TypeError('Invalid quantity.');
events.push('constructed');
function parseRecord() {
  events.push('parse');
  throw original;
}
function importRecord() {
  events.push('import');
  return parseRecord();
}
try {
  importRecord();
  events.push('unreachable');
} catch (error) {
  assert.equal(error, original);
  assert.equal(error.name, 'TypeError');
  events.push('catch');
} finally {
  events.push('finally');
}
assert.deepEqual(events, ['constructed', 'import', 'parse', 'catch', 'finally']);

assert.throws(() => JSON.parse('{'), SyntaxError);
assert.throws(() => { const callback = null; callback(); }, TypeError);
// A logical defect can complete normally; an assertion exposes the mismatch.
const incorrectTotal = 100 - 10 - 10;
assert.notEqual(incorrectTotal, 90);

const contextual = new Error('Could not import inventory.', { cause: original });
assert.equal(contextual.cause, original);
assert.equal(contextual.message, 'Could not import inventory.');
for (const cause of [undefined, null, false, 0, 'failed', original]) {
  const wrapped = new Error('Boundary failed.', { cause });
  assert.equal(Object.hasOwn(wrapped, 'cause'), true);
  assert.equal(wrapped.cause, cause);
}

function primitiveReturn() {
  let count = 1;
  try { return count; } finally { count = 2; }
}
function objectReturn() {
  const result = { closed: false };
  try { return result; } finally { result.closed = true; }
}
function replacedReturn() {
  try { return 'work'; } finally { return 'cleanup'; }
}
function suppressedFailure() {
  try { throw original; } finally { return 'suppressed'; }
}
const cleanupFailure = new Error('Cleanup failed.');
function replacedFailure() {
  try { throw original; } finally { throw cleanupFailure; }
}
assert.equal(primitiveReturn(), 1);
assert.deepEqual(objectReturn(), { closed: true });
assert.equal(replacedReturn(), 'cleanup');
assert.equal(suppressedFailure(), 'suppressed');
assert.throws(replacedFailure, error => error === cleanupFailure);

const state = { count: 0 };
try {
  state.count++;
  throw original;
} catch (error) {
  assert.equal(error, original);
}
assert.equal(state.count, 1); // Catch did not roll back the mutation.

let pending;
let registrationHandled = false;
try {
  pending = () => { throw original; };
} catch {
  registrationHandled = true;
}
assert.equal(registrationHandled, false);
assert.throws(() => pending(), error => error === original);

console.log('Error values, propagation, cause, and finally assertions passed.');
// Expected output:
// Error values, propagation, cause, and finally assertions passed.

// These fixed-size control-flow probes use O(1) work and storage.
