# Strings, Numbers, and Dates: Interview Perspective

## Beginner: What Is a Character?

A useful answer separates storage from display: JavaScript indexes UTF-16 code units, its string iterator advances by code point, and user-facing text often needs grapheme clusters. Ask which unit the product limit means before writing a truncation helper.

```js
const value = 'e\u0301';
console.log(value.length, Array.from(value).length);
console.log(Array.from(new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(value)).length);
// Expected output:
// 2 2
// 1
```

Follow-up: "Would NFC normalization always make length a user-visible count?" No. It can combine some canonically equivalent sequences, but it does not turn all grapheme clusters into single code units.

## Intermediate: Why Are Integer Cents Useful?

They make the unit explicit and allow exact integer addition inside a checked range. They do not automatically solve percentage rounding, unsafe totals, currencies with different minor-unit scales, or fractional-cent allocation.

A strong design answer names the accepted bound, validates the calculated total, and defines where rounding occurs. "Use toFixed everywhere" only changes presentation. "Use BigInt" still needs a scale and rounding policy.

## Output Prediction: A Date Alias

```js
const first = new Date('2026-01-01T00:00:00.000Z');
const second = first;
second.setUTCFullYear(2027);
console.log(first === second);
console.log(first.getUTCFullYear());
// Expected output:
// true
// 2027
```

Both variables refer to one mutable Date. A separate `new Date(first.getTime())` creates a snapshot of its numeric time value. It does not store a time zone.

## Senior: Review an Expiry Check

Suppose code parses a request timestamp and tests `now < start + duration`. Identify four missing decisions:

1. Which timestamp grammar and zone are accepted?
2. Are now and duration validated Numbers with explicit units and bounds?
3. Is calendar overflow rejected after parsing?
4. Are the start and end inclusive or exclusive?

Then explain the operational boundary: the server clock is authoritative for access enforcement. A browser countdown is a display aid. A local recurring appointment needs named-zone calendar rules beyond an elapsed UTC interval.

## Design Challenge: Imports With Large IDs

A service receives a 20-digit identifier. Keeping it as a string is sufficient if the service only compares or transmits it. Use BigInt when integer arithmetic is genuinely required, constructing it from validated text. Specify the JSON representation and input-length cap.

This answer avoids unnecessary conversion, protects precision, and bounds resource use. It also distinguishes an identifier from a measured quantity or price.

## What a Complete Answer Contains

State the input contract, predict one normal result, demonstrate a failing boundary, and explain the representation that causes it. Use the [production examples](04-production-examples.md) for concrete implementations and the [exercises](06-exercises-coding-challenges.md) for practice.
