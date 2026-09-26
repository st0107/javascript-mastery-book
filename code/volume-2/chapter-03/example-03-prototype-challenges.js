'use strict';

// Run: node code/volume-2/chapter-03/example-03-prototype-challenges.js
// Expected output:
// Lookup, shadowing, and deletion: passed
// Shared methods and separate state: passed
// Descriptor owner lookup: passed
// Inherited accessor receivers: passed
// Inheritance setup and initialization: passed
// Null-prototype name dictionary: passed
// All prototype challenge assertions passed.

const assert = require('node:assert/strict');

// Exercise 1: O(h) worst-case descriptor visits in a simple chain-walk model,
// with O(1) traversal state. Engines may optimize property access.
const defaults = { format: 'pdf' };
const job = Object.create(defaults);
assert.equal(job.format, 'pdf');
assert.equal(Object.hasOwn(job, 'format'), false);
job.format = 'epub';
assert.equal(job.format, 'epub');
assert.equal(defaults.format, 'pdf');
assert.equal(Object.hasOwn(job, 'format'), true);
job.format = undefined;
assert.equal(job.format, undefined);
assert.equal(Object.hasOwn(job, 'format'), true);
assert.equal('format' in job, true);
assert.equal(delete job.format, true);
assert.equal(job.format, 'pdf');
assert.equal(Object.hasOwn(job, 'format'), false);
assert.equal(delete job.format, true);
assert.equal(defaults.format, 'pdf');
assert.equal('missing' in job, false);

// Null and other falsy values also stop lookup when their own property exists.
for (const value of [null, false, 0, '']) {
  job.format = value;
  assert.strictEqual(job.format, value);
  assert.equal(Object.hasOwn(job, 'format'), true);
  delete job.format;
}
assert.equal(job.format, 'pdf');
console.log('Lookup, shadowing, and deletion: passed');

// Exercise 2: O(1) factory state; typical amortized O(1) append in a growable
// array model. Snapshot costs O(n) time/space for n items; methods are shared.
const queueMethods = {
  add(item) {
    return this.items.push(item);
  },
  snapshot() {
    return this.items.slice();
  }
};

function createWorkQueue(name) {
  const queue = Object.create(queueMethods);
  queue.name = name;
  queue.items = [];
  return queue;
}

const print = createWorkQueue('print');
const exportQueue = createWorkQueue('export');
assert.strictEqual(Object.getPrototypeOf(print), queueMethods);
assert.strictEqual(Object.getPrototypeOf(exportQueue), queueMethods);
assert.strictEqual(print.add, exportQueue.add);
assert.strictEqual(print.snapshot, exportQueue.snapshot);
assert.equal(Object.hasOwn(print, 'add'), false);
assert.equal(Object.hasOwn(print, 'items'), true);
assert.equal(Object.hasOwn(queueMethods, 'items'), false);
assert.notStrictEqual(print.items, exportQueue.items);
assert.deepEqual(print.snapshot(), []);
assert.deepEqual(exportQueue.snapshot(), []);
assert.equal(print.add('chapter-01'), 1);
assert.equal(print.add('chapter-02'), 2);
assert.equal(exportQueue.add('appendix'), 1);
assert.deepEqual(print.snapshot(), ['chapter-01', 'chapter-02']);
assert.deepEqual(exportQueue.snapshot(), ['appendix']);
const queueSnapshot = print.snapshot();
queueSnapshot.push('local-only');
assert.equal(queueSnapshot.length, 3);
assert.equal(print.items.length, 2);
assert.notStrictEqual(print.snapshot(), print.snapshot());
assert.equal(createWorkQueue('').name, '');
console.log('Shared methods and separate state: passed');

// Exercise 3: trusted ordinary objects and string/symbol keys only; not proxies.
// O(h) queries and O(1) live traversal state for h inspected objects.
function findPropertyOwner(object, key) {
  if (object === null || typeof object !== 'object') {
    throw new TypeError('object must be a non-null ordinary object.');
  }
  if (typeof key !== 'string' && typeof key !== 'symbol') {
    throw new TypeError('key must be a string or symbol.');
  }

  for (let current = object; current !== null; current = Object.getPrototypeOf(current)) {
    const descriptor = Object.getOwnPropertyDescriptor(current, key);
    if (descriptor !== undefined) return { owner: current, descriptor };
  }
  return undefined;
}

let getterCalls = 0;
const schema = Object.create(null);
const readStatus = function () {
  getterCalls += 1;
  throw new Error('The inspector must not invoke this getter.');
};
Object.defineProperty(schema, 'status', {
  get: readStatus,
  configurable: true
});
const middle = Object.create(schema);
const record = Object.create(middle);
const found = findPropertyOwner(record, 'status');
assert.strictEqual(found.owner, schema);
assert.strictEqual(found.descriptor.get, readStatus);
assert.equal(found.descriptor.enumerable, false);
assert.equal(Object.hasOwn(found.descriptor, 'value'), false);
assert.equal(getterCalls, 0);

