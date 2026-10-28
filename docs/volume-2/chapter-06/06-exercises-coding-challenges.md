# Exercises and Coding Challenges

These six exercises test state, demand, ownership, completion, and two-way communication. Specify when validation runs and who closes a partially consumed source before implementing a helper. Sources and callbacks below are trusted synchronous application code; an iterable is executable behavior, not passive data.

Every JavaScript block runs independently on Node.js 20 or later. The combined assertion companion is `code/volume-2/chapter-06/example-03-iterator-challenges.js`. Attempt each requirement before reading its solution.

## Exercise 1: Build a Repeatable Integer Range

**Requirements:** Implement `createRange(start, end)` for the half-open interval from `start` through `end - 1`. Both endpoints must be integers between -1,000,000 and 1,000,000, with `start <= end` and at most 10,000 values. Validate immediately when the factory is called. Every iteration must have independent progress. Empty ranges are valid.

**Example:** A range created with `(2, 5)` yields `2, 3, 4` on each traversal. Advancing one iterator must not advance another.

**Hint:** Put validation in an ordinary factory and the generator method on the returned iterable. Returning one generator object would expose one shared traversal.

**Solution:**

```js
'use strict';
const assert = require('node:assert/strict');

function createRange(start, end) {
  if (![start, end].every(value => Number.isInteger(value) && Math.abs(value) <= 1000000) ||
      start > end || end - start > 10000) {
    throw new RangeError('Expected ordered bounded integer endpoints');
  }
  return Object.freeze({
    *[Symbol.iterator]() {
      for (let value = start; value < end; value += 1) yield value;
    }
  });
}

assert.throws(() => createRange(0, 10001), RangeError);
assert.throws(() => createRange('2', 5), RangeError);
assert.throws(() => createRange(5, 2), RangeError);
assert.throws(() => createRange(0, Infinity), RangeError);
assert.deepEqual([...createRange(3, 3)], []);
assert.equal([...createRange(-5000, 5000)].length, 10000);
const range = createRange(2, 5);
const first = range[Symbol.iterator]();
const second = range[Symbol.iterator]();
assert.notEqual(first, second);
assert.equal(first.next().value, 2);
assert.equal(second.next().value, 2);
console.log([...first].join(','));
console.log([...range].join(','));
console.log(first.next().done);
// Expected output:
// 3,4
// 2,3,4
// true
```

**Complexity:** Factory validation and iterator creation use constant time and space. Producing `n` values takes `O(n)` time and constant iterator bookkeeping; collecting those values adds `O(n)` storage. The frozen wrapper protects its method property, while each generator still owns mutable progress.

## Exercise 2: Map Only When Asked

**Requirements:** Implement `lazyMap(source, mapper)` as a one-shot iterator. Reject a non-function mapper immediately. On each requested value, call the trusted synchronous mapper with `(value, zeroBasedIndex)`. Do not acquire or advance the source until the returned generator starts. A mapper exception or consumer early exit must close an active source when the source supports normal iterator closing.

**Example:** Reading only the first value from a source containing `4, 7, 9` calls the mapper once with `(4, 0)`. Closing the mapped iterator then closes that source without pulling `7`.

**Hint:** Place `yield mapper(...)` inside a `for...of` loop. The wrapper's suspended loop participates in closing when the generator receives `return()`.

**Solution:**

```js
'use strict';
const assert = require('node:assert/strict');

function lazyMap(source, mapper) {
  if (typeof mapper !== 'function') throw new TypeError('Expected a mapper');
  return (function* () {
    let index = 0;
    for (const value of source) {
      if (index >= Number.MAX_SAFE_INTEGER) throw new RangeError('Index limit reached');
      yield mapper(value, index++);
    }
  })();
}

let pulls = 0;
let closed = 0;
function* readings() {
  try {
    for (const value of [4, 7, 9]) {
      pulls += 1;
      yield value;
    }
  } finally {
    closed += 1;
  }
}
assert.throws(() => lazyMap(readings(), null), TypeError);
const mapped = lazyMap(readings(), (value, index) => `${index}:${value * 2}`);
console.log('before', pulls, closed);
console.log(mapped.next().value);
assert.equal(mapped.return().done, true);
console.log('after', pulls, closed);
assert.deepEqual([...mapped], []);
const failure = new Error('mapper failed');
const failing = lazyMap(readings(), () => { throw failure; });
assert.throws(() => failing.next(), error => error === failure);
assert.equal(pulls, 2);
assert.equal(closed, 2);
assert.deepEqual([...lazyMap([3, 5], (value, index) => value + index)], [3, 6]);
// Expected output:
// before 0 0
// 0:8
// after 1 1
```

