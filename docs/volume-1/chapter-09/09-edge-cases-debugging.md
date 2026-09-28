# Edge Cases and Debugging

## Length Does Not Prove Density

```js
const input = Array(2);
console.log(input.length);
console.log(input.every(value => Number.isFinite(value)));
console.log(Object.hasOwn(input, 0), Object.hasOwn(input, 1));
const dense = Array.from(input);
console.log(Object.hasOwn(dense, 0), dense[0]);

// Expected output:
// 2
// true
// false false
// true undefined
```

every skips absent positions, so this check does not establish two finite numbers. Require own indices or reject undefined after a deliberate densification step, according to the contract. Densifying changes holes into values and is therefore a semantic change.

## Mutation Can Skip Work or Change Later Values

```js
const input = [1, 2, 3];
const seen = [];
input.forEach((value, index) => {
  seen.push(value);
  if (index === 0) input.splice(1, 1);
});
console.log(seen.join(','));
console.log(input.join(','));

// Expected output:
// 1,3
// 1,3
```

After removing the second element, 3 moves into index 1 and is visited there. The original 2 never reaches the callback. If processing must reflect the original batch, use a stable owned snapshot and define whether nested record mutations are allowed.

## Repeated Fill Values Share Identity

```js
const shared = Array(3).fill({ count: 0 });
shared[0].count = 1;
console.log(shared.map(item => item.count).join(','));
const independent = Array.from({ length: 3 }, () => ({ count: 0 }));
independent[0].count = 1;
console.log(independent.map(item => item.count).join(','));

// Expected output:
// 1,1,1
// 1,0,0
```

fill repeats one reference. The Array.from callback constructs a new record per position. The same concern applies to pushing the same mutable accumulator into a result repeatedly.

## Map Entries Are Not Object Properties

```js
const lookup = new Map();
lookup['u1'] = 'property';
lookup.set('u2', 'entry');
console.log(lookup.size, lookup.has('u1'));
console.log(lookup['u1'], lookup.get('u2'));
console.log(JSON.stringify(lookup));
console.log(JSON.stringify([...lookup]));

// Expected output:
// 1 false
// property entry
// {"u1":"property"}
// [["u2","entry"]]
```

JSON serializes enumerable object properties here, not the Map's entries. Define a serialization format explicitly, such as an array of entries or a schema-specific report. Objects used as Map keys may also need a separate identity encoding for transport.

## Includes, IndexOf, and NaN

```js
const values = [NaN, undefined];
console.log(values.includes(NaN), values.indexOf(NaN));
console.log([,].includes(undefined), [,].indexOf(undefined));
console.log(new Set([NaN]).has(NaN));

// Expected output:
// true -1
// true -1
// true
```

includes uses SameValueZero and treats holes as undefined for this ordinary-array case. indexOf uses strict equality and skips holes. Replacing one search method with another can change behavior even when both sound like membership checks.

## Diagnose the First Divergent Stage

For a pipeline failure, inspect validated input, selected IDs, sorted IDs, projected output, and final aggregate separately. Keep logs bounded and redact sensitive fields. Ask whether the first discrepancy is missing visitation, coercion, duplicate policy, mutation, comparator behavior, or shared ownership.

The edge companion `code/volume-1/chapter-09/example-04-edge-cases.js` asserts these distinctions. The [Array reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) summarizes hole-sensitive methods, and the [Map reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) distinguishes entries from properties.
