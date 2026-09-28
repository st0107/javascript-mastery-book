# Production Examples

## Make Mutation Ownership Visible

A trusted in-memory account record can be updated in place when the caller deliberately owns that state. A `const` declaration communicates that the binding stays attached to this account, not that its properties are immutable.

```js
'use strict';

const account = { id: 'acct_100', status: 'active' };
const observer = account;
account.status = 'suspended';
console.log(account.status, observer.status, observer === account);
try {
  account = { id: 'acct_200', status: 'active' };
} catch (error) {
  console.log(error.name);
}

// Expected output:
// suspended suspended true
// TypeError
```

An observer holding the same identity sees the change. Use this design when sharing live state is intentional. When a caller needs a prior snapshot, create a record with the required owned values instead of assuming `const` protects the old state. The assertions in `code/volume-1/chapter-02/example-01-const-object-mutation.js` cover both mutation and binding replacement.

## Normalize a User Display Record

A boundary accepts an ordinary parsed JSON object containing `id` and `email` strings. The application's display policy trims both fields and lowercases email text; this is not a general mailbox identity or deliverability validator. The output contains only those two fields. It excludes arbitrary input properties such as `role`.

```js
'use strict';

function normalizeUser(input) {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('user object required');
  }
  const { id, email } = input;
  if (typeof id !== 'string' || typeof email !== 'string') {
    throw new TypeError('id and email must be strings');
  }
  const cleanId = id.trim();
  const cleanEmail = email.trim().toLowerCase();
  if (cleanId === '' || cleanEmail === '') throw new RangeError('fields must be nonempty');
  return { id: cleanId, email: cleanEmail };
}
const raw = { id: ' U-1 ', email: ' LEA@EXAMPLE.COM ', role: 'admin' };
const normalized = normalizeUser(raw);
console.log(JSON.stringify(normalized));
console.log(raw.id === ' U-1 ', normalized === raw);
for (const input of [null, [], { id: 'U-2', email: 3 }, { id: ' ', email: 'a@b.test' }]) {
  try { normalizeUser(input); } catch (error) { console.log(error.name); }
}

// Expected output:
// {"id":"U-1","email":"lea@example.com"}
// true false
// TypeError
// TypeError
// TypeError
// RangeError
```

The outer type check rejects null and arrays before property access. String checks precede string methods. Domain checks reject empty normalized text. The new output record stores immutable string values, so changing either record's field later does not mutate the other record.

This is a contract for parsed data, not arbitrary objects that can execute getters or proxy traps. Schema validation and application authorization are separate responsibilities. `code/volume-1/chapter-02/example-02-type-guards.js` tests these accepted and rejected values plus output ownership. If total field length is `L`, normalization costs O(L) time and creates output text proportional to the normalized length.

## Use a New Binding for Each Representation

```js
'use strict';

function validateStockCount(value) {
  if (!Number.isSafeInteger(value)) throw new TypeError('safe integer count required');
  if (value < 0 || value > 10_000) throw new RangeError('stock count outside range');
  return value;
}
const incoming = { count: 12 };
const stockCount = validateStockCount(incoming.count);
const message = `${stockCount} units available`;
console.log(message);
try {
  validateStockCount('12');
} catch (error) {
  console.log(error.name);
}

// Expected output:
// 12 units available
// TypeError
```

`incoming`, `stockCount`, and `message` describe distinct roles. Reusing a mutable `value` binding for the parsed object, then a number, then text would be legal, but makes subsequent operations harder to inspect. Representation changes deserve names and explicit boundaries. Numeric guards are constant-sized; formatting adds the cost of producing the message.

## Production Review

State whether a function mutates its argument, returns a new record, or intentionally retains a shared reference. Validate language type and domain separately. Do not treat a `typeof` result, a `const` declaration, or a freshly allocated outer object as proof of a deeper ownership or authorization claim.
