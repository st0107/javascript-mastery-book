# Edge Cases, Debugging, and Failure Modes

Receiver bugs often appear when correct direct calls become callbacks. Reproduce the precise invocation before changing the function's syntax. All snippets below are independent Node.js 20-or-later programs; one explicitly creates a non-strict function to demonstrate receiver conversion.

## Parentheses Preserve a Method Reference; Extraction Does Not

```js
'use strict';

const account = {
  id: 'A-7',
  read() { return this === undefined ? 'detached' : this.id; }
};
const { read } = account;

console.log((account.read)());
console.log(account.read?.());
console.log(read());
console.log((0, account.read)());

// Expected output:
// A-7
// A-7
// detached
// detached
```

Parenthesizing `account.read` preserves the property reference used by the call. An optional call through that property also retains the receiver when the method exists. Destructuring copies the function value into `read`. The comma expression likewise produces a value, so neither subsequent plain call has `account` as its receiver.

Optional chaining handles a nullish value at its checked position. It does not repair receiver loss or guarantee that a present value is callable. If `read` contains a string, `account.read?.()` still throws. If `account` itself might be nullish, that is a separate check such as `account?.read?.()`.

## The Called Function's Strictness Controls Conversion

```js
'use strict';

function strictReceiver() { return this; }
// Fixed source only: Function bodies do not inherit caller strictness.
const sloppyReceiver = Function('return this;');

console.log(strictReceiver.call(null) === null);
console.log(strictReceiver.call(7) === 7);
console.log(sloppyReceiver.call(null) === globalThis);
console.log(typeof sloppyReceiver.call(7));
console.log(sloppyReceiver.bind(undefined)() === globalThis);

// Expected output:
// true
// true
// true
// object
// true
```

