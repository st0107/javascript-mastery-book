# Edge Cases and Debugging

## A Data Field Can Shadow a Method

```js
'use strict';

const record = { hasOwnProperty: false, id: 'R-1' };
console.log(Object.hasOwn(record, 'id'));
try { record.hasOwnProperty('id'); } catch (error) { console.log(error.name); }
const dictionary = Object.create(null);
dictionary.id = 'R-2';
console.log(Object.hasOwn(dictionary, 'id'), typeof dictionary.hasOwnProperty);

// Expected output:
// true
// TypeError
// true undefined
```

The record's data key hides the inherited method. A null-prototype dictionary does not inherit the method at all. The static own-property operation avoids both assumptions.

## Copying Can Evaluate a Getter

```js
'use strict';

let reads = 0;
const source = {
  get status() { reads += 1; return 'ready'; }
};
const copy = { ...source };
console.log(reads, copy.status, reads);
console.log(typeof Object.getOwnPropertyDescriptor(copy, 'status').get);
copy.status = 'sent';
console.log(copy.status);

// Expected output:
// 1 ready 1
// undefined
// sent
```

The getter runs while spread reads its value. The result is an ordinary data property, so later reads of the copy do not invoke the source getter. If copying triggers an unexpected exception or expensive computation, inspect descriptors before assuming the copy operation was passive.

## Assignment and Spread Differ at a Target Setter

```js
'use strict';

const writes = [];
const target = { set status(value) { writes.push(value); } };
Object.assign(target, { status: 'assigned' });
const copy = { ...target, status: 'spread' };
console.log(writes.join('|'), copy.status);
console.log(Object.getOwnPropertyDescriptor(copy, 'status').writable);

// Expected output:
// assigned spread
// true
```

`Object.assign` writes to the supplied target and invokes its setter. Spread builds data properties on a new object. This matters for observable behavior and for dangerous property names; the two forms are not interchangeable merges.

## Deleting Can Expose an Inherited Value

```js
'use strict';

const defaults = { region: 'APAC' };
const local = Object.create(defaults);
local.region = 'EU';
console.log(local.region, Object.hasOwn(local, 'region'));
delete local.region;
console.log(local.region, Object.hasOwn(local, 'region'));

// Expected output:
// EU true
// APAC false
```

Deletion removed the local property, not the prototype's property. If absence means "disabled" in your API, ordinary lookup through defaults may implement the wrong policy. Inspect own presence separately.

## A Special Literal Key Is Not the Same as Parsed Data

```js
'use strict';

const parsed = JSON.parse('{"__proto__":{"admin":true}}');
const literal = { __proto__: { admin: true } };
console.log(Object.hasOwn(parsed, '__proto__'), Object.hasOwn(parsed, 'admin'));
console.log(Object.hasOwn(literal, '__proto__'), literal.admin);
console.log(Object.getPrototypeOf(parsed) === Object.prototype);

// Expected output:
// true false
// false true
// true
```

The parsed JSON contains an own data key. The special colon-form object-literal entry sets the new object's prototype instead. Neither example mutates Object.prototype. Trouble arises when later code treats attacker-controlled keys as assignment targets or recursive traversal paths. Reject unknown keys before building trusted state; do not mistake successful parsing for safe merging.

## Debugging Sequence

Locate the exact property and owner. Check own presence, value, and descriptor. Draw the identities reachable through nested fields. Identify whether an operation reads inherited data, invokes an accessor, or writes through a setter. Then reduce the failure to an assertion about the promised schema or ownership boundary.
