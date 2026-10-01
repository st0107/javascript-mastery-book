# Errors and Debugging: Theory

## Three Kinds of Failure

| Kind | Example | Detection and response |
| --- | --- | --- |
| Source syntax failure | An unmatched brace in the current script | Parsing fails before that script executes; fix source |
| Runtime exception | Calling a non-callable value | Execution throws; handle or propagate deliberately |
| Logical defect | A discount applied twice | May not throw; assertions and domain checks reveal it |

A try block in a script cannot catch that same script failing to parse, because the block never starts executing. By contrast, `JSON.parse` runs while the caller is executing and can throw a catchable SyntaxError for malformed input. Do not use evaluation of untrusted source as a parsing shortcut.

```js
try {
  JSON.parse('{"id":');
} catch (error) {
  console.log(error.name);
}
const incorrectTotal = 100 - 10 - 10;
console.log(incorrectTotal === 90);
// Expected output:
// SyntaxError
// false
```

The second line exposes a logic mismatch without any exception. A clean process exit does not establish correctness.

## Error Values Carry Context

`throw` can carry any JavaScript value, including null or undefined. Prefer Error objects for application failures: they provide a message, a category, and runtime diagnostic support. Creating an Error does not itself throw it. [Error reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error).

| Type | Typical meaning |
| --- | --- |
| `TypeError` | An operation received a value of an inappropriate kind |
| `RangeError` | A value is of a relevant kind but outside an accepted range |
| `SyntaxError` | Parsed syntax is invalid |
| `ReferenceError` | A required binding cannot be resolved or accessed |
| `Error` | A general application failure |
| `AggregateError` | Several failures need to be preserved together |

These built-in meanings guide the chapter's contracts; applications may also define stable domain codes. Do not decide behavior by matching an engine's message wording.

```js
const issue = new Error('Import failed.');
console.log(issue.name, issue.message);
try {
  throw null;
} catch (error) {
  console.log(error === null);
}
// Expected output:
// Error Import failed.
// true
```

Because caught values can be arbitrary, accessing `error.message` without checking can itself fail. A robust boundary handles unknown thrown values. `instanceof Error` is useful for values from the same realm, but is not a universal cross-realm test.

## Propagation Follows the Active Call Chain

If a function throws and has no applicable handler, its call does not return normally. The failure propagates outward until an active catch handles it, or to the host if no handler does. A catch handles exceptions from its protected execution, including synchronous calls made there.

```js
function parseRecord() {
  throw new TypeError('Missing ID.');
}
function importRecord() {
  return parseRecord();
}
try {
  importRecord();
} catch (error) {
  console.log(error.message);
}
// Expected output:
// Missing ID.
```

A catch does not undo mutations already performed. Validation before mutation and an explicit rollback or transaction policy are separate design concerns.

## Catch Narrowly and Rethrow Unexpected Failures

Put only the operation whose failure you intend to classify inside the protected region. Check the expected category, convert it to a documented outcome if appropriate, and rethrow everything else.

```js
function parseOrDefault(text) {
  if (typeof text !== 'string') throw new TypeError('Expected text.');
  try {
    return JSON.parse(text);
  } catch (error) {
    if (error instanceof SyntaxError) return { kind: 'invalid-json' };
    throw error;
  }
}
console.log(JSON.stringify(parseOrDefault('{')));
console.log(JSON.stringify(parseOrDefault('{"ok":true}')));
// Expected output:
// {"kind":"invalid-json"}
// {"ok":true}
```

The function uses a fallback only for syntax failure. In a larger API, an explicit result wrapper avoids collisions between fallback objects and successful parsed objects. The production parser instead throws because its caller requires a valid domain record.

## Add Context Without Destroying the Cause

Use `new Error(message, { cause })` when a boundary adds useful context. The cause property holds the original thrown value; for an object, it preserves that object's identity. It can hold any value, not only an Error. Rethrow the original value when no extra context is needed. [Error.cause](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause).

```js
const original = new TypeError('Invalid quantity.');
const contextual = new Error('Could not import inventory.', { cause: original });
console.log(contextual.message);
console.log(contextual.cause === original);
console.log(contextual.cause.name);
// Expected output:
// Could not import inventory.
// true
// TypeError
```

Do not copy a message into a fresh Error and discard the cause. Do not wrap at every layer with identical text. Add the context a caller could not otherwise infer, while keeping secrets out of messages.

## Finally Runs Before the Construct Exits

A finally block runs when normal JavaScript control leaves the associated try/catch, including through return or throw. If finally completes normally, the earlier result or failure continues. If finally returns or throws, that new control transfer replaces the pending one. [Try/catch/finally](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch).

```js
const events = [];
function finish() {
  try {
    events.push('work');
    return 7;
  } finally {
    events.push('cleanup');
  }
}
console.log(finish());
console.log(events.join(','));
// Expected output:
// 7
// work,cleanup
```

Do not return from finally. It can silently replace a successful result or suppress an exception. Cleanup can also throw, so define which error should be reported if both work and cleanup fail. Finally is not a guarantee against process termination, crashes, or a loop that never exits.

## Synchronous Catch Boundaries

A callback created inside a try is not permanently protected by that catch. The callback must execute while the relevant protected call chain is active. This example stores work and invokes it later without using an asynchronous API:

```js
let pending;
try {
  pending = () => { throw new Error('Later failure.'); };
} catch {
  console.log('registration catch');
}
try {
  pending();
} catch (error) {
  console.log(error.message);
}
// Expected output:
// Later failure.
```

A timer callback similarly runs after the registration call has returned. Promise rejection and `await` need their own handling model, taught in the asynchronous volume. A synchronous resource helper must not pretend that returning a Promise means the operation has finished.

## Results Versus Exceptions

An expected "not found" result may be `null` or a tagged result such as `{ ok: false, code: 'NOT_FOUND' }`. An exception can signal that a function cannot fulfill its promised result. Either style can work; specify it consistently and make callers handle both paths.

Use exceptions for failed invariants or invalid inputs when that is the contract. Use explicit results for frequent alternative outcomes when that makes control flow clearer. Avoid a mixture where some failures return undefined, others return strings, and others throw without documentation.

## Assertions and Debugging

An assertion encodes an expectation and fails when the expectation is violated. Use strict equality for primitive results, structural equality for record/array shape, and exception assertions for failure contracts. Assert side effects as well as return values. [Node assert](https://nodejs.org/api/assert.html).

Debugging begins with observed behavior, expected behavior, a minimal reproducer, and a hypothesis. Breakpoints and call stacks help test the hypothesis; they do not replace a specification of the intended result.
