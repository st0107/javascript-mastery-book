# Edge Cases, Debugging, and Failure Modes

Begin an inheritance investigation with the actual objects and their descriptors. Logging only the final value can hide whether it came from an own property, an inherited property, or a getter. These snippets run independently in strict Node.js 20-or-later CommonJS files.

## Mutating an Inherited Array Changes Shared State

```js
'use strict';

const queueBehavior = {
  jobs: [],
  enqueue(id) { this.jobs.push(id); }
};
const first = Object.create(queueBehavior);
const second = Object.create(queueBehavior);

first.enqueue('A');
console.log(second.jobs.join(','));
console.log(first.jobs === second.jobs);
first.jobs = [];
first.enqueue('B');
console.log(first.jobs.join(','), second.jobs.join(','));
console.log(Object.hasOwn(first, 'jobs'), Object.hasOwn(second, 'jobs'));

// Expected output:
// A
// true
// B A
// true false
```

Initially both reads reach the same array on `queueBehavior`. `push` mutates that array; it does not assign a `jobs` property to either queue. The later assignment creates an own array on `first`, while `second` still inherits the original array.

If each queue owns its jobs, initialize a fresh array for each queue in the factory or constructor. Test two queues and compare array identity as well as output. A single-instance test cannot expose this ownership error. Freezing the outer behavior object alone does not freeze the array stored inside it.

## Frozen Inherited Data Can Block an Own Assignment

```js
'use strict';

const defaults = Object.freeze({ timeout: 10 });
const request = Object.create(defaults);
try {
  request.timeout = 20;
} catch (error) {
  console.log(error.name);
}
console.log(request.timeout, Object.hasOwn(request, 'timeout'));

Object.defineProperty(request, 'timeout', {
  value: 20, writable: true, enumerable: true, configurable: true
});
console.log(request.timeout, defaults.timeout);

// Expected output:
// TypeError
// 10 false
// 20 10
```

Ordinary assignment encounters the inherited non-writable data descriptor and fails before creating an own property. Strict mode turns that failed assignment into a `TypeError`. The extensible child can still define a new own property explicitly; that operation does not change the frozen parent.

