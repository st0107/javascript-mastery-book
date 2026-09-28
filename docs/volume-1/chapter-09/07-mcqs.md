# MCQs

Assume ordinary unmodified prototypes and Node.js 20 or newer. Choose one answer before reading the explanation.

## 1. What happens to length after deleting index 1 from [1, 2, 3]?

A. It becomes 2
B. It becomes 1
C. It remains 3, with a hole at index 1
D. Deletion throws for every array

**Answer: C.** delete removes a property without shifting later elements or changing length.

## 2. How many callbacks does Array(3).map(() => 1) invoke?

A. 0
B. 1
C. 3
D. It throws before invoking any callback

**Answer: A.** The three positions are absent. map skips holes.

## 3. Which statement about [undefined].map(callback) is correct?

A. It behaves exactly like Array(1).map(callback)
B. It invokes callback only if the callback accepts an index
C. It always throws
D. It invokes callback once for the present undefined element

**Answer: D.** An explicit undefined value is a present element, unlike a hole.

## 4. What does [].every(() => false) return?

A. false
B. true
C. undefined
D. TypeError

**Answer: B.** There is no counterexample in an empty array. A nonempty requirement needs a separate check.

## 5. What happens to [].reduce((a, b) => a + b) without an initial value?

A. TypeError
B. It returns 0
C. It returns undefined
D. It returns an empty array

**Answer: A.** There is no first present element to use as the accumulator.

## 6. Which method best expresses ?does any value match?? without constructing every match?

A. filter
B. map
C. some
D. reduce without an initial value

**Answer: C.** some stops at the first truthy predicate result and returns a boolean.

## 7. Why can find returning undefined be ambiguous?

A. It converts all falsy values to undefined
B. It always skips explicit undefined elements
C. It returns an index for successful matches
D. A matching item itself may be undefined

**Answer: D.** Use findIndex when the distinction between a found undefined and no match matters.

## 8. Which call returns a numerically sorted copy of finite Numbers?

A. values.sort()
B. values.toSorted((a, b) => a - b)
C. values.sort((a, b) => a > b)
D. values.toSorted()

**Answer: B.** toSorted copies the array, and the comparator supplies numeric order.

## 9. If two records compare equal in a stable sort, what happens?

A. Their original relative order is preserved
B. They are always reversed
C. One record is removed
D. The comparator must be called exactly once for that pair

**Answer: A.** Stability concerns output order, not a fixed comparison schedule.

## 10. What does an array spread copy do to object elements?

A. Deep-clones each object
B. Freezes each object
C. Copies their references into new array slots
D. Converts each object to a string

**Answer: C.** Reordering the outer array is independent; mutating a shared record is still visible through both arrays.

## 11. What is new Set([NaN, NaN, 0, -0]).size?

A. 4
B. 3
C. 1
D. 2

**Answer: D.** SameValueZero equates NaN with NaN and positive zero with negative zero.

## 12. What does new Set([{id: 1}, {id: 1}]).size return?

A. 1
B. 2
C. 0
D. TypeError

**Answer: B.** The two objects have distinct identities even though their fields match.

## 13. Which operation creates a Map entry?

A. map.set(key, value)
B. map[key] = value
C. map.key = value
D. Object.assign(map, {[key]: value})

**Answer: A.** Map entries use set/get/has; ordinary property assignment does not populate the entry collection.

## 14. Updating an existing Map key with set does what to iteration order?

A. Moves it to the front
B. Moves it to the end
C. Retains its position
D. Sorts all keys lexicographically

**Answer: C.** Deleting and then reinserting would move it to the end.

## 15. Why does ['10', '10', '10'].map(parseInt) produce surprising values?

A. map invokes callbacks in reverse order
B. parseInt mutates the source array
C. map omits every repeated string
D. map passes its index as parseInt's radix argument

**Answer: D.** The radices become 0, 1, and 2. A wrapper can pass the intended radix explicitly.

## 16. What is guaranteed about Map/Set access complexity?

A. Every operation is worst-case O(1)
B. Average access must be sublinear in collection size
C. Every implementation must use a hash table
D. Every lookup scans the entire collection

**Answer: B.** The standard permits different implementations; a typical expected constant-time model is not a universal guarantee.
