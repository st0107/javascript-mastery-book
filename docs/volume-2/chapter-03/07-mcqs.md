# MCQs

Choose one answer before reading each explanation. Every JavaScript block is independently runnable in Node.js 20 or later, uses strict mode, and includes expected output for checking your prediction. All prototype changes are confined to objects and constructors created inside the example.

## 1. An Own Property Containing `undefined`

What does this program print?

```js
'use strict';

const defaults = { format: 'pdf' };
const job = Object.create(defaults);
job.format = undefined;
console.log(job.format, Object.hasOwn(job, 'format'));

// Expected output (check after answering):
// undefined true
```

- A. `pdf false`, because undefined means that the property does not exist.
- B. `undefined true`, because the own descriptor stops lookup even though its value is undefined.
- C. `pdf true`, because lookup always skips falsy values.
- D. A `TypeError`, because inherited properties cannot be shadowed.

**Answer: B.** Lookup searches for a matching property descriptor, not a truthy value. Assignment creates an own property here because the inherited data property is writable and the job is extensible. Removing the property with `delete` would have a different result from assigning `undefined`.

## 2. Deleting a Name That Is Only Inherited

What does this program print?

```js
'use strict';

const defaults = { color: 'blue' };
const theme = Object.create(defaults);
console.log(delete theme.color);
console.log(theme.color, defaults.color);

// Expected output (check after answering):
// true
// blue blue
```

- A. `true`, then `undefined undefined`, because deletion removes the first property anywhere in the chain.
- B. `false`, then `blue blue`, because deleting an inherited name must fail.
- C. A `TypeError`, because strict mode forbids deleting absent own properties.
- D. `true`, then `blue blue`, because no own property is removed and the inherited property remains.

**Answer: D.** Deleting from an ordinary object examines that object's own property. The absence of an own `color` makes this deletion succeed without changing the prototype. A later read still finds the inherited property.

## 3. Own Membership, Chain Membership, and Enumeration

What does this program print?

```js
'use strict';

const marker = Symbol('marker');
const record = Object.create({ inherited: true });
record.visible = 1;
record[marker] = 2;
Object.defineProperty(record, 'hidden', { value: 3 });

console.log('inherited' in record, Object.hasOwn(record, 'inherited'));
console.log(Object.hasOwn(record, 'hidden'), Object.hasOwn(record, marker));
console.log(Object.keys(record).join(', '));

// Expected output (check after answering):
// true false
// true true
// visible
```

- A. `true false`; `true true`; `visible`.
- B. `true true`; `true true`; `inherited, visible, hidden`.
- C. `true false`; `false false`; `visible`.
- D. `false false`; `true false`; `visible, hidden`.

**Answer: A.** `in` searches the chain. `Object.hasOwn` checks only the starting object's own descriptors, including non-enumerable and symbol-keyed properties. `Object.keys` includes only own enumerable string keys, so both `hidden` and the symbol key are excluded.

## 4. Mutating an Inherited Array

What does this program print?

```js
'use strict';

const shared = { items: [] };
const first = Object.create(shared);
const second = Object.create(shared);
first.items.push('draft');
console.log(first.items === second.items, second.items.length);
first.items = [];
console.log(first.items === second.items, second.items.length);

// Expected output (check after answering):
// true 1
// false 1
```

- A. `false 0`, then `false 0`, because every inheriting object automatically gets a cloned array.
- B. `true 1`, then `true 0`, because assigning through a child always rewrites the ancestor's property.
- C. `true 1`, then `false 1`, because mutation changes the shared array while later assignment creates an own property.
- D. A `TypeError`, because inherited arrays are read-only.

**Answer: C.** The first lookup returns the shared array, and `push` mutates that array. The later assignment creates a separate own `items` property on `first`. It does not empty the array that `second` still finds through the prototype.

## 5. `Object.create` Does Not Run a Constructor

What does this program print?

