'use strict';
const assert = require('node:assert/strict');

const marker = Symbol('marker');
const source = Object.create({ inherited: 'default' });
source.present = undefined;
source.nested = { theme: 'light' };
source[marker] = 'symbol value';
Object.defineProperty(source, 'hidden', { value: 'secret' });
Object.defineProperty(source, 'id', { value: 'R-1', enumerable: true });
let reads = 0;
Object.defineProperty(source, 'status', {
  enumerable: true,
  get() { reads += 1; return 'ready'; }
});
assert.equal(source.inherited, 'default');
assert.equal('inherited' in source, true);
assert.equal(Object.hasOwn(source, 'inherited'), false);
assert.equal(Object.hasOwn(source, 'present'), true);
assert.equal(Object.hasOwn(source, 'missing'), false);
assert.equal(source.present, source.missing);
assert.deepEqual(Object.keys(source), ['present', 'nested', 'id', 'status']);
assert.ok(Reflect.ownKeys(source).includes('hidden'));
assert.ok(Reflect.ownKeys(source).includes(marker));
assert.throws(() => { source.id = 'R-2'; }, TypeError);
assert.throws(() => { delete source.id; }, TypeError);

const copy = { ...source };
assert.equal(reads, 1);
assert.equal(copy.status, 'ready');
assert.equal(reads, 1);
assert.equal(Object.getOwnPropertyDescriptor(copy, 'status').get, undefined);
assert.equal(Object.getOwnPropertyDescriptor(copy, 'id').writable, true);
assert.equal(Object.hasOwn(copy, 'hidden'), false);
assert.equal(Object.hasOwn(copy, 'inherited'), false);
assert.equal(copy[marker], 'symbol value');
assert.notEqual(copy, source);
assert.equal(copy.nested, source.nested);
copy.nested.theme = 'dark';
assert.equal(source.nested.theme, 'dark');
copy.id = 'R-2';
assert.equal(source.id, 'R-1');

const input = { absentValue: undefined, explicitNull: null };
const { absentValue = 'fallback', explicitNull = 'fallback' } = input;
assert.equal(absentValue, 'fallback');
assert.equal(explicitNull, null);
const writes = [];
const target = { set status(value) { writes.push(value); } };
Object.assign(target, { status: 'assigned' });
const spreadTarget = { ...target, status: 'spread' };
assert.deepEqual(writes, ['assigned']);
assert.equal(spreadTarget.status, 'spread');

const frozen = Object.freeze({ nested: { active: true } });
frozen.nested.active = false;
assert.equal(frozen.nested.active, false);
assert.throws(() => { frozen.nested = {}; }, TypeError);
const keys = { '4294967295': 'large', 2: 'two', label: 'text', 10: 'ten', '01': 'leading' };
assert.deepEqual(Object.keys(keys), ['2', '10', '4294967295', 'label', '01']);
console.log('Property presence, descriptors, copy behavior, and key-order checks passed.');

// Expected output:
// Property presence, descriptors, copy behavior, and key-order checks passed.

// This fixed fixture has constant-sized state. General copying visits source keys
// and adds any work performed by source getters.
