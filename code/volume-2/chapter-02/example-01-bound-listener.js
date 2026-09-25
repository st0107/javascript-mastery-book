'use strict';

const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');

class ShipmentCounter {
  #source;
  #sink;
  #listener;
  #active = false;
  #units = 0;

  constructor(source, sink) {
    if (!(source instanceof EventEmitter)) {
      throw new TypeError('source must be an EventEmitter');
    }
    if (typeof sink !== 'function') throw new TypeError('sink must be a function');
    this.#source = source;
    this.#sink = sink;
    this.#listener = this.#onShipment.bind(this); // Allocate once per owner.
  }

  start() {
    if (this.#active) return false;
    this.#source.on('shipped', this.#listener);
    this.#active = true;
    return true;
  }

  stop() {
    if (!this.#active) return false;
    this.#active = false;
    this.#source.off('shipped', this.#listener); // The original function object.
    return true;
  }

  read() {
    return this.#units;
  }

  #onShipment(event) {
    // A listener removed during an ongoing emit may still be called by Node.
    if (!this.#active) return;
    if (event === null || typeof event !== 'object') {
      throw new TypeError('shipment must be an object');
    }
    const { units } = event;
    if (!Number.isSafeInteger(units) || units <= 0) {
      throw new TypeError('shipment units must be a positive safe integer');
    }
    const total = this.#units + units;
    if (!Number.isSafeInteger(total)) throw new RangeError('total exceeds safe integers');

    this.#units = total; // Commit before reporting; a sink failure does not undo it.
    const sink = this.#sink;
    sink(Object.freeze({ added: units, total })); // Sink needs no receiver.
  }
}

function runDemo() {
  const source = new EventEmitter();
  const records = [];
  const counter = new ShipmentCounter(source, record => records.push(record));

  try {
    assert.equal(counter.start(), true);
    const firstListener = source.listeners('shipped')[0];
    assert.equal(counter.start(), false);
    assert.equal(source.listenerCount('shipped'), 1);
    source.emit('shipped', { units: 3 });
    source.emit('shipped', { units: 2 });
    assert.equal(counter.read(), 5);

    for (const invalid of [null, {}, { units: 0 }, { units: -1 }, { units: 1.5 }]) {
      assert.throws(() => source.emit('shipped', invalid), TypeError);
    }
    assert.equal(counter.read(), 5);
    assert.equal(records.length, 2);
    assert.ok(records.every(Object.isFrozen));

    assert.equal(counter.stop(), true);
    assert.equal(counter.stop(), false);
    assert.equal(source.listenerCount('shipped'), 0);
    assert.equal(source.emit('shipped', { units: 100 }), false);

    for (let cycle = 0; cycle < 3; cycle += 1) {
      assert.equal(counter.start(), true);
      assert.equal(source.listeners('shipped')[0], firstListener);
      source.emit('shipped', { units: 1 });
      assert.equal(counter.stop(), true);
      assert.equal(source.listenerCount('shipped'), 0);
    }
    assert.equal(counter.read(), 8);
  } finally {
    counter.stop();
  }

  // Reporting failure propagates unchanged; explicit cleanup still runs.
  const failure = new Error('reporting unavailable');
  const failing = new ShipmentCounter(source, () => { throw failure; });
  try {
    failing.start();
    assert.throws(() => source.emit('shipped', { units: 4 }), error => error === failure);
    assert.equal(failing.read(), 4);
  } finally {
    failing.stop();
  }
  assert.equal(source.listenerCount('shipped'), 0);

  // Two owners get separate bound functions and can stop independently.
  const first = new ShipmentCounter(source, () => {});
  const second = new ShipmentCounter(source, () => {});
  try {
    first.start();
    second.start();
    assert.notEqual(...source.listeners('shipped'));
    first.stop();
    source.emit('shipped', { units: 2 });
    assert.equal(first.read(), 0);
    assert.equal(second.read(), 2);
  } finally {
    first.stop();
    second.stop();
  }

  // Stop during dispatch: the active guard rejects an already-snapshotted call.
  const interrupted = new ShipmentCounter(source, () => {});
  const stopper = () => interrupted.stop();
  source.on('shipped', stopper);
  try {
    interrupted.start();
    source.emit('shipped', { units: 7 });
    assert.equal(interrupted.read(), 0);
  } finally {
    interrupted.stop();
    source.off('shipped', stopper);
  }

  const capped = new ShipmentCounter(source, () => {});
  try {
    capped.start();
    source.emit('shipped', { units: Number.MAX_SAFE_INTEGER });
    assert.throws(() => source.emit('shipped', { units: 1 }), RangeError);
    assert.equal(capped.read(), Number.MAX_SAFE_INTEGER);
  } finally {
    capped.stop();
  }
  assert.equal(source.listenerCount('shipped'), 0);
  assert.throws(() => new ShipmentCounter({}, () => {}), TypeError);
  assert.throws(() => new ShipmentCounter(source, null), TypeError);

  console.log(`shipment total ${counter.read()}`);
  console.log(`listeners after cleanup ${source.listenerCount('shipped')}`);
  console.log('bound listener assertions passed');
}

if (require.main === module) runDemo();
module.exports = { ShipmentCounter };

// Expected output:
// shipment total 8
// listeners after cleanup 0
// bound listener assertions passed
// Per accepted event: O(1) counter work and storage, excluding the sink.
// Each instance keeps one bound function. Removal may scan O(l) listeners.
// This demo's collecting sink intentionally stores O(n) records for n events.
