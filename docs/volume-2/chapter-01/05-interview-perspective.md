# Interview Perspective

A strong closure answer identifies the function, the binding it reads, and the environment that owns that binding. Then explain whether another function can change the same binding. This gives the interviewer a prediction they can check against execution.

## 1. Does a Function Read Variables from Its Caller?

**Question:** A callback is passed into a function that declares a variable with the same name as one used by the callback. Which variable does the callback read?

**Answer:** An ordinary lexical identifier is resolved through the environments surrounding the callback's definition. Passing that function elsewhere does not replace its surrounding environment with the caller's locals.

```js
function createRegionReader(region) {
  return () => region;
}

function runInRegion(readRegion) {
  const region = 'eu-west';
  return `${region} calls ${readRegion()}`;
}

const readRegion = createRegionReader('ap-south');
console.log(runInRegion(readRegion));

// Expected output:
// eu-west calls ap-south
```

**Reasoning:** `runInRegion` reads its own `region`. The arrow reads the parameter binding created by the earlier `createRegionReader` invocation. The two bindings happen to have the same spelling; they are separate storage locations in the language's execution model.

**Follow-up:** How would you make the reader use the caller's region deliberately? Pass the region as an argument to a function designed to accept it. Avoid adding a hidden dependency on a global variable.

## 2. Does a Closure Capture a Snapshot or a Binding?

**Question:** Why does a function created before an assignment sometimes return the new value?

**Answer:** The function retains access to the binding. A later read observes that binding's current value. To preserve an earlier primitive value, copy it into a separate binding and close over that binding.

```js
function createStatus() {
  let status = 'queued';
  const initialStatus = status;

  return {
    read: () => status,
    readInitial: () => initialStatus,
    finish: () => { status = 'finished'; }
  };
}

const task = createStatus();
task.finish();
console.log(task.read());
console.log(task.readInitial());

// Expected output:
// finished
// queued
```

**Reasoning:** Both readers were created during the same invocation, but they read different bindings. Assigning to `status` does not assign to `initialStatus`.

**Follow-up:** Would copying an object into `const initialStatus` create an independent object snapshot? No. Copying an object reference gives both bindings access to the same object. Choose a copy strategy based on the data's structure and ownership; `const` prevents binding reassignment, not object mutation.

## 3. When Do Closures Share State?

**Question:** A factory returns `increment` and `read`. Do they share a counter? What happens when the factory runs twice?

**Answer:** Closures created in one factory invocation can access that invocation's same counter binding. Another invocation creates another local binding, even though it executes the same source code.

```js
function createAttemptTracker() {
  let attempts = 0;
  return {
    increment: () => { attempts += 1; },
    read: () => attempts
  };
}

const upload = createAttemptTracker();
const download = createAttemptTracker();
const readUpload = upload.read;

upload.increment();
upload.increment();
console.log(readUpload(), download.read());

// Expected output:
// 2 0
```

**Reasoning:** Extracting `upload.read` into another variable preserves the function's lexical environment. It still reads the binding modified by `upload.increment`. No method receiver is needed for this API because neither function reads `this`.

**Follow-up:** What if the factory receives an object and two calls receive the same object? The parameter bindings are separate, but their values can reference the same object. Independent environments do not guarantee independent mutable data.

## 4. Why Does a Loop Sometimes Produce Identical Callback Results?

**Question:** Explain the difference between the two lists below without discussing timers.

```js
function buildReaders() {
  const shared = [];
  const separate = [];

  // Deliberate legacy example: every callback reads one function-scoped i.
  for (var i = 0; i < 3; i += 1) {
    shared.push(() => i);
  }

  for (let index = 0; index < 3; index += 1) {
    separate.push(() => index);
  }

  return { shared, separate };
}

const { shared, separate } = buildReaders();
console.log(shared.map(read => read()).join(', '));
console.log(separate.map(read => read()).join(', '));

// Expected output:
// 3, 3, 3
// 0, 1, 2
```

**Answer and reasoning:** The `var` callbacks share one `i` binding, whose final value is `3`. In the second loop, the `let` declaration in the initializer gives the body a distinct binding for each iteration. Each callback therefore reads its own iteration's `index`. The difference is binding identity; delayed execution only makes that difference easier to notice. See [MDN's explanation of lexical declarations in a `for` loop](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for#lexical_declarations_in_the_initialization_block).

**Follow-up:** Is changing an outer declaration from `var index` to `let index` sufficient? No. If the `let` declaration remains outside the loop, callbacks still share that one binding. Put the declaration in the loop initializer or create a separate binding inside each body execution.

**Complexity:** With `n` iterations, each list takes `O(n)` time to construct and `O(n)` space for its functions; invoking all readers takes `O(n)` time. A single reader takes `O(1)` time. Sharing a binding does not eliminate the cost of creating all the functions.

## 5. Does Returning from a Function Destroy Its Local State?

**Question:** A factory has returned, yet its callback still reads a local array. Is the factory's stack frame still running?

**Answer:** No. Its call has completed. Reachable functions can retain access to the state they require from the enclosing lexical environment. An active call stack and retained state have different lifetimes.

**Reasoning:** Draw the owner holding the callback, the callback retaining access to its environment, and the binding referencing the array. That chain explains why the array may remain reachable. The language model does not require an engine to preserve a literal stack frame or allocate every local variable in a fixed physical layout.

**Follow-up:** Does every closure cause a memory leak? No. Retention becomes a problem when an owner holds the callback longer than intended, or the callback retains unnecessarily large data. Release subscriptions, listeners, or cached functions when their owner no longer needs them. Garbage collection timing is not a correctness signal, and clearing one reference is insufficient if other paths remain.

**Production implication:** Prefer retaining the small identifier actually needed by a callback when keeping the full request object would unnecessarily extend the lifetime of its payload. Confirm a suspected retention issue with heap evidence before changing an API.

## 6. How Would You Design a Synchronous Once Wrapper?

**Question:** An initializer should cache its first successful return value. It may return `undefined` or throw. What must the closure remember?

**Answer:** It needs a completion state separate from the result. A result of `undefined`, `false`, or `0` can still represent success. Under a retry-after-error contract, a thrown exception must leave the wrapper ready for another attempt.

**Reasoning:** State changes should reflect the operation's outcome: `ready` becomes `running`, then `done` after a normal return, or `ready` after an exception. A `running` check can reject recursive calls to the wrapper before they invoke the operation again. Document that the wrapper accepts a synchronous function whose behavior does not depend on `this`.

**Follow-up:** Is this equivalent to exactly-once execution of an external side effect? No. A function might change external state and then throw. A retry can repeat that change. The wrapper only controls calls and cached results inside this JavaScript instance; it cannot roll back an external effect.

**Follow-up:** What if the operation returns an object? Later callers receive the same object reference under this contract. Decide whether that shared object is acceptable. This is separate from the closure's private bookkeeping.

Implement and test the state transitions in [Exercise 4](./06-exercises-coding-challenges.md#exercise-4-build-a-synchronous-once-successful-wrapper).

## An Answer Checklist

- Identify where each function is defined and where each relevant binding is declared.
- Separate sharing a binding from sharing an object referenced by different bindings.
- Trace creation, mutation, invocation, and retention in that order.
- State an API's failure and ownership contracts before claiming it is safe to reuse.
- Keep engine implementation guesses separate from observable JavaScript behavior.
