# Production Examples

## Retry Defaults With Validation

A worker accepts a retry count, a timeout in milliseconds, and an enabled flag. Zero retries and `false` are valid explicit choices. Missing or null fields receive defaults. Other supplied values must satisfy the schema; a string `"0"` is not silently converted into a count.

The function accepts an ordinary application data record, such as parsed JSON. It reads only the documented fields, tolerates unrelated fields, returns a new frozen record, and does not mutate its input. It rejects a null root; passing no argument selects an empty record. This distinction is intentional: absent configuration and a malformed root are separate cases.

```js
'use strict';
const assert = require('node:assert/strict');

function resolveRetryPolicy(config = {}) {
  if (config === null || typeof config !== 'object' || Array.isArray(config)) {
    throw new TypeError('config must be a data record');
  }
  const retries = config.retries ?? 3;
  const timeoutMs = config.timeoutMs ?? 1500;
  const enabled = config.enabled ?? true;
  if (!Number.isSafeInteger(retries) || retries < 0 || retries > 10) {
    throw new RangeError('retries must be an integer from 0 through 10');
  }
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 60000) {
    throw new RangeError('timeoutMs must be an integer from 1 through 60000');
  }
  if (typeof enabled !== 'boolean') throw new TypeError('enabled must be boolean');
  return Object.freeze({ retries, timeoutMs, enabled });
}

const supplied = { retries: 0, enabled: false };
const result = resolveRetryPolicy(supplied);
assert.deepEqual(result, { retries: 0, timeoutMs: 1500, enabled: false });
assert.equal(Object.isFrozen(result), true);
assert.notEqual(result, supplied);
assert.deepEqual(supplied, { retries: 0, enabled: false });
assert.throws(() => resolveRetryPolicy({ retries: -1 }), RangeError);
assert.throws(() => resolveRetryPolicy({ enabled: 'false' }), TypeError);
console.log(JSON.stringify(result));
console.log(JSON.stringify(resolveRetryPolicy({ retries: null })));

// Expected output:
// {"retries":0,"timeoutMs":1500,"enabled":false}
// {"retries":3,"timeoutMs":1500,"enabled":true}

// O(1) time and new storage for the fixed three-field schema.
```

The implementation first resolves three candidate values with `??`, then validates them, then creates the result. Replacing `??` with `||` would overwrite valid zero and false values. Moving validation before default selection would require separate missing-value handling. Returning the input after modifying it would introduce an ownership problem for other readers.

The output has only primitive fields, so freezing that one record protects its entire schema. There is no nested graph to freeze. This local policy does not implement retry scheduling, exponential backoff, request cancellation, or idempotency; those belong to the worker using it.

Companion: `code/volume-1/chapter-03/example-01-nullish-config.js`. Additional assertions cover boundary counts, timeout limits, invalid root values, and output ownership.

## A Feature Gate That Denies Malformed Data

A feature is available when the account is explicitly active, the feature is explicitly enabled, and the user is staff or appears in its allowed-ID list. Missing or null lists mean no listed users. A malformed list denies access, including for staff, because this service treats corrupt feature configuration as disabled.

| Input case | Decision |
| --- | --- |
| Missing user or feature | Deny. |
| `active` or `enabled` is any value other than boolean true | Deny. |
| Missing/empty/oversized user ID or missing role string | Deny. |
| Missing/null allowlist | Use an empty list; staff may still pass. |
| Nonarray list, more than 1000 IDs, or invalid list entry | Deny. |
| Valid staff user and valid enabled feature | Allow. |
| Valid nonstaff user | Allow only an exact, case-sensitive ID match. |

```js
'use strict';
const assert = require('node:assert/strict');

function canAccessBeta(user, feature) {
  if (user === null || typeof user !== 'object' || Array.isArray(user) ||
      feature === null || typeof feature !== 'object' || Array.isArray(feature)) return false;
  if (user.active !== true || feature.enabled !== true) return false;
  if (typeof user.id !== 'string' || user.id.length < 1 || user.id.length > 64) return false;
  if (typeof user.role !== 'string') return false;
  const allowed = feature.allowedUserIds ?? [];
  if (!Array.isArray(allowed) || allowed.length > 1000) return false;
  for (const id of allowed) {
    if (typeof id !== 'string' || id.length < 1 || id.length > 64) return false;
  }
  return user.role === 'staff' || allowed.includes(user.id);
}

const member = { id: 'u1', active: true, role: 'member' };
const enabled = { enabled: true, allowedUserIds: ['u1'] };
assert.equal(canAccessBeta(member, enabled), true);
assert.equal(canAccessBeta(member, { enabled: true }), false);
assert.equal(canAccessBeta(member, { enabled: true, allowedUserIds: 'u1' }), false);
assert.equal(canAccessBeta({ ...member, active: 'false' }, enabled), false);
assert.equal(canAccessBeta(null, enabled), false);
assert.equal(canAccessBeta({ ...member, role: 'staff' }, { enabled: true }), true);
assert.equal(canAccessBeta({ ...member, role: 'staff' }, { enabled: true, allowedUserIds: [null] }), false);
console.log(canAccessBeta(member, enabled));
console.log(canAccessBeta(member, { enabled: true }));
console.log(canAccessBeta(member, { enabled: 'true', allowedUserIds: ['u1'] }));

// Expected output:
// true
// false
// false

// O(n) time for at most 1000 IDs; O(1) additional space.
// A missing list allocates an empty array of constant size.
```

The guards reject unusable roots before any property access. Exact boolean comparisons avoid enabling a feature from the truthy string `"false"`. The list is checked before `includes` is called, so a missing list no longer throws. Returning a boolean is part of the contract; this expression uses comparisons and `includes`, which already return booleans.

Short-circuiting skips later checks after an early denial. Validating the list before the staff branch deliberately spends O(n) work even for staff, enforcing the corrupt-configuration policy. If an application instead wants staff to bypass list validation, that is a policy change requiring different tests.

The list bound prevents this helper from searching an unbounded configuration array. It does not replace request-size limits before parsing. IDs are opaque strings with bounded length; this helper does not normalize case or trim them because that could merge identities.

## Trust and Ownership Boundaries

These examples accept parsed, application-owned data, not arbitrary objects with getters or proxy traps. Reading a JavaScript property can run code. Validation of data shapes is not a sandbox for hostile JavaScript objects.

A feature rollout gate is also not a complete authorization system. The caller must obtain user identity and staff status from a trusted server-side source. A browser-supplied `role: "staff"` is not evidence of privilege. Keep authentication and authorization policy at the service boundary.

Both helpers leave input objects intact. The gate does not retain or freeze the caller's list; it makes a decision from the data observed during the synchronous call. If configuration changes later, subsequent calls may decide differently. Cache results only with a defined invalidation policy.

Companion: `code/volume-1/chapter-03/example-02-feature-gate.js`. It covers missing data, malformed list entries, strict booleans, independent users, staff behavior, and both list-size boundaries.

## Review Questions

Can zero survive defaulting? Can a malformed permission list throw? Which branch runs when the feature is disabled? Is an untrusted field being mistaken for authority? State these answers before discussing whether an expression is compact.

The [exercise set](06-exercises-coding-challenges.md) applies the same operator rules to different contracts rather than repeating these functions.
