# Production Examples

## A Checkout Rule Shared by Page and Server

A checkout accepts a positive amount represented as a Number of cents, with a maximum of 100,000,000 cents. This explicit business limit is below the safe-integer boundary. The helper neither parses strings nor performs payment I/O.

```js
'use strict';

function validateCheckoutAmount(amountInCents) {
  if (!Number.isSafeInteger(amountInCents)) {
    throw new TypeError('amount must be a safe integer Number of cents');
  }
  if (amountInCents < 1 || amountInCents > 100_000_000) {
    throw new RangeError('amount is outside the checkout range');
  }
  return { amountInCents, valid: true };
}

console.log(JSON.stringify(validateCheckoutAmount(2599)));
for (const input of ['2599', 0, Number.MAX_SAFE_INTEGER + 1]) {
  try {
    validateCheckoutAmount(input);
  } catch (error) {
    console.log(error.name);
  }
}

// Expected output:
// {"amountInCents":2599,"valid":true}
// TypeError
// RangeError
// TypeError
```

The rule rejects unsupported representations before comparing the domain range. A form adapter can parse a documented decimal format before calling it; a request adapter validates the parsed request independently. This boundary does not prove that a price is authorized for the customer's cart. The server must compute or verify the price from trusted product and order data.

The companion `code/volume-1/chapter-01/example-02-shared-validation.js` checks both boundaries, invalid numbers, and exact output. Validation has constant-size numeric bookkeeping. A safe-integer check cannot recover precision already lost while parsing an overlarge decimal input; constrain representation before conversion when exact larger values matter. See [Number.isSafeInteger](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isSafeInteger).

## Report Required Capabilities, Not Permission Guesses

Suppose an export workflow receives a trusted adapter with optional `writeText` and `showStatus` operations. Report whether those exact operations are callable. The adapter is constructed by application code; it is not an arbitrary proxy or an untrusted object containing getters.

```js
'use strict';

function getRuntimeCapabilities(adapter) {
  if (adapter === null || typeof adapter !== 'object') {
    throw new TypeError('adapter must be an object');
  }
  return {
    canWriteText: typeof adapter.writeText === 'function',
    canShowStatus: typeof adapter.showStatus === 'function'
  };
}

const workerAdapter = { writeText: undefined, showStatus: undefined };
const fileAdapter = { writeText() {} };
console.log(JSON.stringify(getRuntimeCapabilities(workerAdapter)));
console.log(JSON.stringify(getRuntimeCapabilities(fileAdapter)));

// Expected output:
// {"canWriteText":false,"canShowStatus":false}
// {"canWriteText":true,"canShowStatus":false}
```

This helper intentionally does not infer filesystem permission from `process`, or DOM access from an environment label. A browser page can supply an adapter that downloads a file; Node can supply one that writes an approved path. Both must report the outcome of the actual operation.

The existing companion path `code/volume-1/chapter-01/example-01-runtime-detection.js` now demonstrates this narrower capability contract and asserts that noncallable properties are rejected as capabilities.

## Inject an Effect and Keep the Result Explicit

```js
'use strict';

function publishSummary(summary, writeText) {
  if (typeof summary !== 'string' || summary.trim() === '') {
    throw new TypeError('summary must be non-empty text');
  }
  if (typeof writeText !== 'function') throw new TypeError('writer must be callable');
  const text = summary.trim();
  writeText(text);
  return text.length;
}

const written = [];
console.log(publishSummary('  Ready for review  ', text => written.push(text)));
console.log(written.join('|'));
try {
  publishSummary('Ready', () => { throw new Error('storage unavailable'); });
} catch (error) {
  console.log(error.message);
}

// Expected output:
// 16
// Ready for review
// storage unavailable
```

The writer contract is synchronous; the return means the call returned successfully, not that an asynchronous operation later completed. The example propagates the same operation failure to its caller. A real asynchronous writer needs an asynchronous API with an awaited outcome, covered later.

Normalization takes time proportional to input text length. The injected writer's own cost is additional. A successful capability check does not eliminate this failure path. Avoid swallowing a write error and returning a success-shaped result.

## Review the Boundary

Keep parsing, domain validation, and authorization distinct. List accepted representations and numeric limits. Inject host operations so their failures can be tested. Return small explicit results instead of publishing mutable global state. These decisions make the shared code portable while preserving the authority of the environment that owns the operation.
