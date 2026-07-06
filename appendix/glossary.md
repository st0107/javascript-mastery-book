# Glossary

## Call Stack

The stack-like structure that tracks currently executing execution contexts. The active context is on top.

## Execution Context

An internal representation of code currently being evaluated, including lexical bindings, variable bindings, `this`, and outer environment references.

## Lexical Environment

A structure that maps identifiers to bindings and points to an outer lexical environment.

## Scope Chain

The linked sequence of lexical environments searched during identifier resolution.

## Temporal Dead Zone

The period between creation of a `let` or `const` binding and its initialization, during which access throws a `ReferenceError`.

