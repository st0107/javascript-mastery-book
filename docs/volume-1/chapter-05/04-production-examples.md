# Production Examples

## Scenario

A billing platform formats localized invoices, stores money in integer cents, validates invoice IDs with regular expressions, and compares timestamps in UTC.

The important lesson is not the size of the code. The lesson is that fundamental JavaScript rules decide whether this system is explainable under incident pressure.

## Runnable Examples

### Example 1: money with integer cents

File: `code/volume-1/chapter-05/example-01-money-formatting.js`

```js
'use strict';

function formatMoneyFromCents(cents, locale, currency) {
  if (!Number.isInteger(cents)) {
    throw new TypeError('Money must be stored as integer cents.');
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency
  }).format(cents / 100);
}

console.log(formatMoneyFromCents(1299, 'en-US', 'USD'));
```

Expected output: the script logs a validated, normalized, or computed result without relying on global mutable state. Complexity is `O(1)` unless the code iterates through input collections; in that case the time complexity is `O(n)` and space depends on the returned structure.

### Example 2: UTC timestamp windows

File: `code/volume-1/chapter-05/example-02-date-window.js`

```js
'use strict';

function isWithinWindow(nowMs, startIso, durationMs) {
  const startMs = Date.parse(startIso);

  if (Number.isNaN(startMs)) {
    throw new TypeError('Invalid ISO timestamp.');
  }

  return nowMs >= startMs && nowMs < startMs + durationMs;
}

console.log(isWithinWindow(Date.parse('2026-07-06T10:30:00.000Z'), '2026-07-06T10:00:00.000Z', 60 * 60 * 1000));
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