**Complexity:** For `k` consumed values, bookkeeping takes `O(k)` time and constant additional live state, plus source and mapper costs. Mapper results are not copied. The source and mapper remain reachable while the wrapper needs them. The function-valued check is a basic input check, not proof of purity or ordinary callability; the contract excludes class constructors as mappers.

This wrapper does not promise to call a custom source's `return()` after that source's own `next()` throws. Such a producer must manage its failed acquisition or pull operation. The [managed cursor example](04-production-examples.md) addresses that separate ownership boundary.

## Exercise 3: Limit Consumption Without an Extra Pull

**Requirements:** Implement `take(source, limit)` with eager validation of an integer limit from zero through 10,000. A zero limit must not acquire the source iterator. Full consumption must request at most `limit` source values, without fetching a discarded extra value. A consumer that breaks early must close an active source through normal iterator closing.

**Example:** Collecting `take(source, 2)` from a source beginning `0, 1, 2` yields `0, 1` and performs only two successful pulls.

**Hint:** Test the remaining quota after resuming from a yield, before the loop asks for another source value. A guard inside the next loop body has already pulled that next value.

**Solution:**

```js
'use strict';
const assert = require('node:assert/strict');

function take(source, limit) {
  if (!Number.isInteger(limit) || limit < 0 || limit > 10000) {
    throw new RangeError('Expected a limit from zero through 10000');
  }
  return (function* () {
    if (limit === 0) return;
    let remaining = limit;
    for (const value of source) {
      yield value;
      remaining -= 1;
      if (remaining === 0) return;
    }
  })();
}

let acquired = 0;
let pulls = 0;
let closed = 0;
const source = {
  [Symbol.iterator]() {
    acquired += 1;
    return (function* () {
      try {
        for (let value = 0; value < 10; value += 1) {
          pulls += 1;
          yield value;
        }
      } finally {
        closed += 1;
      }
    })();
  }
};
assert.throws(() => take(source, 1.5), RangeError);
assert.throws(() => take(source, -1), RangeError);
assert.deepEqual([...take(source, 0)], []);
console.log(acquired, pulls);
console.log([...take(source, 2)].join(','));
console.log(acquired, pulls, closed);
for (const value of take(source, 4)) {
  assert.equal(value, 0);
  break;
}
assert.equal(pulls, 3);
assert.equal(closed, 2);
assert.deepEqual([...take([8], 3)], [8]);
// Expected output:
// 0 0
// 0,1
// 1 2 1
```

**Complexity:** The wrapper adds constant state and work per yielded value. Full consumption uses `O(min(n, limit))` successful pulls for a finite source of `n` values, plus any final completion probe when the source ends first. The source may do substantial work in each pull.

After the last permitted value is yielded, this generator is still suspended. The consumer must resume it to observe completion or call `return()` to close it. Array spread does resume it, and `for...of` closing handles a break; abandoning a manually driven iterator does neither. As with Exercise 2, producer pull failures require the producer's own resource policy.

## Exercise 4: Snapshot Labels, Then Enumerate Them

**Requirements:** Implement `createLabelSequence(records)` for a trusted dense array of at most 10,000 ordinary records with string data fields named `label`. Each label must contain 1 through 64 UTF-16 code units. Validate and snapshot the primitive label values immediately. Repeated traversals must yield fresh `[index, label]` arrays. Later record mutations and edits to previously yielded pairs must not alter subsequent traversals.

**Example:** Snapshot labels `alpha, beta`, then rename the first source record and append `gamma`. The snapshot still yields `0:alpha, 1:beta`.

