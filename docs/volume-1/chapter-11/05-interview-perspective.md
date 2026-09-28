# Interview Perspective

## A Clear Opening Explanation

An ES module has its own scope and an explicit interface of exported bindings. Import declarations connect those bindings through a dependency graph. The host resolves paths; the language defines binding and evaluation behavior. Modules execute in strict mode, and importing a mutable object does not copy or freeze it.

Before predicting output, name the host, file format, package setting, and whether execution starts in a fresh process. A REPL, a browser classic script, a CommonJS file, and an ES module are different contexts.

## Explain a Live Binding

```js
// Runtime: Node.js ES module
import * as counter from './counter.mjs';
const { count: saved } = counter;
counter.increment();
console.log(saved, counter.count);
// Expected output:
// 0 1
```

The namespace property reflects the current exported binding. Destructuring into saved reads its value once. The result does not prove that primitive numbers are mutable; increment assigns a new primitive value to the source binding.

## Does Import Create a New Instance?

Usually, repeating an import of the same resolved module identity in one loader context reuses that instance. Do not generalize this into a singleton across browser workers, Node processes, realms, or distinct resolved URLs. If each customer needs a separate counter, export a factory and allocate its state per invocation.

## Is CommonJS Just Older Import Syntax?

No. CommonJS exposes an exported value through a runtime require call. ESM describes imported/exported bindings and links the graph. They also have different top-level environments and host rules. Node provides interoperability, but an interview answer should name the runtime version before promising a particular cross-format operation.

## Why Can a Cyclic Import Fail?

An exported lexical binding can exist before its initializer has run. If another module in the cycle reads it at that point, the temporal dead zone produces a ReferenceError. Ask when the read occurs. Moving it into a later function call can alter the timing; removing an unnecessary cycle often makes the design easier to understand.

## Production Follow-up

Suppose importing a report utility starts a server. Tests importing the calculation may bind a port or keep the process alive. Separate the definition from a start function and call start only from the application entry. This also puts startup failures at a boundary that can report them meaningfully.

## Common Interview Mistakes

- Describing imported names as copied values in every case.
- Saying an imported object is immutable because its binding is read-only.
- Assuming a relative module specifier starts at the shell's current directory.
- Claiming every module runs in a separate thread.
- Treating dynamic import as a synchronous function returning the exported value.
- Explaining loader behavior without specifying browser, Node, or bundler.

A strong answer connects syntax to one observable consequence, then states the boundary of the claim. For example: the counter is shared by these two importers in this process; a new process starts a new counter.
