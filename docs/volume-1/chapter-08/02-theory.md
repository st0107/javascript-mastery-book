# Theory

## Properties Have Keys and Behavior

An ordinary object literal creates a new object. Most literal entries create writable, enumerable, configurable own data properties. Keys are strings or symbols; a numeric key expression is converted to a string key. Dot notation uses a literal identifier name, while bracket notation evaluates an expression for the key.

```js
'use strict';

const field = 'delivery-zone';
const internalId = Symbol('internalId');
const shipment = { id: 'S-1', [field]: 'north', [internalId]: 17, 1: 'first' };
console.log(shipment.id, shipment[field]);
console.log(shipment[1], shipment['1']);
console.log(shipment[internalId]);

// Expected output:
// S-1 north
// first first
// 17
```

Use brackets for computed keys or names that are not valid dot-notation identifiers. Distinct directly created symbols remain distinct keys even if their descriptions match. A symbol key is discoverable through reflection; it is not an access-control mechanism.

## Own Properties and Inherited Lookup

Reading `record.key` first asks the object's property machinery for a value. For ordinary objects, lookup can follow the prototype relationship when an own property is absent. `Object.hasOwn(record, key)` asks a narrower question: does this object itself have that property? The `in` operator asks whether the property exists anywhere in ordinary lookup, including prototypes.

```js
'use strict';

const defaults = { region: 'APAC' };
const request = Object.create(defaults);
request.id = 'R-1';
request.note = undefined;
console.log(request.region, 'region' in request, Object.hasOwn(request, 'region'));
console.log(request.note, request.missing);
console.log(Object.hasOwn(request, 'note'), Object.hasOwn(request, 'missing'));

// Expected output:
// APAC true false
// undefined undefined
// true false
```

An undefined result alone does not establish that a property is absent. Use ownership checks when a request must explicitly supply its own field. Prefer the static method to `record.hasOwnProperty(...)`: data can shadow that method, and a null-prototype dictionary does not inherit it. See [Object.hasOwn](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/hasOwn).

## Enumerating Keys Deliberately

| Operation | Own properties | Inherited properties | Non-enumerable properties | Symbol keys |
| --- | --- | --- | --- | --- |
| `Object.keys` | Yes | No | No | No |
| `Object.entries` | Yes, with values | No | No | No |
| `for...in` | Enumerable string keys | Enumerable string keys | No | No |
| `Reflect.ownKeys` | Yes | No | Yes | Yes |
| Object spread | Copies enumerable values | No | No | Yes |

```js
'use strict';

const token = Symbol('token');
const record = { visible: 1, [token]: 2 };
Object.defineProperty(record, 'hidden', { value: 3, enumerable: false });
console.log(Object.keys(record).join('|'));
console.log(Reflect.ownKeys(record).map(String).join('|'));
const copy = { ...record };
console.log(copy[token], Object.hasOwn(copy, 'hidden'));

// Expected output:
// visible
// visible|hidden|Symbol(token)
// 2 false
```

For ordinary own keys, array-index string keys (canonical nonnegative integers below 2^32 - 1) come first in numeric order, followed by other string keys in insertion order, then symbols in insertion order. A key such as `01` or `4294967295` is in the ordinary string group. Do not use an object's enumeration order as a business priority list. Keep an explicit ordered array when order is part of the contract. Details and operation differences are documented in [MDN enumerability and ownership](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Enumerability_and_ownership_of_properties).

## A Property Descriptor Is More Than a Value

A data property has a value and a writable flag. An accessor property has getter/setter functions instead. Both kinds have enumerable and configurable flags. Enumerable controls inclusion in selected traversal operations; configurable controls deletion and many descriptor changes. It is not a synonym for "the value is writable."

When a new property is created by `Object.defineProperty`, omitted boolean flags default to false. Object literal data properties normally start with those flags true. Do not assume the two creation mechanisms have identical defaults.

