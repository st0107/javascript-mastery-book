'use strict';

// Run: node code/volume-2/chapter-02/example-03-binding-challenges.js
// Expected output:
// Receiver prediction: passed
// Detached formatter repair: passed
// Dynamic receiver forwarding: passed
// Native partial application: passed
// Bounded bind-like call wrapper: passed
// Stable callback identity and cleanup: passed
// All binding challenge assertions passed.

const assert = require('node:assert/strict');

// Exercise 1: O(1) overhead for each fixed-size call.
const primary = {
  label: 'primary',
  readLabel() {
    return this?.label ?? 'no receiver';
  }
};
const backup = { label: 'backup', readLabel: primary.readLabel };
const detachedRead = primary.readLabel;
assert.strictEqual(primary.readLabel, backup.readLabel);
assert.equal(primary.readLabel(), 'primary');
assert.equal(backup.readLabel(), 'backup');
assert.equal(detachedRead(), 'no receiver');
assert.equal((primary.readLabel)(), 'primary');
assert.equal((0, primary.readLabel)(), 'no receiver');
assert.equal(detachedRead.call(backup), 'backup');
console.log('Receiver prediction: passed');

// Exercise 2: O(1) binding/forwarding overhead; O(L) for label length L.
function buildLabel(format, documentNumber) {
  return format(documentNumber);
}

const documentFormatter = {
  prefix: 'INV',
  format(documentNumber) {
    return `${this.prefix}-${documentNumber}`;
  }
};
const detachedFormat = documentFormatter.format;
assert.throws(() => buildLabel(detachedFormat, 42), TypeError);
assert.equal(detachedFormat.call(documentFormatter, 42), 'INV-42');
assert.equal(detachedFormat.apply(documentFormatter, [43]), 'INV-43');
const formatDocument = detachedFormat.bind(documentFormatter);
assert.equal(buildLabel(formatDocument, 44), 'INV-44');
documentFormatter.prefix = 'CREDIT';
assert.equal(buildLabel(formatDocument, 45), 'CREDIT-45');
assert.equal(formatDocument.call({ prefix: 'OTHER' }, 46), 'CREDIT-46');
console.log('Detached formatter repair: passed');

// Exercise 3: O(a) time and temporary argument space for a arguments,
// plus target costs. Factory retains O(1) bookkeeping and its target.
// The returned method supports calls only, not construction.
function forwardCall(operation) {
  if (typeof operation !== 'function') {
    throw new TypeError('operation must be a function.');
  }

  return {
    invoke(...args) {
      return Reflect.apply(operation, this, args);
    }
  }.invoke;
}

function allocate(size, extra) {
  return { pool: this.pool, bytes: size + extra };
}

// Exercise-owned function only: there is no mutation of built-in prototypes.
allocate.apply = null;
const sharedAllocate = forwardCall(allocate);
const smallPool = { pool: 'small', allocate: sharedAllocate };
const largePool = { pool: 'large', allocate: sharedAllocate };
assert.deepEqual(smallPool.allocate(8, 2), { pool: 'small', bytes: 10 });
assert.deepEqual(largePool.allocate(32, 4), { pool: 'large', bytes: 36 });
assert.deepEqual(sharedAllocate.call({ pool: 'temporary' }, 4, 1), {
  pool: 'temporary', bytes: 5
});
assert.throws(() => sharedAllocate(4, 1), TypeError);
assert.throws(() => new sharedAllocate(4, 1), TypeError);
assert.throws(() => forwardCall(null), {
  name: 'TypeError', message: 'operation must be a function.'
});

const readReceiver = forwardCall(function () { return this; });
assert.strictEqual(readReceiver(), undefined);
for (const receiver of [null, undefined, 0, false, '', 7, 'region']) {
  assert.strictEqual(Reflect.apply(readReceiver, receiver, []), receiver);
}
const receiverObject = { label: 'retained identity' };
assert.strictEqual(readReceiver.call(receiverObject), receiverObject);

const returnValue = { id: 3 };
assert.strictEqual(forwardCall(() => returnValue)(), returnValue);
const promiseValue = Promise.resolve('ready');
assert.strictEqual(forwardCall(() => promiseValue)(), promiseValue);

const forwardFailure = { reason: 'capacity' };
const failForward = forwardCall(() => { throw forwardFailure; });
assert.throws(() => failForward(), error => error === forwardFailure);

