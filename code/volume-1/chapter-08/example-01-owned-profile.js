'use strict';

function shipmentView(input) {
  function record(value, name) {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      throw new TypeError(`${name} must be a record`);
    }
  }
  function requiredText(value, name) {
    if (typeof value !== 'string') throw new TypeError(`${name} must be text`);
    const text = value.trim();
    if (text === '') throw new RangeError(`${name} must be nonempty`);
    return text;
  }
  record(input, 'shipment');
  if (!Object.hasOwn(input, 'id') || !Object.hasOwn(input, 'address')) {
    throw new TypeError('own id and address required');
  }
  record(input.address, 'address');
  if (!Object.hasOwn(input.address, 'city') || !Object.hasOwn(input.address, 'postalCode')) {
    throw new TypeError('own city and postalCode required');
  }
  return {
    id: requiredText(input.id, 'id'),
    address: {
      city: requiredText(input.address.city, 'city'),
      postalCode: requiredText(input.address.postalCode, 'postalCode')
    }
  };
}
const assert = require('node:assert/strict');
const source = { id: ' S-1 ', address: { city: ' Pune ', postalCode: '411001' }, internalNote: 'private' };
const view = shipmentView(source);
assert.deepEqual(view, { id: 'S-1', address: { city: 'Pune', postalCode: '411001' } });
assert.notEqual(view, source);
assert.notEqual(view.address, source.address);
source.address.city = 'Mumbai';
view.address.postalCode = 'local';
assert.equal(view.address.city, 'Pune');
assert.equal(source.address.postalCode, '411001');
assert.equal(Object.hasOwn(view, 'internalNote'), false);
for (const input of [null, [], {}, { id: 'S', address: null }, { id: 2, address: { city: 'A', postalCode: 'B' } }]) {
  assert.throws(() => shipmentView(input), TypeError);
}
assert.throws(() => shipmentView(Object.create({ id: 'S', address: { city: 'A', postalCode: 'B' } })), TypeError);
assert.throws(() => shipmentView({ id: 'S', address: { city: ' ', postalCode: 'B' } }), RangeError);
console.log('Shipment schema and nested ownership checks passed.');

// Expected output:
// Shipment schema and nested ownership checks passed.

// O(L) normalization work and retained text for total retained field length L.
