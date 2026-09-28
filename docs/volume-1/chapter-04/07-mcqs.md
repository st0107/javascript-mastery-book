# MCQs

Choose one answer before reading the explanation. Assume default built-ins and ordinary objects in Node.js unless stated otherwise.

## 1. What does Number('   ') return?

A. NaN
B. 0
C. undefined
D. TypeError

**Answer: B.** Whitespace-only strings convert to zero. A strict input schema can reject them before conversion.

## 2. What is Boolean('false')?

A. false
B. TypeError
C. The string "false"
D. true

**Answer: D.** Every nonempty string is truthy; Boolean does not interpret a boolean word.

## 3. Which result follows from Number.isInteger(9007199254740992)?

A. true, despite being outside the safe-integer range
B. false because every unsafe integer is fractional
C. RangeError
D. true and therefore every neighboring integer is exact

**Answer: A.** Being integral and being safe are separate properties. Number.isSafeInteger rejects this value.

## 4. What is parseInt('15px', 10)?

A. NaN
B. TypeError
C. 15
D. 150

**Answer: C.** parseInt consumes a valid digit prefix. It does not enforce a full-string numeric schema.

## 5. Why is [] == false true?

A. Empty arrays are falsy
B. The array converts to an empty string, then both sides reach numeric zero
C. Equality compares array length to the boolean
D. Both values are converted to strings with identical text

**Answer: B.** Equality and truthiness request different conversion algorithms. Boolean([]) is true.

## 6. What does [] == [] produce?

A. false
B. true
C. TypeError
D. undefined

**Answer: A.** The operands are distinct objects; loose equality does not convert two objects for structural comparison.

## 7. Which statement describes Object.is?

A. It converts numeric strings to Numbers
B. It performs deep object comparison
C. It treats NaN as equal to itself and distinguishes positive/negative zero
D. It treats Number 1 and BigInt 1n as equal

**Answer: C.** Object.is uses same-value semantics while still comparing objects by identity.

## 8. What is '12' < '3'?

A. false because 12 exceeds 3
B. TypeError because both operands are strings
C. NaN
D. true because the comparison is lexicographic

**Answer: D.** Both primitives are strings, so code-unit ordering compares the first characters.

## 9. Which expression is true?

A. null == 0
B. null >= 0
C. undefined >= 0
D. undefined < 0

**Answer: B.** Relational conversion turns null into zero. The equality and undefined cases follow different rules.

## 10. Which conversion can preserve all digits of '9007199254740993' for integer arithmetic?

A. BigInt(Number(text))
B. parseInt(text, 10)
C. Number(text)
D. BigInt(text)

**Answer: D.** Direct BigInt parsing avoids an intermediate Number's precision loss.

## 11. What happens when BigInt('1.5') is evaluated?

A. SyntaxError
B. It returns 1n
C. It returns 2n
D. It returns NaN

**Answer: A.** A fractional string is not valid integer syntax. This differs from a nonintegral Number argument, which raises RangeError.

## 12. Which hint does binary + pass to an object's Symbol.toPrimitive method?

A. "string" for every use
B. "number" for every use
C. "default"
D. No hint argument

**Answer: C.** The primitive result then determines whether + selects concatenation or numeric addition.

## 13. What happens if Symbol.toPrimitive returns an object?

A. The engine always tries that object's toString
B. TypeError
C. The object becomes truthy
D. The original object is returned from Number

**Answer: B.** The hook must directly return a primitive. Ordinary fallback is not used to rescue an invalid hook result.

## 14. Which operation does not call an ordinary object's conversion methods?

A. Boolean(object)
B. Number(object)
C. String(object)
D. object + 1

**Answer: A.** Boolean conversion treats ordinary objects as truthy without requesting a primitive.

## 15. What does 2 + 3 + '4' produce?

A. Number 9
B. String "234"
C. String "54"
D. TypeError

**Answer: C.** Left grouping adds the first Numbers, then the string operand selects concatenation.

## 16. Which validation sequence fits a strict bounded page-size string?

A. Number conversion, then accept any truthy result
B. parseInt, then default every falsy result
C. Boolean conversion, then Number conversion
D. Source type, full grammar, numeric conversion, safe/domain bounds

**Answer: D.** Conversion alone accepts representations and magnitudes that a boundary contract may forbid.
