'use strict';

const assert = require('node:assert/strict');
const allowedKeys = new Set(['format', 'limit', 'includeArchived']);

function parseExportOptions(jsonText) {
  if (typeof jsonText !== 'string' || jsonText.length > 4096) {
    throw new TypeError('options must be JSON text of at most 4096 code units');
  }
  const input = JSON.parse(jsonText);
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('options must describe an object');
  }
  for (const key of Object.keys(input)) {
    if (!allowedKeys.has(key)) throw new TypeError(`unknown option: ${key}`);
  }

  const format = Object.hasOwn(input, 'format') ? input.format : 'json';
  const limit = Object.hasOwn(input, 'limit') ? input.limit : 100;
  const includeArchived = Object.hasOwn(input, 'includeArchived') ? input.includeArchived : false;
  if (format !== 'json' && format !== 'csv') throw new TypeError('format must be json or csv');
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 500) {
    throw new TypeError('limit must be an integer from 1 through 500');
  }
  if (typeof includeArchived !== 'boolean') {
    throw new TypeError('includeArchived must be a boolean');
  }

  const options = Object.create(null);
  options.format = format;
  options.limit = limit;
  options.includeArchived = includeArchived;
  return Object.freeze(options);
}

function runDemo() {
  const options = parseExportOptions('{"format":"csv","limit":25}');
  assert.equal(Object.getPrototypeOf(options), null);
  assert.equal(Object.isFrozen(options), true);
  assert.deepEqual(Object.keys(options), ['format', 'limit', 'includeArchived']);
  assert.equal(options.format, 'csv');
  assert.equal(options.limit, 25);
  assert.equal(options.includeArchived, false);
  assert.equal(Object.hasOwn(options, 'format'), true);
  assert.equal('constructor' in options, false);
  assert.equal('toString' in options, false);
  assert.equal(options.hasOwnProperty, undefined);
  assert.throws(() => { options.limit = 999; }, TypeError);

  const defaults = parseExportOptions('{}');
  assert.equal(defaults.format, 'json');
  assert.equal(defaults.limit, 100);
  assert.equal(defaults.includeArchived, false);
  assert.notEqual(defaults, parseExportOptions('{}'));
  assert.equal(parseExportOptions('{"includeArchived":true}').includeArchived, true);

  // These are fixed strings. Parsing creates data; it does not merge any key.
  for (const invalid of [
    '{"__proto__":{"polluted":true}}',
    '{"constructor":{"prototype":{"polluted":true}}}',
    '{"toString":"surprise"}', '{"hasOwnProperty":false}',
    '{"limit":0}', '{"limit":501}', '{"limit":1.5}', '{"limit":"25"}',
    '{"limit":null}', '{"format":null}', '{"format":"xml"}',
    '{"includeArchived":"false"}', '{"includeArchived":{}}',
    'null', '[]', 'true', '17', '"options"'
  ]) {
    assert.throws(() => parseExportOptions(invalid), TypeError);
  }
  assert.throws(() => parseExportOptions('{'), SyntaxError);
  assert.throws(() => parseExportOptions({ format: 'csv' }), TypeError);
  assert.throws(() => parseExportOptions(' '.repeat(4097)), TypeError);
  // Ordinary JSON.parse uses the last occurrence of a duplicate key.
  assert.equal(parseExportOptions('{"limit":10,"limit":20}').limit, 20);

  console.log(JSON.stringify(options));
  console.log(`null prototype ${Object.getPrototypeOf(options) === null}`);
  console.log('safe options assertions passed');
}

if (require.main === module) runDemo();
module.exports = { parseExportOptions };

// Expected output:
// {"format":"csv","limit":25,"includeArchived":false}
// null prototype true
// safe options assertions passed

// O(n) parsing and O(k) key validation for n text code units and k own keys;
// input length is bounded. Parsed input requires O(n) storage; result has 3 fields.
