# Multiple-Choice Questions

Choose one answer per question. Each explanation names the rule; the distractors represent common boundary mistakes.

## 1. Which operation is a language built-in?

- A. Reading document.title
- B. Calling Array.isArray(value)
- C. Opening a local file through a Node API
- D. Writing to the developer console

**Answer: B.** Array.isArray is specified by ECMAScript. The other operations rely on host facilities.

## 2. A worker cannot read the page document. What follows?

- A. The worker uses a different Number multiplication rule
- B. The engine cannot parse property access
- C. A transpiler must insert the entire page DOM
- D. The worker needs a message or adapter boundary for page-owned data

**Answer: D.** Hosts can expose different capabilities while sharing the same core language rules.

## 3. What does a callable writeText property establish?

- A. The operation can be attempted, but it can still fail
- B. The target path is writable
- C. The call will finish asynchronously
- D. The host is Node

**Answer: A.** Callability alone proves neither permission, completion mode, nor host identity.

## 4. What does TC39 proposal maturity describe?

- A. Installed browser market share
- B. The speed of an engine
- C. Progress through standardization
- D. Whether npm can install a package

**Answer: C.** A stage describes proposal progress. Deployment support must be checked separately.

## 5. Why can a polyfill fail to solve unsupported syntax in the same file?

- A. Polyfills require a DOM
- B. Parsing can fail before any fallback code executes
- C. Polyfills can change values but cannot define functions
- D. Only server code can use polyfills

**Answer: B.** A runtime fallback cannot execute in a source unit the engine cannot parse.

## 6. Which boundary belongs on the server for a payment?

- A. Trust a client valid flag
- B. Trust the client runtime label
- C. Trust the displayed amount alone
- D. Validate the request and verify the authoritative price

**Answer: D.** Client checks improve feedback but can be bypassed by the caller.

## 7. Why use Number.isSafeInteger for Number cents?

- A. It checks integral values within the reliably distinguishable integer range
- B. It accepts any decimal string
- C. It proves the amount is positive
- D. It applies the product price limit automatically

**Answer: A.** Safe range and integrality are representation checks. Positivity and business maximum are additional checks.

## 8. A file parses, prints a line, then reads an undeclared identifier. What can happen?

- A. All prior output is automatically rolled back
- B. The parser repairs the name
- C. Evaluation throws ReferenceError after the earlier effect
- D. The identifier becomes a zero-valued local

**Answer: C.** Runtime failures can follow already completed effects; parsing success does not imply successful evaluation.

## 9. Which description of an engine is accurate?

- A. It is the browser document
- B. It implements the language semantics
- C. It decides every application authorization rule
- D. It is a package repository

**Answer: B.** An engine evaluates language operations. Host APIs and application policies are separate responsibilities.

## 10. What does a successful bundler build guarantee?

- A. Every deployed host API exists
- B. Every input is valid
- C. Every network request will succeed
- D. The build step completed under its configured rules

**Answer: D.** Build success alone cannot establish runtime compatibility, valid application data, or external service availability.

## 11. What is the cleanest way to test a report calculation that must save text?

- A. Inject a writer and assert its calls and failure behavior
- B. Hard-code a user filesystem path
- C. Infer write permission from process
- D. Catch every error and return saved

**Answer: A.** Injection makes effects observable and failures testable without assuming a particular host or destination.

## 12. Which statement about JavaScript execution is portable?

- A. Every function first runs exactly once in an interpreter
- B. Every object must occupy one physical heap allocation
- C. Implementations must preserve observable language behavior
- D. All engines have the same optimization tiers

**Answer: C.** The specification constrains semantics, while representation and compilation strategy are implementation choices.

## 13. Why does a long synchronous calculation delay unrelated callbacks on its thread?

- A. Callbacks stop being functions
- B. The thread is occupied until the calculation yields or completes
- C. Numbers disable the event loop
- D. The host always copies the calculation to another thread

**Answer: B.** Synchronous work occupies the thread. A wrapper function does not make CPU work asynchronous.

## 14. What does typeof aMissingName return when there is no binding for that name?

- A. null
- B. It always throws TypeError
- C. The value undefined rather than a string
- D. The string undefined

**Answer: D.** typeof has a special rule for unresolvable identifiers. An existing uninitialized lexical binding is a different case.

## 15. A trusted writer throws quota exceeded. Which result is honest for a caller?

- A. Propagate or explicitly report the operation failure
- B. Return saved because the writer was callable
- C. Repeat forever immediately
- D. Relabel the host as unknown

**Answer: A.** Capability presence does not establish outcome. Recovery needs a defined policy.

## 16. What belongs in a shared checkout validator?

- A. DOM selection and user prompting
- B. Filesystem path discovery
- C. Representation and domain checks independent of host I/O
- D. The assumption that all client values are trusted

**Answer: C.** Keeping the rule independent of host effects makes it reusable; authorization remains a distinct responsibility.
