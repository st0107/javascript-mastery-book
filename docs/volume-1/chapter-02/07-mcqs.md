# Multiple-Choice Questions

Choose one answer for each question. Predict the binding state and value type before reading the explanation.

## 1. What does const prevent after initialization?

- A. Passing its value to a function
- B. Aliases from referring to its value
- C. Assignment of another value to its binding
- D. Property writes to any object it holds

**Answer: C.** The binding cannot be reassigned. Object mutability and aliasing are separate properties.

## 2. What does an ordinary var binding contain before its initializer executes?

- A. undefined
- B. The initializer result
- C. null
- D. It always throws ReferenceError

**Answer: A.** Ordinary var bindings are initialized to undefined before body statement evaluation.

## 3. What happens when reading an inner lexical binding before initialization?

- A. It returns null
- B. It throws ReferenceError
- C. Lookup uses an outer name instead
- D. It copies the outer value

**Answer: B.** Shadowing selects the inner binding throughout its scope; its TDZ does not trigger an outer fallback.

## 4. Which value has primitive Null type?

- A. null
- B. `{}`
- C. []
- D. undefined

**Answer: A.** Null is a primitive type even though typeof null returns object.

## 5. What does typeof NaN return?

- A. undefined
- B. nan
- C. object
- D. number

**Answer: D.** NaN is a special Number value. Number.isNaN distinguishes it from other numeric values.

## 6. Which test specifically detects arrays?

- A. typeof value === object
- B. Number.isFinite(value)
- C. value !== null
- D. Array.isArray(value)

**Answer: D.** Arrays are objects, so the broad object test does not distinguish them.

## 7. What does assigning an object value to a second variable do?

- A. Freezes the object
- B. Shares the same object identity
- C. Links the variable bindings so later reassignment affects both
- D. Recursively copies all properties

**Answer: B.** The bindings are independent, but initially designate the same object. Rebinding one does not rebind the other.

## 8. A function reassigns its object parameter without mutating the object. What happens to the caller binding?

- A. It receives the new object
- B. It remains unchanged
- C. It becomes immutable
- D. It becomes undefined

**Answer: B.** The parameter is a separate binding initialized with the argument value.

## 9. What happens at an executed let result; declaration?

- A. result remains forever in the TDZ
- B. The declaration throws without an initializer
- C. result initializes to null
- D. result initializes to undefined

**Answer: D.** An ordinary let declaration permits omission of the initializer; reaching it initializes the binding.

## 10. Which list contains only primitive types?

- A. String, Symbol, BigInt
- B. String, Array, Number
- C. Function, Boolean, Null
- D. Object, Symbol, BigInt

**Answer: A.** Arrays and functions are objects. String, Symbol, and BigInt are primitive types.

## 11. What can typeof do for an existing uninitialized lexical binding?

- A. Return the string uninitialized
- B. Throw ReferenceError
- C. Always return undefined
- D. Skip to an outer binding

**Answer: B.** The undeclared-identifier exception does not bypass a lexical binding's TDZ.

## 12. What does dynamic typing permit?

- A. Mutating a primitive string in place
- B. Ignoring value types during operations
- C. A const binding to be reassigned
- D. A mutable binding to hold values of different types over time

**Answer: D.** Operations still depend on types; mutable bindings are not permanently restricted to one runtime type.

## 13. Why is Number.isSafeInteger alone insufficient for a positive stock count?

- A. It also accepts zero and negative safe integers
- B. It accepts numeric strings
- C. It only works for BigInt
- D. It rejects every integer greater than one

**Answer: A.** Safe representation and integrality are separate from business range restrictions.

## 14. Which statement about collection is accurate?

- A. Unreachable data is eligible for collection without a guaranteed immediate time
- B. A cycle is necessarily a leak
- C. Every local object is collected when its function returns
- D. const objects cannot be collected

**Answer: A.** Reachability, not the declaration keyword or scope exit alone, determines whether data can still be used.

## 15. What is true of Symbol("id") === Symbol("id")?

- A. It is false because each direct call creates a distinct symbol
- B. It depends on the enclosing binding keyword
- C. It throws because symbols cannot be compared
- D. It is true because the descriptions match

**Answer: A.** Symbol descriptions help diagnostics; they do not merge distinct directly created symbols.

## 16. Why construct a new `{id, email}` record from validated strings?

- A. To guarantee that the input has no getters in every possible JavaScript object
- B. To authorize the user automatically
- C. To define a narrow output shape with independent property slots
- D. To make all possible input graphs deeply immutable

**Answer: C.** A schema-specific result establishes the promised ownership for those primitive fields without making broader claims.
