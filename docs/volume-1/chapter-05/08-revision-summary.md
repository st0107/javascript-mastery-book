# Strings, Numbers, and Dates: Revision and Summary

## Revision Sheet

| Question | Rule |
| --- | --- |
| What does string `length` count? | UTF-16 code units |
| What does string iteration yield? | Code points, not necessarily graphemes |
| Do string methods mutate? | They return values; strings are immutable |
| How do I count display clusters? | Segment with `Intl.Segmenter` and a defined policy |
| Why can regex validation alternate? | `g`/`y` tests maintain `lastIndex` |
| Does "integer" mean "safe integer"? | No; use `Number.isSafeInteger` and domain bounds |
| Does `toFixed` fix arithmetic? | No; it produces a string |
| Is `Number.EPSILON` a universal tolerance? | No; tolerance depends on scale and units |
| What does BigInt solve? | Exact integer precision beyond the safe Number range |
| Does BigInt represent fractions? | No; division truncates toward zero |
| What does a Date store? | A numeric time value, not its input zone |
| What makes a timestamp acceptable? | A declared grammar plus calendar/range validation |
| What is `[start, end)`? | Inclusive start and exclusive end |
| Is one local calendar day always 24 hours? | No; zone-offset changes can alter elapsed time |

## Explain It in One Minute

"JavaScript text is indexed by UTF-16 code units, so I define whether a limit counts storage units, code points, or user-visible clusters. Numbers use binary floating-point semantics; I validate finiteness, integer safety, and business bounds separately. I keep bounded money in integer minor units and define rounding before calculations. A Date represents an instant; I use explicit UTC input for elapsed-time checks and an explicit zone for presentation."

## Review the Boundary Matrix

Before shipping a helper, write down behavior for empty text, combining marks, maximum length, negative zero, NaN, infinity, unsafe integers, malformed timestamps, impossible dates, start-minus-one, exact start, end-minus-one, and exact end. Include only relevant cases, but give each a deliberate policy.

This chapter's formatter is intentionally bounded and restricted to four two-decimal currencies. Its UTC window rejects duration strings and normalized invalid dates. Those constraints are part of the public contract.

## Summary

Representation determines which operations are valid. Text processing needs a unit, numeric work needs precision and bounds, and time work needs an instant/calendar distinction. A parser, formatter, and validator each solve a different part of that problem.

Practice with [the exercises](06-exercises-coding-challenges.md) and [MCQs](07-mcqs.md). Continue to [Control Flow](../chapter-06/01-introduction.md).
