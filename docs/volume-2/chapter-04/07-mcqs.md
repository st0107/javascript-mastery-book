# MCQs

Choose one answer before reading each explanation. Every JavaScript block runs independently in Node.js 20 or later and includes an expected-output comment for checking your prediction. All examples use local classes and objects; none modify built-in prototypes.

## 1. Shared Methods and Own Arrow Fields

What does this program print?

```js
'use strict';

class Preview {
  render() { return 'page'; }
  callback = () => this.render();
}

const first = new Preview();
const second = new Preview();
console.log(first.render === second.render);
console.log(first.callback === second.callback);
console.log(Object.hasOwn(first, 'render'), Object.hasOwn(first, 'callback'));

// Expected output (check after answering):
// true
// false
// false true
```

- A. `true`, `true`, and `true true`.
- B. `false`, `false`, and `true true`.
- C. `true`, `false`, and `false true`.
- D. `false`, `true`, and `false false`.

**Answer: C.** Both lookups of `render` find the same function on `Preview.prototype`. Each construction evaluates the arrow initializer and defines a new own `callback` property. Instance creation therefore allocates a callback function per instance while sharing the prototype method.

## 2. A Class Before Its Declaration

What does this program print?

```js
'use strict';

try {
  new Report();
} catch (error) {
  console.log(error.name);
}

class Report {}
console.log(new Report() instanceof Report);

// Expected output (check after answering):
// ReferenceError
// true
```

- A. `TypeError`, then `true`, because the initial value of `Report` is undefined.
- B. `ReferenceError`, then `true`, because the lexical binding is uninitialized before evaluation reaches the declaration.
- C. `true`, because class declarations initialize at the start of the scope like function declarations.
- D. A syntax error that prevents the complete program from running.

**Answer: B.** The binding exists in its scope but is in the temporal dead zone before declaration evaluation completes. The failed construction attempt does not prevent the later declaration from initializing that binding.

## 3. Extracting a Prototype Method

Which statement explains the result?

```js
'use strict';

class Message {
  text = 'Ready';
  read() { return this.text; }
}

const message = new Message();
const read = message.read;
try {
  console.log(read());
} catch (error) {
  console.log(error.name);
}
console.log(read.call(message));

// Expected output (check after answering):
// TypeError
// Ready
```

- A. A class method automatically binds to its first instance, but extraction deletes that binding.
- B. Class methods are callable only through their prototypes.
- C. `call` copies the method into the instance before invoking it.
- D. An ordinary extracted call supplies undefined as the strict method's receiver; `call` supplies the intended object.

**Answer: D.** Reading the method property obtains a function value without storing its receiver in that function. Class method code is strict even without the file's directive. Use a saved bound callback or an arrow wrapper when the receiving API will call without the instance.

## 4. Derived Fields and Base Assignment

What does this program print?

```js
'use strict';

class BaseDocument {
  kind = 'base field';
  constructor() {
    console.log(this.kind);
    this.kind = 'base assignment';
  }
}

class Workbook extends BaseDocument {
  kind = 'derived field';
  constructor() {
    super();
    console.log(this.kind);
  }
}

new Workbook();

// Expected output (check after answering):
// base field
// derived field
```

- A. `base field`, then `derived field`.
- B. `derived field`, then `base assignment`.
- C. `base field`, then `base assignment`.
- D. `undefined`, then `derived field`.

**Answer: A.** Base fields initialize before the base body. Derived fields initialize on the object returned by `super()` before the derived body resumes, so the derived field replaces the property value assigned by the base body. The two declarations do not create separate public slots with the same name.

## 5. Fields Versus Inherited Setters

What does this program print?

```js
'use strict';

const assignments = [];
class Document {
  set title(value) { assignments.push(value); }
}
class WithField extends Document {
  title = 'field';
}
class WithAssignment extends Document {
  constructor() {
    super();
    this.title = 'assignment';
  }
}

const field = new WithField();
const assigned = new WithAssignment();
console.log(assignments.join(', '));
console.log(Object.hasOwn(field, 'title'), Object.hasOwn(assigned, 'title'));

// Expected output (check after answering):
// assignment
// true false
```

- A. `field, assignment`, then `false false`.
- B. `assignment`, then `true false`.
- C. An empty line, then `true true`.
- D. `field`, then `false true`.

**Answer: B.** The field creates an own data property. The ordinary assignment finds and invokes the inherited setter, which records the value without creating a property on the receiver. Moving code from constructor assignment to a field can therefore change behavior. This distinction is specified for [public class fields](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Public_class_fields).

## 6. Private Names Are Not String Keys

What does this program print?

