# Strings, Numbers, and Dates: Theory

## Strings Are Immutable Values

A string is a sequence of UTF-16 code units. Reading an index returns one code unit as a string; methods such as `slice`, `trim`, and `replace` return values instead of editing the original. A binding can be reassigned, but the previously stored string value does not change. Prefer primitive strings to `new String(...)` wrappers, whose object identity changes equality behavior. See the [String reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String).

```js
const raw = '  invoice-042  ';
const clean = raw.trim();
console.log(JSON.stringify(raw));
console.log(clean.toUpperCase());
console.log(clean.slice(-3), clean.includes('invoice'));
// Expected output:
// "  invoice-042  "
// INVOICE-042
// 042 true
```

`slice(start, end)` excludes the end index. A negative index counts from the end. `includes` is case-sensitive. Template literals interpolate values into a string; they do not perform HTML escaping or SQL parameterization.

## Three Meanings of Character

| Unit | Example operation | Appropriate use |
| --- | --- | --- |
| UTF-16 code unit | `text.length`, `text[i]` | JavaScript indexing and offsets |
| Unicode code point | `Array.from(text)`, `for...of` | Processing Unicode scalar-sized pieces |
| Grapheme cluster | `Intl.Segmenter` with `granularity: 'grapheme'` | User-visible cursor or truncation units |

A combining accent can be a separate code point while displaying as part of one grapheme. Emoji sequences can contain several code points. Neither `length` nor spread guarantees the count a user perceives. [Intl.Segmenter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter) supplies segmentation.

```js
const text = 'e\u0301\u{1F680}';
const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
console.log(text.length);
console.log(Array.from(text).length);
console.log(Array.from(segmenter.segment(text)).length);
console.log(text.normalize('NFC') === '\u00e9\u{1F680}');
// Expected output:
// 4
// 3
// 2
// true
```

Normalization can make canonically equivalent spellings compare equally. It is a product decision: do not normalize an opaque token or cryptographic signature. Grapheme rules and locale data can evolve; persist original text when preservation matters.

## Regular Expressions Match a Language

A regular expression describes accepted text patterns. Anchors constrain the whole string, character classes constrain characters, and quantifiers constrain counts. This identifier accepts 1?12 ASCII letters, digits, or hyphens; it intentionally rejects international names and spaces.

```js
const idPattern = /^[A-Z0-9-]{1,12}$/;
console.log(idPattern.test('ORD-42'));
console.log(idPattern.test('ORD 42'));
console.log(idPattern.test('ord-42'));
console.log('order=42'.replace(/=(\d+)$/, ':$1'));
// Expected output:
// true
// false
// false
// order:42
```

Do not add `g` to a reusable validation expression: global and sticky tests advance `lastIndex` and may give different results on repeated calls. Capture groups support extraction or replacement; they do not establish business validity. A digit-shaped date still needs calendar validation. See [RegExp.test](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/test).

## Numbers: Representation and Boundaries

Number uses binary floating-point semantics. Many decimal fractions need rounding, so `0.1 + 0.2` is close to, but not exactly, `0.3`. Number also contains `NaN`, infinities, and signed zero.

```js
console.log(0.1 + 0.2 === 0.3);
console.log(Number.isFinite('12'), Number.isFinite(12));
console.log(Number.isNaN(Number('unknown')));
console.log(Number.isInteger(2 ** 53), Number.isSafeInteger(2 ** 53));
console.log(Object.is(-0, 0), -0 === 0);
// Expected output:
// false
// false true
// true
// true false
// false true
```

`Number.isFinite` does not convert strings. A safe integer is within `-(2 ** 53 - 1)` through `2 ** 53 - 1`. Some larger integers are representable, but neighboring integer inputs are no longer distinguishable. Validate operands and results; safe inputs do not guarantee a safe sum. [Safe-integer reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isSafeInteger).

For measured quantities, choose an error tolerance tied to units and scale. `Number.EPSILON` describes spacing near 1; it is not a universal threshold for all magnitudes. For monetary calculations, choose bounded integer minor units, a decimal representation, or a suitable decimal implementation with an explicit rounding rule. [Number.EPSILON](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/EPSILON).

`Math.floor` rounds toward negative infinity; `Math.trunc` removes the fraction toward zero. This matters for negative adjustments. `toFixed` returns presentation text, not a repaired exact number.

```js
console.log(Math.floor(-1.2), Math.trunc(-1.2));
console.log(typeof (12.5).toFixed(2));
console.log((12.5).toFixed(2));
// Expected output:
// -2 -1
// string
// 12.50
```

## BigInt Preserves Integer Precision

BigInt represents integers with precision limited by available resources. Construct a large value from a literal ending in `n` or from a validated integer string. Converting an already-rounded Number to BigInt cannot recover lost input digits. Arithmetic generally cannot mix Number and BigInt operands; integer division truncates toward zero. [BigInt reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt).

```js
const externalId = BigInt('9007199254740993');
console.log(String(externalId + 1n));
console.log(String(7n / 2n));
console.log(1n === 1, 1n < 2);
try {
  JSON.stringify({ id: externalId });
} catch (error) {
  console.log(error.name);
}
// Expected output:
// 9007199254740994
// 3
// false true
// TypeError
```

Serialize IDs as strings with an agreed schema. BigInt is not a fractional-decimal type, and ordinary `Math` functions do not accept it.

## Dates Represent Instants, Not Stored Time Zones

A Date object contains a time value in milliseconds relative to the UTC epoch. It does not store the zone from its input. Local getters interpret the instant in the host's zone; UTC getters interpret it in UTC. An invalid Date contains an invalid time value. Date setters mutate the object, so aliases see changes. [Date reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date).

```js
const instant = new Date('2026-07-06T15:30:00+05:30');
console.log(instant.toISOString());
console.log(instant.getUTCMonth());
console.log(Number.isNaN(new Date('invalid').getTime()));
// Expected output:
// 2026-07-06T10:00:00.000Z
// 6
// true
```

Months returned by `getUTCMonth` are zero-based. A duration of 86,400,000 milliseconds means 24 elapsed hours; ?same local time tomorrow? is a calendar operation and can cross a daylight-saving offset change.

## Parsing and Formatting Are Separate Contracts

`Date.parse` is a parser, not a validator for your API schema. Standard date-only strings imply UTC; standard date-time strings without an offset use local time. Other forms may depend on the implementation. Require an explicit accepted grammar at your boundary. [Date.parse](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse).

This chapter accepts exactly `YYYY-MM-DDTHH:mm:ss.sssZ`, then checks that parsing and converting back produces identical text. It rejects missing zones, alternate offsets, impossible calendar days, and normalized overflow. It is narrower than all valid ISO 8601 forms.

Use `Intl.DateTimeFormat` and `Intl.NumberFormat` for display. Preserve timestamps and integer units for calculations; do not parse a localized display string back into domain data.
