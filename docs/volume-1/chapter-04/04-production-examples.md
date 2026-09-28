# Production Examples

## Parse Pagination at the Boundary

The gateway accepts page and pageSize as strings from a query adapter. Each must be a canonical positive decimal integer: ASCII digits, no leading zero, no sign, no whitespace, no fraction, and no suffix. The parser admits at most 16 digits, then requires a safe integer and a field-specific bound.

Page is limited to 1 through 1,000,000 and pageSize to 1 through 100. Missing fields default to "1" and "25"; explicit null is invalid. The helper returns a new frozen record, tolerates unrelated fields, and leaves its ordinary data-record input unchanged. Duplicate query parameters must be rejected or resolved by the HTTP adapter; an array of values is rejected here.

| Input | Result and reason |
| --- | --- |
| "2" | Number 2, if within the field bound. |
| true or 2 | TypeError: only source strings are accepted. |
| "01", "+2", "2.0", "2e0" | RangeError: outside the accepted grammar. |
| "2px" | RangeError: the entire string must match. |
| "9007199254740993" | RangeError: not a safe integer after conversion. |
| pageSize "101" | RangeError: exceeds the page-size policy. |
| Missing page | Default to 1. |
| page null | TypeError: malformed supplied value. |

```js
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
```

The type check prevents true becoming 1 and prevents object conversion hooks from running. The length bound limits work before the regular expression. Grammar validation rejects representations that Number would otherwise accept. Safe-integer validation catches precision loss, and domain bounds keep request sizes and computed offsets controlled.

The largest offset is 99,999,900 under these bounds, so its integer multiplication remains safe. A different page-size or page limit requires revisiting that proof. Large database offsets may still be slow; cursor pagination is a separate design decision, not something numeric validation solves.

Companion: `code/volume-1/chapter-04/example-01-query-parser.js`. Additional assertions cover both maximums, unsafe integer neighbors, long strings, duplicate-value arrays, nonstring values, and canonical syntax.

## Parse Environment Flags as an Explicit Vocabulary

The configuration layer accepts exactly "true" or "false". Case changes and whitespace are rejected, so a typo cannot silently switch behavior. An absent CACHE_ENABLED defaults to false. A present malformed value stops configuration loading with an error instead of quietly selecting a default.

The function receives a record rather than reading process.env directly. Tests can supply independent records without mutating the process environment, and browser/server adapters can use the same parsing policy.

```js
'use strict';
const assert = require('node:assert/strict');

function parseBoolean(value, fieldName) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new TypeError(fieldName + ' must be "true" or "false"');
}

function parseCacheSettings(input = {}) {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('settings must be a data record');
  }
  const raw = input.CACHE_ENABLED === undefined ? 'false' : input.CACHE_ENABLED;
  return Object.freeze({ cacheEnabled: parseBoolean(raw, 'CACHE_ENABLED') });
}

assert.equal(parseBoolean('false', 'CACHE_ENABLED'), false);
assert.equal(parseBoolean('true', 'CACHE_ENABLED'), true);
assert.throws(() => parseBoolean('False', 'CACHE_ENABLED'), TypeError);
assert.throws(() => parseBoolean(false, 'CACHE_ENABLED'), TypeError);
console.log(JSON.stringify(parseCacheSettings({ CACHE_ENABLED: 'false' })));
console.log(JSON.stringify(parseCacheSettings({ CACHE_ENABLED: 'true' })));
console.log(JSON.stringify(parseCacheSettings()));

// Expected output:
// {"cacheEnabled":false}
// {"cacheEnabled":true}
// {"cacheEnabled":false}

// Fixed accepted literals and a one-field output: O(1) work and storage.
```

Boolean('false') would return true because the string is nonempty. JSON.parse could parse booleans, but it also accepts many values this schema does not allow. Explicit comparisons state the vocabulary directly and avoid coercing object values.

Companion: `code/volume-1/chapter-04/example-02-boolean-env.js`. Assertions cover capitalization, whitespace, numeric spellings, null, missing data, result freezing, and input ownership.

## Error and Trust Policy

The helpers throw on malformed supplied values. An HTTP adapter can map query errors to an appropriate client response; a startup adapter can report an invalid setting and stop. Do not expose arbitrary raw input in diagnostic messages. Field names in these examples come from the program's fixed schema, not from an attacker.

The record wrappers expect ordinary application data, not hostile proxies/getters. Rejecting a nonstring field prevents value conversion hooks, but reading that field can itself execute a getter. Parsing data is not a sandbox for JavaScript objects. Enforce request-size limits before deserializing large inputs.

## Why Separate Conversion From Business Logic?

Downstream code receives bounded Number and Boolean primitives and can compute without repeatedly interpreting strings. That gives every call site the same missing-value and invalid-value policy. A later request to accept whitespace or "yes" should change the boundary contract and its assertions, not introduce ad hoc conversions throughout the service.

See [Number.isSafeInteger](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isSafeInteger) for the representable integer boundary and [Boolean conversion](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean) for why truthiness is not boolean-text parsing.
