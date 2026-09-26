# Exercises and Coding Challenges

Work through these six exercises in order. For every invocation, identify the target function, the supplied receiver, and the arguments before predicting the result. All JavaScript blocks are independently runnable in Node.js 20 or later. They use strict mode and catch intentional failures.

The companion assertion program lives in `code/volume-2/chapter-02/example-03-binding-challenges.js`. Run it from the repository root with `node code/volume-2/chapter-02/example-03-binding-challenges.js`.

## Exercise 1: Predict the Receiver at Each Call

**Prompt and contract:** Explain why the same function returns different labels below. Predict all six lines before running the program. For each call, identify whether a property reference supplies the receiver, an explicit operation supplies it, or an ordinary strict call receives `undefined`.

**Hint:** A variable holding a function does not retain the object property through which that function was obtained. Parentheses around a property reference preserve it; the comma operator produces a value.

**Solution and runnable prediction program:**

```js
'use strict';

const primary = {
  label: 'primary',
  readLabel() {
    return this?.label ?? 'no receiver';
  }
};
const backup = { label: 'backup', readLabel: primary.readLabel };
const detached = primary.readLabel;

console.log(primary.readLabel());
console.log(backup.readLabel());
console.log(detached());
console.log((primary.readLabel)());
console.log((0, primary.readLabel)());
console.log(detached.call(backup));

// Expected output:
// primary
// backup
// no receiver
// primary
// no receiver
// backup
```

**Why it works:** The two objects contain the same function value. `primary.readLabel()` and `backup.readLabel()` supply different receivers through their property references. The standalone variable and comma expression no longer supply an object receiver. Strict mode leaves `this` as `undefined` for those calls; optional chaining deliberately makes the missing receiver visible without throwing. `call` supplies `backup` explicitly.

**Complexity:** Each lookup and call has `O(1)` source-level overhead for this fixed example. No new wrapper functions are created by assigning the existing method to another property or variable.

**Alternative:** A function such as `readLabel(record)` makes the data dependency an explicit parameter. Use a receiver when the method belongs to a meaningful object interface, rather than adding `this` to an otherwise independent utility.

## Exercise 2: Repair a Detached Formatter

**Prompt and contract:** A report builder accepts a function called with one document number. Repair the detached `format` method without changing `buildLabel`. Provide a one-time invocation using `call`, another using `apply`, and a reusable callback. The callback must continue reading the original formatter's current `prefix` after that property changes.

**Hint:** `call` and `apply` invoke immediately. `bind` returns a function that can be handed to the report builder later.

**Solution:**

```js
'use strict';

function buildLabel(format, documentNumber) {
  return format(documentNumber);
}

const formatter = {
  prefix: 'INV',
  format(documentNumber) {
    return `${this.prefix}-${documentNumber}`;
  }
};
const detached = formatter.format;

try {
  buildLabel(detached, 42);
} catch (error) {
  console.log(error.name);
}

console.log(detached.call(formatter, 42));
console.log(detached.apply(formatter, [43]));
const formatDocument = detached.bind(formatter);
console.log(buildLabel(formatDocument, 44));
formatter.prefix = 'CREDIT';
console.log(buildLabel(formatDocument, 45));

// Expected output:
// TypeError
// INV-42
// INV-43
// INV-44
// CREDIT-45
```

**Why it works:** The report builder invokes a local function value. The unbound strict method therefore receives `undefined` and fails when it reads `this.prefix`. Binding stores a reference to `formatter`, so later property changes remain visible. Binding does not clone the object or freeze its fields.

**Complexity:** One bound callback with no leading arguments adds `O(1)` bookkeeping, plus the retained target and receiver. Each invocation adds fixed forwarding overhead. Building a label takes `O(L)` time and result space for an output of length `L`.

**Alternative:** `documentNumber => formatter.format(documentNumber)` also works. This arrow looks up the `format` property on every invocation, whereas `bind` retains the function value obtained at binding time. Choose deliberately if methods may be replaced.

## Exercise 3: Forward the Caller’s Dynamic Receiver

**Prompt and contract:** Implement `forwardCall(operation)`. Its returned function must pass its own receiver and all arguments to `operation`, return the exact result, and propagate any thrown value unchanged. The wrapper must work when installed on different objects and when called with an explicit receiver. It must not use an `apply` property on the target function.

This is a wrapper for ordinary calls. It need not support construction, copy function metadata, or alter the rules of arrow or already-bound targets. Reject non-function inputs with a `TypeError`; the caller is responsible for supplying an operation that supports ordinary calls.

**Hint:** Use a normal method or function for the wrapper so it gets a dynamic `this`. Pass that `this` to `Reflect.apply`. An arrow would capture the factory invocation's receiver instead.

**Solution:**

