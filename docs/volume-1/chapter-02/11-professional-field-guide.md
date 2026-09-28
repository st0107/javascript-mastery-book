# Professional Field Guide

## Case Study: A Snapshot Changes After Review

An order page stores `const snapshot = order` and later changes `order.status`. The earlier snapshot now displays the new status. The bug is an ownership error: the second binding received the same identity. No historical snapshot was created.

For a view containing only string `id` and `status`, build `{ id: order.id, status: order.status }` from validated fields. Each view then owns its two property slots and immutable primitive values. If the view later includes `items`, decide whether it owns copies of those records or intentionally displays a live collection. A future nested field can invalidate an earlier isolation claim.

## Case Study: A Type Guard Accepts Null

A handler checks `typeof payload === 'object'` and then reads `payload.id`. A null payload passes the guard and throws at the property access. Repair the boundary: reject null and arrays for an ordinary-record contract, then validate required fields before calling their methods.

Add null, empty object, array, wrong field types, blank normalized strings, and a valid record to the regression suite. Also assert that the output is a new record with only allowed fields. The tests now describe the contract that the handler actually depends on.

## Choosing the Binding and Ownership Policy

| Need | Choice | Review question |
| --- | --- | --- |
| Stable reference to current mutable state | `const` binding with deliberate property mutation | Who else observes this identity? |
| Replace the selected value | `let` binding | Which events permit replacement? |
| Preserve a narrow historical view | New record containing owned schema values | Are any nested objects still shared? |
| Convert boundary input | New named normalized value | Which representations are accepted? |
| Retain records between calls | Explicitly owned collection or closure | What bounds retention and releases it? |

## Explain an Incident With Four Questions

First locate the binding resolved by the identifier. Then determine whether it had initialized before the read. Next identify the value's actual type. Finally identify any aliases to its object identity. This sequence distinguishes a TDZ failure from a missing property, and a parameter reassignment from a shared-object mutation.

For an unexpected memory increase, extend the final question to retaining paths. A name leaving scope does not prove that its previous value became unreachable.

## Readiness Check

Predict a `typeof` TDZ read; explain why const permits property mutation; distinguish null from an ordinary record; show why reassigning a parameter does not replace the caller's binding; and design a normalizer with an explicit output schema. Use the [exercises](06-exercises-coding-challenges.md) to verify these explanations, then continue to [Operators and Expressions](../chapter-03/01-introduction.md).