```js
'use strict';

let initializations = 0;
function Entry() {
  initializations += 1;
  this.ready = true;
}

const entry = Object.create(Entry.prototype);
console.log(initializations, Object.hasOwn(entry, 'ready'));
console.log(entry instanceof Entry);

// Expected output (check after answering):
// 0 false
// true
```

- A. `1 true`, then `true`, because Object.create calls the prototype's constructor.
- B. `0 false`, then `true`, because the prototype link exists without constructor initialization.
- C. `0 false`, then `false`, because instanceof records which function actually ran.
- D. A `TypeError`, because constructor prototypes cannot be passed to Object.create.

**Answer: B.** `Object.create` creates an object with the specified prototype. It does not inspect and execute a `constructor` property. The default `instanceof` relationship can hold even when the constructor body never ran, so it does not establish initialization history.

## 6. The Constructor's `prototype` Property and Its Own Prototype

What does this program print?

```js
'use strict';

function Entry() {}
const entry = new Entry();

console.log(Object.getPrototypeOf(entry) === Entry.prototype);
console.log(Object.getPrototypeOf(Entry) === Function.prototype);
console.log(Object.hasOwn(entry, 'prototype'));

// Expected output (check after answering):
// true
// true
// false
```

- A. `true`, `false`, `true`: every instance owns a prototype property.
- B. `false`, `true`, `false`: constructor.prototype is unrelated to new instances.
- C. `true`, `false`, `false`: the constructor object itself inherits from Entry.prototype.
- D. `true`, `true`, `false`: the instance link and the constructor function's link are different relationships.

**Answer: D.** `Entry.prototype` is a property whose value is used as the new instance's prototype in this ordinary construction. `Entry` is also a function object with its own internal prototype link. `Object.getPrototypeOf` inspects that internal link; a property named `prototype` is not required on the instance.

## 7. Replacing a Constructor's Prototype Later

What does this program print?

```js
'use strict';

function Task() {}
const originalPrototype = Task.prototype;
const earlier = new Task();
Task.prototype = { kind: 'replacement' };
const later = new Task();

console.log(Object.getPrototypeOf(earlier) === originalPrototype);
console.log(earlier instanceof Task, later instanceof Task);

// Expected output (check after answering):
// true
// false true
```

- A. `false`, then `true true`, because replacing the property rewires all existing instances.
- B. `true`, then `true true`, because instanceof permanently remembers constructor history.
- C. `true`, then `false true`, because earlier keeps its old link while the default check uses the current Task.prototype.
- D. A `TypeError`, because ordinary function prototype properties can never be replaced.

**Answer: C.** Existing objects retain their internal prototype links. Future ordinary construction uses the replacement property value. The default `instanceof Task` check now searches for that replacement object in each instance's chain, so it no longer matches `earlier`.

## 8. `constructor` Is an Ordinary Property

What does this program print?

```js
'use strict';

function Record() {}
const record = new Record();
record.constructor = Array;
console.log(record.constructor === Array, record instanceof Record, Array.isArray(record));

// Expected output (check after answering):
// true true false
```

- A. `true true false`, because the own property changes without changing the record's prototype or array identity.
- B. `true false true`, because assigning constructor converts the object to a different type.
- C. `false true false`, because constructor is always read-only.
- D. A `TypeError`, because constructor is a reserved object property.

**Answer: A.** This assignment creates an ordinary own property. It does not rerun initialization, change the internal prototype, or add the internal characteristics of an array. Treat `value.constructor` as a conventional property, not a trustworthy type or provenance check.

## 9. Reading a Descriptor Without Evaluating Its Getter

What does this program print?

```js
'use strict';

let reads = 0;
const record = {
  get status() {
    reads += 1;
    return 'ready';
  }
};

const descriptor = Object.getOwnPropertyDescriptor(record, 'status');
console.log(typeof descriptor.get, reads);
console.log(record.status, reads);

// Expected output (check after answering):
// function 0
// ready 1
```