**Hint:** A generator created before a mutation does not automatically snapshot its input. Copy the required primitive values in an ordinary factory before returning the iterable.

**Solution:**

```js
'use strict';
const assert = require('node:assert/strict');

function createLabelSequence(records) {
  if (!Array.isArray(records) || records.length > 10000) {
    throw new TypeError('Expected a bounded array of records');
  }
  const labels = [];
  for (let index = 0; index < records.length; index += 1) {
    const record = records[index];
    if (!Object.hasOwn(records, index) || record === null || typeof record !== 'object' ||
        typeof record.label !== 'string' || record.label.length < 1 || record.label.length > 64) {
      throw new TypeError('Expected a dense array of labeled records');
    }
    labels.push(record.label);
  }
  return Object.freeze({
    *[Symbol.iterator]() {
      for (let index = 0; index < labels.length; index += 1) yield [index, labels[index]];
    }
  });
}

const records = [{ label: 'alpha' }, { label: 'beta' }];
const snapshot = createLabelSequence(records);
function* liveLabels() {
  for (const record of records) yield record.label;
}
const live = liveLabels();
records[0].label = 'renamed';
records.push({ label: 'gamma' });
const entries = [...snapshot];
console.log(entries.map(([index, label]) => `${index}:${label}`).join(','));
console.log([...live].join(','));
entries[0][1] = 'edited pair';
const again = [...snapshot];
assert.equal(again[0][1], 'alpha');
assert.notEqual(again[0], entries[0]);
assert.deepEqual([...createLabelSequence([])], []);
assert.throws(() => createLabelSequence([{ label: '' }]), TypeError);
assert.throws(() => createLabelSequence(Array(1)), TypeError);
console.log(again[0][1]);
// Expected output:
// 0:alpha,1:beta
// renamed,beta,gamma
// alpha
```

**Complexity:** Construction takes `O(n)` time and retains `O(n)` bounded string values. Each traversal creates `n` small pairs over `O(n)` time. The returned iterator reads only the copied strings and never consults the source records again. This is a schema-specific primitive snapshot, not a deep-clone utility. Accessors and proxies fall outside the trusted data-record contract; the checks are not a detector for either.

## Exercise 5: Preserve a Delegate's Completion Result

**Requirements:** Implement a child generator that yields each step ID and returns its emitted count on normal completion. An outer generator must delegate with `yield*`, then yield a summary string and return the same count. Use trusted finite ID arrays. Record child cleanup once on completion or early closing, and prove that the summary is skipped when the outer generator is closed early.

**Example:** IDs `A, B` produce three yielded values: `A`, `B`, and `completed:2`. A fourth `next()` returns the terminal count `2` with `done: true`.

**Hint:** `yield*` is an expression whose normal completion value is the delegate's final result value. A loop that only visits yielded values does not capture that terminal result.

**Solution:**

```js
'use strict';
const assert = require('node:assert/strict');

function* stepIds(ids, events) {
  let count = 0;
  try {
    for (const id of ids) {
      yield id;
      count += 1;
    }
    return count;
  } finally {
    events.push('child closed');
  }
}

function* reportSteps(ids, events) {
  const count = yield* stepIds(ids, events);
  yield `completed:${count}`;
  return count;
}

const events = [];
const report = reportSteps(['A', 'B'], events);
for (let index = 0; index < 4; index += 1) {
  const result = report.next();
  console.log(result.value, result.done);
}
assert.deepEqual(events, ['child closed']);
assert.deepEqual([...reportSteps(['A', 'B'], [])], ['A', 'B', 'completed:2']);
const earlyEvents = [];
const early = reportSteps(['A', 'B'], earlyEvents);
assert.equal(early.next().value, 'A');
assert.deepEqual(early.return('cancelled'), { value: 'cancelled', done: true });
assert.deepEqual(earlyEvents, ['child closed']);
assert.deepEqual([...early], []);
const errorEvents = [];
const failed = reportSteps(['A'], errorEvents);
failed.next();
const failure = new Error('cancel by error');
assert.throws(() => failed.throw(failure), error => error === failure);
assert.deepEqual(errorEvents, ['child closed']);
// Expected output:
// A false
// B false
// completed:2 false
// 2 true
```

