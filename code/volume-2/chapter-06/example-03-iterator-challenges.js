'use strict';

// Assertion companion for the six independent Chapter 6 exercise solutions.

// Exercise 1
{
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
}

// Exercise 2
{
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
}

// Exercise 3
{
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
}

// Exercise 4
{
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
}

// Exercise 5
{
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
}

// Exercise 6
{
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
}

console.log('Iterator challenge assertions passed.');
// Expected output (in addition to the six solution outputs above):
// Iterator challenge assertions passed.
