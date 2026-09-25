# Theory

## A Receiver Belongs to an Invocation

The **receiver** is the value supplied as `this` for a call. An ordinary function can use that value to read or update the state of the object on whose behalf it is running. This lets one implementation operate on several compatible objects.

```js
'use strict';

function describeStock() {
  return `${this.sku}: ${this.quantity}`;
}

const warehouse = { sku: 'BOOK-JS', quantity: 8, describeStock };
const storefront = { sku: 'BOOK-JS', quantity: 3, describeStock };

console.log(warehouse.describeStock());
console.log(storefront.describeStock());
console.log(warehouse.describeStock === storefront.describeStock);
// Expected output:
// BOOK-JS: 8
// BOOK-JS: 3
// true
```

Both properties reference the same function. Calling through a different object supplies a different receiver. Copying the method to another property copies a function reference; it does not permanently attach the function to its original object.

`this` is not the function itself, its source location, or a search through the caller's local variables. Also, `this.quantity` is property access: after resolving `this`, JavaScript looks for a property named `quantity` on that value. A local variable named `quantity` is a separate binding.

## Property Calls and Detached Calls

For the ordinary object calls in this chapter, `obj.method()` and `obj['method']()` supply `obj`. In `shop.inventory.describe()`, the immediate receiver is `shop.inventory`. Merely evaluating `obj.method` to store it in a variable does not preserve that receiver for a later plain call.

```js
'use strict';

const inventory = {
  identify() { return this; }
};
const detached = inventory.identify;
const { identify } = inventory;

console.log(inventory.identify() === inventory);
console.log((inventory.identify)() === inventory);
console.log(detached() === undefined);
console.log(identify() === undefined);
console.log((0, inventory.identify)() === undefined);
// Expected output:
// true
// true
// true
// true
// true
```

Parentheses around a property expression preserve its reference. Assignment, destructuring, and the comma expression above produce a function value without the original property receiver. The comma operator evaluates both operands and returns the right operand's value; it is included to explain generated code, not as a recommended calling style.

