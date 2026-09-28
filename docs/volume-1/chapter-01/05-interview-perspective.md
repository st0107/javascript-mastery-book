# Interview Perspective

## Explain the Three Layers

**Question:** Is `console.log` part of JavaScript?

**Answer:** Calling a function, reading a property, and evaluating its arguments use ECMAScript rules. The console object is supplied by the host. A conforming language implementation need not include a terminal or browser console. Separate the language operation from the host service it invokes.

**Follow-up:** Why does a valid program fail with `document is not defined`? The source parsed, but identifier resolution failed during evaluation. The current host did not provide that binding. Changing a multiplication expression will not repair a missing DOM dependency.

## Predict the Output and Explain Portability

```js
'use strict';

function invoiceLabel(cents) {
  return `Invoice: ${cents} cents`;
}
const write = message => console.log(message);
write(invoiceLabel(1250));
console.log(typeof Array.isArray);
console.log(typeof unavailablePageApi);

// Expected output:
// Invoice: 1250 cents
// function
// undefined
```

The label calculation uses language features. `write` is an adapter that performs output through the host. `Array.isArray` is a callable language built-in. `typeof` on this undeclared identifier returns a string; it does not attempt to call a missing API. The lexical-binding exception to this last rule is developed in Chapter 2.

## Compilation and Interpretation

**Question:** Is JavaScript compiled or interpreted?

**Answer:** ECMAScript specifies observable semantics, not one execution technology. Engines may interpret bytecode and compile selected code to machine code. V8 documents its [Ignition interpreter](https://v8.dev/docs/ignition). Saying all JavaScript runs through exactly the same pipeline confuses an implementation with a language requirement.

**Follow-up:** Does a successful build prove an application will run? No. Syntax transformation, dependency resolution, runtime built-ins, host capabilities, and permissions are separate concerns. Test the built artifact in the actual target environment.

## Capability Versus Environment Name

**Question:** A helper sees `process` and returns `canWriteFiles: true`. What is wrong?

**Answer:** A process-like object neither proves that a writer exists nor that its destination is writable. Node can run under restricted permissions. Accept an explicit writer dependency, check its callable shape, and handle its operation result.

**Follow-up:** Does `typeof writer === 'function'` guarantee success? It establishes only that the value can be called. The call can still throw, reject if asynchronous, or report an application failure.

## Design Question: Share a Checkout Rule

**Question:** A page and a server both validate an amount. Should the server trust the page's result?

**Answer:** Put representation-independent rules in a shared function, such as requiring a positive safe integer number of cents within the product's documented limit. The page uses it for immediate feedback. The server independently validates the submitted representation and verifies the authoritative cart price. Sharing code reduces drift; it does not transfer authority to the client.

Test zero, the maximum, one above the maximum, fractional values, strings, `NaN`, infinity, and unsafe integers. Keep payment I/O outside the validator so its failure contract can be tested independently.

## Standards Question

**Question:** Does a Stage 3 proposal work in every browser?

**Answer:** No. Proposal maturity describes standardization progress. Deployed support depends on specific versions and implementation status. The [TC39 process](https://tc39.es/process-document/) and the application's runtime support matrix answer different questions.

## Strong Explanation Checklist

A useful answer identifies the language rule, the required host capability, accepted inputs, and observable failure. Draw only the boundary needed for the question. Avoid substituting phrases such as "the engine optimizes it" for a value trace or a measured performance result.
