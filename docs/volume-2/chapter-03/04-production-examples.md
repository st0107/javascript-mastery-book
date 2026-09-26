# Production Examples

A prototype is useful when many records need the same behavior. Each record can own its changing state while delegating method lookup to one shared object. A data dictionary has a different need: inherited names can be unwanted input to a lookup. These examples show how to choose each shape deliberately.

Both programs run independently in Node.js 20 or newer, require no third-party packages, and leave built-in prototypes unchanged. Their executable files include normal calls, independent instances, and failure-path assertions.

## Example 1: Inventory Records With Shared Behavior

An inventory view holds stock records for many products. Every record supports reservation and reporting, but reservations for one product must never appear in another product's log. Copying method functions into every record is unnecessary. Storing one reservation array on the prototype would be incorrect because all records would initially read the same array.

The factory below establishes one prototype link per record and allocates a fresh array as an own property. Methods and the summary getter live on a shared prototype. A private registration set lets those methods reject objects that inherited the behavior without passing through the factory.

Run the full implementation and assertions:

```sh
node code/volume-2/chapter-03/example-01-shared-records.js
# Expected output:
# SKU-17: 5 available
# SKU-42: 2 available
# shared reserve method true
# shared record assertions passed
```

This independently runnable version contains the complete factory and its shared behavior:

```js
'use strict';

const assert = require('node:assert/strict');
const records = new WeakSet();

function requireRecord(receiver) {
  if (!records.has(receiver)) throw new TypeError('receiver must be a factory-created record');
}

const stockRecordPrototype = Object.freeze(Object.defineProperties({}, {
  reserve: {
    value: function reserve(units) {
      requireRecord(this);
      if (!Number.isSafeInteger(units) || units <= 0) {
        throw new TypeError('units must be a positive safe integer');
      }
      if (units > this.available) throw new RangeError('insufficient stock');
      this.reservations.push(units);
      this.available -= units;
      return this.available;
    }
  },
  reservationLog: {
    value: function reservationLog() {
      requireRecord(this);
      return this.reservations.slice();
    }
  },
  summary: {
    get() {
      requireRecord(this);
      return `${this.sku}: ${this.available} available`;
    }
  }
}));

function createStockRecord(sku, available) {
  if (typeof sku !== 'string' || sku.length === 0 || sku.length > 32 || /[^A-Z0-9-]/.test(sku)) {
    throw new TypeError('sku must contain 1-32 uppercase identifier characters');
  }
  if (!Number.isSafeInteger(available) || available < 0) {
    throw new TypeError('available must be a nonnegative safe integer');
  }
  const record = Object.create(stockRecordPrototype, {
    sku: { value: sku, enumerable: true },
    available: { value: available, writable: true, enumerable: true },
    reservations: { value: [] }
  });
  records.add(record);
  return Object.seal(record);
}

const north = createStockRecord('SKU-17', 10);
const south = createStockRecord('SKU-42', 4);
north.reserve(3);
north.reserve(2);
south.reserve(2);

assert.notEqual(north.reservations, south.reservations);
assert.deepEqual(north.reservationLog(), [3, 2]);
assert.deepEqual(south.reservationLog(), [2]);
assert.throws(() => north.reserve(6), RangeError);
assert.equal(north.available, 5);
assert.deepEqual(north.reservationLog(), [3, 2]);

console.log(north.summary);
console.log(south.summary);
console.log(`shared reserve method ${north.reserve === south.reserve}`);

// Expected output:
// SKU-17: 5 available
// SKU-42: 2 available
// shared reserve method true

// reserve: amortized O(1) append and arithmetic, retaining one number per call.
// reservationLog: O(r) time and new storage for r stored reservations.
```

### Execution Steps and Ownership

1. Module initialization creates the shared method functions, the getter, and their prototype object once.
2. The factory validates its scalar inputs, then calls `Object.create` with that prototype and the record's own property descriptors. No constructor is invoked by `Object.create`.
3. Evaluating the array expression inside the factory creates a new reservation array for this record. A second factory call creates a different array.
4. Calling `north.reserve(3)` searches north, finds no own `reserve`, and retrieves the function from the prototype. The property call still supplies north as `this`.
5. The receiver check and quantity checks run before mutation. The method appends to north's own array, subtracts from north's own availability, and returns the remaining quantity.
6. Reading `south.summary` finds the inherited getter and executes it with south as its receiver. No own summary field is required.

The reference model is two records pointing to one behavior object, with each record pointing to its own reservation array. Sharing the method does not share `this` or automatically share data read through `this`. Whether data is shared depends on where that data property resolves.

The registration set has weak membership, so membership alone does not keep an otherwise unreachable record alive. Its job is to distinguish initialized records from lookalikes or descendants. It does not make the record's ordinary properties private.