```js
'use strict';

const order = {};
Object.defineProperty(order, 'id', { value: 'O-1', enumerable: true });
console.log(Object.keys(order).join('|'));
try { order.id = 'O-2'; } catch (error) { console.log(error.name); }
console.log(Object.getOwnPropertyDescriptor(order, 'id').writable);
const pricing = {
  cents: 450,
  get label() { return `${this.cents} cents`; }
};
console.log(pricing.label);

// Expected output:
// id
// TypeError
// false
// 450 cents
```

Reading `pricing.label` calls code; it is not simply loading a stored label slot. Getters can have effects or throw. Destructuring and copying that read properties can therefore execute code on arbitrary JavaScript objects. This chapter's external-data parsers accept JSON text, whose parsed values do not contain functions or accessors. The [descriptor reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty) gives the formal flag behavior.

## Destructuring Reads Values Into Bindings

```js
'use strict';

const input = { id: 'U-1', label: undefined, note: null };
const { id: userId, label = 'Guest', note = 'none', ...remaining } = input;
console.log(userId, label, note);
console.log(Object.keys(remaining).length);
input.id = 'U-2';
console.log(userId);

// Expected output:
// U-1 Guest null
// 0
// U-1
```

The syntax `id: userId` reads property `id` and initializes the binding `userId`. A default runs only when the retrieved value is undefined, whether caused by absence or an explicit undefined value. Null does not trigger that default. Destructuring a nested object value still shares its identity; it does not recursively clone it.

Ordinary property lookup during destructuring can read inherited fields. Object rest gathers remaining own enumerable properties. Therefore destructuring is concise extraction, not by itself a schema or ownership validator. See [MDN destructuring](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring).

## Spread Creates an Outer Copy

Object spread reads own enumerable source properties and creates data properties on the new object. Later entries overwrite earlier values at matching keys. It does not preserve a source's prototype or descriptor flags, and it does not recursively clone property values.

```js
'use strict';

const previous = { id: 'U-1', options: { theme: 'light', email: true } };
const next = { ...previous, options: { ...previous.options, theme: 'dark' } };
console.log(previous === next, previous.options === next.options);
console.log(previous.options.theme, next.options.theme, next.options.email);

// Expected output:
// false false
// light dark true
```

The update copies every record on the modified path: the root and `options`. Fields outside that path remain shared if they contain objects. This is useful structural sharing when callers respect the ownership or immutability policy; it is not complete graph independence. [MDN spread syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax) documents the shallow-copy contract.

`Object.assign(target, source)` also reads source values, but writes by assignment to an existing target and can invoke its setters. Object spread into a new literal defines own properties instead. Neither operation is a general sanitizer for unknown objects.

## Optional Fields and Deletion

Choose a policy for absent, undefined, and null values. A patch API might interpret absence as "leave unchanged" and null as "clear the field." A defaulting API might accept only absence as a request for its default. Read presence with `Object.hasOwn` when these distinctions matter.

```js
'use strict';

const record = { note: 'call ahead' };
record.note = undefined;
console.log(Object.hasOwn(record, 'note'));
delete record.note;
console.log(Object.hasOwn(record, 'note'));

// Expected output:
// true
// false
```

Setting undefined preserves the property; deleting a configurable own property removes it. A later ordinary lookup can then expose an inherited property of the same name. Use explicit output schemas instead of treating undefined, deletion, and inheritance as interchangeable.

## Freezing Is Shallow

`Object.freeze` prevents extensions and makes own properties non-configurable; own data properties also become non-writable. It does not recursively freeze nested objects or make accessor behavior pure.

```js
'use strict';

const settings = Object.freeze({ options: { theme: 'light' } });
settings.options.theme = 'dark';
try { settings.options = {}; } catch (error) { console.log(error.name); }
console.log(settings.options.theme);

// Expected output:
// TypeError
// dark
```

A frozen outer object can still point to mutable nested state. Freeze selected owned records when the contract requires it, and do not claim that freezing is a security boundary. [Object.freeze](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze) describes these limits.
