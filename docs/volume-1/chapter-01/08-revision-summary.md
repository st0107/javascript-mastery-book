# Revision Sheet and Summary

## The Rules to Remember

| Question | Working answer |
| --- | --- |
| What is ECMAScript? | The standard defining core language syntax and semantics. |
| What is an engine? | An implementation that parses and evaluates the language. |
| What is a host? | The environment supplying loading, external APIs, and scheduling facilities. |
| Is `Array.isArray` host-specific? | No; it is a language built-in. |
| Is `document` universally available? | No; browser pages provide a DOM, while workers and ordinary Node code do not provide that page document. |
| Does a capability-shaped object imply permission? | No; the operation still has to succeed. |
| Does transpiling install every missing API? | No; syntax transformation and runtime support are different. |
| Does integer-valued mean safely exact? | No; Number inputs need safe-integer and domain bounds when exact integer arithmetic is required. |
| Does client validation authorize a transaction? | No; the server owns its authorization and trusted price checks. |

## Trace an Operation

Source is parsed; declarations are instantiated; statements evaluate; function calls introduce call-local bindings; host adapters perform effects. This is a semantic account, not a promise that every engine allocates these records literally.

For `totalFor(3)` with a price of 1500 cents, the parameter receives 3, outer lookup finds 1500, multiplication produces 4500, and the caller receives that value. Logging is a separate host request.

## Decisions Worth Practicing

Use shared pure calculations when rules are portable. Inject a host adapter when an operation needs output, storage, or network access. Check a proposal's status and the actual target runtime separately. Define a supported input representation before converting external data. Let callers observe an operation failure rather than returning a misleading success result.

## Summary

JavaScript's core behavior and its surrounding environment are separate layers. This explains why portable calculations can be reused while DOM, filesystem, and permission assumptions require explicit adapters. A clear input contract and independently tested effects make that separation practical.

Continue with [Variables and Data Types](../chapter-02/01-introduction.md). After learning functions, use the [execution-model companion](../chapter-01-execution-model.md) to revisit calls and lexical environments in more depth.

## References and Further Reading

- [TC39 process](https://tc39.es/process-document/): proposal maturity and integration into the standard.
- [ECMAScript hosts and implementations](https://tc39.es/ecma262/multipage/overview.html#sec-hosts-and-implementations): the language/host boundary.
- [Node globals](https://nodejs.org/api/globals.html): actual runtime facilities, including their version and stability information.
- [Using Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers): a browser context with a different capability set from a page.
- [V8 Ignition](https://v8.dev/docs/ignition): one engine's interpreter, rather than a universal JavaScript pipeline.
