'use strict';

const assert = require('node:assert/strict');

function processJobs(jobs) {
  if (!Array.isArray(jobs)) throw new TypeError('Expected an array.');
  if (jobs.length > 10000) throw new RangeError('Batch limit is 10,000.');
  const processed = [];
  for (const job of jobs) {
    const valid = job !== null && typeof job === 'object' && !Array.isArray(job) &&
      Object.hasOwn(job, 'id') && typeof job.id === 'string' &&
      job.id.length > 0 && job.id.length <= 128 && job.id.trim() === job.id &&
      Object.hasOwn(job, 'cancelled') && typeof job.cancelled === 'boolean' &&
      Object.hasOwn(job, 'priority') && (job.priority === 'normal' || job.priority === 'fatal');
    if (!valid) continue;
    if (job.priority === 'fatal') break;
    if (job.cancelled) continue;
    processed.push({ id: job.id, status: 'processed' });
  }
  return processed;
}

const normal = id => ({ id, cancelled: false, priority: 'normal' });
const input = [
  normal('a'), null, {}, [],
  { id: 'b', cancelled: true, priority: 'normal' },
  { id: 'stop', cancelled: true, priority: 'fatal' },
  normal('after')
];
const snapshot = JSON.stringify(input);
assert.deepEqual(processJobs(input), [{ id: 'a', status: 'processed' }]);
assert.equal(JSON.stringify(input), snapshot);
assert.deepEqual(processJobs([]), []);
assert.deepEqual(processJobs([null, {}, { id: 'x' }]), []);
assert.deepEqual(processJobs([{ priority: 'fatal' }, normal('a')]), [{ id: 'a', status: 'processed' }]);
assert.deepEqual(processJobs([Object.create(normal('inherited'))]), []);
for (const job of [
  { id: '', cancelled: false, priority: 'normal' },
  { id: ' a', cancelled: false, priority: 'normal' },
  { id: 'x'.repeat(129), cancelled: false, priority: 'normal' },
  { id: 1, cancelled: false, priority: 'normal' },
  { id: 'a', cancelled: 'false', priority: 'normal' },
  { id: 'a', cancelled: false, priority: 'urgent' }
]) assert.deepEqual(processJobs([job]), []);
assert.equal(processJobs([normal('x'.repeat(128))]).length, 1);
assert.equal(processJobs([normal('a'), normal('a')]).length, 2);
const output = processJobs([input[0]]);
output[0].id = 'changed';
assert.equal(input[0].id, 'a');
assert.deepEqual(processJobs(Array(10000).fill(null)), []);
assert.throws(() => processJobs(Array(10001).fill(null)), RangeError);
assert.throws(() => processJobs(null), TypeError);
console.log(JSON.stringify(processJobs(input)));
console.log('Job validation, precedence, limits, and ownership passed.');
// Expected output:
// [{"id":"a","status":"processed"}]
// Job validation, precedence, limits, and ownership passed.

// Time: O(n) visited entries. Space: O(k) fresh output records.
