'use strict';

const assert = require('node:assert/strict');
const kept = [];
for (let index = 0; index < 5; index++) {
  if (index === 1) continue;
  if (index === 4) break;
  kept.push(index);
}
assert.deepEqual(kept, [0, 2, 3]);
let runs = 0;
do { runs++; } while (false);
assert.equal(runs, 1);
const object = Object.create({ inherited: 1 });
object.own = 2;
const keys = [];
for (const key in object) keys.push(key);
assert.deepEqual(keys, ['own', 'inherited']);
assert.deepEqual(Object.keys(object), ['own']);
const sparse = [];
sparse[1] = 'x';
assert.deepEqual(Array.from(sparse), [undefined, 'x']);
const rows = [];
outer:
for (const row of [[1, 2], [3, -1], [4]]) {
  for (const value of row) {
    if (value < 0) continue outer;
  }
  rows.push(row.join(':'));
}
assert.deepEqual(rows, ['1:2', '4']);
console.log('Branch, update, iteration, and labeled-exit assertions passed.');
// Expected output:
// Branch, update, iteration, and labeled-exit assertions passed.
