# Production Examples

Closures are useful when one operation creates context that later operations must share. The design question is which bindings should be shared, and for how long. These examples give different answers: one logger keeps stable metadata for one request; one store deliberately shares changing state among several methods.

## Example 1: A Request Logger With Stable Context

An HTTP service often processes request A, starts work for request B, and then finishes A. A module-level variable named `currentRequestId` cannot represent both requests correctly. Passing a logger created for each request gives every callback an explicit connection to the right metadata.

The complete implementation and assertions are in `code/volume-2/chapter-01/example-01-request-logger.js`. Run it from the repository root:

```sh
node code/volume-2/chapter-01/example-01-request-logger.js
# Expected output:
# req-a POST /orders started
# req-b GET /orders/:id started
# req-a POST /orders completed
# request logger assertions passed
```

This shorter, independently runnable version shows the closure mechanism. Its metadata is already validated application data; the full file also enforces the input contract.

```js
'use strict';

function createRequestLogger({ requestId, method, route }, sink) {
  return function log(event) {
    const record = Object.freeze({ requestId, method, route, event });
    return sink(record);
  };
}

const records = [];
const sink = record => records.push(record);
const request = { requestId: 'req-a', method: 'POST', route: '/orders' };
const logA = createRequestLogger(request, sink);
const logB = createRequestLogger(
  { requestId: 'req-b', method: 'GET', route: '/orders/:id' },
  sink
);

request.requestId = 'changed-after-creation';
logA('started');
logB('started');
logA('completed');

for (const record of records) {
  console.log(`${record.requestId} ${record.event}`);
}

// Expected output:
// req-a started
// req-b started
// req-a completed
// Per log call: O(1) record construction, excluding the sink.
// This demo's collecting sink retains O(n) records for n calls.
```

### Execution and Memory

1. Calling the factory creates parameter bindings for the primitive metadata and the sink function.
2. The returned `log` function uses those bindings after the factory returns.
3. A second factory call creates another set of bindings. Both loggers can deliberately use the same sink without sharing their request identifiers.
4. Changing a property on the original request object does not reassign the factory's string bindings.
5. Each call builds a new record, then invokes the captured sink.

The explicit metadata snapshot comes from reading primitive properties when the factory runs. Closures themselves do not automatically snapshot values. If the function instead read `request.requestId` at logging time, later mutations of that object would be visible.

The logger's necessary references are the selected strings and the sink. Its body never reads the original request object. This reduces unnecessary ownership of request data, but it is not a promise about an engine's exact environment allocation. The language defines the observable bindings; engine memory representation is a separate concern, discussed in [Performance and Security Notes](10-performance-security.md).

### Contract and Production Boundaries

The full example accepts a metadata object containing a bounded identifier, an uppercase method, and a bounded route template. Events are bounded identifiers such as `payment.authorized`. The sink receives only the four named fields, so extra request properties are not copied into logs. Use a route template such as `/orders/:id`, not a URL containing customer information or query parameters. The validator checks shape; the caller still owns the meaning of the data.

The sink is injected so the same logger can write to a test array, structured console output, or an application logging adapter. A synchronous sink exception propagates to the caller. A sink return value, including a promise, is returned unchanged; callers using an asynchronous sink must handle its result. The logger does not supply retries, buffering, or backpressure.

