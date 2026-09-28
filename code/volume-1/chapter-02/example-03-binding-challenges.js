'use strict';

{
'use strict';
const assert = require('node:assert/strict');

const original = { status: 'queued' };
let selected = original;
selected.status = 'ready';
selected = { status: 'sent' };
assert.equal(original.status, 'ready');
assert.equal(selected.status, 'sent');
assert.notEqual(original, selected);
console.log(original.status, selected.status);

// Expected output:
// ready sent
}

{
'use strict';
const assert = require('node:assert/strict');

const quantity = 8;
{
  const previewQuantity = quantity + 1;
  assert.equal(previewQuantity, 9);
  console.log(previewQuantity);
}
assert.equal(quantity, 8);
console.log(quantity);

// Expected output:
// 9
// 8
}

{
'use strict';
const assert = require('node:assert/strict');

function diagnosticKind(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (Number.isNaN(value)) return 'nan';
  return typeof value;
}
const pairs = [
  [null, 'null'], [[], 'array'], [NaN, 'nan'], [undefined, 'undefined'],
  [false, 'boolean'], ['4', 'string'], [4, 'number'], [4n, 'bigint'],
  [Symbol('id'), 'symbol'], [{}, 'object'], [() => {}, 'function']
];
for (const [value, kind] of pairs) assert.equal(diagnosticKind(value), kind);
console.log(pairs.map(([value]) => diagnosticKind(value)).join('|'));

// Expected output:
// null|array|nan|undefined|boolean|string|number|bigint|symbol|object|function
}

{
'use strict';
const assert = require('node:assert/strict');

function adjustStock(count, delta) {
  if (!Number.isSafeInteger(count) || !Number.isSafeInteger(delta)) {
    throw new TypeError('safe integer inputs required');
  }
  if (count < 0 || count > 10_000 || (delta !== 1 && delta !== -1)) {
    throw new RangeError('invalid stock adjustment');
  }
  const nextCount = count + delta;
  if (nextCount < 0 || nextCount > 10_000) throw new RangeError('stock range exceeded');
  return nextCount;
}
assert.equal(adjustStock(0, 1), 1);
assert.equal(adjustStock(10_000, -1), 9999);
for (const args of [[0, -1], [10_000, 1], [-1, 1], [3, 2]]) {
  assert.throws(() => adjustStock(...args), RangeError);
}
for (const args of [['3', 1], [NaN, 1], [3, '1'], [3.5, 1]]) {
  assert.throws(() => adjustStock(...args), TypeError);
}
console.log(adjustStock(3, 1));

// Expected output:
// 4
}

{
'use strict';
const assert = require('node:assert/strict');

function shipmentSnapshot(input) {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('shipment object required');
  }
  const { id, status } = input;
  if (typeof id !== 'string' || typeof status !== 'string') {
    throw new TypeError('string fields required');
  }
  const cleanId = id.trim();
  const cleanStatus = status.trim();
  if (cleanId === '' || cleanStatus === '') throw new RangeError('nonempty fields required');
  return { id: cleanId, status: cleanStatus };
}
const source = { id: ' S-1 ', status: 'queued', secret: 'excluded' };
const snapshot = shipmentSnapshot(source);
source.status = 'sent';
snapshot.id = 'local';
assert.equal(source.id, ' S-1 ');
assert.equal(snapshot.status, 'queued');
assert.equal(Object.hasOwn(snapshot, 'secret'), false);
for (const invalid of [null, [], {}, { id: 3, status: 'ready' }]) {
  assert.throws(() => shipmentSnapshot(invalid), TypeError);
}
assert.throws(() => shipmentSnapshot({ id: ' ', status: 'ready' }), RangeError);
console.log(snapshot.status, source.status);

// Expected output:
// queued sent
}

{
'use strict';
const assert = require('node:assert/strict');

function reviewAndReplaceLocal(record) {
  record.reviewed = true;
  record = { reviewed: false };
  return record;
}
const original = { reviewed: false };
const returned = reviewAndReplaceLocal(original);
assert.equal(original.reviewed, true);
assert.equal(returned.reviewed, false);
assert.notEqual(original, returned);
console.log(original.reviewed, returned.reviewed, original === returned);

// Expected output:
// true false false
}
