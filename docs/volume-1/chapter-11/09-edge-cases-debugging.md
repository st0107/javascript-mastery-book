# Edge Cases, Debugging, and Failure Modes

## Identify the Stage of Failure

| Symptom | Likely boundary | First check |
| --- | --- | --- |
| Import syntax rejected | Wrong execution mode or invalid syntax | File extension, package type, parser context |
| Module cannot be found | Resolution/loading | Full filename, case, relative base, installed package |
| Requested export missing | Linking/interface mismatch | Named versus default export and exact interface name |
| ReferenceError in a cycle | Evaluation before initialization | Dependency graph and top-level reads |
| Tests print or start services on import | Startup side effects | Top-level calls in imported libraries |
| Two tests share a counter | Cached module state | State allocation location and test isolation |

Do not fix a missing-file error by changing unrelated arithmetic or adding catch blocks around every function. Reproduce the failure with the smallest entry and its immediate dependency.

## A Namespace Is Not a Writable Configuration Object

```js
// Runtime: Node.js ES module
import * as counter from './counter.mjs';
try {
  counter.count = 10;
} catch (error) {
  console.log(error.name);
}
console.log(counter.count);
// Expected output:
// TypeError
// 0
```

Pass configuration into a factory or export an intentional update operation. Do not expect assigning a namespace property to reconfigure the exporting module.

## Catch a Dynamic Loading Failure Where It Is Awaited

```js
// Runtime: Node.js ES module
try {
  await import('./intentionally-missing-module.mjs');
} catch (error) {
  console.log(error.code === 'ERR_MODULE_NOT_FOUND');
}
// Expected output:
// true
```

The error code here is a Node host detail. This local missing file is deliberate and must remain absent. Exact error messages contain paths and vary across environments, so the assertion checks a stable classification instead of a whole message.

## Case and Path Portability

A case-insensitive development filesystem can hide a filename-case mismatch that fails in another environment. Match the committed filename exactly. Use explicit relative extensions and avoid hard-coded absolute machine paths. Paths containing spaces belong in quotes in shell commands; they do not require hand-built string transformations inside a module URL.

## CommonJS and ESM Interoperability

Do not repair every interop failure by renaming a package or changing a root package type. Check the Node version, package's supported entry points, and whether the dependency performs top-level await. The chapter's `.mjs` and `.cjs` examples intentionally remain explicit, avoiding version-dependent assumptions about requiring ESM synchronously.

## Browser Loading

A browser module is loaded as a resource with URL and server rules. Opening an HTML file directly through a file URL is a poor substitute for serving a project locally. Inspect the network request, HTTP status, content type, and console error. A 200 response containing an HTML fallback page is not a successful JavaScript module load. Browser module scripts also have loading behavior distinct from classic scripts; verify it against the [HTML script element specification](https://html.spec.whatwg.org/multipage/scripting.html#the-script-element).

## Avoid Test Order Dependence

If importing a module creates mutable state, a second test in the same process may inherit changes from the first. Prefer a fresh factory result per test. Reloading through artificial query strings changes module identity and can create additional instances; it is not a general resource cleanup policy.
