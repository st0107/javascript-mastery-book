# MCQs

Assume a fresh Node process for every question and the explicitly stated mode. Select one answer before reading the explanation.

## 1. Which filename explicitly selects Node ES modules regardless of the surrounding package type?

A. `worker.txt`
B. `worker.mjs`
C. `worker.cjs`
D. `worker.json`

**Answer: B.** The `.mjs` extension identifies an ES module. `.cjs` identifies CommonJS; `.js` requires attention to package and runtime rules.

## 2. What is printed in an ES module?

```js
// Runtime: Node.js ES module
console.log(this === undefined);
// Expected output:
// true
```

A. false, because this is always the global object
B. false, because this is module.exports
C. A ReferenceError
D. true

**Answer: D.** ES module top-level this is undefined. CommonJS has a different top-level environment.

## 3. A library exports `quoteLine` as a named export only. Which interface choice matches it?

A. A named import selecting quoteLine, optionally with a local alias
B. A default import without changing the library
C. Calling require in every browser module
D. Reading globalThis.quoteLine

**Answer: A.** The caller must select the exported name. A module does not automatically publish declarations on the global object or create a default export.

## 4. What is printed after a counter import?

```js
// Runtime: Node.js ES module
import { count, increment } from './counter.mjs';
const saved = count;
increment();
console.log(saved, count);
// Expected output:
// 0 1
```

A. 1 1
B. 0 0
C. 0 1
D. 1 0

**Answer: C.** saved contains the earlier primitive value. The import remains connected to the exported binding.

## 5. What does read-only import binding mean for an imported object?

A. Every nested property is frozen
B. Its properties may still be mutable even though the importer cannot reassign the binding
C. The object is cloned for every importer
D. The object can only be read through a getter

**Answer: B.** Binding assignment and object mutation are separate operations. Ownership requires its own interface contract.

## 6. Native Node ESM resolves `./pricing.mjs` relative to what?

A. The importing module's location
B. The operating system root
C. Always the shell's current directory
D. The nearest file named pricing in node_modules

**Answer: A.** A relative module specifier starts from the importing module. A filesystem API receiving an ordinary relative path can follow different rules.

## 7. What is printed by this export-alias model?

```js
'use strict';
const record = { exports: {} };
let alias = record.exports;
alias = { enabled: true };
console.log(Object.hasOwn(record.exports, 'enabled'));
// Expected output:
// false
```

A. true
B. undefined
C. A SyntaxError
D. false

**Answer: D.** Reassigning alias does not change record.exports. This is the reason replacing exports alone is not the CommonJS replacement operation.

## 8. What is the best reason to keep a server's start call out of a reusable library's top level?

A. Functions cannot be exported after startup
B. All top-level function calls are syntax errors
C. Importing the library should not unexpectedly bind a port or start work
D. Every imported file runs in another process

**Answer: C.** Explicit startup makes initialization and effects controllable. Modules can execute top-level calls, so the design must choose which effects belong there.

## 9. What does dynamic import return immediately?

A. A promise for a module namespace
B. Always the module's default export
C. A filesystem path
D. A new worker thread

**Answer: A.** Await the promise or attach handlers to obtain the namespace and handle a loading failure.

## 10. A cyclic dependency reads an exported const before its initializer executes. What is the relevant failure?

A. Every cycle is rejected by the parser
B. The const silently becomes null
C. The const is initialized to zero
D. The read can throw ReferenceError because the binding is uninitialized

**Answer: D.** Cycles are not universally invalid. The timing of the read relative to initialization matters.

## 11. What is printed in strict mode?

```js
'use strict';
const settings = Object.freeze({ size: 2 });
try {
  settings.size = 3;
} catch (error) {
  console.log(error.name);
}
// Expected output:
// TypeError
```

A. ReferenceError
B. TypeError
C. SyntaxError
D. 3

**Answer: B.** The property exists, but the frozen object's data property cannot be written. Strict mode turns this invalid write into a thrown failure.

## 12. Which statement about a shared module counter is accurate?

A. It survives every process restart
B. All machines importing the package share it
C. Its sharing is limited by resolved identity and the loader context
D. Importing the counter always copies its current state

**Answer: C.** A new process has a new instance. Distinct module identities can also create distinct instances within a runtime.

## 13. What is printed by two calls to a state factory?

```js
'use strict';
function createCounter() {
  let value = 0;
  return () => ++value;
}
const a = createCounter();
const b = createCounter();
console.log(a(), b(), a());
// Expected output:
// 1 1 2
```

A. 1 2 3
B. 0 0 1
C. 1 1 1
D. 1 1 2

**Answer: D.** Each factory call creates a separate local state. Exporting the factory would preserve this per-call behavior.

## 14. Which import is appropriate for a dependency that is always required at startup?

A. Usually a static import, making the dependency explicit
B. Always dynamic import because it executes synchronously
C. An import constructed from unvalidated user input
D. A new Function containing the dependency source

**Answer: A.** Prefer a simple explicit graph unless a real conditional-loading requirement justifies dynamic import. Loading source from input changes the trust boundary.

## 15. What does strict mode guarantee?

A. Imported packages cannot access the filesystem
B. Objects returned by every function are immutable
C. Certain invalid operations throw and several ambiguous language behaviors are restricted
D. All input values have the declared application type

**Answer: C.** Strict mode is a language execution rule. It does not provide process isolation, deep freezing, or schema validation.

## 16. What is printed when a namespace value is copied to a local?

```js
// Runtime: Node.js ES module
import * as source from './counter.mjs';
const { count } = source;
source.increment();
source.increment();
console.log(count, source.count);
// Expected output:
// 0 2
```

A. 2 2
B. 0 2
C. 0 0
D. A SyntaxError because namespaces cannot be destructured

**Answer: B.** Ordinary destructuring reads a value at that moment. It does not create the special connection established by a named import declaration.
