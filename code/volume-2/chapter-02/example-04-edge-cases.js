'use strict';

const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');

// Parentheses preserve a property reference; the comma operator discards it.
const warehouse = {
  label: 'north',
  read() { return this; }
};
assert.equal((warehouse.read)(), warehouse);
assert.equal(warehouse.read?.(), warehouse);
assert.equal(warehouse?.read(), warehouse);
assert.equal((0, warehouse.read)(), undefined);
const detached = warehouse.read;
assert.equal(detached?.(), undefined);
assert.equal(null?.read(), undefined);
assert.throws(() => ({ read: 1 }).read?.(), TypeError);
console.log('references and optional calls: passed');

class Counter {
  #count = 0;

  increment() {
    this.#count += 1;
    return this.#count;
  }

  arrowIncrement = () => {
    this.#count += 1;
    return this.#count;
  };
}
const first = new Counter();
const second = new Counter();
assert.equal(first.increment, second.increment); // Shared prototype method.
assert.notEqual(first.arrowIncrement, second.arrowIncrement); // Per-instance arrows.
assert.equal(first.increment.call(second), 1); // Correct private-field brand.
assert.throws(() => first.increment.call({}), TypeError);
assert.throws(() => first.increment.call(Object.create(Counter.prototype)), TypeError);
assert.equal(first.arrowIncrement.call(second), 1); // Still the first instance.
const arrowCallback = first.arrowIncrement;
assert.equal(arrowCallback(), 2);
const methodCallback = first.increment;
assert.throws(() => methodCallback(), TypeError);
assert.equal(methodCallback.bind(second)(), 2);
console.log('class fields and private brands: passed');

const lookup = new Map([['sku-1', 4]]);
const get = lookup.get;
assert.throws(() => get('sku-1'), TypeError);
assert.throws(() => get.call({ 'sku-1': 4 }, 'sku-1'), TypeError);
assert.equal(get.call(lookup, 'sku-1'), 4);
assert.equal(get.bind(lookup)('sku-1'), 4);
// A transparent-looking Proxy does not acquire Map's internal slots.
assert.throws(() => new Proxy(lookup, {}).get('sku-1'), TypeError);
assert.deepEqual(Array.prototype.slice.call({ 0: 'sku-1', length: 1 }), ['sku-1']);
console.log('generic methods and built-in brands: passed');

function receiverAndArgs(...args) {
  return { receiver: this, args };
}
assert.deepEqual(receiverAndArgs.apply(warehouse, null), { receiver: warehouse, args: [] });
assert.deepEqual(receiverAndArgs.apply(warehouse, undefined), { receiver: warehouse, args: [] });
assert.throws(() => Reflect.apply(receiverAndArgs, warehouse, null), TypeError);
const iterable = new Set(['a', 'b']);
assert.deepEqual(receiverAndArgs.apply(warehouse, iterable).args, []); // No length.
assert.deepEqual(receiverAndArgs.call(warehouse, ...iterable).args, ['a', 'b']);
assert.throws(() => receiverAndArgs.apply(warehouse, 'ab'), TypeError);
console.log('array-like and iterable arguments: passed');

// Host/API-specific callbacks may deliberately supply an ordinary-function this.
const source = new EventEmitter();
let eventReceiver;
function listener() { eventReceiver = this; }
source.on('shipment', listener);
source.emit('shipment');
assert.equal(eventReceiver, source);
source.off('shipment', listener);

let lexicalReceiver;
function makeListener() { return () => { lexicalReceiver = this; }; }
const lexicalListener = makeListener.call(warehouse);
source.on('shipment', lexicalListener);
source.emit('shipment');
assert.equal(lexicalReceiver, warehouse);
source.off('shipment', lexicalListener);
assert.equal(source.listenerCount('shipment'), 0);

const quantities = [1, 2].map(function (units) { return units * this.factor; }, { factor: 3 });
assert.deepEqual(quantities, [3, 6]);
console.log('callback receiver contracts: passed');
console.log('receiver edge-case assertions passed');

// Expected output:
// references and optional calls: passed
// class fields and private brands: passed
// generic methods and built-in brands: passed
// array-like and iterable arguments: passed
// callback receiver contracts: passed
// receiver edge-case assertions passed
// Fixed-size demonstrations; Array#map generally uses O(n) result storage and
// O(n) callback invocations for n present elements in a dense input array.
