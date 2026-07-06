# Production Examples

## Scenario

A feature flag service combines user attributes, rollout percentages, defaults, and null-safe configuration access without crashing when optional nested data is absent.

The important lesson is not the size of the code. The lesson is that fundamental JavaScript rules decide whether this system is explainable under incident pressure.

## Runnable Examples

### Example 1: safe configuration defaults

File: `code/volume-1/chapter-03/example-01-nullish-config.js`

```js
'use strict';

function resolveRetryPolicy(config) {
  return {
    retries: config.retries ?? 3,
    timeoutMs: config.timeoutMs ?? 1500,
    enabled: config.enabled ?? true
  };
}

console.log(resolveRetryPolicy({ retries: 0, enabled: false }));
```

Expected output: the script logs a validated, normalized, or computed result without relying on global mutable state. Complexity is `O(1)` unless the code iterates through input collections; in that case the time complexity is `O(n)` and space depends on the returned structure.

### Example 2: logical operators in feature gates

File: `code/volume-1/chapter-03/example-02-feature-gate.js`

```js
'use strict';

function canAccessBeta(user, feature) {
  return Boolean(
    user?.active &&
      feature?.enabled &&
      (user.role === 'staff' || feature.allowedUserIds.includes(user.id))
  );
}

console.log(canAccessBeta({ id: 'u1', active: true, role: 'member' }, {
  enabled: true,
  allowedUserIds: ['u1']
}));
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
