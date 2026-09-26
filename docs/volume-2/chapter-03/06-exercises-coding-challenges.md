# Exercises and Coding Challenges

Work through these six exercises in order. For each property operation, identify the starting object, the object that owns the descriptor, and the receiver used by any method or accessor. All JavaScript blocks are independently runnable in Node.js 20 or later and use strict mode. Intentional failures are caught.

The companion assertion program lives in `code/volume-2/chapter-03/example-03-prototype-challenges.js`. Run it from the repository root with `node code/volume-2/chapter-03/example-03-prototype-challenges.js`.

## Exercise 1: Track Lookup, Shadowing, and Deletion

**Prompt and contract:** An export job inherits its default format. Predict every line below, including what happens when the job gets an own property whose value is `undefined`. Explain which operations change the job and which change the defaults. The defaults have an ordinary writable data property, and the job is extensible.

**Hint:** Property lookup stops at the first matching descriptor. A descriptor containing `undefined` still counts as a match. Deleting a configurable own property can reveal an inherited property with the same key.

**Solution and runnable prediction program:**

```js
'use strict';

const defaults = { format: 'pdf' };
const job = Object.create(defaults);

console.log(job.format, Object.hasOwn(job, 'format'));
job.format = 'epub';
console.log(job.format, defaults.format);
job.format = undefined;
console.log(job.format, Object.hasOwn(job, 'format'), 'format' in job);
delete job.format;
console.log(job.format, Object.hasOwn(job, 'format'));
console.log(delete job.format, defaults.format);

// Expected output:
// pdf false
// epub pdf
// undefined true true
// pdf false
// true pdf
```

**Why it works:** The first read finds the descriptor on `defaults`. Assignment creates an own data property on the extensible job because the inherited descriptor permits it. Assigning `undefined` updates that own property rather than removing it. The first deletion removes the own descriptor. The second deletion succeeds without removing anything because deletion on `job` does not walk upward and delete `defaults.format`.

**Complexity:** In a simple chain-walk model, a read or membership search visits at most `h` objects for chain length `h`, using `O(1)` traversal state. Own-property checks and deletion inspect the starting object's property table. Engines may optimize these operations; the model is not a timing guarantee.

**Alternative:** A plain record with an explicit fallback expression can avoid a prototype relationship. Define the fallback contract first: `job.format ?? defaults.format` treats an own `undefined` as absent, which differs from ordinary prototype lookup.

## Exercise 2: Share Methods, Keep Mutable State Separate

**Prompt and contract:** Implement `createWorkQueue(name)` using a shared prototype object. Each queue must have its own initially empty `items` array. Share `add(item)` and `snapshot()` methods between queues. `add` appends a string and returns the new length; `snapshot` returns a shallow copy so changing the returned array cannot edit the queue's array.

For this exercise, names and items are strings. The methods are called with a queue receiver, and the prototype contains behavior rather than shared mutable queue state.

**Hint:** Put the array allocation inside the factory. Allocating one array on the prototype causes different queues to find and mutate the same array.

**Solution:**

```js
'use strict';

const queueMethods = {
  add(item) {
    return this.items.push(item);
  },
  snapshot() {
    return this.items.slice();
  }
};

function createWorkQueue(name) {
  const queue = Object.create(queueMethods);
  queue.name = name;
  queue.items = [];
  return queue;
}

const print = createWorkQueue('print');
const exportQueue = createWorkQueue('export');
print.add('chapter-01');
print.add('chapter-02');
exportQueue.add('appendix');

const copy = print.snapshot();
copy.push('local-only');
console.log(print.add === exportQueue.add);
console.log(Object.hasOwn(print, 'items'), Object.hasOwn(print, 'add'));
console.log(print.snapshot().join(', '));
console.log(exportQueue.snapshot().join(', '));
console.log(copy.length, print.items.length);

// Expected output:
// true
// true false
// chapter-01, chapter-02
// appendix
// 3 2
```

**Why it works:** Both objects delegate method lookup to `queueMethods`, so reading `add` produces the same function object. Each factory call allocates a different array and stores it on that queue. Calling `print.add(...)` supplies `print` as the receiver even though the method is inherited. The snapshot copies the array structure; it would still share element objects if the contract were extended to accept objects.

