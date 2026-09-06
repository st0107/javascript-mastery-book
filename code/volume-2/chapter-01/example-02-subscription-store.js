'use strict';

const assert = require('node:assert/strict');

function createSubscriptionStore(initialValue) {
  let value = initialValue;
  let notifying = false;
  const subscriptions = new Set();

  function read() {
    return value;
  }

  function subscribe(listener) {
    if (typeof listener !== 'function') {
      throw new TypeError('listener must be a function');
    }
    // Each call is a separate registration, including calls with the same fn.
    const subscription = { listener };
    subscriptions.add(subscription);
    return function unsubscribe() {
      subscriptions.delete(subscription);
    };
  }

  function update(nextValue) {
    if (notifying) {
      throw new Error('update cannot run during notification');
    }
    if (Object.is(value, nextValue)) return value;

    const previousValue = value;
    const snapshot = [...subscriptions];
    const errors = [];
    value = nextValue;
    notifying = true;
    try {
      for (const { listener } of snapshot) {
        try {
          listener(nextValue, previousValue);
        } catch (error) {
          errors.push(error);
        }
      }
    } finally {
      notifying = false;
    }
    if (errors.length > 0) {
      throw new AggregateError(errors, 'Subscriber notification failed');
    }
    return value;
  }

  return Object.freeze({ read, subscribe, update });
}

function runAssertions() {
  const store = createSubscriptionStore(0);
  const independentStore = createSubscriptionStore(0);
  assert.deepEqual(Object.keys(store), ['read', 'subscribe', 'update']);
  assert.equal(Object.isFrozen(store), true);
  assert.throws(() => store.subscribe(null), TypeError);

  const events = [];
  const stop = store.subscribe((next, previous) => {
    events.push([next, previous, store.read()]);
  });
  assert.equal(store.update(1), 1);
  store.update(1);
  assert.deepEqual(events, [[1, 0, 1]]);
  assert.equal(independentStore.read(), 0);
  stop();
  stop();
  store.update(2);
  assert.equal(events.length, 1);

  const snapshotStore = createSubscriptionStore(0);
  const order = [];
  let stopSecond;
  snapshotStore.subscribe(next => {
    order.push(`first:${next}`);
    if (next === 1) {
      stopSecond();
      snapshotStore.subscribe(value => order.push(`late:${value}`));
    }
  });
  stopSecond = snapshotStore.subscribe(next => order.push(`second:${next}`));
  snapshotStore.update(1);
  snapshotStore.update(2);
  assert.deepEqual(order, ['first:1', 'second:1', 'first:2', 'late:2']);

  const duplicateStore = createSubscriptionStore(0);
  let duplicateCalls = 0;
  const sharedListener = () => { duplicateCalls += 1; };
  const stopOne = duplicateStore.subscribe(sharedListener);
  const stopTwo = duplicateStore.subscribe(sharedListener);
  duplicateStore.update(1);
  stopOne();
  stopOne();
  duplicateStore.update(2);
  stopTwo();
  duplicateStore.update(3);
  assert.equal(duplicateCalls, 3);

  const failingStore = createSubscriptionStore('before');
  const failure = new Error('render failed');
  const notifications = [];
  const stopFailure = failingStore.subscribe(() => { throw failure; });
  const stopOtherFailure = failingStore.subscribe(() => { throw 'legacy failure'; });
  failingStore.subscribe(next => notifications.push(next));
  assert.throws(() => failingStore.update('after'), error => {
    assert.ok(error instanceof AggregateError);
    assert.deepEqual(error.errors, [failure, 'legacy failure']);
    return true;
  });
  assert.equal(failingStore.read(), 'after');
  assert.deepEqual(notifications, ['after']);
  stopFailure();
  stopOtherFailure();
  failingStore.update('recovered'); // The notification guard resets after errors.
  assert.deepEqual(notifications, ['after', 'recovered']);

  const nestedStore = createSubscriptionStore(0);
  const nestedSeen = [];
  const stopNested = nestedStore.subscribe(() => nestedStore.update(2));
  nestedStore.subscribe(next => nestedSeen.push([next, nestedStore.read()]));
  assert.throws(() => nestedStore.update(1), error => {
    assert.ok(error instanceof AggregateError);
    assert.match(error.errors[0].message, /during notification/);
    return true;
  });
  assert.equal(nestedStore.read(), 1);
  assert.deepEqual(nestedSeen, [[1, 1]]);
  stopNested();
  nestedStore.update(2);
  assert.equal(nestedStore.read(), 2);

  const numberStore = createSubscriptionStore(NaN);
  let numberNotifications = 0;
  numberStore.subscribe(() => { numberNotifications += 1; });
  numberStore.update(NaN);
  assert.equal(numberNotifications, 0);
  numberStore.update(+0);
  numberStore.update(-0);
  assert.equal(numberNotifications, 2);
  assert.equal(Object.is(numberStore.read(), -0), true);

  const object = { theme: 'light' };
  const objectStore = createSubscriptionStore(object);
  let objectNotifications = 0;
  objectStore.subscribe(() => { objectNotifications += 1; });
  assert.equal(objectStore.read(), object); // No defensive copy is promised.
  object.theme = 'dark'; // Deliberate misuse: same-reference mutation is silent.
  objectStore.update(object);
  assert.equal(objectNotifications, 0);
  assert.equal(objectStore.read().theme, 'dark');
  objectStore.update({ ...object, theme: 'light' });
  assert.equal(objectNotifications, 1);
}

function runDemo() {
  const preferences = createSubscriptionStore('light');
  const unsubscribe = preferences.subscribe((next, previous) => {
    console.log(`panel ${previous} -> ${next}`);
  });
  preferences.update('dark');
  preferences.update('dark');
  unsubscribe();
  unsubscribe();
  console.log(`current ${preferences.read()}`);
  runAssertions();
  console.log('subscription store assertions passed');
}

if (require.main === module) runDemo();
module.exports = { createSubscriptionStore };

// Expected output:
// panel light -> dark
// current dark
// subscription store assertions passed
// read and unchanged updates: O(1). Changed updates: O(s) bookkeeping time
// and O(s) temporary space for s subscriptions, plus listener execution cost.
// Registry storage: O(s), excluding values and objects retained by listeners.
// Set insertion/deletion are commonly expected O(1); ECMAScript specifies
// average sublinear access rather than a particular hashing implementation.
// Subscriber contract: synchronous callbacks only; returned promises are ignored.
