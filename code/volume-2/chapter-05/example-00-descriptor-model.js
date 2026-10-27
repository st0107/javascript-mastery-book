'use strict';

const assert = require('node:assert/strict');

const settings = {};
Object.defineProperty(settings, 'version', { value: 1 });
let descriptor = Object.getOwnPropertyDescriptor(settings, 'version');
assert.deepEqual(descriptor, { value: 1, writable: false, enumerable: false, configurable: false });
descriptor.value = 2;
assert.equal(settings.version, 1);
assert.equal(Reflect.set(settings, 'version', 2), false);
assert.throws(() => { settings.version = 2; }, TypeError);
assert.equal(Reflect.defineProperty(settings, 'version', { value: 1 }), true);
assert.equal(Reflect.defineProperty(settings, 'version', { value: 2 }), false);
assert.throws(() => Object.defineProperty({}, 'mixed', { value: 1, get() { return 1; } }), TypeError);

Object.defineProperty(settings, 'retries', { value: 3, writable: true, enumerable: true, configurable: false });
assert.equal(Reflect.defineProperty(settings, 'retries', { value: 4 }), true);
assert.equal(Reflect.defineProperty(settings, 'retries', { writable: false }), true);
assert.equal(Reflect.defineProperty(settings, 'retries', { writable: true }), false);

const symbol = Symbol('revision');
settings[symbol] = 7;
assert.deepEqual(Object.keys(settings), ['retries']);
assert.deepEqual(Reflect.ownKeys(settings), ['version', 'retries', symbol]);
const clone = Object.create(Object.getPrototypeOf(settings), Object.getOwnPropertyDescriptors(settings));
assert.deepEqual(Object.getOwnPropertyDescriptors(clone), Object.getOwnPropertyDescriptors(settings));

const sealed = Object.seal({ count: 1 });
assert.equal(Reflect.set(sealed, 'count', 2), true);
assert.equal(Reflect.deleteProperty(sealed, 'count'), false);
assert.equal(Reflect.set(sealed, 'extra', 1), false);
assert.equal(Object.isFrozen(sealed), false);
Object.freeze(sealed);
assert.equal(Reflect.set(sealed, 'count', 3), false);
assert.equal(Object.isFrozen(sealed), true);

const source = { prefix: 'base', get label() { return this.prefix; } };
const proxy = new Proxy(source, { get(target, key, receiver) { return Reflect.get(target, key, receiver); } });
const child = Object.create(proxy);
Object.defineProperty(child, 'prefix', { value: 'child' });
assert.equal(child.label, 'child');
assert.equal(Reflect.get(source, 'label', { prefix: 'explicit' }), 'explicit');
assert.notEqual(proxy, source);

console.log(Object.keys(settings).join(','));
console.log(sealed.count, Object.isFrozen(sealed), child.label);
console.log('descriptor model assertions passed');
// Expected output:
// retries
// 2 true child
// descriptor model assertions passed
