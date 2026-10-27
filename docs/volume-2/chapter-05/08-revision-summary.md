# Revision Sheet and Chapter Summary

## Rules to Recall

| Question | Rule |
| --- | --- |
| Data or accessor? | Data uses value/writable; accessor uses get/set; both use enumerable/configurable |
| New defineProperty defaults? | Omitted boolean flags are false; object-literal data flags normally are true |
| Existing descriptor update? | Omitted attributes retain their existing values |
| Non-configurable and writable? | Value can change; writable can become false but cannot then become true |
| Descriptor inspection? | Returns separate descriptor objects; referenced values remain shared |
| Assignment versus definition? | Assignment may use inherited setters; own-property definition does not |
| All own keys? | Reflect.ownKeys includes non-enumerable and symbol keys |
| Spread an accessor? | Read the getter and create a normal data property with its result |
| Seal versus freeze? | Seal fixes the own property set; freeze also fixes own data values |
| Frozen versus immutable? | Nested objects, accessor effects, private elements, and built-in internal state need separate reasoning |
| Proxy versus target? | Distinct identities; operations through other aliases bypass the proxy |
| Default forwarding? | Use Reflect on the target and preserve the intended receiver |
| Proxy invariants? | Trap results must respect locked descriptors and target extensibility |
| Revocation? | Ends future forwarded operations through that proxy; escaped values remain |

## One-Minute Explanation

A descriptor controls how one property behaves. Integrity levels apply restrictions across an object's own properties, but they do not automatically detach or recursively freeze reachable state. A proxy introduces a separate identity whose internal operations can call handler traps. Reflect lets a handler delegate an operation while preserving the receiver when that is the intended behavior. The engine checks trap results against target invariants, so the handler cannot contradict locked descriptors or a non-extensible key set. I choose the boundary by identifying which values are owned, which operations are allowed, and how access ends.

## Prediction Check

```js
'use strict';
const nested = { count: 1 };
const record = Object.freeze({ nested });
const proxy = new Proxy(record, {});
nested.count = 2;
console.log(proxy.nested.count, proxy === record);
console.log(Object.isFrozen(record), Object.isFrozen(nested));
console.log(Reflect.set(proxy, 'nested', {}));
// Expected output:
// 2 false
// true false
// false
```

The root cannot replace its nested property, but the nested object can change. An empty handler forwards; it does not create a snapshot. Connect this result to the [ownership diagram](03-internal-working.md).

## Review Before Shipping

- Enumerate all mutation paths, including definition, deletion, prototype changes, and method effects.
- State accepted object kinds. A prototype test is not a universal proxy detector.
- Avoid claiming secrecy from non-enumerability or symbol naming.
- Check receivers and invariant behavior after sealing, freezing, and revocation.
- Assert that invalid inputs leave supported state unchanged.
- Bound logging and graph traversal; measure performance with the intended runtime.

## Chapter Summary

The useful question is not simply whether an object is “read-only.” Ask which identity exposes which operation over which state. A frozen owned configuration provides stable values for a bounded schema. A frozen accessor interface may still manage mutable closure state. A revocable view can limit ongoing operations while leaving previously copied values intact. Those are different contracts, and each can be correct when its scope is explicit.

The [exercises](06-exercises-coding-challenges.md) practice property metadata, shallow descriptor copies, accessor state, receiver forwarding, key invariants, and revocation. The [field guide](11-professional-field-guide.md) applies the same questions to reviews. Next planned chapter: **Iterators and Generators**, where objects expose another explicit operation protocol.

## References

- [ECMAScript: ordinary and proxy object algorithms](https://tc39.es/ecma262/multipage/ordinary-and-exotic-objects-behaviours.html).
- [MDN: Object.defineProperty](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty).
- [MDN: Object.freeze](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze).
- [MDN: Reflect](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflect).
- [MDN: Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy).

## Further Reading

- [Property enumerability and ownership](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Enumerability_and_ownership_of_properties) for choosing inspection and copy operations.
- [Object.getOwnPropertyDescriptors](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/getOwnPropertyDescriptors) for descriptor-preserving ordinary-object reconstruction.
- [Proxy.revocable](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/revocable) for lifecycle behavior and its limitations.
- [V8 fast properties](https://v8.dev/blog/fast-properties) for historical implementation context; distinguish these strategies from language guarantees.
