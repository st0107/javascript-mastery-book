# Theory

## Conversion Produces a Value; Validation Accepts a Domain

An explicit conversion names the target representation, such as Number(raw). An implicit conversion is requested by an operation, such as multiplication converting a numeric string. Neither inherently validates an application's schema. A valid Number may be negative, infinite, fractional, unsafe as an integer, or outside a business limit.

Primitive conversion does not rewrite the source binding. Object conversion may call methods and therefore cause effects; the returned primitive is still separate from the original object.

## String, Number, and Boolean Conversion Matrix

The following table uses default built-ins and ordinary objects. Quoted entries in the String column are string results; NaN is the Number value representing an invalid numeric result.

| Input | String(input) | Number(input) | Boolean(input) |
| --- | --- | --- | --- |
| undefined | "undefined" | NaN | false |
| null | "null" | 0 | false |
| false | "false" | 0 | false |
| true | "true" | 1 | true |
| "" | "" | 0 | false |
| "  " | "  " | 0 | true |
| "12" | "12" | 12 | true |
| "12px" | "12px" | NaN | true |
| [] | "" | 0 | true |
| [7] | "7" | 7 | true |
| [7, 8] | "7,8" | NaN | true |
| `{}` | "[object Object]" | NaN | true |

Object rows depend on their conversion methods; they are not universal results for every object. String conversion is also distinct from JSON serialization. `String({id: 1})` does not serialize the object's fields into JSON.

```js
console.log(Number(''), Number('  '), Number(null));
console.log(Number(undefined), Number('12px'));
console.log(String([7, 8]));
console.log(Boolean('false'), Boolean([]), Boolean({}));
console.log(String(Symbol('job')));
try { console.log(Number(Symbol('job'))); }
catch (error) { console.log(error.name); }

// Expected output:
// 0 0 0
// NaN NaN
// 7,8
// true true true
// Symbol(job)
// TypeError
```

String explicitly accepts a Symbol primitive and returns a description; implicit string conversion in concatenation rejects a Symbol. Symbols are not numeric quantities. See [String conversion](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) and [Number conversion](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number).

## Numeric Syntax Is Broader Than Most Input Schemas

Number consumes its complete string under the language's numeric-string rules. It accepts surrounding whitespace, hexadecimal notation, exponential notation, and Infinity. parseInt and parseFloat instead recognize a numeric prefix; parseInt's radix controls digit interpretation, not a requirement to consume the entire string.

```js
console.log(Number('0x10'), Number('1e2'), Number(' 12 '));
console.log(Number('12px'));
console.log(parseInt('12px', 10), parseInt('1e2', 10));
console.log(parseFloat('1.5ms'));
console.log(Number.isFinite(Number('Infinity')));
console.log(Number.isInteger(9007199254740992));
console.log(Number.isSafeInteger(9007199254740992));

// Expected output:
// 16 100 12
// NaN
// 12 1
// 1.5
// false
// true
// false
```

Prefix parsing can be useful when the contract explicitly allows a suffix and separately validates it. It is wrong for a strict page number where trailing text must be rejected. Number.isSafeInteger checks that a Number is integral and within the exact safe-integer range; it cannot recover a decimal string already rounded during conversion. Preserve and validate the original text first. [parseInt reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/parseInt), [safe integers](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isSafeInteger).

## Truthiness Does Not Parse Boolean Text

The falsy primitive values are undefined, null, false, positive/negative zero, NaN, zero BigInt, and the empty string. Other primitive values are truthy. Ordinary objects are truthy, even an empty array or a Boolean wrapper holding false. Boolean conversion does not call an object's valueOf or Symbol.toPrimitive method.

```js
let calls = 0;
const value = { valueOf() { calls += 1; return 0; } };
console.log(Boolean(value), calls);
console.log(Boolean(new Boolean(false)));
console.log(Boolean('0'), Boolean('false'), Boolean(' '));
console.log(Boolean(0n));

// Expected output:
// true 0
// true
// true true true
// false
```

Use Boolean(value) to ask whether value is truthy. To parse an environment flag, compare accepted strings such as "true" and "false" explicitly. Avoid new Boolean for flags. Browsers retain a legacy exception for document.all; it is not a portable data-model tool and does not exist in these Node examples. [Boolean reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean).

## BigInt Conversion Has Its Own Boundary

BigInt accepts integer strings and integral Numbers; nonintegral Numbers cause RangeError and malformed integer strings cause SyntaxError. Boolean values become 0n/1n. Null, undefined, and Symbol are rejected. Decimal fractions and exponent notation are not valid BigInt string syntax, though base-prefixed integer strings are accepted.

