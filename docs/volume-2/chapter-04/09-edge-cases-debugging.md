# Edge Cases, Debugging, and Failure Modes

Class failures often come from correct operations performed at the wrong initialization phase, or from confusing a private element with an ordinary property. Trace when the object becomes usable before changing its inheritance structure. Every snippet is an independent strict-mode program for Node.js 20 or later.

## Overrides Can Run Before Derived State Exists

```js
'use strict';

class BaseJob {
  constructor() { this.inspect(); }
  inspect() { return 'base'; }
}
class PublicJob extends BaseJob {
  status = 'ready';
  inspect() { console.log(this.status); }
}
class PrivateJob extends BaseJob {
  #status = 'ready';
  inspect() { return this.#status; }
}

const job = new PublicJob();
console.log(job.status);
try {
  new PrivateJob();
} catch (error) {
  console.log(error.name);
}

// Expected output:
// undefined
// ready
// TypeError
```

The instance already has the derived prototype, so the base constructor's property call reaches the override. The derived instance fields have not been initialized yet. Reading the absent public property yields `undefined`; reading the absent private element throws.

Prefer establishing the base's invariants without dispatching to overrides. A factory can invoke a documented setup operation after construction completes, provided it handles setup failure and does not expose a partially ready object. Also avoid registering `this` with a service from an early constructor phase if that service can call it immediately.

## A Derived Field Can Overwrite Work Done by the Base

```js
'use strict';

class BaseRecord {
  constructor() { this.label = 'assigned by base'; }
}
class DerivedRecord extends BaseRecord {
  label;
  constructor() {
    super();
    console.log(this.label);
  }
}

const record = new DerivedRecord();
console.log(Object.hasOwn(record, 'label'));

// Expected output:
// undefined
// true
```

An uninitialized-looking field declaration still defines a field, with the value `undefined`. The derived field is installed after the base's assignment and before the next derived constructor statement. Removing the declaration or giving one phase clear ownership of `label` fixes the conflicting initialization plan; adding another assignment elsewhere can conceal it.

## Public Field Definition Does Not Invoke an Inherited Setter

```js
'use strict';

const writes = [];
class BaseOptions {
  set mode(value) { writes.push(value); }
}
class FieldOptions extends BaseOptions {
  mode = 'field';
}
class AssignedOptions extends BaseOptions {
  constructor() {
    super();
    this.mode = 'assignment';
  }
}

const field = new FieldOptions();
const assigned = new AssignedOptions();
console.log(field.mode, Object.hasOwn(field, 'mode'));
console.log(Object.hasOwn(assigned, 'mode'));
console.log(writes.join(','));

// Expected output:
// field true
// false
// assignment
```

