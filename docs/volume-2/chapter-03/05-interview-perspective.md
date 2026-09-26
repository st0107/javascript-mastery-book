# Interview Perspective

A strong inheritance answer separates three questions: where a property is found, which object is the receiver, and where a function resolves its lexical identifiers. Draw different links for those relationships. Otherwise, a correct prediction for one example can turn into the wrong general rule.

Every snippet here is independent and uses strict mode. Run it in Node.js 20 or later.

## 1. Which Object Supplies an Inherited Method's `this`?

**Question:** A method is found on a prototype. Does it use the prototype as its receiver?

```js
'use strict';

const region = 'ap-south';
const reporter = {
  region: 'prototype-region',
  describe() { return `${region}:${this.region}`; }
};
const worker = Object.create(reporter);
worker.region = 'eu-west';

console.log(worker.describe());
console.log(Object.hasOwn(worker, 'describe'));
console.log(worker.describe === reporter.describe);

// Expected output:
// ap-south:eu-west
// false
// true
```

**Answer:** Property lookup finds `describe` on `reporter`, while `worker.describe()` supplies `worker` as the receiver. The bare identifier `region` resolves through the function's lexical environment. `this.region` performs a property lookup on the receiver. The two values therefore come from different mechanisms.

**Follow-up:** What if you copy the method into a variable and call it? Its lexical environment remains the same. Its property-call receiver is lost; in this strict function, the plain call's `this` is `undefined`, and reading `this.region` throws.

**Follow-up:** Does inheritance copy the method into each instance? No. Both property reads above return the same function. The property is stored on the shared prototype until an instance deliberately defines an override.

## 2. Are `[[Prototype]]` and `.prototype` the Same Thing?

**Question:** How do an instance, a constructor function, and its `prototype` property relate?

```js
'use strict';

function Job(id) { this.id = id; }
Job.prototype.describe = function () { return `job:${this.id}`; };

const job = new Job(7);
console.log(Object.getPrototypeOf(job) === Job.prototype);
console.log(Object.getPrototypeOf(Job) === Function.prototype);
console.log(Object.hasOwn(job, 'prototype'));
console.log(job.describe());

// Expected output:
// true
// true
// false
// job:7
```

**Answer:** `[[Prototype]]` is the internal relationship followed by ordinary property lookup. `Object.getPrototypeOf` exposes the linked value. The constructor's `.prototype` is a regular property whose value is used when ordinary construction chooses the new instance's prototype.

**Follow-up:** Does every function have a `.prototype` object? No. Arrows and concise methods do not have the ordinary constructor-function prototype property. A native bound function can be constructable without having its own `prototype` property. Avoid making that property an all-purpose test for whether `new` is valid.

**Follow-up:** Does replacing `Job.prototype` update objects already created? No. Existing instances retain their links to the previous object. New ordinary instances use the replacement. The [debugging section](09-edge-cases-debugging.md#replacing-a-constructor-prototype-splits-old-and-new-instances) demonstrates the consequences.

## 3. Is an Own `undefined` Property Absent?

**Question:** Why does setting a property to `undefined` behave differently from deleting it?

```js
'use strict';

const defaults = { retries: 3 };
const request = Object.create(defaults);
request.retries = undefined;

console.log(request.retries);
console.log(Object.hasOwn(request, 'retries'), 'retries' in request);
delete request.retries;
console.log(request.retries);
console.log(Object.hasOwn(request, 'retries'), 'retries' in request);

// Expected output:
// undefined
// true true
// 3
// false true
```

**Answer:** Lookup stops when it finds the own property, even when its value is `undefined`. Deleting that configurable own property reveals the inherited value. The `in` operator includes inherited properties; `Object.hasOwn` answers the narrower ownership question.

**Follow-up:** Does `request.retries ?? 3` test ownership? No. It tests the value for `null` or `undefined`, regardless of where that value came from. Define whether your configuration contract distinguishes a missing field, a present `undefined`, and an explicit value before choosing a defaulting expression.

**Follow-up:** Does `delete request.retries` delete the property on `defaults` when no own property exists? No. Ordinary deletion operates on the object named by the reference. It does not walk the chain looking for a property to remove.

## 4. Does `Object.create` Run a Constructor?

**Question:** Can you create a fully initialized instance just by selecting its prototype?

```js
'use strict';

let initializations = 0;
function Session(id) {
  initializations += 1;
  this.id = id;
}

const initialized = new Session('S-1');
const linkedOnly = Object.create(Session.prototype);
console.log(initializations);
console.log(initialized.id, Object.hasOwn(linkedOnly, 'id'));
console.log(linkedOnly instanceof Session);

// Expected output:
// 1
// S-1 false
// true
```

**Answer:** `Object.create` establishes a prototype link and can define supplied own-property descriptors. It does not call `Session`. Here the default `instanceof` check succeeds even though the constructor never initialized the object.

**Follow-up:** What about private fields or a native object's internal state? A prototype link does not create either. `Object.create(Map.prototype)` is not a working map, and linking to a class prototype does not install the class's private elements. Use the intended constructor or factory when those invariants matter.

## 5. How Reliable Are `constructor` and `instanceof`?

**Answer:** `constructor` is usually an inherited, writable property, not an authenticated record of creation. The ordinary `instanceof` algorithm tests whether the constructor's current prototype occurs in the left operand's chain. It does not verify constructor execution or required application fields.

The operator can also invoke custom `Symbol.hasInstance` behavior. Across realms, the same built-in kind can have a different constructor and prototype identity: an array created in another realm may fail `value instanceof Array` in this one. Use `Array.isArray` for the array brand; validate a domain record's schema for its data contract. See [ECMAScript: OrdinaryHasInstance](https://tc39.es/ecma262/multipage/abstract-operations.html#sec-ordinaryhasinstance) and [Array.isArray](https://tc39.es/ecma262/multipage/indexed-collections.html#sec-array.isarray).

**Follow-up:** Is a schema validator an authorization check? No. A correctly shaped account record can still belong to another user. Data validation, construction invariants, and permission checks answer different questions.

## 6. What Should Be Shared, and What Should Be Per Instance?

**Answer:** Shared methods are often appropriate on a prototype. Mutable state that belongs to one job, session, or request should normally be created for that instance. Putting an array on a prototype shares that array with every descendant that has not shadowed it.

**Follow-up:** Why does `first.items.push(value)` differ from `first.items = []`? The first expression reads an array through the chain, then mutates that array. The second expression performs an assignment to `first`, which can create an own property if the relevant descriptors and extensibility permit it. Neither behavior requires copying the prototype.

**Follow-up:** Is inheritance always the right reuse mechanism? No. A collaborator passed as an argument or property can express interchangeable behavior without a parent-child object relationship. Choose inheritance when the lookup and override contract is useful, and composition when an explicit dependency is easier to reason about.

## An Answer Checklist

- Draw the objects and their prototype links; keep constructor properties separate.
- Find the first matching property descriptor before explaining a read or write.
- Identify the receiver separately from the object holding a method or accessor.
- Distinguish an absent property from an own property whose value is `undefined`.
- Identify whether a change mutates a shared object, creates an own property, or replaces a link.
- State which initialization and validation steps actually ran.
- Explain what changes across two instances, a prototype replacement, or a realm boundary.
