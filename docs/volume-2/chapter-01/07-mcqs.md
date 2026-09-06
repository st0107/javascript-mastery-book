# MCQs

Choose an answer before reading its explanation. Questions test binding identity and lifetime as well as output prediction.

## 1. Lexical Scope and the Caller

What does this program print?

```js
function makeReader() {
  const region = 'ap-south';
  return () => region;
}

function run(reader) {
  const region = 'eu-west';
  return reader();
}

console.log(run(makeReader()));

// Expected output (check after answering):
// ap-south
```

- A. `eu-west`, because `run` is the caller.
- B. `ap-south`, because the reader retains its defining environment.
- C. `undefined`, because `makeReader` already returned.
- D. A `ReferenceError`, because local variables cannot outlive calls.

**Answer: B.** The reader resolves `region` in the surrounding environment from its creation. The caller's local with the same name does not replace that binding. A completed call does not make retained lexical state inaccessible.

## 2. Reading After Reassignment

What does this program print?

```js
function createReader() {
  let status = 'queued';
  const read = () => status;
  status = 'running';
  return read;
}

console.log(createReader()());

// Expected output (check after answering):
// running
```

- A. `queued`, because closure creation copied the string into the function.
- B. `undefined`, because reassignment disconnects the closure.
- C. A `TypeError`, because captured bindings cannot change.
- D. `running`, because the function reads the binding's current value.

**Answer: D.** `status` is one mutable binding. Creating `read` does not freeze its value. The assignment changes what the later read returns.

## 3. Two Factory Calls

What does this program print?

```js
function createCounter() {
  let count = 0;
  return () => { count += 1; return count; };
}

const first = createCounter();
const second = createCounter();
console.log(first(), first(), second());

// Expected output (check after answering):
// 1 2 1
```

- A. `1 2 1`, because each factory invocation owns a separate count binding.
- B. `1 2 3`, because both functions execute the same source code.
- C. `1 1 1`, because calling a closure recreates its outer count.
- D. `0 1 0`, because incrementing occurs after each return.

**Answer: A.** Calls to `first` share the first invocation's state; `second` uses another invocation's state. Calling the returned function does not rerun the factory.

## 4. An Outer `let` in a Loop

What does this program print?

```js
function buildReaders() {
  const readers = [];
  let index;
  for (index = 0; index < 3; index += 1) {
    readers.push(() => index);
  }
  return readers;
}

console.log(buildReaders().map(read => read()).join(', '));

// Expected output (check after answering):
// 3, 3, 3
```

- A. `0, 1, 2`, because all uses of `let` create per-iteration bindings.
- B. `undefined, undefined, undefined`, because `index` has no initializer.
- C. `3, 3, 3`, because the callbacks share the binding declared outside the loop.
- D. A `ReferenceError`, because `index` is block scoped.

**Answer: C.** This loop repeatedly assigns to one outer `index`. Move the declaration into the `for` initializer to get the per-iteration binding behavior, or copy each value into a fresh body-local binding.

## 5. A `const` Binding That Refers to an Object

Which statement best explains this output?

```js
function createStatusReader() {
  const record = { status: 'queued' };
  const read = () => record.status;
  record.status = 'finished';
  return read;
}

console.log(createStatusReader()());

// Expected output:
// finished
```

- A. Closures make every `const` declaration behave like `let`.
- B. `const` fixes the binding, but the referenced object's properties can change.
- C. The closure copied the object and then updated both copies automatically.
- D. Objects become immutable only after their defining function returns.

**Answer: B.** The binding still points to the same object. Updating a property does not reassign `record`, and the reader observes that object's current property value.

## 6. Closure Creation and the Temporal Dead Zone

What happens here?

```js
function demonstrateInitialization() {
  const read = () => count;
  try {
    read();
  } catch (error) {
    console.log(error.name);
  }

  let count = 2;
  console.log(read());
}

demonstrateInitialization();

// Expected output (check after answering):
// ReferenceError
// 2
```

- A. Creating `read` throws, so no output occurs.
- B. The first call returns `undefined`; the second returns `2`.
- C. Both calls throw because a closure permanently captures an uninitialized state.
- D. The first call throws; the second reads `2` after initialization.

**Answer: D.** Creating the function does not execute its body. The first call tries to read the local `count` before its declaration has initialized it, so it throws. The second reads the same binding after initialization. See [MDN's temporal dead zone explanation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let#temporal_dead_zone_tdz).

## 7. Separate Bindings, Shared Data

Two calls to `createReader(config)` each return `() => config.region`. Both receive the same mutable object. What happens if outside code changes that object's `region` property?

- A. Both readers see the change, because separate parameter bindings can reference the same object.
- B. Neither sees the change, because factory calls clone argument objects.
- C. Only the second reader sees the change, because it was created later.
- D. Both throw, because changing captured objects violates lexical scope.

**Answer: A.** A new parameter binding is created on each call, but the object reference passed into it can be identical. To preserve an initial string value, the factory could read `config.region` once into another local binding and have the reader use that local.

## 8. A Once Wrapper's Result Flag

A synchronous wrapper must reuse the first successful return value, including `undefined`. Why is checking only whether `result !== undefined` insufficient?

- A. JavaScript cannot store `undefined` in a closure.
- B. Every return of `undefined` indicates a thrown exception.
- C. It cannot distinguish “not completed” from “completed with undefined.”
- D. Reading the result empties the captured binding.

**Answer: C.** Completion and result are distinct pieces of state. Store a separate completion state, mark it only on a normal return, and define how errors change it. A truthiness check would also mishandle `0`, `false`, `null`, and an empty string.

## 9. Retaining a Large Object

A long-lived registry holds a callback that needs a large local object from a completed factory call. Which statement is accurate?

- A. Returning from the factory guarantees the object is immediately collected.
- B. The callback can keep the needed state reachable; removing all retaining paths is what matters for collection eligibility.
- C. Every closure leaks, even if nothing refers to it.
- D. Assigning `null` to any one variable always forces collection immediately.

**Answer: B.** A callback can extend the lifetime of data it needs. Dropping one reference helps only if no other retaining paths remain. Eligibility for collection is different from a promise about when the collector will run.

## 10. Retry After a Throw

A `onceSuccessful` wrapper retries after thrown exceptions. Its operation changes an external record and then throws before returning. What can the wrapper guarantee?

- A. The external change is rolled back automatically.
- B. The external record can only change once, regardless of retries.
- C. The exception becomes a cached successful return value.
- D. Another attempt is allowed; preventing duplicate external effects requires a separate design.

**Answer: D.** The wrapper's state only tracks whether its operation returned normally. It does not undo effects performed before an exception. A retry contract must fit the operation being wrapped.
