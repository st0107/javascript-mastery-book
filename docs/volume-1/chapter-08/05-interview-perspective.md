# Interview Perspective

## Is a Spread Copy Independent?

```js
'use strict';

const source = { label: 'before', nested: { enabled: true } };
const copy = { ...source };
copy.label = 'after';
copy.nested.enabled = false;
console.log(source.label, source.nested.enabled);
console.log(copy === source, copy.nested === source.nested);

// Expected output:
// before false
// false true
```

The copy owns new outer property slots. Its nested value is the same object identity. Explain independence per graph edge rather than saying "spread clones the object." A correct repair copies the records whose mutable state must be isolated, or documents intentional sharing.

## Which Presence Test Fits a Request Field?

**Question:** A request must explicitly contain its own `enabled` field. Should a guard use `request.enabled !== undefined`, `in`, or `Object.hasOwn`?

**Answer:** Use `Object.hasOwn` to test the ownership requirement, then validate the value. A present own field can hold undefined, and `in` can accept inherited fields. Whether undefined is valid is a separate schema decision.

## Explain a Destructuring Default

```js
'use strict';

const first = { value: undefined };
const second = { value: null };
const { value: a = 'default' } = first;
const { value: b = 'default' } = second;
console.log(a, b);

// Expected output:
// default null
```

Defaults apply to undefined, not all falsy values. If null means explicit clearing, preserving it is often exactly what a patch API needs. If null is invalid, reject it rather than hoping a default will replace it.

## Does Spread Preserve Descriptors?

No. It reads enumerable source values and creates own data properties on the new object. It can invoke a source getter but does not preserve that getter as an accessor. Non-enumerable properties are omitted, and a non-writable source property can produce a writable property in the copy. Descriptor-preserving copying requires a different operation, covered in Volume 2.

## Can Property Access Execute Code?

Yes. A getter or proxy can execute during an apparently simple property read. `Object.entries`, destructuring, and spread can read values too. For a parsed-JSON contract, values are data objects and do not contain executable accessors. For arbitrary objects supplied by other code, specify whether effects and exceptional reads are permitted.

## Does Object.freeze Make a Graph Immutable?

It changes only the object passed to it. A nested object can remain mutable, and accessor behavior does not become pure. Freezing the outer record blocks replacing a data-property value, not mutating the object already stored there. Ask whether each mutable record is owned and whether any mutable identity escapes.

## Design Question: Safe User Preferences

Accept bounded JSON text, parse it, validate the root and nested record shapes, allowlist keys, validate values, apply defaults only according to a defined presence policy, and construct a fresh output schema. Do not recursively merge arbitrary request keys into application state. Test malformed JSON, null, arrays, unknown keys at both levels, wrong booleans, and independent defaults across calls.

## Explain the Complexity

Copying `k` own enumerable properties requires inspecting those keys and values. Getter work adds its own cost. A fixed-schema snapshot with `L` characters of normalized text costs O(L) work plus a fixed number of record allocations. Repeatedly copying a growing dictionary can create quadratic cumulative work; correctness of ownership comes first, then profiling and data-structure choices.
