'use strict';
const assert = require('node:assert/strict');
function planBatches(total, size = 25) {
  if (!Number.isSafeInteger(total) || total < 0 || total > 1000000) {
    throw new RangeError('total must be an integer from 0 to 1000000');
  }
  if (!Number.isSafeInteger(size) || size < 1 || size > 1000) {
    throw new RangeError('size must be an integer from 1 to 1000');
  }
  return { total, size, batches: Math.ceil(total / size) };
}
assert.deepEqual(planBatches(51), { total: 51, size: 25, batches: 3 });
assert.equal(planBatches(0).batches, 0);
assert.equal(planBatches(50).batches, 2);
assert.throws(() => planBatches('51'), RangeError);
assert.throws(() => planBatches(51, null), RangeError);
assert.throws(() => planBatches(51, 0), RangeError);
assert.throws(() => planBatches(1000001), RangeError);
console.log(JSON.stringify(planBatches(51)));
console.log('batch planning assertions passed');
// Expected output:
// {"total":51,"size":25,"batches":3}
// batch planning assertions passed

// O(1) arithmetic and fixed-size result storage in the bounded Number domain.