**Complexity:** Construction adds `O(1)` per-queue state. Appending has typical amortized `O(1)` cost in a growable-array model; occasional growth may copy existing elements. A snapshot of `n` items takes `O(n)` time and additional array space. The queues retain their items, while the fixed set of method functions is shared.

**Alternative:** A closure factory can keep the array private, at the cost of creating per-queue functions. A class with an instance field and prototype methods expresses similar state ownership. A public `items` property is appropriate here for inspection; it does not prevent outside mutation.

## Exercise 3: Find a Descriptor's Owner Without Running Its Getter

**Prompt and contract:** Implement `findPropertyOwner(object, key)`. Starting with `object`, walk its prototype chain and return `{ owner, descriptor }` for the first own descriptor with that key. Return `undefined` if absent. An own data property whose value is `undefined` must stop the search. Support string and symbol keys, including non-enumerable properties.

The input and every object in its chain must be trusted ordinary objects, not proxies or host objects with custom behavior. Reject null and primitive starting values, and reject keys that are neither strings nor symbols. Do not read the property value through `object[key]`, invoke an accessor, or modify the chain.

**Hint:** `Object.getOwnPropertyDescriptor` returns a descriptor object even when a data property's value is `undefined`. Advance with `Object.getPrototypeOf`; do not use `constructor.prototype` as a substitute.

**Solution:**

```js
'use strict';

function findPropertyOwner(object, key) {
  if (object === null || typeof object !== 'object') {
    throw new TypeError('object must be a non-null ordinary object.');
  }
  if (typeof key !== 'string' && typeof key !== 'symbol') {
    throw new TypeError('key must be a string or symbol.');
  }

  for (let current = object; current !== null; current = Object.getPrototypeOf(current)) {
    const descriptor = Object.getOwnPropertyDescriptor(current, key);
    if (descriptor !== undefined) return { owner: current, descriptor };
  }
  return undefined;
}

let getterCalls = 0;
const schema = Object.create(null);
Object.defineProperty(schema, 'status', {
  get() {
    getterCalls += 1;
    return 'ready';
  },
  configurable: true
});
const record = Object.create(schema);
const found = findPropertyOwner(record, 'status');
console.log(found.owner === schema, typeof found.descriptor.get, getterCalls);

Object.defineProperty(record, 'status', {
  value: undefined,
  configurable: true
});
const own = findPropertyOwner(record, 'status');
console.log(own.owner === record, own.descriptor.value, getterCalls);
console.log(findPropertyOwner(record, 'missing') === undefined);

// Expected output:
// true function 0
// true undefined 0
// true
```

**Why it works:** The loop asks each object for its own descriptor instead of performing ordinary value lookup. Accessor descriptors expose the getter function without executing its body. The returned descriptor is a description of the property, not a live control object: editing its fields does not redefine the original property. See the specification's [ordinary own-descriptor lookup](https://tc39.es/ecma262/multipage/ordinary-and-exotic-objects-behaviours.html#sec-ordinarygetownproperty).

**Contract boundary:** The type checks reject obvious invalid inputs; they do not prove that an object is ordinary or trusted. Proxies can intercept descriptor and prototype queries, so this function is not a side-effect-free inspector for arbitrary values. It deliberately rejects function starting values even though some functions could be traversed by a broader utility.

**Complexity:** For `h` inspected objects, the loop performs `O(h)` descriptor/prototype queries and keeps `O(1)` live traversal state, excluding engine property-table costs. It does not build an array of the chain. The returned owner reference can retain its reachable data; the descriptor contains at most a fixed number of fields.

**Alternative:** Use `Object.hasOwn` for an own-membership question and `in` for any-chain membership. Neither gives both the owning object and its descriptor. For deliberate value evaluation, ordinary property access is simpler, but can run a getter.

## Exercise 4: Make Inherited Accessors Use Instance State

**Prompt and contract:** Build two distance records sharing a `kilometers` getter and setter. Each record owns a `meters` property. Reading `record.kilometers` divides that record's meters by 1,000. Writing it validates a finite, non-negative number no greater than 1,000,000, then stores its converted value in that record's own `meters` property. Invalid writes throw `RangeError` without changing the previous value.

