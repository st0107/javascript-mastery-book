# Theory

## 1. A Property Has Attributes as Well as a Value

A property descriptor describes an own property. A **data descriptor** contains a value and a writable flag. An **accessor descriptor** contains a getter and/or setter. Both kinds have enumerable and configurable flags. An accessor does not have a separate writable attribute: whether and how a write works depends on its setter.

| Attribute | Meaning |
| --- | --- |
| `value` | The value stored by a data property; an object value is still a shared reference |
| `writable` | Whether ordinary assignment can replace a data property's value |
| `get` | Function called to read an accessor, or `undefined` |
| `set` | Function called to write an accessor, or `undefined` |
| `enumerable` | Whether the property participates in enumeration operations that filter for enumerable keys |
| `configurable` | Whether deletion and most descriptor changes remain permitted |

`Object.getOwnPropertyDescriptor` returns a descriptor object, or `undefined` when the own property is absent. Editing that returned object does not edit the original property. Apply a descriptor through `Object.defineProperty` to change the object's property. See the [descriptor inspection API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/getOwnPropertyDescriptor).

```js
'use strict';

const task = { state: 'queued' };
const descriptor = Object.getOwnPropertyDescriptor(task, 'state');
console.log(descriptor.writable, descriptor.enumerable, descriptor.configurable);
descriptor.value = 'ready';
console.log(task.state);
Object.defineProperty(task, 'state', descriptor);
console.log(task.state);
console.log(Object.getOwnPropertyDescriptor(task, 'missing') === undefined);
// Expected output:
// true true true
// queued
// ready
// true
```

The descriptor is a description of one property, not a new ownership boundary. If its `value` is an object, reading the descriptor exposes that same object value.

## 2. Creation Defaults Differ from Update Defaults

An ordinary object-literal data property starts writable, enumerable, and configurable. When `Object.defineProperty` creates a property, omitted boolean attributes default to `false`; a new data property's omitted value is `undefined`. When updating an existing property, omitted attributes retain their existing values. An attribute explicitly supplied as `false` is not an omitted attribute. [Defining properties](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty).

```js
'use strict';

const result = { status: 'draft' };
Object.defineProperty(result, 'id', { value: 'r-17' });
Object.defineProperty(result, 'status', { value: 'ready' });
const id = Object.getOwnPropertyDescriptor(result, 'id');
const status = Object.getOwnPropertyDescriptor(result, 'status');
console.log(id.writable, id.enumerable, id.configurable);
console.log(status.writable, status.enumerable, status.configurable);
console.log(Object.keys(result).join(','));
try {
  result.id = 'r-18';
} catch (error) {
  console.log(error.name);
}
// Expected output:
// false false false
// true true true
// status
// TypeError
```

Choose the attributes explicitly when defining an API surface. A missing `enumerable: true` can unexpectedly remove a property from ordinary serialization or spreading; a missing `configurable: true` can make a temporary definition permanent.

Descriptor objects themselves are inspected using property access, including inherited descriptor fields. Build descriptors from controlled application values; a null-prototype descriptor is useful when inherited names must not participate. A descriptor that supplies `value` or `writable` together with `get` or `set` is invalid, even when one of those supplied values is `undefined`.

## 3. Non-Configurable Does Not Always Mean Non-Writable

For an ordinary non-configurable property, deletion, changing enumerability, and changing between data and accessor kinds are forbidden. A non-configurable data property can still change value while it is writable. Its writable flag may change from `true` to `false`, but cannot later change back. Once it is non-writable too, redefining its value is allowed only when the new value is the same under the specification's `SameValue` comparison. That comparison treats `NaN` as the same as itself and distinguishes positive and negative zero.

```js
'use strict';

const record = {};
Object.defineProperty(record, 'version', {
  value: 1, writable: true, enumerable: true, configurable: false
});
record.version = 2;
Object.defineProperty(record, 'version', { writable: false });
console.log(record.version);
console.log(Reflect.defineProperty(record, 'version', { value: 2 }));
console.log(Reflect.defineProperty(record, 'version', { value: 3 }));
console.log(Reflect.deleteProperty(record, 'version'));
// Expected output:
// 2
// true
// false
// false
```