Object.defineProperty(record, 'status', { value: undefined, configurable: true });
const own = findPropertyOwner(record, 'status');
assert.strictEqual(own.owner, record);
assert.equal(Object.hasOwn(own.descriptor, 'value'), true);
assert.equal(own.descriptor.value, undefined);
assert.equal(Object.hasOwn(own.descriptor, 'get'), false);
assert.equal(getterCalls, 0);
assert.equal(findPropertyOwner(record, 'missing'), undefined);
assert.equal(findPropertyOwner(Object.create(null), 'toString'), undefined);

// The returned descriptor is not a live editor for the underlying property.
own.descriptor.value = 'changed descriptor only';
assert.equal(record.status, undefined);
delete record.status;
assert.strictEqual(findPropertyOwner(record, 'status').owner, schema);
assert.equal(getterCalls, 0);

const marker = Symbol('marker');
Object.defineProperty(middle, marker, { value: 0 });
assert.strictEqual(findPropertyOwner(record, marker).owner, middle);
assert.equal(findPropertyOwner(record, marker).descriptor.value, 0);
assert.equal(findPropertyOwner(record, Symbol('marker')), undefined);
Object.defineProperty(record, '', { value: false });
assert.strictEqual(findPropertyOwner(record, '').owner, record);

for (const invalid of [null, undefined, 0, '', false, Symbol('x'), () => {}]) {
  assert.throws(() => findPropertyOwner(invalid, 'x'), {
    name: 'TypeError', message: 'object must be a non-null ordinary object.'
  });
}
for (const invalidKey of [null, undefined, 0, false, {}]) {
  assert.throws(() => findPropertyOwner(record, invalidKey), {
    name: 'TypeError', message: 'key must be a string or symbol.'
  });
}
console.log('Descriptor owner lookup: passed');

// Exercise 4: O(1) time and extra space for fixed-depth lookup and arithmetic.
const distanceMethods = {
  get kilometers() {
    return this.meters / 1000;
  },
  set kilometers(value) {
    if (!Number.isFinite(value) || value < 0 || value > 1_000_000) {
      throw new RangeError('kilometers must be between 0 and 1000000.');
    }
    this.meters = value * 1000;
  }
};

const firstDistance = Object.create(distanceMethods);
const secondDistance = Object.create(distanceMethods);
firstDistance.meters = 1500;
secondDistance.meters = 500;
assert.equal(firstDistance.kilometers, 1.5);
assert.equal(secondDistance.kilometers, 0.5);
firstDistance.kilometers = 2.5;
assert.equal(firstDistance.meters, 2500);
assert.equal(secondDistance.meters, 500);
assert.equal(Object.hasOwn(firstDistance, 'kilometers'), false);
assert.equal(Object.hasOwn(firstDistance, 'meters'), true);
assert.equal(Object.hasOwn(distanceMethods, 'meters'), false);

for (const invalid of [-1, 1_000_001, Infinity, -Infinity, NaN, '2', null, undefined]) {
  assert.throws(() => { firstDistance.kilometers = invalid; }, {
    name: 'RangeError', message: 'kilometers must be between 0 and 1000000.'
  });
  assert.equal(firstDistance.meters, 2500);
}
firstDistance.kilometers = 0;
assert.equal(firstDistance.meters, 0);
firstDistance.kilometers = 1_000_000;
assert.equal(firstDistance.meters, 1_000_000_000);

// Accessor ownership and receiver identity are separate concepts.
assert.equal(Reflect.get(distanceMethods, 'kilometers', secondDistance), 0.5);
assert.equal(Reflect.set(distanceMethods, 'kilometers', 3, secondDistance), true);
assert.equal(secondDistance.meters, 3000);
assert.equal(firstDistance.meters, 1_000_000_000);
assert.equal(Object.hasOwn(distanceMethods, 'meters'), false);
console.log('Inherited accessor receivers: passed');

// Exercise 5: fixed O(1) setup/initialization bookkeeping, fresh tags per
// instance, and shared methods. Description formatting costs O(L) for length L.
// This bounded ordinary-function pattern does not implement all class semantics.
let documentInitializations = 0;

function Document(title) {
  documentInitializations += 1;
  this.title = title;
  this.tags = [];
}

Object.defineProperty(Document.prototype, 'describe', {
  value: function describe() {
    return `${this.title} (${this.tags.length} tags)`;
  },
  writable: true,
  configurable: true
});

function Guide(title, chapters) {
  Document.call(this, title);
  this.chapters = chapters;
}

Guide.prototype = Object.create(Document.prototype, {
  constructor: {
    value: Guide,
    writable: true,
    configurable: true,
    enumerable: false
  }
});

