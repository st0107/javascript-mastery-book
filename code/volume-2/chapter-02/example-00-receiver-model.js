'use strict';

// Run: node code/volume-2/chapter-02/example-00-receiver-model.js
const assert = require('node:assert/strict');

function receiver() {
  return this;
}

// An ordinary function receives this from the call, not its storage location.
const warehouse = { name: 'north', receiver };
assert.equal(receiver(), undefined);
assert.equal(warehouse.receiver(), warehouse);
const detached = warehouse.receiver;
assert.equal(detached(), undefined);
assert.equal(detached.call(warehouse), warehouse);
assert.equal(detached.apply(warehouse, []), warehouse);

// Strict ordinary functions preserve null, undefined, and primitive receivers.
for (const value of [null, undefined, 7, 'sku-1', false, 2n, Symbol('sku')]) {
  assert.equal(receiver.call(value), value);
  assert.equal(receiver.apply(value, []), value);
  assert.equal(receiver.bind(value)(), value);
}
console.log('plain, method, detached, call, and apply: passed');

function describe(prefix, quantity, suffix) {
  return `${prefix}${this.name}: ${quantity}${suffix}`;
}
assert.equal(describe.call(warehouse, '[', 3, ']'), '[north: 3]');
assert.equal(describe.apply(warehouse, ['[', 3, ']']), '[north: 3]');
assert.equal(describe.apply(warehouse, { 0: '[', 1: 3, 2: ']', length: 3 }),
  '[north: 3]');

const other = { name: 'south' };
const bound = describe.bind(warehouse, '[');
assert.equal(bound(3, ']'), '[north: 3]');
assert.equal(bound.call(other, 4, ']'), '[north: 4]');
const rebound = bound.bind(other, 5);
assert.equal(rebound(']'), '[north: 5]');
assert.notEqual(bound, describe.bind(warehouse, '['));
warehouse.name = 'north-updated';
assert.equal(bound(6, ']'), '[north-updated: 6]'); // A reference, not a snapshot.
console.log('bind identity, receiver, and partial arguments: passed');

function makeReader() {
  return (...items) => ({ owner: this, items });
}
const arrow = makeReader.call(warehouse);
assert.equal(arrow().owner, warehouse);
assert.equal(arrow.call(other).owner, warehouse);
assert.equal(arrow.apply(other, []).owner, warehouse);
const boundArrow = arrow.bind(other, 'first');
assert.deepEqual(boundArrow('second'), {
  owner: warehouse, items: ['first', 'second']
});
assert.throws(() => new boundArrow(), TypeError);
console.log('lexical arrow receiver: passed');

function Shipment(region, units) {
  this.region = region;
  this.units = units;
  this.target = new.target;
}
const ignoredReceiver = { region: 'unchanged' };
const NorthShipment = Shipment.bind(ignoredReceiver, 'north');
const shipment = new NorthShipment(8);
assert.equal(shipment.region, 'north');
assert.equal(shipment.units, 8);
assert.equal(shipment.target, Shipment);
assert.equal(shipment instanceof Shipment, true);
assert.equal(shipment instanceof NorthShipment, true);
assert.equal(Object.getPrototypeOf(shipment), Shipment.prototype);
assert.equal(Object.hasOwn(NorthShipment, 'prototype'), false);
assert.deepEqual(ignoredReceiver, { region: 'unchanged' });

// Binding cannot add construction support to a non-constructible target.
const methods = { ship() { return this; } };
assert.throws(() => new (methods.ship.bind(warehouse))(), TypeError);
console.log('bound constructor behavior: passed');
console.log('receiver model assertions passed');

// Expected output:
// plain, method, detached, call, and apply: passed
// bind identity, receiver, and partial arguments: passed
// lexical arrow receiver: passed
// bound constructor behavior: passed
// receiver model assertions passed
// All demonstrations use fixed-size data. For k forwarded arguments, argument
// assembly requires O(k) work and temporary storage in this conceptual model.
