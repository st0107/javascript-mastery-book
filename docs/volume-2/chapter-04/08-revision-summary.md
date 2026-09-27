# Revision Sheet and Chapter Summary

## One-Page Revision Sheet

| Concept | Rule to remember |
| --- | --- |
| Class declaration | Lexical binding with a temporal dead zone; class bodies are strict |
| Calling a class | Requires construction; an ordinary call throws |
| Public prototype method | Shared function, non-enumerable, receiver chosen by its call |
| Public instance field | Own writable, enumerable, configurable data property |
| Arrow function field | New function per instance with lexical `this` |
| Field initializer | Runs for each instance, in field declaration order |
| Public field definition | Defines an own property; does not invoke an inherited setter |
| Base instance fields | Initialized before the base constructor body |
| Derived instance fields | Initialized after base construction through `super()`, before the derived body continues |
| Base constructor calls override | Derived methods are reachable before derived fields are ready |
| Private field | Lexically named state checked on the actual receiver |
| Private method/accessor | Installed before the class's instance fields are initialized |
| `#field in object` | Tests presence of that private element; guard primitive inputs |
| Prototype-only shell | Can satisfy default `instanceof` without having private state |
| Static public member | Belongs to the constructor and can be inherited through its chain |
| Static private state | Associated with the declaring constructor; subclass receiver can fail |
| Static block | Runs synchronously during class evaluation, ordered with static fields |
| Factory | Creation function; may return a class instance, plain record, or closure capability |
| Composition | Supplies independent collaborators with explicit contracts |
| DTO hydration | Validates data and constructs valid state; changing a prototype is insufficient |

## A Reliable Prediction Procedure

1. Separate class evaluation from instance creation. Mark static work and computed keys.
2. Draw the constructor chain and instance prototype chain separately.
3. List the own public fields and private elements each initialization stage installs.
4. For a derived constructor, mark the point where `super()` establishes `this`.
5. Follow field initializers in order. A method's existence does not mean the fields it reads are ready.
6. At every call, identify the receiver independently of where the function was found.
7. At private access, check the exact private name on that receiver.
8. For input and output containers, identify whether references are copied or shared.
9. For failures, distinguish local state changes from external effects already performed.
10. Check exceptional constructor returns before assuming the usual instance diagram applies.

## Common Mistakes to Catch

- Treating class methods as automatically bound callbacks.
- Treating a public field declaration as a call to an inherited setter.
- Publishing `this` or calling overridable behavior before construction is complete.
- Assuming `instanceof` proves that initialization and validation succeeded.
- Giving a subclass direct access to parent private names merely because it extends the class.
- Returning private arrays or records while promising exclusive ownership.
- Treating `Object.freeze(instance)` as a freeze of private state or nested values.
- Replacing an object's prototype to restore a class from JSON.
- Inheriting a static method that accesses private state through a subclass receiver.
- Using one inheritance hierarchy to represent several independent policy choices.
- Promising an asynchronous-ready instance from a synchronous constructor.
- Making every method an arrow field without considering allocation and callback lifetime.

## Interview Explanation

A JavaScript class defines construction and related behavior on top of the prototype model. Public methods are shared through the prototype; instance fields are initialized for each object. A base class initializes its fields before its body, and a derived class initializes its fields when `super()` completes, before its body continues. Private names add a receiver-specific access check, so a matching prototype alone does not supply private state. I choose a class, factory, or composition based on the invariant, ownership, and call contract the application needs.

Support that explanation with one trace: a base constructor calls an overridden method before a derived field is ready. Then compare a shared prototype method with an own arrow field. Those examples expose the execution and memory model more clearly than a list of syntax features.

## Chapter Summary

Creation is an API boundary. A useful object is more than a collection of methods: its state is valid when it becomes visible, its operations preserve that validity, and its ownership rules remain clear when inputs or outputs contain references.

Classes provide shared behavior and structured initialization. Closure factories provide lexical state and can expose receiver-independent operations. Explicit delegation provides shared behavior without automatically running initialization. Composition lets independently varying capabilities remain independently replaceable. Each design still needs input validation, failure semantics, lifecycle ownership, and an explicit data representation at persistence boundaries.

The [production examples](04-production-examples.md) combine these responsibilities. The [exercises](06-exercises-coding-challenges.md) test initialization, ownership, factories, hydration, and receiver failures. Use the [field guide](11-professional-field-guide.md) when reviewing an actual creation API.

## References

- [ECMAScript: class definition evaluation](https://tc39.es/ecma262/multipage/ecmascript-language-functions-and-classes.html#sec-runtime-semantics-classdefinitionevaluation).
- [ECMAScript: InitializeInstanceElements](https://tc39.es/ecma262/multipage/abstract-operations.html#sec-initializeinstanceelements).
- [ECMAScript: DefineField](https://tc39.es/ecma262/multipage/abstract-operations.html#sec-definefield).
- [ECMAScript: PrivateGet](https://tc39.es/ecma262/multipage/abstract-operations.html#sec-privateget).
- [MDN: constructor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/constructor).
- [MDN: private elements](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_elements).

## Further Reading

- [MDN: public class fields](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Public_class_fields) for field definition and initialization examples.
- [MDN: static initialization blocks](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Static_initialization_blocks) for definition-time work and lexical scope.
- [MDN: super](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/super) for constructor delegation and method lookup.
- [V8: Faster initialization of instances with new class features](https://v8.dev/blog/faster-class-features) for a historical account of implementation and optimization.

Next planned chapter: **Descriptors, Immutability, and Proxies**. It will extend these ownership and access rules with property descriptors, controlled mutation, integrity levels, and intercepted object operations.
