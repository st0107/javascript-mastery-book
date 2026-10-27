'use strict';

const assert = require('node:assert/strict');

const nested = Object.freeze({ options: { enabled: false } });
nested.options.enabled = true;
assert.equal(nested.options.enabled, true);
let stored = 0;
const accessor = Object.freeze({ get value() { return stored; }, set value(next) { stored = next; } });
accessor.value = 3;
assert.equal(accessor.value, 3);
class Counter { #value = 0; increment() { return ++this.#value; } }
const counter = Object.freeze(new Counter());
assert.equal(counter.increment(), 1);
const map = Object.freeze(new Map());
map.set('ready', true);
assert.equal(map.get('ready'), true);
assert.throws(() => Object.freeze(new Uint8Array(1)), TypeError);
assert.equal(Object.isFrozen(new Uint8Array(0)), false);
assert.equal(Object.isFrozen(Object.freeze(new Uint8Array(0))), true);

const fixed = Object.freeze({ token: 'original' });
const lying = new Proxy(fixed, { get() { return 'replacement'; } });
assert.throws(() => lying.token, TypeError);
assert.throws(() => Reflect.ownKeys(new Proxy(fixed, { ownKeys() { return []; } })), TypeError);
const mutable = { count: 1 };
const accepting = new Proxy(mutable, { set() { return true; } });
accepting.count = 2;
assert.equal(mutable.count, 1);

const events = [];
const target = { count: 1 };
const proxy = new Proxy(target, {
  set(object, key, value, receiver) {
    events.push('set');
    return Reflect.set(object, key, value, receiver);
  },
  defineProperty(object, key, descriptor) {
    events.push('define');
    return Reflect.defineProperty(object, key, descriptor);
  }
});
proxy.count = 2;
assert.deepEqual(events, ['set', 'define']);
assert.equal(target.count, 2);

const mapProxy = new Proxy(new Map(), {});
assert.throws(() => mapProxy.size, TypeError);
assert.throws(() => mapProxy.set('a', 1), TypeError);
const classProxy = new Proxy(new Counter(), {});
assert.throws(() => classProxy.increment(), TypeError);

let reads = 0;
const original = { get count() { reads += 1; return 5; } };
Object.defineProperty(original, 'hidden', { value: 'metadata', enumerable: false });
const descriptors = Object.getOwnPropertyDescriptors(original);
assert.equal(reads, 0);
const copied = { ...original };
assert.equal(reads, 1);
assert.equal(copied.count, 5);
assert.equal(Object.hasOwn(copied, 'hidden'), false);
assert.equal(typeof descriptors.count.get, 'function');
assert.equal(Object.getOwnPropertyDescriptor(copied, 'count').writable, true);

console.log(nested.options.enabled, accessor.value, map.get('ready'));
console.log(events.join(','), mutable.count);
console.log('descriptor edge-case assertions passed');
// Expected output:
// true 3 true
// set,define 1
// descriptor edge-case assertions passed
