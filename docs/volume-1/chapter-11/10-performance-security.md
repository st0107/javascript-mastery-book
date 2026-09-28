# Performance and Security Notes

## Measure Startup and Work Separately

Importing a dependency graph has costs: locating files, reading or fetching source, parsing, and evaluating top-level work. Calling an already loaded calculation measures something different. A benchmark that repeatedly calls quoteLine cannot establish how quickly a cold application starts.

Move unnecessary work out of module top level when it can be performed explicitly at the correct lifecycle stage. This is especially useful for services, database connections, timers, and large precomputed data. Deferring essential work only moves its latency to a later request; measure the user-visible boundary that matters.

## Dynamic Import Is a Trade-off

Conditional loading can avoid loading an unused feature. It also introduces a promise boundary and a new failure path. In a browser, a build system may split the dependency into another resource request. In Node, dynamic import does not imply a browser-style chunk or a separate thread. Use static imports for core dependencies and dynamic loading where the application can tolerate and handle the delay.

## Shared State Can Retain Data

A module-level Map can keep request records reachable for as long as the module remains reachable. A cache needs an entry bound, an eviction policy, and a lifecycle owner. Moving an unbounded array from globalThis into a module hides its name but does not bound its memory growth.

Factory-created state makes ownership clearer, but returned functions can retain it. Close external resources explicitly; garbage collection of a JavaScript object is not a substitute for a documented resource lifecycle.

## Imports Execute Code With Runtime Authority

An imported dependency can perform effects at evaluation time. Review dependency provenance and updates, and keep privileged application boundaries explicit. Strict mode does not stop a Node module from using permitted filesystem or process APIs. Module scope is encapsulation, not a sandbox for hostile code.

Do not concatenate an untrusted request parameter into an import specifier. A finite mapping from allowed feature names to literal import functions makes the permitted surface reviewable. Validate the selector before loading and still handle rejection. Avoid eval or Function as an alternative loader for untrusted strings.

## Keep Secrets Out of Browser Source

Exporting a constant or placing it in an unexported helper does not hide it from someone who can download the code. Credentials requiring secrecy belong on a trusted server with an appropriate protocol. Bundling and minification do not change that trust boundary.

## When a New Module Is Unhelpful

A file containing one trivial expression can add navigation overhead without defining a useful boundary. Split around ownership, dependency direction, independent tests, and stable interfaces. Avoid a barrel module that imports large unrelated subsystems merely to re-export one small helper; inspect the generated build and runtime behavior before making performance claims.