### Why the Descriptors Are Explicit

Descriptors make the intended surface visible. `sku` is readable and enumerable but cannot be reassigned. `available` is readable, enumerable, and writable. `reservations` holds a fixed array reference that can be mutated by the methods; the property itself is non-enumerable and cannot be replaced. The shared methods are non-enumerable, so a `for...in` loop does not discover them as record fields.

Unspecified `writable`, `enumerable`, and `configurable` descriptor flags default to `false`. The factory sets the flags it needs rather than treating descriptors like ordinary object-literal properties. Sealing the record additionally prevents new own fields and prototype replacement; it still allows writes to its writable `available` property. Freezing the prototype keeps the shared behavior stable. Neither operation deeply freezes the reservation array.

### Receiver and Failure Contract

| Situation | Defined behavior |
| --- | --- |
| Two calls to the factory | Separate own arrays and availability, shared inherited method functions. |
| A positive safe integer within available stock | Append the reservation, reduce availability, and return the remaining quantity. |
| Invalid quantity | Throw `TypeError` before changing application state. |
| Quantity exceeds availability | Throw `RangeError` before changing application state. |
| A detached method called without a receiver | Throw `TypeError` from the registration check. |
| The method is borrowed by another factory-created record | Operate on that receiving record. |
| An object inherits from a record or copies its fields | Reject it because the factory did not register that object. |
| A caller mutates the array returned by `reservationLog` | The record's array is unchanged; the returned array is a copy. |

Rejecting uninitialized descendants prevents a subtle inherited-state bug. Without the receiver check, `Object.create(north).reserve(1)` could read north's array, append to that same array, and then create a separate availability field on the descendant. Prototype lookup alone does not enforce a valid domain model.

The full script tests these distinctions with two records, checks that failed validations leave the log and availability unchanged, and verifies that replacing fixed fields throws in strict mode. It also covers zero initial stock and invalid factory input.

### Production Boundaries

These records are owned by trusted application code. Their own state is intentionally ordinary object data: callers can still directly write `available` or mutate `reservations`. Such writes bypass validation. Freezing a record after creation would also break its mutation contract. Callers must use the methods and leave internal record structure alone. If consumers need an enforced private state boundary, use private class fields or closure-owned state instead.

The validation guarantee applies to the supported operations on intact records. This example does not provide rollback after external tampering, database transactions, persistence, or concurrency control across workers or processes. Keep those concerns outside this in-memory record type.

The log also grows with each reservation. A long-lived service may keep only a bounded recent history or persist reservations elsewhere. Shared methods save per-record function objects, but do not eliminate per-record application data. Choose the pattern for clear ownership and shared behavior, then measure performance in the real workload.

## Example 2: Export Options With an Explicit Data Boundary

An export endpoint accepts a small JSON object containing output format, result limit, and whether archived records should be included. It needs named options, explicit defaults, and predictable rejection of unsupported input. It does not need to merge arbitrary properties into a service object or inherit configuration from caller-selected prototypes.

The parser accepts text rather than an arbitrary JavaScript object, so its input values cannot carry JavaScript getters or proxy traps. After parsing, it validates the own keys and scalar values, then writes three fixed property names into a fresh null-prototype object. The output has no inherited `constructor`, `toString`, or legacy `__proto__` accessor.

Run the implementation and assertions:

```sh
node code/volume-2/chapter-03/example-02-safe-options.js
# Expected output:
# {"format":"csv","limit":25,"includeArchived":false}
# null prototype true
# safe options assertions passed
```

This complete version can also run by itself:

```js
'use strict';

const assert = require('node:assert/strict');
const allowedKeys = new Set(['format', 'limit', 'includeArchived']);

function parseExportOptions(jsonText) {
  if (typeof jsonText !== 'string' || jsonText.length > 4096) {
    throw new TypeError('options must be JSON text of at most 4096 code units');
  }
  const input = JSON.parse(jsonText);
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('options must describe an object');
  }
  for (const key of Object.keys(input)) {
    if (!allowedKeys.has(key)) throw new TypeError(`unknown option: ${key}`);
  }

  const format = Object.hasOwn(input, 'format') ? input.format : 'json';
  const limit = Object.hasOwn(input, 'limit') ? input.limit : 100;
  const includeArchived = Object.hasOwn(input, 'includeArchived') ? input.includeArchived : false;
  if (format !== 'json' && format !== 'csv') throw new TypeError('format must be json or csv');
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 500) {
    throw new TypeError('limit must be an integer from 1 through 500');
  }
  if (typeof includeArchived !== 'boolean') {
    throw new TypeError('includeArchived must be a boolean');
  }

  const options = Object.create(null);
  options.format = format;
  options.limit = limit;
  options.includeArchived = includeArchived;
  return Object.freeze(options);
}

const options = parseExportOptions('{"format":"csv","limit":25}');
assert.equal(Object.hasOwn(options, 'format'), true);
assert.equal('constructor' in options, false);
assert.throws(() => parseExportOptions('{"limit":"25"}'), TypeError);
assert.throws(() => parseExportOptions('{"__proto__":{"enabled":true}}'), TypeError);
assert.throws(() => { options.limit = 999; }, TypeError);

console.log(JSON.stringify(options));
console.log(`null prototype ${Object.getPrototypeOf(options) === null}`);

// Expected output:
// {"format":"csv","limit":25,"includeArchived":false}
// null prototype true

// O(n) parsing and O(k) own-key validation for n code units and k keys.
// Parsing uses O(n) storage; the result contains exactly three primitive fields.
```

