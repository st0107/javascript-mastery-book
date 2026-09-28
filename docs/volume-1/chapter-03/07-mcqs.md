# MCQs

Choose an answer before reading the explanation. Assume modern JavaScript and ordinary data values unless the question states otherwise.

## 1. What does `0 ?? 8` produce?

A. 8
B. 0
C. false
D. undefined

**Answer: B.** Zero is present. Only null and undefined choose the coalescing fallback.

## 2. What is the result of `'ready' && 0`?

A. true
B. false
C. 'ready'
D. 0

**Answer: D.** The truthy left operand selects the right operand, which is returned unchanged.

## 3. In `a() + b() * c()`, which calls execute first when none throws?

A. a, then b, then c
B. b, then c, then a
C. c, then b, then a
D. The engine may freely reorder observable calls

**Answer: A.** Multiplication controls grouping, not the order of those operand calls.

## 4. How does `2 ** 3 ** 2` group?

A. (2 ** 3) ** 2
B. 2 ** (3 * 2)
C. 2 ** (3 ** 2)
D. It is a syntax error

**Answer: C.** Exponentiation is right-associative, so the result is 512.

## 5. Given `let n = 4`, what value does `n++` return?

A. 5
B. 4
C. undefined
D. A reference to n

**Answer: B.** Postfix update returns the old numeric value while storing the incremented value.

## 6. With `const x = 0`, what happens at `x ??= 9`?

A. x becomes 9
B. SyntaxError
C. TypeError
D. It returns 0 without writing

**Answer: D.** The nullish condition is false, so no assignment to the const binding is attempted.

## 7. For `const a = null`, what happens at `(a?.b).c`?

A. TypeError
B. undefined
C. null
D. ReferenceError

**Answer: A.** Grouping ends the optional chain; ordinary access on undefined throws.

## 8. What happens at `({ run: 3 }).run?.()`?

A. Returns 3
B. Returns undefined
C. TypeError
D. Skips run because it is not callable

**Answer: C.** Optional invocation skips nullish values, not arbitrary nonfunctions.

## 9. What does `-8 % 3` produce?

A. 1
B. -2
C. 2
D. -1

**Answer: B.** Remainder is not a nonnegative modulo operation; its nonzero sign follows the dividend.

## 10. What is `1 << 32` for Number operands?

A. 0
B. 4294967296
C. RangeError
D. 1

**Answer: D.** The shift count is reduced to its low five bits, so 32 acts like zero.

## 11. Which expression checks that all required bits are available?

A. (available & required) === required
B. (available & required) !== 0
C. available === required
D. available | required

**Answer: A.** Nonzero intersection tests any overlap. Equality with the required mask tests every required bit.

## 12. Why can `target[key()] += 1` differ from a naive expanded assignment?

A. Compound assignment never calls getters
B. It always returns a boolean
C. The compound form evaluates the destination once
D. The expanded form cannot write properties

**Answer: C.** Repeating target/key expressions may repeat effects or select a different destination.

## 13. Which condition correctly checks an exclusive range?

A. 0 < n < 10
B. 0 < n && n < 10
C. n > (0 && n) < 10
D. 0 < (n < 10)

**Answer: B.** Each comparison must inspect n. A chained comparison instead compares an intermediate boolean.

## 14. What does `false || 'fallback'` return?

A. false
B. true
C. undefined
D. 'fallback'

**Answer: D.** OR selects the right operand when the left is falsy; it does not normalize to a boolean.

## 15. Which is valid JavaScript?

A. (a ?? b) || c
B. a ?? b || c
C. a && b ?? c
D. a || b ?? c

**Answer: A.** Mixing coalescing with AND/OR requires explicit grouping.

## 16. Why avoid `value | 0` as a general integer validator?

A. It rejects every numeric string
B. It preserves all safe integers
C. It can truncate and wrap values into signed 32-bit range
D. It always throws for fractions

**Answer: C.** A conversion that discards information is not validation; validate the input domain first.
