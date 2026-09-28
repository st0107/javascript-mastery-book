# Multiple-Choice Questions

Choose one answer per question. Each explanation distinguishes the operation or ownership contract being tested.

## 1. Which test requires a property to belong directly to a record?

- A. Boolean(record[key])
- B. Object.hasOwn(record, key)
- C. key in record
- D. record[key] !== undefined

**Answer: B.** Own presence is distinct from inherited lookup, value, and truthiness.

## 2. What does object spread copy from an ordinary object?

- A. All inherited properties
- B. All property descriptors
- C. Only string keys, whether enumerable or not
- D. Own enumerable string and symbol property values

**Answer: D.** Spread copies enumerable own values. It does not preserve descriptors or recursively clone nested objects.

## 3. Which destructuring value triggers a default?

- A. undefined
- B. null
- C. 0
- D. false

**Answer: A.** A default applies when the extracted value is undefined; other falsy values are preserved.

## 4. A spread copy contains a nested object. What is true by default?

- A. The nested object is recursively copied
- B. The nested object is frozen
- C. The nested identity is shared
- D. The nested property is omitted

**Answer: C.** A shallow copy stores the same object-valued reference in its new outer property.

## 5. What does Object.keys include?

- A. Own enumerable string keys
- B. Every own symbol and string key
- C. Inherited enumerable keys only
- D. Own non-enumerable keys only

**Answer: A.** Use Reflect.ownKeys when all own string and symbol keys are needed.

## 6. What are omitted flags for a newly defined Object.defineProperty data property?

- A. Inherited from the prototype
- B. Writable true, others false
- C. False
- D. All true

**Answer: C.** For a new property, omitted writable, enumerable, and configurable flags default to false.

## 7. Why is record.hasOwnProperty(key) unsafe as a general record operation?

- A. It always includes inherited keys
- B. The record can shadow the method or have no inherited method
- C. It reads every field recursively
- D. It can only accept numeric keys

**Answer: B.** Object.hasOwn avoids relying on a method obtained from the record itself.

## 8. What can happen while spreading an accessor property?

- A. The getter is always copied without running
- B. The property becomes inherited
- C. The target becomes a proxy
- D. The source getter runs to produce the copied value

**Answer: D.** Spread reads the source value and creates an own data property containing that result.

## 9. How does Object.assign differ from spread into a new literal?

- A. It never reads getters
- B. It ignores symbol keys in every case
- C. It always deep-clones nested values
- D. Its writes can invoke setters on the existing target

**Answer: D.** Assignment writes and data-property creation have different observable behavior.

## 10. What does Object.freeze guarantee for an ordinary object with a nested data object?

- A. Its nested values are cloned
- B. No getter can have effects
- C. Every reachable object becomes immutable
- D. Its own data properties cannot be reassigned, while nested objects may remain mutable

**Answer: D.** Freeze applies to the object passed, not automatically to its reachable graph.

## 11. A property has value undefined. What follows about its presence?

- A. Presence still requires a separate check
- B. It must be absent
- C. It cannot be enumerable
- D. It must be inherited

**Answer: A.** Undefined can be stored in an own property or obtained from a missing property.

## 12. What can deletion of an own property reveal?

- A. A new lexical binding
- B. An automatic clone
- C. A frozen descriptor for that key
- D. An inherited value at the same key

**Answer: D.** Ordinary lookup may continue to the prototype after the own property is removed.

## 13. Why use explicit public-view fields instead of removing one secret field with rest?

- A. Rest always copies inherited fields
- B. Rest never copies strings
- C. An allowlist authorizes every caller
- D. An allowlist avoids automatically exposing future internal fields

**Answer: D.** Publishing only approved fields keeps future schema additions private unless deliberately exposed.

## 14. What is true of a null-prototype dictionary?

- A. It authorizes all copied keys for every future consumer
- B. It cannot store __proto__ as data
- C. It has no Object.prototype inheritance and can hold arbitrary string data keys
- D. It inherits hasOwnProperty

**Answer: C.** The dictionary avoids inherited name collisions, but subsequent consumers still need safe key handling.

## 15. Which boundary best prevents arbitrary preference keys from controlling a merge?

- A. Validate allowed keys at every supported level and construct a fixed result
- B. Only call JSON.parse
- C. Only freeze the output after a generic recursive merge
- D. Only reject unknown root keys, ignoring nested keys

**Answer: A.** Parsing and freezing do not substitute for validation before keys drive operations.

## 16. An immutable update copies root and preferences but shares metadata. What is the correct claim?

- A. All old records become unreachable
- B. No additional objects were allocated
- C. The entire graph is independent
- D. Only the copied path is independent; metadata remains shared

**Answer: D.** Ownership must be described per retained identity, including intentionally shared subgraphs.
