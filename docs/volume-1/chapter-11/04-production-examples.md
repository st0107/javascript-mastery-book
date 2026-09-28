# Production Examples

## A Calculation Library With an Explicit Interface

An order system needs a line quote without reading environment variables, printing logs, or starting network requests when imported. The `pricing.mjs` library accepts integer cents from zero through 1,000,000 and integer quantities from zero through 1,000. Their product stays within safe integer range. It returns a fresh flat record and rejects coerced strings, negative values, and fractional values.

```js
// Runtime: Node.js ES module
export function quoteLine(unitCents, quantity) {
  if (!Number.isInteger(unitCents) || unitCents < 0 || unitCents > 1_000_000) {
    throw new RangeError('unitCents must be an integer from 0 through 1000000');
  }
  if (!Number.isInteger(quantity) || quantity < 0 || quantity > 1_000) {
    throw new RangeError('quantity must be an integer from 0 through 1000');
  }
  return { unitCents, quantity, totalCents: unitCents * quantity };
}
// Expected output:
// (none)

// Time O(1); additional space O(1).
```

The entry file is the place for execution and assertions:

```js
// Runtime: Node.js ES module
import assert from 'node:assert/strict';
import { quoteLine } from './pricing.mjs';
const first = quoteLine(250, 3);
assert.deepEqual(first, { unitCents: 250, quantity: 3, totalCents: 750 });
assert.notStrictEqual(first, quoteLine(250, 3));
assert.equal(quoteLine(1_000_000, 1_000).totalCents, 1_000_000_000);
assert.equal(quoteLine(0, 0).totalCents, 0);
for (const bad of ['250', null, NaN, Infinity, -1, 1.5, 1_000_001]) {
  assert.throws(() => quoteLine(bad, 1), RangeError);
}
for (const bad of ['3', undefined, -1, 0.5, 1_001]) {
  assert.throws(() => quoteLine(250, bad), RangeError);
}
console.log(JSON.stringify(first));
console.log('quote assertions passed');
// Expected output:
// {"unitCents":250,"quantity":3,"totalCents":750}
// quote assertions passed
```

Stored entry: `code/volume-1/chapter-11/example-01-quote.mjs`. This is a bounded quote calculation, not a tax, currency-conversion, or payment-settlement implementation. Naming the unit in the interface prevents an accidental cents-versus-units conversion.

## Explicit Startup With an Injected Output

A report module should be importable by a test without printing a report. `reporting.mjs` exposes a factory that validates a trusted synchronous writer and returns a command. The command validates all arguments before writing exactly once. A writer failure propagates unchanged; there is no retry that could duplicate an external effect.

```js
// Runtime: Node.js ES module
import { quoteLine } from './pricing.mjs';
export function createReport(write) {
  if (typeof write !== 'function') throw new TypeError('write must be a function');
  return function report(unitCents, quantity) {
    const quote = quoteLine(unitCents, quantity);
    const line = `items=${quote.quantity}; totalCents=${quote.totalCents}`;
    write(line);
    return quote;
  };
}
// Expected output:
// (none)

// Time O(1), excluding the writer; additional space O(1) under the numeric bounds.
```

The factory performs no output when constructed. The returned command decides when the effect occurs:

```js
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
```

Stored entry: `code/volume-1/chapter-11/example-02-report.mjs`. A promise-returning writer is outside this synchronous contract. An asynchronous version must await the writer and define rejection behavior; simply accepting an async callback would allow the command to report success too early.

## Review the Boundary

The dependency graph is entry -> reporting -> pricing. Pricing depends on no application state. Reporting depends on pricing and a writer supplied at construction. Tests import the same implementations used by the entries, so an assertion cannot accidentally validate a separate copy of the library.

Keep configuration parsing at startup and pass validated values inward. Avoid reading changing environment variables at arbitrary import time. An explicit `start(config)` or factory call gives tests and applications control over initialization order and failure handling.
