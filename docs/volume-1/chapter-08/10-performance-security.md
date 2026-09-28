# Performance and Security

## Copy the Needed Graph

A shallow copy visits the source's own enumerable properties; a schema-specific nested copy visits the records and leaves that the contract retains. A blanket recursive clone can process far more state and needs policies for cycles, dates, collections, functions, and special objects. Do not introduce a generic clone merely to copy a three-field shipping view.

If `n` updates each spread a growing `n`-key object, cumulative property-copy work can become O(n squared). A single owned mutable accumulator may be appropriate during construction, followed by one published result. For immutable application state, structural sharing can preserve old views while avoiding copies of unchanged subgraphs, provided shared subgraphs obey the intended mutation policy.

## Measure Shapes Rather Than Guessing

Engines can specialize property access based on observed object layouts. That does not make every dynamic key or deletion a production bottleneck. First determine record counts, copied fields, string processing, and retention. Profile the workload before trading clear schema code for opaque shape-management tricks. V8's [fast properties article](https://v8.dev/blog/fast-properties) gives one implementation's context.

## Keep Untrusted Keys Out of Control Paths

Prototype pollution can occur when untrusted property names become assignment targets or recursive paths through objects. The preference parser avoids that class of merge by allowing a fixed list of keys at each level and constructing the result explicitly. Checking only the root is insufficient if nested keys later drive traversal. [MDN's prototype-pollution guidance](https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/Prototype_pollution) explains these paths and defenses.

A null-prototype dictionary treats names such as `__proto__` as ordinary own data keys and avoids inherited lookup. It does not make those keys safe to feed into an unrelated generic merge later. A Map also separates entries from object properties and is often useful for arbitrary keys; choose it based on the API and serialization contract.

## Own Presence Is Not Authorization

An own `admin: true` property is still client-controlled. A valid boolean is not evidence of permission. Obtain privileged decisions from the authoritative application layer. Similarly, symbol properties and non-enumerable fields are still discoverable and accessible to code that has the object; they do not protect secrets.

## Publish an Allowlist, Not a Growing Denylist

Removing only a field called `password` with object rest can accidentally expose a new sensitive field added later. A public view should explicitly name the fields it publishes and copy or omit nested data deliberately. Tests should assert exact output keys as well as expected values.

JSON text boundaries remove executable getters and proxies from the accepted representation, but parsing still needs size limits and schema validation. Do not use serialization as a universal deep-clone or sanitization guarantee; it has its own supported types and loss behavior.

## Retention and Error Evidence

Copies can retain shared nested graphs, while full snapshots can multiply storage. Measure what remains reachable after a workflow completes. For errors, record the rejected field and failure category without dumping complete request records or internal notes into logs.
