'use strict';
const assert = require('node:assert/strict');

assert.equal(twice(3), 6);
function twice(value) { return value * 2; }
const alias = twice;
assert.equal(alias, twice);
assert.equal(alias(4), 8);
function choose(value = 10) { return value; }
assert.equal(choose(), 10);
assert.equal(choose(undefined), 10);
assert.equal(choose(null), null);
assert.equal(choose(0), 0);
function collect(...values) { return values; }
assert.deepEqual(collect(1, 2), [1, 2]);
assert.deepEqual(collect(), []);
const expression = n => n + 1;
const block = n => { n + 1; };
assert.equal(expression(2), 3);
assert.equal(block(2), undefined);
assert.throws(() => new expression(), TypeError);

const original = { count: 1 };
function revise(record) {
  record.count += 1;
  record = { count: 99 };
  return record;
}
assert.equal(revise(original).count, 99);
assert.equal(original.count, 2);
const trace = [];
function argument(n) { trace.push(n); return n; }
function add(a, b) { trace.push('body'); return a + b; }
assert.equal(add(argument(1), argument(2)), 3);
assert.deepEqual(trace, [1, 2, 'body']);
function later(a = b, b = 2) { return a + b; }
assert.throws(() => later(), ReferenceError);
assert.equal(later(1), 3);
function fresh(values = []) { values.push('x'); return values; }
assert.notEqual(fresh(), fresh());
console.log('function model assertions passed');
// Expected output:
// function model assertions passed
