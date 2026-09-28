# Errors and Debugging: Edge Cases and Debugging

## Caught Values May Not Have Messages

```js
function describeFailure(value) {
  return value instanceof Error ? value.message : 'Unknown thrown value.';
}
for (const failure of [new Error('Known failure.'), null, undefined]) {
  try {
    throw failure;
  } catch (error) {
    console.log(describeFailure(error));
  }
}
// Expected output:
// Known failure.
// Unknown thrown value.
// Unknown thrown value.
```

This same-realm display policy avoids reading a property of null. It also avoids stringifying arbitrary objects, which might execute custom conversion code or expose sensitive data.

## Catch Does Not Roll Back State

```js
const state = { count: 0 };
try {
  state.count++;
  throw new Error('Later failure.');
} catch {
  console.log('handled');
}
console.log(state.count);
// Expected output:
// handled
// 1
```

If count must stay unchanged on failure, validate or calculate before assigning, or define a rollback policy. Catch only changes control flow.

## Meaningful Assertions

```js
const assert = require('node:assert/strict');
function readCount(value) {
  if (!Number.isSafeInteger(value) || value < 0) throw new RangeError('Invalid count.');
  return value;
}
assert.equal(readCount(0), 0);
assert.throws(() => readCount(-1), RangeError);
assert.throws(() => readCount('1'), RangeError);
assert.deepEqual({ accepted: [1, 2] }, { accepted: [1, 2] });
console.log('Result, boundary, and failure assertions passed.');
// Expected output:
// Result, boundary, and failure assertions passed.
```

Pass a function to assert.throws so it controls the invocation. Calling the operation first would throw before the assertion can inspect it. Prefer the expected category or stable application code to native message text.

A test runner must let failed assertions fail the test and produce a failing process exit. Catching every failure and then printing success invalidates the check.

## Reduce a Failure to Evidence

Keep one failing input and one nearby passing input. Remove unrelated UI, network work, and formatting while retaining the failure. Inject the clock or dependency result if it changes between runs.

Write the first violated expectation as an assertion. Trace types, values, ownership, and branch order from input to that point. Test one hypothesis at a time; a broad rewrite may hide the cause.

## Breakpoints and Call Stacks

Pause before the first incorrect state or enable pause on exceptions. Inspect parameters and locals in the current frame, then caller frames to see how values arrived. Step over a trusted call to see its result, step into a suspicious call to inspect decisions, and step out when its contract is understood.

A debugger statement requests a pause if a debugger is attached; otherwise it has no observable effect. [Debugger statement](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/debugger).

```js
const input = { quantity: '2' };
debugger;
const total = 10 + input.quantity;
console.log(typeof input.quantity);
console.log(total);
// Expected output:
// string
// 102
```

The type at the breakpoint explains concatenation before any formatting code runs. The fix belongs at the input boundary: parse only accepted numeric syntax and validate the domain.

## Stack Traces Have Limits

Stack text varies by runtime and build. Bundled code may require source maps. A later callback runs with a different active call chain, so its stack need not contain every earlier registration frame.

Cleanup errors can obscure the useful original failure. Inspect causes and AggregateError.errors according to the application's policy instead of assuming the outermost message is the only failure.

