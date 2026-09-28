# Revision and Summary

## Collection Decision Sheet

| Requirement | Starting point |
| --- | --- |
| Ordered sequence, duplicates meaningful | Array |
| Unique values or membership checks | Set |
| Keyed association with arbitrary key types | Map |
| Transform each item | map |
| Select all matching items | filter |
| Aggregate to a result | reduce with an explicit initial value, or a loop |
| Find the first item/index | find / findIndex |
| Test any/all items | some / every |
| Sort without reordering the source | toSorted with an appropriate comparator |
| Detach output records | Explicitly project the supported schema into fresh objects |

## Rules to Recall Precisely

- length counts possible positions, not present elements.
- A hole differs from a stored undefined.
- map skips holes; Array.from and spread can create present undefined values from them.
- map/filter/reduce callbacks operate synchronously; map does not await promises.
- Most callback methods receive value, index, and array.
- Empty some is false; empty every is true.
- reduce without an initial value fails when no present element exists.
- Array copying is shallow unless your own projection copies the relevant records.
- Default sorting compares strings; finite numeric ordering needs a comparator.
- Stable sorting retains tie order; comparator call count is not fixed.
- Map/Set use SameValueZero and compare object keys by identity.
- Map.get(undefined-valued key) and Map.get(missing key) both return undefined; has distinguishes them.

## A Compact Prediction Check

```js
const sparse = [1, , 3];
console.log(sparse.length, Object.keys(sparse).length);
console.log(sparse.map(value => value * 2).join(','));
console.log([...sparse].includes(undefined));
console.log([10, 2].toSorted((a, b) => a - b).join(','));
console.log(new Set([NaN, NaN, 0, -0]).size);
console.log(new Map([['x', undefined]]).has('x'));

// Expected output:
// 3 2
// 2,,6
// true
// 2,10
// 2
// true
```

## Production Review Questions

State the maximum batch size, dense/sparse policy, item schema, duplicate policy, sort order, and ownership of every returned record. Prove aggregate integer bounds when totals matter. Decide whether invalid items reject the batch, are skipped, or appear in a rejection report.

Count traversal and storage separately. A clear bounded pipeline can be preferable to a fused loop; a measured allocation problem can justify combining stages. Repeated catalog scans may benefit from an index, but an index needs a lifetime.

## References and Further Reading

- [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array): indices, length, and holes.
- [map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map): callback arguments and visitation.
- [reduce](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce): initial values and accumulator behavior.
- [sort](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort): stable ordering and comparator contracts.
- [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) and [Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set): key equality, iteration, and operation semantics.
- [V8 elements kinds](https://v8.dev/blog/elements-kinds): one engine's array storage optimizations; keep them separate from portable semantics.

Continue to [Errors and Debugging](../chapter-10/01-introduction.md) to make collection failures, assertion failures, and propagation policies explicit.
