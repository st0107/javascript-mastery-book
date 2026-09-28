# Revision Sheet and Summary

## Property Operations

| Need | Operation or rule |
| --- | --- |
| Read a fixed identifier-named property | `record.name` |
| Read a computed or non-identifier key | `record[key]` |
| Check own presence | `Object.hasOwn(record, key)` |
| Check presence including inheritance | `key in record` |
| Enumerate own enumerable string keys | `Object.keys(record)` |
| Enumerate every own string/symbol key | `Reflect.ownKeys(record)` |
| Read a default only for undefined | Destructuring default |
| Remove a configurable own property | `delete record.key` |
| Copy own enumerable values into a new outer record | Object spread |

## Ownership Rules

A second binding or property can hold the same object identity. Spreading an object makes a new outer record while retaining object-valued references. Copy each modified path when the update must preserve an earlier view. A schema-specific snapshot should name exactly which nested records it owns and which leaves are primitive.

Freezing is shallow. Symbol keys are discoverable. Destructuring can read inherited properties. A missing field, undefined, null, false, zero, and an empty string are different states; defaults and presence checks should reflect the API's policy.

## Descriptor Rules

A data property has a value and writable flag; an accessor property has getter/setter behavior. Both have enumerable and configurable flags. New properties created by `Object.defineProperty` default omitted flags to false. Spread reads values and does not preserve source descriptors or prototypes.

## Boundary Rules

Parse data using a documented representation. Validate shape, own keys, field types, and domain values. Build the allowed output schema explicitly. A null-prototype dictionary is useful for string data keys, but copying those keys later into another target still requires care. Do not use a generic recursive merge as a substitute for a schema.

## Summary

Property access explains where a value comes from; ownership explains who can change the object behind that value. Correct record APIs make both explicit. Prove isolation by mutating input and output nested records in tests, and prove schema discipline with missing, inherited, unknown, and malformed fields.

Continue with [Arrays and Collections](../chapter-09/01-introduction.md). Volume 2's [Prototypes and Inheritance](../../volume-2/chapter-03/01-introduction.md) develops inherited lookup beyond the ordinary-record model used here.

## References and Further Reading

- [MDN enumerability and ownership](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Enumerability_and_ownership_of_properties): compare traversal operations.
- [MDN Object.hasOwn](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/hasOwn): distinguish own presence from lookup.
- [MDN destructuring](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring): extraction, renaming, defaults, and rest.
- [MDN Object.defineProperty](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty): descriptor defaults and restrictions.
- [MDN prototype pollution](https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/Prototype_pollution): data-key hazards and defenses.
- [V8 fast properties](https://v8.dev/blog/fast-properties): implementation context, not a portable allocation guarantee.
