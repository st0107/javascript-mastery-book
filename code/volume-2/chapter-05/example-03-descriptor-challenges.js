'use strict';

// Each scope executes one complete exercise solution and its assertions.

// Exercise 1
{
  'use strict';
  const assert = require('node:assert/strict');
  
  function createRecord(id) {
    if (typeof id !== 'string' || !/^R-\d{1,6}$/.test(id)) {
      throw new TypeError('Expected R- followed by one to six digits');
    }
    const record = {};
    Object.defineProperty(record, 'id', {
      value: id, enumerable: true, writable: false, configurable: false
    });
    record.state = 'queued';
    return record;
  }
  
  const record = createRecord('R-7');
  assert.throws(() => createRecord(7), TypeError);
  assert.throws(() => { record.id = 'R-8'; }, TypeError);
  assert.equal(Reflect.deleteProperty(record, 'id'), false);
  record.state = 'done';
  assert.equal(record.state, 'done');
  console.log(Object.keys(record).join(','));
  const descriptor = Object.getOwnPropertyDescriptor(record, 'id');
  console.log(record.id, descriptor.writable, descriptor.configurable);
  
  // Expected output:
  // id,state
  // R-7 false false
}

// Exercise 2
{
  'use strict';
  const assert = require('node:assert/strict');
  
  function copyRecordDescriptors(source) {
    if (source === null || typeof source !== 'object') throw new TypeError('Expected a record');
    const prototype = Object.getPrototypeOf(source);
    if (prototype !== Object.prototype && prototype !== null) throw new TypeError('Unsupported record');
    return Object.create(prototype, Object.getOwnPropertyDescriptors(source));
  }
  
  let reads = 0;
  const tag = Symbol('tag');
  const source = { count: 2, items: [] };
  Object.defineProperty(source, 'double', {
    get() { reads += 1; return this.count * 2; }, enumerable: false, configurable: true
  });
  Object.defineProperty(source, tag, { value: 'internal' });
  Object.preventExtensions(source);
  const copy = copyRecordDescriptors(source);
  assert.equal(reads, 0);
  assert.equal(Object.getPrototypeOf(copy), Object.prototype);
  assert.equal(copy.items, source.items);
  assert.deepEqual(Object.getOwnPropertyDescriptor(copy, tag), Object.getOwnPropertyDescriptor(source, tag));
  assert.equal(Object.isExtensible(copy), true);
  assert.throws(() => copyRecordDescriptors([]), TypeError);
  console.log(reads, Object.keys(copy).includes('double'), copy.items === source.items);
  copy.count = 3;
  console.log(copy.double, source.double, reads);
  
  // Expected output:
  // 0 false true
  // 6 4 2
}

// Exercise 3
{
  'use strict';
  const assert = require('node:assert/strict');
  
  function createQuota(limit) {
    if (!Number.isSafeInteger(limit) || limit < 0 || limit > 1_000_000) {
      throw new RangeError('Invalid limit');
    }
    let remaining = limit;
    return Object.freeze({
      get remaining() { return remaining; },
      set remaining(next) {
        if (!Number.isSafeInteger(next) || next < 0 || next > limit) {
          throw new RangeError('Invalid remaining amount');
        }
        remaining = next;
      }
    });
  }
  
  const quota = createQuota(5);
  assert.equal(Reflect.set(quota, 'remaining', 3), true);
  assert.throws(() => { quota.remaining = -1; }, RangeError);
  assert.throws(() => { quota.remaining = '2'; }, RangeError);
  assert.throws(() => { quota.extra = true; }, TypeError);
  assert.throws(() => createQuota(Infinity), RangeError);
  assert.equal(quota.remaining, 3);
  console.log(Object.isFrozen(quota), quota.remaining);
  console.log(typeof Object.getOwnPropertyDescriptor(quota, 'remaining').set);
  
  // Expected output:
  // true 3
  // function
}

// Exercise 4
{
  'use strict';
  const assert = require('node:assert/strict');
  
  function traceReads(target, events) {
    return new Proxy(target, {
      get(object, key, receiver) {
        events.push(key);
        return Reflect.get(object, key, receiver);
      }
    });
  }
  
  const events = [];
  const target = { prefix: 'base', get label() { return this.prefix + '!'; } };
  const proxy = traceReads(target, events);
  const child = Object.create(proxy);
  Object.defineProperty(child, 'prefix', { value: 'child' });
  assert.equal(child.label, 'child!');
  assert.deepEqual(events, ['label']);
  events.length = 0;
  console.log(child.label, proxy.label);
  console.log(events.join(','));
  assert.equal(Reflect.get(proxy, 'label', { prefix: 'explicit' }), 'explicit!');
  
  // Expected output:
  // child! base!
  // label,label,prefix
}

// Exercise 5
{
  'use strict';
  const assert = require('node:assert/strict');
  
  function filteredKeys(target) {
    return new Proxy(target, {
      ownKeys(object) {
        const keys = Reflect.ownKeys(object);
        if (!Reflect.isExtensible(object)) return keys;
        return keys.filter(key => typeof key !== 'string' || !key.startsWith('_') ||
          !Reflect.getOwnPropertyDescriptor(object, key).configurable);
      }
    });
  }
  
  const tag = Symbol('tag');
  const target = { visible: 1, _draft: 'work' };
  Object.defineProperty(target, '_fixed', { value: 2, enumerable: true });
  target[tag] = 3;
  const view = filteredKeys(target);
  assert.deepEqual(Reflect.ownKeys(view), ['visible', '_fixed', tag]);
  assert.equal(view._draft, 'work');
  console.log(Reflect.ownKeys(view).map(String).join(','));
  Object.preventExtensions(target);
  assert.deepEqual(Reflect.ownKeys(view), Reflect.ownKeys(target));
  console.log(Reflect.ownKeys(view).length, view._draft);
  
  // Expected output:
  // visible,_fixed,Symbol(tag)
  // 4 work
}

// Exercise 6
{
  'use strict';
  const assert = require('node:assert/strict');
  
  function createCounterLease(initial) {
    function validate(value) {
      if (!Number.isSafeInteger(value) || value < 0 || value > 100) {
        throw new RangeError('Count must be an integer from 0 through 100');
      }
    }
    validate(initial);
    const target = Object.assign(Object.create(null), { count: initial });
    const { proxy, revoke } = Proxy.revocable(target, {
      set(object, key, value) {
        if (key !== 'count') return false;
        validate(value);
        return Reflect.set(object, key, value, object);
      },
      defineProperty() { return false; },
      deleteProperty() { return false; },
      setPrototypeOf() { return false; },
      preventExtensions() { return false; }
    });
    return Object.freeze({ view: proxy, revoke });
  }
  
  const { view, revoke } = createCounterLease(2);
  view.count += 1;
  assert.throws(() => { view.count = 101; }, RangeError);
  assert.equal(view.count, 3);
  assert.throws(() => Object.defineProperty(view, 'count', { value: 7 }), TypeError);
  assert.equal(Reflect.deleteProperty(view, 'count'), false);
  assert.equal(Reflect.setPrototypeOf(view, {}), false);
  assert.equal(Reflect.preventExtensions(view), false);
  console.log(view.count, Reflect.set(view, 'other', 1));
  const saved = view.count;
  revoke();
  revoke();
  assert.throws(() => view.count, TypeError);
  assert.throws(() => Reflect.ownKeys(view), TypeError);
  console.log(saved, 'revoked');
  
  // Expected output:
  // 3 false
  // 3 revoked
}

console.log('descriptor challenge assertions passed');
