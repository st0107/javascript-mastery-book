# Exercises and Coding Challenges

Write each contract and its boundary cases before reading the solution. Every program is independent. The companion `code/volume-1/chapter-04/example-03-coercion-challenges.js` runs all six solutions.

## 1. Parse a Network Port

**Problem:** Accept a string containing a canonical positive decimal port from 1 through 65535. Reject signs, whitespace, leading zeros, fractions, suffixes, booleans, and missing input. Return a Number.

**Hint:** Check the source type and digit vocabulary before numeric conversion.

### Solution

```js
const assert = require('node:assert/strict');
function parsePort(raw) {
  if (typeof raw !== 'string') throw new TypeError('port must be a string');
  if (raw.length < 1 || raw.length > 5 || raw[0] === '0' || /[^0-9]/.test(raw)) {
    throw new RangeError('invalid port syntax');
  }
  const port = Number(raw);
  if (port > 65535) throw new RangeError('port is too large');
  return port;
}
assert.equal(parsePort('1'), 1);
assert.equal(parsePort('65535'), 65535);
for (const raw of ['0', '01', '65536', '80px', '80\n', '+80', ' 80']) {
  assert.throws(() => parsePort(raw), RangeError);
}
assert.throws(() => parsePort(true), TypeError);
console.log(parsePort('8080'));

// Expected output:
// 8080

// O(k) work for at most five digits; O(1) additional storage.
```

Number('80px') rejects a suffix but accepts other forbidden forms such as whitespace and hexadecimal notation. The source grammar therefore remains necessary. The five-digit bound makes every syntactically accepted Number a safe integer.

## 2. Parse a Three-State Setting

**Problem:** Accept only the strings "enabled", "disabled", and "auto". Return true, false, and null respectively. Reject every other value, including boolean inputs. The null result means defer to a separate policy.

**Hint:** An explicit vocabulary can represent more than truthiness.

### Solution

```js
const assert = require('node:assert/strict');
function parseMode(raw) {
  if (raw === 'enabled') return true;
  if (raw === 'disabled') return false;
  if (raw === 'auto') return null;
  throw new TypeError('mode must be enabled, disabled, or auto');
}
assert.equal(parseMode('enabled'), true);
assert.equal(parseMode('disabled'), false);
assert.equal(parseMode('auto'), null);
for (const raw of [true, false, undefined, '', 'AUTO', 'false']) {
  assert.throws(() => parseMode(raw), TypeError);
}
console.log(JSON.stringify(['enabled', 'disabled', 'auto'].map(parseMode)));

// Expected output:
// [true,false,null]

// O(1) work and storage for each fixed vocabulary lookup.
```

Boolean('disabled') is true, so generic truthiness would erase the setting's meaning. Do not apply ?? until the caller is ready to resolve the intentional auto state.

## 3. Preserve an Opaque Decimal Identifier

**Problem:** Accept one to twenty ASCII digits as an identifier and return the original string unchanged, including leading zeros. Reject numeric inputs. Two long IDs that collide after Number conversion must remain distinct.

**Hint:** An identifier need not be an arithmetic quantity.

### Solution

```js
const assert = require('node:assert/strict');
function requireDecimalId(raw) {
  if (typeof raw !== 'string') throw new TypeError('id must be a string');
  if (raw.length < 1 || raw.length > 20 || /[^0-9]/.test(raw)) {
    throw new RangeError('id must contain 1 through 20 digits');
  }
  return raw;
}
const a = requireDecimalId('9007199254740992');
const b = requireDecimalId('9007199254740993');
assert.notEqual(a, b);
assert.equal(Number(a), Number(b));
assert.equal(requireDecimalId('0007'), '0007');
assert.throws(() => requireDecimalId(7), TypeError);
assert.throws(() => requireDecimalId('7\n'), RangeError);
console.log(a === b, Number(a) === Number(b));
console.log(requireDecimalId('0007'));

// Expected output:
// false true
// 0007

// O(k) validation for at most 20 digits; returns the original immutable string.
```

Converting to BigInt would preserve magnitude but discard leading zeros. The contract preserves textual identity, so neither Number nor BigInt is the right normalized representation.

## 4. Compare Decimal Sensor Readings Numerically

**Problem:** Accept signed decimal strings up to 32 characters, with optional fractional digits and no whitespace/exponent notation. Allow -0 and reject leading zeros except zero itself. Require magnitudes at most 1,000,000. Return -1, 0, or 1 using their Number values; this contract permits floating-point rounding.

**Hint:** Full-match validation and numeric comparison are separate steps.

