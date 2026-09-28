# Theory

## A Language, an Engine, and a Host

A language defines what a program means. For example, multiplication of two Number values produces another Number according to ECMAScript rules. An engine implements those rules using its own data structures and machine code. A host decides how source arrives, which external operations are available, and how work is scheduled.

This separation explains a common failure: moving a function that calls `document.querySelector` from a browser page into Node does not make the selector expression invalid JavaScript. The program parses, but resolving `document` fails because that host does not supply it by default. Conversely, `Array.isArray` is a language built-in available across conforming hosts.

```js
'use strict';

const values = [1, 2, 3];
console.log(Array.isArray(values), values.length);
console.log(typeof missingHostApi);

// Expected output:
// true 3
// undefined
```

The final line demonstrates a safe `typeof` check for an undeclared name. It does not establish that every present value is callable, permitted, or functioning. Temporal-dead-zone bindings have a different rule, covered in Chapter 2.

## How JavaScript Reached Its Current Role

JavaScript began at Netscape in 1995 to make web pages programmable. Standardization produced the first ECMAScript edition in 1997. The language subsequently accumulated more structured facilities while retaining compatibility with existing programs: ES5 introduced strict mode, and ECMAScript 2015 added features including lexical declarations, classes, promises, and modules. The historical details and design constraints are documented in the co-designers' [JavaScript history paper](https://www.wirfs-brock.com/allen/posts/866).

The practical consequence is coexistence. You will encounter `var` and `let`, CommonJS and ECMAScript modules, callback APIs and promises. Older syntax is not automatically broken, and newer syntax does not automatically fit every deployment target. Learn the behavior and the compatibility requirement before migrating code.

## ECMAScript and TC39

TC39 develops ECMAScript through a proposal process. Ecma publishes the resulting standards. A proposal is a design being evaluated; a shipped engine implementation and a finalized standard are related but separate milestones.

The current process uses stages 0, 1, 2, 2.7, 3, and 4:

| Stage | Meaning for a reader |
| --- | --- |
| 0 | An idea under exploration |
| 1 | A problem and possible solution under committee consideration |
| 2 | A preferred design being refined |
| 2.7 | Complete design undergoing testing and validation |
| 3 | Implementation experience is being gathered |
| 4 | Completed feature ready for integration into the standard |

Check the [TC39 process](https://tc39.es/process-document/) when evaluating a proposal. A stage number alone cannot tell you whether a particular production browser supports a feature. Check the actual runtime targets and test the deployed artifact.

## Tools Do Different Jobs

| Tool | What it changes | What it cannot guarantee |
| --- | --- | --- |
| Package manager | Installs declared dependencies | That dependencies are safe or compatible |
| Bundler | Resolves and packages an application's code | That a host API exists at runtime |
| Transpiler | Rewrites supported source syntax | That every missing runtime behavior is supplied |
| Polyfill | Supplies some missing API behavior | That unsupported syntax will parse |
| Linter | Flags selected patterns and mistakes | Full program correctness |
| Test runner | Executes checks you provide | Correctness outside those checks |

A transpiler can rewrite a syntax construct before delivery. A polyfill is itself executable code, so a file containing syntax the engine cannot parse fails before that file can install its own fallback. Do not confuse build-time acceptance with runtime support.

## Capabilities Are More Useful Than Runtime Labels

A browser worker runs JavaScript but has no page DOM. A Node process may offer familiar web APIs. An embedded runtime may expose a carefully restricted subset of host features. Therefore, `window exists` is not a universal test for "JavaScript running in a browser," and `fetch exists` does not prove a browser page.

Prefer asking the narrow question that the operation needs. For an injected adapter, check that its operation is callable:

```js
'use strict';

function hasWriter(adapter) {
  return adapter !== null &&
    (typeof adapter === 'object' || typeof adapter === 'function') &&
    typeof adapter.writeText === 'function';
}

console.log(hasWriter({ writeText() {} }));
console.log(hasWriter({ writeText: true }), hasWriter(null));

// Expected output:
// true
// false false
```

This is a capability-shape check on trusted adapters, not a permission probe or a guarantee that a later write will succeed. An adapter can throw because a file is unavailable, a permission is denied, or its implementation fails. Handle operation outcomes as well as presence.

## Browser Pages, Workers, and Node

A page can update its document and respond to UI events. A worker runs separately from that page's UI context and communicates through supported messaging APIs; it cannot directly manipulate the page's DOM. Node provides process and server-oriented APIs and supports both CommonJS and ECMAScript modules. Consult the [browser worker guide](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) and [Node globals reference](https://nodejs.org/api/globals.html) for the actual facilities.

Keep business rules independent of these capabilities when practical. Let a page adapter read a form and let a server adapter read a request. Both can call the same amount validator. The server must still validate its own input: a browser-side check improves feedback but cannot authorize a payment.

## Predictability and Dynamic Behavior

JavaScript is dynamically typed: operations inspect the values present at execution time. It is not "untyped," and an object, a string, and a number do not obey identical operations. Its flexibility makes explicit contracts valuable. If a function accepts integer cents, state that it requires a Number within a defined range; do not silently accept every value that can be converted to a number.

Use a class, framework, or build system only when its responsibilities are useful. A small shared validator can be a plain function. Adding a framework does not remove the need to understand its input values, effects, and host dependencies.
