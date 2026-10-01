'use strict';

{
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
}

{
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
}

{
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
}

{
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
}

{
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
}

{
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
}
