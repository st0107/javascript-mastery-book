# Theory

## Choose the Execution Mode First

| Context | How it is selected | Scope and top-level `this` | Dependency mechanism |
| --- | --- | --- | --- |
| Browser classic script | A script element without `type="module"` | Global script environment; top-level `this` is the global object | No static import declarations |
| Browser ES module | A script element with `type="module"` | Module scope; top-level `this` is undefined | Standard import/export and host URL resolution |
| Node CommonJS | An explicit `.cjs` file | Per-module wrapper; top-level `this` initially refers to `module.exports` | `require` and `module.exports` |
| Node ES module | An explicit `.mjs` file | Module scope; top-level `this` is undefined | Standard import/export with Node resolution |

In a browser classic script, a top-level `let` binding is not a property of the global object. Do not equate all global bindings with properties. In Node CommonJS, top-level declarations belong to the module wrapper, even though names such as `process` are supplied by the host.

For `.js` files in Node, declare the intended package format with the nearest relevant `package.json` `type` field: `module` or `commonjs`. Explicit `.mjs` and `.cjs` remain useful when both formats coexist. Do not rename every file in a repository or change its root package type without reviewing scripts and tooling. See [Node package format rules](https://nodejs.org/download/release/v20.19.0/docs/api/packages.html#determining-module-system).

## Exports Define an Interface

An export makes a binding available through a module interface. Other declarations remain local. A named export has an interface name; a default export uses the interface name `default`, although the importer can choose its local identifier.

This complete library can run alone without output:

```js
// Runtime: Node.js ES module
function validName(value) {
  return typeof value === 'string' && value.length > 0;
}
export function greeting(name) {
  if (!validName(name)) throw new TypeError('name must be non-empty');
  return `Hello, ${name}`;
}
export const formatVersion = 1;
export default greeting;
// Expected output:
// (none)
```

For a file saved as `greeting.mjs`, named import syntax is `import { greeting } from './greeting.mjs'`; default syntax is `import greet from './greeting.mjs'`. An alias such as `import { greeting as greet } ...` changes only the local name. Braces here select named exports; they do not perform ordinary object destructuring. Export only what callers need to depend on. [Export reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export).

## Imports Are Live Connections

The repository's `counter.mjs` exports a mutable `count` binding and an `increment` function. A named import observes the binding's current value. An ordinary local assignment takes the value at the time that assignment runs.

```js
// Runtime: Node.js ES module
import { count, increment } from './counter.mjs';
const initial = count;
increment();
console.log(initial, count);
// Expected output:
// 0 1
```

An importer cannot reassign the imported binding. If an exported value is an object, that restriction does not make the object immutable. A mutation of a shared object's properties can still affect every caller. Module scope organizes access; it does not supply a deep copy. [Import reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import).

## Static Imports and Dependency Order

A static import declaration belongs at module top level. The loader uses it to connect the dependency graph before executing the importing module's body. Placing an import after a console call in the source does not defer loading until that line.

For an acyclic graph without top-level await, dependencies evaluate before the module that needs them. Shared dependencies are reused for the same resolved module identity in that loader context. Two importers therefore do not automatically receive two independent counters. If callers need independent state, export a factory that allocates state per call.

Cycles connect modules back to themselves indirectly. Linking a cycle can succeed while evaluating an early read of an uninitialized `let`, `const`, or class binding fails. Avoid initializing A from B's value when B simultaneously initializes from A. Move shared constants to a third module, or move dependent work into an explicitly called function. Detailed asynchronous evaluation belongs in Volume 3.

## Resolution Belongs to the Host

Node resolves `./pricing.mjs` relative to the importing module, not relative to the shell's current directory. Native Node ESM requires explicit extensions for relative file imports. `node:assert/strict` identifies a built-in; a bare name such as `some-package` uses package resolution. Browsers use URLs and can use import maps for bare names. A bundler may accept syntax that native Node or a browser loader does not. [Node ESM resolution](https://nodejs.org/download/release/v20.19.0/docs/api/esm.html#import-specifiers).

To derive a resource URL beside a module, use `new URL('./resource.json', import.meta.url)`. To turn a file URL into a Node filesystem path, use `fileURLToPath` from `node:url`; string slicing mishandles escaping and Windows paths. `import.meta.url` describes the current module's URL. [Import metadata](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import.meta).

## CommonJS Is a Different Interface

CommonJS calls `require` during execution and returns the dependency's exported value. The initial `exports` variable refers to `module.exports`; replacing `exports` alone does not replace the module's exported value. The following assertion program models the aliasing with ordinary objects:

```js
'use strict';
const moduleRecord = { exports: {} };
let exportsAlias = moduleRecord.exports;
exportsAlias.ready = true;
exportsAlias = { ready: false };
console.log(moduleRecord.exports.ready);
console.log(exportsAlias === moduleRecord.exports);
// Expected output:
// true
// false
```

The real API uses `module.exports = value` to replace the export. CommonJS caching normally reuses exports for the same resolved file. Node interoperability rules depend on the version and dependency graph; this book does not assume every ESM module can be synchronously required. Keep interfaces in a single format where possible. [CommonJS documentation](https://nodejs.org/download/release/v20.19.0/docs/api/modules.html).

## Strict Mode Makes Failures Visible

ES modules use strict mode automatically. CommonJS does not become strict merely because it is a module in Node terminology; use a directive when appropriate. Strict mode rejects accidental assignments to undeclared names and throws for many invalid writes that would otherwise fail silently.

```js
// Runtime: Node.js ES module
try {
  moduleLessonUndeclared = 1;
} catch (error) {
  console.log(error.name);
}
const policy = Object.freeze({ enabled: true });
try {
  policy.enabled = false;
} catch (error) {
  console.log(error.name);
}
// Expected output:
// ReferenceError
// TypeError
```

Strict mode is an execution rule, not a security sandbox or an input validator. It neither validates a URL nor limits what an imported package can do. [Strict mode reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode).

## Dynamic Import Is an Asynchronous Boundary

`import(specifier)` is an expression that returns a promise for a module namespace. Use it when a dependency is genuinely conditional or deferred. It is not a synchronous replacement for `require`.

```js
// Runtime: Node.js ES module
const namespace = await import('node:path');
console.log(namespace.posix.basename('/reports/daily.csv'));
// Expected output:
// daily.csv
```

This uses top-level await to wait for the result in an ES module. If loading fails, the promise rejects. A surrounding synchronous try block that merely starts an import does not handle a later rejection; await the result inside that try or attach a rejection handler. Volume 3 explains promises, task scheduling, and concurrent loading. [Dynamic import reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import).
