// Runtime: Node.js ES module
import assert from 'node:assert/strict';
import { createReport } from './reporting.mjs';
const lines = [];
const report = createReport(line => lines.push(line));
assert.equal(lines.length, 0);
assert.equal(report(125, 4).totalCents, 500);
assert.deepEqual(lines, ['items=4; totalCents=500']);
assert.throws(() => report('125', 4), RangeError);
assert.equal(lines.length, 1);
assert.throws(() => createReport(null), TypeError);
const failure = new Error('writer unavailable');
const broken = createReport(() => { throw failure; });
assert.throws(() => broken(1, 1), error => error === failure);
console.log(lines[0]);
console.log('report assertions passed');
// Expected output:
// items=4; totalCents=500
// report assertions passed
