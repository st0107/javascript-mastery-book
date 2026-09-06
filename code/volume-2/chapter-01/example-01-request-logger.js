'use strict';

const assert = require('node:assert/strict');

function createRequestLogger(metadata, sink) {
  if (metadata === null || typeof metadata !== 'object' || Array.isArray(metadata)) {
    throw new TypeError('metadata must be an object');
  }
  if (typeof sink !== 'function') throw new TypeError('sink must be a function');

  // Copy selected primitives once; never read the request object from log().
  const { requestId, method, route } = metadata;
  if (typeof requestId !== 'string' || requestId.length === 0 || requestId.length > 64 ||
      /[^A-Za-z0-9_-]/.test(requestId)) {
    throw new TypeError('requestId must contain 1-64 identifier characters');
  }
  if (typeof method !== 'string' || method.length === 0 || method.length > 16 ||
      /[^A-Z]/.test(method)) {
    throw new TypeError('method must contain 1-16 uppercase letters');
  }
  if (typeof route !== 'string' || route.length === 0 || route.length > 200 ||
      /[\u0000-\u001f\u007f\u0085\u2028\u2029]/.test(route)) {
    throw new TypeError('route must be a nonempty, bounded, single-line template');
  }

  return function log(event) {
    if (typeof event !== 'string' || event.length === 0 || event.length > 64 ||
        !/^[a-z]/.test(event) || /[^a-z0-9_.-]/.test(event)) {
      throw new TypeError('event must be a bounded lowercase identifier');
    }
    return sink(Object.freeze({ requestId, method, route, event }));
  };
}

function runDemo() {
  const records = [];
  const sink = record => records.push(record);
  const metadata = {
    requestId: 'req-a', method: 'POST', route: '/orders',
    authorization: 'must-never-be-copied'
  };
  const logA = createRequestLogger(metadata, sink);
  const logB = createRequestLogger(
    { requestId: 'req-b', method: 'GET', route: '/orders/:id' }, sink
  );

  metadata.requestId = 'mutated';
  metadata.route = '/changed';
  assert.equal(logA('started'), 1); // The injected sink's result is forwarded.
  logB('started');
  logA('completed');

  assert.deepEqual(records, [
    { requestId: 'req-a', method: 'POST', route: '/orders', event: 'started' },
    { requestId: 'req-b', method: 'GET', route: '/orders/:id', event: 'started' },
    { requestId: 'req-a', method: 'POST', route: '/orders', event: 'completed' }
  ]);
  assert.ok(records.every(Object.isFrozen));
  assert.throws(() => { records[0].requestId = 'overwrite'; }, TypeError);
  assert.throws(() => logA('contains\nnewline'), TypeError);
  assert.throws(() => logA('started\n'), TypeError);
  assert.throws(() => logA('a'.repeat(65)), TypeError);
  assert.equal(records.length, 3); // Invalid events never reach the sink.
  assert.throws(() => createRequestLogger(null, sink), TypeError);
  assert.throws(() => createRequestLogger(metadata, null), TypeError);
  for (const invalid of [
    { requestId: '' }, { requestId: 'a'.repeat(65) }, { requestId: 'req-a\n' },
    { method: 'get' }, { method: 'GET\n' },
    { route: 'bad\nroute' }, { route: 'bad\u2028route' },
    { route: 'x'.repeat(201) }
  ]) {
    assert.throws(() => createRequestLogger({ ...metadata, ...invalid }, sink), TypeError);
  }

  const failure = new Error('sink unavailable');
  const failingLog = createRequestLogger(metadata, () => { throw failure; });
  assert.throws(() => failingLog('started'), error => error === failure);

  for (const record of records) {
    console.log(`${record.requestId} ${record.method} ${record.route} ${record.event}`);
  }
  console.log('request logger assertions passed');
}

if (require.main === module) runDemo();
module.exports = { createRequestLogger };

// Expected output:
// req-a POST /orders started
// req-b GET /orders/:id started
// req-a POST /orders completed
// request logger assertions passed
// Factory: O(m) validation for m metadata characters (bounded by the contract).
// Each call: O(e) validation for e event characters (at most 64), O(1) record
// construction, plus sink work. Each logger holds O(m) selected metadata.
// This demo's sink intentionally retains O(n) records for n log calls.
