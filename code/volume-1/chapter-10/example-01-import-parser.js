'use strict';

const assert = require('node:assert/strict');

function parseImport(text) {
  if (typeof text !== 'string') throw new TypeError('Expected JSON text.');
  if (text.length > 2048) throw new RangeError('Import text is too long.');
  let value;
  try {
    value = JSON.parse(text);
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    throw new SyntaxError('Invalid import JSON.', { cause: error });
  }
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('Expected an import object.');
  }
  const keys = Object.keys(value);
  if (keys.length !== 2 || !Object.hasOwn(value, 'id') || !Object.hasOwn(value, 'quantity')) {
    throw new TypeError('Expected exactly id and quantity.');
  }
  if (typeof value.id !== 'string' || !/^[A-Z0-9-]{1,32}$/.test(value.id) ||
      typeof value.quantity !== 'number') {
    throw new TypeError('Invalid import field types or ID syntax.');
  }
  if (!Number.isSafeInteger(value.quantity) || value.quantity < 0 || value.quantity > 10000) {
    throw new RangeError('Quantity must be an integer from zero to 10,000.');
  }
  return { id: value.id, quantity: value.quantity };
}

const source = '{"id":"ORD-42","quantity":3}';
assert.deepEqual(parseImport(source), { id: 'ORD-42', quantity: 3 });
assert.deepEqual(parseImport('{"quantity":0,"id":"A"}'), { id: 'A', quantity: 0 });
assert.deepEqual(parseImport(JSON.stringify({ id: 'Z'.repeat(32), quantity: 10000 })),
  { id: 'Z'.repeat(32), quantity: 10000 });
const first = parseImport(source);
const second = parseImport(source);
assert.notEqual(first, second);
first.quantity = 99;
assert.equal(second.quantity, 3);
assert.equal(Object.getPrototypeOf(second), Object.prototype);

for (const text of [source.padEnd(2048), source.padStart(2048)]) {
  assert.equal(text.length, 2048);
  assert.deepEqual(parseImport(text), { id: 'ORD-42', quantity: 3 });
}
assert.throws(() => parseImport(source.padEnd(2049)), RangeError);
// Length is checked before parsing: even excessive malformed text is a range failure.
assert.throws(() => parseImport('{'.repeat(2049)), RangeError);
for (const value of [undefined, null, true, 3, {}, [], new String(source), Symbol('text')]) {
  assert.throws(() => parseImport(value), TypeError);
}
for (const text of ['', '{', '{"id":', '{"id":"A","quantity":1,}']) {
  assert.throws(() => parseImport(text), error =>
    error instanceof SyntaxError && error.message === 'Invalid import JSON.' &&
    error.cause instanceof SyntaxError && error.cause !== error);
}
for (const text of ['null', '[]', '[1]', 'true', '1', '"text"', '{}',
  '{"id":"A"}', '{"quantity":1}', '{"id":"A","quantity":1,"extra":true}',
  '{"id":"A","quantity":1,"__proto__":{"polluted":true}}',
  '{"id":"A","quantity":1,"constructor":{}}']) {
  assert.throws(() => parseImport(text), TypeError);
}
for (const id of ['', 'A'.repeat(33), 'a', ' A', 'A ', 'A\n', 'A\r', 'A\u2028',
  'A\t', 'A_B', '\u00c9', null, 12]) {
  assert.throws(() => parseImport(JSON.stringify({ id, quantity: 1 })), TypeError);
}
for (const quantity of ['1', null, false, [], {}]) {
  assert.throws(() => parseImport(JSON.stringify({ id: 'A', quantity })), TypeError);
}
for (const quantity of [-1, 10001, 0.5, 2 ** 53]) {
  assert.throws(() => parseImport(JSON.stringify({ id: 'A', quantity })), RangeError);
}
assert.throws(() => parseImport('{"id":"A","quantity":1e400}'), RangeError);
assert.equal(parseImport('{"id":"A","quantity":-0}').quantity, -0);
// The contract validates JSON.parse's result; it does not detect duplicate members.
assert.deepEqual(parseImport('{"id":"OLD","id":"NEW","quantity":2}'),
  { id: 'NEW', quantity: 2 });

console.log(JSON.stringify(parseImport(source)));
console.log('Import syntax, schema, bounds, and projection assertions passed.');
// Expected output:
// {"id":"ORD-42","quantity":3}
// Import syntax, schema, bounds, and projection assertions passed.

// Parsing and validation use O(n) work and space under the 2,048-code-unit cap.
