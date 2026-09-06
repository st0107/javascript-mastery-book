# Exercises and Coding Challenges

Work through these four exercises in order. First predict the output and draw the relevant bindings. Then write your implementation before comparing it with the solution. Each JavaScript block below is independently runnable; intentional failures are caught so the rest of the example completes.

The matching assertion-based program is [`example-03-closure-challenges.js`](../../../code/volume-2/chapter-01/example-03-closure-challenges.js). Run it from the repository root with `node code/volume-2/chapter-01/example-03-closure-challenges.js`.

## Exercise 1: Keep Configuration Independent of the Caller

**Prompt and contract:** Implement `createRegionReader(region)` so it returns a zero-argument function that always reads the factory invocation's `region` parameter. For this exercise, callers supply strings. A different `region` local in a caller must not affect the result. Create two readers and prove their configuration is independent.

**Hint:** Return a function that reads the parameter directly. Do not store configuration in a module-level variable or look it up on the caller.

**Solution:**

```js
function createRegionReader(region) {
  return () => region;
}

function invokeFromAnotherRegion(reader) {
  const region = 'eu-west';
  return `${region} -> ${reader()}`;
}

const readPrimary = createRegionReader('ap-south');
const readSecondary = createRegionReader('us-east');

console.log(invokeFromAnotherRegion(readPrimary));
console.log(readSecondary());
console.log(readPrimary());

// Expected output:
// eu-west -> ap-south
// us-east
// ap-south
```

**Why it works:** Each call to `createRegionReader` creates a separate parameter binding. The returned function retains access to that invocation's binding. Calling it inside `invokeFromAnotherRegion` does not change that relationship.

**Complexity:** Factory construction and each reader call take `O(1)` time and add `O(1)` bookkeeping space. Each reader retains its configured string; retained input data is separate from this bookkeeping. Formatting the demonstration string takes time and space proportional to the resulting text length.

**Alternative:** Pass the region explicitly on every call to an ordinary function. That is simpler when there is no need to package configuration into a reusable callback. The closure is useful when an API expects a zero-argument callback but configuration must remain associated with it.

## Exercise 2: Share State Within One Tracker, Isolate Different Trackers

**Prompt and contract:** Implement `createAttemptTracker()` returning `increment`, `read`, and `reset`. A tracker starts at zero. `increment` adds one and returns the new count; `read` returns it without changing it; `reset` sets it to zero. Extracted functions must still work. Two factory calls must not share a count. Limit use to counts representable as safe integers; arbitrary-precision counters are outside this exercise.

**Hint:** Declare one `let attempts` inside the factory, outside all three returned functions. Do not create the count inside `increment` and do not place it outside the factory.

**Solution:**

```js
function createAttemptTracker() {
  let attempts = 0;

  return {
    increment() {
      attempts += 1;
      return attempts;
    },
    read() {
      return attempts;
    },
    reset() {
      attempts = 0;
    }
  };
}

const upload = createAttemptTracker();
const download = createAttemptTracker();
const incrementUpload = upload.increment;

console.log(incrementUpload());
console.log(upload.increment());
console.log(upload.read(), download.read());
upload.reset();
console.log(upload.read(), download.increment());

// Expected output:
// 1
// 2
// 2 0
// 0 1
```

**Why it works:** The three functions from one call share one `attempts` binding. Returning an object groups the functions; it does not move `attempts` into an object property. The methods do not use `this`, so extracting `increment` does not change where it finds the count.

**Complexity:** Construction and each operation take `O(1)` time. Each tracker retains `O(1)` state and a fixed number of functions. Creating `n` trackers takes `O(n)` time and retained space.

**Alternative:** Store a public `attempts` property on an object and update it through methods. That makes inspection easier but permits outside code to change the property. A class with a private field offers another encapsulation design, covered later in the book; compare API ownership and per-instance function allocation before choosing.

## Exercise 3: Repair Callbacks Created in a Loop

**Prompt and contract:** Build an array of zero-argument readers for a supplied array of string labels. Reader `k` must return the label at position `k` as it was when the readers were created. Later edits to the input array must not change those saved labels. Support an empty array. Explain the failure in the legacy version below, then fix both its shared index and its dependency on later array contents.

**Hint:** A `let` loop index fixes index sharing, but a reader that still evaluates `labels[index]` sees later mutations to the array. Capture the current string in a block-local binding inside the loop body.

**Solution and failure demonstration:**

```js
function buildLegacyReaders(labels) {
  const readers = [];
  // Deliberate legacy bug: the callbacks share one function-scoped index.
  for (var index = 0; index < labels.length; index += 1) {
    readers.push(() => labels[index]);
  }
  return readers;
}

function buildLabelReaders(labels) {
  const readers = [];
  for (let index = 0; index < labels.length; index += 1) {
    const label = labels[index];
    readers.push(() => label);
  }
  return readers;
}

const labels = ['Queued', 'Running', 'Finished'];
const broken = buildLegacyReaders(labels);
const readers = buildLabelReaders(labels);

console.log(broken.every(read => read() === undefined));
labels[0] = 'Cancelled';
console.log(readers.map(read => read()).join(', '));
console.log(buildLabelReaders([]).length);

// Expected output:
// true
// Queued, Running, Finished
// 0
```