// Forwarding cannot override an arrow's lexical receiver or a native binding.
function makeArrowReader() {
  return () => this;
}
const lexicalOwner = { id: 'lexical' };
const lexicalReader = makeArrowReader.call(lexicalOwner);
assert.strictEqual(forwardCall(lexicalReader).call({ id: 'other' }), lexicalOwner);
const fixedReader = (function () { return this; }).bind(lexicalOwner);
assert.strictEqual(forwardCall(fixedReader).call({ id: 'other' }), lexicalOwner);
console.log('Dynamic receiver forwarding: passed');

// Exercise 4: O(p) saved argument slots for p prefills; O(p + a) forwarding
// work for a later arguments in the source-level model, plus target costs.
const catalog = {
  imprint: 'North',
  label(kind, edition, title) {
    return `${this.imprint} | ${kind} | r${edition.revision} | ${title}`;
  }
};
const edition = { revision: 1 };
const labelForManual = catalog.label.bind(catalog, 'manual', edition);
assert.equal(labelForManual('JavaScript'), 'North | manual | r1 | JavaScript');
catalog.imprint = 'South';
edition.revision = 2;
assert.equal(labelForManual('Web APIs'), 'South | manual | r2 | Web APIs');
assert.equal(labelForManual.call({ imprint: 'Other' }, 'Testing'),
  'South | manual | r2 | Testing');
const otherEdition = { revision: 9 };
const labelForGuide = catalog.label.bind(catalog, 'guide', otherEdition);
assert.equal(labelForGuide('Modules'), 'South | guide | r9 | Modules');
assert.equal(labelForManual('Objects'), 'South | manual | r2 | Objects');
console.log('Native partial application: passed');

// Exercise 5: ordinary calls only. NOT a native bind polyfill.
// O(p) retained argument slots; O(p + a) time/temporary argument space per call,
// plus the target's work and any data retained through saved references.
function bindForCall(operation, receiver, ...leading) {
  if (typeof operation !== 'function') {
    throw new TypeError('operation must be a function.');
  }

  return {
    invoke(...trailing) {
      return Reflect.apply(operation, receiver, [...leading, ...trailing]);
    }
  }.invoke;
}

const archiveFormatter = {
  group: 'archive',
  format(prefix, id, suffix) {
    return `${this.group}:${prefix}${id}${suffix}`;
  }
};
const formatArchive = bindForCall(archiveFormatter.format, archiveFormatter, 'DOC-');
assert.equal(formatArchive(7, '.txt'), 'archive:DOC-7.txt');
assert.equal(formatArchive.call({ group: 'other' }, 8, '.md'), 'archive:DOC-8.md');
archiveFormatter.group = 'cold';
assert.equal(formatArchive(9, '.csv'), 'cold:DOC-9.csv');
assert.throws(() => new formatArchive(10, '.txt'), TypeError);

for (const nonFunction of [null, undefined, false, 0, 'format', {}]) {
  assert.throws(() => bindForCall(nonFunction, {}), {
    name: 'TypeError', message: 'operation must be a function.'
  });
}

function captureCall(...args) {
  return { receiver: this, args };
}
const capture = bindForCall(captureCall, receiverObject, 'first', 'second');
assert.deepEqual(capture('third'), {
  receiver: receiverObject, args: ['first', 'second', 'third']
});
assert.deepEqual(capture('fourth', 'fifth').args,
  ['first', 'second', 'fourth', 'fifth']);
assert.deepEqual(capture().args, ['first', 'second']);
assert.deepEqual(bindForCall(captureCall, null)(), { receiver: null, args: [] });
for (const receiver of [null, undefined, 0, false, '', 7, 'region']) {
  assert.strictEqual(bindForCall(captureCall, receiver)().receiver, receiver);
}

assert.strictEqual(bindForCall(() => returnValue, null)(), returnValue);
assert.strictEqual(bindForCall(() => promiseValue, null)(), promiseValue);
for (const value of [undefined, null, false, 0, '']) {
  assert.strictEqual(bindForCall(() => value, null)(), value);
}
const callFailure = { reason: 'missing record' };
assert.throws(() => bindForCall(() => { throw callFailure; }, null)(),
  error => error === callFailure);
assert.strictEqual(bindForCall(lexicalReader, { id: 'other' })(), lexicalOwner);
assert.strictEqual(bindForCall(fixedReader, { id: 'other' })(), lexicalOwner);

const savedOptions = { revision: 1 };
const withOptions = bindForCall(options => options.revision, null, savedOptions);
savedOptions.revision = 2;
assert.equal(withOptions(), 2);
assert.equal(bindForCall(allocate, { pool: 'shadow-safe' }, 2)(3).bytes, 5);

