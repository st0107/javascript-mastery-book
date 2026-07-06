# Production Examples

## Scenario

An API gateway receives query parameters as strings and must convert pagination, filters, and flags deliberately before passing them to business logic.

The important lesson is not the size of the code. The lesson is that fundamental JavaScript rules decide whether this system is explainable under incident pressure.

## Runnable Examples

### Example 1: explicit query parsing

File: `code/volume-1/chapter-04/example-01-query-parser.js`

```js
'use strict';

function parsePositiveInteger(value, fieldName) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new RangeError(`${fieldName} must be a positive integer.`);
  }

  return parsed;
}

console.log({
  page: parsePositiveInteger('2', 'page'),
  pageSize: parsePositiveInteger('25', 'pageSize')
});
```

Expected output: the script logs a validated, normalized, or computed result without relying on global mutable state. Complexity is `O(1)` unless the code iterates through input collections; in that case the time complexity is `O(n)` and space depends on the returned structure.

### Example 2: safe boolean conversion

File: `code/volume-1/chapter-04/example-02-boolean-env.js`

```js
'use strict';

function parseBoolean(value, fieldName) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new TypeError(`${fieldName} must be "true" or "false".`);
}

console.log(parseBoolean('false', 'CACHE_ENABLED'));
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