Do not create an own `kilometers` property. For this exercise the records are extensible, their own `meters` fields are writable, and calculations use ordinary Number arithmetic rather than exact decimal measurement.

**Hint:** Put the accessor pair on a shared prototype. Its body uses `this.meters`; the object that owns the accessor is not automatically its receiver.

**Solution:**

```js
'use strict';

const distanceMethods = {
  get kilometers() {
    return this.meters / 1000;
  },
  set kilometers(value) {
    if (!Number.isFinite(value) || value < 0 || value > 1_000_000) {
      throw new RangeError('kilometers must be between 0 and 1000000.');
    }
    this.meters = value * 1000;
  }
};

const first = Object.create(distanceMethods);
const second = Object.create(distanceMethods);
first.meters = 1500;
second.meters = 500;

console.log(first.kilometers, second.kilometers);
first.kilometers = 2.5;
console.log(first.meters, second.meters);
console.log(Object.hasOwn(first, 'kilometers'), Object.hasOwn(first, 'meters'));
console.log(Object.hasOwn(distanceMethods, 'meters'));
try {
  first.kilometers = -1;
} catch (error) {
  console.log(error.name, first.meters);
}

// Expected output:
// 1.5 0.5
// 2500 500
// false true
// false
// RangeError 2500
```

**Why it works:** Lookup finds the inherited accessor while preserving the original receiver. The setter therefore runs with `first` as `this` and updates `first.meters`. It does not create a `kilometers` data property or initialize shared meters on the prototype. Validation happens before the assignment. This receiver behavior follows [ordinary property reads](https://tc39.es/ecma262/multipage/ordinary-and-exotic-objects-behaviours.html#sec-ordinaryget) and [ordinary property writes](https://tc39.es/ecma262/multipage/ordinary-and-exotic-objects-behaviours.html#sec-ordinarysetwithowndescriptor).

**Complexity:** With the fixed shallow chain and fixed-size Number values here, each operation has `O(1)` source-level time and extra space. The accessors are shared; each record owns one measurement field.

**Alternative:** Explicit `readKilometers(record)` and `writeKilometers(record, value)` functions make conversion work visible at the call site. Accessors suit lightweight property-like behavior, but surprising I/O or expensive processing is usually clearer behind an explicit method call.

## Exercise 5: Separate Inheritance Setup From Initialization

**Prompt and contract:** Create a `Guide` constructor that initializes `Document` state and inherits `Document.prototype.describe`. Every document must own its title and a fresh tags array. A guide additionally owns a chapter count. Set up the instance prototype chain without calling `Document`, and give `Guide.prototype` an own non-enumerable `constructor` property referring to `Guide`.

Use ordinary function constructors called with `new`. Set up the prototypes before creating instances. This exercise does not implement class semantics, static inheritance, subclassing built-ins, or support for constructors that return replacement objects.

**Hint:** `Object.create(Document.prototype)` makes the delegation link without initializing a document. `Document.call(this, title)` initializes each real guide. `Guide.prototype = new Document(...)` would run initialization during setup and could put mutable instance data on the shared prototype.

**Solution:**

```js
'use strict';

let documentInitializations = 0;

function Document(title) {
  documentInitializations += 1;
  this.title = title;
  this.tags = [];
}

Object.defineProperty(Document.prototype, 'describe', {
  value: function describe() {
    return `${this.title} (${this.tags.length} tags)`;
  },
  writable: true,
  configurable: true
});

function Guide(title, chapters) {
  Document.call(this, title);
  this.chapters = chapters;
}

Guide.prototype = Object.create(Document.prototype, {
  constructor: {
    value: Guide,
    writable: true,
    configurable: true,
    enumerable: false
  }
});

console.log(documentInitializations);
const first = new Guide('JavaScript', 12);
const second = new Guide('Web APIs', 8);
first.tags.push('language');

console.log(first.describe(), second.describe());
console.log(Object.getPrototypeOf(first) === Guide.prototype);
console.log(Object.getPrototypeOf(Guide.prototype) === Document.prototype);
console.log(first instanceof Guide, first instanceof Document);
console.log(first.constructor === Guide, Object.hasOwn(first, 'constructor'));
console.log(documentInitializations, Object.hasOwn(Guide.prototype, 'tags'));

// Expected output:
// 0
// JavaScript (1 tags) Web APIs (0 tags)
// true
// true
// true true
// true false
// 2 false
```

**Why it works:** Prototype setup creates a plain object linked to `Document.prototype`. Each later `new Guide` creates an instance linked to `Guide.prototype`, then executes the child body, which explicitly calls the parent initializer with that instance. Method lookup follows the two links, but the shared `describe` method reads each instance's own state.

The `constructor` property restores a useful convention on the replacement prototype. It is still an ordinary property: it does not initialize the object, control its internal prototype link, or prove which constructor actually ran. The prototype property descriptor makes it non-enumerable to avoid presenting it as instance data during enumeration.

**Complexity:** The fixed setup and each initialization take `O(1)` bookkeeping time and space, with a fresh empty array per instance. Shared method storage is fixed. Formatting a description takes time and result space proportional to output length; each instance additionally retains its own title and tags.

**Alternative:** For new code, `class Guide extends Document` expresses this relationship directly and also sets up a constructor-side inheritance chain. Use composition when a guide contains a document rather than being a specialized document. The manual setup here is a bounded explanation of instance delegation, not a complete implementation of `extends`.

## Exercise 6: Store Dangerous-Looking Names as Dictionary Data

**Prompt and contract:** Implement `buildNameIndex(entries)` for a supplied array of trusted two-element `[string, value]` pairs. Return a null-prototype object containing one own enumerable writable data property per distinct name. Later duplicate entries replace earlier values. Accept empty names and names such as `__proto__`, `constructor`, and `toString`; reject non-string names with a `TypeError`.

An entry with the value `undefined` must still count as present. Values are stored by reference, not cloned. This exercise does not validate arbitrary entry structures or perform nested merges.

**Hint:** Start with `Object.create(null)` and check presence with `Object.hasOwn(index, name)`. A null-prototype object does not inherit `hasOwnProperty` or the legacy `__proto__` accessor.

**Solution:**

```js
'use strict';

function buildNameIndex(entries) {
  const index = Object.create(null);
  for (const [name, value] of entries) {
    if (typeof name !== 'string') {
      throw new TypeError('entry names must be strings.');
    }
    index[name] = value;
  }
  return index;
}

const index = buildNameIndex([
  ['__proto__', 'literal name'],
  ['constructor', undefined],
  ['toString', 'display name'],
  ['chapter', 'draft'],
  ['chapter', 'reviewed']
]);

console.log(Object.getPrototypeOf(index) === null);
console.log(index.__proto__, index.toString);
console.log(Object.hasOwn(index, 'constructor'), index.constructor);
console.log(Object.hasOwn(index, 'missing'), index.missing);
console.log(index.chapter, Object.keys(index).length);
console.log(Object.getPrototypeOf(index) === null);

// Expected output:
// true
// literal name display name
// true undefined
// false undefined
// reviewed 4
// true
```

**Why it works:** The new object has no ancestor properties or setters. Bracket assignment therefore creates ordinary own data properties, including the `__proto__` key. Repeating a name updates its existing property. `Object.hasOwn` distinguishes the present `constructor` entry from an absent entry even though both value reads return `undefined`.

**Boundary:** This container treats keys as data locally. Passing the entries into some other object's assignment or merge logic can introduce different semantics. A null prototype does not validate values, sanitize arbitrary nested structures, or make later consumers safe automatically.

**Complexity:** For `n` entries and `k` distinct names, construction performs `O(n)` writes and retains `O(k)` property slots under the usual constant-average property-table model. String processing and retained value payloads add their own costs; ECMAScript does not promise a particular dictionary implementation. Enumerating keys creates an `O(k)` result array.

**Alternative:** `Map` supports arbitrary key values and gives presence checks through `has`, without sharing the object's property namespace. A null-prototype object is useful when a string-keyed record is the expected interface. Do not call `index.hasOwnProperty(...)`: that method is absent or may itself be a stored entry.
