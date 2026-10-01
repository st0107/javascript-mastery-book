'use strict';

const assert = require('node:assert/strict');

function withResource(acquire, use, release) {
  if (typeof acquire !== 'function' || typeof use !== 'function' || typeof release !== 'function') {
    throw new TypeError('Expected synchronous callbacks.');
  }
  const resource = acquire();
  let operationFailed = false;
  let operationError;
  try {
    return use(resource);
  } catch (error) {
    operationFailed = true;
    operationError = error;
    throw error;
  } finally {
    try {
      release(resource);
    } catch (cleanupError) {
      if (operationFailed) {
        throw new AggregateError(
          [operationError, cleanupError],
          'Operation and cleanup failed.',
          { cause: operationError }
        );
      }
      throw cleanupError;
    }
  }
}

// A separate flag distinguishes returning undefined from throwing undefined.
function capture(operation) {
  try { return { failed: false, value: operation() }; }
  catch (value) { return { failed: true, value }; }
}

for (let invalidIndex = 0; invalidIndex < 3; invalidIndex++) {
  const events = [];
  const callbacks = [
    () => { events.push('acquire'); return {}; },
    () => { events.push('use'); },
    () => { events.push('release'); }
  ];
  callbacks[invalidIndex] = null;
  assert.throws(() => withResource(...callbacks), TypeError);
  assert.deepEqual(events, []);
}

const failures = [new Error('Failure.'), { code: 'CUSTOM' }, undefined, null, false, 0, '', NaN];
for (const failure of failures) {
  const events = [];
  const outcome = capture(() => withResource(
    () => { events.push('acquire'); throw failure; },
    () => { events.push('use'); },
    () => { events.push('release'); }
  ));
  assert.equal(outcome.failed, true);
  assert.equal(outcome.value, failure);
  assert.deepEqual(events, ['acquire']);
}

for (const resource of [{ id: 'buffer-1' }, undefined, null, 0]) {
  const events = [];
  const result = { accepted: true };
  const outcome = withResource(
    () => { events.push('acquire'); return resource; },
    received => { assert.equal(received, resource); events.push('use'); return result; },
    received => { assert.equal(received, resource); events.push('release'); return 'ignored'; }
  );
  assert.equal(outcome, result);
  assert.deepEqual(events, ['acquire', 'use', 'release']);
}

// Exercise all operation/release outcomes for every pairing of thrown values.
for (const operationError of failures) {
  for (const cleanupError of failures) {
    for (const operationFailed of [false, true]) {
      for (const cleanupFailed of [false, true]) {
        const resource = {};
        const events = [];
        const result = { value: 42 };
        const outcome = capture(() => withResource(
          () => { events.push('acquire'); return resource; },
          received => {
            assert.equal(received, resource);
            events.push('use');
            if (operationFailed) throw operationError;
            return result;
          },
          received => {
            assert.equal(received, resource);
            events.push('release');
            if (cleanupFailed) throw cleanupError;
          }
        ));
        assert.deepEqual(events, ['acquire', 'use', 'release']);
        assert.equal(outcome.failed, operationFailed || cleanupFailed);
        if (operationFailed && cleanupFailed) {
          assert.ok(outcome.value instanceof AggregateError);
          assert.equal(outcome.value.message, 'Operation and cleanup failed.');
          assert.equal(outcome.value.errors.length, 2);
          assert.equal(outcome.value.errors[0], operationError);
          assert.equal(outcome.value.errors[1], cleanupError);
          assert.equal(Object.hasOwn(outcome.value, 'cause'), true);
          assert.equal(outcome.value.cause, operationError);
        } else if (operationFailed) {
          assert.equal(outcome.value, operationError);
        } else if (cleanupFailed) {
          assert.equal(outcome.value, cleanupError);
        } else {
          assert.equal(outcome.value, result);
        }
      }
    }
  }
}
assert.deepEqual(capture(() => withResource(() => null, () => undefined, () => {})),
  { failed: false, value: undefined });

console.log('Acquisition, cleanup, identity, and failure-matrix assertions passed.');
// Expected output:
// Acquisition, cleanup, identity, and failure-matrix assertions passed.

// Helper overhead is O(1), excluding synchronous callback work and diagnostics.
