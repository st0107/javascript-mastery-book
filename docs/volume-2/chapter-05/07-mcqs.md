# MCQs

Choose an answer before reading the explanation. Unless stated otherwise, objects are ordinary, prototypes are unmodified, and JavaScript runs in strict mode.

## 1. New Definition Defaults

After `Object.defineProperty({}, 'id', { value: 3 })`, what are the new property's boolean attributes?

A. Writable, enumerable, and configurable are all true.
B. Writable, enumerable, and configurable are all false.
C. Writable is true; the others are false.
D. Enumerable is true; the others are false.

**Answer: B.** Omitted flags default to false for a newly defined property. Object-literal defaults differ. Updating an existing descriptor also differs because omitted attributes retain their prior values.

## 2. Invalid Descriptor

Which descriptor is invalid for `Object.defineProperty`?

A. `{ value: undefined, writable: false }`
B. `{ get: undefined, configurable: true }`
C. `{ enumerable: true }`
D. `{ value: undefined, get: undefined }`

**Answer: D.** Supplying a data-descriptor field and an accessor-descriptor field mixes the two kinds even when both values are undefined. A generic descriptor with only enumerable is valid.

## 3. Non-Configurable but Writable

A data property is non-configurable and writable. Which transition is allowed?

A. Change its value, then make writable false.
B. Change enumerable from false to true.
C. Replace it with an accessor.
D. Delete it before recreating it.

**Answer: A.** Non-configurable does not imply non-writable. Value updates are allowed while writable is true, and writable may become false. The other changes violate non-configurability.

## 4. A Descriptor Copy

`const d = Object.getOwnPropertyDescriptor(item, 'count'); d.value = 9;` runs on an ordinary data property. What happens to `item.count`?

A. It becomes 9 immediately.
B. It changes when `d` is garbage-collected.
C. It remains unchanged until an appropriate operation updates the original property.
D. Its writable flag becomes false.

**Answer: C.** The returned descriptor is a separate object. Editing its fields does not redefine the source property. A referenced object stored as its value would still be shared, which is a different kind of mutation.

## 5. Own Keys Including Symbols

Which operation returns all own string and symbol keys, including non-enumerable ones?

A. `Object.keys(object)`
B. `for...in`
C. `JSON.stringify(object)`
D. `Reflect.ownKeys(object)`

**Answer: D.** `Object.keys` filters out symbols and non-enumerable properties; `for...in` considers enumerable strings and inheritance. JSON serialization is not a complete key-list API.

## 6. Getter Copying

An enumerable getter returns `5`. What does `{ ...source }` ordinarily place at that key?

A. The same accessor descriptor.
B. A normal data property containing the getter's returned value.
C. A non-writable getter function.
D. No property, because getters are excluded.

**Answer: B.** Spread reads the value and creates a data property. It can run the getter and does not preserve its descriptor. Descriptor copying is a separate operation.

## 7. Sealed Data

After `Object.seal({ count: 1 })`, which action is ordinarily still possible?

A. Add another own property.
B. Delete count.
C. Assign a different count value.
D. Change count into an accessor.

**Answer: C.** The literal's writable flag stays true under seal. Sealing blocks extensions and makes existing properties non-configurable. Freeze would additionally make this data property non-writable.

## 8. Frozen Accessor

A frozen object has an existing setter that writes a closure variable. What does freezing do to that setter?

A. Keeps the setter function; calling it may still change the closure variable.
B. Replaces it with undefined.
C. Freezes the entire lexical environment.
D. Converts it to a non-writable data property.

**Answer: A.** Accessors have no writable flag. Freezing prevents replacement of the accessor descriptor but does not remove the function's behavior or freeze external state.

## 9. Frozen Map

What happens when `map.set('x', 1)` is called on `Object.freeze(new Map())`?

A. It always throws because every Map entry is a non-writable property.
B. It returns a new Map and leaves the original empty.
C. It can add the entry because freezing ordinary properties does not freeze Map's entry storage.
D. It changes the prototype to allow the write.

**Answer: C.** Map entries are not ordinary own data properties. The same surface restriction does not automatically cover private elements or other internal state.

## 10. Proxy Identity

For `const p = new Proxy(target, {})`, which statement is correct?

A. `p === target` is true because all traps are absent.
B. Existing aliases to target are replaced with p.
C. Target becomes frozen automatically.
D. p has a distinct identity and absent traps forward operations.

**Answer: D.** Forwarding behavior does not make the two object identities equal. Direct target aliases remain available and bypass operations performed through the proxy.

## 11. Forwarding a Getter

Which forwarding expression preserves the `get` trap's receiver for an accessor?

A. `Reflect.get(target, key, receiver)`
B. `target[key]`
C. `Reflect.get(receiver, key)` in the same trap
D. `Object.getOwnPropertyDescriptor(target, key).value`

**Answer: A.** The receiver determines the getter's this value. The second expression substitutes the target, the third can re-enter the trap, and an accessor descriptor does not hold a data value field.

## 12. Set and Define Traps

A set trap forwards using `Reflect.set(target, key, value, receiver)` with the proxy as receiver. Its defineProperty trap also runs. Which explanation is best?

A. The engine is performing two independent user assignments.
B. The ordinary write can define or update a property on the receiver, invoking the proxy's definition operation.
C. Reflect bypassed every trap and the log is impossible.
D. All proxy assignments must recurse forever.

**Answer: B.** Set and definition are distinct internal operations that can participate in one assignment. The handler must not count them as two independent domain events without understanding the trace.

## 13. Locked Data Get Invariant

The target has a non-configurable, non-writable own `id` equal to `'a'`. A get trap returns `'b'` for id. What does `proxy.id` do?

A. Returns b, because traps can override every fact.
B. Returns a after silently ignoring the trap.
C. Deletes the target descriptor.
D. Throws TypeError because the trap violates the get invariant.

**Answer: D.** The proxy must report the same value for this locked own data property. Its trap may run first, but its returned value is checked before a successful read completes.

## 14. Own-Key Filtering After Non-Extensibility

The target is non-extensible and has a configurable own `_temp` property. May the ownKeys trap omit it?

A. Yes, because it remains configurable.
B. Yes, if it starts with an underscore.
C. No; the reported key set must equal the target's own-key set.
D. Only if the caller uses Reflect instead of Object.

**Answer: C.** Non-extensibility strengthens the constraint to an exact own-key set. A non-configurable key could not be omitted even on an extensible target. Naming conventions do not change invariants.

## 15. False Versus Throw

A set trap returns false without throwing. Which statement is correct?

A. `Reflect.set` must throw because the enclosing program is strict.
B. `Reflect.set` returns false; a strict assignment through the proxy throws.
C. Both operations silently succeed.
D. The target property is removed.

**Answer: B.** Reflect exposes the boolean result. Strict assignment converts a false set result into TypeError. Separately, user code or invariant checks may themselves throw even when Reflect is used.

## 16. Values After Revocation

Code saves `const saved = proxy.progress`, then revokes the proxy. Progress was a number. What is true?

A. saved remains available; a subsequent forwarded read through the revoked proxy throws.
B. saved becomes undefined.
C. Every reference to the target is also revoked.
D. `typeof proxy` must throw.

**Answer: A.** Revocation ends future forwarded operations through that proxy. It does not erase copied values or change object identity. `typeof` does not need to forward a property operation.