// The wrapper itself adds no temporary properties to the receiver or target.
const frozenReceiver = Object.freeze({ prefix: 'frozen' });
const frozenTarget = Object.freeze(function (suffix) {
  return `${this.prefix}:${suffix}`;
});
assert.equal(bindForCall(frozenTarget, frozenReceiver)('ready'), 'frozen:ready');

// Enforce the construction boundary with a genuinely constructible target.
function Record(name) {
  this.name = name;
}
const recordReceiver = {};
const callRecord = bindForCall(Record, recordReceiver, 'ordinary-call');
assert.throws(() => new callRecord(), TypeError);
assert.equal(Object.hasOwn(recordReceiver, 'name'), false);
assert.equal(callRecord(), undefined);
assert.equal(recordReceiver.name, 'ordinary-call');
assert.equal(Object.hasOwn(callRecord, 'prototype'), false);
assert.equal(callRecord.name, 'invoke');
assert.equal(callRecord.length, 0);

// Native bind has construction semantics that bindForCall intentionally lacks.
const nativeRecord = Record.bind(recordReceiver, 'constructed');
const instance = new nativeRecord();
assert.equal(instance.name, 'constructed');
assert.equal(recordReceiver.name, 'ordinary-call');
assert.equal(instance instanceof Record, true);
assert.equal(instance instanceof nativeRecord, true);

// Class constructors pass the typeof guard but cannot be called ordinarily.
class ClassRecord {}
const callClass = bindForCall(ClassRecord, null);
assert.throws(() => callClass(), TypeError);
console.log('Bounded bind-like call wrapper: passed');

// Exercise 6: O(1) bookkeeping per attachment; usual hash-table Set operations
// have average O(1) cost. A render with n callbacks has O(n) snapshot/result
// overhead plus callback work. ECMAScript requires average sublinear access,
// not a particular Set implementation.
function createFormatterRegistry() {
  const callbacks = new Set();
  return {
    add(callback) {
      callbacks.add(callback);
    },
    delete(callback) {
      return callbacks.delete(callback);
    },
    render(text) {
      return [...callbacks].map(callback => callback(text));
    },
    get size() {
      return callbacks.size;
    }
  };
}

function attachFormatter(registry, owner) {
  let savedRegistry = registry;
  let callback = owner.format.bind(owner);
  savedRegistry.add(callback);

  return () => {
    if (callback === null) return false;
    const removed = savedRegistry.delete(callback);
    callback = null;
    savedRegistry = null;
    return removed;
  };
}

const registry = createFormatterRegistry();
const owner = {
  prefix: 'Preview',
  format(text) {
    return `${this.prefix}: ${text}`;
  }
};
const detach = attachFormatter(registry, owner);
assert.deepEqual(registry.render('Chapter 2'), ['Preview: Chapter 2']);
assert.equal(registry.delete(owner.format.bind(owner)), false);
assert.equal(registry.size, 1);
owner.prefix = 'Review';
assert.deepEqual(registry.render('Chapter 2'), ['Review: Chapter 2']);
assert.equal(detach(), true);
assert.equal(detach(), false);
assert.equal(registry.size, 0);
assert.deepEqual(registry.render('Chapter 2'), []);

const removeFirst = attachFormatter(registry, owner);
const removeSecond = attachFormatter(registry, owner);
assert.equal(registry.size, 2);
assert.deepEqual(registry.render('Appendix'), ['Review: Appendix', 'Review: Appendix']);
assert.equal(removeFirst(), true);
assert.equal(registry.size, 1);
assert.deepEqual(registry.render('Appendix'), ['Review: Appendix']);
assert.equal(removeFirst(), false);
assert.equal(removeSecond(), true);
assert.equal(registry.size, 0);

// If another path already removes the callback, cleanup returns false safely.
let externallyRegistered;
const externalRegistry = {
  add(callback) {
    externallyRegistered = callback;
  },
  delete(callback) {
    if (callback !== externallyRegistered) return false;
    externallyRegistered = null;
    return true;
  }
};
const externalCleanup = attachFormatter(externalRegistry, owner);
assert.equal(externalRegistry.delete(externallyRegistered), true);
assert.equal(externalCleanup(), false);
assert.equal(externalCleanup(), false);
console.log('Stable callback identity and cleanup: passed');
console.log('All binding challenge assertions passed.');
