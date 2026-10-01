# Exercises and Coding Challenges

Run each solution independently in Node.js 20 or later. Assertions test ownership and boundary behavior rather than only logging a happy path. All input-object contracts here refer to ordinary data objects unless a getter is deliberately included to demonstrate property semantics.

## Exercise 1: Require an Own Field

**Requirements:** `readOwn(record, key)` returns the value of an own property, even when that value is undefined. Reject null/nonobjects and nonstring keys with `TypeError`. Throw `RangeError` when the key is absent or only inherited. Do not call a method obtained from `record`.

**Hint:** Presence and value are separate checks; use the static own-property operation.

```js
'use strict';
const assert = require('node:assert/strict');

function readOwn(record, key) {
  if (record === null || typeof record !== 'object' || typeof key !== 'string') {
    throw new TypeError('object and string key required');
  }
  if (!Object.hasOwn(record, key)) throw new RangeError('own field required');
  return record[key];
}
const record = Object.create({ inherited: 7 });
record.present = undefined;
record.hasOwnProperty = false;
assert.equal(readOwn(record, 'present'), undefined);
assert.equal(readOwn(record, 'hasOwnProperty'), false);
assert.throws(() => readOwn(record, 'inherited'), RangeError);
assert.throws(() => readOwn(record, 'missing'), RangeError);
assert.throws(() => readOwn(null, 'id'), TypeError);
assert.throws(() => readOwn({}, 4), TypeError);
console.log(Object.hasOwn(record, 'present'), readOwn(record, 'present'));

// Expected output:
// true undefined
```

The algorithm performs a fixed number of operations; property-operation cost depends on the engine and object representation. Reading an accessor could execute code, so the ordinary-data assumption matters.

## Exercise 2: Apply a Patch With Three Presence States

**Requirements:** A trusted current delivery record contains primitive `id` and optional `note`. A patch may have only a `note` field. Missing means keep the existing note; a string, including an empty string, replaces it; null removes the property. Explicit undefined or another type must throw. Return a new outer record without mutating current or patch.

**Hint:** A destructuring default cannot distinguish all three states; check own presence first.

```js
'use strict';
const assert = require('node:assert/strict');

function applyNotePatch(current, patch) {
  if (patch === null || typeof patch !== 'object' || Array.isArray(patch)) {
    throw new TypeError('patch record required');
  }
  for (const key of Reflect.ownKeys(patch)) {
    if (key !== 'note') throw new TypeError('unknown patch field');
  }
  const next = { ...current };
  if (!Object.hasOwn(patch, 'note')) return next;
  if (patch.note === null) delete next.note;
  else if (typeof patch.note === 'string') next.note = patch.note;
  else throw new TypeError('note must be text or null');
  return next;
}
const current = Object.freeze({ id: 'D-1', note: 'ring bell' });
assert.equal(applyNotePatch(current, {}).note, 'ring bell');
assert.equal(applyNotePatch(current, { note: '' }).note, '');
const cleared = applyNotePatch(current, { note: null });
assert.equal(Object.hasOwn(cleared, 'note'), false);
assert.equal(current.note, 'ring bell');
assert.notEqual(cleared, current);
assert.throws(() => applyNotePatch(current, { note: undefined }), TypeError);
assert.throws(() => applyNotePatch(current, { admin: true }), TypeError);
assert.throws(() => applyNotePatch(current, { [Symbol('extra')]: true }), TypeError);
assert.throws(() => applyNotePatch(current, null), TypeError);
console.log(current.note, Object.hasOwn(cleared, 'note'));

// Expected output:
// ring bell false
```

For `k` current fields and `p` patch fields, work is O(k + p), with O(k) output property storage. The current record is already trusted and has primitive leaves; a general nested patch API needs an explicit deeper policy.

## Exercise 3: Copy the Changed Path

**Requirements:** Change a trusted profile's `preferences.theme` to light or dark. Return a new root and new preferences record. Preserve the existing email flag. Intentionally share the untouched `metadata` object. Reject an unsupported theme. Verify each identity claim.

**Hint:** Copy the root and preferences separately; do not claim full graph independence.

```js
'use strict';
const assert = require('node:assert/strict');

function withTheme(profile, theme) {
  if (theme !== 'light' && theme !== 'dark') throw new RangeError('unsupported theme');
  return { ...profile, preferences: { ...profile.preferences, theme } };
}
const profile = {
  id: 'U-1',
  preferences: Object.freeze({ theme: 'light', email: true }),
  metadata: Object.freeze({ source: 'import' })
};
const next = withTheme(profile, 'dark');
assert.notEqual(next, profile);
assert.notEqual(next.preferences, profile.preferences);
assert.equal(next.metadata, profile.metadata);
assert.equal(next.preferences.email, true);
assert.equal(profile.preferences.theme, 'light');
assert.throws(() => withTheme(profile, 'sepia'), RangeError);
console.log(profile.preferences.theme, next.preferences.theme, next.metadata === profile.metadata);

// Expected output:
// light dark true
```

If the root has `r` enumerable fields and preferences has `p`, copying costs O(r + p) property operations and output slots. The shared metadata is intentionally frozen here. A mutable shared subtree would need a documented mutation policy.