**Complexity:** For `n` IDs, normal traversal takes `O(n)` time and constant generator bookkeeping, excluding the input array and consumer storage. The final count is available to a manual driver, but spread collects only results with false `done`. The child increments after each yield resumes; an interrupted traversal does not claim to have normally completed the report.

## Exercise 6: Drive a Running Total in Both Directions

**Requirements:** Implement `createTotal(initial, events)` with eager validation of an integer initial value between -1,000,000 and 1,000,000. The first `next()` yields that value. Each later `next(delta)` must accept a safe integer whose addition stays in that same total range, then yield the updated total. Injecting a `ResetTotal` error at a suspended yield resets to the initial value; other errors and invalid deltas terminate the generator. Explicit `return(value)` must complete with that value. Record cleanup once after an entered generator terminates, without yielding during cleanup.

**Example:** Starting at `10`, sending `5`, resetting, and sending `-3` yields `10, 15, 10, 7`. The first `next(999)` still yields `10` because there is no suspended yield to receive `999`.

**Hint:** Catch the reset command around the suspended `yield` itself. Keep ordinary delta validation outside that catch so an invalid delta is a failure rather than an accidental reset.

**Solution:**

```js
'use strict';
const assert = require('node:assert/strict');

class ResetTotal extends Error {}

function createTotal(initial, events) {
  if (!Number.isInteger(initial) || Math.abs(initial) > 1000000) {
    throw new RangeError('Invalid initial total');
  }
  return (function* () {
    let total = initial;
    try {
      while (true) {
        let delta;
        try {
          delta = yield total;
        } catch (error) {
          if (!(error instanceof ResetTotal)) throw error;
          total = initial;
          continue;
        }
        if (!Number.isSafeInteger(delta)) throw new RangeError('Invalid total update');
        const next = total + delta;
        if (!Number.isSafeInteger(next) || Math.abs(next) > 1000000) {
          throw new RangeError('Invalid total update');
        }
        total = next;
      }
    } finally {
      events.push('closed');
    }
  })();
}

const events = [];
const total = createTotal(10, events);
const values = [total.next(999).value, total.next(5).value,
  total.throw(new ResetTotal()).value, total.next(-3).value];
console.log(values.join(' '));
const completion = total.return('stop');
console.log(completion.value, completion.done);
console.log(events.join(','));
assert.equal(total.next().done, true);
assert.deepEqual(events, ['closed']);
assert.throws(() => createTotal(Infinity, []), RangeError);
const invalidEvents = [];
const invalid = createTotal(1000000, invalidEvents);
invalid.next();
assert.throws(() => invalid.next(1), RangeError);
assert.deepEqual(invalidEvents, ['closed']);
assert.equal(invalid.next().done, true);
const failure = new Error('stop now');
const other = createTotal(0, []);
other.next();
assert.throws(() => other.throw(failure), error => error === failure);
let conversions = 0;
const coercible = { valueOf() { conversions += 1; return 1; } };
for (const delta of [coercible, '1', 1n, Symbol('delta'), undefined]) {
  const rejected = createTotal(0, []);
  rejected.next();
  assert.throws(() => rejected.next(delta), RangeError);
  assert.equal(rejected.next().done, true);
}
assert.equal(conversions, 0);
const unusedEvents = [];
const unused = createTotal(0, unusedEvents);
unused.return();
assert.deepEqual(unusedEvents, []);
// Expected output:
// 10 15 10 7
// stop true
// closed
```

**Complexity:** Each update or reset takes constant work and state, excluding the caller's event storage. The event array is a trusted ordinary array; cleanup appends one marker. This generator is a command protocol, so a normal `for...of` loop cannot supply its required deltas. The plain factory validates the initial argument eagerly, while updates are validated when sent.

Closing a generator before its body starts does not enter its `finally`. See the [yield reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/yield) for value exchange and the [generator return reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator/return) for completion behavior. Compare these solutions with the [production ownership contracts](04-production-examples.md) before adding external resources.
