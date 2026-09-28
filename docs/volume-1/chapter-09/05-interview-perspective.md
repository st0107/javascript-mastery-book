# Interview Perspective

## Explain the Collection Contract First

Before choosing a method, identify whether order matters, duplicates are meaningful, lookup is by position or key, and callers share the input objects. Then state size and item-type assumptions. Those choices explain why an array, Set, Map, or a combination is appropriate.

## Is an Array Copy Independent?

Its element slots are independent, but object values may remain shared. A slice or spread copy can be reordered without reordering the source. Mutating a shared item's property still affects both arrays. A detached report should project the required primitive fields into fresh records.

```js
const original = [{ id: 'a', count: 1 }];
const copy = [...original];
copy[0].count = 2;
copy.push({ id: 'b', count: 3 });
console.log(original.length, original[0].count);
console.log(copy === original, copy[0] === original[0]);

// Expected output:
// 1 2
// false true
```

A follow-up may introduce a nested address object. Spreading each record once still shares its address; ownership must be described for the actual graph, not inferred from a single spread expression.

## Why Does Array(3).map Produce No Mapped Values?

Array(3) creates a length-three array with absent positions. map skips those positions. Array.from({length: 3}, mapper) instead visits each generated position and creates a dense array. Storing undefined explicitly also creates a present element that map will visit.

## Which Method Expresses the Desired Question?

Use some for existence, every for universal validation, find for a first matching value, and filter for every matching value. filter followed by a length check traverses the full collection and allocates a result even when only one match was needed.

Empty every is true. If a rule requires at least one valid item, include a nonempty check and handle holes deliberately. A sparse array can pass every without validating absent positions.

## What Does Map Promise About Mutation During Iteration?

The array map method captures its initial length. Its callback reads later values when their indices are reached, so mutations to those values can be observed. Appending beyond the initial range does not add mapping callbacks. Explain this as a visitation rule, not an immutable snapshot.

Also distinguish array.map from the Map collection. Their similar names describe different APIs.

## Why Is a Boolean Sort Comparator Wrong?

A comparator must express negative, zero, and positive ordering. Returning a > b provides only true/false, numerically 1/0, and treats one direction as a tie. Use a - b for validated finite Numbers and a deliberate multi-field comparator for records. Do not claim an exact output for an inconsistent comparator.

Stable sorting preserves input order for tied keys. toSorted returns a new array; sort mutates and returns the receiver. Neither deep-clones records.

## Does Set Deduplicate Equal-Looking Objects?

Only if they are the same object reference. To deduplicate business entities by ID, compare their ID values and define first-wins, last-wins, merge, or reject behavior. A Map keyed by ID can express the policy directly.

```js
const first = { id: 'u1' };
const second = { id: 'u1' };
console.log(new Set([first, second, first]).size);
console.log(new Set([first.id, second.id]).size);
const lookup = new Map([['u1', undefined]]);
console.log(lookup.get('u1'), lookup.has('u1'));
console.log(lookup.get('missing'), lookup.has('missing'));

// Expected output:
// 2
// 1
// undefined true
// undefined false
```

The last two lines demonstrate why get alone does not always answer existence. In a schema that forbids undefined values, the ambiguity may be excluded by contract; state that assumption.

## Worked Design Prompt: Order Summary

A report must list paid orders, show the total, reject duplicate IDs, and leave input unchanged. A strong solution validates every bounded record, uses a Set for duplicate detection, selects paid items, sorts a copy, and projects owned output records. Test an invalid excluded record as well as a valid paid one. Otherwise filtering before validation could hide malformed input.

Discuss the maximum total before writing arithmetic. The production contract limits count and cents per item so the sum remains a safe integer. Discuss scan costs, retained arrays, and sorting separately; the language does not fix one sorting algorithm.

The [production examples](04-production-examples.md) implement both this design and a Map-of-Sets membership index. The [exercises](06-exercises-coding-challenges.md) test different ownership and duplication policies.