## Exercise 4: Explain the Descriptor Loss in a Copy

**Requirements:** Create an object with an enumerable read-only `id`, a non-enumerable `secret`, and an enumerable getter `status`. Spread it into a new object. Assert that secret is omitted, the getter runs once, and the copied id is writable. Explain why this is a value copy rather than a descriptor copy.

**Hint:** Inspect descriptors on the result, not just the printed values.

```js
'use strict';
const assert = require('node:assert/strict');

let reads = 0;
const source = {
  get status() { reads += 1; return 'ready'; }
};
Object.defineProperty(source, 'id', { value: 'R-1', enumerable: true });
Object.defineProperty(source, 'secret', { value: 'hidden' });
const copy = { ...source };
assert.equal(reads, 1);
assert.equal(Object.hasOwn(copy, 'secret'), false);
assert.equal(Object.getOwnPropertyDescriptor(copy, 'id').writable, true);
assert.equal(Object.getOwnPropertyDescriptor(copy, 'status').get, undefined);
copy.id = 'R-2';
assert.equal(source.id, 'R-1');
console.log(copy.id, copy.status, reads);

// Expected output:
// R-2 ready 1
```

Spread considers the source's own keys and reads its enumerable values. General work depends on key count plus getter work. This fixed example has constant-sized state, and only the local `reads` counter is affected.

## Exercise 5: Count Arbitrary String Labels Safely

**Requirements:** Accept an array of string labels, including empty strings and names such as constructor or __proto__. Return a null-prototype dictionary of counts. Reject non-array input and nonstring elements. Do not modify any prototype or the input array.

**Hint:** Start with a dictionary that has no inherited property names and test own presence.

```js
'use strict';
const assert = require('node:assert/strict');

function countLabels(labels) {
  if (!Array.isArray(labels)) throw new TypeError('labels array required');
  const counts = Object.create(null);
  for (const label of labels) {
    if (typeof label !== 'string') throw new TypeError('string labels required');
    counts[label] = Object.hasOwn(counts, label) ? counts[label] + 1 : 1;
  }
  return counts;
}
const labels = Object.freeze(['__proto__', 'constructor', '__proto__', '']);
const counts = countLabels(labels);
assert.equal(Object.getPrototypeOf(counts), null);
assert.equal(counts.__proto__, 2);
assert.equal(counts.constructor, 1);
assert.equal(counts[''], 1);
assert.equal(Object.keys(countLabels([])).length, 0);
assert.throws(() => countLabels(null), TypeError);
assert.throws(() => countLabels(['north', 1]), TypeError);
console.log(counts.__proto__, counts.constructor, counts['']);

// Expected output:
// 2 1 1
```

The algorithm makes O(n) dictionary operations for `n` labels and stores O(u) entries for `u` distinct labels, with string-key processing costs additional. Do not feed the dictionary into a generic unsafe merge later. Map is another option covered in the next chapter.

## Exercise 6: Publish a Frozen Two-Level Status View

**Requirements:** A trusted status record has primitive string `id` and `details.state` fields. Publish a new root and a new details record containing only those values. Freeze both new records so strict-mode callers cannot change the published fields. The source must remain mutable and independent; extra source fields must be excluded.

**Hint:** Copy before freezing, and freeze each owned record explicitly. Do not write a universal recursive-freeze utility.

```js
'use strict';
const assert = require('node:assert/strict');

function publishStatus(source) {
  if (source === null || typeof source !== 'object' || Array.isArray(source) ||
      !Object.hasOwn(source, 'id') || !Object.hasOwn(source, 'details') ||
      typeof source.id !== 'string') throw new TypeError('status record required');
  const details = source.details;
  if (details === null || typeof details !== 'object' || Array.isArray(details) ||
      !Object.hasOwn(details, 'state') || typeof details.state !== 'string') {
    throw new TypeError('details state text required');
  }
  return Object.freeze({
    id: source.id,
    details: Object.freeze({ state: details.state })
  });
}
const source = { id: 'S-1', details: { state: 'ready', internal: 'private' } };
const view = publishStatus(source);
source.details.state = 'sent';
assert.equal(view.details.state, 'ready');
assert.equal(Object.isFrozen(source), false);
assert.equal(Object.isFrozen(source.details), false);
assert.equal(Object.hasOwn(view.details, 'internal'), false);
assert.throws(() => { view.id = 'changed'; }, TypeError);
assert.throws(() => { view.details.state = 'changed'; }, TypeError);
assert.throws(() => publishStatus({ id: 'S-1', details: null }), TypeError);
console.log(view.details.state, source.details.state, Object.isFrozen(view.details));

// Expected output:
// ready sent true
```

This fixed record schema requires O(1) property operations and two new objects. The retained leaves are immutable strings, so freezing those two records establishes the stated graph policy. New object-valued fields would require a fresh ownership and freezing decision.

## Companion Program

`code/volume-1/chapter-08/example-03-ownership-challenges.js` runs all six solutions and their assertions. Keep the identity assertions: checking only equal values would miss several of the original sharing defects.
