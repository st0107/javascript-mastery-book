# MCQs

Choose one answer per question before reading the explanation. Every code block is independent, uses strict mode, and runs in Node.js 20 or later. Expected-output comments are included so you can check each prediction after answering.

## 1. Moving a Method to Another Object

What does this program print?

```js
'use strict';

const source = {
  name: 'source',
  read() { return this.name; }
};
const destination = { name: 'destination', read: source.read };
console.log(destination.read());

// Expected output (check after answering):
// destination
```

- A. `source`, because that is where the function was created.
- B. `destination`, because the property call supplies that object as the receiver.
- C. `undefined`, because methods cannot be shared between objects.
- D. A `TypeError`, because assigning a method strips its body.

**Answer: B.** Both properties refer to the same function. Its ordinary dynamic receiver comes from this invocation. Creating a method inside an object literal does not permanently bind its `this` to that object.

## 2. Destructuring a Method

What does this program print?

```js
'use strict';

const settings = {
  readReceiver() { return this; }
};
const { readReceiver } = settings;
console.log(readReceiver() === undefined);

// Expected output (check after answering):
// true
```

- A. `false`, because destructuring preserves a bound receiver.
- B. A `ReferenceError`, because destructuring cannot extract functions.
- C. A `TypeError`, because returning `this` without a receiver is forbidden.
- D. `true`, because the extracted strict function is called without an object receiver.

**Answer: D.** Destructuring reads the property value into a local binding. The later standalone call supplies `undefined` as `this`, and the strict target preserves it. Returning `undefined` is valid; accessing a property on it would throw.

## 3. Parentheses and the Comma Operator

What does this program print?

```js
'use strict';

const queue = {
  readReceiver() { return this; }
};
console.log((queue.readReceiver)() === queue);
console.log((0, queue.readReceiver)() === undefined);

// Expected output (check after answering):
// true
// true
```

- A. `true`, then `true`: parentheses preserve the property reference; the comma expression yields a function value.
- B. `false`, then `true`: parentheses always detach methods.
- C. `true`, then `false`: the comma operator binds the function to `0`.
- D. `false`, then `false`: neither expression can supply a receiver.

**Answer: A.** Grouping a property reference does not discard the reference used to determine `this`. The comma operator evaluates its operands and returns the right operand's value, so the second call has no property receiver. The leading `0` does not become `this`.

## 4. An Arrow Created Inside an Explicitly Called Function

What does this program print?

```js
'use strict';

function makeReader() {
  return () => this.region;
}
const read = makeReader.call({ region: 'ap-south' });
console.log(read.call({ region: 'eu-west' }));

// Expected output (check after answering):
// ap-south
```

- A. `eu-west`, because `call` can replace every function's `this`.
- B. `undefined`, because arrows have no access to any `this`.
- C. `ap-south`, because the arrow uses `makeReader`'s surrounding `this` binding.
- D. A `TypeError`, because arrows have no `call` method.

**Answer: C.** The arrow resolves `this` through its enclosing function invocation. Calling the arrow with `call` does not create a new receiver binding for it. Arrows can still be invoked through `call` and receive ordinary positional arguments.

## 5. `call` and `apply` Have Different Argument Interfaces

What does this program print?

```js
'use strict';

function countArguments(...values) {
  return values.length;
}
console.log(countArguments.call(null, ['queued', 'done']));
console.log(countArguments.apply(null, ['queued', 'done']));

// Expected output (check after answering):
// 1
// 2
```

- A. `2`, then `2`, because both APIs always expand arrays.
- B. `1`, then `2`, because `call` receives one array argument and `apply` builds an argument list from its elements.
- C. `1`, then `1`, because an array always counts as one argument.
- D. Both calls throw because `null` is not an object.

**Answer: B.** `call` takes positional arguments after the receiver; here there is one such argument. `apply` interprets its second argument as an array-like argument list. This target does not access `this`, so its null receiver causes no failure.

## 6. Strict Targets Preserve Primitive Receivers

What does this program print?

```js
'use strict';

function readReceiver() { return this; }
console.log(readReceiver.call(7) === 7);
console.log(readReceiver.call(null) === null);

// Expected output (check after answering):
// true
// true
```

- A. `false`, then `false`, because `call` always boxes primitives and substitutes the global object for null.
- B. `true`, then `false`, because strict mode boxes only null.
- C. Both calls throw because receivers must be objects.
- D. `true`, then `true`, because this strict target preserves both supplied values.

