# Errors and Debugging: Interview Perspective

## Beginner: Constructing Versus Throwing

An Error is a value; throw transfers control. Creating an Error without throwing does not enter catch. Prefer Error objects, but remember that catch can receive any value.

Distinguish source parsing from runtime data parsing. An unmatched brace in the current script prevents its try block from executing. A running JSON.parse call can throw into an active catch.

## Intermediate: Predict Finally Behavior

```js
function choose() {
  try {
    return 'work';
  } finally {
    return 'cleanup';
  }
}
console.log(choose());
// Expected output:
// cleanup
```

This intentionally demonstrates a bad production pattern. Return in finally replaces the pending result. If try had thrown, the final return could suppress that failure. Cleanup should normally finish without selecting a new successful result.

## Intermediate: Catch and Rethrow

Ask what a catch can recover from. If a parser converts syntax failures into results, protect only the parser call. A TypeError from unrelated code in a large try should not become a misleading invalid-input response.

Wrapping can add context while preserving the original Error as cause. Wrapping with identical messages at every layer adds noise and retains unnecessary references.

## Senior: Work and Cleanup Both Fail

Name the policy before coding. The resource helper returns work's result when both succeed, propagates either single failure, and uses AggregateError for two failures. Acquisition failure does not call release.

Why keep a separate failure flag? Because an operation may throw undefined or null. Testing the truthiness of the saved error would miss those failures.

## Senior: Catch Around Registration

A callback registered inside try can execute after that try has finished. Source-code nesting is not the same as an active error-handling boundary. The invocation and asynchronous mechanism determine where a failure is handled.

A synchronous wrapper must not claim to await a returned Promise. Callback-local handling and Promise rejection handling are distinct topics.

## Design Challenge: Batch Imports

Separate request-size limits, JSON syntax, schema validation, row validation, and persistence. Decide whether an invalid row rejects the batch or produces an indexed failure. Specify whether writes can happen before validation finishes and whether rollback exists.

Test malformed JSON, a valid non-object value, wrong fields, exact quantity bounds, and an unexpected dependency failure. A successful process exit does not prove any of those contracts.

## Explain a Debugging Result

Describe one reproducible input, the first incorrect state, the evidence supporting its cause, and the assertion that prevents recurrence. A clear explanation is stronger than a list of debugging tools.

