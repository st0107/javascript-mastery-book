// Runtime: Node.js ES module
import assert from 'node:assert/strict';
import { quoteLine } from './pricing.mjs';
const first = quoteLine(250, 3);
assert.deepEqual(first, { unitCents: 250, quantity: 3, totalCents: 750 });
assert.notStrictEqual(first, quoteLine(250, 3));
assert.equal(quoteLine(1_000_000, 1_000).totalCents, 1_000_000_000);
assert.equal(quoteLine(0, 0).totalCents, 0);
for (const bad of ['250', null, NaN, Infinity, -1, 1.5, 1_000_001]) {
  assert.throws(() => quoteLine(bad, 1), RangeError);
}
for (const bad of ['3', undefined, -1, 0.5, 1_001]) {
  assert.throws(() => quoteLine(250, bad), RangeError);
}
console.log(JSON.stringify(first));
console.log('quote assertions passed');
// Expected output:
// {"unitCents":250,"quantity":3,"totalCents":750}
// quote assertions passed