```js
'use strict';

class Draft {
  #status = 'private draft';
  read() { return this.#status; }
}

const draft = new Draft();
draft['#status'] = 'public label';
console.log(draft.read(), draft['#status']);
console.log(Object.keys(draft).join(', '));

// Expected output (check after answering):
// private draft public label
// #status
```

- A. `public label public label`, then `#status`.
- B. A syntax error because the string contains a hash character.
- C. `private draft public label`, then `#status`.
- D. `private draft undefined`, then an empty line.

**Answer: C.** The string-keyed property and the declared private element are separate. Enumeration sees the public property only. A name convention such as `_status` or `'#status'` cannot reproduce language-enforced private access.

## 7. A Prototype Link Without Private Initialization

What does this program print?

```js
'use strict';

class Account {
  #credits = 3;
  read() { return this.#credits; }
  static hasState(value) { return #credits in value; }
}

const imitation = Object.create(Account.prototype);
console.log(imitation instanceof Account, Account.hasState(imitation));
try {
  imitation.read();
} catch (error) {
  console.log(error.name);
}

// Expected output (check after answering):
// true false
// TypeError
```

- A. `true false`, then `TypeError`.
- B. `true true`, then `3`.
- C. `false false`, then `undefined`.
- D. `false true`, then `3`.

**Answer: A.** `Object.create` supplies the prototype link used by the default `instanceof` test, but it does not run construction. The private check examines the object itself. Its missing private field makes the method fail even though public method lookup succeeds.

## 8. Identically Spelled Private Names in Two Classes

What does this program print?

```js
'use strict';

class BaseJob {
  #status = 'queued';
  baseStatus() { return this.#status; }
}
class PrintJob extends BaseJob {
  #status = 'formatted';
  printStatus() { return this.#status; }
}

const job = new PrintJob();
console.log(job.baseStatus(), job.printStatus());

// Expected output (check after answering):
// queued formatted
```

- A. `formatted formatted`, because the subclass overrides the private field.
- B. A syntax error because private names cannot be repeated in a subclass.
- C. `queued queued`, because the base initializer always wins.
- D. `queued formatted`, because each class declaration creates a distinct private name.

**Answer: D.** Normal construction installs both classes' private state on this instance. Each method resolves its private name in the class that defines it. A subclass cannot directly refer to a base class's private name, even when it uses identical spelling for its own declaration.

## 9. An Inherited Static Method and Private Static State

What does this program print?

```js
'use strict';

class Sequence {
  static #created = 2;
  static count() { return this.#created; }
}
class PrioritySequence extends Sequence {}

console.log(Sequence.count());
try {
  console.log(PrioritySequence.count());
} catch (error) {
  console.log(error.name);
}

// Expected output (check after answering):
// 2
// TypeError
```

- A. `2`, then `2`, because private static fields are copied to subclasses.
- B. `2`, then `TypeError`, because the inherited call uses a receiver without that private static field.
- C. `2`, then `undefined`, because private lookup walks the constructor chain.
- D. A syntax error because static methods cannot access private fields.

