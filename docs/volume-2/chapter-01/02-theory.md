# Theory

## Names, Bindings, and Values

A name such as `requestId` is an identifier in source code. A binding associates that name with a value in a particular environment. Two bindings can have the same name without being the same storage location, just as two requests can each have an `id` field.

A scope determines where declarations are visible in the source. An environment is the runtime association of bindings for an execution of that scope. One factory definition can therefore produce many environments when called repeatedly. Keep this distinction in mind when drawing examples: one piece of source code does not imply one shared instance of its local state.

## Lexical Scope Follows the Definition

For the ordinary functions in this chapter, enclosing source scopes determine where an outer name is resolved. A caller does not lend its local bindings to the function it calls. This is the lexical scoping model described in the [MDN closure guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures#lexical_scoping).

```js
'use strict';

function createCurrencyReader() {
  const currency = 'INR';
  return () => currency;
}

function renderInAnotherScope(readCurrency) {
  const currency = 'USD';
  return `${currency} / ${readCurrency()}`;
}

const readCurrency = createCurrencyReader();
console.log(renderInAnotherScope(readCurrency));
// Expected output: USD / INR
```

The first currency in the result belongs to `renderInAnotherScope`. The second is read by the arrow created inside `createCurrencyReader`. Passing that arrow as an argument changes who invokes it; it does not relocate the arrow's definition.

This property makes local reasoning possible. If changing an unrelated caller's variable could change a library function's outer names, reviewing that library would require reviewing all of its callers too.

## Function Scope and Block Scope

Within a function, `var` belongs to that function even when written inside an ordinary block. `let` and `const` belong to their enclosing lexical scope, including a block. `const` prevents reassignment of its binding; it does not freeze an object. See the language reference for [`let`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let#description).

```js
'use strict';

function inspectBatch() {
  const status = 'pending';
  if (true) {
    const status = 'ready';
    var processed = 3;
    console.log(status);
  }
  console.log(status, processed);
}

inspectBatch();
// Expected output:
// ready
// pending 3
```

The inner `status` shadows the outer `status`: it is a different binding with the same spelling. Leaving the block restores access to the outer one; it does not undo an assignment. By contrast, `processed` is a function-local binding and remains accessible after the `if` block.

Top-level scope also depends on the execution format. A browser classic script, an ECMAScript module, and a Node.js CommonJS file are different contexts. This chapter puts demonstrations inside functions or blocks so they do not depend on a browser global object. For the Node-specific wrapper behavior, see [Node.js modules](https://nodejs.org/api/modules.html#the-module-wrapper).

## Closures Preserve Access to Bindings

A closure is a function together with access to its surrounding lexical environment. The useful consequence is continued access to outer bindings when the function is invoked elsewhere or after the enclosing call has returned. A return statement does not create the closure; it merely makes an already-created function available to the caller. See [MDN's closure explanation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures#closure).

```js
'use strict';

function createProgress() {
  let completed = 0;
  return {
    advance() {
      completed += 1;
      return completed;
    },
    read() {
      return completed;
    }
  };
}

const importA = createProgress();
const importB = createProgress();

console.log(importA.advance());
console.log(importA.advance());
console.log(importA.read(), importB.read());
console.log(importB.advance());
// Expected output:
// 1
// 2
// 2 0
// 1
```

`importA.advance` and `importA.read` share the `completed` binding established by the first call. The second call creates another binding for `importB`. The function definition is reused, but the state instances are separate. Each operation performs constant work and stores a fixed amount of numeric state, so its algorithmic cost is `O(1)` time and `O(1)` state per progress instance.

## A Binding Is Not a Snapshot

When a callback reads an outer variable, it reads that binding at the time of the call. To retain a particular computed value, put that value in a separate binding yourself.

```js
'use strict';

function prepareReport() {
  let status = 'queued';
  const initialMessage = `Initially ${status}`;
  const report = () => `${initialMessage}; now ${status}`;

  status = 'complete';
  return report;
}

console.log(prepareReport()());
// Expected output: Initially queued; now complete
```

`initialMessage` was computed once when `status` was `'queued'`. It is an ordinary string, not a formula that reruns. The later read of `status` sees `'complete'`. If this output surprises you, identify each declaration and each assignment separately before reasoning about the returned function.

Object references add a second question: did the code preserve an object reference, or copy one of its properties?

```js
'use strict';

function createRouteReaders(config) {
  const initialRoute = config.route;
  return {
    current: () => config.route,
    initial: () => initialRoute
  };
}

const config = { route: '/checkout' };
const readers = createRouteReaders(config);
config.route = '/refund';

console.log(readers.current(), readers.initial());
// Expected output: /refund /checkout
```

The parameter `config` and the caller's variable initially refer to the same object. Mutating that object's property is visible through `current`. `initialRoute` stores a primitive string obtained earlier. A closure does not automatically clone or freeze an object. Decide whether your API promises live configuration or a snapshot, and name it accordingly.

## The Temporal Dead Zone Still Applies

A lexical binding can exist before its initialization statement runs. Reading it in that interval throws `ReferenceError`, even when the read comes through a closure. The nearest matching declaration takes precedence; the engine does not skip an uninitialized binding to find another value farther out. This interval is the [temporal dead zone](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let#temporal_dead_zone_tdz).

```js
'use strict';

function demonstrateInitialization() {
  const readLimit = () => limit;
  try {
    console.log(readLimit());
  } catch (error) {
    console.log(error.name);
  }
  let limit = 5;
  console.log(readLimit());
}

demonstrateInitialization();
// Expected output:
// ReferenceError
// 5
```

Creating `readLimit` is valid because its body has not read `limit` yet. Calling it before initialization fails. Calling it afterward succeeds. The timing question is about the read, not just the line where the callback was defined.

## Loop Callbacks Need the Right Binding

First remove timers from the problem. Collect functions, let the loop finish, and invoke the functions synchronously:

```js
'use strict';

function collectCallbacks() {
  const shared = [];
  for (var index = 0; index < 3; index += 1) {
    shared.push(() => index);
  }

  const separate = [];
  for (let index = 0; index < 3; index += 1) {
    separate.push(() => index);
  }

  console.log(shared.map(read => read()).join(', '));
  console.log(separate.map(read => read()).join(', '));
}

collectCallbacks();
// Expected output:
// 3, 3, 3
// 0, 1, 2
```

In the first loop, each function reads one shared `var` binding. That binding contains `3` when the callbacks run. The second loop's `let` declaration establishes separate iteration bindings, so the callbacks retain access to different bindings. This behavior depends on declaring `let` in the loop header; declaring one `let index` before the loop would still share that single binding. See the [`for` reference on lexical declarations](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for#lexical_declarations_in_the_initialization_block).

Each collection takes `O(n)` time and retains `O(n)` functions for `n` iterations. Choosing the correct binding fixes the values; it does not reduce the number of functions created.

## When a Closure Helps

Use a closure when an operation needs a small, stable set of dependencies or state that should be managed through a limited API. A request logger, private progress counter, subscription cleanup function, or configured validator fits this shape.

Prefer an ordinary function with explicit arguments when the caller must choose all inputs on every call. Prefer a plain data record when the main requirement is serialization or inspecting state. A closure can make dependencies convenient to carry, but readers still need to know what those dependencies are and how long they live.

Continue with [Internal Working](03-internal-working.md) to trace the binding model through a returned function call.
