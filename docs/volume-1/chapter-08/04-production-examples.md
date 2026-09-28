# Production Examples

## A Shipment Snapshot With Owned Nested Records

A shipping view accepts an ordinary data record containing string `id`, `address.city`, and `address.postalCode`. It keeps only these fields, trims them, and returns new root and address records. All retained leaves are primitive strings. The contract promises isolation for this schema, not a general clone of arbitrary input graphs.

```js
'use strict';

function shipmentView(input) {
  function record(value, name) {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      throw new TypeError(`${name} must be a record`);
    }
  }
  function requiredText(value, name) {
    if (typeof value !== 'string') throw new TypeError(`${name} must be text`);
    const text = value.trim();
    if (text === '') throw new RangeError(`${name} must be nonempty`);
    return text;
  }
  record(input, 'shipment');
  if (!Object.hasOwn(input, 'id') || !Object.hasOwn(input, 'address')) {
    throw new TypeError('own id and address required');
  }
  record(input.address, 'address');
  if (!Object.hasOwn(input.address, 'city') || !Object.hasOwn(input.address, 'postalCode')) {
    throw new TypeError('own city and postalCode required');
  }
  return {
    id: requiredText(input.id, 'id'),
    address: {
      city: requiredText(input.address.city, 'city'),
      postalCode: requiredText(input.address.postalCode, 'postalCode')
    }
  };
}
const source = { id: ' S-1 ', address: { city: ' Pune ', postalCode: '411001' }, internalNote: 'private' };
const view = shipmentView(source);
source.address.city = 'Mumbai';
view.address.postalCode = 'changed locally';
console.log(view.id, view.address.city, source.address.postalCode);
console.log(view === source, view.address === source.address, Object.hasOwn(view, 'internalNote'));

// Expected output:
// S-1 Pune 411001
// false false false
```

Copying the root alone would leave the address shared. Explicit construction also excludes the unrelated internal note. Validating nonempty postal-code text does not verify an actual postal format or deliverable address; a geographic service owns those rules. The companion `code/volume-1/chapter-08/example-01-owned-profile.js` checks bidirectional mutation isolation, missing own fields, wrong types, and blank text.

For total retained text length `L`, normalization takes O(L) work and output text storage. The object graph has a fixed number of records. If the schema gains an object-valued field, revisit the ownership contract before adding it to the result.

## Parse Preferences With an Allowlist

The next boundary accepts JSON text of at most 4096 UTF-16 code units. Root keys may be `theme` and `notifications`; nested notification keys may be `email` and `sms`. Missing fields receive defaults. Explicit null or unsupported values are rejected. Unknown keys are rejected at both levels, including prototype-related key names.

```js
'use strict';

function parsePreferences(text) {
  if (typeof text !== 'string') throw new TypeError('JSON text required');
  if (text.length > 4096) throw new RangeError('preferences text too large');
  const input = JSON.parse(text);
  function checkRecord(value, allowed, name) {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      throw new TypeError(`${name} must be a record`);
    }
    for (const key of Object.keys(value)) {
      if (!allowed.includes(key)) throw new TypeError(`unknown ${name} field: ${key}`);
    }
  }
  checkRecord(input, ['theme', 'notifications'], 'preferences');
  const theme = Object.hasOwn(input, 'theme') ? input.theme : 'light';
  if (theme !== 'light' && theme !== 'dark') throw new RangeError('unsupported theme');
  const notifications = Object.hasOwn(input, 'notifications') ? input.notifications : {};
  checkRecord(notifications, ['email', 'sms'], 'notifications');
  const email = Object.hasOwn(notifications, 'email') ? notifications.email : false;
  const sms = Object.hasOwn(notifications, 'sms') ? notifications.sms : false;
  if (typeof email !== 'boolean' || typeof sms !== 'boolean') {
    throw new TypeError('notification values must be booleans');
  }
  return { theme, notifications: { email, sms } };
}
console.log(JSON.stringify(parsePreferences('{}')));
console.log(JSON.stringify(parsePreferences('{"theme":"dark","notifications":{"email":true}}')));
for (const text of ['null', '{"theme":null}', '{"notifications":{"sms":"false"}}', '{"__proto__":{"admin":true}}']) {
  try { parsePreferences(text); } catch (error) { console.log(error.name); }
}

// Expected output:
// {"theme":"light","notifications":{"email":false,"sms":false}}
// {"theme":"dark","notifications":{"email":true,"sms":false}}
// TypeError
// RangeError
// TypeError
// TypeError
```

The parser never assigns arbitrary input keys into a target or walks user-selected property paths. It constructs a fixed output schema with owned nested state. The input limit bounds text processed here; an HTTP server should also enforce its byte-level request limit before reading an oversized body. Malformed JSON propagates a SyntaxError so the caller can report a parse failure separately from a schema failure.

JSON input contains data rather than getters or proxies, which makes this boundary's assumptions concrete. This is not a validator for arbitrary live JavaScript objects. The fixed key allowlists mean validation work is linear in parsed keys and text size; the output has a fixed record shape. The companion `code/volume-1/chapter-08/example-02-safe-preferences.js` includes malformed input, nested unknown keys, independent defaults, null, array, and size-limit tests.

## A Dictionary for Arbitrary String Labels

An application sometimes needs data keys rather than a fixed schema. A null-prototype dictionary avoids inherited Object.prototype property names. It does not decide whether any particular key should be authorized or copied into another target later.

```js
'use strict';

const totals = Object.create(null);
for (const label of ['north', 'constructor', 'north', '__proto__']) {
  totals[label] = Object.hasOwn(totals, label) ? totals[label] + 1 : 1;
}
console.log(totals.north, totals.constructor, totals.__proto__);
console.log(Object.getPrototypeOf(totals) === null);

// Expected output:
// 2 1 1
// true
```

These names are ordinary own data keys on this dictionary. Use `Object.hasOwn` instead of expecting inherited methods. If keys need arbitrary object identity, a `Map` is a better fit; [Arrays and Collections](../chapter-09/01-introduction.md) develops that choice.

## Review the Returned Contract

For each API, state accepted representation, allowed keys, defaults, rejected values, mutation behavior, and returned ownership. A new outer object is one piece of evidence, not the entire contract. Assertions should change nested output and input records to verify the promised isolation.
