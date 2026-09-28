# Professional Field Guide

## Start With Five Decisions

1. Is the collection ordered, keyed, unique, or a combination?
2. Are duplicates preserved, rejected, merged, or resolved by first/last occurrence?
3. Are holes allowed, and what is the empty-input result?
4. Does the output own only array slots, or fresh records too?
5. What bounds the input size, item size, aggregate range, and retained lifetime?

These decisions make method selection straightforward. A Set helps with uniqueness but cannot decide a duplicate policy for conflicting records. A copying sort protects order but cannot decide whether records must be detached.

## Review a Pipeline

Check validation before selection. If a report promises to reject malformed records anywhere, filtering them out first violates the contract. Check the numeric bound before summing. Check the comparator's ties and whether input order is preserved. Finally, modify a returned record in a test to demonstrate the claimed ownership.

The [order summary](04-production-examples.md) validates all rows and projects fresh primitive-field items. The [task-sorting challenge](06-exercises-coding-challenges.md) intentionally shares records while returning a new order. Both are legitimate because their contracts differ.

## Choose Simplicity at the Right Scale

A short map/filter/reduce pipeline is easy to inspect when each stage has one purpose and the batch is bounded. A single explicit loop can be clearer when the task needs several accumulators, multiple rejection reasons, or early exit. Avoid chaining methods merely to eliminate statements.

Use some rather than filter when only existence matters, and findIndex when a returned undefined could be a real item. Supply reduce's initial value. Wrap callbacks such as parseInt when the array method supplies extra arguments with incompatible meaning.

## Make Identity Deliberate

A Set of object references does not deduplicate entities by equal fields. A Map keyed by a mutable object does not follow changes to an id property. Choose a stable primitive ID key when that represents domain identity; preserve textual IDs rather than coercing them numerically.

For each Map, state whether get returning undefined means absent or can mean a stored value. Use has when the distinction remains possible. Use set/get/has for entries and an explicit transport projection for JSON.

## A Useful Incident Explanation

"The input contained a hole. every skipped that position, so validation succeeded without inspecting an item there. We now require own indices before validating each record, and the regression includes a sparse array."

Another example: "We copied the array but shared its records. Editing a report item changed live state. The report now projects its supported primitive fields into new records, and tests mutate both input and output to check isolation."

These explanations name the input, language rule, incorrect assumption, and measurable repair. They are more useful than saying that an array method behaved unexpectedly.

## Before Moving On

Demonstrate density checks, shallow copying, stable numeric ordering, Map/Set identity, and bounded aggregation with the [six exercises](06-exercises-coding-challenges.md). Use the [revision sheet](08-revision-summary.md) to explain each rule aloud, then continue to [Errors and Debugging](../chapter-10/01-introduction.md) for failure handling across calls.