**Why it works:** When the legacy readers run, their shared index equals the original array length, so each access is outside the populated range. The corrected loop creates a fresh `label` binding on each body execution and stores the current string value there. Each reader uses that binding, so replacing an input-array element has no effect on the saved string. The `let` loop initializer also supplies separate iteration bindings for `index`, although these readers only need `label`.

**Complexity:** For `n` labels, construction takes `O(n)` time and creates `O(n)` functions and bindings. Each reader takes `O(1)` time. The saved strings remain reachable through the readers; their payload sizes are additional retained data. Producing the joined display string takes time and space proportional to its total output length.

**Alternative:** `labels.map(label => () => label)` uses a separate callback invocation and parameter binding for each present array element. For the dense string arrays in this exercise it has the same behavior. If labels were objects, either version would save references, so object mutation would remain visible unless the contract required and implemented an appropriate copy.

## Exercise 4: Build a Synchronous Once-Successful Wrapper

**Prompt and contract:** Implement `onceSuccessful(operation)`. It accepts a synchronous function that does not depend on a `this` receiver. The wrapper forwards its arguments on each attempt until one attempt returns normally. It then returns that exact saved value on every subsequent call, without invoking `operation` again. Later arguments are ignored after success.

The contract includes these edge cases:

- Every normal return is success, including `undefined`, `null`, `false`, and `0`.
- A thrown value is rethrown unchanged and leaves the wrapper available for retry.
- A recursive call to the same wrapper while its operation is running throws an `Error` with the message `Initialization is already running.`.
- A non-function argument to the factory throws a `TypeError`.
- Separate wrappers retain separate state. An object result is reused by reference.

Promises and asynchronous operations are outside this exercise's contract.

**Hint:** Store `state` separately from `result`. Set `done` only after the operation returns. In the error path, restore `ready` before rethrowing. Check for `running` before starting another attempt.

**Solution:**

```js
function onceSuccessful(operation) {
  if (typeof operation !== 'function') {
    throw new TypeError('operation must be a function.');
  }

  let state = 'ready';
  let result;

  return (...args) => {
    if (state === 'done') return result;
    if (state === 'running') {
      throw new Error('Initialization is already running.');
    }

    state = 'running';
    try {
      result = operation(...args);
      state = 'done';
      return result;
    } catch (error) {
      state = 'ready';
      throw error;
    }
  };
}

let attempts = 0;
const initialize = onceSuccessful(region => {
  attempts += 1;
  if (attempts === 1) throw new Error('Configuration unavailable.');
  return { region };
});

try {
  initialize('ap-south');
} catch (error) {
  console.log(error.message);
}

const configuration = initialize('eu-west');
console.log(configuration.region, attempts);
console.log(initialize('us-east') === configuration, attempts);

let emptyCalls = 0;
const initializeEmpty = onceSuccessful(() => {
  emptyCalls += 1;
  return undefined;
});
console.log(initializeEmpty(), initializeEmpty(), emptyCalls);

let nested;
nested = onceSuccessful(() => nested());
try {
  nested();
} catch (error) {
  console.log(error.message);
}

// Expected output:
// Configuration unavailable.
// eu-west 2
// true 2
// undefined undefined 1
// Initialization is already running.
```

**Why it works:** Each wrapper closes over its own `state`, `result`, and operation. On a normal return, saving the result and marking the state `done` establishes the cache. On a throw, the operation's return assignment has not completed, and the catch block restores retryability. The separate state prevents an `undefined` result from being mistaken for a cache miss.

The recursive-call guard also has an explicit meaning: a nested call cannot start another operation while this wrapper is running. If that error escapes the operation, the outer attempt resets to `ready`. If the operation catches the nested error and returns normally, that normal return is still a successful attempt.

**Complexity:** The closure adds `O(1)` retained bookkeeping plus the saved result and anything reachable through it. For `a` arguments, each call creates a rest-parameter array with `O(a)` time and temporary space in the source-level cost model; a successful cached call avoids the operation but still enters this wrapper. An uncached attempt additionally pays the operation's own time and space costs. With a fixed number of arguments, wrapper overhead is `O(1)` per call.

**Alternative:** A “once attempted” wrapper can set its completed flag before invoking the operation, preventing retries after failure. That is a different contract and must define what later calls return or throw. Neither version guarantees exactly-once external side effects: an operation can perform an effect and then fail before returning. Use this wrapper only when its retry policy matches the operation's behavior.

**Additional checks:** The companion script verifies thrown-value identity, cached falsy values, argument forwarding, independence, and successful recovery after an uncaught recursive-call error. These are observable contracts; implementation-specific environment allocation is not part of the assertions.