**Answer: D.** Strict ordinary functions preserve the receiver value they receive. Non-strict ordinary functions instead substitute their realm's global object for nullish receivers and box other primitives. The target's mode controls those transformations, not whether its caller is strict. See [Function.prototype.call](https://tc39.es/ecma262/multipage/fundamental-objects.html#sec-function.prototype.call).

## 7. Array-Like Data Is Different From Iterable Data

What does this program print?

```js
'use strict';

function countArguments(...values) { return values.length; }
const arrayLike = { 0: 'a', 1: 'b', length: 2 };
const iterable = new Set(['a', 'b']);

console.log(countArguments.apply(null, arrayLike));
console.log(countArguments.apply(null, iterable));
console.log(countArguments(...iterable));

// Expected output (check after answering):
// 2
// 0
// 2
```

- A. `2`, `0`, `2`: `apply` reads an array-like length, while spread consumes an iterator.
- B. `2`, `2`, `2`: every iterable automatically has an array-like length.
- C. The first call throws because `apply` accepts only real arrays.
- D. The second call throws because sets are never accepted as objects by `apply`.

**Answer: A.** The plain object provides indexed properties and `length`. The unmodified set has no `length` property, so the array-like argument list used by `apply` is empty; its `size` is not used. Spread follows the set's iterator and supplies two arguments. This follows the specification's [array-like list conversion](https://tc39.es/ecma262/multipage/abstract-operations.html#sec-createlistfromarraylike).

## 8. `Reflect.apply` Requires an Argument-List Object

What does this program print?

```js
'use strict';

function countArguments(...values) { return values.length; }
console.log(countArguments.apply(null, null));
try {
  Reflect.apply(countArguments, null, null);
} catch (error) {
  console.log(error.name);
}

// Expected output (check after answering):
// 0
// TypeError
```

- A. `0`, then `0`, because the two APIs are identical in every detail.
- B. Two `TypeError` lines, because both require arrays.
- C. `0`, then `TypeError`, because `Function.prototype.apply` special-cases nullish argument lists and `Reflect.apply` does not.
- D. `1`, then `1`, because each call passes null as a positional argument.

**Answer: C.** The null argument-list parameter to `Function.prototype.apply` means no arguments. `Reflect.apply` converts its third parameter through the array-like conversion operation, which requires an object. Pass `[]` for an empty list. See [Function.prototype.apply](https://tc39.es/ecma262/multipage/fundamental-objects.html#sec-function.prototype.apply) and [Reflect.apply](https://tc39.es/ecma262/multipage/reflection.html#sec-reflect.apply).

## 9. Binding an Already-Bound Function

What does this program print?

```js
'use strict';

function describe(...parts) {
  return `${this.name}: ${parts.join(',')}`;
}
const first = describe.bind({ name: 'first' }, 'A');
const second = first.bind({ name: 'second' }, 'B');
console.log(second('C'));

// Expected output (check after answering):
// first: A,B,C
```

- A. `second: A,B,C`, because the most recent receiver replaces the old one.
- B. `first: A,B,C`, because the inner binding keeps its receiver and leading arguments remain ordered.
- C. `first: B,A,C`, because the most recent prefix moves ahead of every earlier prefix.
- D. A `TypeError`, because bound functions cannot be bound again.

**Answer: B.** The outer bound function calls `first` with `B` followed by `C`. `first` uses its own saved receiver and prepends `A`. Rebinding can add leading arguments without replacing the receiver stored by the earlier binding during ordinary calls.

## 10. Binding Does Not Snapshot Object Properties

What does this program print?

```js
'use strict';

const owner = {
  status: 'queued',
  read() { return this.status; }
};
const read = owner.read.bind(owner);
owner.status = 'finished';
console.log(read());

// Expected output (check after answering):
// finished
```

- A. `queued`, because binding copies the receiver's fields.
- B. `undefined`, because the bound receiver is discarded after creation.
- C. A `TypeError`, because bound receivers are frozen automatically.
- D. `finished`, because the saved receiver still refers to the same mutable object.

**Answer: D.** Binding retains the object as a receiver. The target reads its current property when invoked. If an API needs an initial value to remain fixed, that value must be captured separately under an explicit snapshot contract.

## 11. Constructing Through a Native Bound Function

What does this program print?

```js
'use strict';

function Entry(id) { this.id = id; }
const existing = { id: 'unchanged' };
const BoundEntry = Entry.bind(existing, 'E-1');
const created = new BoundEntry();

console.log(created.id, existing.id);
console.log(created instanceof Entry, created instanceof BoundEntry);

// Expected output (check after answering):
// E-1 unchanged
// true true
```

- A. `E-1 unchanged`, then `true true`: construction uses a new instance while preserving the prefixed argument.
- B. `E-1 E-1`, then `false true`: construction always modifies the saved receiver.
- C. `undefined unchanged`, then `true false`: bound arguments are ignored with `new`.
- D. A `TypeError`, because native bound functions are always nonconstructible.

**Answer: A.** `Entry` is constructible, so its native bound function is too. The construction path uses the target constructor and saved arguments without supplying the saved receiver. For this ordinary constructor and its bound function, both `instanceof` checks succeed. See [bound-function construction](https://tc39.es/ecma262/multipage/ordinary-and-exotic-objects-behaviours.html#sec-bound-function-exotic-objects-construct-argumentslist-newtarget).

## 12. Binding Does Not Make an Arrow Constructible

What does this program print?

```js
'use strict';

const makeEntry = id => ({ id });
const makeSavedEntry = makeEntry.bind(null, 'E-2');
console.log(makeSavedEntry().id);
try {
  new makeSavedEntry();
} catch (error) {
  console.log(error.name);
}

// Expected output (check after answering):
// E-2
// TypeError
```

- A. `E-2`, then no error, because returning an object makes a function a constructor.
- B. A `TypeError` on the first call, because arrows cannot be partially applied.
- C. `E-2`, then `TypeError`, because binding can prefill an arrow's arguments but cannot add construction support.
- D. `undefined`, then `TypeError`, because arrows ignore bound positional arguments.

**Answer: C.** An arrow's lexical `this` rules do not stop it from receiving arguments through a bound wrapper. However, native binding supplies constructor behavior only when the target is already constructible. Returning an object from an ordinary call does not change that distinction.

## 13. Cleanup Requires the Registered Function Object

What does this program print?

```js
'use strict';

const owner = { handle() {} };
const saved = owner.handle.bind(owner);
const callbacks = new Set([saved]);
console.log(callbacks.delete(owner.handle.bind(owner)), callbacks.size);
console.log(callbacks.delete(saved), callbacks.size);

// Expected output (check after answering):
// false 1
// true 0
```

- A. `true 0`, then `false 0`, because equal source code means equal function identity.
- B. `false 1`, then `true 0`, because each `bind` call creates a different function.
- C. `false 1`, then `false 1`, because bound callbacks cannot be removed.
- D. `true 1`, then `true 0`, because the first removal only weakens the reference.

**Answer: B.** The first deletion passes a fresh function object. It differs from `saved` even though the target and receiver match. The second deletion uses the exact registered function. Store callback identity when the API uses it for later removal.

## 14. A Callback API's `thisArg` Does Not Override an Arrow

What does this program print?

```js
'use strict';

function buildLabels() {
  const supplied = { prefix: 'supplied' };
  const normal = ['A'].map(function (value) {
    return `${this.prefix}:${value}`;
  }, supplied);
  const arrow = ['A'].map(value => `${this.prefix}:${value}`, supplied);
  return `${normal[0]} | ${arrow[0]}`;
}

console.log(buildLabels.call({ prefix: 'outer' }));

// Expected output (check after answering):
// supplied:A | outer:A
```

- A. `supplied:A | supplied:A`, because `map` overwrites every callback's receiver.
- B. `outer:A | outer:A`, because all nested functions capture `this` lexically.
- C. A `TypeError`, because `map` does not accept a `thisArg`.
- D. `supplied:A | outer:A`, because the normal callback uses the supplied receiver and the arrow uses the enclosing invocation's receiver.

**Answer: D.** This normal callback receives the API's explicit `thisArg`. The arrow resolves `this` from `buildLabels`, whose receiver was supplied by `call`. Distinguish an API's attempt to supply a receiver from the target function's rules for using that value.

## 15. A Bound Method and a Property-Looking Wrapper

What does this program print?

```js
'use strict';

const owner = {
  prefix: 'Doc',
  format(value) { return `${this.prefix}:old:${value}`; }
};
const bound = owner.format.bind(owner);
const lookup = value => owner.format(value);
owner.format = function (value) { return `${this.prefix}:new:${value}`; };

console.log(bound('A'));
console.log(lookup('A'));

// Expected output (check after answering):
// Doc:old:A
// Doc:new:A
```

- A. `Doc:old:A`, then `Doc:new:A`, because binding saves the current function while the wrapper reads the property on each call.
- B. Two `Doc:new:A` lines, because bound functions track property replacement.
- C. Two `Doc:old:A` lines, because wrappers snapshot all property lookups.
- D. Two `TypeError` lines, because replacing a method invalidates every existing reference.

**Answer: A.** Both callbacks arrange for `owner` to be the receiver. Their target selection differs: the bound callback stores the earlier function value, while the arrow evaluates `owner.format` again when invoked. Method replacement changes the property without changing already-retained function objects.

## 16. Evaluating a Claimed `bind` Polyfill

A utility saves a target, receiver, and leading arguments in a closure. It returns a concise method that uses `Reflect.apply`. It passes callback tests and rejects `new`. Which conclusion is justified?

- A. It is a complete native `bind` polyfill because ordinary calls are the only observable behavior of functions.
- B. Adding a `prototype` property automatically makes it a constructor with native bound-function semantics.
- C. It can satisfy an explicitly documented call-only contract, but does not implement native `bind` construction or all metadata and identity-related behavior.
- D. It is necessarily incorrect for ordinary calls because only engines can forward a receiver.

**Answer: C.** A bounded wrapper can correctly preserve a receiver, argument order, results, and throws for ordinary calls. Native binding also has behavior involving construction, `new.target`, `instanceof`, and function metadata. A concise method has no constructor internal method; assigning a property named `prototype` does not create one. Evaluate an implementation against its stated contract, and do not label the exercise wrapper a general polyfill.
