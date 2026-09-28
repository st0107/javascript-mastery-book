# Professional Field Guide

## Record the Runtime Contract

A runnable example should name its host and mode. Record the minimum supported Node version, use explicit file formats where useful, and make package settings intentional. When a snippet fails in a console, first reproduce it as the documented file before changing the lesson's semantics.

## Case Study: Importing a Helper Starts a Worker

A test imports a reporting helper and unexpectedly opens a connection. Its containing module called start at top level. Split definitions into a library and call start from an entry. Inject the connection or writer into the library so the test can assert behavior without creating the real resource.

Verify three separate moments: importing performs no application work, constructing validates dependencies without invoking them, and calling the returned operation performs exactly the documented effect. The report companion demonstrates this separation.

## Case Study: Customers Share a Counter

A module exports a mutable sequence and several request handlers import it. The author expected each import to create fresh state. The loader instead reused one module instance. If per-request independence is required, export a factory and create state at the request boundary. If shared sequencing is intended, define concurrency, persistence, and exhaustion requirements separately; an in-memory counter alone is insufficient for distributed IDs.

## Case Study: A Deployment Fails Before Startup Logging

The entry imports a named export that was renamed in a library. Linking fails before the entry's first log call. Compare the exported interface and import syntax, then run the entry directly. Adding a try/catch inside a function that never executes cannot repair this interface mismatch.

## Review Checklist

- Does each file run under the intended format in the supported runtime?
- Are relative filenames explicit and case-correct?
- Does the module export a focused interface with documented ownership?
- Are calculation, configuration parsing, and startup effects separated?
- Does a shared module variable have an intentional scope and lifetime?
- Do cycles introduce early reads or confusing initialization order?
- Are asynchronous loads awaited and failures handled at a useful boundary?
- Do tests import the actual implementation and check invalid calls as well as success?
- Does every resource have an explicit owner responsible for closing it?

## Volume 1 Mastery Check

Build a small application from three modules: a parser, a calculation, and an entry that reports a result. Validate data at the boundary, use integer units where exactness matters, return fresh records when ownership requires it, keep iteration bounded, preserve error context, and make startup explicit. Explain the program's execution and shared references before running it.

You now have the vocabulary required by [Volume 2: Lexical Scope and Closures](../../volume-2/chapter-01/01-introduction.md). Use the [execution-model companion](../chapter-01-execution-model.md) to connect bindings, function calls, and memory before moving to advanced scope and object behavior.
