# Errors and Debugging: Production Examples

## Bounded JSON Import Parser

**Contract:** accept a primitive JSON string of at most 2,048 UTF-16 code units. It must decode to an object with exactly own `id` and `quantity` fields. ID is 1 through 32 uppercase ASCII letters, digits, or hyphens. Quantity is an integer Number from zero through 10,000.

A malformed document throws a SyntaxError with the parsing error as cause. Invalid shape or field type throws TypeError. Oversize input or an out-of-range quantity throws RangeError. The result is a fresh projection containing only accepted fields.

```js
function parseImport(text) {
  if (typeof text !== 'string') throw new TypeError('Expected JSON text.');
  if (text.length > 2048) throw new RangeError('Import text is too long.');
  let value;
  try {
    value = JSON.parse(text);
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    throw new SyntaxError('Invalid import JSON.', { cause: error });
  }
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('Expected an import object.');
  }
  const keys = Object.keys(value);
  if (keys.length !== 2 || !Object.hasOwn(value, 'id') || !Object.hasOwn(value, 'quantity')) {
    throw new TypeError('Expected exactly id and quantity.');
  }
  if (typeof value.id !== 'string' || !/^[A-Z0-9-]{1,32}$/.test(value.id) ||
      typeof value.quantity !== 'number') {
    throw new TypeError('Invalid import field types or ID syntax.');
  }
  if (!Number.isSafeInteger(value.quantity) || value.quantity < 0 || value.quantity > 10000) {
    throw new RangeError('Quantity must be an integer from zero to 10,000.');
  }
  return { id: value.id, quantity: value.quantity };
}

console.log(JSON.stringify(parseImport('{"id":"ORD-42","quantity":3}')));
try {
  parseImport('{"id":');
} catch (error) {
  console.log(error.name, error.cause.name);
}
try {
  parseImport('{"id":"ORD-42","quantity":-1}');
} catch (error) {
  console.log(error.name);
}
// Expected output:
// {"id":"ORD-42","quantity":3}
// SyntaxError SyntaxError
// RangeError
```

The parsing catch encloses only JSON.parse. A schema defect cannot be accidentally reported as malformed JSON. No reviver executes caller code. The fixed text cap bounds the accepted work; before applying the cap, the caller must still control how a large request body is read into memory.

JSON parsing does not reject repeated member names; ordinary JSON.parse retains the last value. This contract validates the resulting object and does not claim duplicate-key detection. If an application needs that stronger policy, use a parser that can report duplicates. JSON field-name strings such as __proto__ do not become accepted fields here because the schema rejects extras and returns an explicit projection.

The companion `code/volume-1/chapter-10/example-01-import-parser.js` tests all error categories, null/array roots, extra fields, syntax cause, exact bounds, and unsupported types. Parsing and validation use O(n) work and space in input size under the small fixed cap.

## Synchronous Resource Scope With Preserved Failures

**Contract:** acquire, use, and release are synchronous callbacks. Validate all three before acquisition. If acquire throws, release is not called. Otherwise call release exactly once, whether use returns or throws. Preserve the original operation error when cleanup succeeds; preserve both errors in ordered `AggregateError.errors` when both fail.

This helper does not await Promises or implement rollback. Its callbacks must finish their work before returning. Passing async callbacks would release too early and violates this contract.

```js
function withResource(acquire, use, release) {
  if (typeof acquire !== 'function' || typeof use !== 'function' || typeof release !== 'function') {
    throw new TypeError('Expected synchronous callbacks.');
  }
  const resource = acquire();
  let operationFailed = false;
  let operationError;
  try {
    return use(resource);
  } catch (error) {
    operationFailed = true;
    operationError = error;
    throw error;
  } finally {
    try {
      release(resource);
    } catch (cleanupError) {
      if (operationFailed) {
        throw new AggregateError(
          [operationError, cleanupError],
          'Operation and cleanup failed.',
          { cause: operationError }
        );
      }
      throw cleanupError;
    }
  }
}

const events = [];
const result = withResource(
  () => ({ id: 'buffer-1' }),
  resource => { events.push('use ' + resource.id); return 42; },
  resource => { events.push('release ' + resource.id); }
);
console.log(result);
console.log(events.join(','));
try {
  withResource(
    () => ({}),
    () => { throw new Error('work failed'); },
    () => { throw new Error('release failed'); }
  );
} catch (error) {
  console.log(error.name);
  console.log(error.errors.map(item => item.message).join(','));
}
// Expected output:
// 42
// use buffer-1,release buffer-1
// AggregateError
// work failed,release failed
```

A throw from finally normally replaces a pending failure. Here that replacement is deliberate: AggregateError retains both original values and identifies the operation failure as cause. There is no return from finally.

The companion `code/volume-1/chapter-10/example-02-safe-cleanup.js` checks every row of the failure matrix, callback order, identical resource identity, and arbitrary thrown values. Wrapper overhead is O(1), excluding callback work and any error diagnostics.

## Boundary Reporting

At a UI or service boundary, map expected validation failures to a safe, stable message or code. Keep full diagnostics in an appropriate internal channel, avoiding credentials and complete input payloads. Do not expose parser internals or stack traces merely because an Error contains them.

Unexpected failures should remain failures. Returning an empty import object or a fake success after a cleanup error would hide the fact that the function did not meet its contract.