### Parsing and Validation Steps

1. Require a string and bound its length before parsing. The limit is in JavaScript UTF-16 code units; transport byte limits belong at the endpoint as well.
2. Parse without a reviver. Malformed JSON raises `SyntaxError`. Reject valid JSON that represents a primitive, `null`, or an array.
3. Inspect own enumerable string keys. Every key must belong to the fixed allowlist; unsupported fields raise `TypeError`.
4. Use `Object.hasOwn` to distinguish an absent option from an explicitly supplied value. Missing options receive defaults; present values such as `null`, zero, or a string are validated as supplied.
5. Construct a fresh null-prototype result only after every check succeeds. Assign fixed keys and scalar values, then freeze the result.

There is no input-selected destination key, recursive merge, shared defaults object, or mutation of an existing application object. Failure produces no partially updated configuration for another consumer to observe. Successful calls return independent result objects.

### Defaults Are an Ownership Decision

For this API, an inherited property is not a supplied option. `Object.hasOwn(input, 'limit')` expresses that rule even though the parsed object normally inherits standard object behavior. Calling `input.hasOwnProperty(...)` would instead trust a method name on the input, which data could shadow.

Absence and invalid presence are distinct. An omitted `limit` becomes 100. An explicit zero or `null` is rejected. A broad expression such as `input.limit || 100` would silently convert some invalid values to the default and blur the contract.

The output is a data dictionary. Its lack of a prototype means `options.hasOwnProperty` is absent and cannot be called. Consumers should use `Object.hasOwn(options, key)` or the known fields. `JSON.stringify` works for this primitive-only result; operations that expect inherited object methods may need adapting.

### Special Names Are Data Until an Operation Gives Them Meaning

`JSON.parse` can create an own property named `__proto__`; parsing alone does not set that object's prototype. This parser rejects that key, and also rejects `constructor`, `prototype`, and every other unsupported name, because none belongs to its schema. It never routes them into assignment or path traversal on a destination object.

A null-prototype dictionary can store `__proto__` or `constructor` as ordinary keys when an application deliberately needs such keys. That is a different schema. Removing the prototype is useful for lookup semantics, but does not replace validation or make a later generic merge safe. The independent edge-case script demonstrates these names on fresh local objects without changing any built-in prototype.

### Limits of This Parser

The schema contains only three scalar fields, so freezing the result is sufficient for its state. Extending it with nested objects would require a new ownership and validation contract. Ordinary JSON parsing retains the last occurrence of a duplicate property name; the executable file asserts that behavior. If an API must reject duplicate keys, it needs a parser that preserves that information before an ordinary object is built.

The parser does not authorize access to archived records, build SQL, escape CSV, or determine whether the caller may export data. In particular, `includeArchived: true` is a validated request preference, not a permission grant. Those decisions belong at their respective service boundaries.

The full assertions cover defaults, valid overrides, malformed text, unsupported root types, unknown names, explicit `null`, incorrect scalar types, range limits, output immutability, and the fixed strings containing special property names.

## Best Practices

- Allocate mutable arrays and objects inside the factory when each instance needs separate state.
- Keep shared behavior on a stable prototype, and keep ownership checks separate from property lookup.
- Use own-property checks when processing supplied fields; use inherited lookup only when delegation is intended.
- Validate a small schema and construct a new result instead of copying arbitrary keys into application objects.
- State whether state is public, whether methods require initialized receivers, and what remains unchanged after validation fails.
- Test two instances together: shared function identity should coexist with independent changing state.

For the underlying operations, see the specification's [ordinary property assignment algorithm](https://tc39.es/ecma262/multipage/ordinary-and-exotic-objects-behaviours.html#sec-ordinarysetwithowndescriptor). The factory and parser use different object shapes because they need different ownership and lookup behavior.
