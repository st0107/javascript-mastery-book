# Theory

## 1. A Class Defines Construction and Behavior

A class produces a constructor function and a prototype object. Ordinary instance methods live on that prototype. Class bodies also have semantics that cannot be captured by saying that classes are only prettier constructor functions: strict execution, a lexical declaration binding, required construction through `new`, and dedicated field and private-element initialization rules. See [MDN's class reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes).

```js
try {
  console.log(typeof Ticket);
} catch (error) {
  console.log(error.name);
}

class Ticket {
  receiver() { return this; }
}

try {
  Ticket();
} catch (error) {
  console.log(error.name);
}
const detached = new Ticket().receiver;
console.log(detached() === undefined);
console.log(typeof Ticket);
// Expected output:
// ReferenceError
// TypeError
// true
// function
```

The declaration's binding exists before its evaluation but is uninitialized. Even `typeof` cannot read it during that temporal dead zone. The detached method executes in strict mode even though this program has no strict directive. A method's class origin does not bind its receiver.

A class expression is a value too: a factory can return a class or assign one to a variable. Re-evaluating an expression creates a new constructor, prototype, and set of private names. Keep a class definition outside a frequently called factory unless a fresh type is intentional.

## 2. Locate Each Kind of Member

| Declaration | Location or association | When its value is established |
| --- | --- | --- |
| `method() {}` | Public property on the prototype | Class definition |
| `get value() {}` | Accessor on the prototype | Class definition |
| `value = expression` | Own public property on each instance | Instance initialization |
| `callback = () => expression` | Own property containing an arrow function | Instance initialization |
| `static method() {}` | Public property on the constructor | Class definition |
| `static value = expression` | Own public property on the constructor | Static initialization |
| `#value = expression` | Private element associated with an instance | Instance initialization |
| `static #value = expression` | Private element associated with the constructor | Static initialization |

Public methods and accessors defined by a class are non-enumerable. Public fields are ordinary writable, enumerable, configurable own properties. Private elements are outside ordinary string/symbol property enumeration and descriptor APIs. These differences are useful when predicting inspection and serialization. See [public fields](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Public_class_fields) and [private elements](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_elements).

```js
'use strict';

class ExportJob {
  static category = 'export';
  state = 'queued';
  items = [];
  describe() { return this.state; }
  callback = () => this.state;
}

const first = new ExportJob();
const second = new ExportJob();
first.items.push('report.csv');
const callback = first.callback;

console.log(first.describe === second.describe);
console.log(first.callback === second.callback);
console.log(second.items.length);
console.log(callback());
console.log(Object.keys(first).join(','));
console.log(ExportJob.category, first.category);
// Expected output:
// true
// false
// 0
// queued
// state,items,callback
// export undefined
```

Each `[]` expression creates a fresh array. Each arrow initializer creates a fresh function that captures the instance receiver. The public `describe` function is shared. If an initializer instead references a shared outer array, the resulting field values share that array; the field syntax itself does not copy anything.

Choose an arrow field when an instance-owned callback needs a stable lexical receiver. Prefer prototype methods when callers naturally use property calls and function sharing is useful. For a few external callbacks, a stored bound function or a small wrapper can adapt a prototype method without changing every method into a field.

## 3. Fields Define Properties; Assignments Set Them

A public field declaration uses own-property definition semantics. Ordinary `this.value = value` uses assignment semantics, which can invoke a setter found on the prototype chain. Replacing one with the other can change validation and observation behavior.

```js
'use strict';

const events = [];
class BaseSettings {
  set mode(value) { events.push(`setter:${value}`); }
}
class FieldSettings extends BaseSettings {
  mode = 'batch';
}
class AssignedSettings extends BaseSettings {
  constructor() {
    super();
    this.mode = 'stream';
  }
}

const field = new FieldSettings();
const assigned = new AssignedSettings();
console.log(events.join(','));
console.log(field.mode, Object.hasOwn(field, 'mode'));
console.log(assigned.mode, Object.hasOwn(assigned, 'mode'));
// Expected output:
// setter:stream
// batch true
// undefined false
```

The inherited setter receives only the assignment. The setter in this example deliberately stores nothing, so reading `assigned.mode` finds an accessor with no getter. The field instance owns a data property that hides the inherited accessor. A bare declaration such as `mode;` also defines an own field, with value `undefined`; it is not merely a type annotation.

## 4. Constructors Establish Invariants

An invariant is a rule that should hold whenever callers can use the object: a positive limit, a unique identifier, or a state transition that never moves from completed back to running. Construction establishes the rule; every later operation must preserve it.

For an ordinary synchronous domain object:

1. Validate the inputs that determine the rule.
2. Copy mutable input data when the instance promises to own it.
3. Store the validated state.
4. Expose operations that keep it valid.
5. Publish the instance only after construction succeeds.

Do not register `this` in a shared registry or call user callbacks halfway through a constructor. If a later check throws, the caller receives an exception, but a previously published reference can still point to the partial object. Exceptions are not transactional rollback.

Likewise, a field initializer executes before the relevant constructor body; it is a poor place for an irreversible external effect. Keep construction focused on local state. If creation needs I/O, expose an explicitly asynchronous factory that completes loading and validation before resolving a usable object. A constructor cannot be declared `async`.

## 5. Inheritance Introduces an Initialization Contract

For ordinary construction without replacement return values, base instance fields run before the base constructor body. Derived instance fields run after `super()` finishes constructing the base and before execution continues with the next statement in the derived constructor. See [constructor initialization rules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/constructor).

```js
'use strict';

const events = [];
class Job {
  status = (events.push('base field'), 'queued');
  constructor() {
    events.push(`base body sees ${this.status}`);
    this.status = 'base ready';
  }
}
class ReportJob extends Job {
  status = (events.push('derived field'), 'report ready');
  constructor() {
    events.push('before super');
    super();
    events.push(`derived body sees ${this.status}`);
  }
}

const job = new ReportJob();
console.log(events.join(' | '));
console.log(job.status);
// Expected output:
// before super | base field | base body sees queued | derived field | derived body sees report ready
// report ready
```

The derived field overwrites the base constructor's public value. A derived constructor may do work before `super()`, but it cannot read `this` at that point. A second `super()` can run base construction again, but fails when it tries to bind `this` a second time; earlier effects are not rolled back.

Methods already participate in prototype lookup during base construction. Consequently, `this.configure()` in a base constructor can find a subclass override before subclass fields exist. A public field read might produce `undefined`; a private field read can throw. Pass required configuration into the base constructor instead of requiring an override to discover partially initialized state. The [internal trace](03-internal-working.md) demonstrates this failure.

## 6. Private Names Protect an Access Path

`#balance` is a lexically declared private name, not a string key named `"#balance"`. Code that can mention the name still needs a receiver on which that private element is present. A public prototype method can access it, but copying the method or arranging a prototype relationship does not create the private element.

```js
'use strict';

class Counter {
  #value = 0;
  increment() { return ++this.#value; }
  static hasState(candidate) {
    const objectLike = candidate !== null &&
      (typeof candidate === 'object' || typeof candidate === 'function');
    return objectLike && #value in candidate;
  }
}

const counter = new Counter();
const shell = Object.create(Counter.prototype);
console.log(counter.increment());
console.log(Counter.hasState(counter), Counter.hasState(shell));
console.log(shell instanceof Counter);
try {
  shell.increment();
} catch (error) {
  console.log(error.name);
}
console.log(Reflect.ownKeys(counter).length);
// Expected output:
// 1
// true false
// true
// TypeError
// 0
```

The guarded `#value in candidate` checks a specific private element. It does not walk the public prototype chain, prove that every validation ran, or authorize the caller. A separate class declaring the same spelling gets a different private name. A subclass cannot mention a parent's private name unless its source is also lexically inside an appropriate declaring scope; ordinary inheritance does not grant that access.

Privacy also does not make referenced data immutable. Returning an internal array from a getter grants callers an ordinary reference to that array. Freeze, copy, or project the returned structure according to the abstraction's contract. For persistence, emit a defined data transfer object (DTO) and rebuild through validation; JSON does not preserve class identity or private elements.

## 7. Static Members Belong to a Constructor

A static method is useful for an alternative creation path such as `fromDTO`, or an operation concerning the type rather than one instance. Static public members participate in the constructor's prototype chain. A static private element belongs to the constructor that initializes it and is not copied to subclasses.

```js
'use strict';

class Schema {
  static #version = 1;
  static publicVersion = 1;
  static viaReceiver() { return this.#version; }
  static declaredVersion() { return Schema.#version; }
}
class ExtendedSchema extends Schema {}

console.log(ExtendedSchema.publicVersion);
console.log(ExtendedSchema.declaredVersion());
try {
  ExtendedSchema.viaReceiver();
} catch (error) {
  console.log(error.name);
}
// Expected output:
// 1
// 1
// TypeError
```

The inherited function still contains a valid private name, but `this` is `ExtendedSchema`. Choose `Schema.#version` when the state intentionally belongs to the declaring class. Choose a different storage model when each subclass should own independent configuration. See [static members](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/static).

Static fields and static blocks execute during class evaluation, once per evaluation, in their declaration order. A static block can use private names and local variables. Its execution is synchronous; it cannot contain `await` as a block-level operation. Prefer a small local initialization over hidden module-loading side effects. See [static initialization blocks](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Static_initialization_blocks).

## 8. Factory Functions Separate Creation from Representation

A factory is a function that returns an object. It can return a class instance, a plain record, or an object whose functions close over private state. The term describes a creation API, not a required memory layout.

```js
'use strict';

function createRunBudget(limit) {
  if (!Number.isSafeInteger(limit) || limit < 0) {
    throw new RangeError('Invalid limit');
  }
  let used = 0;
  return Object.freeze({
    take() {
      if (used === limit) return false;
      used += 1;
      return true;
    },
    remaining: () => limit - used
  });
}

const first = createRunBudget(1);
const second = createRunBudget(1);
const take = first.take;
console.log(take(), take());
console.log(first.remaining(), second.remaining());
console.log(first.take === second.take);
// Expected output:
// true false
// 0 1
// false
```

These operations use closed-over variables, so detachment does not change their target state. Freezing the returned public object prevents changing its properties; it does not freeze the lexical `used` binding. Each factory call allocates a new group of functions and a separate captured environment.

Factories are convenient for injecting dependencies and exposing a narrow capability. Classes are convenient when many instances should share methods and a receiver-based interface is natural. A factory can also call `new`, combining a convenient creation API with shared methods.

## 9. Composition Keeps Independent Choices Independent

Suppose export behavior varies by formatter, destination, and retry policy. Encoding every combination as a subclass creates a hierarchy whose branches mix independent choices. Composition supplies the collaborators explicitly:

```js
'use strict';

function createExporter({ format, write }) {
  if (typeof format !== 'function' || typeof write !== 'function') {
    throw new TypeError('Expected formatter and writer');
  }
  return {
    export(record) {
      const output = format(record);
      write(output);
      return output.length;
    }
  };
}

const output = [];
const exporter = createExporter({
  format: ({ id, status }) => `${id}:${status}`,
  write: (text) => output.push(text)
});
console.log(exporter.export({ id: 'job-7', status: 'ready' }));
console.log(output.join(','));
// Expected output:
// 11
// job-7:ready
```

This small example assumes trusted in-process collaborators and a validated record. The production factory adds boundary checks and defines failure semantics. Dependencies are standalone callables here; adapt receiver-dependent methods at injection time with a wrapper or a stored bound function.

Use inheritance when a subtype can honor the base type's observable contract: accepted inputs, outputs, errors, and state transitions. Reusing a few implementation lines is not enough. `super.method()` starts method lookup at the superclass prototype but calls with the current receiver; it does not switch to a separate parent instance. See [the `super` reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/super).

## 10. Choose the Smallest Sufficient Creation Model

| Need | Useful starting point | Question to resolve |
| --- | --- | --- |
| Data crossing a JSON boundary | Validated plain record | Which fields, versions, and values are accepted? |
| Many independent objects with shared behavior | Class with prototype methods | Who owns mutable state, and how is validity preserved? |
| Small receiver-independent capability | Closure factory | What remains captured, and how long does it live? |
| Deliberate delegation without construction syntax | `Object.create` plus explicit initialization | What guarantees initialization, since no constructor runs? |
| Several interchangeable behaviors | Composition with injected collaborators | What are each collaborator's input, output, and failure contracts? |
| Stable specialization of an existing contract | Shallow inheritance | Can the subtype substitute without surprising callers? |

Avoid a global singleton solely to make construction convenient. Shared lifetime means shared mutable state across requests and tests. Put the owner of that lifetime in charge of creation and pass the resulting capability to consumers. The [field guide](11-professional-field-guide.md) develops these decisions as review questions.
