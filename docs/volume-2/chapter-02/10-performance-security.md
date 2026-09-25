# Performance and Security Notes

## Count Functions, Arguments, and Retained Data

`bind` creates a function with relationships to a target, a receiver, and any bound arguments. A closure wrapper has its own relationships to captured bindings. Both designs can be appropriate; neither syntax alone determines memory use or speed.

The specification's internal slots describe observable behavior. They do not prescribe a fixed byte size, a heap layout, or a requirement that an engine build a literal linked chain for repeated binding. Use that model to identify ownership, then measure the runtime implementing it.

| Design choice | Cost and lifetime to investigate |
| --- | --- |
| A shared prototype method | Instances normally share one method function until an instance overrides it. The caller must supply a suitable receiver. |
| One bound callback per instance | Each instance has a distinct callback function referring to its selected target and receiver. |
| One arrow field per instance | Each instance has a distinct function that resolves the instance's `this` through its creation context. |
| Binding during every registration or render | Each evaluation creates another identity; review allocation volume and whether old registrations are removed. |
| Binding a large request object as an argument | The callback can retain that argument and the objects reachable from it. |
| Forwarding an argument collection with `apply` | The operation reads an array-like length and indexed values; getters can execute during this process. |

For `n` instances with one stored bound callback each, budget `O(n)` callback identities in addition to the instances and shared target. With `k` stored argument values per callback, account for `O(nk)` argument references in a straightforward model. Those references can lead to much larger shared object graphs; this count is not a byte estimate or a claim that objects are copied.

Calling with `k` supplied arguments involves argument handling in addition to the target's work. Exact allocation and call costs depend on optimization and runtime implementation. An inexpensive wrapper around a database request is unlikely to dominate end-to-end latency; measure before changing the API.

## Stable Identity Serves Correctness First

Create and store a callback at the lifecycle boundary that owns its registration. Reusing that function makes listener removal and identity-based comparisons predictable. This is a correctness property even when allocation cost is negligible.

Do not memoize callbacks forever solely to avoid creating functions. An unbounded cache keyed by every request or component can retain receivers and arguments longer than the work they serve. A cache needs an owner, an eviction policy, and evidence that reuse is useful.

Likewise, replacing a prototype method with an arrow field changes more than allocation: it makes an instance-specific function, fixes lexical receiver behavior, and changes method lookup and overriding. Treat that as an API decision. A microbenchmark does not settle whether those semantics fit the design.

## Follow the Retaining Owner

A long-lived event source can hold a bound listener, which holds its receiver, which holds a document model and its data. Removing the visible component does not remove this path. Repeatedly creating bound listeners without removing the original registrations can retain many old component instances.

The same problem can arise with an arrow wrapper that captures the component. Switching syntax does not release the event source's reference. Remove the registration using its documented identity or token, and release application-owned callback references when they are no longer needed.

A component that references its own bound callback forms a cycle. A cycle alone is not evidence of a leak. The relevant question is whether a reachable owner keeps objects alive beyond the intended lifetime. Cleanup also does not promise immediate garbage collection.

To investigate a suspected leak, record a baseline, repeat mount/use/unmount, run the intended cleanup, and compare retaining paths for accumulated instances. Inspect both active listeners and any saved callback or cleanup arrays. Chrome's [heap snapshot documentation](https://developer.chrome.com/docs/devtools/memory-problems/heap-snapshots) describes tools for examining reachable objects.

## Benchmark Equivalent Behavior

A useful experiment compares equivalent contracts: the same receiver, arguments, lookup timing, and target work. A bound target selected once and a wrapper that reads a replaceable method each time are not equivalent under mutation.

Record the runtime version, workload, warm-up policy, input distribution, and repetitions. Measure callback creation separately from repeated invocation. If the workload creates many instances, include instance creation and cleanup instead of timing only one heavily reused function.

For latency, report variation as well as a central value. For memory, distinguish allocation activity from retained data after the lifecycle ends. Keep the original behavior checks running while experimenting so a faster result does not silently skip required work.

Avoid claims such as "arrows are always faster" or "bound functions cannot be optimized." Neither follows from ECMAScript semantics. Engines can change optimization strategies without changing valid program output.

## Do Not Expand Unbounded Collections Into Calls

Both `apply` and spread-based calls can exceed implementation argument limits for very large collections. The practical limit is not portable. Replacing `fn.apply(context, values)` with `fn.call(context, ...values)` does not eliminate the many-arguments problem.

If a dataset is large, design the target to accept a collection or process it with an explicit loop. Chunking is valid only when the operation's semantics permit independent chunks; a function that computes one result from all arguments may change behavior if called repeatedly.

An arbitrary object supplied to `apply` can expose getters for `length` or its indexed properties. Argument preparation can therefore throw or perform side effects before the target starts. Validate and normalize external data at the API boundary rather than treating every array-like object as inert. See [ECMAScript: CreateListFromArrayLike](https://tc39.es/ecma262/multipage/abstract-operations.html#sec-createlistfromarraylike).

## Binding Is Not Authorization

Binding a method to an account object selects context for ordinary calls. It does not authenticate whoever receives that callback, check whether an operation is allowed, or validate the operation's arguments. Anyone holding the callable may be able to perform whatever behavior its target exposes.

A bound callback can be a deliberate capability within cooperating code: share a narrow operation without exposing the entire object. That makes the chosen target's validation more important. Restrict arguments, permitted state transitions, and the scope of the operation before handing out the function.

Binding also does not revoke previously shared callbacks when access should end. If a callback must become unusable after disposal or permission changes, check an explicit state or policy when it runs. Removing an event registration prevents that registration from invoking it later; another holder can still call its copy.

For protected server resources, enforce authorization at the server boundary. A client-side bound receiver or private field cannot establish trust in a request from a user-controlled runtime. See [OWASP: Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html#never-rely-on-client-side-access-control-checks).

## Borrowing Methods Does Not Make Objects Safe

`call` and `apply` can run an ordinary method against another object, including one whose property reads execute getters. A method originally written for trusted internal records may be unsuitable for arbitrary external objects. Decide which shapes and behaviors are accepted before exposing generic method borrowing.

Some native methods and private-field operations reject incompatible receivers. Treat those checks as language or API invariants, not as your application's authorization policy. A genuine instance may still represent the wrong tenant, an expired session, or a disposed resource.

Never implement a general bind helper by building source strings and evaluating them. Besides introducing code execution risks, that approach complicates argument handling and still does not reproduce native construction semantics. For normal code, use the native operation or a wrapper with a narrow, documented contract.

## Best Practices

- Store the exact callback used for registration and give one owner responsibility for removing it.
- Bind only the context and arguments that the operation needs; inspect large retained request objects.
- Document whether a callback keeps the selected target or looks up a replacement method later.
- Keep receiver validity, domain validation, authorization, and resource lifetime as separate checks.
- Profile instance creation, invocation, and cleanup before choosing a representation for performance.
- Use loops or collection-oriented APIs for large datasets instead of unbounded argument expansion.
