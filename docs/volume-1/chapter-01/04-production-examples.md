# Production Examples

## Scenario

A checkout team ships the same pricing validation rules to the browser for immediate feedback and to Node.js on the server for authoritative enforcement.

The important lesson is not the size of the code. The lesson is that fundamental JavaScript rules decide whether this system is explainable under incident pressure.

## Runnable Examples

### Example 1: runtime capability detection

File: `code/volume-1/chapter-01/example-01-runtime-detection.js`

```js
'use strict';

function getRuntimeCapabilities() {
  const hasWindow = typeof window !== 'undefined';
  const hasProcess = typeof process !== 'undefined' && Boolean(process.versions?.node);

  return {
    runtime: hasWindow ? 'browser' : hasProcess ? 'node' : 'unknown',
    canUseDom: hasWindow && typeof document !== 'undefined',
    canUseFileSystem: hasProcess
  };
}

console.log(getRuntimeCapabilities());
```

Expected output: the script logs a validated, normalized, or computed result without relying on global mutable state. Complexity is `O(1)` unless the code iterates through input collections; in that case the time complexity is `O(n)` and space depends on the returned structure.

### Example 2: shared validation in browser and Node.js

File: `code/volume-1/chapter-01/example-02-shared-validation.js`

```js
'use strict';

function validateCheckoutAmount(amountInCents) {
  if (!Number.isInteger(amountInCents)) {
    throw new TypeError('Checkout amount must be an integer number of cents.');
  }

  if (amountInCents <= 0) {
    throw new RangeError('Checkout amount must be positive.');
  }

  return { amountInCents, valid: true };
}

console.log(validateCheckoutAmount(2599));
```

Expected output: the script logs a validated, normalized, or computed result without relying on global mutable state. Complexity is `O(1)` unless the code iterates through input collections; in that case the time complexity is `O(n)` and space depends on the returned structure.

## Best Practices

- Make important assumptions visible in names, guards, and return values.
- Validate data at system boundaries.
- Prefer explicit conversion over accidental coercion.
- Keep functions focused enough to test directly.
- Use immutable updates when shared state would create hidden coupling.
- Write code that a teammate can debug without knowing the original author.

## Common Mistakes

- Trusting external input before parsing it.
- Compressing control flow until failure paths disappear.
- Depending on host-specific APIs inside shared language utilities.
- Mutating objects passed by callers without documenting ownership.
- Hiding performance costs inside innocent-looking helper functions.

## Edge Cases

Edge cases are not interview decorations. They are compressed lessons about the language. When you encounter surprising behavior, ask which specification rule is being applied, which host API is involved, and whether the value came from a trusted or untrusted boundary.