**Answer: B.** The public method is inherited; the private field belongs to `Sequence` itself. Refer to `Sequence.#created` if the design intentionally has one family-wide count. Per-subclass state needs a different ownership design. See the rules for [private static fields](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_elements#private_static_fields).

## 10. Static Initialization Order

What does this program print?

```js
'use strict';

const trace = [];
class Templates {
  static first = (trace.push('first'), 1);
  static {
    trace.push(`block ${this.first} ${this.second}`);
  }
  static second = (trace.push('second'), 2);
}

new Templates();
new Templates();
console.log(trace.join(' > '));

// Expected output (check after answering):
// first > block 1 undefined > second
```

- A. `first > second > block 1 2`.
- B. `first > block 1 undefined > second` twice, because initialization repeats per instance.
- C. `first > block 1 undefined > second` once, during class evaluation.
- D. A `ReferenceError`, because a static block cannot read a later field.

**Answer: C.** Static field initializers and blocks run in declaration order when the class is evaluated. The public `second` field does not exist at the time of the block's read, and nothing is inherited under that name here. A later private field would fail a private access check instead of producing undefined.

## 11. Returning Another Object From a Base Constructor

What does this program print?

```js
'use strict';

class Envelope {
  ready = true;
  constructor() {
    return { replacement: true };
  }
}

const envelope = new Envelope();
console.log(envelope.replacement, envelope.ready);
console.log(envelope instanceof Envelope);

// Expected output (check after answering):
// true undefined
// false
```

- A. `true undefined`, then `false`.
- B. `true true`, then `true`.
- C. `undefined true`, then `true`.
- D. A `TypeError`, because a base constructor cannot return an object.

**Answer: A.** The explicit object becomes the construction result. The public field was initialized on the originally allocated object and is not transferred to the replacement. Returning arbitrary objects from constructors complicates lifecycle and type expectations; an explicit factory makes that choice clearer.

## 12. Receiver-Independent Factory Methods

Which statement explains the output?

```js
'use strict';

function createCounter() {
  let value = 0;
  return { next() { value += 1; return value; } };
}

const first = createCounter();
const second = createCounter();
const next = first.next;
console.log(next(), next(), second.next());

// Expected output (check after answering):
// 1 2 1
```

- A. Object literal methods bind `this` automatically.
- B. All factories share one hidden global counter.
- C. Extraction copies the counter's current numeric value into the function.
- D. The method closes over its factory invocation's binding and never reads `this`.

**Answer: D.** The first extracted method retains access to the first invocation's changing binding. The second factory call creates another binding. A closure factory can provide receiver-independent operations, although each invocation also creates new function values.

## 13. Freezing an Instance With Private State

What does this program print?

```js
'use strict';

class Progress {
  #completed = 0;
  advance() { this.#completed += 1; return this.#completed; }
}

const progress = Object.freeze(new Progress());
console.log(Object.isFrozen(progress), progress.advance(), progress.advance());

// Expected output (check after answering):
// true 1 2
```

- A. `true 0 0`, because freezing silently ignores all later changes.
- B. `true 1 2`, because freezing ordinary properties does not freeze private elements.
- C. A `TypeError` on the first call to `advance`.
- D. `false 1 2`, because an instance with private fields cannot be frozen.

**Answer: B.** The public object is frozen, but its behavior can still update private state. Immutability is an API contract that must include everything observable through methods, not just ordinary property descriptors.

## 14. Reconstructing a Domain Object From JSON

A `ReaderProfile` class has a private identifier, validates display names in its constructor, and exposes a `label()` method. An API provides a parsed JSON record with the identifier and display name. Which approach establishes the intended invariants?

- A. Set the parsed record's prototype to `ReaderProfile.prototype`.
- B. Copy the parsed record onto `Object.create(ReaderProfile.prototype)`.
- C. Validate the record's accepted shape, select its fields explicitly, and call the validated constructor.
- D. Add a `constructor: ReaderProfile` property to the parsed record.

**Answer: C.** Prototype links and constructor labels do not install private state or run validation. An explicit hydration path creates the real object through its supported lifecycle. Rejecting unexpected fields also keeps the accepted data contract reviewable. If the input is already parsed JSON, its values are data; arbitrary getters and proxies need a separately defined contract.

## 15. Calling an Override During Base Construction

What does this program print?

```js
'use strict';

class BaseReport {
  constructor() { this.describe(); }
  describe() { return 'base'; }
}
class DetailedReport extends BaseReport {
  #title = 'Detailed';
  describe() { return this.#title; }
}

try {
  new DetailedReport();
} catch (error) {
  console.log(error.name);
}

// Expected output (check after answering):
// TypeError
```

- A. Nothing; the constructor calls the base method by definition.
- B. Nothing; all fields of all classes initialize before any constructor body.
- C. `ReferenceError`, because `describe` is in the temporal dead zone.
- D. `TypeError`, because dispatch reaches the derived method before its private field is installed.

**Answer: D.** Public lookup finds the derived prototype method on the new object's chain. That method tries to read state that will only be initialized after the base constructor returns. Avoid invoking overridable behavior from base construction when it can depend on derived initialization.

## 16. Selecting a Creation Pattern

A service needs independently configurable text normalization and delivery behavior. Each combination must be testable with synchronous fake dependencies. There is no domain requirement that one service specialize another. Which initial design is easiest to extend without multiplying subclasses?

- A. A factory or class that receives both operations and composes them behind one small API.
- B. A subclass for every normalization-and-delivery combination.
- C. A mutable global singleton whose dependencies tests overwrite before each call.
- D. A constructor that guesses the desired behavior from the caller's function name.

**Answer: A.** Independent choices fit explicit dependencies. A factory and a class can both implement composition; the decision between them can then follow receiver needs, state ownership, method sharing, and API conventions. Test isolation follows from creating each service with its own state and chosen dependencies.

## Review Your Reasoning

An accurate answer identifies the object that owns the state, the construction stage when that state becomes available, and the receiver supplied to the call. Revisit the [construction model](03-internal-working.md) for ordering questions and the [coding challenges](06-exercises-coding-challenges.md) for implementations that enforce these boundaries.