### Solution

```js
const assert = require('node:assert/strict');
function compareReadings(left, right) {
  function parse(raw) {
    if (typeof raw !== 'string') throw new TypeError('reading must be a string');
    if (raw.length < 1 || raw.length > 32) throw new RangeError('invalid reading length');
    const match = /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/.exec(raw);
    if (match === null || match[0] !== raw) throw new RangeError('invalid decimal syntax');
    const number = Number(raw);
    if (!Number.isFinite(number) || Math.abs(number) > 1000000) {
      throw new RangeError('reading out of range');
    }
    return number;
  }
  const a = parse(left);
  const b = parse(right);
  return a < b ? -1 : a > b ? 1 : 0;
}
assert.equal(compareReadings('12', '3'), 1);
assert.equal(compareReadings('-0', '0'), 0);
assert.equal(compareReadings('1.25', '1.3'), -1);
assert.throws(() => compareReadings('1\n', '2'), RangeError);
assert.throws(() => compareReadings('1e2', '2'), RangeError);
assert.throws(() => compareReadings('1000001', '2'), RangeError);
console.log(compareReadings('12', '3'), compareReadings('1.25', '1.3'));

// Expected output:
// 1 -1

// O(k) validation with each input bounded to 32 characters; O(k) match storage.
```

The full-match equality rejects a final line terminator even though JavaScript's $ anchor can match immediately before it. This compares approximate sensor values, not exact money or arbitrary-precision decimals.

## 5. Give a Duration a Deliberate Primitive Representation

**Problem:** Create a duration from a nonnegative integer Number of milliseconds, at most one day. String conversion should produce a label such as '1500 ms'; numeric/default conversion should produce milliseconds. Reject other input types. Keep the stored value private to the created method's closure.

**Hint:** Inspect the hint passed to Symbol.toPrimitive.

### Solution

```js
const assert = require('node:assert/strict');
function makeDuration(milliseconds) {
  if (!Number.isInteger(milliseconds) || milliseconds < 0 || milliseconds > 86400000) {
    throw new RangeError('duration must be a bounded millisecond count');
  }
  return Object.freeze({
    [Symbol.toPrimitive](hint) {
      return hint === 'string' ? milliseconds + ' ms' : milliseconds;
    }
  });
}
const duration = makeDuration(1500);
assert.equal(String(duration), '1500 ms');
assert.equal(Number(duration), 1500);
assert.equal(duration + 500, 2000);
assert.equal(Boolean(duration), true);
assert.throws(() => makeDuration('1500'), RangeError);
assert.throws(() => makeDuration(-1), RangeError);
console.log(String(duration), duration + 500);

// Expected output:
// 1500 ms 2000

// O(1) creation and conversion for this bounded numeric domain.
```

The closure retains one bounded primitive; freezing prevents replacement of the conversion method. The method returns only primitives. In a larger API, named toMilliseconds/format methods may be easier to read than implicit arithmetic.

## 6. Sum Validated Counts Without Concatenation

**Problem:** Accept an array of at most 1000 canonical nonnegative decimal strings, each from 0 through 999999. Reject holes, nonstrings, leading zeros, and malformed values. Return the total as a Number without changing the array.

**Hint:** Validate each item before adding it; bound the largest possible total.

### Solution

```js
const assert = require('node:assert/strict');
function sumCounts(values) {
  if (!Array.isArray(values)) throw new TypeError('counts must be an array');
  if (values.length > 1000) throw new RangeError('too many counts');
  let total = 0;
  for (const raw of values) {
    if (typeof raw !== 'string') throw new TypeError('each count must be a string');
    if (raw.length < 1 || raw.length > 6 || /[^0-9]/.test(raw) ||
        (raw.length > 1 && raw[0] === '0')) throw new RangeError('invalid count');
    total += Number(raw);
  }
  return total;
}
const input = ['2', '3', '0'];
assert.equal(sumCounts(input), 5);
assert.deepEqual(input, ['2', '3', '0']);
assert.equal(sumCounts([]), 0);
assert.equal(sumCounts(Array(1000).fill('999999')), 999999000);
assert.throws(() => sumCounts(['01']), RangeError);
assert.throws(() => sumCounts(['2', 3]), TypeError);
assert.throws(() => sumCounts(new Array(1)), TypeError);
console.log(sumCounts(input));

// Expected output:
// 5

// O(n) time with at most six characters per item; O(1) additional space.
```

The maximum total is 999,999,000, well inside the safe-integer range. Starting with numeric zero is necessary but insufficient: adding unconverted strings would turn the accumulator into a string.
