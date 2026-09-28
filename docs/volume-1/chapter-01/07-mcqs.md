# Multiple-Choice Questions

Choose one answer per question. Each explanation names the rule; the distractors represent common boundary mistakes.

## 1. Which operation is a language built-in?

- A. Reading document.title
- B. Opening a local file through a Node API
- C. Calling Array.isArray(value)
- D. Writing to the developer console

**Answer: C.** Array.isArray is specified by ECMAScript. The other operations rely on host facilities.

## 2. A worker cannot read the page document. What follows?

- A. The worker needs a message or adapter boundary for page-owned data
- B. The engine cannot parse property access
- C. The worker uses a different Number multiplication rule
- D. A transpiler must insert the entire page DOM

**Answer: A.** Hosts can expose different capabilities while sharing the same core language rules.

## 3. What does a callable writeText property establish?

- A. The target path is writable
- B. The call will finish asynchronously
- C. The host is Node
- D. The operation can be attempted, but it can still fail

**Answer: D.** Callability alone proves neither permission, completion mode, nor host identity.

## 4. What does TC39 proposal maturity describe?

- A. Installed browser market share
- B. The speed of an engine
- C. Progress through standardization
- D. Whether npm can install a package

**Answer: C.** A stage describes proposal progress. Deployment support must be checked separately.

## 5. Why can a polyfill fail to solve unsupported syntax in the same file?

- A. Polyfills require a DOM
- B. Parsing can fail before any fallback code executes
- C. Only server code can use polyfills
- D. Polyfills can change values but cannot define functions

**Answer: B.** A runtime fallback cannot execute in a source unit the engine cannot parse.

## 6. Which boundary belongs on the server for a payment?

- A. Trust the client runtime label
- B. Trust the displayed amount alone
- C. Trust a client valid flag
- D. Validate the request and verify the authoritative price

**Answer: D.** Client checks improve feedback but can be bypassed by the caller.

## 7. Why use Number.isSafeInteger for Number cents?

- A. It applies the product price limit automatically
- B. It proves the amount is positive
- C. It checks integral values within the reliably distinguishable integer range
- D. It accepts any decimal string

**Answer: C.** Safe range and integrality are representation checks. Positivity and business maximum are additional checks.

## 8. A file parses, prints a line, then reads an undeclared identifier. What can happen?

- A. Evaluation throws ReferenceError after the earlier effect
- B. All prior output is automatically rolled back
- C. The identifier becomes a zero-valued local
- D. The parser repairs the name

**Answer: A.** Runtime failures can follow already completed effects; parsing success does not imply successful evaluation.

## 9. Which description of an engine is accurate?

- A. It is a package repository
- B. It decides every application authorization rule
- C. It implements the language semantics
- D. It is the browser document

**Answer: C.** An engine evaluates language operations. Host APIs and application policies are separate responsibilities.

## 10. What does a successful bundler build guarantee?

- A. The build step completed under its configured rules
- B. Every input is valid
- C. Every network request will succeed
- D. Every deployed host API exists

**Answer: A.** Build success alone cannot establish runtime compatibility, valid application data, or external service availability.

## 11. What is the cleanest way to test a report calculation that must save text?

- A. Inject a writer and assert its calls and failure behavior
- B. Catch every error and return saved
- C. Infer write permission from process
- D. Hard-code a user filesystem path

**Answer: A.** Injection makes effects observable and failures testable without assuming a particular host or destination.

## 12. Which statement about JavaScript execution is portable?

- A. All engines have the same optimization tiers
- B. Every object must occupy one physical heap allocation
- C. Every function first runs exactly once in an interpreter
- D. Implementations must preserve observable language behavior

**Answer: D.** The specification constrains semantics, while representation and compilation strategy are implementation choices.

## 13. Why does a long synchronous calculation delay unrelated callbacks on its thread?

- A. The thread is occupied until the calculation yields or completes
- B. Callbacks stop being functions
- C. The host always copies the calculation to another thread
- D. Numbers disable the event loop

**Answer: A.** Synchronous work occupies the thread. A wrapper function does not make CPU work asynchronous.

## 14. What does typeof aMissingName return when there is no binding for that name?

- A. The string undefined
- B. It always throws TypeError
- C. null
- D. The value undefined rather than a string

**Answer: A.** typeof has a special rule for unresolvable identifiers. An existing uninitialized lexical binding is a different case.

## 15. A trusted writer throws quota exceeded. Which result is honest for a caller?

- A. Return saved because the writer was callable
- B. Propagate or explicitly report the operation failure
- C. Relabel the host as unknown
- D. Repeat forever immediately

**Answer: B.** Capability presence does not establish outcome. Recovery needs a defined policy.

## 16. What belongs in a shared checkout validator?

- A. Filesystem path discovery
- B. Representation and domain checks independent of host I/O
- C. DOM selection and user prompting
- D. The assumption that all client values are trusted

**Answer: B.** Keeping the rule independent of host effects makes it reusable; authorization remains a distinct responsibility.
