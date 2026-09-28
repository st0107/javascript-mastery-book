# Theory

## Arrays Are Objects With Indexed Sequence Behavior

Array indices start at zero. The length is one greater than the largest present array index, unless it has been increased explicitly. Increasing length creates absent positions; reducing it removes elements beyond the new boundary. Reading an absent index ordinarily returns undefined, which does not prove that an element exists there.

Array.isArray(value) distinguishes arrays from other objects. Array elements can hold different types, but a collection with a clear item schema is easier to validate and process.

```js
const items = ['a', 'b'];
items[4] = 'e';
items.label = 'batch';
console.log(items.length, Object.keys(items).join(','));
console.log(items[2], Object.hasOwn(items, 2));
console.log(items.at(-1), items[-1]);
items.length = 2;
console.log(items.join(','), items.length);

// Expected output:
// 5 0,1,4,label
// undefined false
// e undefined
// a,b 2
```

A named property such as label is not a sequence element and does not affect length. at(-1) requests the last element; bracket access with -1 requests the property named "-1". Avoid using arrays as arbitrary-key dictionaries. [Array reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array).

## Dense Arrays, Holes, and Undefined

A dense array has a present element at each index below length. A hole is an absent property at one of those positions. An explicit undefined element is present. Creating Array(3), assigning a far index, increasing length, or deleting an element can create holes.

```js
const sparse = [10, , undefined];
const visited = [];
const mapped = sparse.map((value, index) => { visited.push(index); return value; });
console.log(visited.join(','));
console.log(Object.hasOwn(mapped, 1), Object.hasOwn(mapped, 2));
console.log([...sparse].length, Object.hasOwn([...sparse], 1));
console.log(sparse.includes(undefined));

// Expected output:
// 0,2
// false true
// 3 true
// true
```

Under ordinary unmodified prototypes, map skips holes and preserves them in its result. filter skips holes and packs selected values densely. for...of, array spread, and find read holes as undefined. includes can therefore match undefined in a hole. If indexed properties exist on a prototype, some inherited reads/presence checks differ; production dense-array validation can require own indices explicitly.

Deleting an array element does not shift later indices or shrink length. Use splice when removal should shift positions, or filter when building a new selected sequence.

## Choose the Method From the Result

| Need | Method | Result and stopping behavior |
| --- | --- | --- |
| Transform each present item | map | New array, preserving length/holes. |
| Select items | filter | New dense array of accepted items. |
| Aggregate | reduce | One accumulator; supply an initial value. |
| First matching value | find | Value or undefined; stops at a match. |
| First matching index | findIndex | Index or -1; distinguishes a found undefined. |
| Any item matches | some | Boolean; stops at first truthy predicate. |
| Every present item matches | every | Boolean; stops at first falsy predicate. |
| Perform effects per present item | forEach | undefined; no normal break. |
| Explicit control, early exit, or multiple state updates | for...of / for loop | Statements make control flow visible. |

Callbacks receive value, index, and array for many of these methods. Passing a function that interprets those extra arguments differently can cause a bug. Wrap a callback when its intended interface is narrower.

```js
const prices = [12, 3, 8];
console.log(prices.map(value => value * 2).join(','));
console.log(prices.filter(value => value >= 8).join(','));
console.log(prices.reduce((total, value) => total + value, 0));
console.log(prices.find(value => value > 5));
console.log(prices.some(value => value < 5), prices.every(value => value > 0));
console.log(['10', '10', '10'].map(parseInt).join(','));
console.log(['10', '10', '10'].map(value => parseInt(value, 10)).join(','));

// Expected output:
// 24,6,16
// 12,8
// 23
// 12
// true true
// 10,NaN,2
// 10,10,10
```

map passes indices 0, 1, 2 as parseInt's radix argument. Radix 0 infers decimal for "10", radix 1 is invalid, and radix 2 interprets it as binary. The wrapper deliberately supplies radix 10. [map reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map).

## Empty Collections Have Defined Answers

A supplied reduce accumulator makes an empty sum zero. Without it, reduce needs a first present element and throws when there is none. Empty some is false; empty every is true because there is no counterexample. Neither says a collection is nonempty.

```js
console.log([].reduce((sum, value) => sum + value, 0));
console.log([].some(() => true), [].every(() => false));
try { [].reduce((sum, value) => sum + value); }
catch (error) { console.log(error.name); }
const values = [undefined];
console.log(values.find(value => value === undefined));
console.log(values.findIndex(value => value === undefined));

// Expected output:
// 0
// false true
// TypeError
// undefined
// 0
```

A find result of undefined may mean no match or a matching undefined value. Choose findIndex or a tagged result when that distinction matters. [reduce reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce).

## Mutation and Copying Are Separate API Choices

