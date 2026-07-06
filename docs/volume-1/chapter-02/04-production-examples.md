# Production Examples

## Scenario

A payment service normalizes incoming JSON into stable, explicit bindings before calculating risk scores and writing audit records.

The important lesson is not the size of the code. The lesson is that fundamental JavaScript rules decide whether this system is explainable under incident pressure.

## Runnable Examples

### Example 1: const binding versus object mutation

File: `code/volume-1/chapter-02/example-01-const-object-mutation.js`

```js
'use strict';

const account = {
  id: 'acct_100',
  status: 'active'
};

account.status = 'suspended';

console.log(account);
```

Expected output: the script logs a validated, normalized, or computed result without relying on global mutable state. Complexity is `O(1)` unless the code iterates through input collections; in that case the time complexity is `O(n)` and space depends on the returned structure.

### Example 2: production type guards

File: `code/volume-1/chapter-02/example-02-type-guards.js`

```js
'use strict';

function normalizeUser(input) {
  if (input === null || typeof input !== 'object') {
    throw new TypeError('Expected a user object.');
  }

  const { id, email } = input;

  if (typeof id !== 'string' || typeof email !== 'string') {
    throw new TypeError('User id and email must be strings.');
  }

  return { id, email: email.toLowerCase() };
}

console.log(normalizeUser({ id: 'U-1', email: 'LEA@EXAMPLE.COM' }));
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
