'use strict';

const assert = require('node:assert/strict');

assert.throws(() => {
  void typeof BeforeDeclaration;
  class BeforeDeclaration {}
}, ReferenceError);
class MustConstruct {}
assert.throws(() => MustConstruct(), TypeError);
assert.throws(() => MustConstruct.call({}), TypeError);
console.log('class TDZ and construction-only calls: passed');

let setterCalls = 0;
class SetterBase {
  set label(value) { setterCalls += 1; this.savedLabel = value; }
}
class FieldChild extends SetterBase { label = 'field'; }
class AssignmentChild extends SetterBase {
  constructor() { super(); this.label = 'assignment'; }
}
const field = new FieldChild();
assert.equal(setterCalls, 0);
assert.equal(Object.hasOwn(field, 'label'), true);
assert.deepEqual(Object.getOwnPropertyDescriptor(field, 'label'), {
  value: 'field', writable: true, enumerable: true, configurable: true
});
const assignment = new AssignmentChild();
assert.equal(setterCalls, 1);
assert.equal(Object.hasOwn(assignment, 'label'), false);
assert.equal(assignment.savedLabel, 'assignment');
console.log('public field definition versus assignment: passed');

class CallsOverride {
  constructor() { this.read(); }
}
class TooEarly extends CallsOverride {
  #value = 1;
  read() { return this.#value; }
}
assert.throws(() => new TooEarly(), TypeError);
class Overwrites {
  constructor() { this.label = 'base assignment'; }
}
class Reinitializes extends Overwrites { label = 'derived field'; }
assert.equal(new Reinitializes().label, 'derived field');
class BeforeSuper extends Overwrites {
  constructor() { this.label = 'too early'; super(); }
}
assert.throws(() => new BeforeSuper(), ReferenceError);
console.log('derived initialization order: passed');

class PrivateCounter {
  #value = 0;
  increment() { this.#value += 1; return this.#value; }
}
const counter = new PrivateCounter();
const extracted = counter.increment;
assert.throws(() => extracted(), TypeError);
assert.throws(() => extracted.call({}), TypeError);
assert.throws(() => new Proxy(counter, {}).increment(), TypeError);
Object.freeze(counter);
assert.equal(counter.increment(), 1); // Ordinary property freezing does not freeze #value.
assert.deepEqual(Object.keys(counter), []);
console.log('private receiver checks and freezing: passed');

class Settings {
  static #value = 7;
  static throughReceiver() { return this.#value; }
  static throughOwner() { return Settings.#value; }
}
class ChildSettings extends Settings {}
assert.equal(Settings.throughReceiver(), 7);
assert.throws(() => ChildSettings.throughReceiver(), TypeError);
assert.equal(ChildSettings.throughOwner(), 7);
console.log('static private inheritance: passed');

class BaseReturnsPrimitive { constructor() { return 7; } }
assert.equal(new BaseReturnsPrimitive() instanceof BaseReturnsPrimitive, true);
class BaseReturnsObject { constructor() { return { replacement: true }; } }
assert.deepEqual(new BaseReturnsObject(), { replacement: true });
assert.equal(new BaseReturnsObject() instanceof BaseReturnsObject, false);
class DerivedReturnsPrimitive extends MustConstruct { constructor() { super(); return 7; } }
assert.throws(() => new DerivedReturnsPrimitive(), TypeError);
class ReturnsObjectWithoutSuper extends MustConstruct {
  field = 'never initialized';
  constructor() { return { replacement: true }; }
}
const replacement = new ReturnsObjectWithoutSuper();
assert.deepEqual(replacement, { replacement: true });
assert.equal(Object.hasOwn(replacement, 'field'), false);
assert.equal(replacement instanceof ReturnsObjectWithoutSuper, false);
console.log('constructor return rules: passed');
console.log('class edge-case assertions passed');

// Expected output:
// class TDZ and construction-only calls: passed
// public field definition versus assignment: passed
// derived initialization order: passed
// private receiver checks and freezing: passed
// static private inheritance: passed
// constructor return rules: passed
// class edge-case assertions passed

// Fixed-size examples. No built-in prototype or global state is modified.
