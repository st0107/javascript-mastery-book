# Exercises and Coding Challenges

Solve each contract before reading its solution. All six programs run independently; assertions cover the boundary that motivates the operator choice. The companion `code/volume-1/chapter-03/example-03-operator-challenges.js` runs the same six solutions.

## 1. Preserve an Explicit Empty Label

**Problem:** Return the supplied label when it is a string, including an empty string. Only null or undefined select 'Untitled'. Reject other types. Do not trim the label.

**Hint:** Default by nullishness, then validate the selected type.

### Solution

```js
const assert = require('node:assert/strict');
function displayLabel(value) {
  const label = value ?? 'Untitled';
  if (typeof label !== 'string') throw new TypeError('label must be a string');
  return label;
}
assert.equal(displayLabel(''), '');
assert.equal(displayLabel(null), 'Untitled');
assert.equal(displayLabel(undefined), 'Untitled');
assert.throws(() => displayLabel(0), TypeError);
console.log(JSON.stringify([displayLabel(''), displayLabel('Report'), displayLabel(null)]));

// Expected output:
// ["","Report","Untitled"]

// O(1) time and additional storage; existing strings are returned unchanged.
```

Using || would replace the valid empty label. Converting every input with String would instead accept values the contract rejects.

## 2. Cache a Lazy Default With One Read

**Problem:** Read a record's named value once. If it is nullish, call compute exactly once, store its result, and return it. Preserve false, zero, and empty strings. A thrown computation must leave the property unwritten.

**Hint:** Use logical nullish assignment and observe getter, computation, and setter order.

### Solution

```js
const assert = require('node:assert/strict');
function getOrCompute(record, key, compute) {
  return record[key] ??= compute();
}
let reads = 0;
let computes = 0;
let writes = 0;
let stored;
const record = {
  get value() { reads += 1; return stored; },
  set value(next) { writes += 1; stored = next; }
};
const compute = () => { computes += 1; return 0; };
assert.equal(getOrCompute(record, 'value', compute), 0);
assert.equal(getOrCompute(record, 'value', compute), 0);
assert.deepEqual([reads, computes, writes], [2, 1, 1]);
const fresh = {};
assert.throws(() => getOrCompute(fresh, 'value', () => { throw new Error('failed'); }), /failed/);
assert.equal(Object.hasOwn(fresh, 'value'), false);
console.log(reads, computes, writes);

// Expected output:
// 2 1 1

// O(1) operator bookkeeping, excluding accessor and compute work.
```

The record and callback are trusted collaborators. If compute returns undefined, the next call computes again; nullish values are deliberately not cache hits. This is not a concurrent or asynchronous cache.

## 3. Check All Required Permission Bits

**Problem:** Use three flags with values 1, 2, and 4. Accept only integer masks from 0 through 7. Return whether every required bit is present. An empty requirement succeeds.

**Hint:** A bitwise intersection must equal the required mask; mere nonzero overlap means something else.

### Solution

```js
const assert = require('node:assert/strict');
function hasAllFlags(available, required) {
  for (const mask of [available, required]) {
    if (!Number.isInteger(mask) || mask < 0 || mask > 7) throw new RangeError('invalid mask');
  }
  return (available & required) === required;
}
assert.equal(hasAllFlags(3, 3), true);
assert.equal(hasAllFlags(1, 3), false);
assert.equal(hasAllFlags(0, 0), true);
assert.throws(() => hasAllFlags(2 ** 32 + 1, 1), RangeError);
console.log(hasAllFlags(7, 5), hasAllFlags(2, 5));

// Expected output:
// true false

// O(1) time and space for the fixed three-bit schema.
```

Validate before the bitwise operation. Otherwise large numbers can wrap into an apparently valid 32-bit mask. A set of permission names is clearer when the schema is not intentionally bit-based.

## 4. Allocate a Ticket Without Advancing on Failure