For a non-configurable accessor, replacing the getter or setter with a different function is forbidden. A compatible redefinition can still succeed. This is why describing `configurable: false` as “no descriptor operation can ever succeed again” is inaccurate. The normative rules are in [ValidateAndApplyPropertyDescriptor](https://tc39.es/ecma262/multipage/ordinary-and-exotic-objects-behaviours.html#sec-validateandapplypropertydescriptor).

## 4. Assignment and Definition Are Different Operations

Assignment uses an object's `[[Set]]` behavior. That behavior may find an inherited accessor setter. `Object.defineProperty` uses `[[DefineOwnProperty]]` to define an own property; it does not invoke that inherited setter. A class public field also uses property-definition semantics, as the previous chapter explained.

```js
'use strict';

const calls = [];
const prototype = {
  set state(value) { calls.push(value); }
};
const task = Object.create(prototype);
task.state = 'queued';
console.log(calls.join(','), Object.hasOwn(task, 'state'));
Object.defineProperty(task, 'state', {
  value: 'ready', writable: true, enumerable: true, configurable: true
});
console.log(calls.length, task.state, Object.hasOwn(task, 'state'));
// Expected output:
// queued false
// 1 ready true
```

An accessor's `this` is the receiver of the operation, which need not be the object where the accessor was found. A setter can update another object, a closure variable, or a private field. Its effects are not limited to replacing one stored property value.

For ordinary rejected assignments, strict mode throws while non-strict assignment can fail silently. `Reflect.set` returns the operation's boolean result without making failure a strict-assignment exception. It can still throw if a setter or trap throws, its arguments are invalid, or a proxy invariant is violated. `Object.defineProperty` throws when definition is rejected; `Reflect.defineProperty` exposes the boolean rejection. These APIs do not swallow exceptions. [Reflect.set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflect/set).

## 5. Enumeration, Reading, and Copying Are Separate Decisions

| Operation | Keys considered | Reads property values? |
| --- | --- | --- |
| `Object.keys` | Own enumerable string keys | No ordinary getter calls |
| `Object.getOwnPropertyNames` | All own string keys | No ordinary getter calls |
| `Object.getOwnPropertySymbols` | All own symbol keys | No ordinary getter calls |
| `Reflect.ownKeys` | All own string and symbol keys | No ordinary getter calls |
| `for...in` | Enumerable string keys, including inherited keys | Only if the loop body reads values |
| Object spread | Own enumerable string and symbol keys | Yes; ordinary getters can run |
| `Object.getOwnPropertyDescriptors` | All own string and symbol keys and their descriptors | No invocation of ordinary property getters |

The “ordinary” qualification matters: a proxy can run traps during key or descriptor inspection. Enumeration order also does not imply ownership or authorization. A non-enumerable property and a symbol key remain discoverable through other inspection APIs. [Property enumerability and ownership](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Enumerability_and_ownership_of_properties).

```js
'use strict';

let reads = 0;
const marker = Symbol('marker');
const source = {
  nested: { count: 1 },
  get total() { reads += 1; return this.nested.count; },
  [marker]: 'tag'
};
Object.defineProperty(source, 'hidden', { value: 'internal' });
const descriptors = Object.getOwnPropertyDescriptors(source);
console.log(reads, Reflect.ownKeys(descriptors).length);
const copy = { ...source };
console.log(reads, copy.total, copy[marker]);
console.log(Object.hasOwn(copy, 'hidden'), copy.nested === source.nested);
console.log(typeof Object.getOwnPropertyDescriptor(copy, 'total').get);
// Expected output:
// 0 4
// 1 1 tag
// false true
// undefined
```

Spread copies the getter's result into a new data property. It neither preserves the accessor nor detaches nested objects. `Object.assign` also reads source values, but uses assignment on the destination; it can invoke a destination setter. A descriptor-preserving ordinary-object copy can use `Object.create(Object.getPrototypeOf(source), Object.getOwnPropertyDescriptors(source))`. That preserves accessors, flags, and prototype references, but still shares referenced values and getter closures. It is not a general clone for instances with private elements or built-in internal slots.

## 6. Integrity Levels Restrict the Object's Own Surface

| Operation | Add own properties | Delete existing own properties | Replace existing writable data values |
| --- | --- | --- | --- |
| `Object.preventExtensions` | No | According to each descriptor | According to each descriptor |
| `Object.seal` | No | No | Yes, where writable remains true |
| `Object.freeze` | No | No | No |

Sealing makes existing own properties non-configurable and prevents extension. Freezing also makes own data properties non-writable. Accessor descriptors have no writable flag; their getters and setters remain the same functions. All three operations return the supplied object. None creates a detached copy. A non-extensible ordinary object's prototype cannot be changed to a different object, although setting it to its current prototype is permitted. These are one-way restrictions on that object, not on all objects it can reach.

```js
'use strict';

const sealed = Object.seal({ state: 'queued' });
sealed.state = 'ready';
console.log(sealed.state, Object.isSealed(sealed), Object.isFrozen(sealed));
console.log(Reflect.set(sealed, 'extra', 1));
console.log(Reflect.deleteProperty(sealed, 'state'));
Object.freeze(sealed);
console.log(Reflect.set(sealed, 'state', 'done'), sealed.state);
console.log(Object.isFrozen(sealed));
// Expected output:
// ready true false
// false
// false
// false ready
// true
```

`Object.isFrozen` reports the object's integrity conditions, not whether `Object.freeze` was called. An empty ordinary object made non-extensible is already both sealed and frozen, because it has no properties left to restrict. See [sealing](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/seal) and [non-extensibility](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/preventExtensions).

## 7. Frozen Properties Do Not Freeze Every Kind of State

Separate four questions: can a binding be reassigned, can an own property change, can a referenced object change, and can an operation change state stored elsewhere? `const` answers the first. Descriptors and integrity levels answer parts of the second. The third and fourth require an ownership and behavioral contract.

```js
'use strict';

let current = 1;
const view = Object.freeze({
  get count() { return current; },
  set count(value) { current = value; }
});
view.count = 2;
console.log(Object.isFrozen(view), view.count);

const cache = Object.freeze(new Map());
cache.set('report', 'ready');
console.log(Object.isFrozen(cache), cache.get('report'));

class Counter {
  #count = 0;
  increment() { this.#count += 1; return this.#count; }
}
const counter = Object.freeze(new Counter());
console.log(counter.increment());
// Expected output:
// true 2
// true ready
// 1
```

Freezing controls ordinary own properties. It does not remove accessor effects, freeze Map entries, or freeze private elements. A recursive freezing routine must state which object kinds and edges it understands, how it treats accessors, cycles and shared references, and whether it is allowed to alter caller-owned objects. A schema-specific owned snapshot is often easier to reason about. See [Object.freeze](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze) and [private elements](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_elements).

## 8. A Proxy Intercepts Operations Through One Identity

`new Proxy(target, handler)` creates a distinct object. The target and handler must be objects. Missing traps delegate to the target's corresponding internal operation. The proxy is not an edited copy of the target, and it does not replace references that other code already holds. Its traps are ordinary functions whose behavior and cost must be considered whenever the operation runs.

| Surface operation | Relevant trap or internal operation |
| --- | --- |
| `proxy.key` | `get` / `[[Get]]` |
| `proxy.key = value` | `set` / `[[Set]]` |
| `Object.defineProperty(proxy, key, descriptor)` | `defineProperty` / `[[DefineOwnProperty]]` |
| `delete proxy.key` | `deleteProperty` / `[[Delete]]` |
| `key in proxy` | `has` / `[[HasProperty]]` |
| `Reflect.ownKeys(proxy)` | `ownKeys` / `[[OwnPropertyKeys]]` |
| `Object.getOwnPropertyDescriptor(proxy, key)` | `getOwnPropertyDescriptor` / `[[GetOwnProperty]]` |
| `Object.preventExtensions(proxy)` | `preventExtensions` / `[[PreventExtensions]]` |
| `proxy()` or `new proxy()` | `apply` or `construct`, only when the target supports the corresponding operation |

A high-level API can invoke several operations. For example, `Object.keys` requests keys and then descriptors to filter enumerability. Supplying an `apply` trap cannot turn a non-callable target into a callable proxy. A proxy around a Map, Date, or private-field-bearing instance does not automatically receive the target's internal state. Review the [proxy reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy).

## 9. Reflect Forwards the Operation; the Receiver Preserves Its Meaning

The `get` trap receives the target, property key, and receiver. Forwarding with `Reflect.get(target, key, receiver)` keeps that receiver when an accessor runs. Replacing it with `target[key]` makes the target the accessor's receiver, which changes observable behavior.

```js
'use strict';

const target = {
  label: 'base',
  get display() { return `job:${this.label}`; }
};
const correct = new Proxy(target, {
  get(object, key, receiver) { return Reflect.get(object, key, receiver); }
});
const wrong = new Proxy(target, {
  get(object, key) { return object[key]; }
});
const receiver = { label: 'receiver' };
console.log(Reflect.get(correct, 'display', receiver));
console.log(Reflect.get(wrong, 'display', receiver));
console.log(correct === target);
// Expected output:
// job:receiver
// job:base
// false
```

The same principle applies to `Reflect.set(target, key, value, receiver)`: an ordinary data write can be performed on the receiver, and an accessor setter is called with that receiver. Forwarding a set with the proxy as receiver can invoke its `defineProperty` trap too. That is not necessarily duplicate assignment or infinite recursion; it follows the underlying property operations. The [internal trace](03-internal-working.md) makes the distinction visible.

`Reflect` is not a bypass around proxy traps. Passing the proxy itself back to `Reflect.get` inside its own `get` trap can re-enter the same trap indefinitely. Forward to the supplied target, and choose the receiver deliberately. [Reflect.get](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflect/get).

## 10. Proxy Invariants Keep Reports Consistent with the Target

The engine checks the result of certain traps against the target's current descriptors and extensibility. For example, a `get` trap must report the same value for a non-configurable, non-writable own data property. For a non-configurable own accessor with no getter, it must report `undefined`.

```js
'use strict';

const target = {};
Object.defineProperty(target, 'id', { value: 'job-1' });
const proxy = new Proxy(target, {
  get(object, key, receiver) {
    return key === 'id' ? 'masked' : Reflect.get(object, key, receiver);
  }
});
try {
  console.log(proxy.id);
} catch (error) {
  console.log(error.name);
}
console.log(target.id);
// Expected output:
// TypeError
// job-1
```

Other important constraints include:

- `ownKeys` cannot contain duplicates or non-string/non-symbol entries. It must include non-configurable own keys; for a non-extensible target, its key set must match the target's own keys exactly.
- A `set` trap cannot truthfully report success for a changed value of a non-configurable, non-writable own data property, or for a non-configurable own accessor without a setter.
- A `preventExtensions` trap reporting success requires the target to be non-extensible. An `isExtensible` trap must report the target's actual extensibility.
- Descriptor traps must respect the target's non-configurable properties and non-extensibility. They cannot freely invent a permanently locked property that the target does not support.

These rules do not require every reported operation to change the target. For example, returning `true` from a `set` trap over an ordinary writable target property can claim success without storing anything. The application still has to implement its promised behavior. Invariants are consistency restrictions, not domain validation or transactional rollback. See the [normative proxy algorithms](https://tc39.es/ecma262/multipage/ordinary-and-exotic-objects-behaviours.html#sec-proxy-object-internal-methods-and-internal-slots), [get invariants](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/Proxy/get), and [ownKeys invariants](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/Proxy/ownKeys).

## 11. Revocation Ends Future Forwarded Operations

`Proxy.revocable` returns a proxy and a revocation function. Revocation disables the proxy's target-forwarding operations. It does not erase values already returned, undo previous effects, or invalidate other references to the target. Identity comparisons and `typeof` do not themselves require a forwarded property operation.

```js
'use strict';

const target = { state: 'ready' };
const { proxy, revoke } = Proxy.revocable(target, {});
const remembered = proxy.state;
revoke();
revoke();
console.log(remembered, target.state, typeof proxy);
console.log(proxy === proxy);
try {
  console.log(proxy.state);
} catch (error) {
  console.log(error.name);
}
// Expected output:
// ready ready object
// true
// TypeError
```

A revoked proxy is not equivalent to `null`; it remains an object identity that may be stored in a collection. A useful revocable API also limits what escapes before revocation. The [read-view production example](04-production-examples.md) exposes only scalar fields and retains ownership of its target. See [Proxy.revocable](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/revocable).

## 12. Choose a Boundary You Can Explain

Use descriptors when the requirement is a particular property's attributes. Use a frozen, owned data graph when callers need a stable snapshot with a bounded schema. Use explicit methods when actions have names, validation, and lifecycle rules. Use a proxy when a generic operation protocol really needs interception, and document the target types and invariants it supports.

The next step is to trace these operations precisely. A proxy adds more observable execution points to an object model that already includes accessors, prototypes, and receivers. It does not remove the need to reason about those earlier mechanisms.