```js
'use strict';

function forwardCall(operation) {
  if (typeof operation !== 'function') {
    throw new TypeError('operation must be a function.');
  }

  return {
    invoke(...args) {
      return Reflect.apply(operation, this, args);
    }
  }.invoke;
}

function allocate(size, extra) {
  return { pool: this.pool, bytes: size + extra };
}

// A function can have an own property named apply; ignore that property.
allocate.apply = null;
const sharedAllocate = forwardCall(allocate);
const smallPool = { pool: 'small', allocate: sharedAllocate };
const largePool = { pool: 'large', allocate: sharedAllocate };

console.log(JSON.stringify(smallPool.allocate(8, 2)));
console.log(JSON.stringify(largePool.allocate(32, 4)));
console.log(JSON.stringify(sharedAllocate.call({ pool: 'temporary' }, 4, 1)));

const sentinel = { reason: 'capacity' };
const fail = forwardCall(() => { throw sentinel; });
try {
  fail();
} catch (error) {
  console.log(error === sentinel);
}

// Expected output:
// {"pool":"small","bytes":10}
// {"pool":"large","bytes":36}
// {"pool":"temporary","bytes":5}
// true
```

**Why it works:** Each wrapper call receives its own `this`. `Reflect.apply` forwards that value and the rest-argument array to the saved function. It does not consult `operation.apply`. A returned object is passed through by reference, and an exception escapes unchanged because the wrapper does not catch it. The returned concise method cannot be called with `new`, which keeps construction outside the interface. See the specification's [Reflect.apply algorithm](https://tc39.es/ecma262/multipage/reflection.html#sec-reflect.apply) and [method definition rules](https://tc39.es/ecma262/multipage/ecmascript-language-functions-and-classes.html#sec-runtime-semantics-definemethod).

**Important boundary:** Forwarding a receiver cannot make an arrow use dynamic `this` or replace an already-bound target's receiver. It also cannot turn a class constructor into a function that permits ordinary invocation.

**Complexity:** Factory overhead is `O(1)`. For `a` call-time arguments, the rest array and forwarding add `O(a)` time and temporary space in the source-level cost model, plus the target operation's costs. The wrapper retains its target.

**Alternative:** An explicit helper taking `(operation, receiver, args)` removes dynamic receiver behavior from the wrapper API. Native `bind` is appropriate when the receiver should be fixed, which is a different requirement.

## Exercise 4: Partially Apply Without Losing the Receiver

**Prompt and contract:** Create a reusable `labelForManual` callback from `catalog.label(kind, edition, title)` using native `bind`. Fix the receiver to `catalog`, fix `kind` to `'manual'`, and prefill the supplied edition object. A later call supplies only the title. Demonstrate the behavior after changing both the catalog's imprint and the edition's revision.

**Hint:** The first argument to `bind` is the receiver, not the target's first positional argument. Remaining bound arguments appear before later call arguments. Objects among them remain shared references.

**Solution:**

```js
'use strict';

const catalog = {
  imprint: 'North',
  label(kind, edition, title) {
    return `${this.imprint} | ${kind} | r${edition.revision} | ${title}`;
  }
};
const edition = { revision: 1 };
const labelForManual = catalog.label.bind(catalog, 'manual', edition);

console.log(labelForManual('JavaScript'));
catalog.imprint = 'South';
edition.revision = 2;
console.log(labelForManual('Web APIs'));
console.log(labelForManual.call({ imprint: 'Other' }, 'Testing'));

// Expected output:
// North | manual | r1 | JavaScript
// South | manual | r2 | Web APIs
// South | manual | r2 | Testing
```