**Problem:** A mutable counter contains next, a nonnegative safe integer. Return the current ticket and advance next by one. Reject invalid or exhausted counters before mutation.

**Hint:** Postfix increment returns the old numeric value; range validation makes that operation safe.

### Solution

```js
const assert = require('node:assert/strict');
function allocateTicket(counter) {
  if (!Number.isSafeInteger(counter.next) || counter.next < 0 ||
      counter.next === Number.MAX_SAFE_INTEGER) throw new RangeError('counter exhausted or invalid');
  return counter.next++;
}
const counter = { next: 4 };
assert.equal(allocateTicket(counter), 4);
assert.equal(counter.next, 5);
const full = { next: Number.MAX_SAFE_INTEGER };
assert.throws(() => allocateTicket(full), RangeError);
assert.equal(full.next, Number.MAX_SAFE_INTEGER);
console.log(allocateTicket(counter), counter.next);

// Expected output:
// 5 6

// O(1) time and space; one documented mutation of a trusted data record.
```

Returning ++counter.next would skip the current ticket. This local counter does not supply durable or cross-process uniqueness. An accessor-bearing object is outside the data-record contract.

## 5. Make Discount Grouping Explicit

**Problem:** Compute an integer-cent subtotal from unitCents (0–1,000,000), quantity (0–1,000), and discountPercent (0–100), all integers. Apply the discount to the full subtotal and round once to the nearest cent.

**Hint:** Separate subtotal from its percentage multiplier; validate numbers before multiplication.

### Solution

```js
const assert = require('node:assert/strict');
function discountedTotal(unitCents, quantity, discountPercent) {
  for (const [value, max] of [[unitCents, 1000000], [quantity, 1000], [discountPercent, 100]]) {
    if (!Number.isInteger(value) || value < 0 || value > max) throw new RangeError('invalid input');
  }
  const subtotal = unitCents * quantity;
  return Math.round(subtotal * (100 - discountPercent) / 100);
}
assert.equal(discountedTotal(199, 2, 10), 358);
assert.equal(discountedTotal(199, 2, 100), 0);
assert.equal(discountedTotal(199, 0, 10), 0);
assert.throws(() => discountedTotal('199', 2, 10), RangeError);
console.log(discountedTotal(199, 2, 10));

// Expected output:
// 358

// O(1) time and space within the stated bounded arithmetic domain.
```

The accepted bounds keep intermediate integer products exactly representable. The rounding policy is part of this example's contract; real billing rules may require different tax/discount ordering or decimal arithmetic.

## 6. Call an Optional Transformer and Preserve Its Receiver

**Problem:** A plugin may be nullish, or its transform method may be nullish. Return the original payload in those cases and when the method returns null/undefined. Preserve other results, including zero and false. Call a present method with the plugin as its receiver; a nonfunction property should throw.

**Hint:** Keep optional invocation on the property reference, then coalesce its result.

### Solution

```js
const assert = require('node:assert/strict');
function transformOrOriginal(plugin, payload) {
  return plugin?.transform?.(payload) ?? payload;
}
const plugin = { prefix: 'ok:', transform(value) { return this.prefix + value; } };
assert.equal(transformOrOriginal(plugin, 'item'), 'ok:item');
assert.equal(transformOrOriginal(null, 'item'), 'item');
assert.equal(transformOrOriginal({}, 'item'), 'item');
assert.equal(transformOrOriginal({ transform: () => 0 }, 'item'), 0);
assert.equal(transformOrOriginal({ transform: () => false }, 'item'), false);
assert.throws(() => transformOrOriginal({ transform: 3 }, 'item'), TypeError);
console.log(transformOrOriginal(plugin, 'item'));

// Expected output:
// ok:item

// O(1) dispatch overhead, excluding the transformer's work and returned data.
```

Extracting transform into a standalone variable would lose the property-call receiver. The fallback policy intentionally treats nullish method results as absence; use an explicit presence test if undefined must be a meaningful result.
