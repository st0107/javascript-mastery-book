# Professional Field Guide

## Start With the Object's Promise

Finish this sentence before choosing a creation pattern: "After this operation succeeds, the caller can rely on ___." Useful answers describe valid state, supported operations, ownership, and readiness. "It is an instance of this class" is usually too weak: prototype membership alone does not establish those guarantees.

Then decide how the object becomes ready and how its lifetime ends. A constructor that starts work in the background can expose an object whose methods are callable before its dependencies are available. An explicit factory can make completion and failure part of the creation contract.

| Requirement | A useful starting design | Review question |
| --- | --- | --- |
| Create many objects with shared behavior and local state | A class with ordinary prototype methods | Which state is per instance, and which callbacks need stable identity? |
| Return a narrow set of detached operations | A closure factory | Which bindings and objects does each operation retain? |
| Normalize input or choose an implementation | A named factory, possibly returning a class instance | What input and result contract hides behind the selection? |
| Prepare asynchronous dependencies | An explicit async factory | When does it resolve, and who cleans up partial preparation? |
| Vary storage, formatting, or policy independently | Composition with injected collaborators | Which collaborator interface does the owner require? |
| Specialize an existing behavioral contract | A subclass | Can callers use it without stronger preconditions or weaker guarantees? |
| Transfer state across a process or storage boundary | A validated data schema | How are methods, private state, and invariants reconstructed? |

## Case Study: An Override Fails During Construction

A base class calls `this.describe()` from its constructor to create a startup log entry. A subclass overrides `describe()` and reads a private field. Construction now throws before the subclass's constructor body can finish.

The call is dispatched through the correct derived prototype, but it happens before derived instance initialization. Reproduce that sequence explicitly; adding a fallback value inside the override may hide a broader early-use defect.

Keep the base constructor's work within state it owns and has already initialized. Move optional logging or setup that needs the complete derived object to a documented phase after construction. If a factory owns that phase, it should handle failure and return the object only when its promised readiness is established.

Test the ordinary subclass, a subclass with additional fields, and a subclass whose setup throws. Also check whether construction leaks `this` to a listener registry or collaborator before validation completes. A constructor exception does not erase references already handed out.

## Case Study: A Refactor Silently Bypasses Validation

A base class exposes a validating setter for `mode`. A derived constructor originally assigns `this.mode = 'batch'`. A refactor turns it into the field declaration `mode = 'batch'`, and the expected validation stops running.

The new code defines an own data property; the old code used the inherited setter through ordinary assignment. Review where the validation belongs and make that call explicit. Do not rely on visually similar field and assignment syntax having identical observable effects.

Test both invalid and valid values through every supported creation path. Confirm that a failed creation does not leave a registered or externally visible object behind. If initialization can produce a partial object internally, keep it private to the operation that is responsible for completing or discarding it.

## Case Study: A Clone Loses Behavior and Private State

A service spreads a class instance into a plain record to "clone" it, then passes the result to a method expecting the original type. Prototype methods are absent from the result and private fields were not copied. Adding the class prototype afterward still does not install those private elements.

Choose between two explicit operations. A data snapshot should produce a documented schema for storage, display, or transfer. A domain copy should create a new valid domain object through a factory or constructor that re-establishes its invariants. Those operations can intentionally expose different amounts of state.

Test round trips through the schema with two independent instances. Mutating the new instance must follow the documented ownership policy, particularly for nested arrays and records. Include invalid or obsolete schema versions and verify that reconstruction fails at the boundary rather than during a later private method call.

## Case Study: Inheritance Couples Unrelated Decisions

A report service inherits from a storage class merely to reuse a `save` method. It later needs two storage backends and a different formatter. The hierarchy starts accumulating subclasses for combinations of concerns that are not naturally parent-child specializations.

Make the service depend on the small storage and formatting interfaces it actually needs. Inject collaborators through a constructor or factory and keep their lifetimes explicit. The report service can then vary those responsibilities without changing its own inheritance chain.

Composition still needs a contract: specify arguments, return values, failures, and whether collaborator methods require their receiver. An injected object with a same-named method is not automatically a valid implementation. Test the required behaviors and reject invalid construction inputs deliberately.

## Make Asynchronous Readiness Explicit

Constructors cannot be declared `async`. A constructor that returns a promise is returning a replacement object, which means `new Service()` no longer directly yields the promised service instance. A constructor that starts an unawaited task can instead return before the service is ready.

Use a named async factory when preparation genuinely requires waiting. Its contract should state that it resolves to a ready instance, rejects when preparation fails, and releases any resources it acquired before failure. If cancellation is supported, define it at the factory boundary too. The asynchronous volume develops those mechanics; the design lesson here is to avoid hiding readiness behind ordinary construction.

If readiness is intentionally incremental, expose that state machine as part of the API and define what each method does before readiness. Do not require callers to guess whether waiting for an unrelated timer is sufficient.

## Code Review Checklist

- What invariants hold immediately after successful construction or factory completion?
- Which fields initialize before the base body, after `super()`, and in later explicit phases?
- Can a constructor invoke an override or expose `this` before the whole object is ready?
- Did moving assignments into field declarations change setter behavior or overwrite base state?
- Does each mutable array or record belong to one instance unless sharing is intentional?
- Are private fields used with the actual owning receiver, including static calls and wrappers?
- Does a subclass preserve the parent's input, output, error, and lifetime contract?
- Do factories validate their inputs and document whether returned objects are fresh or shared?
- Is serialization an explicit schema instead of an accidental copy of the public surface?
- Who releases listeners, resource handles, and cache entries on both success and failure paths?

## Interview Whiteboard Strategy

Draw a timeline beside the instance and prototype diagrams from Chapter 3. Mark base fields, base constructor body, derived fields, and the remainder of the derived constructor. Place any overridable call on that timeline and show which state exists at that moment.

Draw private elements separately from ordinary string-key properties. Then change the receiver to a detached call or a proxy and explain why method lookup can succeed while private access fails. For a closure factory, draw the retained bindings instead of assuming it has the same receiver contract as the class.

Finish by stating the creation promise in one paragraph: what is validated, who owns the state, when the object is usable, why the chosen reuse mechanism fits, and how cleanup happens. This ties language rules to a design a reviewer can evaluate.

## Mastery Check

You are ready to continue when you can trace field initialization, explain why a valid private name can fail on a receiver, and choose between a class, a factory, and composition from an explicit contract. You should also recognize that a constructor returning normally, a valid prototype chain, and a fully ready domain object are separate facts.

Use the [interview questions](05-interview-perspective.md) and [revision sheet](08-revision-summary.md) to check those distinctions. The next planned chapter, **Descriptors, Immutability, and Proxies**, develops the property-definition, freezing, and interception rules that several examples here have exposed.
