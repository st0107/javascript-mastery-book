# Professional Field Guide

## Start With State Ownership and Lookup

Before adding inheritance, answer two questions: "Which behavior should several objects share?" and "Which state must each object own?" A shared method can operate on separate state through `this`. A shared mutable array or record instead couples every object that reaches it through the chain.

Then define the override contract. Must a change on the shared prototype affect existing instances? Can an own property mask it? Should deleting an override restore a default? These are product behaviors, not merely implementation details.

| Requirement | A useful starting design | Review question |
| --- | --- | --- |
| Share methods across many initialized objects | A constructor or factory using a shared prototype | Does every instance receive its own mutable state? |
| Provide defaults that remain live | Deliberate prototype delegation | Can callers distinguish an own override from an inherited value? |
| Capture a configuration snapshot | Explicitly select and copy validated fields | Which nested values are still shared references? |
| Store arbitrary external keys | `Map`, or a deliberate null-prototype dictionary | Are all callers using the intended dictionary interface? |
| Swap a service dependency | Composition through an explicit collaborator | Does inheritance add a useful lookup contract? |
| Accept a data-transfer object from a boundary | Schema validation followed by explicit construction | Are unknown fields and inherited values handled deliberately? |

## Case Study: Two Queues Share One Backlog

A queue prototype defines `jobs: []` beside its `enqueue` method. A unit test creates one queue, adds a job, and reads the expected result. In production, a second queue unexpectedly processes the first queue's job.

The method call's receiver can be completely correct. The mistake happens during `this.jobs`: neither instance owns that property, so both read the same prototype array. Calling `push` changes that array in place.

Move the array initialization into the factory or constructor that creates each queue. Keep the shared method if its behavior remains useful. Do not repair only one observed queue by assigning it an empty array after the failure; future instances would retain the original ownership defect.

Verify the repaired contract with two instances:

1. Confirm each queue has an own `jobs` property and the arrays have different identities.
2. Add to the first queue; the second must remain empty.
3. Add to the second; verify both histories independently.
4. Clear or replace one queue's array and check the other again.
5. Confirm the method function is still shared if that is the intended design.

Those checks connect behavior to ownership. A memory benchmark would not detect the wrong queue processing a job.

## Case Study: Removing a Setting Restores an Unexpected Default

A request inherits a timeout from a defaults object. A user clears a local timeout override, and code deletes the own property. The next read returns the inherited timeout, while the UI assumes there is no timeout value at all.

First decide what "clear" means in the domain. It could mean restore the shared default, disable the feature, or omit a field from a serialized request. These meanings need different representations. A missing own property, an own `undefined`, and an own `null` are not interchangeable.

If inheritance is retained, document whether defaults are live. Mutating the defaults object can change existing descendants that have no override. If configuration should be stable for a request's lifetime, validate and copy the selected values into the request when it is created.

Check the downstream boundary as well. `Object.keys` selects own enumerable string properties. JSON object serialization does likewise when no custom `toJSON` or replacer changes the behavior, so an inherited default visible during a read is not automatically included as an ordinary serialized field. Build the outgoing record explicitly when the receiver requires resolved configuration values.

## Case Study: Old Instances Fail a New Membership Check

A module replaces a constructor's `.prototype` after objects have already been created. New objects see the replacement methods, while old objects keep the previous prototype. A newly added `instanceof` check rejects the older objects even though their methods still work.

Inspect both prototype identities and the order of initialization. Editing a property on a shared prototype and replacing the constructor's reference to that prototype are different operations. A `constructor` property assignment cannot migrate existing instances.

Choose the lifecycle deliberately: establish the prototype before exposing instances, migrate objects through a documented process, or make the consumer depend on a narrower validated interface. Avoid silently rewriting every live object's prototype to satisfy one check; initialization state and existing overrides may also differ.

For hot reload or duplicate package copies, the same-looking constructor source can also produce different function and prototype identities. A membership test based on identity may then be too narrow for the interface being accepted. Validate the behavior or data contract actually required, without treating a matching method name as sufficient for sensitive operations.

## Case Study: A DTO Accidentally Becomes a Configuration Object

A service accepts a parsed JSON data-transfer object, or DTO, and merges every supplied key into a runtime options object. A special key changes lookup behavior, or an unexpected nested field changes an unrelated option. Later code reads the merged object as if every effective value came from an approved own field.

Define a schema at the boundary: allowed keys, required fields, value types, limits, and whether nested objects are permitted. Reject or deliberately ignore unknown fields according to the API contract, then construct the intended record from validated values. Keep user-controlled keys in a dictionary when they represent data rather than settings.

Test missing required fields, an inherited field on an arbitrary-object input, unknown keys, explicit `undefined` where the API permits JavaScript objects, and permitted boundary values. For parsed JSON, exercise an own `__proto__` data key using local objects, as in [Performance and Security](10-performance-security.md#prototype-pollution-changes-where-values-come-from). A spread copy alone does not replace schema validation.

## Code Review Checklist

- Can you name the object owning each method, default, and mutable collection?
- Is the method receiver distinct from the object where lookup found the method?
- Does the design distinguish own absence, own `undefined`, and inherited values?
- Can an inherited descriptor block assignment or invoke an accessor?
- Is shared data intentionally shared across two independently created instances?
- Which constructor or factory actually establishes required state?
- Can prototype replacement, duplicate packages, or another realm change membership checks?
- Are copied methods using `super`, with a home object the caller may not expect?
- Does external data pass a schema before any merge or dynamic path assignment?
- Do tests cover two instances, an override and deletion, and the relevant boundary failure?

## Interview Whiteboard Strategy

Draw the instance and each prototype as separate boxes connected by `[[Prototype]]` arrows. Put own descriptors inside the box that owns them. Start a read at the instance and stop at the first matching descriptor; keep the receiver label on the instance when invoking an inherited method or accessor.

For a constructor, draw a separate `.prototype` property arrow from the function. Replacing that property should move this arrow without moving links on existing instances. Add a second instance afterward to make the split visible.

For `super`, mark the method's home object separately. For lexical identifiers, draw the function's lexical environment separately. One diagram should not use the same arrow to mean all three relationships.

## Mastery Check

You are ready to continue when you can explain shared method identity alongside separate instance state, predict assignment under inherited descriptors, and distinguish prototype membership from successful initialization. You should also be able to explain why own-field validation and a deliberate dictionary representation matter at a data boundary.

Use the [interview questions](05-interview-perspective.md) to rehearse those distinctions and the [revision sheet](08-revision-summary.md) to review the lookup rules. The next planned chapter, **Classes and Object Creation Patterns**, builds on these relationships with class construction, initialization, and explicit object-creation designs.