The specification represents this distinction with **Reference Records** during expression evaluation. They are internal specification values, not objects you can store or inspect from JavaScript. [ECMAScript: EvaluateCall](https://tc39.es/ecma262/multipage/ecmascript-language-expressions.html#sec-evaluatecall).

## Strict and Non-Strict Functions

A plain call to an ordinary strict function supplies `undefined`. Explicitly supplied values such as `null` and `7` stay unchanged. The following function does not dereference `this`, so a missing receiver is harmless:

```js
'use strict';

function receiver() { return this; }

console.log(receiver() === undefined);
console.log(receiver.call(null) === null);
console.log(receiver.call(7) === 7);
// Expected output:
// true
// true
// true
```

An ordinary non-strict function substitutes its realm's global `this` value for `null` or `undefined`, and converts primitive receivers to wrapper objects. A realm is an execution environment with its own globals and built-ins; most examples here use just one realm. The target function's strictness determines this conversion, even when its caller is strict.

Run the next example in a separate CommonJS `.cjs` file with **no** top-level `'use strict'`. It deliberately demonstrates older non-strict behavior.

```js
// Deliberately non-strict CommonJS file.
function legacyReceiver() { return this; }

function strictCaller() {
  'use strict';
  return legacyReceiver.call(null);
}

console.log(strictCaller() === globalThis);
console.log(typeof legacyReceiver.call(7));
console.log(legacyReceiver.call(7).valueOf());
// Expected output:
// true
// object
// 7
```

Use strict code for new examples and APIs. It makes an accidentally missing receiver easier to detect; it does not automatically validate a receiver. [ECMAScript: OrdinaryCallBindThis](https://tc39.es/ecma262/multipage/ordinary-and-exotic-objects-behaviours.html#sec-ordinarycallbindthis).

## `call`: Invoke Now with Explicit Arguments

`fn.call(receiver, first, second)` invokes `fn` immediately. The first argument supplies the receiver; subsequent arguments become the function's ordinary arguments. `call` returns the target's result or propagates its exception.

```js
'use strict';

function formatStock(prefix, suffix) {
  return `${prefix}${this.sku}: ${this.quantity}${suffix}`;
}

const stock = { sku: 'BOOK-JS', quantity: 8 };
console.log(formatStock.call(stock, '[', ']'));
console.log(Object.hasOwn(stock, 'formatStock'));
// Expected output:
// [BOOK-JS: 8]
// false
```

No temporary method property is needed on `stock`. This matters when the receiver is frozen, has a conflicting property name, or should never be mutated by an adapter. A function is borrowable only if the new receiver satisfies its contract; a compatible set of public properties does not substitute for private fields or built-in internal slots.

## `apply` and Argument Collections

`fn.apply(receiver, argumentList)` also invokes immediately, but obtains the arguments from an array-like object. Array-like means indexed properties and a `length`; it does not require iteration support. `null` or `undefined` as the second argument means no arguments.

```js
'use strict';

function makeLabel(prefix, status) {
  return `${prefix}${this.id}: ${status}`;
}

const shipment = { id: 'shipment-17' };
const values = { 0: 'Dispatch ', 1: 'ready', length: 2 };
console.log(makeLabel.apply(shipment, values));

function countArguments() { return arguments.length; }
console.log(countArguments.apply(null, null));
// Expected output:
// Dispatch shipment-17: ready
// 0
```

Spread in a call reads an **iterable**, so a `Set` can be spread, while the plain array-like object above cannot. Conversely, a `Set` with no `length` provides no arguments to `apply`. Arrays normally support both protocols. [MDN: Function.prototype.apply](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/apply).

```js
'use strict';

function count() { return arguments.length; }

const statuses = new Set(['packed', 'sent']);
console.log(count(...statuses));
console.log(count.apply(undefined, statuses));
// Expected output:
// 2
// 0
```

For existing arrays, `fn.call(receiver, ...args)` and `fn.apply(receiver, args)` often express the same intended call. Neither is a streaming solution for an unbounded collection. Use iteration when the input may exceed practical call-argument limits.

## `Reflect.apply`: Explicit Forwarding

`Reflect.apply(fn, receiver, args)` expresses the function, receiver, and argument list as three separate values. It avoids reading a possibly shadowed `fn.apply` property. Its argument list must be an array-like object; unlike `Function.prototype.apply`, it rejects `null` and `undefined` there.

```js
'use strict';

function label(status) { return `${this.id}: ${status}`; }
label.apply = () => 'shadowed';

const shipment = { id: 'shipment-17' };
console.log(label.apply(shipment, ['ready']));
console.log(Reflect.apply(label, shipment, ['ready']));
// Expected output:
// shadowed
// shipment-17: ready
```

This is useful in a forwarding adapter. It does not bypass the target function's rules, private-field checks, or application authorization. [ECMAScript: Reflect.apply](https://tc39.es/ecma262/multipage/reflection.html#sec-reflect.apply).

## `bind`: Prepare a Function for Later Calls

`fn.bind(receiver, ...leadingArguments)` returns a new bound function without invoking the target body. Later ordinary calls use the stored receiver and place stored arguments before arguments supplied at call time.

```js
'use strict';

function formatStatus(prefix, status) {
  return `${prefix}${this.id}: ${status}`;
}

const shipment = { id: 'shipment-17' };
const dispatchLabel = formatStatus.bind(shipment, 'Dispatch ');

console.log(dispatchLabel('ready'));
shipment.id = 'shipment-18';
console.log(dispatchLabel('sent'));
console.log(dispatchLabel === formatStatus.bind(shipment, 'Dispatch '));
// Expected output:
// Dispatch shipment-17: ready
// Dispatch shipment-18: sent
// false
```

Binding retains the receiver value, so an object receiver is retained by reference. It does not copy that object's properties. Each `bind` call creates a new identity, which matters when registering and removing callbacks. Captured object arguments also remain references.

Pre-filling leading arguments is **partial application**. It reduces how much a caller must supply; it is not automatically currying, which transforms a function into successive calls that accept arguments in stages.

An existing bound function cannot be given a different receiver by `call`, `apply`, or another `bind`. Rebinding can still prepend more arguments to the call of the first bound function:

```js
'use strict';

function collect(first, second, third) {
  return `${this.id}: ${first},${second},${third}`;
}

const once = collect.bind({ id: 'original' }, 'A');
const twice = once.bind({ id: 'ignored' }, 'B');
console.log(twice.call({ id: 'also ignored' }, 'C'));
// Expected output:
// original: A,B,C
```

Follow the wrappers from the outermost call inward: `twice` supplies `B,C` to `once`; `once` supplies `A,B,C` and its stored receiver to `collect`. [MDN: Function.prototype.bind](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind).

## Arrows Use the Surrounding `this` Binding

An arrow has no own `this` binding. A `this` expression in its body resolves through the surrounding environment. The enclosing ordinary function's invocation can therefore establish the receiver that the arrow continues to use later.

```js
'use strict';

const shipment = {
  id: 'shipment-17',
  makeReader() {
    return () => this.id;
  }
};

const readId = shipment.makeReader();
console.log(readId());
console.log(readId.call({ id: 'replacement' }));
console.log(readId.bind({ id: 'replacement' })());
// Expected output:
// shipment-17
// shipment-17
// shipment-17
```

Assigning an arrow to an object property does not create an enclosing `this` binding for it. An object literal is not a function invocation. Use ordinary method syntax when the caller should select the receiver, and an arrow inside a method when a nested callback should use that method invocation's `this`.

Binding an arrow can still pre-fill its ordinary arguments. It cannot replace its lexical `this`, and neither an arrow nor a bound arrow becomes constructible. [MDN: Arrow function expressions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions).

## Classes Do Not Automatically Bind Methods

A class method is strict and normally shared through the class's prototype. Extracting it loses its property-call receiver just as extracting an object method does. An instance field initialized with an arrow instead creates a function for that instance that uses the field initializer's `this`.

```js
'use strict';

class Shipment {
  constructor(id) { this.id = id; }
  read() { return this.id; }
  readLater = () => this.id;
}

const first = new Shipment('shipment-17');
const second = new Shipment('shipment-18');
const callback = first.readLater;

console.log(first.read === second.read);
console.log(first.readLater === second.readLater);
console.log(callback.call(second));
console.log(first.read.call(second));
// Expected output:
// true
// false
// shipment-17
// shipment-18
```

An arrow field is convenient when a callback belongs to one instance. A prototype method is useful when calls should choose the receiver or instances should share the method function. A constructor can also bind a method once and store the resulting callback. [Performance notes](10-performance-security.md) discuss allocation and retention trade-offs.

## Construction Is a Separate Operation

`new Constructor(...args)` constructs an object using a constructible target. For an ordinary base constructor that returns no object explicitly, its `this` is the new instance. A bound constructor forwards construction to its target with bound arguments; it does not use the bound receiver as the instance.

```js
'use strict';

function Shipment(prefix, number) {
  this.id = `${prefix}-${number}`;
}

const unrelated = { id: 'unchanged' };
const DispatchShipment = Shipment.bind(unrelated, 'dispatch');
const created = new DispatchShipment(17);

console.log(created.id);
console.log(unrelated.id);
console.log(created instanceof Shipment);
console.log(created instanceof DispatchShipment);
console.log(Object.hasOwn(DispatchShipment, 'prototype'));
// Expected output:
// dispatch-17
// unchanged
// true
// true
// false
```

A native bound function is constructible only when its target is. A bound function has no own `prototype` property by default, even when it supports construction. These facts are why a small arrow wrapper is not a full `bind` polyfill. A constructor that explicitly returns an object can also replace the result; construction should not be taught as an unconditional promise to return its initial `this`.

## The Runtime Is Part of the Question

Top-level `this` and a plain function call are different questions. State the environment before predicting a top-level result:

| Execution context | Top-level `this` |
| --- | --- |
| Browser classic script, including a strict classic script | The global `this` value, normally `window` |
| ES module in a browser or Node.js | `undefined` |
| Node.js CommonJS file | The module's initial exports object supplied to its wrapper |
| REPL or developer console | Tool-specific evaluation context; reproduce in a file |

Replacing `module.exports` later does not retroactively replace the CommonJS wrapper's `this`. Arrows at file scope inherit the surrounding context, so a top-level arrow example may change behavior when moved between environments. See [MDN: this](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this) and [Node.js: the module wrapper](https://nodejs.org/api/modules.html#the-module-wrapper).

A callback's receiver also depends on the API invoking it. Array methods that accept a `thisArg` can supply it to ordinary callbacks; an arrow ignores it. Node.js `EventEmitter` listeners and browser event listeners have their own invocation contracts, covered in the next sections. The word "callback" alone does not determine `this`.

## Choosing the Operation

| Requirement | Starting choice | Consequence |
| --- | --- | --- |
| Call a method on its owner now | `owner.method(args)` | Receiver comes from the property call |
| Invoke now with an explicit receiver and a few arguments | `fn.call(receiver, a, b)` | Returns the target result immediately |
| Forward a function, receiver, and argument array | `Reflect.apply(fn, receiver, args)` | Preserves the chosen call contract |
| Reuse one receiver as a callback | Bind once and retain the function | Stable identity; retains the chosen receiver |
| Use an enclosing method's receiver in a nested callback | Arrow inside the method | Lexical `this` |
| Keep a wrapper's receiver selected by each caller | Ordinary wrapper forwarding its `this` | Avoids fixing one receiver for all calls |
| Compute only from explicit data | Function parameters | No receiver contract is needed |

Continue with [Internal Working](03-internal-working.md) to trace property references, bound-function storage, and call forwarding.