- A. `string 1`, then `ready 2`, because descriptors contain an eagerly evaluated accessor result.
- B. `undefined 0`, then `ready 0`, because getters never have function values.
- C. `function 1`, then `ready 2`, because descriptor lookup invokes the getter once.
- D. `function 0`, then `ready 1`, because descriptor lookup exposes the getter function without calling it.

**Answer: D.** For this ordinary object, descriptor lookup retrieves property metadata. Ordinary value access then invokes the getter. This conclusion is bounded: proxy descriptor queries can execute a trap, even though reading an ordinary accessor descriptor does not execute its getter body.

## 10. The Owner of a Getter Is Not Necessarily Its Receiver

What does this program print?

```js
'use strict';

const base = {
  get label() { return this.id; }
};
const record = Object.create(base);
record.id = 'child';

console.log(record.label);
console.log(Reflect.get(base, 'label', { id: 'supplied' }));

// Expected output (check after answering):
// child
// supplied
```

- A. Two `undefined` lines, because the getter is owned by base and base has no id.
- B. `child`, then `supplied`, because lookup location and accessor receiver are separate.
- C. Two `child` lines, because a getter binds permanently to the first object that reads it.
- D. `child`, then a `TypeError`, because Reflect.get cannot specify a receiver.

**Answer: B.** The normal property read preserves `record` as the receiver while searching `base`. `Reflect.get` allows a separate explicit receiver. In both cases, the getter's `this` refers to the receiver supplied for the read, not automatically to its owner.

## 11. An Inherited Setter Can Update an Own Backing Property

What does this program print?

```js
'use strict';

const base = {
  set label(value) { this.savedLabel = value; }
};
const record = Object.create(base);
record.label = 'draft';

console.log(record.savedLabel, Object.hasOwn(record, 'label'));
console.log(Object.hasOwn(base, 'savedLabel'));

// Expected output (check after answering):
// draft false
// false
```

- A. `undefined true`, then `false`, because assignment always creates an own data property with the assigned key.
- B. `draft true`, then `true`, because setter state is copied to both objects.
- C. `draft false`, then `false`, because the inherited setter runs with record as this and writes a different own property.
- D. A `TypeError`, because an inherited setter cannot modify its receiver.

**Answer: C.** Assignment finds the accessor descriptor and calls its setter with `record` as the receiver. The setter creates `record.savedLabel`; it does not create a data property named `label`. No `savedLabel` is created on `base`.

## 12. A Frozen Prototype Can Block Ordinary Shadowing Assignment

What does this program print?

```js
'use strict';

const defaults = Object.freeze({ format: 'pdf' });
const job = Object.create(defaults);

try {
  job.format = 'epub';
} catch (error) {
  console.log(error.name);
}
Object.defineProperty(job, 'format', { value: 'epub', enumerable: true });
console.log(job.format, defaults.format);

// Expected output (check after answering):
// TypeError
// epub pdf
```

- A. `TypeError`, then `epub pdf`: the inherited non-writable descriptor blocks ordinary assignment, but an own definition is allowed on this extensible child.
- B. No error, then `epub pdf`, because an inherited data property's writable flag never matters for assignment.
- C. Two `TypeError` failures, because freezing defaults freezes all children that later inherit from it.
- D. `TypeError`, then `epub epub`, because defineProperty edits whichever ancestor owns the property.

**Answer: A.** Freezing makes this own data property on `defaults` non-writable. Ordinary assignment respects that inherited descriptor and fails; strict mode reports the failure. `Object.defineProperty(job, ...)` directly defines an own property on the still-extensible child. It does not assign through the ancestor's descriptor. See [OrdinarySetWithOwnDescriptor](https://tc39.es/ecma262/multipage/ordinary-and-exotic-objects-behaviours.html#sec-ordinarysetwithowndescriptor).

## 13. Class Inheritance Creates Two Relevant Chains

What does this program print?

```js
'use strict';

class Document {
  describe() { return 'document'; }
  static category() { return 'text'; }
}
class Guide extends Document {}
const guide = new Guide();

console.log(Object.getPrototypeOf(Guide.prototype) === Document.prototype);
console.log(Object.getPrototypeOf(Guide) === Document);
console.log(guide.describe(), Guide.category());

// Expected output (check after answering):
// true
// true
// document text
```

