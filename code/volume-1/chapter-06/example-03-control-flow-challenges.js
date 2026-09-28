'use strict';

const assert = require('node:assert/strict');

function stockState(count, threshold) {
  if (!Number.isSafeInteger(count) || count < 0 ||
      !Number.isSafeInteger(threshold) || threshold <= 0) {
    throw new RangeError('Invalid inventory arguments.');
  }
  if (count === 0) return 'sold-out';
  if (count < threshold) return 'low';
  return 'available';
}

function sumUntilStop(values) {
  if (!Array.isArray(values)) throw new TypeError('Expected an array.');
  let total = 0;
  for (const value of values) {
    if (value === null) break;
    if (!Number.isSafeInteger(value) || value < 0) continue;
    const next = total + value;
    if (!Number.isSafeInteger(next)) throw new RangeError('Total overflow.');
    total = next;
  }
  return total;
}

function countStates(states) {
  if (!Array.isArray(states)) throw new TypeError('Expected an array.');
  const counts = { queued: 0, running: 0, done: 0 };
  for (const state of states) {
    switch (state) {
      case 'queued': counts.queued++; break;
      case 'running': counts.running++; break;
      case 'done': counts.done++; break;
      default: throw new RangeError('Unsupported state.');
    }
  }
  return counts;
}

function firstSeat(rows) {
  if (!Array.isArray(rows)) throw new TypeError('Expected rows.');
  for (const row of rows) {
    if (!Array.isArray(row)) throw new TypeError('Expected a row array.');
    for (const cell of row) {
      if (typeof cell !== 'boolean') throw new TypeError('Expected boolean seats.');
    }
  }
  for (let row = 0; row < rows.length; row++) {
    for (let column = 0; column < rows[row].length; column++) {
      if (rows[row][column]) return { row, column };
    }
  }
  return null;
}

function pageRanges(total, size) {
  if (!Number.isSafeInteger(total) || total < 0 || total > 1000 ||
      !Number.isSafeInteger(size) || size < 1 || size > 1000) {
    throw new RangeError('Invalid page arguments.');
  }
  const ranges = [];
  for (let start = 1; start <= total; start += size) {
    ranges.push({ start, end: Math.min(start + size - 1, total) });
  }
  return ranges;
}

function inspectAttempts(outcomes, budget) {
  if (!Array.isArray(outcomes)) throw new TypeError('Expected outcomes.');
  if (!Number.isSafeInteger(budget) || budget < 0 || budget > 100) {
    throw new RangeError('Invalid budget.');
  }
  for (const outcome of outcomes) {
    if (typeof outcome !== 'boolean') throw new TypeError('Expected booleans.');
  }
  let attempts = 0;
  while (attempts < budget && attempts < outcomes.length) {
    const succeeded = outcomes[attempts];
    attempts++;
    if (succeeded) return { attempts, succeeded: true };
  }
  return { attempts, succeeded: false };
}

assert.equal(stockState(0, 5), 'sold-out');
assert.equal(stockState(4, 5), 'low');
assert.equal(stockState(5, 5), 'available');
assert.throws(() => stockState('1', 5), RangeError);
assert.equal(sumUntilStop([2, '3', -1, 4, null, 99]), 6);
assert.equal(sumUntilStop([]), 0);
assert.throws(() => sumUntilStop([Number.MAX_SAFE_INTEGER, 1]), RangeError);
assert.deepEqual(countStates(['queued', 'done', 'queued']), { queued: 2, running: 0, done: 1 });
assert.throws(() => countStates(['unknown']), RangeError);
assert.deepEqual(firstSeat([[false], [], [false, true]]), { row: 2, column: 1 });
assert.equal(firstSeat([[], [false]]), null);
assert.throws(() => firstSeat([[true], ['invalid']]), TypeError);
assert.deepEqual(pageRanges(7, 3), [{ start: 1, end: 3 }, { start: 4, end: 6 }, { start: 7, end: 7 }]);
assert.deepEqual(pageRanges(6, 3), [{ start: 1, end: 3 }, { start: 4, end: 6 }]);
assert.deepEqual(pageRanges(0, 3), []);
assert.throws(() => pageRanges(1, 0), RangeError);
assert.deepEqual(inspectAttempts([false, true, true], 3), { attempts: 2, succeeded: true });
assert.deepEqual(inspectAttempts([true], 0), { attempts: 0, succeeded: false });
assert.deepEqual(inspectAttempts([false], 3), { attempts: 1, succeeded: false });
assert.throws(() => inspectAttempts([true, 1], 1), TypeError);
console.log('Six control-flow challenge assertion groups passed.');
// Expected output:
// Six control-flow challenge assertion groups passed.

// Complexity varies by helper: constant decisions, linear scans, or output-proportional page construction.
