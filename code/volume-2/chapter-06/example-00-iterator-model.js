'use strict';

const assert = require('node:assert/strict');

const iterable = {
  *[Symbol.iterator]() {
    yield 'T-10';
    yield 'T-11';
  }
};
const first = iterable[Symbol.iterator]();
const second = iterable[Symbol.iterator]();
assert.notEqual(first, second);
assert.equal(first[Symbol.iterator](), first);
assert.deepEqual(first.next(), { value: 'T-10', done: false });
assert.deepEqual([...first], ['T-11']);
assert.deepEqual([...first], []);
assert.deepEqual([...second], ['T-10', 'T-11']);
assert.deepEqual([...iterable], [...iterable]);
assert.throws(() => [...{ next() { return { done: true }; } }], TypeError);
assert.throws(() => [...{ [Symbol.iterator]() { return { next() { return 1; } }; } }], TypeError);

const events = [];
function* dialogue(label = (events.push('parameter'), 'ready')) {
  events.push('body');
  const reply = yield label;
  events.push(`reply:${reply}`);
  return 'finished';
}
const conversation = dialogue();
assert.deepEqual(events, ['parameter']);
assert.deepEqual(conversation.next('ignored'), { value: 'ready', done: false });
assert.deepEqual(events, ['parameter', 'body']);
assert.deepEqual(conversation.next('accepted'), { value: 'finished', done: true });
assert.deepEqual(events, ['parameter', 'body', 'reply:accepted']);
assert.deepEqual(conversation.next(), { value: undefined, done: true });
assert.deepEqual(conversation.return('later'), { value: 'later', done: true });
const lateError = new Error('late');
assert.throws(() => conversation.throw(lateError), error => error === lateError);

function* returnValue() { yield 1; return 2; }
assert.deepEqual([...returnValue()], [1]);

const cleanup = [];
function* source() {
  cleanup.push('open');
  try { yield 1; yield 2; }
  finally { cleanup.push('close'); }
}
for (const value of source()) { assert.equal(value, 1); break; }
assert.deepEqual(cleanup, ['open', 'close']);
cleanup.length = 0;
const consumerError = new Error('consumer');
assert.throws(() => {
  for (const value of source()) { assert.equal(value, 1); throw consumerError; }
}, error => error === consumerError);
assert.deepEqual(cleanup, ['open', 'close']);
cleanup.length = 0;
const manual = source();
manual.next();
assert.deepEqual(cleanup, ['open']);
assert.deepEqual(manual.return('cancelled'), { value: 'cancelled', done: true });
assert.deepEqual(cleanup, ['open', 'close']);
cleanup.length = 0;
assert.deepEqual(source().return('unstarted'), { value: 'unstarted', done: true });
assert.deepEqual(cleanup, []);

let closes = 0;
const producerError = new Error('producer');
const failing = {
  [Symbol.iterator]() { return this; },
  next() { throw producerError; },
  return() { closes += 1; return { done: true }; }
};
assert.throws(() => { for (const value of failing) void value; }, error => error === producerError);
assert.equal(closes, 0);

function* recover() {
  try { yield 'ready'; }
  catch (error) { yield error.message; }
  return 'recovered';
}
const recovery = recover();
assert.deepEqual(recovery.next(), { value: 'ready', done: false });
assert.deepEqual(recovery.throw(new Error('retry')), { value: 'retry', done: false });
assert.deepEqual(recovery.next(), { value: 'recovered', done: true });

function* pendingCleanup() {
  try { yield 'work'; }
  finally { yield 'cleanup step'; }
}
const delayed = pendingCleanup();
delayed.next();
assert.deepEqual(delayed.return('cancelled'), { value: 'cleanup step', done: false });
assert.deepEqual(delayed.next(), { value: 'cancelled', done: true });

function* inner() { const value = yield 'child'; return `ack:${value}`; }
function* outer() { yield 'start'; const result = yield* inner(); yield result; return 'end'; }
const delegated = outer();
assert.deepEqual(delegated.next(), { value: 'start', done: false });
assert.deepEqual(delegated.next(), { value: 'child', done: false });
assert.deepEqual(delegated.next('seen'), { value: 'ack:seen', done: false });
assert.deepEqual(delegated.next(), { value: 'end', done: true });

const delegatedCleanup = [];
function* child() { try { yield 1; } finally { delegatedCleanup.push('child'); } }
function* parent() { try { yield* child(); } finally { delegatedCleanup.push('parent'); } }
const controlled = parent();
controlled.next();
assert.deepEqual(controlled.return('stop'), { value: 'stop', done: true });
assert.deepEqual(delegatedCleanup, ['child', 'parent']);

let reentrant;
function* guarded() { assert.throws(() => reentrant.next(), TypeError); yield 'guarded'; }
reentrant = guarded();
assert.equal(reentrant.next().value, 'guarded');
assert.equal(reentrant.next().done, true);

function* readLabels(records) {
  for (let index = 0; index < records.length; index += 1) yield records[index].label;
}
const records = [{ label: 'queued' }, { label: 'waiting' }];
const left = readLabels(records);
const right = readLabels(records);
assert.equal(left.next().value, 'queued');
assert.equal(right.next().value, 'queued');
records[1].label = 'done';
assert.equal(left.next().value, 'done');
assert.equal(right.next().value, 'done');
assert.equal(left.next().done, true);
assert.equal(right.next().done, true);

console.log('Iterator and generator model assertions passed.');
// Expected output:
// Iterator and generator model assertions passed.
