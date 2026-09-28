import assert from 'node:assert/strict';
import { count, increment } from './counter.mjs';

assert.equal(this, undefined);
assert.equal(typeof require, 'undefined');
assert.equal(count, 0);
const initial = count;
increment();
assert.equal(initial, 0);
assert.equal(count, 1);
const again = await import('./counter.mjs');
assert.equal(again.count, 1);
assert.equal(again.increment, increment);
assert.throws(() => { count = 7; }, TypeError);
assert.throws(() => { again.count = 7; }, TypeError);
assert.equal(count, 1);
assert.throws(() => { moduleModelUndeclared = 1; }, ReferenceError);
console.log('module model assertions passed');
// Expected output:
// module model assertions passed
