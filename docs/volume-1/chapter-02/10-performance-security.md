# Performance and Security

## Clear Bindings Are Not a Benchmark Result

Use `const` to express no reassignment and `let` for changing bindings. Neither keyword guarantees a particular physical allocation or a universal speed advantage. Engines optimize according to their implementation and workload. Do not replace a clear local binding with property access on a global container based on guessed stack/heap rules.

## Copying Has a Cost and a Contract

Copying a fixed two-string user record creates one new object and normalized strings. Copying `n` records costs work proportional to the records and text processed. Copying every accumulated prefix after every insertion creates quadratic cumulative record work. Choose snapshots when callers need independent state; choose explicit shared state when live mutation is the intended interface.

A shallow copy is cheaper than traversing an entire graph, but it preserves nested aliases. Avoid claiming full isolation merely because a new outer object exists. A schema-specific copy can be both cheaper and more precise than an unspecified general clone.

## Retention Matters More Than Scope Slogans

A growing cache, global array, or retained callback can keep records reachable indefinitely. Ending a local scope does not impose a retention limit. Inspect heap retainers when memory grows, bound collections when the domain permits, and remove references when their owner is finished. Do not add forced-collection assumptions to application logic.

## Type Checks Are Not Authorization

A string-valued `role: 'admin'` is still client-supplied data. Passing a type guard does not grant the role. Construct an allowed output schema and obtain privileged fields from an authoritative source. The production normalizer intentionally returns only `id` and `email`; it does not copy the input's arbitrary properties into trusted state.

The chapter's boundary functions accept ordinary parsed data. Reading arbitrary JavaScript properties can invoke accessors or proxy traps. If an API accepts objects from third-party code rather than parsed JSON, document that additional trust boundary instead of claiming the guard is effect-free for every possible object.

## Avoid Accidental Shared Secrets

Returning an internal mutable record can expose or alter sensitive state even when the binding that holds it is const. Return only the fields the caller needs, with the ownership promised by the schema. Avoid logging full records just to identify a type mismatch; record the field name and a safe description of the unexpected type.
