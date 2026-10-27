'use strict';

const assert = require('node:assert/strict');

function createProgressView(jobId) {
  if (typeof jobId !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(jobId)) {
    throw new TypeError('jobId must contain 1-64 identifier characters');
  }
  const target = Object.assign(Object.create(null), { jobId, state: 'queued', progress: 0 });
  let released = false;
  const deny = () => false;
  const { proxy, revoke } = Proxy.revocable(target, {
    get(object, key, receiver) { return Reflect.get(object, key, receiver); },
    set: deny,
    defineProperty: deny,
    deleteProperty: deny,
    setPrototypeOf: deny,
    preventExtensions: deny
  });

  return Object.freeze({
    view: proxy,
    advance(next) {
      if (released) throw new Error('Progress view has been released');
      if (!Number.isInteger(next) || next < target.progress || next > 100) {
        throw new RangeError('Progress must be a nondecreasing integer through 100');
      }
      target.progress = next;
      target.state = next === 100 ? 'complete' : next === 0 ? 'queued' : 'running';
      return next;
    },
    release() {
      if (released) return false;
      released = true;
      revoke();
      return true;
    }
  });
}

const owner = createProgressView('export-17');
const view = owner.view;
assert.equal(Object.getPrototypeOf(view), null);
assert.equal(Object.isExtensible(view), true);
assert.deepEqual(Reflect.ownKeys(view), ['jobId', 'state', 'progress']);
assert.equal(view.progress, 0);
assert.equal(Reflect.set(view, 'progress', 99), false);
assert.throws(() => { view.progress = 99; }, TypeError);
assert.equal(Reflect.defineProperty(view, 'progress', { value: 99 }), false);
assert.equal(Reflect.deleteProperty(view, 'jobId'), false);
assert.equal(Reflect.setPrototypeOf(view, null), false);
assert.equal(Reflect.preventExtensions(view), false);
assert.throws(() => Object.freeze(view), TypeError);
assert.equal(view.progress, 0);

const descriptor = Object.getOwnPropertyDescriptor(view, 'progress');
descriptor.value = 99;
assert.equal(view.progress, 0);
const advance = owner.advance;
assert.equal(advance(25), 25);
assert.equal(view.state, 'running');
console.log(view.jobId, view.state, view.progress);
for (const next of [-1, 24, 25.5, 101, NaN, Infinity, '50']) {
  assert.throws(() => owner.advance(next), RangeError);
  assert.equal(view.progress, 25);
}
assert.equal(owner.advance(100), 100);
assert.equal(view.state, 'complete');
const saved = view.progress;
assert.equal(owner.release(), true);
assert.equal(owner.release(), false);
assert.throws(() => view.progress, TypeError);
assert.throws(() => Reflect.ownKeys(view), TypeError);
assert.throws(() => Object.getPrototypeOf(view), TypeError);
assert.throws(() => owner.advance(100), /released/);
assert.equal(typeof view, 'object');
assert.equal(view === view, true);
assert.equal(saved, 100);
assert.throws(() => createProgressView(''), TypeError);
assert.throws(() => createProgressView('x'.repeat(65)), TypeError);
assert.equal(createProgressView('x'.repeat(64)).view.jobId.length, 64);
console.log(saved, typeof view, view === view);
console.log('revocable view assertions passed');
// Expected output:
// export-17 running 25
// 100 object true
// revocable view assertions passed

// Fixed-schema operations use O(1) time and space under ordinary-object assumptions.
