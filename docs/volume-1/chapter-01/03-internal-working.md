# Internal Working

## Engine-Level View

When JavaScript source reaches an engine, it is parsed into tokens and then into an abstract syntax tree. The engine records scope information, creates internal representations for declarations, and emits bytecode or optimized machine code depending on execution history. The exact pipeline differs between engines, but the observable language rules remain defined by ECMAScript.

Modern engines optimize common paths aggressively. They prefer stable shapes, predictable types, clear control flow, and code that does not force the engine to abandon assumptions. This does not mean you should write unnatural code for the optimizer. It means you should avoid patterns that make correctness and optimization harder at the same time.

## Memory Diagram

```mermaid
flowchart LR
  Source[JavaScript source] --> Parser[Parser]
  Parser --> AST[AST]
  AST --> Bytecode[Interpreter bytecode]
  Bytecode --> Feedback[Runtime feedback]
  Feedback --> Optimizer[JIT optimizer]
  Optimizer --> MachineCode[Optimized machine code]
  Browser[Browser APIs] --> Runtime[Host runtime]
  Node[Node.js APIs] --> Runtime
  MachineCode --> Runtime
```

## Flowchart

```mermaid
flowchart TD
  A[Requirement] --> B{Needs browser capability?}
  B -->|DOM, UI, storage| C[Browser runtime]
  B -->|Files, processes, backend I/O| D[Node.js runtime]
  C --> E[ECMAScript language rules]
  D --> E
  E --> F[Engine executes code]
```

## Execution Steps

1. The host loads a script or module.
2. The engine parses the source and builds scope information.
3. Declarations are registered according to their kind.
4. Top-level code begins executing.
5. Expressions and statements create values, references, and control-flow decisions.
6. Functions create new execution contexts when called.
7. Objects and closures remain reachable while references to them exist.
8. Values with no reachable references become eligible for garbage collection.

## Browser Perspective

In the browser, JavaScript is hosted by the window or worker environment. The engine executes ECMAScript, while browser APIs provide DOM access, networking, storage, timers, rendering coordination, and security boundaries such as same-origin policy.

## Node.js Perspective

In Node.js, JavaScript runs with APIs for files, streams, processes, buffers, cryptography, diagnostics, and networking. There is no DOM by default, and modules are loaded through CommonJS or native ECMAScript modules depending on project configuration.

## Performance

Most fundamental operations are fast enough for ordinary application code. Performance problems appear when a simple operation is placed inside a hot loop, repeated across large data, or combined with allocation-heavy patterns. Analyze complexity first, then profile. Optimize only the path that measurements identify.

## Security Notes

Security begins at boundaries. Parse and validate external input. Avoid dynamic code execution. Keep secrets out of browser JavaScript. Treat serialization and deserialization as security-sensitive operations. Make failure modes explicit so unsafe values do not drift through the program as if they were trusted.
