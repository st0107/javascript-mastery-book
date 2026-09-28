'use strict';
const assert = require('node:assert/strict');
const sparse = Array(3);
assert.equal(sparse.every(() => false), true);
assert.equal(sparse.some(() => true), false);
assert.equal(Object.hasOwn(sparse, 0), false);
assert.equal(Object.hasOwn(Array.from(sparse), 0), true);
assert.throws(() => sparse.reduce((sum, value) => sum + value), TypeError);
assert.equal(sparse.reduce((sum, value) => sum + value, 0), 0);
assert.equal([,].includes(undefined), true);
assert.equal([,].indexOf(undefined), -1);
assert.equal([NaN].includes(NaN), true);
assert.equal([NaN].indexOf(NaN), -1);
const filled = Array(2).fill({ count: 0 });
filled[0].count = 3;
assert.equal(filled[1].count, 3);
const fresh = Array.from({ length: 2 }, () => ({ count: 0 }));
fresh[0].count = 3;
assert.equal(fresh[1].count, 0);
const input = [1, 2, 3];
const result = input.map((value, index) => {
  if (index === 0) { input[1] = 20; input.push(4); }
  return value;
});
assert.deepEqual(result, [1, 20, 3]);
assert.deepEqual(input, [1, 20, 3, 4]);
const map = new Map([['a', 1], ['b', 2]]);
map.set('a', 3);
assert.deepEqual([...map.keys()], ['a', 'b']);
map.delete('a');
map.set('a', 4);
assert.deepEqual([...map.keys()], ['b', 'a']);
map['not-an-entry'] = 5;
assert.equal(map.has('not-an-entry'), false);
assert.equal(map.size, 2);
assert.deepEqual(['10', '10', '10'].map(parseInt), [10, NaN, 2]);
console.log('collection edge cases passed');

// Expected output:
// collection edge cases passed
