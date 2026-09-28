# Edge Cases and Debugging

## Distinguish Syntax Failure From Operation Failure

A parser error prevents evaluation of the affected script. A missing identifier can fail after earlier statements have already run. A writer can exist and still throw while performing its operation. These failures call for different repairs: fix the source, fix the dependency, or handle the operation outcome.

```js
'use strict';

console.log('before lookup');
try {
  unavailableDocument.querySelector('main');
} catch (error) {
  console.log(error.name);
}
console.log('after handled failure');

// Expected output:
// before lookup
// ReferenceError
// after handled failure
```

The unavailable root name fails before property lookup or method invocation. Read the first relevant application frame in the error stack, then identify whether the missing name was supposed to be a local binding, an import, or a host capability.

## Presence Is Not Callability

```js
'use strict';

const adapter = { writeText: true };
console.log('writeText' in adapter);
console.log(typeof adapter.writeText === 'function');
try {
  adapter.writeText('report');
} catch (error) {
  console.log(error.name);
}

// Expected output:
// true
// false
// TypeError
```

Checking a property name alone accepts unusable values. Even the improved check assumes a trusted adapter: property access can invoke a getter or proxy trap. Do not present capability inspection as a sandbox for arbitrary JavaScript objects.

## A Working Adapter Can Fail on One Request

```js
'use strict';

function writeReport(writeText, text) {
  if (typeof writeText !== 'function') throw new TypeError('writer required');
  writeText(text);
  return 'saved';
}
try {
  console.log(writeReport(() => { throw new Error('quota exceeded'); }, 'report'));
} catch (error) {
  console.log(error.message);
}

// Expected output:
// quota exceeded
```

The success value is produced only after the synchronous writer returns. Retrying every failure immediately may worsen a full disk or exhausted quota; callers need an operation-specific recovery policy.

## Other Boundaries to Reproduce

| Symptom | Check first | Appropriate evidence |
| --- | --- | --- |
| Works in page, fails in worker | Direct DOM dependency | Run the adapter test in the worker context. |
| Works locally, fails after deployment | Runtime version, transformed output, asset loading | Test the actual built artifact. |
| Number looks rounded unexpectedly | Source text, conversion, safe range | Compare documented input with the parsed value before calculations. |
| Works in console, fails as a file | Script/module mode and injected console bindings | Reproduce in the intended file mode. |
| Error message differs across engines | Test relies on exact message wording | Assert error category and application-owned messages where appropriate. |

Keep a minimal failing input and an assertion for the promised outcome. A log of one successful checkout would not detect accepting an unsafe amount or mistaking a process label for permission.