A strict ordinary function preserves a supplied primitive, `null`, or `undefined`. A non-strict ordinary function substitutes its realm's global `this` value for `null` or `undefined`, and boxes other primitives. A strict caller does not change the callee's definition. Binding a value stores it; the non-strict target can still perform its usual conversion when called. This follows [ECMAScript: OrdinaryCallBindThis](https://tc39.es/ecma262/multipage/ordinary-and-exotic-objects-behaviours.html#sec-ordinarycallbindthis).

The `Function` constructor above isolates the legacy behavior without depending on whether this file is loaded as CommonJS or an ES module. Do not turn it into a utility that accepts source text from users. For normal application code, use strict functions or modules and explicit dependencies.

## Binding and Wrapping Disagree After Method Replacement

```js
'use strict';

const service = {
  version: 1,
  read() { return `original:${this.version}`; }
};
const bound = service.read.bind(service);
const wrapper = () => service.read();

service.read = function () { return `replacement:${this.version}`; };
service.version = 2;
console.log(bound());
console.log(wrapper());

// Expected output:
// original:2
// replacement:2
```

The bound function retains the original target function and the receiver object. The wrapper retains access to `service` and performs a new property lookup each time. Both observe the current `version`; only the wrapper observes the replaced method. Choose deliberately when using test spies, plugins, or an API that permits method replacement.

A further distinction appears when the variable itself is reassigned: a wrapper that reads a mutable variable follows its new object, whereas a bound function retains the object supplied at binding time. An arrow wrapper is therefore not a universal drop-in replacement for `bind`.

## Repeated Binding Breaks Listener Removal

```js
'use strict';

const bus = new EventTarget();
const panel = {
  updates: 0,
  refresh() { this.updates += 1; }
};
const listener = panel.refresh.bind(panel);
bus.addEventListener('refresh', listener);
bus.removeEventListener('refresh', panel.refresh.bind(panel));
bus.dispatchEvent(new Event('refresh'));
console.log(panel.updates);

bus.removeEventListener('refresh', listener);
bus.dispatchEvent(new Event('refresh'));
console.log(panel.updates);

// Expected output:
// 1
// 1
```

The unsuccessful removal creates a second function object. It does not match the registered listener, despite using the same target and receiver. Store one function and pass that exact value to registration and removal. A newly created arrow wrapper has the same identity problem.

For DOM event listeners, matching also includes event type and the capture flag. Other APIs can use a token or a returned unsubscribe function instead. Follow the actual registry contract; see [DOM: removeEventListener](https://dom.spec.whatwg.org/#dom-eventtarget-removeeventlistener). The example uses the global `EventTarget` and `Event` available in Node.js 20 and browsers.

## A Correctly Shaped Receiver May Still Fail a Private Check

```js
'use strict';

class Vault {
  #balance = 8;
  read() { return this.#balance; }
}

const vault = new Vault();
const read = vault.read;
console.log(read.call(vault));
for (const receiver of [{ balance: 8 }, new Proxy(vault, {})]) {
  try {
    console.log(read.call(receiver));
  } catch (error) {
    console.log(error.name);
  }
}
console.log(read.bind(vault)());

// Expected output:
// 8
// TypeError
// TypeError
// 8
```

The receiver must carry the actual private element that `#balance` denotes. A public property with a similar name does not qualify. A default proxy around the instance is another object and does not carry the target's private element. Selecting a receiver with `call` cannot manufacture that element. Binding to the original instance works because that instance already has it.

Other built-ins can require internal state as well: borrowing a `Map` method onto an arbitrary plain object is invalid. Debug these failures by checking receiver identity and the operation's requirements, rather than repeatedly changing property names. Private lookup and failure are specified by [ECMAScript: PrivateGet](https://tc39.es/ecma262/multipage/abstract-operations.html#sec-privateget).

## Construction Does Not Initialize the Bound Receiver

```js
'use strict';

function Job(queue, id) {
  this.queue = queue;
  this.id = id;
}

const existing = { queue: 'unchanged' };
const BoundJob = Job.bind(existing, 'critical');
const created = new BoundJob(42);

console.log(created.queue, created.id);
console.log(existing.queue, Object.hasOwn(existing, 'id'));
console.log(created instanceof Job, created instanceof BoundJob);
console.log(Object.hasOwn(BoundJob, 'prototype'));

// Expected output:
// critical 42
// unchanged false
// true true
// false
```

Construction forwards arguments to `Job`; it does not reuse `existing` as the new instance. In this direct construction, the resulting object's prototype comes from `Job.prototype`. The bound function lacks its own `prototype` property by default, even though it is constructable. Its default `instanceof` behavior delegates to its target. These are native bound-function rules, not effects of copying the constructor's properties. See [ECMAScript: Bound Function Exotic Objects](https://tc39.es/ecma262/multipage/ordinary-and-exotic-objects-behaviours.html#sec-bound-function-exotic-objects).

Consequently, using this unmodified bound function directly as a class's `extends` expression fails: the superclass must provide a suitable `prototype` value. Constructability and suitability as a superclass are different checks. A full bind polyfill must account for more than forwarding ordinary calls.

## Binding an Arrow Does Not Make It Constructable

```js
'use strict';

const makeRecord = id => ({ id });
const makeFixedRecord = makeRecord.bind(null, 6);
console.log(makeFixedRecord().id);
try {
  new makeFixedRecord();
} catch (error) {
  console.log(error.name);
}

// Expected output:
// 6
// TypeError
```

Returning an object does not make a function a constructor. The arrow lacks construction behavior, and binding it does not add that behavior. Use an ordinary factory call for a factory API; use `new` only when the API defines construction.

## Debugging Playbook

1. Capture the failing call expression, including destructuring, wrapper creation, or framework registration that preceded it.
2. Identify the called function's kind and strictness. Do not infer either from its variable name.
3. Inspect the actual receiver by identity, then inspect only the properties or private elements the operation requires.
4. For an arrow, locate the invocation or initializer supplying the surrounding `this` binding.
5. For a bound function, record when its target and receiver were selected, and whether either was later replaced elsewhere.
6. For listeners, compare the registered and removed function values and verify the event name and relevant options.
7. Add an assertion for the failing boundary: detached call behavior, two separate instances, replacement timing, or silence after cleanup.

Avoid fixing detachment with a process-wide variable holding the current object. That replaces a local receiver defect with shared mutable state and can route one operation through another object's context.
