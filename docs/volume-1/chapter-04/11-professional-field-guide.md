# Professional Field Guide

## Write a Parsing Contract in Six Lines

For each boundary field, record source type, accepted text grammar, missing-value policy, target representation, range, and error behavior. For pageSize this chapter chooses: string; positive decimal digits without leading zeros; default 25 only when undefined; Number; 1 through 100; reject malformed supplied input.

That contract explains why "25" succeeds while 25, true, "025", "25px", and null fail. If the product later accepts trimmed text, change the contract and its assertions deliberately.

## Choose Representation From Meaning

| Value | Useful representation | Reason |
| --- | --- | --- |
| Bounded page count | Safe integer Number | Arithmetic and bounds are small and exact. |
| Approximate sensor reading | Finite Number | Floating-point approximation is an accepted part of the domain. |
| Large integral arithmetic quantity | BigInt parsed directly from text | Avoid an intermediate Number losing digits. |
| Identifier with leading zeros | String | Textual identity must survive. |
| Boolean setting | Boolean after explicit vocabulary parsing | Truthiness does not interpret words. |
| Three-state setting | Boolean or a documented third value | Absence/defer must remain distinguishable. |

BigInt is not a decimal-money type, and converting an identifier to a number is not required merely because all its characters are digits.

## Review a Parser Repair

The original query helper called Number(value) and checked positivity/integrality. That admitted true and unsafe integer strings. The repair adds a primitive type check, bounded complete digit grammar, safe-integer check, and page-specific maximums. It also separates missing from malformed values.

Review tests against the contract rather than counting assertions: smallest value, largest value, immediate outside neighbors, wrong primitive types, whitespace, suffixes, leading zeros, unsafe integers, and unchanged caller data. A happy-path printout cannot establish any of those boundaries.

## Review Conversion in General Code

For +, ask whether either operand can become a string. For comparisons, ask whether both values share a validated representation. For object operands, ask whether conversion hooks can run more than once, mutate state, or throw. For boolean conditions, ask whether the program wants truthiness or exact boolean identity.

Use explicit named formatting/conversion methods when units or side effects would otherwise be hidden. Implicit hooks are appropriate only when their behavior is consistent and useful throughout the object's API.

## Explain an Incident Clearly

A useful explanation is: "The boundary accepted true, Number converted it to 1, and the integer guard admitted it. We now require the declared string type before conversion and test that true fails." This identifies the entry point, language rule, incorrect policy, and regression.

For a precision incident, preserve the original text before it is rounded. Once two strings map to the same Number, inspecting that Number cannot reconstruct which ID arrived.

Complete the [exercise set](06-exercises-coding-challenges.md), rehearse the [interview traces](05-interview-perspective.md), and continue to [Strings, Numbers, and Dates](../chapter-05/01-introduction.md) for text and numeric representation details.
