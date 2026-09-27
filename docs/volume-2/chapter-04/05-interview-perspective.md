# Interview Perspective

A useful class explanation starts with creation, ownership, and invocation. Identify when state is initialized, which object owns it, and how a method receives its `this`. Then explain the contract that justifies a class, a factory, or a composed collaborator.

The snippets below are independent strict-mode programs for Node.js 20 or later.

## 1. Are Classes Only Another Spelling for Constructor Functions?

**Question:** Which behaviors would a mechanical rewrite into functions and assignments miss?

```js
'use strict';

try {
  new Report();
} catch (error) {
  console.log(error.name);
}

class Report {
  describe() { return 'report'; }
}

try {
  Report();
} catch (error) {
  console.log(error.name);
}
console.log(new Report().describe());
console.log(Object.keys(Report.prototype).length);

// Expected output:
// ReferenceError
// TypeError
// report
// 0
```

**Answer:** The class declaration's binding is uninitialized until evaluation reaches the declaration, so the early access hits its temporal dead zone. The initialized class constructor rejects an ordinary function call. Its prototype method is non-enumerable. Class bodies also run in strict mode independently of the surrounding script.

**Follow-up:** Is saying "classes are not hoisted" precise? It can obscure the binding's existence before initialization. Explain the temporal dead zone instead: an earlier same-scope reference does not find a usable constructor or fall back to an outer binding.

**Follow-up:** Does strictness automatically bind instance methods? No. Extracting a method still changes the call expression. An ordinary detached call supplies `undefined`; a method that needs instance state will fail unless the API adapts its receiver.

## 2. Which Parts Are Shared Across Instances?

```js
'use strict';

class Task {
  tags = [];
  constructor(id) { this.id = id; }
  describe() { return this.id; }
  describeLater = () => this.id;
}

const first = new Task('T-1');
const second = new Task('T-2');
first.tags.push('urgent');
console.log(first.tags.length, second.tags.length);
console.log(first.describe === second.describe);
console.log(first.describeLater === second.describeLater);
console.log(Object.hasOwn(first, 'tags'), Object.hasOwn(first, 'describe'));

// Expected output:
// 1 0
// true
// false
// true false
```

**Answer:** Each evaluation of the instance field initializer creates a fresh array. The ordinary method is shared through the prototype. The arrow field creates an own function for each instance and resolves that instance's `this` lexically.

**Follow-up:** Does every field initializer produce independent data? No. `tags = sharedTags` would store the same external array reference in every instance. Per-instance field definition and independent referenced data are different guarantees.

**Follow-up:** Should every method become an arrow field? Choose that form when its identity and receiver behavior fit the API. Shared methods, stored bound callbacks, and arrow fields make different allocation, override, and cleanup tradeoffs.

## 3. When Do Base and Derived Fields Initialize?

```js
'use strict';

const events = [];
class Base {
  value = (events.push('base field'), 'base');
  constructor() { events.push('base body'); }
}
class Derived extends Base {
  value = (events.push('derived field'), 'derived');
  constructor() {
    events.push('before super');
    super();
    events.push('after super');
  }
}

const instance = new Derived();
console.log(events.join(' -> '));
console.log(instance.value);

// Expected output:
// before super -> base field -> base body -> derived field -> after super
// derived
```

**Answer:** In this ordinary derived construction, the base fields initialize before the base constructor body. The derived fields initialize after parent construction returns through `super()`, before execution continues at the next statement of the derived constructor. This is why the derived field replaces the base's earlier `value`.

**Follow-up:** May code run before `super()`? Yes, as the event entry shows, provided it does not use the still-uninitialized `this` or otherwise require it. Saying that `super()` must literally be the first statement is too strong. Accessing `this` before it is initialized throws.

**Follow-up:** Why avoid overridable calls in a base constructor? Dispatch can reach a derived prototype method while derived fields are not ready. An override that reads a private field can throw rather than merely read `undefined`. See the [initialization failure example](09-edge-cases-debugging.md#overrides-can-run-before-derived-state-exists).

## 4. What Does a Private Field Guarantee?

**Answer:** A private name is available only in its declaring class's lexical scope, and access requires the receiver to carry that specific private element. A public key with the same spelling does not provide access. Private elements are not enumerated by ordinary object-key operations and do not appear automatically in a spread copy.

**Follow-up:** Can a subclass read the parent's `#value` by declaring its own `#value`? No. Those are distinct private names. Parent methods can operate on the parent's initialized private state in a derived instance, while subclass methods use the subclass's own state. Private fields do not participate in ordinary string-key prototype lookup.

**Follow-up:** Does a private field make returned objects immutable? No. A method can expose a reference to a private array or record, allowing the caller to mutate that object. Privacy concerns access to an element; ownership concerns all references to its value.

**Follow-up:** Is a private access failure an authorization failure? No. It reports a receiver mismatch or initialization problem. A valid branded instance can still represent an operation that the current user must not perform. The access mechanism is specified by [ECMAScript: PrivateGet](https://tc39.es/ecma262/multipage/abstract-operations.html#sec-privateget).

## 5. When Would You Choose a Factory Instead?

**Answer:** A factory can validate and normalize inputs, inject dependencies, select an implementation, and return a narrow interface without requiring callers to know its construction details. A closure factory can expose detached operations that use lexical state. A class can share ordinary methods while giving each instance its own private state. Neither design is automatically more maintainable or faster.

**Follow-up:** Can a factory return a class instance? Yes. A named factory and a class can work together: the factory owns input conversion or resource preparation, and the class owns the resulting object's invariants.

**Follow-up:** What about asynchronous initialization? A class constructor cannot be declared `async`. Use an explicit async factory, possibly a static method, that completes preparation before resolving to a ready object. Document failure and cleanup. Returning a promise from a constructor exploits object-return behavior and makes the meaning of `new` harder for callers to reason about.

## 6. When Is Inheritance a Suitable Contract?

**Answer:** Use inheritance when a child can support the parent's documented operations and invariants without surprising callers. A subclass that narrows accepted inputs, changes a synchronous return into a promise, or silently removes an operation can violate that contract even though its prototype links are valid.

**Follow-up:** What if the only goal is to swap a formatter or storage backend? An injected collaborator often expresses that variation directly. The owner can delegate a specific operation without acquiring the collaborator's whole inheritance contract.

**Follow-up:** Does `super.method()` call a separate parent object? No. It locates behavior using the method's home-object relationship and invokes it with the current receiver. The derived object's state remains the state being operated on. Base methods implemented as instance fields are not found on the parent prototype by that lookup.

## An Answer Checklist

- Distinguish evaluating a class definition from constructing an instance.
- Locate each field's initialization phase and the first point where `this` is available.
- Separate own fields, prototype methods, static members, and private elements.
- Identify which references are fresh and which refer to shared mutable data.
- Preserve the receiver and complete return/error contract when adapting a method.
- Explain the validation and readiness guarantees of the chosen constructor or factory.
- State the substitutability or dependency contract before choosing inheritance or composition.
