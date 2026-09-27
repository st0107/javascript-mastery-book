# Exercises and Coding Challenges

These six exercises move from instance layout to lifecycle rules, invariants, composition, and explicit object reconstruction. Identify who owns each piece of state and when that state becomes valid before writing an implementation. Every JavaScript block runs independently in Node.js 20 or later, uses strict mode, and catches intentional failures.

The companion assertion program lives in `code/volume-2/chapter-04/example-03-creation-challenges.js`. Run it from the repository root with `node code/volume-2/chapter-04/example-03-creation-challenges.js`.

## Exercise 1: Choose Which Functions Belong to Each Instance

**Requirements:** Implement `LabelFormatter(prefix)` as a class. Each instance owns its prefix. Its `format(text)` method belongs to the prototype and returns `prefix: text`. Its `callback` arrow field must work when extracted and must read the instance's current prefix. Create two instances and prove which function values are shared and which are separate.

For this exercise the prefix and text are strings. Also demonstrate why extracting `format` directly fails when it is called without a receiver.

**Hint:** A class method is shared through the prototype. An arrow field initializer creates a new function for each instance and captures that instance's `this`.

**Solution:**

```js
'use strict';

class LabelFormatter {
  prefix;
  callback = text => this.format(text);

  constructor(prefix) {
    this.prefix = prefix;
  }

  format(text) {
    return `${this.prefix}: ${text}`;
  }
}

const preview = new LabelFormatter('Preview');
const review = new LabelFormatter('Review');
console.log(preview.format === review.format, preview.callback === review.callback);
console.log(Object.hasOwn(preview, 'format'), Object.hasOwn(preview, 'callback'));

const callback = preview.callback;
preview.prefix = 'Ready';
console.log(callback('Chapter 4'));
const detached = preview.format;
try {
  detached('Chapter 4');
} catch (error) {
  console.log(error.name);
}

// Expected output:
// true false
// false true
// Ready: Chapter 4
// TypeError
```

**Why it works:** The arrow captures the instance while its field is initialized, but it does not read `prefix` until invoked. Constructor assignment therefore happens before this demonstration uses the callback. The prototype method receives a dynamic receiver; its detached call receives `undefined` and fails when it reads `this.prefix`. The arrow calls `this.format(...)`, so it looks up the current method on each invocation.

**Complexity:** Each formatter adds `O(1)` state and one arrow function; the prototype method is shared. Formatting takes `O(L)` time and result space for a label of length `L`. Retaining the callback also retains access to its instance.

**Alternative:** Bind a prototype method once during construction and save the resulting callback. That retains the selected function value rather than looking up `format` again on each call. Use a plain prototype method alone when the API always supplies the correct receiver and no extracted callback is needed.

## Exercise 2: Finish Initialization Before Validating Derived State

**Requirements:** Implement a base `Document` and a derived `Workbook`. Trace base-field initialization, the base constructor body, derived-field initialization, and the derived constructor body. The base constructor sets `category` to `'assigned-by-base'`; the derived field sets it to `'workbook'`. The finished workbook must own the supplied title and page count.

A workbook requires a positive safe-integer page count. Validate it using a derived private method after `super()` and after assigning the page count. The base constructor must not call an overridable method that could inspect partially initialized derived state. Assume titles are strings.

**Hint:** Derived instance fields run after the base constructor returns and before execution proceeds past the `super()` call. A derived field can overwrite a public property that the base constructor assigned. Private validation avoids dispatching to a further subclass override.

**Solution:**

```js
'use strict';

const steps = [];

class Document {
  category = (steps.push('base field'), 'document');

  constructor(title) {
    steps.push('base body');
    this.title = title;
    this.category = 'assigned-by-base';
  }
}

class Workbook extends Document {
  category = (steps.push('derived field'), 'workbook');
  #minimumPages = 1;

  constructor(title, pages) {
    super(title);
    steps.push('derived body');
    this.pages = pages;
    this.#validate();
  }

  #validate() {
    if (!Number.isSafeInteger(this.pages) || this.pages < this.#minimumPages) {
      throw new RangeError('pages must be a positive safe integer.');
    }
  }
}

const workbook = new Workbook('JavaScript', 24);
console.log(steps.join(' > '));
console.log(workbook.category, workbook.title, workbook.pages);
try {
  new Workbook('Invalid', 0);
} catch (error) {
  console.log(error.name);
}

// Expected output:
// base field > base body > derived field > derived body
// workbook JavaScript 24
// RangeError
```