This distinction matters when using frozen defaults as a prototype. "Every assignment creates an override" is too broad. An inherited accessor without a setter also blocks ordinary assignment. Inspect the descriptor found along the chain before diagnosing a frozen child or a missing setter. The rules are defined by [ECMAScript: OrdinarySetWithOwnDescriptor](https://tc39.es/ecma262/multipage/ordinary-and-exotic-objects-behaviours.html#sec-ordinarysetwithowndescriptor).

## A Frozen Child Can Still Invoke an Inherited Setter

```js
'use strict';

const notifications = [];
const behavior = {
  set status(value) {
    notifications.push(`${this.id}:${value}`);
  }
};
const task = Object.create(behavior);
task.id = 'T-7';
Object.freeze(task);

task.status = 'ready';
console.log(notifications.join(','));
console.log(Object.hasOwn(task, 'status'));
console.log(Object.isFrozen(task));

// Expected output:
// T-7:ready
// false
// true
```

The inherited setter runs with `task` as its receiver and mutates a separate array. It does not add or rewrite an own property on the frozen task. Freezing an object constrains its own properties and extensibility; it does not disable every operation reachable through it or recursively freeze external state.

An inherited getter can likewise change behavior if it reads mutable state elsewhere. When a supposedly stable value changes, inspect both the descriptor and the state its accessor uses.

## Replacing a Constructor Prototype Splits Old and New Instances

```js
'use strict';

function Record(id) { this.id = id; }
Record.prototype.version = 1;
const earlier = new Record('old');
const previousPrototype = Record.prototype;

Record.prototype = { version: 2 };
const later = new Record('new');

console.log(earlier.version, later.version);
console.log(Object.getPrototypeOf(earlier) === previousPrototype);
console.log(earlier instanceof Record, later instanceof Record);
console.log(earlier.constructor === Record, later.constructor === Record);

// Expected output:
// 1 2
// true
// false true
// true false
```

The existing object keeps its old prototype. The default `instanceof` check uses the constructor's current `.prototype`, so it no longer recognizes `earlier`. Meanwhile, `earlier.constructor` still resolves to `Record` through the old prototype. The replacement object inherits `Object.prototype.constructor`, which explains `later.constructor`.

Assigning a `constructor` property to the replacement would change that property lookup, but would not reconnect old instances. For ordinary function constructors, distinguish editing the existing prototype object from replacing the constructor's reference to it. Class constructors have a non-writable `prototype` property, so this replacement example uses a function declaration deliberately.

## Matching a Prototype Does Not Install Private State

```js
'use strict';

class Session {
  #id;
  constructor(id) { this.#id = id; }
  read() { return this.#id; }
}

const real = new Session('S-9');
const linkedOnly = Object.create(Session.prototype);
console.log(linkedOnly instanceof Session);
console.log(real.read());
try {
  linkedOnly.read();
} catch (error) {
  console.log(error.name);
}

// Expected output:
// true
// S-9
// TypeError
```

The method is found, but its receiver lacks the private element installed during real instance initialization. Finding a method and satisfying that method's receiver requirements are separate checks. Similarly, prototype surgery cannot turn a plain object into a functioning native `Map`.

This is a limited preview of class initialization. The next chapter covers classes in depth; the lesson here is that prototype membership alone does not establish an object's invariants.

## An Array From Another Realm Has Another Prototype

```js
'use strict';

const vm = require('node:vm');
const foreignArray = vm.runInNewContext('[1, 2]');

console.log(foreignArray instanceof Array);
console.log(Array.isArray(foreignArray));
console.log(Object.getPrototypeOf(foreignArray) === Array.prototype);

// Expected output:
// false
// true
// false
```

The new realm has its own built-ins and prototype objects. The local `Array.prototype` is absent from the foreign array's chain, while `Array.isArray` still recognizes the array brand. This example uses a fixed expression solely to create another realm; it does not need user-supplied source.

Use the check that matches your requirement. `Array.isArray` is appropriate for arrays; a custom data-transfer object needs checks for permitted own fields and their values. Do not accept an object as a valid business record merely because its constructor name matches a familiar string. See [Node.js: vm contexts](https://nodejs.org/api/vm.html#what-does-it-mean-to-contextify-an-object).

## Copying a Method Does Not Relocate Its `super` Lookup

```js
'use strict';

const base = { describe() { return `base:${this.id}`; } };
const template = {
  __proto__: base,
  describe() { return super.describe(); }
};
const alternate = { describe() { return `alternate:${this.id}`; } };
const borrower = Object.create(alternate);
borrower.id = 'B-1';
borrower.describe = template.describe;

console.log(borrower.describe());
console.log(Object.getPrototypeOf(borrower) === alternate);

// Expected output:
// base:B-1
// true
```

The method's `super` lookup starts from the prototype of its original home object, `template`. The receiver remains `borrower`, so `base.describe` reads the borrower's ID. Copying the method does not rewrite its home object. The `__proto__: base` entry here is object-literal syntax selecting a local prototype; it does not mutate any built-in prototype.

Class methods use the same home-object principle for `super` property access. `super()` in a derived constructor is a separate construction operation, covered next chapter. Avoid teaching either operation as merely "look at `this`'s parent." See [ECMAScript: MakeSuperPropertyReference](https://tc39.es/ecma262/multipage/ecmascript-language-expressions.html#sec-makesuperpropertyreference).

## Debugging Playbook

1. Record the failing operation: property read, call, assignment, definition, deletion, or membership check.
2. Check `Object.hasOwn` on the starting object. Inspect its own descriptor with `Object.getOwnPropertyDescriptor`.
3. Follow `Object.getPrototypeOf` until the first relevant descriptor or `null`. Keep the original receiver labeled separately.
4. Identify whether the descriptor is writable data, an accessor with a setter, or a read-only constraint.
5. For mutable values, compare references across two instances and their prototype.
6. Verify initialization: identify the constructor or factory that actually ran, rather than relying on `constructor` or `instanceof` alone.
7. Check for prototype replacement, deletion revealing a default, realm differences, or a copied method using `super`.
8. Assert the intended ownership and behavior before changing the implementation.

These steps describe ordinary objects. Proxies can intercept reflective operations and access, so inspect the proxy's documented behavior when one is involved; a reflective diagnostic is not a guarantee that arbitrary objects are inert data.
