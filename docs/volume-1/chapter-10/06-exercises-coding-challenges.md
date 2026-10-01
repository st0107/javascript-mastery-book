# Errors and Debugging: Exercises and Coding Challenges

Implement each contract before reading the solution. The companion `code/volume-1/chapter-10/example-03-error-challenges.js` tests normal and failure paths.

## 1. Validate a Positive Count

Accept a Number that is a positive safe integer. Throw TypeError for other types and RangeError for invalid numeric values. Return accepted input.

**Hint:** Check type before range.

### Solution

```js
function requirePositiveCount(value) {
  if (typeof value !== 'number') throw new TypeError('Expected a Number.');
  if (!Number.isSafeInteger(value) || value <= 0) throw new RangeError('Invalid count.');
  return value;
}
console.log(requirePositiveCount(3));
for (const value of ['3', 0]) {
  try { requirePositiveCount(value); } catch (error) { console.log(error.name); }
}
// Expected output:
// 3
// TypeError
// RangeError
```

O(1) work and storage. Test NaN, infinity, fractions, zero, the maximum safe integer, and overflow.

## 2. Return a JSON Parse Result

Accept primitive text of at most 1,024 code units. Return `{ ok: true, value }` for valid JSON or `{ ok: false, code: "INVALID_JSON" }` for syntax failure. Wrong types and excessive length still throw.

**Hint:** Keep the catch around parsing and rethrow unexpected errors.

### Solution

```js
function tryJson(text) {
  if (typeof text !== 'string') throw new TypeError('Expected text.');
  if (text.length > 1024) throw new RangeError('Text too long.');
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    return { ok: false, code: 'INVALID_JSON' };
  }
}
console.log(JSON.stringify(tryJson('null')));
console.log(JSON.stringify(tryJson('{')));
// Expected output:
// {"ok":true,"value":null}
// {"ok":false,"code":"INVALID_JSON"}
```

The ok tag distinguishes valid null from failure. Parsing uses O(n) work and storage under the cap. Successful syntax does not establish a domain schema.

## 3. Recover From One Expected Category

Accept a synchronous operation callback. Return its result. Return zero only when it throws a same-realm RangeError; propagate every other value unchanged.

**Hint:** A catch should not convert unrelated defects to fallback data.

### Solution

```js
function countOrZero(operation) {
  if (typeof operation !== 'function') throw new TypeError('Expected callback.');
  try {
    return operation();
  } catch (error) {
    if (error instanceof RangeError) return 0;
    throw error;
  }
}
console.log(countOrZero(() => { throw new RangeError('Unavailable.'); }));
const failure = new TypeError('Broken dependency.');
try {
  countOrZero(() => { throw failure; });
} catch (error) {
  console.log(error === failure);
}
// Expected output:
// 0
// true
```

Wrapper cost is O(1), excluding callback work. A larger domain may use a dedicated error category or stable code rather than recovering from every RangeError.

## 4. Preserve the Cause at an Import Boundary

Accept a synchronous loader. Return its result or throw a new Error with message "Import unavailable." and the exact original thrown value as cause. Validate callability before the catch.

**Hint:** Use the Error options object; do not copy only the original message.

### Solution

```js
function loadWithContext(loader) {
  if (typeof loader !== 'function') throw new TypeError('Expected loader.');
  try {
    return loader();
  } catch (cause) {
    throw new Error('Import unavailable.', { cause });
  }
}
const failure = new Error('Storage failed.');
try {
  loadWithContext(() => { throw failure; });
} catch (error) {
  console.log(error.message);
  console.log(error.cause === failure);
}
// Expected output:
// Import unavailable.
// true
```

The wrapper adds one useful boundary description and retains identity. Its overhead is O(1), excluding the loader and runtime diagnostics. A cause can also be null or undefined.

## 5. Collect Expected Row Failures

Accept an array and synchronous validator. Collect returned values in accepted and indices of TypeError/RangeError failures in rejected. Propagate other failures. Do not mutate rows or claim rollback of validator effects.

**Hint:** Put a separate expected-error boundary inside each iteration.

### Solution

```js
function validateRows(rows, validate) {
  if (!Array.isArray(rows) || typeof validate !== 'function') throw new TypeError('Invalid arguments.');
  const accepted = [];
  const rejected = [];
  for (let index = 0; index < rows.length; index++) {
    try {
      accepted.push(validate(rows[index]));
    } catch (error) {
      if (!(error instanceof TypeError) && !(error instanceof RangeError)) throw error;
      rejected.push(index);
    }
  }
  return { accepted, rejected };
}
const result = validateRows([1, '2', 3], value => {
  if (typeof value !== 'number') throw new TypeError('Expected number.');
  return value * 2;
});
console.log(JSON.stringify(result));
// Expected output:
// {"accepted":[2,6],"rejected":[1]}
```

There are O(n) visits and O(n) result storage, plus validator costs. Accepted objects retain the identity supplied by the validator; the wrapper does not deep-copy them.

## 6. Restore a Busy Flag

Accept an ordinary mutable object with an own boolean busy field and a synchronous callback. Reject already-busy state. Set busy during the call and restore false on success or throw, preserving the callback outcome. Exclude accessors, proxies, and frozen state.

**Hint:** Restore in finally without returning from finally.

### Solution

```js
function withBusyFlag(state, operation) {
  if (state === null || typeof state !== 'object' || !Object.hasOwn(state, 'busy') ||
      typeof state.busy !== 'boolean' || typeof operation !== 'function') {
    throw new TypeError('Invalid state or callback.');
  }
  if (state.busy) throw new RangeError('Already busy.');
  state.busy = true;
  try {
    return operation();
  } finally {
    state.busy = false;
  }
}
const state = { busy: false };
try {
  withBusyFlag(state, () => {
    console.log(state.busy);
    throw new Error('Failed.');
  });
} catch (error) {
  console.log(error.message);
}
console.log(state.busy);
// Expected output:
// true
// Failed.
// false
```

Wrapper time and space are O(1). Under the ordinary mutable-object contract, restoring the flag succeeds. This is a local state invariant, not a rollback of other callback effects.
