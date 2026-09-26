# Theory

## Delegation Through a Prototype

An ordinary JavaScript object has an internal `[[Prototype]]` that is another object or `null`. When a property read finds no own property with the requested key, lookup continues on that prototype. It repeats until a property is found or the chain ends.

This is **delegation**: a lookup can use a property stored elsewhere. Creating a descendant does not copy the prototype's properties into it. The connection remains live.

```js
'use strict';

const defaults = { region: 'ap-south', retries: 2 };
const worker = Object.create(defaults);
worker.id = 'worker-17';

console.log(worker.region);
console.log(Object.hasOwn(worker, 'region'));
console.log(Object.getPrototypeOf(worker) === defaults);
defaults.region = 'eu-west';
console.log(worker.region);
console.log(worker.missing);
// Expected output:
// ap-south
// false
// true
// eu-west
// undefined
```

The lookup for `id` ends on `worker`. The lookup for `region` reaches `defaults`. For `missing`, this example checks `worker`, `defaults`, and `Object.prototype` before reaching `null`. The missing property read returns `undefined`; an unresolvable ordinary identifier read instead throws `ReferenceError`.

An ordinary object has one direct prototype, while that prototype can itself inherit from another object. This does not give one object several direct parents. Use explicit composition when behavior depends on several collaborating services. [MDN: inheritance and the prototype chain](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Inheritance_and_the_prototype_chain).

## Ownership Is Different From Availability

A property can be available through lookup without being an own property. Pick an inspection operation that matches the question:

| Operation | What it asks or lists |
| --- | --- |
| `Object.hasOwn(obj, key)` | Does this object itself have the property? |
| `key in obj` | Does an own or inherited property with this key exist? |
| `Object.keys(obj)` | Own enumerable string keys |
| `Reflect.ownKeys(obj)` | All own string and symbol keys, including non-enumerable keys |
| `for (const key in obj)` | Enumerable string keys from the object and its chain, respecting shadowing |
| `Object.getOwnPropertyDescriptor(obj, key)` | The own property's descriptor, or `undefined` if absent |

These descriptions assume ordinary objects. Proxies can intercept many inspection operations. A descriptor is a record describing a property: for example, a data property's value and whether assignment, enumeration, and redefinition are allowed.

```js
'use strict';

const defaults = { region: 'ap-south' };
const worker = Object.create(defaults);
worker.id = 'worker-17';
worker.hasOwnProperty = false; // An ordinary data key can hide the old helper.
Object.defineProperty(worker, 'token', { value: 'local-token' });

console.log(Object.hasOwn(worker, 'region'), 'region' in worker);
console.log(Object.keys(worker).sort().join(','));
console.log(Reflect.ownKeys(worker).sort().join(','));

const visible = [];
for (const key in worker) visible.push(key);
console.log(visible.sort().join(','));
// Expected output:
// false true
// hasOwnProperty,id
// hasOwnProperty,id,token
// hasOwnProperty,id,region
```

`Object.hasOwn` works even when the object has a key named `hasOwnProperty` or has no prototype. A non-enumerable own property is still an own property. It also shadows a same-named inherited property during `for...in`, even though its own name is not emitted. Symbols are never emitted by `for...in`.

Do not use `obj.key !== undefined` as an ownership test. An existing property may contain `undefined`, and an inherited property may contain a perfectly usable value. [MDN: Object.hasOwn](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/hasOwn).

## Shadowing Stops at the First Property

An own property hides an inherited property with the same key. Lookup stops because a property exists, not because its value is truthy or defined.

```js
'use strict';

const defaults = { retries: 2 };
const worker = Object.create(defaults);

worker.retries = 0;
console.log(worker.retries, defaults.retries);
worker.retries = undefined;
console.log(Object.hasOwn(worker, 'retries'), worker.retries);
delete worker.retries;
console.log(Object.hasOwn(worker, 'retries'), worker.retries);
console.log(delete worker.retries, defaults.retries);
// Expected output:
// 0 2
// true undefined
// false 2
// true 2
```

The final deletion targets an absent own property and succeeds without deleting anything on `defaults`. Deletion does not search for a property to remove higher in the chain. Removing an own override can reveal inherited behavior, so deletion is not always equivalent to setting a value to `undefined`.

An own accessor without a getter, such as a setter-only accessor, also stops a read at that property and produces `undefined`. More generally, a found descriptor determines behavior; JavaScript does not keep searching for a more convenient value.

## Inherited Methods Keep the Call's Receiver

Prototype lookup finds a function. The subsequent invocation still uses the receiver rules from the previous chapter.

