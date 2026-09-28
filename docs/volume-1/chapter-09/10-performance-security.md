# Performance and Security

## Count Scans, Comparisons, and Stored Results

map, filter, reduce, find, some, and every perform at most a linear scan over their captured index range for ordinary arrays, excluding callback work. Early-exit methods may stop sooner. A callback that scans another collection changes the whole operation: mapping n orders and finding each in a catalog of m items can require O(nm) comparisons.

An index can replace repeated scans with a build pass and keyed lookups. Under conventional expected Map costs, that becomes O(n + m), at the price of O(m) retained index storage. The language specifies average sublinear access rather than a particular hash-table bound.

Array copying consumes storage for new element slots. It may still retain the same records, so shallow copying can increase reachability without isolating ownership. Name the lifetime of snapshots and indexes in a long-lived service.

## Avoid Quadratic Accumulator Copying

```js
let copiedSlots = 0;
const copied = [1, 2, 3, 4].reduce((result, value) => {
  copiedSlots += result.length;
  return [...result, value * 2];
}, []);
const local = [1, 2, 3, 4].reduce((result, value) => {
  result.push(value * 2);
  return result;
}, []);
console.log(copied.join(','));
console.log(local.join(','));
console.log(copiedSlots);

// Expected output:
// 2,4,6,8
// 2,4,6,8
// 6
```

The first pattern copies 0 + 1 + ... + (n - 1) earlier slots, producing quadratic copying work. The second mutates a new local accumulator and builds the result in linear work under ordinary array-growth assumptions. map expresses this particular transform even more directly.

This does not justify mutating caller-owned input. Local construction and externally shared mutation have different ownership consequences.

## Sorting and Queue Costs

Sorting needs a valid comparator and has an implementation-dependent cost. Keep expensive key extraction out of repeated comparator calls by computing validated keys beforehand when measurement justifies it. Do not add logging or mutations inside a comparator: call order/count is not an application contract.

Repeated shift/unshift can move many index positions. For a large queue, an advancing read index can avoid repeatedly removing the front; periodically release consumed references or compact according to measured memory needs. A simple bounded array queue may still be sufficient. Choose based on workload, not slogans about one syntax being fastest.

## Bound Input Before Allocation

Validate count limits before Array.from, spread, sorting, or building large indexes. Also bound relevant string lengths and numeric fields. A single collection-size check does not limit the size of every record or the serialized request. Enforce transport/deserialization limits at the surrounding boundary.

Do not pass an unbounded array to a function through argument spread merely to compute an aggregate; engines have argument-count limits. Use an explicit loop or reduce with a documented empty-input result.

## Keys and Retained Data

Map treats "__proto__" as ordinary entry data, which avoids some hazards of dynamic object-property dictionaries. It does not sanitize values, authorize access, cap memory, or make an arbitrary object safe to read. Identity and role fields still need trusted origins.

A Map strongly retains its object keys and values while the Map is reachable. Long-lived caches need eviction or explicit deletion. A Set of seen IDs also grows without bound unless its scope or retention period is limited. The production examples keep these collections local to bounded batches.

## Practical Measurement

Measure realistic sizes, duplicate rates, match positions, sort-key distributions, and callback cost. Include allocation and retained memory, not just elapsed loop time. Engine specialization may favor dense predictable arrays, but correctness must not depend on a particular storage representation. [V8 elements kinds](https://v8.dev/blog/elements-kinds) explains one implementation's trade-offs; [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) defines portable entry semantics.
