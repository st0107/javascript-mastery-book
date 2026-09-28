# Strings, Numbers, and Dates: Edge Cases and Debugging

## A Cut Through a Surrogate Pair

```js
const rocket = '\u{1F680}';
const firstUnit = rocket.slice(0, 1);
console.log(firstUnit.length);
console.log(firstUnit.charCodeAt(0).toString(16));
console.log(Array.from(rocket)[0] === rocket);
// Expected output:
// 1
// d83d
// true
```

The first result is a lone surrogate code unit, not the whole rocket. When a bug concerns truncation, log code points or escaped text as well as visible text. A console glyph can hide the distinction. For user-visible limits, inspect grapheme segmentation.

## Stateful Regex Validation

```js
const stateful = /^OK$/g;
console.log(stateful.test('OK'));
console.log(stateful.test('OK'));
const stable = /^OK$/;
console.log(stable.test('OK'), stable.test('OK'));
// Expected output:
// true
// false
// true true
```

The global regex starts its second test at its saved position. Removing `g` is appropriate for this whole-string validator. Resetting `lastIndex` can also control a deliberately stateful scan, but do not hide that state inside an otherwise stateless-looking validator.

## A Safe-Looking Integer Was Already Rounded

```js
const parsed = Number('9007199254740993');
console.log(String(parsed));
console.log(Number.isInteger(parsed), Number.isSafeInteger(parsed));
console.log(String(BigInt('9007199254740993')));
// Expected output:
// 9007199254740992
// true false
// 9007199254740993
```

Debug the original input and each conversion, not only the final value. If a caller already supplied a rounded Number, no downstream conversion can infer which original decimal string was intended.

## Invalid Date Behaviors Differ by Operation

```js
const invalid = new Date('not-a-date');
console.log(Number.isNaN(invalid.getTime()));
console.log(JSON.stringify({ when: invalid }));
try {
  invalid.toISOString();
} catch (error) {
  console.log(error.name);
}
// Expected output:
// true
// {"when":null}
// RangeError
```

A successful JSON serialization does not prove the input was a valid date. Validate before serialization; otherwise an invalid Date can become null and lose the reason for failure.

## Debugging the Window Contract

For an unexpected result, inspect `typeof durationMs` first. A string can make addition concatenate. Next compare `startIso` to `new Date(startMs).toISOString()` after checking that parsing succeeded. Finally print start, now, and end as numeric timestamps and test the two inequalities separately.

Use a table of start-minus-one, start, end-minus-one, and end. Add a zero-duration case. Never make a test depend on the wall clock advancing during the test. The production helper accepts now explicitly for that reason.

## Locale Output Is Not a Wire Format

Different locale data versions may affect spacing or punctuation. Keep exact display tests scoped to a selected runtime and locale; use semantic values for service contracts. Avoid asserting that every currency has two decimal places: this chapter's formatter uses an explicit allowlist.

For the underlying invalid-time behavior, see [Date.toISOString](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString) and [Date.toJSON](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toJSON).