```js
console.log(String(BigInt('9007199254740993')));
console.log(String(BigInt(Number('9007199254740993'))));
console.log(String(BigInt(true)));
try { BigInt(1.5); } catch (error) { console.log(error.name); }
try { BigInt('1e3'); } catch (error) { console.log(error.name); }

// Expected output:
// 9007199254740993
// 9007199254740992
// 1
// RangeError
// SyntaxError
```

Convert large integer text directly to BigInt when that is the required representation. Going through Number can lose precision permanently. Arithmetic normally requires both operands to have the same numeric type; comparisons can handle Number and BigInt without that arithmetic restriction. [BigInt reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt).

## Addition and Numeric Operators Request Different Conversions

Binary + first obtains primitives. If either is a string, it concatenates their string forms; otherwise it performs numeric addition. Subtraction and multiplication request numeric values instead. Left associativity can therefore change the type midway through a chain.

```js
console.log(2 + 3 + '4');
console.log('2' + 3 + 4);
console.log('6' - 2);
console.log('6' * '2');
console.log('6' + 2);

// Expected output:
// 54
// 234
// 4
// 12
// 62
```

Do not use subtraction by zero as an input schema. It silently admits the same broad numeric conversions that a strict boundary often needs to reject.

## Strict and Loose Equality Ask Different Questions

Strict equality does not convert differing types. Objects compare by identity, NaN is unequal to itself, and positive/negative zero compare equal. Object.is also compares identity, but considers NaN equal to itself and distinguishes the two zeros.

Loose equality follows type-directed rules. Same-type values use strict-equality behavior. Null and undefined match each other. Boolean operands become Numbers; a Number/String pair converts the string numerically. Object/primitive comparisons can request primitive conversion. Two objects still compare identity, and comparison with null/undefined does not generally coerce an ordinary object.

```js
console.log('0' == false);
console.log('0' === false);
console.log(null == undefined, null == 0);
console.log([] == false);
console.log([] == []);
console.log(NaN === NaN, Object.is(NaN, NaN));
console.log(0 === -0, Object.is(0, -0));
console.log(1n == 1, 1n === 1);

// Expected output:
// true
// false
// true false
// true
// false
// false true
// true false
// true false
```

For [] == false: false becomes 0; the array becomes the empty string; that string becomes 0; 0 equals 0. None of these steps says the array is falsy. For most application comparisons, validate a shared representation and use ===. A deliberate `value == null` can test null/undefined together in ordinary data; spell out both checks when that is clearer for the team. [Equality reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Equality), [Object.is](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is).

## Relational Comparison Is Not Equality With Ordering

When both resulting primitives are strings, relational comparison orders UTF-16 code units lexicographically. Otherwise it follows numeric comparison rules, including special handling for BigInt. NaN produces an unordered comparison: both `<` and `>=` can be false. Consequently `>=` is not always equivalent to negating `<`.

```js
console.log('12' < '3');
console.log('12' < 3);
console.log(null < 1, null == 0, null >= 0);
console.log(undefined < 1, undefined >= 1);
console.log(2n < 2.5);

// Expected output:
// true
// false
// true false true
// false false
// true
```

Choose numeric conversion before comparing numeric input strings. Locale-aware human text ordering is a separate requirement from the language's relational string order. [Relational comparison reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Less_than).

## Object-to-Primitive Conversion

An operation may request the hint "string", "number", or "default". A callable Symbol.toPrimitive method receives that hint and must return a primitive; returning an object throws. Without that method, ordinary conversion tries toString before valueOf for a string hint, and valueOf before toString for a number hint. Ordinary objects treat a default hint like number; built-ins such as Date can behave differently.

```js
const hints = [];
const price = {
  [Symbol.toPrimitive](hint) {
    hints.push(hint);
    return hint === 'string' ? 'USD 12' : 12;
  }
};
console.log(String(price));
console.log(Number(price));
console.log(price + 2);
console.log(hints.join(','));

// Expected output:
// USD 12
// 12
// 14
// string,number,default
```

The method is useful for a carefully designed domain object, but implicit effects can make arithmetic and logging surprising. For ordinary DTOs, prefer named fields or explicit formatters. The [Symbol.toPrimitive reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/toPrimitive) describes the customization point; the [specification's abstract operations](https://tc39.es/ecma262/multipage/abstract-operations.html#sec-toprimitive) define fallback behavior.
