'use strict';

const assert = require('node:assert/strict');

function readDataRecord(input, keys, label) {
  if (input === null || typeof input !== 'object') {
    throw new TypeError(`${label} must be an ordinary data record`);
  }
  const prototype = Object.getPrototypeOf(input);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError(`${label} has an unsupported prototype`);
  }
  if (Reflect.ownKeys(input).length !== keys.length) {
    throw new TypeError(`${label} has unexpected or missing fields`);
  }
  const values = Object.create(null);
  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(input, key);
    if (!descriptor || !Object.hasOwn(descriptor, 'value')) {
      throw new TypeError(`${label}.${key} must be an own data property`);
    }
    values[key] = descriptor.value;
  }
  return values;
}

function createExportConfig(input) {
  const { format, options } = readDataRecord(input, ['format', 'options'], 'config');
  const { maxRows, includeHeader } = readDataRecord(
    options, ['maxRows', 'includeHeader'], 'options'
  );
  if (format !== 'csv' && format !== 'json') throw new RangeError('Unsupported format');
  if (!Number.isInteger(maxRows) || maxRows < 1 || maxRows > 100000) {
    throw new RangeError('maxRows must be an integer from 1 through 100000');
  }
  if (typeof includeHeader !== 'boolean') throw new TypeError('includeHeader must be boolean');

  const ownedOptions = Object.freeze(Object.assign(Object.create(null), { maxRows, includeHeader }));
  return Object.freeze(Object.assign(Object.create(null), { format, options: ownedOptions }));
}

const source = { format: 'csv', options: { maxRows: 500, includeHeader: true } };
const config = createExportConfig(source);
source.format = 'json';
source.options.maxRows = 1;
assert.equal(config.format, 'csv');
assert.equal(config.options.maxRows, 500);
assert.notEqual(config.options, source.options);
assert.equal(Object.getPrototypeOf(config), null);
assert.equal(Object.getPrototypeOf(config.options), null);
assert.ok(Object.isFrozen(config) && Object.isFrozen(config.options));
assert.throws(() => { config.options.maxRows = 2; }, TypeError);
assert.throws(() => { config.options = {}; }, TypeError);
assert.throws(() => { config.extra = true; }, TypeError);

const valid = () => ({ format: 'json', options: { maxRows: 1, includeHeader: false } });
for (const maxRows of [0, 100001, 1.5, NaN, Infinity, '5', Number.MAX_SAFE_INTEGER]) {
  const input = valid();
  input.options.maxRows = maxRows;
  assert.throws(() => createExportConfig(input), RangeError);
}
for (const maxRows of [1, 100000]) {
  const input = valid();
  input.options.maxRows = maxRows;
  assert.equal(createExportConfig(input).options.maxRows, maxRows);
}
assert.throws(() => createExportConfig({ ...valid(), extra: 1 }), TypeError);
assert.throws(() => createExportConfig({ ...valid(), [Symbol('extra')]: 1 }), TypeError);
assert.throws(() => createExportConfig({ format: 'yaml', options: valid().options }), RangeError);
assert.throws(() => createExportConfig({ format: 'csv', options: { maxRows: 5, includeHeader: 1 } }), TypeError);
assert.throws(() => createExportConfig({ format: 'csv' }), TypeError);
assert.throws(() => createExportConfig(null), TypeError);
assert.throws(() => createExportConfig([]), TypeError);

let getterCalls = 0;
const accessorInput = valid();
Object.defineProperty(accessorInput.options, 'maxRows', {
  get() { getterCalls += 1; return 100; }, enumerable: true, configurable: true
});
assert.throws(() => createExportConfig(accessorInput), TypeError);
assert.equal(getterCalls, 0);
const inherited = Object.create({ format: 'csv' });
inherited.options = valid().options;
assert.throws(() => createExportConfig(inherited), TypeError);
const nullRecord = Object.assign(Object.create(null), valid());
assert.equal(createExportConfig(nullRecord).format, 'json');

console.log(config.format, config.options.maxRows, config.options.includeHeader);
console.log(Object.isFrozen(config), Object.isFrozen(config.options));
console.log('owned config assertions passed');
// Expected output:
// csv 500 true
// true true
// owned config assertions passed

// Reflection enumerates k input own keys: O(k) time and temporary space.
// Successful records have a fixed number of fields; the returned graph is O(1).
