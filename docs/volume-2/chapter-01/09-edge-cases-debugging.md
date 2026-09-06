# Edge Cases, Debugging, and Failure Modes

Most closure bugs come from answering one of these questions incorrectly: which binding is being read, when is it being read, and who still owns a reference to the function? Establish those facts before changing the code.

The five runnable examples below are also collected, with assertions, in `code/volume-2/chapter-01/example-04-edge-cases.js`. Run that file with Node.js from the repository root to check their outputs together.

## A Live Binding and an Old Derived Value Can Coexist

An obsolete message does not necessarily mean that a closure copied the current state. The code may have computed a separate value earlier.

```js
'use strict';

function createProgress() {
  let completed = 0;
  const initialMessage = `Completed ${completed}`;
  return {
    finishOne() { completed += 1; },
    readCount() { return completed; },
    readInitialMessage() { return initialMessage; },
    readCurrentMessage() { return `Completed ${completed}`; }
  };
}

const progress = createProgress();
progress.finishOne();
console.log(progress.readCount());
console.log(progress.readInitialMessage());
console.log(progress.readCurrentMessage());

// Expected output:
// 1
// Completed 0
// Completed 1
```

All four methods belong to the same factory invocation. The first message is a string computed once; its binding is never reassigned. The current message is computed each time from the changing count. Fix this by deciding whether the API promises a historical message or a current view, then compute it at the appropriate time.

## Creating a Closure Does Not Read Every Referenced Binding

It is valid to create a function before a referenced `let` or `const` declaration initializes its binding. Invoking that function too early is the problem.

```js
'use strict';

function inspectInitialization() {
  const readStatus = () => status;

  try {
    readStatus();
  } catch (error) {
    console.log(error.name);
  }

  let status = 'ready';
  return readStatus;
}

console.log(inspectInitialization()());

// Expected output:
// ReferenceError
// ready
```

Before the declaration executes, `status` is in its temporal dead zone. After initialization, the same function can read it. A callback API that invokes a callback immediately can expose this problem even if a similar asynchronous API appeared to work. Do not rely on a timer to conceal an initialization dependency; initialize required data before handing out a callback.

## Per-Iteration Bindings Do Not Clone Referenced Objects

A `let` loop variable gives each iteration its own binding. That solves the familiar shared-`var` callback bug. It does not produce copies of every object referenced inside the loop.

```js
'use strict';

const sharedTask = { status: 'queued' };
const callbacks = [];

for (let index = 0; index < 2; index += 1) {
  const task = sharedTask;
  callbacks.push(() => `${index}:${task.status}`);
}

sharedTask.status = 'done';
console.log(callbacks.map(callback => callback()).join(', '));

// Expected output:
// 0:done, 1:done
// For n callbacks: O(n) construction and invocation time; O(n) storage.
```

The indices differ because their bindings differ. Both `task` bindings contain a reference to the same object. If the requirement is to preserve the earlier status, copy the primitive status during each iteration. If the requirement is to track current status, sharing the object is intentional.

## A Private Binding Can Expose a Mutable Object

Ordinary callers cannot look up a local binding as a property on the returned API. They can still modify an object that the API returns.

```js
'use strict';

function createPreferences() {
  const preferences = { theme: 'light' };
  return {
    read() { return preferences; }
  };
}

const api = createPreferences();
const exposed = api.read();
exposed.theme = 'dark';
console.log(api.read().theme);
console.log(Object.hasOwn(api, 'preferences'));

// Expected output:
// dark
// false
```

Choose an ownership policy explicitly. Returning a primitive is simple. Returning a copy creates a separate object but a shallow copy still shares nested objects. Freezing a flat object can enforce a limited read-only interface; freezing only the outer object does not recursively freeze its contents. For the chapter's subscription store, immutable updates are a caller contract, and the executable assertions demonstrate the same-reference mutation hazard.

## An `await` Boundary Can Make a Captured Snapshot Obsolete

This is an optional preview of asynchronous JavaScript, which later chapters develop in full. An `async` function returns a promise; `await` suspends that function and resumes it through a later continuation once the awaited promise settles. `Promise.all` waits for both task calls to complete here. You can follow the scope lesson by tracking the two reads that happen before either suspended call resumes.

Closures give callbacks access to bindings. They do not make a sequence that crosses `await` atomic.

```js
'use strict';

async function demonstrateLostUpdate() {
  let completed = 0;

  async function finishTask() {
    const before = completed;
    await Promise.resolve();
    completed = before + 1;
  }

  await Promise.all([finishTask(), finishTask()]);
  console.log(completed);
}

demonstrateLostUpdate().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

// Expected output in Node.js:
// 1
```

Each call reads zero before either continuation runs. The first continuation writes one; the second also writes one. Both use the same outer `completed` binding, but each has its own `before` snapshot. This is an ordering bug within one JavaScript agent, not evidence that the callbacks ran at the same instant.

For this counter, reading and incrementing `completed` together after the `await` avoids the lost update because no suspension separates those two steps. More complicated operations may require a version check, an explicit queue, or a transaction in the system that owns the data. A closure by itself does not coordinate other processes or database writers.

## Notification Failures Can Happen After State Commits

In [Production Examples](04-production-examples.md), the store commits a changed value before notifying its snapshot of listeners. If one subscriber throws, remaining subscribers still run and the outer call finally throws `AggregateError`. The value remains committed.

Three consequences deserve explicit checks during an incident:

1. Inspect `read()` before retrying an update that threw. A notification error is different from rejecting the state change.
2. Inspect the aggregate's `errors` array. A failed nested `update` may be the underlying cause.
3. Check whether an unsubscribed listener was already included in the active snapshot. Removal prevents later dispatches; it does not erase an already scheduled call within this dispatch.

The runnable store file tests state visibility inside callbacks, add/remove timing, duplicate registrations, error aggregation, recovery after errors, and nested-update rejection. These are the API's chosen semantics; closures make the shared state possible but do not dictate those decisions.

## Cleanup Does Not Mean Immediate Collection

An unsubscribe function removes one registry entry. It does not force garbage collection or remove every other reference to the callback. The active dispatch snapshot may still hold a reference until that dispatch finishes. A caller that stores the unsubscribe function indefinitely also keeps a closure with its own references alive.

For a browser component, repeatedly mounting and unmounting should not leave a growing collection of active listeners. To investigate retained DOM objects, use heap snapshots and inspect their retaining references. Chrome's memory tools can identify detached elements still referenced by JavaScript. See [Chrome DevTools: Fix memory problems](https://developer.chrome.com/docs/devtools/memory-problems).

Do not interpret a cycle alone as a leak. The useful question is whether a reachable owner still holds a path to data that the application no longer needs. For the store, that owner could be a long-lived store, a registration array in application code, or a saved cleanup function.

## Debugging Playbook

1. Write the factory call that created the failing callback. Give separate calls separate labels.
2. List only the bindings used by that callback. Mark each as a primitive, an object reference, or a derived snapshot.
3. Record when each binding initializes and when each assignment occurs.
4. Trace invocation order, including immediate callbacks, `await` boundaries, and nested calls.
5. For retention problems, identify the owner holding the function and verify that owner's cleanup path.
6. Turn the discovered contract into an assertion: an exact event order, a stable request ID, a committed value after failure, or absence of a later notification.

When possible, log primitive values or deliberately serialized records for a reproduction. Expanding a previously logged object in a developer console can encourage confusion about when you observed its contents. The strongest evidence is an assertion made at the precise point where the contract matters.