```js
'use strict';

const jobBehavior = {
  describe() { return `${this.id}: ${this.status}`; }
};
const job = Object.assign(Object.create(jobBehavior), {
  id: 'job-17', status: 'queued'
});

console.log(job.describe());
console.log(job.describe === jobBehavior.describe);
console.log(jobBehavior.describe.call({ id: 'job-18', status: 'running' }));
const detached = job.describe;
try {
  detached();
} catch (error) {
  console.log(error.name);
}
// Expected output:
// job-17: queued
// true
// job-18: running
// TypeError
```

`job.describe()` finds the method on `jobBehavior` but calls it with `job`. Inheriting the function does not bind it. The detached call loses the receiver just as an extracted own method would. `Object.assign` here copies a fixed, trusted record of initialization values; the [security section](10-performance-security.md) explains why arbitrary input needs a stricter boundary.

## Inherited Accessors Also Receive the Original Object

A **getter** is an accessor function invoked by a read. A **setter** is an accessor function invoked by a write. For an ordinary `obj.property` access, a getter or setter found on a prototype normally runs with `obj` as `this`.

```js
'use strict';

const progressBehavior = {
  get percent() { return this.completed / this.total * 100; },
  set percent(value) { this.completed = this.total * value / 100; }
};
const progress = Object.assign(Object.create(progressBehavior), {
  completed: 2, total: 8
});

console.log(progress.percent);
progress.percent = 50;
console.log(progress.completed);
console.log(Object.hasOwn(progress, 'percent'));
console.log(Object.hasOwn(progressBehavior, 'completed'));
// Expected output:
// 25
// 4
// false
// false
```

The setter writes `completed` on the receiver. It does not create an own `percent` property. Inputs are trusted small numbers in this demonstration; a production setter should validate its domain before changing state.

