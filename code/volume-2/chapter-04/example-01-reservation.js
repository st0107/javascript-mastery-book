'use strict';

const assert = require('node:assert/strict');

function readDataRecord(value, keys, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value) ||
      Reflect.ownKeys(value).length !== keys.length) {
    throw new TypeError(`${label} has an invalid shape`);
  }
  const result = Object.create(null);
  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !Object.hasOwn(descriptor, 'value')) {
      throw new TypeError(`${label}.${key} must be an own data property`);
    }
    result[key] = descriptor.value;
  }
  return result;
}

function copyLines(lines) {
  if (!Array.isArray(lines) || lines.length < 1 || lines.length > 100) {
    throw new TypeError('lines must contain 1-100 entries');
  }
  const seen = new Set();
  return Array.from({ length: lines.length }, (_, index) => {
    const entry = Object.getOwnPropertyDescriptor(lines, String(index));
    if (!entry || !Object.hasOwn(entry, 'value')) {
      throw new TypeError('lines must contain own data entries without holes');
    }
    const line = entry.value;
    const { sku, units } = readDataRecord(line, ['sku', 'units'], 'line');
    if (typeof sku !== 'string' || sku.length < 1 || sku.length > 32 || /[^A-Z0-9-]/.test(sku)) {
      throw new TypeError('sku must contain 1-32 uppercase identifier characters');
    }
    if (!Number.isSafeInteger(units) || units < 1 || units > 10000) {
      throw new TypeError('units must be an integer from 1 through 10000');
    }
    if (seen.has(sku)) throw new TypeError('duplicate sku');
    seen.add(sku);
    return Object.freeze({ sku, units });
  });
}

class Reservation {
  #id;
  #lines;
  #status = 'draft';

  constructor(id, lines) {
    if (typeof id !== 'string' || id.length < 1 || id.length > 64 || /[^A-Za-z0-9_-]/.test(id)) {
      throw new TypeError('id must contain 1-64 identifier characters');
    }
    this.#id = id;
    this.#lines = Object.freeze(copyLines(lines));
  }

  confirm() {
    if (this.#status !== 'draft') throw new Error('only draft reservations can be confirmed');
    this.#status = 'confirmed';
    return this.#status;
  }

  cancel() {
    if (this.#status === 'cancelled') return false;
    this.#status = 'cancelled';
    return true;
  }

  snapshot() {
    return Object.freeze({
      version: 1,
      id: this.#id,
      status: this.#status,
      lines: Object.freeze(this.#lines.map(line => Object.freeze({ ...line })))
    });
  }

  static fromDTO(dto) {
    const { version, id, status, lines } = readDataRecord(
      dto, ['version', 'id', 'status', 'lines'], 'reservation'
    );
    if (version !== 1) throw new TypeError('unsupported reservation version');
    if (!['draft', 'confirmed', 'cancelled'].includes(status)) {
      throw new TypeError('invalid reservation status');
    }
    const reservation = new Reservation(id, lines);
    reservation.#status = status;
    return reservation;
  }
}

function runDemo() {
  const input = [{ sku: 'SKU-17', units: 2 }];
  const first = new Reservation('r-17', input);
  const second = new Reservation('r-42', input);
  input[0].units = 999;
  input.push({ sku: 'SKU-42', units: 1 });
  assert.deepEqual(first.snapshot().lines, [{ sku: 'SKU-17', units: 2 }]);
  assert.deepEqual(second.snapshot().lines, [{ sku: 'SKU-17', units: 2 }]);
  assert.equal(first.confirm(), 'confirmed');
  assert.equal(second.snapshot().status, 'draft');
  assert.throws(() => first.confirm(), /only draft/);
  const snapshot = first.snapshot();
  assert.equal(Object.isFrozen(snapshot), true);
  assert.equal(Object.isFrozen(snapshot.lines), true);
  assert.equal(Object.isFrozen(snapshot.lines[0]), true);
  assert.throws(() => { snapshot.lines[0].units = 1; }, TypeError);
  assert.throws(() => snapshot.lines.push({ sku: 'SKU-99', units: 1 }), TypeError);
  assert.throws(() => { snapshot.status = 'draft'; }, TypeError);
  assert.notEqual(snapshot.lines, first.snapshot().lines);

  // Serialization moves data. Explicit hydration validates and installs private state.
  const plain = JSON.parse(JSON.stringify(snapshot));
  assert.equal(plain instanceof Reservation, false);
  const restored = Reservation.fromDTO(plain);
  assert.equal(restored instanceof Reservation, true);
  assert.deepEqual(restored.snapshot(), snapshot);
  plain.lines[0].units = 10;
  assert.equal(restored.snapshot().lines[0].units, 2);
  assert.equal(restored.cancel(), true);
  assert.equal(restored.cancel(), false);
  assert.equal(first.snapshot().status, 'confirmed');
  assert.throws(() => restored.confirm(), /only draft/);
  assert.equal(second.cancel(), true); // Draft -> cancelled is allowed.

  // Ordinary property names cannot update private state.
  first.status = 'draft';
  first['#status'] = 'draft';
  assert.equal(first.snapshot().status, 'confirmed');
  assert.throws(() => Reservation.prototype.snapshot.call({}), TypeError);
  assert.throws(() => Object.create(Reservation.prototype).snapshot(), TypeError);

  const valid = { version: 1, id: 'valid', status: 'draft', lines: [{ sku: 'SKU-1', units: 1 }] };
  for (const change of [
    { version: 2 }, { status: 'shipped' }, { id: '' }, { lines: [] }, { lines: new Array(1) },
    { lines: [{ sku: 'sku', units: 1 }] }, { lines: [{ sku: 'SKU-1', units: 0 }] },
    { lines: [{ sku: 'SKU-1', units: 10001 }] },
    { lines: [{ sku: 'SKU-1', units: 1 }, { sku: 'SKU-1', units: 2 }] },
    { lines: [{ sku: 'SKU-1', units: 1, extra: true }] }, { extra: true }
  ]) {
    assert.throws(() => Reservation.fromDTO({ ...valid, ...change }), TypeError);
  }
  assert.throws(() => Reservation.fromDTO(Object.create(valid)), TypeError);
  assert.throws(() => Reservation.fromDTO(null), TypeError);
  let getterCalls = 0;
  const accessorDTO = { ...valid, get status() { getterCalls += 1; return 'draft'; } };
  assert.throws(() => Reservation.fromDTO(accessorDTO), TypeError);
  assert.equal(getterCalls, 0);
  assert.throws(() => new Reservation('bad\n', valid.lines), TypeError);

  console.log(`original ${first.snapshot().id} ${first.snapshot().status}`);
  console.log(`restored ${restored.snapshot().id} ${restored.snapshot().status}`);
  console.log('reservation assertions passed');
}

if (require.main === module) runDemo();
module.exports = { Reservation };

// Expected output:
// original r-17 confirmed
// restored r-17 cancelled
// reservation assertions passed

// Construction, hydration, and snapshot: O(n) time and space for n bounded lines,
// treating bounded identifier validation and Set operations as constant-time.
// confirm and cancel: O(1) time and additional space.
