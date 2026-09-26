'use strict';

const assert = require('node:assert/strict');
const vm = require('node:vm');

// Inherited non-writable data prevents assignment; explicit own definition differs.
const fixedPrototype = Object.defineProperty({}, 'limit', { value: 10 });
const record = Object.create(fixedPrototype);
assert.throws(() => { record.limit = 20; }, TypeError);
assert.equal(Object.hasOwn(record, 'limit'), false);
Object.defineProperty(record, 'limit', { value: 20 });
assert.equal(record.limit, 20);
assert.equal(fixedPrototype.limit, 10);

// An inherited setter receives the child. It need not create the assigned key.
const setterPrototype = {
  set units(value) { this.savedUnits = value; },
  get units() { return this.savedUnits; }
};
const child = Object.create(setterPrototype);
child.units = 7;
assert.equal(child.savedUnits, 7);
assert.equal(child.units, 7);
assert.equal(Object.hasOwn(child, 'units'), false);
assert.equal(Object.hasOwn(setterPrototype, 'savedUnits'), false);
const getterOnly = Object.create({ get units() { return 1; } });
assert.throws(() => { getterOnly.units = 2; }, TypeError);
console.log('inherited data and accessor assignment: passed');

let constructions = 0;
class Inventory {
  #units = 1;
  constructor() { constructions += 1; this.ready = true; }
  read() { return this.#units; }
}
const uninitialized = Object.create(Inventory.prototype);
assert.equal(constructions, 0);
assert.equal(uninitialized instanceof Inventory, true);
assert.equal(Object.hasOwn(uninitialized, 'ready'), false);
assert.throws(() => uninitialized.read(), TypeError);
const initialized = new Inventory();
assert.equal(constructions, 1);
assert.equal(initialized.read(), 1);
console.log('prototype links do not initialize instances: passed');

// Mutations stay confined to fresh local objects; no built-in prototype changes.
const parent = {};
const descendant = Object.create(parent);
assert.equal(Reflect.setPrototypeOf(parent, descendant), false);
assert.throws(() => Object.setPrototypeOf(parent, descendant), TypeError);
assert.equal(Object.getPrototypeOf(parent), Object.prototype);
const locked = Object.preventExtensions(Object.create(parent));
assert.equal(Reflect.setPrototypeOf(locked, parent), true); // Same link is allowed.
assert.equal(Reflect.setPrototypeOf(locked, null), false);
assert.throws(() => Object.setPrototypeOf(locked, null), TypeError);
console.log('cycles and non-extensible objects: passed');

const dictionary = Object.create(null);
dictionary.__proto__ = 'ordinary data';
dictionary.constructor = 17;
dictionary.hasOwnProperty = 'also data';
assert.equal(Object.getPrototypeOf(dictionary), null);
assert.equal(Object.hasOwn(dictionary, '__proto__'), true);
assert.equal(dictionary.__proto__, 'ordinary data');
assert.equal(dictionary.constructor, 17);
assert.throws(() => dictionary.hasOwnProperty('constructor'), TypeError);
const overridden = { hasOwnProperty: () => false, id: 'r-1' };
assert.equal(overridden.hasOwnProperty('id'), false);
assert.equal(Object.hasOwn(overridden, 'id'), true);
const parsed = JSON.parse('{"__proto__":{"marker":1}}');
assert.equal(Object.hasOwn(parsed, '__proto__'), true);
assert.equal(Object.getPrototypeOf(parsed), Object.prototype);
assert.equal(parsed.marker, undefined);
console.log('null-prototype keys and own-property checks: passed');

// Fixed trusted source creates a second realm; vm is not a security sandbox.
const foreignArray = vm.runInNewContext('[1, 2, 3]');
assert.equal(foreignArray instanceof Array, false);
assert.equal(Array.isArray(foreignArray), true);
const fakeArray = Object.create(Array.prototype);
assert.equal(fakeArray instanceof Array, true);
assert.equal(Array.isArray(fakeArray), false);
assert.equal(Array.isArray(new Proxy([], {})), true);
console.log('cross-realm and structural identity checks: passed');
console.log('prototype edge-case assertions passed');

// Expected output:
// inherited data and accessor assignment: passed
// prototype links do not initialize instances: passed
// cycles and non-extensible objects: passed
// null-prototype keys and own-property checks: passed
// cross-realm and structural identity checks: passed
// prototype edge-case assertions passed

// Fixed-size demonstrations. Checking a prototype link for a cycle may inspect
// a chain; ordinary property lookup conceptually follows the chain until a match.
