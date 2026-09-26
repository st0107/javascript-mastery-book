# Revision Sheet and Chapter Summary

## One-Page Revision Sheet

| Concept | Rule to remember |
| --- | --- |
| Internal `[[Prototype]]` | An inheritance link to an object or `null` |
| `Constructor.prototype` | A property used by suitable construction operations to select an instance's prototype |
| Property read | Check own descriptor, then delegate up the chain; stop on the first descriptor |
| Own value is `undefined` | Still shadows a same-named inherited property |
| `Object.hasOwn(obj, key)` | Checks only this object's properties |
| `key in obj` | Includes inherited properties |
| `Object.keys(obj)` | Own enumerable string keys |
| `Reflect.ownKeys(obj)` | All own string and symbol keys |
| Inherited method | Its storage location does not fix the receiver of a later call |
| Inherited accessor | Normally receives the original object for ordinary property access |
| Ordinary assignment | Can create an own property, invoke an inherited setter, or fail depending on descriptors |
| `delete obj.key` | Deletes only an own property; may expose an inherited value |
| `Object.create(proto)` | Chooses a prototype without running a constructor |
| Shared mutable value | A descendant can mutate the inherited object without creating an own replacement |
| Default `instanceof` | Tests a prototype relationship, not complete initialization or data validity |
| `class Child extends Parent` | Links both instance prototypes and constructor objects |
| Null-prototype dictionary | No inherited properties; still needs an explicit data contract |

## A Reliable Prediction Procedure

1. Draw each object's own properties and its direct prototype link.
2. Name the operation: read, write, delete, own inspection, call, or construction.
3. For a read, stop at the first matching descriptor, even when its value is `undefined`.
4. For an accessor, preserve the original receiver while following the search path.
5. For a method call, apply the receiver rules from Chapter 2 after finding the function.
6. For a write, inspect writable/setter rules before assuming an own property is created.
7. For mutation, identify the object being mutated and all other references that reach it.
8. For construction, distinguish instance initialization from prototype linking.

## Common Mistakes to Catch

- Describing inherited properties as copies stored on every instance.
- Using a value test to decide whether a property is owned.
- Assuming `constructor` reliably identifies an object's creation history.
- Assuming replacing `Constructor.prototype` rewires existing instances.
- Placing mutable arrays or records on a shared prototype without intending shared ownership.
- Expecting `Object.create(SomeClass.prototype)` to initialize private fields.
- Treating inherited non-writable data and inherited setters as the same assignment case.
- Using `for...in` when a data parser needs only explicitly supplied own keys.
- Trusting `instanceof` as input validation or an authorization check.
- Confusing V8 shape metadata with the JavaScript prototype chain.

## Interview Explanation

JavaScript inheritance delegates property lookup through object links. A read first checks an own descriptor, then walks the prototype chain until it finds one or reaches `null`. A found method still receives `this` according to its call; an inherited getter receives the original receiver. A constructor's `.prototype` property is distinct from its own internal prototype, though ordinary construction uses that property to establish a new instance's link. Sharing behavior works well when each instance's mutable state has a clear owner.

Use a two-instance example to support this explanation. Demonstrate shadowing and deletion, then show an inherited getter or a shared-array bug. If asked about implementation, explain that the chain is a language model and an engine may optimize its accesses.

## Chapter Summary

You can now separate four questions: where a property is stored, how lookup finds it, which receiver an operation uses, and who owns the referenced state. This model explains inherited methods, accessors, shadowing, constructor links, and mutable-state failures without relying on class vocabulary alone.

Use prototypes to express deliberate shared behavior. At external data boundaries, inspect own fields and validate a defined schema; an inherited value should not silently become trusted input. The [production examples](04-production-examples.md) and [coding challenges](06-exercises-coding-challenges.md) exercise both responsibilities.

## References

- [ECMAScript: OrdinaryGet](https://tc39.es/ecma262/multipage/ordinary-and-exotic-objects-behaviours.html#sec-ordinaryget).
- [ECMAScript: OrdinarySetWithOwnDescriptor](https://tc39.es/ecma262/multipage/ordinary-and-exotic-objects-behaviours.html#sec-ordinarysetwithowndescriptor).
- [ECMAScript: Object.create](https://tc39.es/ecma262/multipage/fundamental-objects.html#sec-object.create).
- [ECMAScript: OrdinaryHasInstance](https://tc39.es/ecma262/multipage/abstract-operations.html#sec-ordinaryhasinstance).
- [ECMAScript: class definition evaluation](https://tc39.es/ecma262/multipage/ecmascript-language-functions-and-classes.html#sec-runtime-semantics-classdefinitionevaluation).

## Further Reading

- [MDN: inheritance and the prototype chain](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Inheritance_and_the_prototype_chain) for more delegation examples.
- [MDN: Object.hasOwn](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/hasOwn) for robust ownership checks.
- [V8: Fast properties](https://v8.dev/blog/fast-properties) for an implementation view of object layouts.
- [OWASP: Prototype Pollution Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Prototype_Pollution_Prevention_Cheat_Sheet.html) for defensive data handling.

Next planned chapter: **Classes and Object Creation Patterns**. It will build on these prototype relationships to explain initialization, public and private state, class fields, inheritance contracts, and alternatives based on factories and composition.
