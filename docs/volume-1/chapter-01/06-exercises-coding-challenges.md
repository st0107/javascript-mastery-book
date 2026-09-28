# Exercises and Coding Challenges

Each solution runs independently in Node.js 20 or later. `assert` is Node's assertion utility: an incorrect expectation throws and makes the check fail. Attempt the requirements before reading the solution. These tasks practice language/host boundaries rather than depending on a browser document.

## Exercise 1: Trace a Portable Calculation

**Requirements:** For three reports costing 250 cents each, compute a label without reading any host state. Print the label separately. Identify which line actually performs output.

**Hint:** Separate the returned text from the statement that prints it.

**Solution:** Multiplication and string interpolation are language operations; the final console call requests host output.

```js
'use strict';
const assert = require('node:assert/strict');

function reportLabel(copies, centsPerCopy) {
  return `${copies} reports: ${copies * centsPerCopy} cents`;
}
const label = reportLabel(3, 250);
assert.equal(label, '3 reports: 750 cents');
console.log(label);

// Expected output:
// 3 reports: 750 cents
```

Inputs in this trace are trusted small positive integers. The later tasks establish a validation boundary. The calculation uses constant-size arithmetic; producing text also costs time and space proportional to its length.

## Exercise 2: Check the Required Capability

**Requirements:** Given a trusted ordinary adapter, return whether it has a callable `writeText`. Missing, boolean, and null values must report false. The adapter itself may be null or undefined. Do not infer permission or identify a runtime.

**Hint:** Guard absent containers before reading a property.

**Solution:** Guard the container before reading the operation, then inspect its type.

```js
'use strict';
const assert = require('node:assert/strict');

function canAttemptWrite(adapter) {
  return adapter !== null && adapter !== undefined &&
    typeof adapter.writeText === 'function';
}
assert.equal(canAttemptWrite({ writeText() {} }), true);
for (const adapter of [null, undefined, {}, { writeText: true }]) {
  assert.equal(canAttemptWrite(adapter), false);
}
console.log(canAttemptWrite({ writeText() {} }), canAttemptWrite({}));

// Expected output:
// true false
```

The check is constant-sized for ordinary data properties. A true result means an operation can be attempted; the operation may still fail. Getters and proxies are outside this trusted-adapter contract.

## Exercise 3: Define the Checkout Boundary

**Requirements:** Accept a Number of cents from 1 through 100,000,000 inclusive. Reject fractional, unsafe, or nonnumeric input with `TypeError`; reject a safe integer outside the domain with `RangeError`. Return the accepted amount without converting it.

**Hint:** Check safe integer representation before the domain limits.

**Solution:** Validate representation before the business range.

```js
'use strict';
const assert = require('node:assert/strict');

function checkoutCents(value) {
  if (!Number.isSafeInteger(value)) throw new TypeError('safe integer cents required');
  if (value < 1 || value > 100_000_000) throw new RangeError('checkout range exceeded');
  return value;
}
assert.equal(checkoutCents(1), 1);
assert.equal(checkoutCents(100_000_000), 100_000_000);
for (const value of ['25', null, NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
  assert.throws(() => checkoutCents(value), TypeError);
}
for (const value of [0, -1, 100_000_001]) {
  assert.throws(() => checkoutCents(value), RangeError);
}
console.log(checkoutCents(2599));

// Expected output:
// 2599
```

Time and auxiliary space are constant-sized. Do not silently widen this function to parse arbitrary strings: a form parser has a different accepted-input contract.

## Exercise 4: Select a Fallback Without Hiding Failure

**Requirements:** `formatStatus(text, formatter)` accepts a string and an optional synchronous function. When the formatter is undefined, return `Status: ` followed by the text. Reject an explicitly supplied nonfunction. A formatter's thrown error must reach the caller unchanged.

**Hint:** Use undefined to distinguish an omitted dependency from an invalid supplied value.

**Solution:** Distinguish an absent dependency from a failing dependency.

```js
'use strict';
const assert = require('node:assert/strict');

function formatStatus(text, formatter) {
  if (typeof text !== 'string') throw new TypeError('text required');
  if (formatter === undefined) return `Status: ${text}`;
  if (typeof formatter !== 'function') throw new TypeError('formatter must be callable');
  return formatter(text);
}
const failure = new Error('format failed');
assert.throws(() => formatStatus('ready', null), TypeError);
assert.throws(() => formatStatus('ready', () => { throw failure; }), error => error === failure);
console.log(formatStatus('ready'));
console.log(formatStatus('ready', text => text.toUpperCase()));

// Expected output:
// Status: ready
// READY
```

The fallback produces text proportional to the input length. An injected formatter has its own cost and output contract. Avoid converting operational failure into a success-shaped fallback unless the API explicitly promises that policy.

## Exercise 5: Make a Host Effect Testable

**Requirements:** `exportTitle(title, writeText)` trims a nonempty string, calls an injected synchronous writer exactly once, and returns the written text length. Invalid text must cause no write. A writer error must propagate. Use an array as the test writer's private log.

**Hint:** Make all validation happen before the writer call.

**Solution:** Complete validation before performing the effect.

```js
'use strict';
const assert = require('node:assert/strict');

function exportTitle(title, writeText) {
  if (typeof title !== 'string' || title.trim() === '') throw new TypeError('title required');
  if (typeof writeText !== 'function') throw new TypeError('writer required');
  const normalized = title.trim();
  writeText(normalized);
  return normalized.length;
}
const writes = [];
const writer = text => writes.push(text);
assert.throws(() => exportTitle('   ', writer), TypeError);
assert.equal(writes.length, 0);
assert.equal(exportTitle('  Report  ', writer), 6);
assert.deepEqual(writes, ['Report']);
assert.throws(() => exportTitle('Report', () => { throw new Error('offline'); }), /offline/);
console.log(writes.join('|'));

// Expected output:
// Report
```

Normalization is linear in text length; the writer adds its own work. The contract is synchronous. An asynchronous writer requires an awaited API, not this immediate success result.

## Exercise 6: Summarize Rejected Inputs

**Requirements:** For an array of unknown amounts, count valid checkout amounts and rejected inputs using the range from Exercise 3. Return only counts, with no host I/O and no mutation. Missing or non-array input must throw. The caller decides where to display the summary.

**Hint:** Keep two counters and classify each entry once.

**Solution:** Classification stays inside the calculation; console output stays outside it.

```js
'use strict';
const assert = require('node:assert/strict');

function summarizeAmounts(values) {
  if (!Array.isArray(values)) throw new TypeError('array required');
  let accepted = 0;
  let rejected = 0;
  for (const value of values) {
    if (Number.isSafeInteger(value) && value >= 1 && value <= 100_000_000) accepted += 1;
    else rejected += 1;
  }
  return { accepted, rejected };
}
const input = Object.freeze([1, '1', 0, 100_000_000, Infinity]);
assert.deepEqual(summarizeAmounts(input), { accepted: 2, rejected: 3 });
assert.deepEqual(summarizeAmounts([]), { accepted: 0, rejected: 0 });
assert.throws(() => summarizeAmounts(null), TypeError);
console.log(JSON.stringify(summarizeAmounts(input)));

// Expected output:
// {"accepted":2,"rejected":3}
```

For `n` entries, time is O(n) and auxiliary space is O(1). Each entry is classified once. Neither a count nor a passed type check authorizes a purchase; that is a separate server decision.

## Companion Checks

`code/volume-1/chapter-01/example-03-boundary-challenges.js` runs these six solutions and assertions. The first two companion scripts add capability failure and checkout boundary regressions.