- A. `true`, `false`, `document undefined`: extends supports instance methods but never static inheritance.
- B. `false`, `true`, `undefined text`: instance methods are copied rather than delegated.
- C. `true`, `true`, `text document`: static and instance properties exchange roles in subclasses.
- D. `true`, `true`, `document text`: the prototype objects and constructor objects participate in separate inheritance links.

**Answer: D.** Instance lookup reaches `Document.prototype` through `Guide.prototype`. Static lookup on the constructor `Guide` reaches the constructor `Document`. A manual assignment to `Guide.prototype` alone would not create both links. This is a preview of the class chapter; see [class definition evaluation](https://tc39.es/ecma262/multipage/ecmascript-language-functions-and-classes.html#sec-runtime-semantics-classdefinitionevaluation).

## 14. `super` Lookup Still Uses the Current Receiver

What does this program print?

```js
'use strict';

class Base {
  label() { return this.name; }
}
class Derived extends Base {
  label() { return `Guide: ${super.label()}`; }
}

console.log(Derived.prototype.label.call({ name: 'JavaScript' }));

// Expected output (check after answering):
// Guide: JavaScript
```

- A. `Guide: undefined`, because super forces this to Base.prototype.
- B. `Guide: JavaScript`, because super selects the inherited method while the supplied receiver remains this.
- C. A `TypeError`, because every class method call requires an actual instance even when no private fields are used.
- D. An infinite recursion, because super starts lookup at the supplied receiver's label property.

**Answer: B.** The derived method's home object determines where `super` lookup begins. The inherited method is then invoked with the current receiver, here the object supplied through `call`. `super` changes the lookup starting point rather than replacing `this` with the base prototype. Private fields and branded built-in methods have additional constraints, covered later.

## 15. `__proto__` as a Null-Prototype Dictionary Key

What does this program print?

```js
'use strict';

const dictionary = Object.create(null);
const payload = { label: 'stored data' };
dictionary['__proto__'] = payload;

console.log(Object.getPrototypeOf(dictionary) === null);
console.log(Object.hasOwn(dictionary, '__proto__'), dictionary.__proto__ === payload);
console.log(typeof dictionary.hasOwnProperty);

// Expected output (check after answering):
// true
// true true
// undefined
```

- A. `false`, `false false`, `function`: assignment invokes an inherited setter and changes the dictionary's prototype.
- B. A `TypeError`, because __proto__ is forbidden as a string key.
- C. `true`, `true true`, `undefined`: the key is ordinary data and the object inherits no hasOwnProperty method.
- D. `true`, `false true`, `function`: null-prototype objects inherit only safe Object.prototype methods.

**Answer: C.** The dictionary has no ancestor containing the legacy setter, so assignment creates an own data property. `Object.getPrototypeOf` reads the actual prototype link even when a property named `__proto__` exists. Use `Object.hasOwn` for membership because there is no inherited instance method to call.

## 16. A Prototype Chain Does Not Supply Built-In Internal State

What does this program print?

```js
'use strict';

const imitation = Object.create(Array.prototype);
console.log(imitation instanceof Array, Array.isArray(imitation));

// Expected output (check after answering):
// true false
```

- A. `true false`, because the default instanceof test sees the prototype link while Array.isArray checks whether the value is an array.
- B. `true true`, because inheriting from Array.prototype creates all array internals automatically.
- C. `false false`, because Object.create refuses built-in prototypes.
- D. A `TypeError`, because instanceof cannot inspect an object created without a constructor call.

**Answer: A.** This ordinary object has `Array.prototype` in its chain but is not an array exotic object. Prototype membership and built-in identity are different questions. Native `instanceof` can also involve custom `Symbol.hasInstance` behavior, so a hand-written chain walk should not be advertised as a complete polyfill. See the specification's [IsArray operation](https://tc39.es/ecma262/multipage/abstract-operations.html#sec-isarray).
