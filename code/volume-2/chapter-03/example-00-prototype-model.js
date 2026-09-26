'use strict';

const assert = require('node:assert/strict');

// Lookup stops at the first matching own property, even if its value is undefined.
const defaults = { region: 'north', enabled: true };
const shipment = Object.create(defaults);
shipment.id = 's-17';
assert.equal(Object.getPrototypeOf(shipment), defaults);
assert.equal(shipment.region, 'north');
assert.equal(Object.hasOwn(shipment, 'region'), false);
assert.equal('region' in shipment, true);
shipment.region = 'south';
assert.equal(Object.hasOwn(shipment, 'region'), true);
assert.equal(defaults.region, 'north');
delete shipment.region;
assert.equal(shipment.region, 'north');
shipment.region = undefined;
assert.equal(shipment.region, undefined);
assert.equal(Object.hasOwn(shipment, 'region'), true);
delete shipment.region;
assert.deepEqual(Object.keys(shipment), ['id']);
console.log('lookup, shadowing, deletion, and ownership: passed');

const reportPrototype = {
  describe() { return `${this.name}: ${this.units}`; },
  get doubled() { return this.units * 2; }
};
const first = Object.assign(Object.create(reportPrototype), { name: 'north', units: 3 });
const second = Object.assign(Object.create(reportPrototype), { name: 'south', units: 5 });
assert.equal(first.describe, second.describe);
assert.equal(first.describe(), 'north: 3');
assert.equal(second.describe(), 'south: 5');
assert.equal(first.doubled, 6);
assert.equal(second.doubled, 10);
assert.equal(Object.hasOwn(first, 'doubled'), false);
const detached = first.describe;
assert.throws(() => detached(), TypeError);
assert.equal(detached.call(second), 'south: 5');
console.log('inherited method and getter receivers: passed');

function Record(id) { this.id = id; }
Record.prototype.kind = 'old';
const originalPrototype = Record.prototype;
const oldRecord = new Record('old');
assert.equal(Object.getPrototypeOf(oldRecord), originalPrototype);
assert.equal(Object.getPrototypeOf(Record), Function.prototype);
assert.notEqual(Object.getPrototypeOf(Record), Record.prototype);
assert.equal(oldRecord.constructor, Record);
assert.equal(Object.hasOwn(oldRecord, 'constructor'), false);

Record.prototype = { kind: 'new' }; // Only this local constructor is changed.
const newRecord = new Record('new');
assert.equal(oldRecord.kind, 'old');
assert.equal(newRecord.kind, 'new');
assert.equal(Object.getPrototypeOf(oldRecord), originalPrototype);
assert.equal(Object.getPrototypeOf(newRecord), Record.prototype);
assert.equal(oldRecord instanceof Record, false);
assert.equal(newRecord instanceof Record, true);
assert.equal(newRecord.constructor, Object); // A lookup, not creation history.
console.log('constructor prototype and existing-instance links: passed');

class BaseRecord {
  read() { return this.id; }
  static category() { return this.name; }
}
class DeliveryRecord extends BaseRecord {
  constructor(id) { super(); this.id = id; }
}
const delivery = new DeliveryRecord('d-9');
assert.equal(Object.getPrototypeOf(delivery), DeliveryRecord.prototype);
assert.equal(Object.getPrototypeOf(DeliveryRecord.prototype), BaseRecord.prototype);
assert.equal(Object.getPrototypeOf(DeliveryRecord), BaseRecord);
assert.equal(delivery.read(), 'd-9');
assert.equal(DeliveryRecord.category(), 'DeliveryRecord');
assert.equal(delivery instanceof DeliveryRecord, true);
assert.equal(delivery instanceof BaseRecord, true);
console.log('class instance and static chains: passed');
console.log('prototype model assertions passed');

// Expected output:
// lookup, shadowing, deletion, and ownership: passed
// inherited method and getter receivers: passed
// constructor prototype and existing-instance links: passed
// class instance and static chains: passed
// prototype model assertions passed

// A conceptual lookup visits O(d) objects for chain depth d. Engines may optimize
// the operation; these examples make no timing or allocation guarantee.
