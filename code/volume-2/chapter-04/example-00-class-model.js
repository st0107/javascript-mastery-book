'use strict';

const assert = require('node:assert/strict');

class Counter {
  static category = 'counter';
  label;
  events = [];
  #value = 0;

  constructor(label) { this.label = label; }
  increment() { this.#value += 1; return this.#value; }
  read() { return this.#value; }
  callback = () => this.#value;
  static accepts(value) { return value !== null && typeof value === 'object' && #value in value; }
}

const north = new Counter('north');
const south = new Counter('south');
assert.equal(Object.getPrototypeOf(north), Counter.prototype);
assert.equal(Object.getPrototypeOf(Counter), Function.prototype);
assert.equal(north.increment, south.increment);
assert.equal(Object.hasOwn(north, 'increment'), false);
assert.equal(Object.getOwnPropertyDescriptor(Counter.prototype, 'increment').enumerable, false);
assert.equal(Object.hasOwn(north, 'label'), true);
assert.equal(Object.hasOwn(north, 'events'), true);
assert.notEqual(north.events, south.events);
assert.notEqual(north.callback, south.callback);
assert.equal(Object.hasOwn(Counter, 'category'), true);
assert.equal(north.category, undefined);
assert.equal(north.increment(), 1);
assert.equal(south.read(), 0);
assert.equal(Counter.accepts(north), true);
assert.equal(Counter.accepts(Object.create(Counter.prototype)), false);
assert.deepEqual(Object.keys(north), ['label', 'events', 'callback']);
north['#value'] = 99; // An unrelated public string property.
assert.equal(north.read(), 1);
const callback = north.callback;
assert.equal(callback.call(south), 1);
const read = north.read;
assert.throws(() => read(), TypeError);
console.log('class ownership, private state, and shared methods: passed');

const initialization = [];
class Base {
  baseField = (initialization.push('base field'), 1);
  constructor() { initialization.push('base constructor'); }
  describe() { return this.baseField; }
  static type() { return this.name; }
}
class Derived extends Base {
  derivedField = (initialization.push('derived field'), 2);
  constructor() {
    initialization.push('before super');
    super();
    initialization.push('after super');
  }
}
const derived = new Derived();
assert.deepEqual(initialization, [
  'before super', 'base field', 'base constructor', 'derived field', 'after super'
]);
assert.equal(derived.describe(), 1);
assert.equal(derived.derivedField, 2);
assert.equal(Object.getPrototypeOf(Derived), Base);
assert.equal(Object.getPrototypeOf(Derived.prototype), Base.prototype);
assert.equal(Derived.type(), 'Derived');
console.log(`initialization: ${initialization.join(' -> ')}`);

// Static fields initialize at class evaluation; instances do not rerun them.
let staticRuns = 0;
class Catalog {
  static version = (++staticRuns, 1);
  static { this.version += 1; }
}
assert.equal(staticRuns, 1);
new Catalog();
new Catalog();
assert.equal(staticRuns, 1);
assert.equal(Catalog.version, 2);
console.log('static initialization: passed');
console.log('class model assertions passed');

// Expected output:
// class ownership, private state, and shared methods: passed
// initialization: before super -> base field -> base constructor -> derived field -> after super
// static initialization: passed
// class model assertions passed

// Fixed-size demonstrations; each Counter allocates its own events array and
// arrow function, while prototype methods are shared among its instances.
