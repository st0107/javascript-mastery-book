'use strict';

// Run: node code/volume-2/chapter-01/example-03-closure-challenges.js
// Expected output:
// Lexical scope: passed
// Shared and independent state: passed
// Loop bindings and saved labels: passed
// Once-successful contracts: passed
// All closure challenge assertions passed.

const assert = require('node:assert/strict');

// Exercise 1: O(1) construction and read overhead per closure.
function createRegionReader(region) {
  return () => region;
}

function invokeFromAnotherRegion(reader) {
  const region = 'eu-west';
  return `${region} -> ${reader()}`;
}

const readPrimary = createRegionReader('ap-south');
const readSecondary = createRegionReader('us-east');
assert.equal(invokeFromAnotherRegion(readPrimary), 'eu-west -> ap-south');
assert.equal(readSecondary(), 'us-east');
assert.equal(readPrimary(), 'ap-south');
console.log('Lexical scope: passed');

// Exercise 2: O(1) time per operation and retained space per tracker.
// Contract: counts remain safe integers.
function createAttemptTracker() {
  let attempts = 0;

  return {
    increment() {
      attempts += 1;
      return attempts;
    },
    read() {
      return attempts;
    },
    reset() {
      attempts = 0;
    }
  };
}

const upload = createAttemptTracker();
const download = createAttemptTracker();
const incrementUpload = upload.increment;
const readUpload = upload.read;
const resetUpload = upload.reset;
assert.equal(readUpload(), 0);
assert.equal(incrementUpload(), 1);
assert.equal(upload.increment(), 2);
assert.equal(readUpload(), 2);
assert.equal(download.read(), 0);
resetUpload();
assert.equal(readUpload(), 0);
assert.equal(download.increment(), 1);
assert.equal(readUpload(), 0);
console.log('Shared and independent state: passed');

// Exercise 3: O(n) construction time and closure/binding storage for n labels;
// O(1) per read. Retained string payloads are additional data.
function buildLegacyReaders(labels) {
  const readers = [];
  // Deliberate legacy bug used for comparison, not recommended style.
  for (var index = 0; index < labels.length; index += 1) {
    readers.push(() => labels[index]);
  }
  return readers;
}

function buildLabelReaders(labels) {
  const readers = [];
  for (let index = 0; index < labels.length; index += 1) {
    const label = labels[index];
    readers.push(() => label);
  }
  return readers;
}

const labels = ['Queued', 'Running', 'Finished'];
const broken = buildLegacyReaders(labels);
const readers = buildLabelReaders(labels);
assert.deepEqual(broken.map(read => read()), [undefined, undefined, undefined]);
assert.deepEqual(readers.map(read => read()), labels);
labels[0] = 'Cancelled';
labels.push('Archived');
assert.deepEqual(readers.map(read => read()), ['Queued', 'Running', 'Finished']);
assert.deepEqual(buildLabelReaders([]), []);
assert.equal(buildLabelReaders(['Only'])[0](), 'Only');
console.log('Loop bindings and saved labels: passed');

// Exercise 4: synchronous, receiver-independent operation only.
// O(a) wrapper time and temporary rest-array space for a arguments, plus
// operation costs on an uncached attempt. O(1) retained bookkeeping plus
// the operation, its captured state, and the saved result's reachable data.
function onceSuccessful(operation) {
  if (typeof operation !== 'function') {
    throw new TypeError('operation must be a function.');
  }

  let state = 'ready';
  let result;

  return (...args) => {
    if (state === 'done') return result;
    if (state === 'running') {
      throw new Error('Initialization is already running.');
    }

    state = 'running';
    try {
      result = operation(...args);
      state = 'done';
      return result;
    } catch (error) {
      state = 'ready';
      throw error;
    }
  };
}

assert.throws(() => onceSuccessful(null), {
  name: 'TypeError',
  message: 'operation must be a function.'
});

let attempts = 0;
const temporaryFailure = new Error('Configuration unavailable.');
const initialize = onceSuccessful((region, revision) => {
  attempts += 1;
  if (attempts === 1) throw temporaryFailure;
  return { region, revision };
});

// Intentional failure is caught by assert.throws; identity must be preserved.
assert.throws(() => initialize('ap-south', 1), error => error === temporaryFailure);
assert.equal(attempts, 1);
const configuration = initialize('eu-west', 2);
assert.deepEqual(configuration, { region: 'eu-west', revision: 2 });
assert.strictEqual(initialize('us-east', 3), configuration);
assert.equal(attempts, 2);

// Object reuse is part of the contract, including observable later mutation.
configuration.revision = 7;
assert.equal(initialize().revision, 7);

for (const value of [undefined, null, false, 0, '']) {
  let calls = 0;
  const readOnce = onceSuccessful(() => {
    calls += 1;
    return value;
  });
  assert.strictEqual(readOnce(), value);
  assert.strictEqual(readOnce(), value);
  assert.equal(calls, 1);
}

let shouldThrow = true;
const thrownRecord = { reason: 'not ready' };
const readAfterFailure = onceSuccessful(() => {
  if (shouldThrow) throw thrownRecord;
  return 'ready';
});
assert.throws(() => readAfterFailure(), error => error === thrownRecord);
shouldThrow = false;
assert.equal(readAfterFailure(), 'ready');

let recurse = true;
let recursiveAttempts = 0;
let nested;
nested = onceSuccessful(() => {
  recursiveAttempts += 1;
  if (recurse) return nested();
  return 'recovered';
});
assert.throws(() => nested(), {
  name: 'Error',
  message: 'Initialization is already running.'
});
assert.equal(recursiveAttempts, 1);
recurse = false;
assert.equal(nested(), 'recovered');
assert.equal(nested(), 'recovered');
assert.equal(recursiveAttempts, 2);

// A handled recursive-call error does not prevent the outer normal return.
let handleNested;
handleNested = onceSuccessful(() => {
  assert.throws(() => handleNested(), /Initialization is already running\./);
  return 'outer success';
});
assert.equal(handleNested(), 'outer success');
assert.equal(handleNested(), 'outer success');

let independentCalls = 0;
const makeToken = () => ({ id: ++independentCalls });
const tokenA = onceSuccessful(makeToken);
const tokenB = onceSuccessful(makeToken);
assert.equal(tokenA().id, 1);
assert.equal(tokenB().id, 2);
assert.notStrictEqual(tokenA(), tokenB());
assert.equal(independentCalls, 2);
console.log('Once-successful contracts: passed');
console.log('All closure challenge assertions passed.');
