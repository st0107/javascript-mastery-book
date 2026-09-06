# Professional Field Guide

## Start with Ownership

Before adding a closure to production code, finish this sentence: "This state belongs to ___ and remains useful until ___." A request logger belongs to a request. A subscription belongs to the component that registered it. A configured validator may belong to the service instance that constructed it.

An unclear answer usually means the lifetime or dependencies need to be made more explicit. A factory does not automatically make mutable data local if it still reads a shared object owned elsewhere.

| Requirement | A useful starting design | Review question |
| --- | --- | --- |
| Reuse one validated request ID across log calls | A logger factory with an injected sink | Is request metadata captured before another request can replace it? |
| Maintain a small private state machine | A factory returning named operations | Which transitions are allowed, and what happens on errors? |
| Register a callback on a longer-lived owner | Registration returning a cleanup function | Who calls cleanup, and is it safe to call twice? |
| Transform independent input values | A function with explicit arguments | Does retaining configuration add a real benefit? |
| Persist or transfer state as data | A serializable record with separate operations | Can the state be inspected and reconstructed without a hidden environment? |

These are design starting points, not rankings. Pick the representation whose ownership and behavior are easiest for the team to explain.

## Case Study: Request IDs Bleed Across Logs

Imagine a service whose request setup assigns a process-wide `currentRequestId`. Request A begins, then waits for an external operation. Request B begins and replaces the ID. When A resumes, its logger reads B's ID. The service now attributes a failure to the wrong request.

The defect is visible without teaching the event loop: the logger reads one mutable binding shared by multiple operations. Reproduce it by constructing two request contexts and interleaving their logging calls in a deterministic test.

The repair is to establish request-specific state at the boundary. The [request logger](04-production-examples.md) copies allowed primitive metadata into one factory invocation and returns an operation that uses it. Passing a single shared mutable metadata object and reading its properties on every log call would preserve the original ownership problem.

Review the repair through behavior:

1. Create logger A, then logger B.
2. Log with A, B, and A again; inspect each emitted request ID.
3. Change the caller's original metadata object; verify the documented capture policy.
4. Make the injected sink fail; verify whether the error reaches the caller.
5. Check that constructing a logger does not register it in a permanent global collection.

This test covers state separation and capture semantics. A benchmark would not detect either defect.

## Case Study: A Screen Keeps Receiving Updates

A screen subscribes to a store when it opens. Closing the screen removes its visible UI but leaves its subscription registered. Updates continue invoking the old callback, and that callback may still reference screen state.

The lifecycle contract should identify one cleanup owner. Store the exact unsubscribe function returned by registration and call it when that owner finishes. If the screen can close through several paths, idempotent cleanup makes those paths easier to compose.

The [subscription store](04-production-examples.md) also specifies what happens when a subscriber removes another subscriber during notification. A snapshot makes the current dispatch stable: changes affect later dispatches. Without an explicit rule, a seemingly harmless refactor of the listener collection can change observable behavior.

Keep callback cleanup and state cleanup distinct. Unsubscribing prevents later notifications under the store's contract; it does not revoke copies of objects already returned to callers or guarantee immediate memory reclamation.

## Code Review Checklist

- Can you name the factory call that owns each mutable captured binding?
- Does the API promise current values, captured initial values, or caller-owned object references?
- Are several returned functions intentionally sharing the same state?
- Can another request, component, or test change the captured object through an alias?
- Does the implementation define reentrant calls and callback exceptions?
- Does repeated registration have clear identity and removal behavior?
- Are retained collections bounded or explicitly cleared when their owner ends?
- Do the tests exercise two independent instances and at least one failure path?
- Could explicit arguments make the dependencies easier to understand?

## Interview Whiteboard Strategy

Draw a factory environment containing one binding. Draw the returned function and connect it to that environment. Cross out the completed factory call on a separate stack sketch. Then invoke the returned function twice and update the same binding each time.

If the interviewer introduces a second factory call, draw a second environment. If they introduce another reference to the first returned function, draw another arrow to the existing function. If they replace `let` in a loop header with one variable outside the loop, replace the iteration bindings with a shared binding.

An answer grounded in those changes is more useful than a memorized sentence. It predicts behavior when the problem changes.

## Explain the Trade-Off in One Paragraph

"I used a factory because the logger's metadata belongs to one request and should be validated once. Each call creates bindings for that request, and the returned function keeps access to them. I copied primitive fields so changes to the caller's object do not alter previous loggers. The destination is injected so tests can inspect records and exercise sink failures. The cost is one function instance and its retained state per logger, which is appropriate for the intended lifetime."

Adapt that explanation to the actual implementation. If configuration is deliberately live, say so. If functions are registered with a longer-lived service, explain how registration ends.

## Mastery Check

You are ready to move on when you can explain why the following are different without running them: calling a factory twice, assigning its returned function to two variables, returning two functions from one call, and copying a primitive out of an object before creating a reader.

Use the [interview questions](05-interview-perspective.md) to rehearse those distinctions and the [revision sheet](08-revision-summary.md) to check the rules you used. The next planned chapter builds on them by separating lexical bindings from `this`.
