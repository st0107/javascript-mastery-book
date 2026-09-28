# Revision Sheet and Chapter Summary

## Rules to Recall

| Topic | Rule |
| --- | --- |
| Precedence | Determines grouping; it does not grant permission to reorder observable operand calls. |
| Associativity | Determines grouping among operators at the same level; exponentiation and assignment group right. |
| AND | Return left when falsy; otherwise evaluate and return right. |
| OR | Return left when truthy; otherwise evaluate and return right. |
| Coalescing | Evaluate right only for null or undefined. |
| Optional chaining | Skip the guarded access/call when its base is nullish; other errors still propagate. |
| Assignment | Evaluate a destination and write a value; the expression returns the assigned value. |
| Logical assignment | Also skip the write when its condition does not select the right side. |
| Postfix update | Store the increment/decrement but return the old numeric value. |
| Conditional | Evaluate one selected branch. |
| Number bitwise | Operate in a 32-bit integer model, not the full safe-integer domain. |
| Remainder | A nonzero result follows the dividend's sign. |

## Prediction Check

```js
console.log(0 || 4, 0 ?? 4);
console.log('ok' && '', false ?? 7);
console.log(2 ** 3 ** 2);
console.log((1 | 2) & 2);
console.log(5n / 2n === 2n);

// Expected output:
// 4 0
//  false
// 512
// 2
// true
```

The leading space on the second output line separates an empty string from false; logging JSON is often clearer when blank values matter.

## Review Before Shipping

- Define which values count as missing and which are invalid.
- Validate types and bounds after choosing defaults.
- Trace side effects in calls, computed keys, getters, setters, and updates.
- Use two comparisons for a range.
- Preserve exact boolean requirements at access boundaries.
- Select bitwise operations only for an intentionally bounded representation.
- Test that skipped work really was skipped.

## Chapter Summary

Operators combine values and effects. Parentheses clarify grouping; explicit contracts clarify meaning. A safe default preserves intended values, a safe feature gate defines malformed-data behavior, and a readable expression exposes which work can be skipped. Memory reasoning tracks shared objects separately from copied primitive values.

Continue with [Type Conversion and Coercion](../chapter-04/01-introduction.md) to explain how an operator chooses string concatenation, numeric conversion, truthiness, or comparison.

## References and Further Reading

- [Operator precedence](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_precedence): grouping, associativity, and evaluation.
- [Optional chaining](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining): chain boundaries and invalid uses.
- [Nullish coalescing](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing): fallback selection.
- [ECMAScript expressions](https://tc39.es/ecma262/multipage/ecmascript-language-expressions.html): normative operator algorithms.

After the next chapter, revisit the traces and explain each conversion rather than only the final output.
