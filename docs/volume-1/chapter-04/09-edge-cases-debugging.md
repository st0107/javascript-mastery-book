# Edge Cases and Debugging

## Preserve the Original Representation

A log containing only the converted result can hide the defect. An empty string, whitespace, null, and zero can all reach Number zero. Record a safe field label, original type, and an appropriate redacted representation before conversion when investigating a parser. Do not place secrets or arbitrary request text in logs.

```js
for (const raw of ['', ' ', null, 0]) {
  console.log(JSON.stringify(raw), typeof raw, Number(raw));
}

// Expected output:
// "" string 0
// " " string 0
// null object 0
// 0 number 0
```

The inputs are observably different even though the converted Number is equal. A parser can reject three of them and accept the fourth if that is its contract.

## NaN Needs Its Own Check

```js
const invalid = Number('missing');
console.log(invalid === NaN);
console.log(Number.isNaN(invalid));
console.log(Number.isNaN('missing'));
console.log(isNaN('missing'));
console.log(Number.isFinite('25'), isFinite('25'));

// Expected output:
// false
// true
// false
// true
// false true
```

The global isNaN/isFinite functions coerce; their Number counterparts inspect without coercing. Use Number.isNaN for a Number result and Number.isFinite for a required finite Number. Neither checks an application's range or syntax.

## A Conversion Hook Can Fail Before Arithmetic

```js
const bad = { [Symbol.toPrimitive]() { return {}; } };
try { console.log(Number(bad)); }
catch (error) { console.log(error.name); }
const throwing = { valueOf() { throw new Error('conversion failed'); } };
try { console.log(throwing * 2); }
catch (error) { console.log(error.message); }
console.log(Boolean(throwing));

// Expected output:
// TypeError
// conversion failed
// true
```

Boolean conversion does not run the hook. Numeric conversion does. Reject nonstrings at a string boundary before attempting to coerce their values; this avoids treating application objects as interchangeable input text.

## Symbol and BigInt Are Not Universal Numeric Inputs

```js
const id = Symbol('id');
console.log(String(id));
try { console.log('id=' + id); } catch (error) { console.log(error.name); }
try { console.log(+1n); } catch (error) { console.log(error.name); }
console.log(Number(1n));
console.log(1n == 1, 1n === 1);

// Expected output:
// Symbol(id)
// TypeError
// TypeError
// 1
// true false
```

String explicitly handles a Symbol primitive, while implicit concatenation does not. Unary + rejects BigInt even though Number can explicitly convert it. Explicit Number conversion of a large BigInt can lose precision.

## Full Grammar Means Full Input

JavaScript's $ regular-expression anchor may match just before a final line terminator. If validating an entire input with an anchored match, verify the matched text equals the original text or use a grammar that rejects every non-digit character. The production integer parser takes the latter approach. Include newline and carriage-return cases in regression tests, not only spaces.

Also decide whether leading zeros, a plus sign, exponent notation, a hexadecimal prefix, and a decimal point are allowed. Their mathematical meaning may match a valid value while their source syntax violates a canonical representation policy.

## Turn the Audit Failure Into a Regression

The old parser accepted true as 1 and rounded '9007199254740993'. The repaired companion asserts that both fail. Neighbor checks accept the documented maximum and reject the next value; they also verify that missing pagination defaults while explicit null fails.

When debugging a comparison, write the types beside both operands, identify the operator's algorithm, and show each intermediate primitive. If user-defined conversion is involved, instrument a local trace rather than assuming the object's printed label is its numeric value.

The [Number.isNaN reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isNaN) explains the noncoercing check, and [Symbol.toPrimitive](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/toPrimitive) explains hook failures.
