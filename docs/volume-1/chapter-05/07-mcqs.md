# Strings, Numbers, and Dates: MCQs

Choose one answer per question, then explain the rule before checking the answer.

## 1. What does `"A\u{1F680}".length` return?

A. 2, because there are two code points
B. 3, because the rocket uses a surrogate pair
C. 1, because both symbols form a string
D. 4, because each visible symbol requires two units

**Answer: B.** String length counts UTF-16 code units: A uses one and the rocket uses two.

## 2. Which operation can preserve a base letter plus combining accent when truncating visible text?

A. `slice(0, 1)`
B. `split("")`
C. `charAt(0)`
D. Grapheme segmentation before selecting clusters

**Answer: D.** Code-unit and code-point operations can separate a combining sequence. Grapheme segmentation matches the stated UI unit.

## 3. After `const a = " x "; const b = a.trim();`, what is `a`?

A. `" x "`
B. `"x"`
C. A String wrapper
D. `undefined`

**Answer: A.** trim returns a value. It does not mutate the original string.

## 4. Why might repeated `/A/g.test("A")` alternate results?

A. The input changes case
B. The regex consumes the source string
C. Global testing advances lastIndex
D. The parser recompiles the expression differently

**Answer: C.** The regex object holds search position. The original string stays unchanged.

## 5. Which value satisfies `Number.isSafeInteger`?

A. `"42"`
B. `Infinity`
C. `42`
D. `2 ** 53`

**Answer: C.** The method requires a Number that is an integer within the safe range; it does not coerce.

## 6. Why is `0.1 + 0.2 === 0.3` false?

A. Binary representations and arithmetic rounding differ
B. The equality operator rounds decimals
C. All decimal literals are invalid
D. Addition converts to text

**Answer: A.** The decimal literals map to binary floating-point values; the sum is not the same represented value as 0.3.

## 7. What does `(2.5).toFixed(2)` return?

A. A BigInt
B. The Number `2.50` with stored scale
C. The integer `250`
D. The string `"2.50"`

**Answer: D.** toFixed formats text; Number does not retain a decimal display scale.

## 8. Which constructs the exact integer 9007199254740993?

A. `BigInt(9007199254740993)`
B. `BigInt("9007199254740993")`
C. `Number("9007199254740993")`
D. `parseInt("9007199254740993", 10)`

**Answer: B.** The string reaches BigInt without first being rounded as a Number.

## 9. What is `7n / 2n`?

A. `3n`
B. `3.5`
C. `4n`
D. A TypeError

**Answer: A.** BigInt division truncates the fractional part toward zero.

## 10. What happens to `JSON.stringify({ id: 1n })` without customization?

A. It emits `{"id":1}`
B. It emits `{"id":"1"}`
C. It throws TypeError
D. It silently removes id

**Answer: C.** BigInt needs an explicit transport representation such as a decimal string.

## 11. Which statement describes a Date created with an explicit offset?

A. It stores the original string permanently
B. It stores an instant; the original offset is not retained
C. Every local getter returns the input zone fields
D. It is immutable

**Answer: B.** The Date time value identifies an instant; getters apply UTC or the host local zone.

## 12. Why use a parse-and-ISO round-trip after a strict timestamp regex?

A. To change local time to the user locale
B. To accept more human date forms
C. To restore a missing time zone
D. To reject impossible or normalized calendar values

**Answer: D.** Syntax checks the shape. Round-trip identity checks whether the accepted text denotes that exact canonical calendar instant.

## 13. At the exact end of `[start, end)`, is now inside?

A. Yes, both boundaries are inclusive
B. Only in UTC
C. Only when the duration is an integer
D. No, the end boundary is exclusive

**Answer: D.** The interval explicitly excludes its end; a zero-duration interval is empty.

## 14. What is the best default policy for a duration argument in this chapter?

A. Coerce any truthy input
B. Require a bounded nonnegative integer Number
C. Use parseInt and ignore trailing text
D. Accept strings because Date.parse accepts strings

**Answer: B.** A numeric domain contract prevents concatenation and rejects fractional or unbounded durations.

## 15. What is `Math.floor(-1.2)`?

A. `1`
B. `-1`
C. `-2`
D. `-1.2`

**Answer: C.** Floor moves toward negative infinity; truncation would produce -1.

## 16. Which claim about Number.EPSILON is accurate?

A. It describes spacing near 1, so tolerance still needs a scale policy
B. It is the largest rounding error possible
C. It makes every decimal sum exact
D. It is a money rounding rule

**Answer: A.** Measurement comparison needs a domain-specific tolerance; EPSILON alone does not define one.
