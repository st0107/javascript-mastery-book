# Control Flow: Exercises and Coding Challenges

Write each contract and trace a boundary input before reading the solution. The companion `code/volume-1/chapter-06/example-03-control-flow-challenges.js` includes assertions for all six exercises.

## 1. Classify Inventory With Guards

Accept a nonnegative safe-integer count and a positive safe-integer low-stock threshold. Return sold-out for zero, low below the threshold, and available at or above it. Reject invalid numeric arguments.

**Hint:** Validate before comparing; zero must have its own branch.

### Solution

```js
function stockState(count, threshold) {
  if (!Number.isSafeInteger(count) || count < 0 ||
      !Number.isSafeInteger(threshold) || threshold <= 0) {
    throw new RangeError('Invalid inventory arguments.');
  }
  if (count === 0) return 'sold-out';
  if (count < threshold) return 'low';
  return 'available';
}
console.log(stockState(0, 5));
console.log(stockState(4, 5));
console.log(stockState(5, 5));
// Expected output:
// sold-out
// low
// available
```

The ordering makes the boundary explicit. Zero is not simply another low value. Time and additional space are O(1). Test zero, threshold minus one, exact threshold, negative input, and numeric strings.

## 2. Sum Valid Counts Until a Stop Marker

Accept an array. Stop at the first null. Before it, skip entries that are not nonnegative safe integers. Sum accepted counts and reject an unsafe total. Do not examine later entries after null.

**Hint:** Place the stop check before the validity guard; validate the running result too.

### Solution

```js
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
console.log(sumUntilStop([2, '3', -1, 4, null, 99]));
console.log(sumUntilStop([]));
// Expected output:
// 6
// 0
```

The invariant is that total equals the accepted prefix sum. Each iteration either exits or advances the finite iterator. Time is O(n) in visited entries; additional space is O(1). A null-first input returns zero.

## 3. Count a Closed Set of States

Accept an array containing only queued, running, or done strings. Return an object containing the count of each state. Reject an unsupported value, including numbers. Do not mutate the input.

**Hint:** Use one switch case per state and an explicit default error.

### Solution

```js
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
console.log(JSON.stringify(countStates(['queued', 'done', 'queued'])));
try {
  countStates(['unknown']);
} catch (error) {
  console.log(error.name);
}
// Expected output:
// {"queued":2,"running":0,"done":1}
// RangeError
```

Each break leaves the switch and then the loop continues. O(n) time and O(1) result size follow from the fixed three-state vocabulary. Without a break, one entry could increment several counters.

## 4. Find the First Available Seat

Accept a matrix whose rows are arrays and whose cells are booleans: true means available. Search rows and columns in ascending index order and return the first coordinate, or null. Validate all rows and cells before searching so invalid data is rejected even after an early match. Empty or ragged rows are allowed.

**Hint:** Keep schema validation separate from the early-exit search.

### Solution

```js
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
console.log(JSON.stringify(firstSeat([[false], [], [false, true]])));
console.log(firstSeat([[false]]));
// Expected output:
// {"row":2,"column":1}
// null
```

A return exits both loops because it exits the function. Validation makes the acceptance contract independent of search order. For r rows and c total cells, time is O(r + c), including empty rows; extra space is O(1).

## 5. Build Inclusive Page Ranges

Accept a total from 0 through 1000 and a page size from 1 through 1000, both safe-integer Numbers. Return inclusive one-based start/end ranges with no overlap or missing item. A total of zero yields an empty array.

**Hint:** Advance the start by page size and clamp each end to total.

### Solution

```js
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
console.log(JSON.stringify(pageRanges(7, 3)));
console.log(JSON.stringify(pageRanges(0, 3)));
// Expected output:
// [{"start":1,"end":3},{"start":4,"end":6},{"start":7,"end":7}]
// []
```

Positive size proves progress, and the bounds prevent unsafe arithmetic. If p pages are returned, time and output space are O(p). Check exact multiples, a final partial page, zero total, and a rejected zero size.

## 6. Apply a Bounded Attempt Budget

Given an array of boolean outcomes and a safe-integer budget from 0 through 100, inspect at most that many outcomes. Return attempts and succeeded, stopping at the first true. Validate the entire outcomes array first. This models decisions from recorded outcomes; it performs no external operation or retry.

**Hint:** Increment attempts before the success check so every examined outcome is counted.

### Solution

```js
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
console.log(JSON.stringify(inspectAttempts([false, true, true], 3)));
console.log(JSON.stringify(inspectAttempts([true], 0)));
// Expected output:
// {"attempts":2,"succeeded":true}
// {"attempts":0,"succeeded":false}
```

Both budget and finite input length bound the loop. Validation takes O(n) time for n outcomes; the decision scan examines at most min(n, budget), and extra space is O(1). Zero budget performs no attempts.
