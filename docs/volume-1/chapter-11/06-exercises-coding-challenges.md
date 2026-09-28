# Exercises and Coding Challenges

Run ES module solutions as `.mjs` files. Import-based solutions belong beside the supplied chapter libraries. The companion `example-03-module-challenges.mjs` adds failure and identity assertions for all six exercises.

## Exercise 1: Expose a Bounded Calculation

Write an exported `doubleScore` function accepting integer scores from 0 through 50. Reject strings and out-of-range values with RangeError. Return the doubled number without logging inside the function.

**Hint:** An export does not change the function's validation obligations.

```js
// Runtime: Node.js ES module
export function doubleScore(score) {
  if (!Number.isInteger(score) || score < 0 || score > 50) {
    throw new RangeError('score must be an integer from 0 through 50');
  }
  return score * 2;
}
console.log(doubleScore(21));
// Expected output:
// 42

// Time O(1); additional space O(1).
```

**Alternative:** Keep the function local if no other module needs it. Exporting every helper increases the interface that future changes must preserve.

## Exercise 2: Alias an Import

Import the production quote function as `calculate`. Compute the total for two items at 175 cents each. Do not duplicate the validation logic in the caller.

**Hint:** Rename the local binding with `as` inside a named import.

```js
// Runtime: Node.js ES module
import { quoteLine as calculate } from './pricing.mjs';
console.log(calculate(175, 2).totalCents);
// Expected output:
// 350

// Time O(1); additional space O(1).
```

**Alternative:** Import a namespace when grouping several related exports improves readability. An alias does not change the exported interface name.

## Exercise 3: Give Callers Independent State

Write an exported factory `createSequence` that returns a function yielding 1, then 2, and so on. Each factory call must own its state. Throw RangeError when the next value would exceed Number.MAX_SAFE_INTEGER.

**Hint:** Put the counter inside the factory body, not at module top level.

```js
// Runtime: Node.js ES module
export function createSequence() {
  let last = 0;
  return function next() {
    if (last === Number.MAX_SAFE_INTEGER) throw new RangeError('sequence exhausted');
    last += 1;
    return last;
  };
}
const first = createSequence();
const second = createSequence();
console.log(first(), first(), second());
// Expected output:
// 1 2 1

// Time O(1) per call; retained space O(1) per sequence.
```

**Alternative:** A deliberately shared module counter fits a different contract. This example is process-local and does not guarantee unique IDs across machines or restarts. Testing every value to exhaustion is impractical; review the bound or parameterize a limit when exhaustive boundary testing is needed.

## Exercise 4: Separate Construction From Effects

Write `createAnnouncer(write)`. It validates a synchronous writer and returns a function accepting a non-empty string of at most 40 characters. Calling that function writes `ready:` plus the name once and returns the line. Construction and invalid calls must not write anything.

**Hint:** Keep write inside the returned function, after validation.

```js
// Runtime: Node.js ES module
export function createAnnouncer(write) {
  if (typeof write !== 'function') throw new TypeError('writer required');
  return function announce(name) {
    if (typeof name !== 'string' || name.length === 0 || name.length > 40) {
      throw new TypeError('name must have 1 through 40 characters');
    }
    const line = `ready:${name}`;
    write(line);
    return line;
  };
}
const lines = [];
const announce = createAnnouncer(line => lines.push(line));
console.log(lines.length);
announce('worker');
console.log(lines[0]);
// Expected output:
// 0
// ready:worker

// Time and additional space O(1) under the name bound, excluding the writer.
```

**Alternative:** Return a line from a pure formatter and let the caller write it. Choose a command factory only when retaining the writer simplifies repeated calls.

## Exercise 5: Preserve an Export Alias

Model a CommonJS export with a record containing an `exports` property. A second variable initially aliases that property value. Add a ready flag through the alias, then replace the exported value with a function. Show that replacing the record's property does not redirect the old alias.

**Hint:** Assignment changes one binding or property, not all references to the previous object.

```js
'use strict';
const record = { exports: {} };
const alias = record.exports;
alias.ready = true;
record.exports = () => 'started';
console.log(alias.ready);
console.log(record.exports());
console.log(alias === record.exports);
// Expected output:
// true
// started
// false

// Time O(1); additional space O(1).
```

**Alternative:** Mutating properties of the initial export object preserves its identity. Replacing module.exports is appropriate when the whole public value should be a function or another object.

## Exercise 6: Treat Dynamic Loading as Fallible

Implement `loadBasename` as an async exported function. It dynamically imports Node's path built-in and returns the POSIX basename of `/logs/run.txt`. Await the result at the caller. No filesystem read is needed.

**Hint:** Import resolves to a namespace, not directly to a basename string.

```js
// Runtime: Node.js ES module
export async function loadBasename() {
  const path = await import('node:path');
  return path.posix.basename('/logs/run.txt');
}
console.log(await loadBasename());
// Expected output:
// run.txt

// Fixed input: O(1) application work; module loading cost belongs to the host.
```

**Alternative:** Use a static import when the dependency is always needed. Dynamic loading is justified by a conditional boundary, not by a belief that it automatically improves throughput. The companion also awaits a deliberately missing module and checks the resulting failure.

## Review Your Solutions

Check the interface name, execution mode, initial state, number of effects, and failure behavior separately. A function body can be correct while its caller imports the wrong name. Conversely, successful linking does not prove that its argument validation works.
