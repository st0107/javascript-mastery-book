# Professional Field Guide

## Start With the Invocation Contract

Before passing a function elsewhere, finish this sentence: "The receiver for this operation comes from ___." It may come from a property call, an API's documented `thisArg`, a bound function, or the lexical context of an arrow. If the operation needs no receiver, explicit arguments can make the dependency clearer.

Then identify who stores the function and when that ownership ends. A correct receiver does not guarantee correct cleanup, and a removable callback can still invoke the wrong object.

| Requirement | A useful starting design | Review question |
| --- | --- | --- |
| Invoke a reusable method once with another object | `call` with explicit arguments or `apply` with an array-like collection | Does the target accept this receiver's state and invariants? |
| Pass an instance method to a callback API | One stored bound function or a stored wrapper | Which object owns callback removal? |
| Use a supported callback receiver parameter | Pass an ordinary callback and the documented `thisArg` | Does this exact API accept it in that position? |
| Observe future method replacement | A wrapper that looks up the method when invoked | Is the referenced object stable, and may the property become non-callable? |
| Preserve the currently selected method | Bind that function once | Should a later replacement affect existing consumers? |
| Share behavior across many objects | A prototype method invoked with a suitable receiver | Where do methods leave ordinary property-call usage? |
| Model an operation as data transformation | A function with explicit inputs | Does hidden instance context provide any benefit here? |

These are starting points for a contract. Choosing the shortest expression does not answer lookup timing, identity, or lifetime questions.

## Case Study: A Worker Callback Loses Its Client

A job runner accepts `client.send` and later invokes it as a plain callback. Direct calls to `client.send(payload)` pass their tests, but the job fails when `send` reads `this.transport`. The failing boundary is the handoff: a function value crossed into an API that did not preserve its original property reference.

First inspect the runner's callback contract. It may supply its own receiver or no useful receiver at all. Bind the selected method to the client when the job is created, or use a wrapper that explicitly calls `client.send(payload)`. Pick the wrapper only if looking up the method later is the intended behavior.

Avoid making the transport a module-wide variable merely to remove `this`. Multiple clients may have different transports or credentials. That change could make one client's operation use another client's state.

Verify the repair with two clients whose transports record separate outputs. Invoke their callbacks in interleaved order. If the transport throws, confirm that the failure remains observable through the runner's documented error path. Receiver adaptation should not accidentally swallow an exception or drop a returned promise.

Also decide how long a queued job may keep its client alive. A correctly bound function retains context even if the original owner considers the client disposed. The operation needs its normal disposal or validity checks when invoked.

## Case Study: A Panel Refreshes After It Closes

A panel registers `this.refresh.bind(this)` when it opens. Its close path calls removal with a fresh `this.refresh.bind(this)`. Both expressions look equivalent in a code review, but each produces a different function. The original listener remains registered and still reaches the old panel.

Store the callback once for the registration's lifetime. Use it for both registration and removal, with matching event type and relevant options. If the API supplies a cleanup token, keep that token instead of reconstructing a callback during cleanup.

Check the lifecycle through observable behavior:

1. Open the panel and emit one update; expect one refresh.
2. Close the panel and emit another update; expect none.
3. Close it again; expect cleanup to remain safe under the chosen API.
4. Reopen and emit an update; expect one active registration, not two.
5. Open two panels and close one; the other must continue receiving updates.

Those checks detect identity mistakes and shared-state mistakes. Heap investigation is useful if panels still accumulate after the behavior is correct; another owner may retain a callback or the panel itself.

The standalone [listener example](09-edge-cases-debugging.md#repeated-binding-breaks-listener-removal) demonstrates the identity failure without relying on timers or a UI framework.

## Case Study: A Test Spy Misses a Real Call

A service binds `this.write` during construction. A test replaces `service.write` with a spy after creating the service, then triggers the stored callback. The original method runs and the spy reports no calls.

Do not assume the callback skipped the operation. Binding selected the original target before the replacement. Reproduce the ordering explicitly and decide which behavior is part of the public design.

If the service should preserve the original target, install the dependency or spy before constructing the callback, or observe its downstream effect through an injected dependency. If the service promises to use the current method, create a wrapper that performs the lookup at invocation. Make that behavior an assertion so a future refactor does not silently change it.

This distinction also matters for plugins and live configuration. A wrapper can observe later behavior, but it adds a dependency on the property still containing a valid callable when invoked. Choose and validate that contract instead of changing syntax to satisfy a single test.

## Code Review Checklist

- Where is the function selected, and where is it eventually invoked?
- Does any destructuring, extraction, or wrapper change the supplied receiver?
- If an arrow is used, which enclosing invocation or initializer provides its `this`?
- Does the callback API pass additional arguments such as an index or event object?
- Are argument order and return values preserved by the adapter?
- Does the operation accept a borrowed receiver, or require private elements or internal state?
- Must existing callbacks observe method replacement, object mutation, both, or neither?
- Can repeated registration create more than one callback identity, and who removes each one?
- Can queued callbacks run after disposal, and what behavior is promised then?
- Do tests include two instances, a detached invocation, and the relevant cleanup or error path?

## Interview Whiteboard Strategy

Write the call expression first. Draw the function object separately from the object containing a property that refers to it. Draw a receiver arrow from the call to the selected object; changing the property call to a plain call should change that arrow without redrawing the function's lexical environment.

For a bound function, add a box that records its target, receiver, and argument prefix. Trace one ordinary invocation through that box. Then introduce `new` and explain why construction uses its own path instead of the stored receiver.

For an arrow, mark the enclosing invocation's `this` binding. A later `call` or `bind` does not move that binding. This lets the drawing predict behavior when the interviewer changes the receiver, replaces a method, or mutates an object.

## Explain the Trade-Off in One Paragraph

"I bound the client's method when creating the callback because the callback must use that client and the method selected at that time. The bound function preserves return values and propagates ordinary call failures. I store it once so listener removal uses the same identity. The registration owner releases it when the subscription ends. Each client has a separate callback and retained receiver, so I would measure instance creation and lifecycle retention if the application creates many clients."

Adapt the explanation to the actual contract. If method replacement should be visible, explain the wrapper's later lookup. If revocation matters, describe the validity check performed when the operation runs; binding itself does not provide revocation.

## Mastery Check

You are ready for the next chapter when you can predict the difference between extracting a method, binding it, wrapping its property call, and creating an arrow inside it. You should also explain why listener identity survives neither repeated binding nor repeated wrapper creation, and why construction ignores a bound receiver.

Use the [interview perspective](05-interview-perspective.md) to rehearse the language rules and the [revision sheet](08-revision-summary.md) to check them. Continue with [Prototypes and Inheritance](../chapter-03/01-introduction.md) to learn where methods are found before a call supplies their receiver.