**Why it works:** Each class initializes its own instance elements at its specified construction stage. By the time the derived body resumes after `super()`, `#minimumPages` exists. Its private validator then reads fully assigned inputs. Calling a derived override from the base constructor would run earlier, when derived fields have not been installed. These stages are specified by [ordinary construction](https://tc39.es/ecma262/multipage/ordinary-and-exotic-objects-behaviours.html#sec-ecmascript-function-objects-construct-argumentslist-newtarget) and [super-call evaluation](https://tc39.es/ecma262/multipage/ecmascript-language-expressions.html#sec-super-keyword-runtime-semantics-evaluation).

**Boundary:** This validates the initial page count. Because `pages` remains public, later writes can violate the rule. The next exercise moves state behind controlled methods. A thrown constructor also does not roll back earlier external effects, including the trace updates in this demonstration.

**Complexity:** A fixed number of fields and validation operations gives `O(1)` construction bookkeeping. The trace is demonstration state and grows by four entries per construction attempt. Formatting the trace costs time and space proportional to its output length.

**Alternative:** A factory can validate inputs before constructing the instance. Composition can also remove a base/derived lifecycle when there is no real specialization relationship. Avoid a mandatory public `initialize()` step that leaves callers able to use an object before completing its setup.

## Exercise 3: Protect a Revision History With Private State

**Requirements:** Implement `RevisionHistory(limit)`. The limit must be an integer from 1 through 1,000. `append(title)` accepts a string, trims it, requires 1 through 100 UTF-16 code units, and appends a record with a one-based revision number. It returns that number. A full history rejects another append. Invalid calls must not change stored entries.

Keep the limit and entries private. Expose `size` and `snapshot()`. A snapshot must have a fresh array and fresh entry objects so changing either cannot edit stored records. Two histories must be independent. No method may return a private entry object directly.

**Hint:** Allocate `#entries = []` per instance. Validate before pushing. Copy both the array structure and each entry record; copying only the array would still expose the stored objects.

**Solution:**

```js
'use strict';

class RevisionHistory {
  #limit;
  #entries = [];

  constructor(limit) {
    if (!Number.isInteger(limit) || limit < 1 || limit > 1000) {
      throw new RangeError('limit must be an integer from 1 to 1000.');
    }
    this.#limit = limit;
  }

  append(title) {
    if (typeof title !== 'string') throw new TypeError('title must be a string.');
    const normalized = title.trim();
    if (normalized.length === 0 || normalized.length > 100) {
      throw new RangeError('title must contain 1 to 100 code units after trimming.');
    }
    if (this.#entries.length === this.#limit) {
      throw new RangeError('history is full.');
    }
    const number = this.#entries.length + 1;
    this.#entries.push({ number, title: normalized });
    return number;
  }

  get size() {
    return this.#entries.length;
  }

  snapshot() {
    return this.#entries.map(entry => ({ number: entry.number, title: entry.title }));
  }
}

const history = new RevisionHistory(2);
console.log(history.append('  Draft  '));
const snapshot = history.snapshot();
snapshot[0].title = 'outside edit';
snapshot.push({ number: 99, title: 'outside append' });
console.log(JSON.stringify(history.snapshot()));
console.log(history.append('Reviewed'), history.size);
try {
  history.append('Published');
} catch (error) {
  console.log(error.message, history.size);
}
console.log(new RevisionHistory(2).size);

// Expected output:
// 1
// [{"number":1,"title":"Draft"}]
// 2 2
// history is full. 2
// 0
```

**Why it works:** The class controls writes to private state and validates before mutation. Each entry contains only a number and a string, so creating fresh records is sufficient to isolate this snapshot. This is a contract-specific copy, not a general deep-cloning algorithm. Snapshot consumers may change their copy without needing to freeze it.

**Complexity:** Title validation and trimming take up to `O(t)` time and temporary text space for input length `t`. Appending has typical amortized `O(1)` array overhead. A snapshot of `n` entries takes `O(n)` time and new record/array space, excluding string payload implementation details. The history retains `O(n)` records up to its configured limit.

**Alternative:** An immutable history could return a new history from each append, making version sharing explicit but increasing copying or requiring a persistent data structure. A closure factory can enforce the same ownership rules without a class. Public underscored fields would only document a convention, not restrict access.

## Exercise 4: Compose Behavior in a Closure Factory

**Requirements:** Implement `createTextPipeline(normalize, decorate)`. Accept two synchronous, receiver-independent functions. `render(input)` first checks that input is a string, calls the normalizer, checks that its result is a string, then calls the decorator and checks its result. Return the final string.

Keep a private count of successful renders. Increment only after both stages return valid strings. Expose `stats()` returning a fresh `{ completed }` record. Extracted methods must work, separate pipelines must have separate counts, and thrown values from a stage must propagate unchanged. Reject non-function dependencies. Assume the successful count stays within the safe-integer range.

**Hint:** Store the count and dependencies in the factory's closure. The returned functions need no `this`. Composing two injected operations avoids inventing a subclass for every normalization-and-decoration combination.

**Solution:**

```js
'use strict';

function createTextPipeline(normalize, decorate) {
  if (typeof normalize !== 'function' || typeof decorate !== 'function') {
    throw new TypeError('normalize and decorate must be functions.');
  }
  let completed = 0;

  return {
    render(input) {
      if (typeof input !== 'string') throw new TypeError('input must be a string.');
      const normalized = normalize(input);
      if (typeof normalized !== 'string') {
        throw new TypeError('normalize must return a string.');
      }
      const result = decorate(normalized);
      if (typeof result !== 'string') {
        throw new TypeError('decorate must return a string.');
      }
      completed += 1;
      return result;
    },
    stats() {
      return { completed };
    }
  };
}

const pipeline = createTextPipeline(text => text.trim(), text => `[${text}]`);
const render = pipeline.render;
console.log(render('  Chapter 4  '));
const report = pipeline.stats();
report.completed = 100;
console.log(pipeline.stats().completed);

const rejected = createTextPipeline(text => text, () => 42);
try {
  rejected.render('draft');
} catch (error) {
  console.log(error.message, rejected.stats().completed);
}
console.log(pipeline.stats().completed);

// Expected output:
// [Chapter 4]
// 1
// decorate must return a string. 0
// 1
```

**Why it works:** Each factory invocation has its own count binding and captures its two operations. Calling an extracted method preserves that lexical access. Validation and stage calls precede the increment, so a throw or invalid output leaves the count unchanged. This does not undo external effects performed by a stage before it fails; the counter tracks successful return values only.

**Complexity:** The wrapper adds `O(1)` bookkeeping per render plus the two stages' time and output-space costs. Each factory creates a fixed number of functions and captures its dependencies. Every `stats()` call creates an `O(1)` record.

**Alternative:** A class with private fields can expose the same API when class identity or shared prototype methods are useful. A single pure composed function is simpler if statistics are unnecessary. Dependency injection is useful here because each stage can be selected and tested without changing the construction mechanism.

## Exercise 5: Reconstruct an Instance From an Explicit DTO

**Requirements:** Implement a `ReaderProfile` with private identifier and display name. Accept identifiers matching one to 32 lowercase ASCII letters, digits, or hyphens. A display name must be a string that trims to 1 through 80 UTF-16 code units. Expose `label()` and `toDTO()`.

Implement `ReaderProfile.fromDTO(dto)` for inert data produced by `JSON.parse`. The object must have exactly the own string keys `version`, `id`, and `displayName`, with version `1`. Reject missing or extra fields, arrays, null, and invalid values. Construct a real instance through the validated constructor; do not copy arbitrary properties or set the DTO's prototype. `toDTO()` returns a fresh record containing only those three fields.

This contract does not accept proxies, getters, symbol keys, or arbitrary executable objects as DTOs. JSON parsing itself remains the caller's responsibility.

**Hint:** Check the allowed shape, select each required field explicitly, and call `new ReaderProfile(...)`. `Object.create(ReaderProfile.prototype)` supplies a prototype link but does not install private fields.

**Solution:**

```js
'use strict';

class ReaderProfile {
  #id;
  #displayName;

  constructor(id, displayName) {
    if (typeof id !== 'string' || !/^[a-z0-9-]{1,32}$/.test(id)) {
      throw new TypeError('id must contain 1 to 32 lowercase letters, digits, or hyphens.');
    }
    if (typeof displayName !== 'string') {
      throw new TypeError('displayName must be a string.');
    }
    const normalized = displayName.trim();
    if (normalized.length === 0 || normalized.length > 80) {
      throw new RangeError('displayName must contain 1 to 80 code units after trimming.');
    }
    this.#id = id;
    this.#displayName = normalized;
  }

  label() {
    return `${this.#displayName} (${this.#id})`;
  }

  toDTO() {
    return { version: 1, id: this.#id, displayName: this.#displayName };
  }

  static fromDTO(dto) {
    if (dto === null || typeof dto !== 'object' || Array.isArray(dto)) {
      throw new TypeError('dto must be a JSON object.');
    }
    const required = ['version', 'id', 'displayName'];
    if (Object.keys(dto).length !== required.length ||
        !required.every(key => Object.hasOwn(dto, key)) || dto.version !== 1) {
      throw new TypeError('dto must contain exactly version 1, id, and displayName.');
    }
    return new ReaderProfile(dto.id, dto.displayName);
  }
}

const dto = JSON.parse('{"version":1,"id":"reader-7","displayName":"  Mira  "}');
const profile = ReaderProfile.fromDTO(dto);
dto.displayName = 'outside edit';
const copy = profile.toDTO();
copy.id = 'changed';
console.log(profile instanceof ReaderProfile, profile.label());
console.log(JSON.stringify(profile.toDTO()));

try {
  ReaderProfile.fromDTO(JSON.parse(
    '{"version":1,"id":"reader-7","displayName":"Mira","__proto__":{"admin":true}}'
  ));
} catch (error) {
  console.log(error.name);
}

// Expected output:
// true Mira (reader-7)
// {"version":1,"id":"reader-7","displayName":"Mira"}
// TypeError
```

**Why it works:** Hydration is an explicit conversion from data into a newly initialized object. Shape validation rejects unexpected names, and the constructor enforces value rules. Only strings enter private state, so later edits to the input or an output DTO cannot alter it. The constructor's private elements are installed by normal construction; no prototype reassignment or bulk property assignment is involved.

**Boundary:** `fromDTO` deliberately returns `ReaderProfile`, even if inherited by a subclass. A polymorphic factory would need a separate subclass-construction contract. The shape checks assume inert JSON data; they are not a side-effect-free validator for hostile proxies or accessor objects.

**Complexity:** Shape validation enumerates `k` own keys and costs `O(k)` time and temporary key-array space. String checks and trimming add `O(s)` work for the supplied text length. Construction and DTO creation each retain a fixed number of fields; label creation costs `O(L)` for output length `L`.

**Alternative:** A schema parser can perform the data validation before a small constructor call. Plain records may be enough when there is no behavior or invariant to attach to an instance. A generic merge into `this` obscures which fields are accepted and does not establish private state.

## Exercise 6: Preserve Private Brands and Define Static Ownership

**Requirements:** Implement `TicketSequence(start = 0)` with a private non-negative safe-integer position. `next()` advances by one and returns it; advancing beyond `Number.MAX_SAFE_INTEGER` throws without changing the position. Reject invalid starts before incrementing a private static construction count.

The construction count belongs to the entire `TicketSequence` family: constructing an ordinary subclass also increments the same count. The inherited `createdCount()` method must work when called on that subclass. Demonstrate an extracted `next` failure, repair it with one saved bound callback, and show that an object made only with `Object.create(TicketSequence.prototype)` lacks the required private state.

For the count, assume the number of successful base-constructor completions stays within the safe-integer range. It counts those completions, not a guarantee that every further subclass constructor will finish successfully.

**Hint:** Instance methods that access private state require a receiver containing that class's private elements. Static private state belongs to the defining constructor object. For a deliberately family-wide counter, refer to `TicketSequence.#created` rather than `this.#created`.

**Solution:**

```js
'use strict';

class TicketSequence {
  static #created = 0;
  #position;

  constructor(start = 0) {
    if (!Number.isSafeInteger(start) || start < 0) {
      throw new RangeError('start must be a non-negative safe integer.');
    }
    this.#position = start;
    TicketSequence.#created += 1;
  }

  next() {
    if (this.#position === Number.MAX_SAFE_INTEGER) {
      throw new RangeError('sequence is exhausted.');
    }
    this.#position += 1;
    return this.#position;
  }

  static createdCount() {
    return TicketSequence.#created;
  }
}

class PrioritySequence extends TicketSequence {}
const regular = new TicketSequence(10);
const priority = new PrioritySequence(100);
const detached = regular.next;
try {
  detached();
} catch (error) {
  console.log(error.name);
}

const nextRegular = regular.next.bind(regular);
console.log(nextRegular(), priority.next());
console.log(TicketSequence.createdCount(), PrioritySequence.createdCount());

const imitation = Object.create(TicketSequence.prototype);
console.log(imitation instanceof TicketSequence);
try {
  imitation.next();
} catch (error) {
  console.log(error.name);
}

// Expected output:
// TypeError
// 11 101
// 2 2
// true
// TypeError
```

**Why it works:** The bound callback supplies the initialized instance on every invocation. A matching public shape or prototype is insufficient for private access. The static method names the constructor that owns the counter, so subclass calls do not attempt private access on the subclass constructor. Private lookup checks the supplied object rather than searching its prototype chain; see [PrivateGet](https://tc39.es/ecma262/multipage/abstract-operations.html#sec-privateget).

**Static trap to explain:** If `createdCount()` used `this.#created`, `TicketSequence.createdCount()` would work but `PrioritySequence.createdCount()` would throw. The inherited method receives `PrioritySequence` as `this`, and that constructor does not acquire the base constructor's static private field through inheritance.

**Complexity:** Construction, counting, binding once, and each numeric operation use `O(1)` source-level time and bookkeeping space. Each sequence owns its position; the family counter is one separate static value. A retained bound callback keeps its sequence reachable.

**Alternative:** A closure-based sequence can expose a receiver-independent `next` callback. For per-subclass counts, use an explicitly designed map keyed by constructors or give each subclass its own state. Do not silently switch between family-wide and per-subclass ownership by changing `this` usage.
