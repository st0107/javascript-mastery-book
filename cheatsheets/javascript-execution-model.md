# JavaScript Execution Model Cheatsheet

## Core Ideas

- Script execution starts with the global execution context.
- Every function call creates a function execution context.
- Active contexts are tracked by the call stack.
- Lexical environments store bindings and outer references.
- Identifier lookup starts in the current lexical environment and walks outward.
- `var` is function-scoped.
- `let` and `const` are block-scoped.
- Accessing `let` or `const` before initialization throws a `ReferenceError`.

## Interview Sentence

JavaScript executes code inside execution contexts; each function call creates a new context on the call stack, and variable lookup uses the lexical environment chain created by where functions are written.

## Debugging Checklist

- Which function call is currently executing?
- Which bindings are local?
- Which bindings come from an outer environment?
- Is a variable being accessed before initialization?
- Is state shared through a global or preserved through a closure?

