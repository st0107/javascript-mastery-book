# Strings, Numbers, and Dates: Exercises and Coding Challenges

Attempt each contract before reading its solution. Each solution is independent. The companion `code/volume-1/chapter-05/example-03-text-number-challenges.js` asserts normal, empty, type, and boundary cases.

## 1. Normalize a Display Label

Accept a primitive string, normalize canonical Unicode spelling to NFC, trim its edges, and reject an empty result. Preserve internal spacing and case. Return the label; do not turn a non-string into text. Target O(n) work and output space for n code units.

**Hint:** Transform only after checking the primitive type; reject the empty transformed result.

### Solution

```js
function cleanLabel(value) {
  if (typeof value !== 'string') throw new TypeError('Expected text.');
  const clean = value.normalize('NFC').trim();
  if (clean === '') throw new RangeError('Label is empty.');
  return clean;
}
console.log(cleanLabel('  Cafe\u0301  ') === 'Caf\u00e9');
try {
  cleanLabel('   ');
} catch (error) {
  console.log(error.name);
}
// Expected output:
// true
// RangeError
```

Normalization and trimming create a new string. The contract does not collapse internal spaces or case-fold identity-sensitive text. Test an already-normalized label, a combining accent, whitespace only, and a number.

## 2. Truncate by Grapheme Cluster

Return at most limit user-visible clusters without adding an ellipsis. Require a nonnegative safe integer limit and a primitive string. Do not split a combining sequence or emoji sequence. A zero limit returns an empty string.

**Hint:** Segment before slicing; a code-point array still does not preserve every grapheme.

### Solution

```js
function takeGraphemes(text, limit) {
  if (typeof text !== 'string') throw new TypeError('Expected text.');
  if (!Number.isSafeInteger(limit) || limit < 0) throw new RangeError('Invalid limit.');
  const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
  const pieces = Array.from(segmenter.segment(text), entry => entry.segment);
  return pieces.slice(0, limit).join('');
}
console.log(takeGraphemes('e\u0301\u{1F680}Z', 2) === 'e\u0301\u{1F680}');
console.log(JSON.stringify(takeGraphemes('hello', 0)));
// Expected output:
// true
// ""
```

This straightforward solution segments the entire input before slicing: O(n) text work and O(n) temporary storage in the usual traversal model. A streaming loop can stop earlier; the following chapter teaches that control flow. A grapheme is the chosen UI unit, not an encoded-byte limit.

## 3. Parse a Restricted Price

Accept unsigned ASCII decimal text with no leading zeros except zero itself, exactly two decimal places, and at most six whole digits. Return integer cents. Reject whitespace, signs, exponent notation, booleans, and excess fractional digits. This parser intentionally handles one two-decimal amount syntax.

**Hint:** Validate the complete decimal grammar, then combine whole and fractional digits as integers.

### Solution

```js
function parsePrice(text) {
  if (typeof text !== 'string' || !/^(0|[1-9]\d{0,5})\.\d{2}$/.test(text)) {
    throw new TypeError('Expected bounded decimal price text.');
  }
  const [whole, fraction] = text.split('.');
  return Number(whole) * 100 + Number(fraction);
}
console.log(parsePrice('19.05'));
console.log(parsePrice('0.00'));
try {
  parsePrice('19.005');
} catch (error) {
  console.log(error.name);
}
// Expected output:
// 1905
// 0
// TypeError
```

The grammar bounds the result at 99,999,999 cents. Parsing whole and fractional digits separately avoids multiplying an approximate fractional Number by 100. Work and output are bounded by the fixed grammar. This is not a locale parser.

## 4. Add Safe Inventory Counts

Accept two nonnegative safe-integer Numbers. Return their sum only if it is also safe. Reject strings and reject an overflow even when both inputs separately satisfy the contract.

**Hint:** Validate both operands and the calculated total.

### Solution

```js
function addCounts(left, right) {
  if (!Number.isSafeInteger(left) || !Number.isSafeInteger(right) || left < 0 || right < 0) {
    throw new RangeError('Expected nonnegative safe integers.');
  }
  const total = left + right;
  if (!Number.isSafeInteger(total)) throw new RangeError('Count overflow.');
  return total;
}
console.log(addCounts(42, 8));
try {
  addCounts(Number.MAX_SAFE_INTEGER, 1);
} catch (error) {
  console.log(error.name);
}
// Expected output:
// 50
// RangeError
```

The result check is essential: validating only inputs leaves overflow possible. Arithmetic uses constant-sized Number values, so the operation has O(1) work and storage. This helper does not convert external strings.

## 5. Increment an External Integer ID

Accept 1 through 30 ASCII decimal digits in canonical unsigned form, with zero allowed and no leading zeros otherwise. Increment using BigInt and return a string for JSON transport. The output can have 31 digits when the input is thirty nines.

**Hint:** Build BigInt directly from accepted text and serialize the result as text.

### Solution

```js
function nextId(text) {
  if (typeof text !== 'string' || !/^(0|[1-9]\d{0,29})$/.test(text)) {
    throw new TypeError('Expected a canonical bounded integer ID.');
  }
  return String(BigInt(text) + 1n);
}
console.log(nextId('9007199254740993'));
console.log(JSON.stringify({ id: nextId('0') }));
// Expected output:
// 9007199254740994
// {"id":"1"}
```

Constructing BigInt directly from accepted text preserves digits. Returning a string avoids default JSON serialization failure for BigInt. The 30-digit cap bounds conversion and arithmetic work; without it, BigInt cost grows with operand size.

## 6. Measure Elapsed Whole Seconds

Accept two integer millisecond timestamps within the Date range, with end at or after start. Return the number of complete elapsed seconds. Reject an interval whose millisecond difference is outside safe-integer range. Treat this as elapsed time, not a local calendar duration.

**Hint:** Validate the direction and the subtraction result before dividing.

### Solution

```js
function elapsedSeconds(startMs, endMs) {
  const limit = 8640000000000000;
  if (!Number.isSafeInteger(startMs) || !Number.isSafeInteger(endMs) ||
      Math.abs(startMs) > limit || Math.abs(endMs) > limit || endMs < startMs) {
    throw new RangeError('Invalid interval endpoints.');
  }
  const duration = endMs - startMs;
  if (!Number.isSafeInteger(duration)) throw new RangeError('Interval too large.');
  return Math.floor(duration / 1000);
}
console.log(elapsedSeconds(1000, 3999));
console.log(elapsedSeconds(1000, 1000));
try {
  elapsedSeconds(3000, 1000);
} catch (error) {
  console.log(error.name);
}
// Expected output:
// 2
// 0
// RangeError
```

The direction check makes the duration nonnegative, so floor counts completed seconds. Valid individual Date values can span an unsafe difference, which is why the result also needs checking. This uses O(1) arithmetic and storage.
