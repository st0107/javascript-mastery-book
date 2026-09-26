# Performance and Security Notes

## Separate Semantic Lookup From Runtime Cost

Ordinary property lookup examines an object's own descriptor and can continue along its prototype chain. With `d` links to inspect, a literal traversal performs up to `d + 1` own-property checks. That is a useful teaching model for the number of objects visited, not a universal wall-clock complexity guarantee for every property access.

The language does not require an engine to repeat the full walk on each read or use a particular data structure for own properties. Getters can run arbitrary work, and proxies can intercept operations. Explain those assumptions before attaching a complexity label to a lookup helper or benchmark.

A custom diagnostic that follows `d` links and records each visited object uses `O(d)` recorded entries. Its elapsed cost includes reflective operations and any intercepted behavior. An implementation that only maintains the current object need not store the whole path.

## V8 Maps Are Not JavaScript Prototypes

V8 uses internal **Maps**, also called hidden classes, to describe aspects of object layout. These engine metadata objects are different from both a JavaScript object's prototype and the language's `Map` collection. An internal Map can include information about the prototype while also describing property layout. See [V8: Maps (Hidden Classes)](https://v8.dev/docs/hidden-classes).

Objects sharing one JavaScript prototype can still have different layouts after adding different own fields. Conversely, seeing the same keys is not enough to assert that two objects share every engine optimization assumption. V8's [fast properties article](https://v8.dev/blog/fast-properties) explains layout transitions and specialized property access as implementation techniques.

Those mechanisms motivate measurement. They do not justify universal claims that inheritance is slow, that every property read is constant time, or that deleting one property always causes a particular optimization change. Runtime versions and workloads matter.

## Sharing Methods Changes Allocation and Ownership

One prototype method can serve many instances without creating a new method function for each instance. For `n` instances sharing `m` methods, the application stores `m` shared method values plus each instance's own state. Per-instance closures or bound callbacks create additional identities and can retain their captured data.

This comparison does not rank all designs by speed or memory. A closure can provide useful private state; a bound callback can satisfy a lifecycle contract. Compare equivalent behavior, count retained application data, and separate construction cost from repeated method calls.

Prefer establishing an object's intended prototype during creation when that fits the design. Reassigning a live object's prototype changes observable lookup and may disrupt optimized assumptions in engines. If runtime replacement is a real requirement, test that behavior and profile the actual workload rather than banning it based on a tiny benchmark.

## Prototype Pollution Changes Where Values Come From

Prototype pollution occurs when unsafe writes let external input affect prototype state or inherited behavior that application code later trusts. A read such as `options.enabled` can then produce a value that is not an own field of the options record.

The following example changes only the prototype of a newly created local object. It never writes to `Object.prototype` or another shared built-in prototype.

```js
'use strict';

const input = JSON.parse('{"__proto__":{"preview":true},"theme":"dark"}');
const assigned = Object.assign({}, input);
const spread = { ...input };
const dictionary = Object.assign(Object.create(null), input);

console.log(assigned.preview, Object.hasOwn(assigned, 'preview'));
console.log(Object.getPrototypeOf(assigned) === input.__proto__);
console.log(Object.getPrototypeOf(spread) === Object.prototype);
console.log(Object.hasOwn(spread, '__proto__'), spread.preview);
console.log(Object.getPrototypeOf(dictionary) === null);
console.log(Object.hasOwn(dictionary, '__proto__'));

// Expected output:
// true false
// true
// true
// true undefined
// true
// true
```

JSON parsing creates an own data property named `__proto__`. `Object.assign` reads enumerable own source properties and assigns them through the target's `[[Set]]` behavior. With a normal `{}` target and the standard legacy accessor present, that particular name reaches an inherited setter and changes this local target's prototype. The source itself did not pollute a prototype merely by being parsed.

Object spread instead creates own data properties on its fresh target, so this copy retains `__proto__` as data. A null-prototype target has no inherited legacy setter. These distinctions follow [ECMAScript: Object.assign](https://tc39.es/ecma262/multipage/fundamental-objects.html#sec-object.assign) and [CopyDataProperties](https://tc39.es/ecma262/multipage/abstract-operations.html#sec-copydataproperties).

Spread is not general sanitization. Both mechanisms read source values and can invoke getters; both copy nested objects by reference. A later unsafe merge of the copied data can recreate the original problem. Process nested data according to a schema rather than recursively assigning arbitrary property paths into existing application objects.

## Object-Literal Syntax Is a Different Case

```js
'use strict';

const defaults = { theme: 'light' };
const linked = { __proto__: defaults };
const data = { ['__proto__']: defaults };
const __proto__ = defaults;
const shorthand = { __proto__ };

console.log(Object.getPrototypeOf(linked) === defaults);
console.log(Object.hasOwn(linked, '__proto__'));
console.log(Object.getPrototypeOf(data) === Object.prototype);
console.log(Object.hasOwn(data, '__proto__'));
console.log(Object.hasOwn(shorthand, '__proto__'));

// Expected output:
// true
// false
// true
// true
// true
```

The uncomputed colon form `__proto__: value`, including a quoted name in that form, has special object-initializer semantics when the value is an object or `null`. A computed key or shorthand entry defines an ordinary own property. Method definitions named `__proto__` also define properties. Do not treat every appearance of the spelling as the same operation. See [ECMAScript: object initializer property evaluation](https://tc39.es/ecma262/multipage/ecmascript-language-expressions.html#sec-object-initializer-runtime-semantics-propertydefinitionevaluation).

## Validate Own Fields and Keep Dictionaries Deliberate

For a bounded input record, allow only named fields and validate their values before constructing the application object. Use `Object.hasOwn(input, key)` when presence must mean a supplied own field. Avoid calling `input.hasOwnProperty(key)`: that property may be absent or shadowed. Also avoid `for...in` when the contract requires only own enumerable string keys; `Object.keys` expresses that narrower enumeration.

An own field is still untrusted input. A caller can supply its own `isAdmin: true`, and an own accessor can execute code when read. Schemas for parsed JSON can assume data values; APIs accepting arbitrary JavaScript objects need a broader behavioral contract. Neither own-property checks nor prototype identity authenticate the caller.

Use a `Map` with `set` and `get` for arbitrary-key dictionaries, or choose a null-prototype object deliberately. `map[key] = value` uses normal object properties and defeats the reason for choosing the collection interface. A null-prototype object does not inherit methods such as `toString`, so adapt consumers that assume those methods exist. OWASP describes these prevention options in its [Prototype Pollution Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Prototype_Pollution_Prevention_Cheat_Sheet.html).

Nested merge code must validate the full path and its destination. Rejecting only one spelling is not a complete defense: other inherited paths, including `constructor.prototype`, can reach prototype objects in a poorly designed traversal. Prefer a whitelist of supported structure over a general writer with an expanding list of forbidden names.

## Best Practices

- Keep per-instance mutable data out of shared prototypes unless sharing is an explicit requirement.
- Measure construction, access, and retained data separately before changing the representation.
- Treat prototypes and descriptors as observable API decisions, not only optimization hints.
- Normalize external data into a bounded schema before combining it with application state.
- Use own-property checks for ownership and separate authorization for protected operations.
- Remember that spread, freezing, a null prototype, and a `Map` each solve limited problems; none makes arbitrary input trustworthy.
