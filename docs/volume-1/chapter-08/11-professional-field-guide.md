# Professional Field Guide

## Case Study: Canceling an Edit Does Not Restore Preferences

A form stores `draft = { ...saved }`, then changes `draft.notifications.email`. Canceling the form discards the outer draft, but the saved record has already changed because both roots pointed to the same notification object.

The repair creates a new notification record for the draft and any other mutable records the form edits. A regression test changes the draft's nested property, discards the draft, and asserts the saved value. A second test changes saved state and verifies whether the draft should remain a snapshot or intentionally reflect live updates. The product's expectation determines the ownership contract.

## Case Study: A New Field Leaks Through a Public View

A service removes `password` using object rest and returns everything else. Later a developer adds an internal review note to the user record. The rest operation publishes that new field automatically.

Construct an explicit public view with approved fields. If it includes an address object, copy the approved address fields too. Assert exact keys at both levels. This change turns a denylist that must anticipate future secrets into an output schema that must deliberately opt into new data.

## Case Study: Preferences Accept an Unexpected Key

A configuration endpoint recursively merges all parsed keys into defaults. A request supplies a prototype-related key at a nested level. The bug is not JSON parsing; it is allowing data keys to control object traversal and assignment.

Replace the generic merge with a fixed preference schema. Validate own keys at every supported record level, distinguish absent settings from explicit invalid values, and return new records containing only allowed primitive values. The [production example](04-production-examples.md) demonstrates this design with no global prototype mutation.

## Choose the Contract Before the Syntax

| Requirement | Appropriate starting point | What to verify |
| --- | --- | --- |
| Read a possibly inherited default | Ordinary property lookup | Is inheritance intended? |
| Require submitted field presence | `Object.hasOwn` plus value validation | Does undefined or null have a special meaning? |
| Create a historical view | Explicit schema copy | Are all retained mutable records owned? |
| Update immutable state | Copy each changed path | Are unchanged references intentionally shared? |
| Count arbitrary string labels | Null-prototype dictionary or Map | Will later consumers treat keys safely? |
| Publish external data | Explicit allowed output keys | Can future internal fields leak? |

## A Code Review Walkthrough

Ask which object owns each field and who can still reach the nested values. Inspect presence checks and default policies. Identify any operation that reads getters or invokes setters. For external data, identify the accepted representation and where unknown keys are rejected. Then inspect tests that mutate both sides of a claimed snapshot and tests for nested unknown keys.

A good explanation uses a small reference graph and an exact schema. It does not rely on the phrases "spread makes it immutable" or "the object is const." Use the [revision sheet](08-revision-summary.md) and [exercises](06-exercises-coding-challenges.md) to rehearse these decisions before continuing to [Arrays and Collections](../chapter-09/01-introduction.md).
