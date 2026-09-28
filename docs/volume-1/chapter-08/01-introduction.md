# Objects and Data Ownership

An object groups properties under an identity. Reading a property, checking whether it belongs to the object, and copying that object's values are distinct operations. Many production bugs come from treating those operations as interchangeable: an inherited setting is accepted as submitted data, an optional value hides a missing field, or a spread copy still shares nested state.

This chapter develops ordinary records and explicit ownership contracts. It introduces just enough prototype and descriptor behavior to make property access predictable. Volume 2 develops inheritance, descriptors, classes, and proxies in depth.

## Learning Objectives

- Use literal, computed, string, and symbol property keys appropriately.
- Distinguish a missing property, an own property, and an inherited property.
- Choose between property lookup, `in`, `Object.hasOwn`, `Object.keys`, and `Reflect.ownKeys`.
- Explain data-property flags and accessor behavior without treating every property as a plain slot.
- Apply destructuring and defaults while preserving null/undefined distinctions.
- Trace shallow copies and copy the exact nested records an update owns.
- Define safe ordinary-JSON boundaries without trusting arbitrary keys or inherited configuration.
- Test mutation isolation, unknown keys, and descriptor-related failures.

## Prerequisites and Running Guide

Read [Variables and Data Types](../chapter-02/01-introduction.md), [Operators and Expressions](../chapter-03/01-introduction.md), and [Functions and Callbacks](../chapter-07/01-introduction.md). Be comfortable with conditionals, loops, parameters, and return values. Arrays in this chapter hold short key lists; the [next chapter](../chapter-09/01-introduction.md) develops collections systematically.

Use Node.js 20 or later. Each JavaScript block is independent and includes exact output. Run these companion assertion programs from the repository root:

```sh
node code/volume-1/chapter-08/example-00-property-model.js
node code/volume-1/chapter-08/example-01-owned-profile.js
node code/volume-1/chapter-08/example-02-safe-preferences.js
node code/volume-1/chapter-08/example-03-ownership-challenges.js
```

## First Observation

```js
'use strict';

const before = { id: 'U-1', preferences: { theme: 'light' } };
const after = { ...before };
after.preferences.theme = 'dark';
console.log(before === after);
console.log(before.preferences === after.preferences);
console.log(before.preferences.theme);

// Expected output:
// false
// true
// dark
```

The outer objects differ, but the nested preference object is shared. A complete ownership explanation names which records are new and which remain shared. Start with [property theory](02-theory.md), draw the [reference graph](03-internal-working.md), and then test the [production boundaries](04-production-examples.md).
