# Revision Sheet and Chapter Summary

## Revision Sheet

| Question | Working rule |
| --- | --- |
| Which Node format? | Use explicit `.mjs` or `.cjs`, or declare the intended package type for `.js`. |
| Named or default? | Match the exported interface; a local alias is a separate choice. |
| Is a named import a copied value? | It is a read-only live binding connection. |
| Does read-only mean immutable? | No; a referenced object's properties can remain mutable. |
| Where does a relative import start? | At the importing module's location. |
| What makes startup predictable? | Keep library definitions separate from explicit start calls. |
| How do callers get independent state? | Call a factory that allocates state per invocation. |
| What does dynamic import produce? | A promise for a namespace, with a possible rejection. |
| Why can a cycle fail? | Evaluation can read a lexical binding before initialization. |
| Is strict mode isolation? | No; it restricts language behavior, not runtime authority. |

## Trace Before Running

```js
// Runtime: Node.js ES module
import { quoteLine } from './pricing.mjs';
const a = quoteLine(50, 2);
const b = quoteLine(50, 2);
a.totalCents = 0;
console.log(a === b, b.totalCents);
// Expected output:
// false 100
```

The imported function value is reused, while its implementation creates a new result record on every call. Module caching does not force every function result to be shared.

## Summary

Modules define interfaces and dependency relationships. Execution mode determines parsing and top-level behavior; the host determines how a request finds a module. A useful library minimizes surprising startup effects and documents ownership of exported state. Successful loading is only the beginning of correctness: callers still need valid arguments, controlled effects, and meaningful failure handling.

## References

- [Node.js 20.19 ESM documentation](https://nodejs.org/download/release/v20.19.0/docs/api/esm.html): version-specific resolution and interoperability rules.
- [Node.js CommonJS documentation](https://nodejs.org/download/release/v20.19.0/docs/api/modules.html): the wrapper, exports, and caching.
- [Node.js package rules](https://nodejs.org/download/release/v20.19.0/docs/api/packages.html): explicit package format and entry points.
- [MDN import](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import) and [export](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export): interface syntax and bindings.
- [MDN strict mode](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode): language changes and error behavior.

## Further Reading

Continue with [Lexical Scope and Closures](../../volume-2/chapter-01/01-introduction.md) to explain retained factory state in depth. Revisit [Errors and Debugging](../chapter-10/01-introduction.md) when distinguishing loading failures from application failures. Volume 3 will develop promise scheduling and asynchronous initialization; those chapters remain planned.
