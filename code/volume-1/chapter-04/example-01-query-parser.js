'use strict';
const assert = require('node:assert/strict');

function parsePositiveInteger(value, fieldName, maximum = Number.MAX_SAFE_INTEGER) {
  if (!Number.isSafeInteger(maximum) || maximum < 1) {
    throw new RangeError('maximum must be a positive safe integer');
  }
  if (typeof value !== 'string') throw new TypeError(fieldName + ' must be a string');
  if (value.length < 1 || value.length > 16 || value[0] === '0' || /[^0-9]/.test(value)) {
    throw new RangeError(fieldName + ' must contain canonical positive decimal digits');
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed > maximum) {
    throw new RangeError(fieldName + ' is outside its allowed range');
  }
  return parsed;
}

function parsePagination(query = {}) {
  if (query === null || typeof query !== 'object' || Array.isArray(query)) {
    throw new TypeError('query must be a data record');
  }
  const page = parsePositiveInteger(query.page === undefined ? '1' : query.page, 'page', 1000000);
  const pageSize = parsePositiveInteger(
    query.pageSize === undefined ? '25' : query.pageSize, 'pageSize', 100
  );
  return Object.freeze({ page, pageSize, offset: (page - 1) * pageSize });
}

const input = { page: '2', pageSize: '25' };
const parsed = parsePagination(input);
assert.deepEqual(parsed, { page: 2, pageSize: 25, offset: 25 });
assert.deepEqual(input, { page: '2', pageSize: '25' });
assert.equal(Object.isFrozen(parsed), true);
assert.throws(() => parsePositiveInteger('9007199254740993', 'page'), RangeError);
assert.throws(() => parsePositiveInteger(true, 'page'), TypeError);
assert.throws(() => parsePagination({ pageSize: '101' }), RangeError);
assert.throws(() => parsePagination({ page: null }), TypeError);
console.log(JSON.stringify(parsed));
console.log(JSON.stringify(parsePagination()));

// Expected output:
// {"page":2,"pageSize":25,"offset":25}
// {"page":1,"pageSize":25,"offset":0}

// O(k) parsing work for at most 16 digits per field; O(1) output storage.

assert.equal(parsePositiveInteger('9007199254740991', 'id'), Number.MAX_SAFE_INTEGER);
for (const value of ['', '0', '00', '01', '+1', '-1', ' 1', '1 ', '1\n', '1.0', '1e2',
  '0x10', '12px', 'Infinity', 'NaN', '9007199254740992', '9'.repeat(1000)]) {
  assert.throws(() => parsePositiveInteger(value, 'page'), RangeError);
}
for (const value of [true, false, 2, null, undefined, [], {}, ['2']]) {
  assert.throws(() => parsePositiveInteger(value, 'page'), TypeError);
}
for (const value of [0, -1, 1.5, Infinity, '100']) {
  assert.throws(() => parsePositiveInteger('1', 'page', value), RangeError);
}
assert.deepEqual(parsePagination({ page: '1000000', pageSize: '100' }),
  { page: 1000000, pageSize: 100, offset: 99999900 });
assert.throws(() => parsePagination({ page: '1000001' }), RangeError);
assert.throws(() => parsePagination({ pageSize: '0' }), RangeError);
assert.throws(() => parsePagination([]), TypeError);
assert.throws(() => parsePagination(null), TypeError);
assert.throws(() => parsePagination({ page: ['1', '2'] }), TypeError);
