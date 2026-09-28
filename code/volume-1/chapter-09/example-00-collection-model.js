'use strict';
const assert = require('node:assert/strict');
const values = [10, 2, 30];
assert.deepEqual(values.toSorted((a, b) => a - b), [2, 10, 30]);
assert.deepEqual(values, [10, 2, 30]);
assert.equal(values.reduce((sum, value) => sum + value, 0), 42);
assert.equal(values.some(value => value < 5), true);
assert.equal(values.every(value => value > 0), true);
const sparse = [1, , undefined];
let visits = 0;
const mapped = sparse.map(value => { visits += 1; return value; });
assert.equal(visits, 2);
assert.equal(Object.hasOwn(mapped, 1), false);
assert.equal(Object.hasOwn([...sparse], 1), true);
const shared = { id: 'u1' };
const set = new Set([shared, shared, { id: 'u1' }, NaN, NaN]);
assert.equal(set.size, 3);
const map = new Map([['key', undefined]]);
assert.equal(map.get('key'), undefined);
assert.equal(map.has('key'), true);
assert.equal(map.has('missing'), false);
console.log('collection model passed');

// Expected output:
// collection model passed
