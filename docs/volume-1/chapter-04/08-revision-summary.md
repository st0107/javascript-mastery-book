# Revision and Summary

## Conversion Rules at a Glance

| Operation | Rule to recall |
| --- | --- |
| String(value) | Creates a string representation; this is not JSON serialization. |
| Number(value) | Converts a whole value using permissive numeric rules; empty text and null become zero. |
| Boolean(value) | Tests truthiness; nonempty "false" and ordinary objects are true. |
| BigInt(value) | Accepts integer representations; Number input may already have lost precision. |
| parseInt(text, radix) | Reads a numeric prefix, so trailing text may be ignored. |
| Binary + | Obtain primitives, concatenate if either is a string, otherwise add numeric values. |
| === | No mixed-type coercion; objects compare identity; NaN differs from itself. |
| == | Type-directed conversions, including null/undefined pairing and object/primitive conversion. |
| Object.is | Same-value comparison: NaN matches itself, signed zeros differ. |
| Relational comparison | Two strings use code-unit order; otherwise numeric rules apply. |
| Symbol.toPrimitive | Receives a hint and must return a primitive. |
| Boolean(object) | Does not request an object's primitive conversion. |

## Prediction Check

```js
console.log(Number(''), Boolean(''));
console.log(Number('false'), Boolean('false'));
console.log(null == undefined, null == 0, null >= 0);
console.log('2' + 1, '2' - 1);
console.log(Number.isSafeInteger(Number('9007199254740993')));

// Expected output:
// 0 false
// NaN true
// true false true
// 21 1
// false
```

For each output, name the operation before the rule. The same input can legitimately produce different results under numeric conversion, truthiness, equality, and ordering.

## Boundary Parser Checklist

1. State the source type. A string parser must reject true before it becomes 1.
2. Define missing versus invalid. Default an absent field only when the contract permits it.
3. Bound source length and validate the complete grammar.
4. Convert once to the desired representation.
5. Check finite/safe status as appropriate and enforce domain limits.
6. Preserve caller ownership and test both sides of every bound.

Opaque identifiers may need no numeric conversion. Exact large integer arithmetic may need direct BigInt parsing. Approximate decimal measurements may legitimately use Number. Choose representation from the domain.

## Common Mistakes to Retire

- Treating Boolean('false') as a text parser.
- Treating parseInt as full-string validation.
- Assuming Number.isInteger implies a safe integer.
- Explaining all mixed comparisons with one conversion rule.
- Converting a large integer through Number before BigInt.
- Assuming conversion methods cannot throw or mutate state.
- Comparing numeric strings lexicographically by accident.

## References and Further Reading

- [Number conversion](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number): accepted primitive and string cases.
- [Boolean conversion](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean): falsy values, wrappers, and objects.
- [Equality](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Equality): type-directed comparison cases.
- [Symbol.toPrimitive](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/toPrimitive): conversion customization and hints.
- [ECMAScript abstract operations](https://tc39.es/ecma262/multipage/abstract-operations.html#sec-type-conversion): normative definitions when a trace is disputed.

Continue to [Strings, Numbers, and Dates](../chapter-05/01-introduction.md) for representation details: text units, numeric precision, and explicit timestamp contracts.