| Mutates the receiver | Common copying alternative |
| --- | --- |
| sort | toSorted |
| reverse | toReversed |
| splice | toSpliced |
| Indexed replacement | with |
| push/pop, shift/unshift | Construct a new array when ownership requires it. |
| fill, copyWithin | Copy first if modifying caller-owned storage would be wrong. |

slice, concat, map, and filter create arrays but do not recursively copy their items. A new outer array can still share every contained object with the source.

```js
const original = [{ count: 2 }, { count: 5 }];
const copied = original.slice();
copied[0].count = 9;
copied.push({ count: 1 });
console.log(original.length, copied.length);
console.log(original[0].count);
console.log(original[0] === copied[0]);
const detached = original.map(item => ({ count: item.count }));
detached[0].count = 4;
console.log(original[0].count, detached[0].count);

// Expected output:
// 2 3
// 9
// true
// 9 4
```

The explicit projection owns the one-level record schema used here. If a record contains nested objects, copying its fields is still shallow. Choose a contract-specific snapshot instead of claiming that spread or map automatically performs a deep clone.

## Numeric Sorting Requires a Comparator

Default sorting compares string representations. For finite Numbers, a - b supplies ascending numeric order; b - a supplies descending order. Comparator results below zero, zero, and above zero mean before, tied, and after. A boolean comparator cannot consistently express all three relationships.

```js
const counts = [10, 2, 30];
console.log(counts.toSorted().join(','));
console.log(counts.toSorted((a, b) => a - b).join(','));
console.log(counts.join(','));
const rows = [{ id: 'a', rank: 2 }, { id: 'b', rank: 1 }, { id: 'c', rank: 2 }];
console.log(rows.toSorted((a, b) => a.rank - b.rank).map(row => row.id).join(','));
console.log(counts.sort((a, b) => a - b) === counts);

// Expected output:
// 10,2,30
// 2,10,30
// 10,2,30
// b,a,c
// true
```

Sorting is stable: tied items retain their original relative order. Comparators should be pure, consistent, reflexive, antisymmetric, and transitive. Validate finite numeric keys before subtracting them; NaN or unintended strings can undermine the intended ordering. The language does not guarantee one sort algorithm or universal time/space bound. [sort reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort).

## Construction, Destructuring, and Spread

Array.from consumes an iterable or array-like object and can map each position during construction. It fills positions rather than preserving holes from an array-like source. Spread consumes an iterable. Array destructuring consumes positions; defaults apply to undefined, and rest collects remaining values into a new array.

```js
const sequence = Array.from({ length: 3 }, (_, index) => index + 1);
const [first, second = 20, ...remaining] = [1, undefined, 3, 4];
console.log(sequence.join(','));
console.log(first, second, remaining.join(','));
console.log(Array(3).map(() => 1).join('|'));
console.log(Array.from({ length: 3 }, () => 1).join('|'));

// Expected output:
// 1,2,3
// 1 20 3,4
// ||
// 1|1|1
```

Array(3).map never invokes its callback for the absent positions. Array.from with a mapping function creates real elements. Bound length before allocating an array from external data. [Array.from](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from).

## Set: Uniqueness and Membership

Set stores each distinct value once and iterates in insertion order. add, has, delete, and size express membership operations directly. Equality is SameValueZero: NaN matches NaN, positive/negative zero match, and objects match only by identity. A new object with equal fields is a different member.

```js
const key = { id: 'u1' };
const seen = new Set([NaN, NaN, 0, -0, key, { id: 'u1' }]);
console.log(seen.size);
console.log(seen.has(NaN), seen.has({ id: 'u1' }), seen.has(key));
console.log([...new Set(['b', 'a', 'b'])].join(','));

// Expected output:
// 4
// true false true
// b,a
```

Deduplicate records by an explicit ID projection if equal IDs should represent one entity. A Set of the records themselves tests reference uniqueness. The specification requires average sublinear access, without promising a particular implementation. [Set reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set).

## Map: Values Indexed by Keys

Map permits primitive or object keys and uses the same key equality as Set. It preserves key insertion order. Updating an existing key changes its value without moving its position; deleting then reinserting places it at the end. get returns undefined for both an absent key and a stored undefined, so use has when presence matters.

```js
const catalog = new Map([['b', 2], ['a', undefined]]);
catalog.set('b', 3);
console.log([...catalog.keys()].join(','));
console.log(catalog.get('a'), catalog.has('a'), catalog.has('missing'));
catalog.delete('b');
catalog.set('b', 4);
console.log([...catalog.keys()].join(','));
catalog.set('__proto__', 'data');
console.log(catalog.get('__proto__'));

// Expected output:
// b,a
// undefined true false
// a,b
// data
```

Use set/get/has for entries. Bracket assignment such as map[key] writes an ordinary object property and does not create a Map entry. Keys such as "__proto__" are ordinary Map entry keys, avoiding the prototype-linked behavior of some object-property operations. A Map still needs size limits and a clear lifetime. [Map reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map).