Field initialization creates an own data property. Ordinary assignment follows the setter-sensitive rules from Chapter 3. Moving an assignment into a field declaration can therefore bypass inherited validation or side effects. Keep validation explicit at the owning boundary instead of assuming both forms invoke the same setter. See [ECMAScript: DefineField](https://tc39.es/ecma262/multipage/abstract-operations.html#sec-definefield).

## Private Fields Initialize in Declaration Order

```js
'use strict';

class PublicOrder {
  first = this.second;
  second = 2;
}
class PrivateOrder {
  #first = this.#second;
  #second = 2;
}

const publicOrder = new PublicOrder();
console.log(publicOrder.first, publicOrder.second);
try {
  new PrivateOrder();
} catch (error) {
  console.log(error.name);
}

// Expected output:
// undefined 2
// TypeError
```

The private name is valid within the class's lexical scope, but its element has not yet been added to this object when the earlier initializer reads it. This is a runtime initialization failure, distinct from a syntax error for referring to an undeclared private name.

Place dependencies before the fields that read them, or compute dependent state explicitly after the required inputs exist. A method called by an initializer can hide the same ordering dependency, so inspect what it reads too. [ECMAScript: InitializeInstanceElements](https://tc39.es/ecma262/multipage/abstract-operations.html#sec-initializeinstanceelements) defines the installation sequence.

## Detachment and a Default Proxy Can Break Private Access

```js
'use strict';

class Counter {
  #value = 7;
  read() { return this.#value; }
}

const counter = new Counter();
const detached = counter.read;
const proxy = new Proxy(counter, {});
for (const invoke of [() => detached(), () => proxy.read()]) {
  try {
    invoke();
  } catch (error) {
    console.log(error.name);
  }
}
console.log(detached.call(counter));

// Expected output:
// TypeError
// TypeError
// 7
```

The detached call supplies `undefined`. The proxy property call supplies the proxy object, which does not carry the target's private element. Both reach the same method, but neither supplies the required receiver. Explicitly invoking the method with the real instance works.

A wrapper can deliberately expose operations bound to the target, but that changes receiver and identity behavior and may expose capabilities the wrapper intended to restrict. Do not make a blanket "bind every property" proxy repair without defining that contract. Proxies receive fuller treatment in the next chapter.

## An Inherited Static Method Does Not Inherit a Static Private Element

```js
'use strict';

class Limits {
  static #maximum = 5;
  static readDynamic() { return this.#maximum; }
  static readBase() { return Limits.#maximum; }
}
class SpecialLimits extends Limits {}

console.log(Limits.readDynamic());
try {
  SpecialLimits.readDynamic();
} catch (error) {
  console.log(error.name);
}
console.log(SpecialLimits.readBase());

// Expected output:
// 5
// TypeError
// 5
```

The inherited method call supplies `SpecialLimits` as its receiver, but the private static element belongs to `Limits`. If the state is intentionally owned by the declaring class, name that class in the operation. If every subclass needs separate state, design and initialize that state explicitly; private static declarations do not automatically create a copy on each subclass.

## Constructor Return Rules Can Replace the Expected Instance

```js
'use strict';

class BaseReplacement {
  initialized = true;
  constructor() { return { kind: 'replacement' }; }
}
class Parent {}
class DerivedReplacement extends Parent {
  initialized = true;
  constructor() { return { kind: 'derived replacement' }; }
}
class InvalidReturn extends Parent {
  constructor() {
    super();
    return 3;
  }
}

const base = new BaseReplacement();
const derived = new DerivedReplacement();
console.log(base.kind, Object.hasOwn(base, 'initialized'));
console.log(derived.kind, derived instanceof DerivedReplacement);
console.log(Object.hasOwn(derived, 'initialized'));
try {
  new InvalidReturn();
} catch (error) {
  console.log(error.name);
}

// Expected output:
// replacement false
// derived replacement false
// false
// TypeError
```

The base's field initialized on its initial instance, but the constructor returned another object. The derived constructor returned an object without calling `super()`, so its instance fields were never installed. Returning an object is permitted in both examples and does not automatically attach the expected prototype or state to that result.

A base constructor ignores a returned primitive. A derived constructor rejects a returned non-object other than `undefined`. Returning `undefined` or reaching the end of a derived constructor still requires an initialized `this`; without successful `super()`, retrieving that value throws. These rules are specified by [ECMAScript: constructor execution](https://tc39.es/ecma262/multipage/ordinary-and-exotic-objects-behaviours.html#sec-ecmascript-function-objects-construct-argumentslist-newtarget).

Use a named factory for deliberately selecting a different result object. Constructor replacement is a language feature to recognize during debugging, not a requirement for flexible object creation.

## Debugging Playbook

1. Separate class evaluation, base instance initialization, base constructor execution, derived initialization, and later method calls.
2. Identify the first read of missing or unexpected state, including reads inside overridden methods and field initializers.
3. Check whether a property is an own field, a prototype method, a static member, or a private element.
4. Compare the actual receiver with the instance or constructor that owns the required private element.
5. Look for duplicate field declarations across the hierarchy and assignments replaced by field definitions.
6. Check any explicit constructor return and whether callers received the object they expected.
7. Test two instances, construction failure, detached calls, and any subclass that overrides a lifecycle operation.

Do not add public mirrors of private fields merely to silence receiver or initialization errors. That creates another state source without fixing the original contract.