**Why it works:** The target receives the argument sequence `kind`, `edition`, then `title`. The outer `call` cannot replace the native bound receiver during ordinary invocation. Both saved objects are still mutable, and this example intentionally reads their current fields. These call semantics follow [native bound function invocation](https://tc39.es/ecma262/multipage/ordinary-and-exotic-objects-behaviours.html#sec-bound-function-exotic-objects-call-thisargument-argumentslist).

**Complexity:** Capturing `p` leading arguments needs `O(p)` saved argument slots in a source-level model. Forwarding a call with `a` later arguments handles `p + a` arguments, plus the target's work. Native engine storage and allocation optimizations are implementation details. Result-string construction takes `O(L)` time and result space for length `L`.

**Alternative:** If revision must be a snapshot, read its primitive value once and close over that value, or explicitly create the small data copy the contract needs. Binding an object is not a snapshot. A wrapper also supports inserting arguments in positions other than the leading prefix supported by `bind`.

## Exercise 5: Build a Bounded Bind-Like Call Wrapper

**Prompt and contract:** Implement `bindForCall(operation, receiver, ...leading)`, a teaching wrapper for ordinary calls only. Save the operation, receiver, and leading arguments. Every call must forward the saved receiver and then the leading arguments followed by that call's arguments. Preserve return and thrown-value identity, reject non-function inputs, and avoid mutating the receiver, target, or `Function.prototype`.

The result must reject `new`. It is **not a native `bind` polyfill**: construction, `new.target` forwarding, bound-function `instanceof` behavior, and native `name`/`length` metadata are outside its contract. Ordinary functions, concise methods, arrows, and bound functions may be supplied when they support ordinary invocation; each target retains its own `this` rules.

**Hint:** Return a concise object method that uses the saved `receiver`, rather than the wrapper's invocation receiver. Concise methods are nonconstructible. Use a fresh combined argument array on every call.

**Solution:**

```js
'use strict';

function bindForCall(operation, receiver, ...leading) {
  if (typeof operation !== 'function') {
    throw new TypeError('operation must be a function.');
  }

  return {
    invoke(...trailing) {
      return Reflect.apply(operation, receiver, [...leading, ...trailing]);
    }
  }.invoke;
}

const formatter = {
  group: 'archive',
  format(prefix, id, suffix) {
    return `${this.group}:${prefix}${id}${suffix}`;
  }
};
const formatArchive = bindForCall(formatter.format, formatter, 'DOC-');

console.log(formatArchive(7, '.txt'));
console.log(formatArchive.call({ group: 'other' }, 8, '.md'));
formatter.group = 'cold';
console.log(formatArchive(9, '.csv'));

try {
  new formatArchive(10, '.txt');
} catch (error) {
  console.log(error.name);
}

// Expected output:
// archive:DOC-7.txt
// archive:DOC-8.md
// cold:DOC-9.csv
// TypeError
```

**Why it works:** The closure stores the receiver independently of the wrapper's call site. Each invocation creates a new argument list, so calls cannot accidentally append to the saved prefix. `Reflect.apply` performs the ordinary call. Returning a concise method enforces the promised rejection of construction; adding a `prototype` property would not give it a constructor internal method.

**Why the contract is bounded:** Native `bind` can produce a constructible function when its target is constructible. This exercise deliberately rejects construction even for those targets. Native `bind` also creates a special bound function with behavior this ordinary method does not reproduce. A successful callback demonstration is therefore not evidence of a correct general polyfill. See [BoundFunctionCreate](https://tc39.es/ecma262/multipage/ordinary-and-exotic-objects-behaviours.html#sec-boundfunctioncreate).

**Complexity:** For `p` leading arguments, creation retains `O(p)` argument slots plus the target and receiver. For `a` later arguments, rest collection and the combined array add `O(p + a)` time and temporary space per call, plus the target's own costs. Values stored in those slots may keep larger object graphs reachable.

**Alternative:** Use native `bind` in application code when its semantics match the requirement. This wrapper is useful as an exercise in closure state, argument order, and explicitly limited API contracts.

**Additional checks:** The companion script checks null and primitive receivers with strict targets, exact return and thrown-value identity, independent calls, empty argument lists, arrow and already-bound target behavior, and rejection of `new` even when the target itself is constructible.

## Exercise 6: Keep Callback Identity Stable for Cleanup

**Prompt and contract:** A local formatter registry stores callback functions in a `Set`. It calls each formatter with one string and removes a formatter by function identity. Implement `attachFormatter(registry, owner)` so it binds `owner.format` once, registers that function, and returns an idempotent cleanup function: the first cleanup returns `true` if it removed the callback; later cleanups return `false`.

For this exercise the registry's `add` and `delete` operations do not throw, the owner has a callable `format` method, and callbacks do not edit the registry during a render. Two attachments of the same method count as two registrations because they create different bound functions.

**Hint:** The cleanup closure must keep the exact function passed to `add`. Calling `bind` again produces another function object.

**Solution:**

```js
'use strict';

function createFormatterRegistry() {
  const callbacks = new Set();
  return {
    add(callback) {
      callbacks.add(callback);
    },
    delete(callback) {
      return callbacks.delete(callback);
    },
    render(text) {
      return [...callbacks].map(callback => callback(text));
    },
    get size() {
      return callbacks.size;
    }
  };
}

function attachFormatter(registry, owner) {
  let savedRegistry = registry;
  let callback = owner.format.bind(owner);
  savedRegistry.add(callback);

  return () => {
    if (callback === null) return false;
    const removed = savedRegistry.delete(callback);
    callback = null;
    savedRegistry = null;
    return removed;
  };
}

const registry = createFormatterRegistry();
const owner = {
  prefix: 'Preview',
  format(text) {
    return `${this.prefix}: ${text}`;
  }
};
const detach = attachFormatter(registry, owner);

console.log(registry.render('Chapter 2').join(', '));
console.log(registry.delete(owner.format.bind(owner)), registry.size);
console.log(detach(), detach(), registry.size);
console.log(registry.render('Chapter 2').length);

// Expected output:
// Preview: Chapter 2
// false 1
// true false 0
// 0
```

**Why it works:** The registration and cleanup share the same function reference. The fresh bound function passed directly to `delete` cannot match the registered function. Cleanup removes that registration and clears its saved callback and registry values, making repeat calls harmless. Other references can still retain the owner; cleanup is not a promise of immediate garbage collection.

**Complexity:** Each attachment adds one callback and `O(1)` bookkeeping. A render with `n` callbacks builds a snapshot array and a result array, taking `O(n)` overhead time and space plus the formatters' work. Common hash-based `Set` implementations provide average `O(1)` add/delete operations; ECMAScript requires average sublinear access rather than a particular hash-table implementation.

**Alternative:** A registry can return an unsubscribe function from its own `add` API, centralizing identity management. A stable arrow wrapper also works if it is created once and saved. Whichever representation is used, cleanup must remove the actual registered function.