This pattern requires passing the logger to work that needs it. It does not automatically attach context to unrelated callbacks. Node.js also provides `AsyncLocalStorage` to propagate context through asynchronous operations; that is a host facility with its own lifecycle, rather than an extra rule of lexical scope. See the [Node.js asynchronous context documentation](https://nodejs.org/api/async_context.html#class-asynclocalstorage).

## Example 2: A Store With Private State and Subscriptions

A settings panel and a preview pane need to observe the same current preference. A store factory can keep the current value and subscription registry in local bindings, while returning only the operations its callers need.

The complete implementation is in `code/volume-2/chapter-01/example-02-subscription-store.js`. It is deliberately synchronous so notification order can be stated precisely.

```sh
node code/volume-2/chapter-01/example-02-subscription-store.js
# Expected output:
# panel light -> dark
# current dark
# subscription store assertions passed
```

The following complete version has the same public behavior as the executable file:

```js
'use strict';

function createSubscriptionStore(initialValue) {
  let value = initialValue;
  let notifying = false;
  const subscriptions = new Set();

  function read() {
    return value;
  }

  function subscribe(listener) {
    if (typeof listener !== 'function') {
      throw new TypeError('listener must be a function');
    }

    const subscription = { listener };
    subscriptions.add(subscription);

    return function unsubscribe() {
      subscriptions.delete(subscription);
    };
  }

  function update(nextValue) {
    if (notifying) {
      throw new Error('update cannot run during notification');
    }
    if (Object.is(value, nextValue)) return value;

    const previousValue = value;
    const snapshot = [...subscriptions];
    const errors = [];
    value = nextValue;
    notifying = true;

    try {
      for (const { listener } of snapshot) {
        try {
          listener(nextValue, previousValue);
        } catch (error) {
          errors.push(error);
        }
      }
    } finally {
      notifying = false;
    }

    if (errors.length > 0) {
      throw new AggregateError(errors, 'Subscriber notification failed');
    }
    return value;
  }

  return Object.freeze({ read, subscribe, update });
}

const preferences = createSubscriptionStore('light');
const unsubscribe = preferences.subscribe((next, previous) => {
  console.log(`panel ${previous} -> ${next}`);
});

preferences.update('dark');
preferences.update('dark');
unsubscribe();
unsubscribe();
console.log(`current ${preferences.read()}`);

// Expected output:
// panel light -> dark
// current dark
// A changed update uses O(s) bookkeeping time and temporary space
// for s subscriptions, plus the work performed by the listeners.
```

### Which Functions Share Which Bindings?

`read` and `update` share the `value` binding. Reassigning it in `update` changes what a later `read` returns. `subscribe` and `update` share the subscription set. Each `unsubscribe` additionally closes over the unique registration object created by its own `subscribe` call.

Two calls to `createSubscriptionStore` create independent bindings and registries. Two subscriptions within one store share that store, but have different registration objects. Registering the same function twice therefore creates two notifications and two independently removable registrations.

The frozen API object prevents callers from replacing its methods. It does not freeze the stored value, copy returned objects, or prevent the closure from assigning a new value internally. `read()` returns the current value directly. For objects, callers must treat that reference as read-only and pass a new object to `update`. A private binding is compatible with a publicly reachable object.

### Notification Rules Are Part of the API

| Situation | Defined behavior |
| --- | --- |
| `Object.is(current, next)` is true | No assignment or notification; return the current value. |
| A changed value arrives | Commit it before invoking listeners. Each listener receives `(next, previous)`. |
| A listener calls `read()` | Return the committed new value. |
| A listener is added during dispatch | Its first possible notification is a later changed update. |
| A listener is removed during dispatch | It still receives this dispatch if it was in the snapshot. Later dispatches omit it. |
| An unsubscribe function is called repeatedly | Calls after the first have no further effect. |
| A listener throws synchronously | Continue through the snapshot, then throw one `AggregateError` containing the failures. State stays committed. |
| A listener calls `update()` | Reject the nested update, even if it would be a no-op. An uncaught rejection becomes a collected subscriber error. |

Taking a snapshot costs an allocation, but gives registration changes predictable timing. Without that contract, one callback could add another callback that unexpectedly runs in the middle of the same update.

Rejecting nested updates avoids a second problem: listener A publishing a newer value while listener B is still receiving an older notification. A larger store could queue updates or batch them, but it would need a separate ordering contract. Here, a follow-up update must happen after the original call finishes.

The error policy means a thrown `update` does not always mean that the update failed to commit. Catching `AggregateError` should lead to inspecting notification failures, not blindly retrying the state transition. This store has no transaction rollback. Listeners must be synchronous: returned promises are ignored, and asynchronous rejections are outside the collector's contract.

### Why `Object.is` Matters

The store treats `NaN` followed by `NaN` as unchanged, and positive zero followed by negative zero as changed. Objects compare by identity: mutating the current object and passing it back cannot announce a change. These choices are visible API behavior, so the executable file asserts each one.

## Best Practices

- Give each logical owner its own factory call: a request logger per request, a store per intended shared state lifetime.
- Decide explicitly whether a callback needs current state, a captured primitive, or an owned object copy.
- Document when state commits and what a thrown callback means.
- Pair every subscription with a lifecycle owner that calls its unsubscribe function and releases it afterward.
- Keep transport, persistence, and authorization decisions at their proper boundaries; a closure does not implement them automatically.

Use a closure when related operations benefit from a small shared environment. A plain function is enough when every call already receives all its data. A larger store library may be appropriate when the application needs coordinated asynchronous updates, history, persistence, or complex rendering integration.
