# Interview Perspective

A useful answer identifies the function being called, the call expression that supplies its receiver, and any rule that changes how the function uses that receiver. Start there before discussing where the function is stored. These examples run independently in Node.js 20 or later.

## 1. Does a Method Belong Permanently to Its Object?

**Question:** What happens when the same method is called through another object or copied into a variable?

```js
'use strict';

const primary = {
  region: 'ap-south',
  describe() { return this.region; }
};
const backup = { region: 'eu-west', describe: primary.describe };
const detached = primary.describe;

console.log(primary.describe());
console.log(backup.describe());
try {
  detached();
} catch (error) {
  console.log(error.name);
}

// Expected output:
// ap-south
// eu-west
// TypeError
```

**Answer:** The first call supplies `primary`; the second supplies `backup`. The plain call supplies `undefined`, which remains `undefined` inside this strict function. Reading `region` from it throws. All three calls use the same function object.

**Follow-up:** Does the function lose its closure when detached? No. Lexical identifier lookup and `this` selection are separate mechanisms. Extracting a function preserves its lexical environment while changing the call expression that invokes it.

**Interview trap:** Saying that a method always uses the object where it was defined fails the second call. Ordinary methods can be borrowed; their receiver is selected when called.

## 2. What Does an Arrow Remember?

**Question:** Can `call` change the receiver used by an arrow returned from a method?

```js
'use strict';

const exporter = {
  format: 'csv',
  createReader() {
    return () => this.format;
  }
};

const originalReader = exporter.createReader();
const otherReader = exporter.createReader.call({ format: 'json' });
console.log(originalReader.call({ format: 'xml' }));
console.log(otherReader());
exporter.format = 'tsv';
console.log(originalReader());

// Expected output:
// csv
// json
// tsv
```

**Answer:** Each arrow resolves `this` through the particular `createReader` invocation that created it. Calling the arrow with another receiver does not create a local `this` binding. The original arrow still reads a property from the original object, so the later mutation is visible.

**Follow-up:** Would an arrow written directly as an object-literal property capture that object? No. An object literal does not create a `this` binding. The arrow uses its surrounding execution context. This example creates the arrow inside an ordinary method invocation specifically to make that context explicit.

**Follow-up:** Can binding an arrow still be useful? Bound arguments are still prepended. Binding only fails to replace the arrow's lexical `this`.

## 3. When Would You Use `call`, `apply`, or `bind`?

**Question:** How do their timing and argument contracts differ?

```js
'use strict';

function label(kind, id) {
  return `${this.service}:${kind}:${id}`;
}

const context = { service: 'billing' };
console.log(label.call(context, 'invoice', 12));
console.log(label.apply(context, ['refund', 13]));
const invoiceLabel = label.bind(context, 'invoice');
console.log(invoiceLabel(14));

// Expected output:
// billing:invoice:12
// billing:refund:13
// billing:invoice:14
```

**Answer:** `call` invokes now with separately listed arguments. `apply` invokes now with arguments read from an array-like object, or no arguments when that input is `null` or `undefined`. `bind` returns a new function and delays the target call until that function is invoked.

**Follow-up:** Can a `Set` be passed as the second argument to `apply` to expand its values? It is iterable but has no `length` describing indexed elements, so `apply` does not iterate it and supplies no arguments. Convert it to an array, or use spread where an iterable is accepted. `call`, `apply`, and `bind` are specified separately in [ECMAScript's Function prototype methods](https://tc39.es/ecma262/multipage/fundamental-objects.html#sec-properties-of-the-function-prototype-object).

## 4. Can You Rebind a Bound Function?

**Question:** What survives a second `bind` call?

```js
'use strict';

function describe(first, second, third) {
  return `${this.name}:${first},${second},${third}`;
}

const first = describe.bind({ name: 'first' }, 'A');
const second = first.bind({ name: 'second' }, 'B');
console.log(second.call({ name: 'third' }, 'C'));
console.log(first === second);

// Expected output:
// first:A,B,C
// false
```

**Answer:** The outer bound function calls the inner bound function, which supplies its own stored receiver to the original target. The first receiver therefore remains effective for an ordinary call. The arguments accumulate in binding order, followed by call-time arguments. The second binding creates another function object.

**Follow-up:** Does this mean a bound receiver is immutable application state? No. The reference is fixed for ordinary calls, but properties on the referenced object can change. Binding does not freeze or clone it.

## 5. Who Selects a Callback's Receiver?

**Question:** Does passing a method to `map` preserve its original receiver?

```js
'use strict';

const formatter = {
  prefix: 'task-',
  format(id) { return `${this.prefix}${id}`; }
};

const ids = [3, 4];
console.log(ids.map(formatter.format, formatter).join(', '));
console.log(ids.map(id => formatter.format(id)).join(', '));
const callback = formatter.format.bind(formatter);
console.log(ids.map(callback).join(', '));

// Expected output:
// task-3, task-4
// task-3, task-4
// task-3, task-4
// For n IDs: O(n) calls and O(n) result elements, plus string storage.
```

**Answer:** The callback API defines its invocation contract. `map` accepts a second argument used as the receiver when invoking an ordinary callback. The wrapper performs a method call itself. The bound function supplies its stored receiver regardless of the callback API's supplied receiver.

**Follow-up:** Are the three forms interchangeable after `formatter.format` is replaced? No. The first call selects the method before mapping begins; the bound function retains the selected target. The wrapper looks up `formatter.format` on each invocation. See [Edge Cases](09-edge-cases-debugging.md#binding-and-wrapping-disagree-after-method-replacement).

**Follow-up:** Does every array callback API accept `thisArg`? No. Check the specific API. For example, `reduce` uses its second argument as the accumulator's initial value. The `map` contract is defined by [ECMAScript: Array.prototype.map](https://tc39.es/ecma262/multipage/indexed-collections.html#sec-array.prototype.map).

## 6. Does `new` Use a Bound Receiver?

**Question:** A constructor is bound to an existing object. Which object does it initialize when called with `new`?

**Answer:** If the target is constructable, the bound function is constructable too. Construction forwards the bound arguments and call-time arguments, but the bound receiver is unused. For direct `new Bound(...)`, the target's construction rules determine the instance. Binding an arrow cannot make it constructable.

**Follow-up:** Why is a bound class useful even though a class cannot be called without `new`? The bound function can be constructed, with initial constructor arguments already supplied. Calling that same bound class as an ordinary function still throws.

**Follow-up:** Is a hand-written arrow wrapper a complete implementation of `bind`? No. It cannot be constructed, cannot reproduce native construction forwarding, and needs additional work even for metadata such as `length`. State a restricted callback-only contract before writing a teaching implementation. See the runnable construction examples in [Edge Cases](09-edge-cases-debugging.md#construction-does-not-initialize-the-bound-receiver).

## An Answer Checklist

- Identify whether the callable is ordinary, an arrow, a bound function, or a constructor-only class.
- Write the exact call expression and receiver supplied by that call.
- For ordinary functions, inspect the called function's strictness, not just the caller's strictness.
- For arrows, locate the surrounding `this` binding; for bound functions, follow the stored target and arguments.
- Keep receiver choice, lexical lookup, object mutation, and private-field access as separate questions.
- Explain callback identity, replacement, and cleanup when proposing a production fix.
