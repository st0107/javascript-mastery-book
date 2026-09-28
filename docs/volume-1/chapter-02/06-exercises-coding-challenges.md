# Exercises and Coding Challenges

Each solution is independent and includes assertions. Node's `assert` utility throws if an expectation fails. Draw bindings and object identities before running mutation examples. The companion program is `code/volume-1/chapter-02/example-03-binding-challenges.js`.

## Exercise 1: Separate Property Mutation From Rebinding

**Requirements:** Begin with a queued record and a second binding to that record. Mutate through the second binding, then replace only that mutable binding. Prove that the original retains the first mutation and that the two final records differ.

**Hint:** Draw two arrows first; move only one arrow on identifier assignment.

```js
'use strict';
const assert = require('node:assert/strict');

const original = { status: 'queued' };
let selected = original;
selected.status = 'ready';
selected = { status: 'sent' };
assert.equal(original.status, 'ready');
assert.equal(selected.status, 'sent');
assert.notEqual(original, selected);
console.log(original.status, selected.status);

// Expected output:
// ready sent
```

The property assignment changes the shared object. The later identifier assignment replaces only `selected`. This fixed-sized trace uses O(1) work and object storage.

## Exercise 2: Repair a TDZ Initializer

**Requirements:** An outer quantity is 8. In a nested block derive a preview quantity one greater without changing the outer binding. Avoid `const quantity = quantity + 1`, which would read its own uninitialized binding. Verify both values.

**Hint:** Give the derived representation a distinct name.

```js
'use strict';
const assert = require('node:assert/strict');

const quantity = 8;
{
  const previewQuantity = quantity + 1;
  assert.equal(previewQuantity, 9);
  console.log(previewQuantity);
}
assert.equal(quantity, 8);
console.log(quantity);

// Expected output:
// 9
// 8
```

The initializer now resolves the outer quantity. A new block-local binding names the derived result. Work and storage are O(1); this repair changes naming, not the surrounding quantity's value.

## Exercise 3: Classify Values for Diagnostics

**Requirements:** Return `null`, `array`, or `nan` for those special categories; otherwise return the ordinary `typeof` result. Do not mistake a number-like string for a Number or a function for a primitive. This is a diagnostic label, not a schema validator.

**Hint:** Check the narrower cases before using the broad operator result.

```js
'use strict';
const assert = require('node:assert/strict');

function diagnosticKind(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (Number.isNaN(value)) return 'nan';
  return typeof value;
}
const pairs = [
  [null, 'null'], [[], 'array'], [NaN, 'nan'], [undefined, 'undefined'],
  [false, 'boolean'], ['4', 'string'], [4, 'number'], [4n, 'bigint'],
  [Symbol('id'), 'symbol'], [{}, 'object'], [() => {}, 'function']
];
for (const [value, kind] of pairs) assert.equal(diagnosticKind(value), kind);
console.log(pairs.map(([value]) => diagnosticKind(value)).join('|'));

// Expected output:
// null|array|nan|undefined|boolean|string|number|bigint|symbol|object|function
```

Each classification uses fixed-sized checks. Labeling a list of `n` values takes O(n) checks plus output construction. Infinity remains `number`; if the caller needs finite values, add a separate numeric contract.

## Exercise 4: Validate a Mutable Counter's Next Value

**Requirements:** Accept a Number stock count between 0 and 10,000 inclusive and a Number delta of exactly 1 or -1. Return the adjusted count when it remains in range. Reject unsupported representations with `TypeError` and range violations with `RangeError`. The function must not silently convert strings.

**Hint:** Validate both inputs before adding them; arithmetic is exact within these small integer bounds.

```js
'use strict';
const assert = require('node:assert/strict');

function adjustStock(count, delta) {
  if (!Number.isSafeInteger(count) || !Number.isSafeInteger(delta)) {
    throw new TypeError('safe integer inputs required');
  }
  if (count < 0 || count > 10_000 || (delta !== 1 && delta !== -1)) {
    throw new RangeError('invalid stock adjustment');
  }
  const nextCount = count + delta;
  if (nextCount < 0 || nextCount > 10_000) throw new RangeError('stock range exceeded');
  return nextCount;
}
assert.equal(adjustStock(0, 1), 1);
assert.equal(adjustStock(10_000, -1), 9999);
for (const args of [[0, -1], [10_000, 1], [-1, 1], [3, 2]]) {
  assert.throws(() => adjustStock(...args), RangeError);
}
for (const args of [['3', 1], [NaN, 1], [3, '1'], [3.5, 1]]) {
  assert.throws(() => adjustStock(...args), TypeError);
}
console.log(adjustStock(3, 1));

// Expected output:
// 4
```

Fixed-sized numeric guards and arithmetic use O(1) time and auxiliary space. The returned value is independent of the caller's binding; the caller decides whether to assign it.

## Exercise 5: Take a Narrow Shipment Snapshot

**Requirements:** Accept an ordinary record with nonempty string `id` and `status`. Return a new record containing trimmed values for just those fields. Changes to input or output fields must not change the other record. Reject null, arrays, wrong field types, and blank text. Do not promise to clone nested properties that the schema excludes.

**Hint:** Construct the output from validated primitive fields rather than spreading the entire input.

```js
'use strict';
const assert = require('node:assert/strict');

function shipmentSnapshot(input) {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('shipment object required');
  }
  const { id, status } = input;
  if (typeof id !== 'string' || typeof status !== 'string') {
    throw new TypeError('string fields required');
  }
  const cleanId = id.trim();
  const cleanStatus = status.trim();
  if (cleanId === '' || cleanStatus === '') throw new RangeError('nonempty fields required');
  return { id: cleanId, status: cleanStatus };
}
const source = { id: ' S-1 ', status: 'queued', secret: 'excluded' };
const snapshot = shipmentSnapshot(source);
source.status = 'sent';
snapshot.id = 'local';
assert.equal(source.id, ' S-1 ');
assert.equal(snapshot.status, 'queued');
assert.equal(Object.hasOwn(snapshot, 'secret'), false);
for (const invalid of [null, [], {}, { id: 3, status: 'ready' }]) {
  assert.throws(() => shipmentSnapshot(invalid), TypeError);
}
assert.throws(() => shipmentSnapshot({ id: ' ', status: 'ready' }), RangeError);
console.log(snapshot.status, source.status);

// Expected output:
// queued sent
```

Normalization costs O(L) for total text length L. The fixed output schema owns its property slots and stores immutable strings. Adding nested object fields later requires a new ownership decision.

## Exercise 6: Prove Parameter Reassignment Is Local

**Requirements:** Write a function that marks the supplied record reviewed, then reassigns its parameter to a distinct unreviewed record and returns it. Prove that the caller still holds the original reviewed record. Explain both identities rather than using the phrase "pass-by-reference."

**Hint:** The parameter is a new binding initialized with the argument value.

```js
'use strict';
const assert = require('node:assert/strict');

function reviewAndReplaceLocal(record) {
  record.reviewed = true;
  record = { reviewed: false };
  return record;
}
const original = { reviewed: false };
const returned = reviewAndReplaceLocal(original);
assert.equal(original.reviewed, true);
assert.equal(returned.reviewed, false);
assert.notEqual(original, returned);
console.log(original.reviewed, returned.reviewed, original === returned);

// Expected output:
// true false false
```

The function intentionally mutates a trusted ordinary record; it is a value-semantics trace, not a general input validator. It performs O(1) property work and creates one additional object. Reassigning the parameter does not assign to the caller's binding.
