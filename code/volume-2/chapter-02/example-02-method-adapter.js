'use strict';

const assert = require('node:assert/strict');

function monitorSyncMethod(target) {
  if (typeof target !== 'function') throw new TypeError('target must be a function');
  const counts = { calls: 0, returned: 0, threw: 0 };

  function monitored(...args) {
    if (new.target) throw new TypeError('monitored methods cannot be constructors');
    counts.calls += 1;
    try {
      const result = Reflect.apply(target, this, args);
      counts.returned += 1;
      return result;
    } catch (error) {
      counts.threw += 1;
      throw error;
    }
  }

  return Object.freeze({
    method: monitored,
    readCounts: () => Object.freeze({ ...counts })
  });
}

class StockLedger {
  #available;

  constructor(name, available) {
    if (typeof name !== 'string' || name.length === 0) {
      throw new TypeError('name must be a nonempty string');
    }
    if (!Number.isSafeInteger(available) || available < 0) {
      throw new TypeError('available must be a nonnegative safe integer');
    }
    this.name = name;
    this.#available = available;
  }

  reserve(units) {
    if (!Number.isSafeInteger(units) || units <= 0) {
      throw new TypeError('units must be a positive safe integer');
    }
    if (units > this.#available) throw new RangeError('insufficient stock');
    this.#available -= units;
    return `${this.name} reserved ${units}`;
  }

  read() {
    return this.#available;
  }
}

function runDemo() {
  const monitor = monitorSyncMethod(StockLedger.prototype.reserve);
  const north = new StockLedger('north', 10);
  const south = new StockLedger('south', 5);
  north.reserve = monitor.method;
  south.reserve = monitor.method;

  console.log(north.reserve(3));
  console.log(south.reserve(2));
  assert.throws(() => south.reserve(99), RangeError);
  assert.equal(north.read(), 7);
  assert.equal(south.read(), 3);
  assert.deepEqual(monitor.readCounts(), { calls: 3, returned: 2, threw: 1 });
  const counts = monitor.readCounts();
  console.log(`calls ${counts.calls} returned ${counts.returned} threw ${counts.threw}`);

  // Extraction still needs a receiver; the wrapper did not bind one secretly.
  const detached = north.reserve;
  assert.throws(() => detached(1), TypeError);
  assert.equal(detached.call(south, 1), 'south reserved 1');
  assert.throws(() => detached.call({}, 1), TypeError); // Private-field brand check.
  const callback = north.reserve.bind(north);
  assert.equal(callback.call(south, 1), 'north reserved 1');
  assert.equal(north.read(), 6);
  assert.equal(south.read(), 2);

  // Return identity and error identity are preserved, not converted or swallowed.
  const value = Object.freeze({ reservationId: 'r-17' });
  const returns = monitorSyncMethod(function (first, second) {
    assert.equal(this, north);
    assert.deepEqual([first, second], ['sku-1', 2]);
    return value;
  });
  assert.equal(returns.method.call(north, 'sku-1', 2), value);
  const failure = new Error('inventory unavailable');
  const throws = monitorSyncMethod(() => { throw failure; });
  assert.throws(() => throws.method(), error => error === failure);
  assert.deepEqual(throws.readCounts(), { calls: 1, returned: 0, threw: 1 });

  // This is a synchronous-call monitor: returning a promise counts as returned.
  const promise = Promise.resolve(value);
  const returnsPromise = monitorSyncMethod(() => promise);
  assert.equal(returnsPromise.method(), promise);
  assert.deepEqual(returnsPromise.readCounts(), { calls: 1, returned: 1, threw: 0 });

  // Capturing the method now differs from looking it up on every later call.
  const service = { read() { return `old ${this.version}`; }, version: 1 };
  const captured = service.read.bind(service);
  const live = (...args) => service.read(...args);
  service.read = function () { return `new ${this.version}`; };
  service.version = 2;
  assert.equal(captured(), 'old 2');
  assert.equal(live(), 'new 2');

  // Reflect.apply does not depend on an own property named apply on the target.
  function customized() { return this; }
  customized.apply = () => { throw new Error('must not be called'); };
  assert.equal(monitorSyncMethod(customized).method.call(north), north);
  assert.throws(() => monitorSyncMethod(null), TypeError);
  const beforeConstruction = monitor.readCounts();
  assert.throws(() => new monitor.method(1), TypeError);
  assert.deepEqual(monitor.readCounts(), beforeConstruction);
  assert.ok(Object.isFrozen(monitor.readCounts()));
  console.log('method adapter assertions passed');
}

if (require.main === module) runDemo();
module.exports = { monitorSyncMethod, StockLedger };

// Expected output:
// north reserved 3
// south reserved 2
// calls 3 returned 2 threw 1
// method adapter assertions passed
// Per invocation: O(k) argument collection for k arguments, plus target work.
// The wrapper holds O(1) counters and one target reference; arguments are temporary.