`Reflect.get(target, key, receiver)` makes the distinction explicit: lookup begins at `target`, while an accessor receives the separately supplied `receiver`. Ordinary access uses the same object initially for both roles. [ECMAScript: Reflect.get](https://tc39.es/ecma262/multipage/reflection.html#sec-reflect.get).

## Assignment Is Sensitive to Descriptors

For ordinary `child.key = value`, a writable inherited data property normally allows an own property to be created on an extensible child. The inherited property remains unchanged. However, an inherited setter can run, and an inherited non-writable data property or accessor without a setter can prevent assignment.

```js
'use strict';

const policy = {};
Object.defineProperty(policy, 'kind', {
  value: 'invoice', writable: false, enumerable: true, configurable: true
});
const record = Object.create(policy);

try {
  record.kind = 'refund';
} catch (error) {
  console.log(error.name);
}
console.log(Object.hasOwn(record, 'kind'), record.kind);

Object.defineProperty(record, 'kind', {
  value: 'refund', writable: true, enumerable: true, configurable: true
});
console.log(record.kind, policy.kind);
// Expected output:
// TypeError
// false invoice
// refund invoice
```

Explicitly defining an own property is a different operation from assignment. Here it is allowed because the child is extensible. It does not modify the inherited descriptor. This is one reason a frozen prototype is not a security boundary that makes every descendant immutable.

Strict assignment throws when an ordinary write is rejected. `Reflect.set` can expose a `false` result instead; exceptions from setters or traps still propagate. The assignment model has more cases than the shortcut "reads go up, writes stay local." [ECMAScript: OrdinarySetWithOwnDescriptor](https://tc39.es/ecma262/multipage/ordinary-and-exotic-objects-behaviours.html#sec-ordinarysetwithowndescriptor).

## `Object.create` Chooses a Link, Not an Initialization Routine

`Object.create(proto)` creates an object with the selected prototype. It does not invoke a constructor found on that prototype. Its optional second argument describes new own properties using descriptors.

```js
'use strict';

let constructions = 0;
function Job(id) {
  constructions += 1;
  this.id = id;
}

const shell = Object.create(Job.prototype);
const defined = Object.create(Job.prototype, {
  id: { value: 'job-17', enumerable: true }
});

console.log(constructions);
console.log(Object.hasOwn(shell, 'id'));
console.log(defined.id, Object.keys(defined).join(','));
try {
  defined.id = 'job-18';
} catch (error) {
  console.log(error.name);
}
// Expected output:
// 0
// false
// job-17 id
// TypeError
```

Omitted descriptor flags default to `false`, so `defined.id` is non-writable and non-configurable. A factory can use this API to establish an object deliberately, but creating a shell with a familiar prototype does not satisfy a constructor's invariants or initialize private fields.

## `[[Prototype]]` and `.prototype` Are Different Relationships

`Object.getPrototypeOf(value)` inspects the value's internal inheritance link. `Constructor.prototype` reads an ordinary property used during suitable construction operations. The names look similar because construction connects them.

```js
'use strict';

function Job(id) { this.id = id; }
Job.prototype.describe = function () { return this.id; };

const job = new Job('job-17');
console.log(Object.getPrototypeOf(job) === Job.prototype);
console.log(Object.getPrototypeOf(Job) === Function.prototype);
console.log(Object.getPrototypeOf(Job.prototype) === Object.prototype);
console.log(Object.getPrototypeOf(Object.prototype) === null);
console.log(Object.hasOwn(job, 'prototype'));
console.log(job.constructor === Job);
// Expected output:
// true
// true
// true
// true
// false
// true
```

The last result normally comes from the default `constructor` property on `Job.prototype`. That property is not an immutable record of how an object was created. It can be replaced, shadowed, or absent. Construction uses the requested constructor and its construction rules, not an instance's later `constructor` lookup.

Do not generalize the own `.prototype` property to every callable or constructible function. Arrows and concise methods are not constructors, and native bound functions can be constructible without an own `.prototype` property, as Chapter 2 demonstrated.

## What `new` Adds for an Ordinary Base Constructor

For a direct call such as `new Job('job-17')` using an ordinary base constructor, a useful trace is:

1. Obtain the prototype to use from the constructor's `.prototype` value. If that value is not an object, use the appropriate default object prototype from the constructor's realm.
2. Allocate the instance with that internal prototype link.
3. Execute the constructor with the instance as `this` and the supplied arguments.
4. Return an explicitly returned object if there is one; otherwise return the initialized instance.

Returning a primitive does not replace the instance for this kind of constructor. Derived class constructors and custom `Reflect.construct` targets have additional rules, so the trace is not a complete reimplementation of `new`. [MDN: new](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/new).

```js
'use strict';

function ReturnedRecord() {
  this.unused = true;
  return { id: 'replacement' };
}
const record = new ReturnedRecord();
console.log(record.id);
console.log(Object.hasOwn(record, 'unused'));
console.log(record instanceof ReturnedRecord);
// Expected output:
// replacement
// false
// false
```

The explicit object is returned as supplied. It is not automatically linked to `ReturnedRecord.prototype`.

## Prototype Mutation and Prototype Replacement

Changing a shared prototype object can affect existing descendants. Replacing a constructor's `.prototype` property selects a different object for later ordinary constructions, leaving existing objects linked to their earlier prototype.

```js
'use strict';

function Job(id) { this.id = id; }
Job.prototype.describe = function () { return `old:${this.id}`; };
const first = new Job('job-17');
const originalPrototype = Job.prototype;

Job.prototype = {
  describe() { return `new:${this.id}`; }
};
const second = new Job('job-18');

console.log(first.describe(), second.describe());
console.log(Object.getPrototypeOf(first) === originalPrototype);
console.log(first instanceof Job, second instanceof Job);
console.log(second.constructor === Object);
// Expected output:
// old:job-17 new:job-18
// true
// false true
// true
```

The replacement object inherits `Object.prototype.constructor`; it did not receive a special link back to `Job`. Restoring a `constructor` property can improve conventional introspection, but does not reconnect older instances. Prefer building the intended prototype before creating instances, then treating shared behavior as stable unless live changes are an explicit part of the API.

## `instanceof` Tests a Relationship, Not Complete Validity

For an ordinary function using the default instance check, `value instanceof Constructor` looks for the constructor's current `.prototype` object in the value's chain. That can be useful, but it does not prove the constructor ran or that required state is present.

```js
'use strict';

function Job(id) { this.id = id; }
const shell = Object.create(Job.prototype);

console.log(shell instanceof Job);
console.log(Object.hasOwn(shell, 'id'));
console.log(Job.prototype.isPrototypeOf(shell));
// Expected output:
// true
// false
// true
```

Custom `Symbol.hasInstance` methods and bound functions can change the path through the instance-checking machinery. Objects from another realm use that realm's built-ins, so an array can fail `instanceof Array` in the current realm while passing `Array.isArray`. Use the check matching the actual contract, and validate external records explicitly. [MDN: instanceof](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/instanceof).

## Shared Methods, Separate Mutable State

A method can be shared because its call receives an instance. An array placed on a shared prototype is also shared, often unintentionally.

```js
'use strict';

const queueBehavior = {
  add(id) { this.jobs.push(id); }
};

function createQueue() {
  const queue = Object.create(queueBehavior);
  queue.jobs = [];
  return queue;
}

const urgent = createQueue();
const routine = createQueue();
urgent.add('job-17');

console.log(urgent.add === routine.add);
console.log(urgent.jobs === routine.jobs);
console.log(urgent.jobs.join(','), routine.jobs.length);
// Expected output:
// true
// false
// job-17 0
```

The factory allocates the array for each invocation. If `jobs: []` were stored on `queueBehavior` instead, `this.jobs.push(id)` would read and mutate that shared array. It would not assign `this.jobs`, so no own array would be created automatically.

This example exposes its array and accepts trusted IDs. The [production example](04-production-examples.md) documents state ownership, initialization, and validation more carefully. Public mutable state and private encapsulation are separate design decisions from method sharing.

## Class Inheritance Establishes Two Chains

`class Child extends Parent` connects instance behavior through `Child.prototype` and connects the constructor objects themselves for inherited static members.

```js
'use strict';

class Job {
  constructor(id) { this.id = id; }
  describe() { return this.id; }
  static category() { return 'background'; }
}

class TimedJob extends Job {
  constructor(id, delay) {
    super(id);
    this.delay = delay;
  }
  describe() { return `${super.describe()} after ${this.delay}`; }
}

const job = new TimedJob('job-17', 5);
console.log(job.describe());
console.log(Object.getPrototypeOf(job) === TimedJob.prototype);
console.log(Object.getPrototypeOf(TimedJob.prototype) === Job.prototype);
console.log(Object.getPrototypeOf(TimedJob) === Job);
console.log(TimedJob.category());
console.log(Object.hasOwn(TimedJob.prototype, 'describe'));
// Expected output:
// job-17 after 5
// true
// true
// true
// background
// true
```

The override is found before the inherited method. Within it, `super.describe()` begins lookup from the prototype of the method's home object while preserving the current `this`. It does not create a separate parent instance. `super(id)` in the derived constructor performs parent construction so initialization can complete before that constructor uses `this`.

Class methods have non-enumerable property definitions. Methods added by simple assignment to a constructor prototype are enumerable unless defined otherwise. Both can participate in the prototype chain, but class syntax has additional semantics beyond abbreviating assignment. The next chapter examines those semantics in detail.

## Null-Prototype Dictionaries

Some objects represent arbitrary keys, not a behavioral instance. `Object.create(null)` gives such a dictionary no inherited `toString`, `constructor`, or legacy `__proto__` accessor.

```js
'use strict';

const counts = Object.create(null);
counts['__proto__'] = 2;
counts.constructor = 3;

console.log(Object.getPrototypeOf(counts) === null);
console.log(Object.hasOwn(counts, '__proto__'), counts['__proto__']);
console.log(counts.constructor);
console.log('toString' in counts);
// Expected output:
// true
// true 2
// 3
// false
```

The bracket assignment writes a normal own data property. A null-prototype object is still an object; it simply has no inherited fallback. Use `Object.hasOwn` and appropriate serialization APIs rather than assuming instance helpers exist. A `Map` is another useful choice, especially for arbitrary key types and explicit collection operations.

Null-prototype storage is not a universal sanitization step. Copying its keys into another kind of target can introduce different behavior, and nested data still needs its own validation. The [safe options example](04-production-examples.md) uses a fixed schema instead of an unrestricted merge.

## Choose the Prototype During Creation

Use `Object.create` or class/constructor setup to establish intended relationships. `Object.setPrototypeOf` can change a local object's chain later, but that changes future lookup behavior and can disrupt engine assumptions. Ordinary prototype changes reject cycles and disallowed changes to non-extensible objects. Reapplying an existing link is a separate case from changing it.

Prefer `Object.getPrototypeOf` over the legacy `obj.__proto__` accessor for inspection. A data property can hide that accessor, and null-prototype objects do not inherit it. Object-literal prototype-setting syntax also has special rules and should not be confused with a data property parsed from JSON. See [MDN: Object.setPrototypeOf](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/setPrototypeOf).

## Inheritance or Composition?

Use inheritance when a stable relationship and shared interface let callers use specialized objects without surprising changes to behavior. Use composition when responsibilities should be replaceable independently: a job can hold a retry policy and a logger without inheriting from either.

A shared prototype is a mechanism, not proof of a good abstraction. Before adding a level to a hierarchy, specify which operations the child supports, which invariants callers may assume, and where mutable state lives. An object that shares a prototype but violates those expectations is not safely substitutable just because `instanceof` returns `true`.

Continue with [Internal Working](03-internal-working.md) to trace a lookup and connect prototype relationships to construction and memory.
