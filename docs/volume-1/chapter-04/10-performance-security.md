# Performance and Security

## Parse Once at a Named Boundary

Repeated Number conversion inside a loop repeats input interpretation and can repeat object conversion hooks. A boundary parser returns a stable primitive representation; downstream logic uses it without re-deciding what missing, empty, or malformed input means.

The pagination parser examines at most 16 characters per field. Its digit scan is O(k), with a small explicit bound on k. The two returned numeric fields and computed offset use constant output storage. Describing arbitrary numeric-string parsing as universally O(1) would hide dependence on input length.

BigInt parsing and arithmetic depend on digit/bit count. A huge decimal string can require substantial work and memory even though the source contains one BigInt call. Limit input size before parsing. Do not accept arbitrary-length integers simply because the type can represent them.

## Choose an Optimization Only After Matching Semantics

Unary +, Number, parseInt, and bitwise truncation are not interchangeable parsers. They differ on suffixes, empty strings, BigInt, safe range, and fractions. A benchmark comparing them without matching contracts compares different computations.

Measure the whole boundary under representative input lengths and failure rates. Exception-heavy malformed traffic may have different costs from valid traffic. A service can use a structured validation result at its adapter if exceptions are undesirable there, but it must retain the same acceptance policy and clear failure reporting.

## Coercion Can Execute Application Code

```js
let calls = 0;
const supplied = { valueOf() { calls += 1; return 25; } };
function requireStringNumber(raw) {
  if (typeof raw !== 'string') throw new TypeError('string required');
  return Number(raw);
}
try { requireStringNumber(supplied); }
catch (error) { console.log(error.name); }
console.log(calls);
console.log(Number(supplied), calls);

// Expected output:
// TypeError
// 0
// 25 1
```

Checking the primitive source type prevents this value's numeric hook from running. It does not make arbitrary property access safe: an object containing the field may have a getter or proxy trap. These parsers assume ordinary data produced by the application's deserialization layer.

## Ambiguous Conversion Can Cross a Policy Boundary

Boolean('false') can accidentally enable a feature. Loose equality can equate differently represented identifiers. Unsafe Number conversion can merge distinct integer IDs. Those are concrete reasons to specify source types and representations before comparing permissions, flags, or identifiers.

Keep identity opaque when arithmetic is unnecessary. Keep externally supplied flags separate from trusted authorization facts. A validly parsed "true" means the sender requested something; it does not establish that the sender may perform it.

## Resource Limits Belong at Multiple Layers

The page-size cap bounds the result size requested by this helper; it does not bound the incoming HTTP body or make large database offsets cheap. Reject oversized requests before parsing, limit counts at the API boundary, and choose a pagination strategy suited to the storage layer.

Error messages should name the schema field and violated rule without echoing secrets or entire payloads. Defaults should apply only to permitted absence. Replacing every conversion error with a success-shaped default hides malformed traffic and configuration mistakes.

Use [safe-integer checks](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isSafeInteger) and the [BigInt reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt) to review representation limits before optimizing.
