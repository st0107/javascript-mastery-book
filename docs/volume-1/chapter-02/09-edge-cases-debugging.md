# Edge Cases and Debugging

## Undefined Can Have Several Causes

```js
'use strict';

let declared;
const record = { present: undefined };
console.log(declared, record.present, record.missing);
console.log(Object.hasOwn(record, 'present'), Object.hasOwn(record, 'missing'));
console.log(typeof absentIdentifier);

// Expected output:
// undefined undefined undefined
// true false
// undefined
```

The displayed value alone does not tell you whether an object property exists. An initialized binding, an explicitly present undefined-valued property, and a missing property can produce the same value. Check ownership when the distinction belongs to the API contract. Chapter 8 develops property access in detail.

## A Name Can Be Known but Unreadable

```js
'use strict';

function inspect() {
  try { console.log(typeof configured); }
  catch (error) { console.log(error.name); }
  let configured;
  console.log(typeof configured);
}
inspect();

// Expected output:
// ReferenceError
// undefined
```

The first read occurs in the TDZ; the second reads an initialized undefined value. Do not fix this by catching every ReferenceError and treating it as a missing optional setting. Initialize the intended binding before use.

## Block Scope Versus Function Scope

```js
'use strict';

function deliveryState() {
  if (true) {
    var legacy = 'sent';
    let local = 'queued';
    console.log(local);
  }
  console.log(legacy);
  try { console.log(local); } catch (error) { console.log(error.name); }
}
deliveryState();

// Expected output:
// queued
// sent
// ReferenceError
```

The outer read of `local` has no matching binding in this example; it is different from a TDZ read even though both produce ReferenceError. Draw the block's boundary before changing declaration keywords.

## Numeric Type Is Too Broad for Many Contracts

```js
'use strict';

for (const value of [NaN, Infinity, 2.5, 4]) {
  console.log(typeof value, Number.isFinite(value), Number.isSafeInteger(value));
}

// Expected output:
// number false false
// number false false
// number true false
// number true true
```

A stock count needs more than `typeof number`: integrality, safe representation, and domain bounds matter. If an input decimal was rounded during parsing, a later check cannot reconstruct the original text. Preserve the original representation until the parser's contract has been enforced.

## Debug the Target of Assignment

When a const-related bug appears, identify whether the left side is an identifier or a property expression. When an object changes unexpectedly, locate every alias, including arguments, array entries, and returned records. When a value changes type, inspect the last assignment and the input boundary that allowed it.

Avoid testing engine-owned error message text exactly; wording can differ. Assert `ReferenceError`, `TypeError`, or the application-owned message that the contract actually promises.
