# Control Flow: Production Examples

## Validated Synchronous Job Batch

**Input contract:** an array of at most 10,000 ordinary data records. A valid job has its own nonempty string `id` of at most 128 code units with no surrounding whitespace, its own boolean `cancelled`, and its own `priority` equal to `'normal'` or `'fatal'`. Missing or malformed records are skipped. Duplicate IDs represent separate occurrences.

**Policy:** skip invalid entries first. A valid fatal marker stops the batch, including when it is also cancelled. Otherwise skip a cancelled job and append a fresh processed record for a normal job. Do not mutate the input. The helper accepts ordinary data objects from a trusted decoding layer, not hostile getters or proxies.

The example records which jobs would be processed. It does not execute callbacks, retry work, persist results, or monitor an asynchronous shutdown signal.

```js
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

const jobs = [
  { id: 'a', cancelled: false, priority: 'normal' },
  null,
  {},
  { id: 'b', cancelled: true, priority: 'normal' },
  { id: 'stop', cancelled: true, priority: 'fatal' },
  { id: 'after', cancelled: false, priority: 'normal' }
];
console.log(JSON.stringify(processJobs(jobs)));
console.log(JSON.stringify(processJobs([null, {}])));
console.log(jobs[0].id);
// Expected output:
// [{"id":"a","status":"processed"}]
// []
// a
```

The companion `code/volume-1/chapter-06/example-01-job-runner.js` asserts malformed entries, inherited fields, invalid fatal-like records, fatal/cancel precedence, empty input, duplicate IDs, batch limits, and output ownership.

### Why This Order Is Deliberate

Accessing a field before shape validation caused the original null-record failure. Treating an absent ID as valid produced undefined results. Here a single validity expression short-circuits before unsafe field reads and a guard skips records that fail.

Fatal precedes cancellation because the batch policy says a valid stop marker must be observed. The inverse order would allow a cancelled fatal marker to be ignored. Write a test containing both flags; separate fatal and cancelled tests cannot detect that precedence bug.

The traversal is O(n) in batch length and O(k) output space for k accepted jobs before the stop marker. No callback mutates the list during traversal under this contract.

## Order State Dispatcher

**Contract:** state has own boolean `paid` and `shipped` fields, with shipped implying paid. An event has its own string `type`. `PAID` marks payment; `SHIPPED` requires payment. Repeating a valid event is allowed and returns an equivalent fresh state. Unknown events and invalid transitions throw.

Return only the two modeled state fields. Extra input metadata is outside this state projection. The function selects a next state; persistence and concurrent update control belong to its caller.

```js
function reduceOrderState(state, event) {
  if (state === null || typeof state !== 'object' || Array.isArray(state) ||
      !Object.hasOwn(state, 'paid') || typeof state.paid !== 'boolean' ||
      !Object.hasOwn(state, 'shipped') || typeof state.shipped !== 'boolean') {
    throw new TypeError('Expected paid and shipped booleans.');
  }
  if (state.shipped && !state.paid) throw new RangeError('Shipped requires paid.');
  if (event === null || typeof event !== 'object' || Array.isArray(event) ||
      !Object.hasOwn(event, 'type') || typeof event.type !== 'string') {
    throw new TypeError('Expected an event type.');
  }
  switch (event.type) {
    case 'PAID':
      return { paid: true, shipped: state.shipped };
    case 'SHIPPED':
      if (!state.paid) throw new RangeError('Pay before shipping.');
      return { paid: true, shipped: true };
    default:
      throw new RangeError('Unsupported event type.');
  }
}

const initial = { paid: false, shipped: false };
const paid = reduceOrderState(initial, { type: 'PAID' });
const shipped = reduceOrderState(paid, { type: 'SHIPPED' });
console.log(JSON.stringify(initial));
console.log(JSON.stringify(shipped));
try {
  reduceOrderState(initial, { type: 'SHIPPED' });
} catch (error) {
  console.log(error.name);
}
// Expected output:
// {"paid":false,"shipped":false}
// {"paid":true,"shipped":true}
// RangeError
```

Returning from each case prevents fallthrough. A default branch makes unsupported events explicit instead of silently leaving state unchanged. The companion `code/volume-1/chapter-06/example-02-switch-dispatch.js` verifies that both input state and event remain unchanged.

This dispatcher has a fixed number of branches and returns a fixed-size object: O(1) work and storage. A larger state model may need a transition table and separate validation, but that is a design decision rather than an automatic switch optimization.

## What These Examples Establish

Both examples make branch order reviewable, validate before field-dependent decisions, and define whether invalid input is skipped or rejected. A real worker adds operational behavior only with separate contracts and tests for side effects, retry limits, idempotency, and shutdown. Those features cannot be inferred from a loop alone.
