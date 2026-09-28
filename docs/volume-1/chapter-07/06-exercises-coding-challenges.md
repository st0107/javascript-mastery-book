# Exercises and Coding Challenges

Try each problem before reading its solution. All solution blocks run independently in Node.js 20+. The companion assertions are in `code/volume-1/chapter-07/example-03-function-challenges.js`.

## Exercise 1: Return a Result Instead of Only Logging

**Requirements:** Write `formatRun(id, status = 'queued')`. Accept a nonempty string ID and one of `queued`, `running`, or `done`. Return `id:status` without logging inside the function. Reject invalid status and ID with `TypeError`.

**Hint:** A default handles undefined; it does not validate a supplied value.

```js
'use strict';
function formatRun(id, status = 'queued') {
  if (typeof id !== 'string' || id.length === 0 ||
      !['queued', 'running', 'done'].includes(status)) throw new TypeError('Invalid run');
  return `${id}:${status}`;
}
console.log(formatRun('R1'));
console.log(formatRun('R1', 'done'));
try { formatRun('R1', null); } catch (error) { console.log(error.name); }
// Expected output:
// R1:queued
// R1:done
// TypeError
```

**Explanation:** All successful branches return a string; output is the caller's decision. Formatting takes O(L) result work for label length L. A fixed status list has bounded lookup cost. An object of options may be preferable if the signature gains many independent settings.

## Exercise 2: Keep Mutation Out of a Status Change

**Requirements:** Given a trusted flat record `{ id, status }` whose fields are strings, implement `finish(record)` returning a new `{ id, status: 'done' }` record. Do not change the argument or retain additional fields. Demonstrate both identity and value behavior.

**Hint:** A new outer object is sufficient because the selected values are strings.

```js
'use strict';
function finish(record) { return { id: record.id, status: 'done' }; }
const before = { id: 'R1', status: 'running' };
const after = finish(before);
console.log(before.status, after.status);
console.log(before === after);
// Expected output:
// running done
// false
```

**Explanation:** The new record preserves the selected identifier and replaces state without writing through the shared input reference. This fixed shape needs O(1) bookkeeping. For nested records, define which nested values should be copied rather than calling every outer copy a deep clone.

## Exercise 3: Collect and Validate Rest Arguments

**Requirements:** Implement `sumScores(...scores)`. Accept zero or more integer scores from 0 to 100, at most 100 scores. Return their sum, using zero for no arguments. Reject an invalid count or score with `RangeError`.

**Hint:** The rest parameter is an array; loop over it rather than recursively calling the function.

```js
'use strict';
function sumScores(...scores) {
  if (scores.length > 100) throw new RangeError('Too many scores');
  let total = 0;
  for (const score of scores) {
    if (!Number.isInteger(score) || score < 0 || score > 100) throw new RangeError('Invalid score');
    total += score;
  }
  return total;
}
console.log(sumScores(), sumScores(10, 20, 30));
try { sumScores(10, '20'); } catch (error) { console.log(error.name); }
// Expected output:
// 0 60
// RangeError
```

**Explanation:** The limits keep the total below 10,001, well within exact Number integer arithmetic. Work is O(n); rest collection retains O(n) values, while loop bookkeeping is O(1). If callers already hold a large array, an array-taking API avoids spreading it into arguments.

## Exercise 4: Adapt an Extra Callback Argument

**Requirements:** Implement `parseTwo(first, second)` for trusted decimal strings. A supplied helper `applyTwo` calls its callback with `(value, index)`. Use `parseInt` with radix 10 deliberately, and show why passing it directly gives an unwanted result.

**Hint:** The index is not the intended radix.

```js
'use strict';
function applyTwo(a, b, callback) { return [callback(a, 0), callback(b, 1)]; }
function parseTwo(a, b) { return applyTwo(a, b, value => Number.parseInt(value, 10)); }
console.log(applyTwo('10', '10', Number.parseInt).join(','));
console.log(parseTwo('10', '10').join(','));
// Expected output:
// 10,NaN
// 10,10
```

**Explanation:** The first direct call uses radix zero's inferred behavior; the second uses invalid radix one and returns NaN. The wrapper ignores the index and supplies ten. Parsing costs O(L) in the input characters examined. This exercise assumes trusted strings; strict external numeric parsing also needs syntax and range validation.

## Exercise 5: Inject a Deterministic Clock

**Requirements:** `stamp(id, now)` accepts a string ID and a synchronous zero-argument function returning a nonnegative safe-integer timestamp. Call the clock once and return `{ id, at }`; reject bad input or return values with `TypeError`. Do not call `Date.now` internally.

**Hint:** Validate the callable before invoking it; validate its result before constructing the output.

```js
'use strict';
function stamp(id, now) {
  if (typeof id !== 'string' || typeof now !== 'function') throw new TypeError('Invalid dependency');
  const at = now();
  if (!Number.isSafeInteger(at) || at < 0) throw new TypeError('Invalid timestamp');
  return { id, at };
}
let calls = 0;
console.log(JSON.stringify(stamp('R1', () => { calls += 1; return 1000; })));
console.log(calls);
try { stamp('R1', () => NaN); } catch (error) { console.log(error.name); }
// Expected output:
// {"id":"R1","at":1000}
// 1
// TypeError
```

**Explanation:** The caller can inject a real clock or a fixed test value without changing the function. It has O(1) wrapper bookkeeping plus the clock's work. A clock exception propagates unchanged; the wrapper cannot undo clock effects. An optional default clock could be convenient, but explicit injection keeps this exercise deterministic.

## Exercise 6: Replace Linear Recursive Depth

**Requirements:** Implement `sumTo(n)` for safe integers from 0 to 10,000. Use iteration, reject invalid input with `RangeError`, and explain why a recursively defined equivalent needs a depth bound.

**Hint:** Maintain the running total and the next term. No nested call is required.

```js
'use strict';
function sumTo(n) {
  if (!Number.isSafeInteger(n) || n < 0 || n > 10000) throw new RangeError('Invalid bound');
  let total = 0;
  for (let term = 1; term <= n; term += 1) total += term;
  return total;
}
console.log(sumTo(0), sumTo(4), sumTo(10000));
try { sumTo(-1); } catch (error) { console.log(error.name); }
// Expected output:
// 0 10 50005000
// RangeError
```

**Explanation:** This has O(n) additions and O(1) extra state. A linear recursive version generally uses O(n) active calls and can exceed stack capacity. The arithmetic-series formula gives O(1) arithmetic for this bounded domain, but the loop makes progress and termination visible for the exercise.
