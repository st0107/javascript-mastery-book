# Professional Field Guide

## Choose the Policy Before the Operator

| Requirement | Useful expression | Review condition |
| --- | --- | --- |
| Default only absent/null values | `value ?? fallback` | Zero, false, and empty strings remain meaningful. |
| Default every falsy value | `value || fallback` | Replacing zero and false is intentional. |
| Skip an optional read | `value?.field` | Absence at this exact boundary is valid. |
| Run an optional method | `value.method?.()` | A present nonfunction is an error. |
| Require boolean predicates | `a && b && c` | Each predicate produces a boolean, or the caller accepts operand results. |
| Cache only a nullish property | `record.key ??= build()` | Mutation, lifetime, and nullish results are understood. |
| Check all permission bits | `(flags & required) === required` | Masks were validated before 32-bit conversion. |

A required dependency should fail clearly when missing; an optional dependency can legitimately short-circuit.

## Review a Configuration Change

A worker used `config.retries || 3`. Operators report that zero retries still triggers three attempts. Use nullish defaulting and validate the selected count. Test zero, a positive count, null, absence, a numeric string, a negative number, and the upper bound. Verify that the helper does not mutate caller-owned configuration.

The root cause is a mismatch between falsy and missing. Renaming a variable cannot change that behavior. The [production implementation](04-production-examples.md) makes the distinction executable.

## Review an Access Expression

Ask where identity and role originate. Enumerate disabled feature, inactive account, missing list, invalid list, listed member, unlisted member, and trusted staff. Record allow/deny and whether malformed configuration should throw or deny before reviewing the expression.

An expression such as `user && feature.enabled && list.includes(user.id)` can return null or undefined. If callers require a boolean, validate roots first and return explicit booleans on rejected paths. Optional chaining improves syntax only after the domain decision is settled.

## Explain an Interview Trace

For `a() + b() * c()`, draw addition above multiplication. Write call order beside the tree: a, b, c. Then combine b/c and add a. For `a() && b()`, draw a branch after a and show when b is absent from the trace. These distinguish grouping from conditional evaluation.

For `target[key()] += amount()`, identify the destination once, read its old value, evaluate the right operand, compute, and write. If computation throws, the final write does not happen, but earlier effects are not rolled back.

## Practical Completion Check

Explain why zero survives ??, why optional invocation does not make 3 callable, why ??= can skip a setter, why a chained range comparison is wrong, and why a large count cannot be validated by bitwise conversion. Demonstrate the claims with the [exercises](06-exercises-coding-challenges.md).

Continue to [Type Conversion and Coercion](../chapter-04/01-introduction.md) to explain what happens between obtaining an operand value and applying arithmetic or comparison.
