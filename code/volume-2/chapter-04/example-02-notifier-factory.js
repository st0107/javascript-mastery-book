'use strict';

const assert = require('node:assert/strict');

function createNotifier(channel, deliver) {
  if (typeof channel !== 'string' || channel.length < 1 || channel.length > 32 ||
      /[^a-z0-9-]/.test(channel)) {
    throw new TypeError('channel must contain 1-32 lowercase identifier characters');
  }
  if (typeof deliver !== 'function') throw new TypeError('deliver must be a function');
  let delivered = 0;
  let sending = false;

  function notify(event) {
    if (sending) throw new Error('reentrant notification is not supported');
    if (typeof event !== 'string' || event.length < 1 || event.length > 64 ||
        /[^a-z0-9.-]/.test(event)) {
      throw new TypeError('event must contain 1-64 lowercase event characters');
    }
    if (delivered === Number.MAX_SAFE_INTEGER) throw new RangeError('sequence exhausted');
    const record = Object.freeze({ channel, sequence: delivered + 1, event });
    sending = true;
    try {
      deliver(record); // The injected collaborator must complete synchronously.
      delivered += 1;
      return record;
    } finally {
      sending = false;
    }
  }

  return Object.freeze({ notify, readCount: () => delivered });
}

function runDemo() {
  const sink = {
    records: [],
    deliver(record) { this.records.push(record); }
  };
  const deliver = sink.deliver.bind(sink); // Adapt receiver once at composition time.
  const orders = createNotifier('orders', deliver);
  const support = createNotifier('support', deliver);
  const notifyOrder = orders.notify; // Closure API requires no call-site receiver.
  const first = notifyOrder('reservation.confirmed');
  support.notify('ticket.created');
  notifyOrder.call({ channel: 'wrong' }, 'reservation.cancelled');
  assert.deepEqual(sink.records, [
    { channel: 'orders', sequence: 1, event: 'reservation.confirmed' },
    { channel: 'support', sequence: 1, event: 'ticket.created' },
    { channel: 'orders', sequence: 2, event: 'reservation.cancelled' }
  ]);
  assert.equal(first, sink.records[0]);
  assert.equal(orders.readCount(), 2);
  assert.equal(support.readCount(), 1);
  assert.notEqual(orders.notify, support.notify);
  assert.equal(Object.isFrozen(orders), true);
  assert.equal(Object.isFrozen(first), true);
  assert.throws(() => { first.channel = 'other'; }, TypeError);

  for (const invalid of ['', 'bad\nevent', 'UPPER', null, 'a'.repeat(65)]) {
    assert.throws(() => orders.notify(invalid), TypeError);
  }
  assert.equal(orders.readCount(), 2);
  assert.equal(sink.records.length, 3);
  assert.throws(() => createNotifier('Bad Channel', deliver), TypeError);
  assert.throws(() => createNotifier('orders', null), TypeError);

  const failure = new Error('local sink unavailable');
  let shouldFail = true;
  const attempts = [];
  const recoverable = createNotifier('audit', record => {
    attempts.push(record);
    if (shouldFail) throw failure;
  });
  assert.throws(() => recoverable.notify('reservation.created'), error => error === failure);
  assert.equal(recoverable.readCount(), 0);
  shouldFail = false;
  assert.equal(recoverable.notify('reservation.created').sequence, 1);
  assert.equal(recoverable.readCount(), 1);
  assert.deepEqual(attempts.map(record => record.sequence), [1, 1]);

  // Guarding reentrancy prevents nested calls from taking the same next sequence.
  let recurse = true;
  const guarded = createNotifier('guarded', () => {
    if (recurse) guarded.notify('nested');
  });
  assert.throws(() => guarded.notify('outer'), /reentrant/);
  assert.equal(guarded.readCount(), 0);
  recurse = false;
  assert.equal(guarded.notify('outer').sequence, 1);

  // Extracting a receiver-dependent collaborator still needs an explicit adapter.
  const unadapted = createNotifier('broken', sink.deliver);
  assert.throws(() => unadapted.notify('test'), TypeError);
  assert.equal(unadapted.readCount(), 0);

  for (const record of sink.records) {
    console.log(`${record.channel} #${record.sequence} ${record.event}`);
  }
  console.log('notifier factory assertions passed');
}

if (require.main === module) runDemo();
module.exports = { createNotifier };

// Expected output:
// orders #1 reservation.confirmed
// support #1 ticket.created
// orders #2 reservation.cancelled
// notifier factory assertions passed

// Each factory retains O(1) bookkeeping and references. notify validates O(e)
// event characters (at most 64), then performs O(1) work excluding the sink.
// This demonstration's collecting sink retains O(n) records for n deliveries.
