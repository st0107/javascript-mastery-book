# Revision Sheet and Chapter Summary

## Revision Sheet

| Question | Rule to recall | Evidence to produce |
| --- | --- | --- |
| Where does an outer name resolve? | Through the function's enclosing lexical environments. | Call a function from a scope with a same-named local. |
| What does a closure preserve? | Access to surrounding bindings. | Change a binding after creating a reader. |
| Do all calls share local state? | Separate factory calls create separate local bindings. | Advance one counter and read another. |
| Can sibling functions share state? | Functions from one invocation can access the same binding. | Use one method to update and another to read. |
| Is captured configuration copied? | Capturing an object does not clone it. | Mutate a property through the caller's reference. |
| Does `const` freeze data? | It prevents binding reassignment. | Mutate an object held by a `const` binding. |
| Does a closure bypass initialization? | Reading an uninitialized lexical binding still throws. | Call a reader before and after a `let` initialization. |
| Why do `var` loop readers agree? | They read the same final binding. | Collect callbacks before calling any of them. |
| Why does loop-header `let` help? | It supplies distinct iteration bindings. | Compare `let` in the header with `let` before the loop. |
| Does a returned function retain an active parent call? | Needed state can outlive the completed call. | Draw separate execution and reachability views. |
| Does a closure provide a security boundary? | Restricted API access does not isolate hostile code. | Identify what the API returns or allows a caller to do. |
| When is captured data released? | Reachability matters; collection timing is not an API contract. | Trace owners and perform explicit unsubscribe or disposal. |

## A Two-Minute Trace

For unfamiliar code, annotate five things before predicting the result:

1. Every declaration relevant to the output, including same-named declarations in other scopes.
2. Every factory invocation that creates fresh bindings.
3. Where each callback is created and which environment supplies its outer names.
4. The writes that happen before each callback reads those bindings.
5. The references that keep each callback available after the creating call returns.

Do not count indentation levels as calls. Do not count assignments of a function reference as new factory instances. These shortcuts are responsible for many incorrect closure explanations.

## Chapter Summary

You traced request labels, private progress, live configuration, initialization errors, and loop callbacks with one consistent model: names resolve through lexical environments, and functions retain the access needed to use surrounding bindings. You then applied that model to APIs whose state belongs to a request or store instance.

The production decisions are ownership decisions. Choose what is captured, whether it should remain live or represent an initial value, which operations may change it, and when callbacks are removed. The [exercises](06-exercises-coding-challenges.md) test those decisions through outputs, shared-state checks, and failure behavior.

## References

- [ECMAScript Environment Records](https://tc39.es/ecma262/multipage/executable-code-and-execution-contexts.html#sec-environment-records): the formal binding and outer-environment model.
- [ECMAScript OrdinaryFunctionCreate](https://tc39.es/ecma262/multipage/ordinary-and-exotic-objects-behaviours.html#sec-ordinaryfunctioncreate): the function's saved environment.
- [MDN: Closures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures): lexical scope and closure terminology.
- [MDN: `let`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let): block scope and initialization.
- [MDN: `for`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for): loop-header lexical declarations.
- [V8: Scopes and ScopeInfos](https://chromium.googlesource.com/v8/v8/+/main/docs/runtime/scopes-and-scope-infos.md): one engine's scope metadata and context representation.

## Further Reading

Use the [Professional Field Guide](11-professional-field-guide.md) for a design review or interview rehearsal. For a memory investigation, consult [Chrome DevTools heap snapshots](https://developer.chrome.com/docs/devtools/memory-problems/heap-snapshots) alongside the [performance notes](10-performance-security.md).

The next planned chapter is **Volume 2, Chapter 2: `this`, Call, Apply, and Bind**. It will distinguish ordinary identifier lookup from receiver selection during a call. Later chapters on memory management and asynchronous JavaScript will revisit retention and callbacks; the synchronous closure rules established here remain the foundation.