assert.equal(documentInitializations, 0);
assert.equal(Object.hasOwn(Guide.prototype, 'title'), false);
assert.equal(Object.hasOwn(Guide.prototype, 'tags'), false);
assert.strictEqual(Object.getPrototypeOf(Guide.prototype), Document.prototype);
assert.strictEqual(Object.getPrototypeOf(Guide), Function.prototype);
const guideConstructor = Object.getOwnPropertyDescriptor(Guide.prototype, 'constructor');
assert.strictEqual(guideConstructor.value, Guide);
assert.equal(guideConstructor.enumerable, false);
assert.equal(guideConstructor.writable, true);
assert.equal(guideConstructor.configurable, true);

const firstGuide = new Guide('JavaScript', 12);
const secondGuide = new Guide('Web APIs', 8);
assert.equal(documentInitializations, 2);
assert.equal(firstGuide.chapters, 12);
assert.equal(secondGuide.chapters, 8);
assert.notStrictEqual(firstGuide.tags, secondGuide.tags);
firstGuide.tags.push('language');
assert.equal(firstGuide.describe(), 'JavaScript (1 tags)');
assert.equal(secondGuide.describe(), 'Web APIs (0 tags)');
assert.strictEqual(firstGuide.describe, secondGuide.describe);
assert.strictEqual(Object.getPrototypeOf(firstGuide), Guide.prototype);
assert.equal(firstGuide instanceof Guide, true);
assert.equal(firstGuide instanceof Document, true);
assert.strictEqual(firstGuide.constructor, Guide);
assert.equal(Object.hasOwn(firstGuide, 'constructor'), false);
assert.equal(Object.hasOwn(firstGuide, 'title'), true);
assert.equal(Object.hasOwn(firstGuide, 'tags'), true);

// A prototype link is not evidence that initialization took place.
const uninitialized = Object.create(Guide.prototype);
assert.equal(documentInitializations, 2);
assert.equal(uninitialized instanceof Guide, true);
assert.equal(Object.hasOwn(uninitialized, 'tags'), false);
assert.throws(() => uninitialized.describe(), TypeError);

// Editing an ordinary constructor property does not rewrite a prototype link.
firstGuide.constructor = null;
assert.strictEqual(Object.getPrototypeOf(firstGuide), Guide.prototype);
assert.equal(firstGuide instanceof Guide, true);
delete firstGuide.constructor;
assert.strictEqual(firstGuide.constructor, Guide);
console.log('Inheritance setup and initialization: passed');

// Exercise 6: O(n) writes for n trusted pairs and O(k) property slots for k
// distinct names in a usual property-table model, plus key/value payload costs.
function buildNameIndex(entries) {
  const index = Object.create(null);
  for (const [name, value] of entries) {
    if (typeof name !== 'string') {
      throw new TypeError('entry names must be strings.');
    }
    index[name] = value;
  }
  return index;
}

const index = buildNameIndex([
  ['__proto__', 'literal name'],
  ['constructor', undefined],
  ['toString', 'display name'],
  ['chapter', 'draft'],
  ['chapter', 'reviewed']
]);
assert.equal(Object.getPrototypeOf(index), null);
assert.equal(index.__proto__, 'literal name');
assert.equal(index.toString, 'display name');
assert.equal(Object.hasOwn(index, 'constructor'), true);
assert.equal(index.constructor, undefined);
assert.equal(Object.hasOwn(index, 'missing'), false);
assert.equal(index.missing, undefined);
assert.equal(index.chapter, 'reviewed');
assert.equal(Object.keys(index).length, 4);
assert.equal(Object.getPrototypeOf(index), null);

for (const key of Object.keys(index)) {
  const descriptor = Object.getOwnPropertyDescriptor(index, key);
  assert.equal(descriptor.writable, true);
  assert.equal(descriptor.enumerable, true);
  assert.equal(descriptor.configurable, true);
}
const empty = buildNameIndex([]);
assert.equal(Object.getPrototypeOf(empty), null);
assert.deepEqual(Object.keys(empty), []);
assert.equal(empty.hasOwnProperty, undefined);
assert.equal('constructor' in empty, false);

const payload = { enabled: true };
const specialNames = buildNameIndex([
  ['', 'empty name'],
  ['hasOwnProperty', 'stored text'],
  ['__proto__', payload]
]);
assert.equal(specialNames[''], 'empty name');
assert.equal(Object.hasOwn(specialNames, 'hasOwnProperty'), true);
assert.equal(specialNames.hasOwnProperty, 'stored text');
assert.strictEqual(specialNames.__proto__, payload);
assert.equal(Object.getPrototypeOf(specialNames), null);
payload.enabled = false;
assert.equal(specialNames.__proto__.enabled, false);

for (const invalidName of [null, undefined, 0, false, {}, Symbol('name')]) {
  assert.throws(() => buildNameIndex([[invalidName, 'value']]), {
    name: 'TypeError', message: 'entry names must be strings.'
  });
}
console.log('Null-prototype name dictionary: passed');
console.log('All prototype challenge assertions passed.');
