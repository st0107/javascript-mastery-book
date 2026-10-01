# Volume 1 Gap Audit

**Historical audit:** the source and curriculum findings below were addressed in the [2026-10-01 resolution report](volume-1-gap-resolution.md), which records the final inventory, validation results, and remaining rendering limitations. The original findings and counts are preserved below.

Reviewed: 2026-09-27. Scope: the six multi-file Volume 1 chapters, their 12 companion scripts, the separate execution-model chapter, book production requirements, navigation, and export source discovery.

**Verdict: the chapter structure exists, but Volume 1 is not content-complete against the repository's own standard.** The main problem is generic instructional scaffolding presented under specific topic headings. The current README's description of these chapters as drafts is appropriate.

This audit does not rewrite the book. Existing staged work, including Volume 2 Chapter 4, is preserved. Priorities below mean P1: resolve before treating this volume as ready for readers; P2: completeness, integration, and maintainability work.

## Verified Inventory

| Check | Result | Interpretation |
| --- | --- | --- |
| Main chapter files | 6 chapters, 11 sections each, 66 files | Structure is present. File existence does not establish depth. |
| Theory concept subsections | 42 generic paragraphs across all 6 theory files | Each substitutes the topic name into the same explanation advice rather than teaching the actual rule. |
| Main chapter JavaScript fences | 42 executed independently without an uncaught error | Only 12 produce console output; most other blocks merely define a function. This is a smoke check, not proof of the stated contracts. |
| Expected-output comments in those fences | 0 of 42 | The code contract is unmet. Production prose gives a generic description instead of actual results. |
| Companion scripts | 12, all exited successfully on Node.js 20.19.0 | Each runs a demonstration; none contains an assertion suite or expected-output comments. |
| Exercise solutions | 4 per chapter, 24 placements | The same 4 JavaScript solution blocks recur in every chapter. |
| MCQs | 21 per chapter, 126 total | Every correct answer is A; distractors repeatedly use unrelated alternatives. |
| Embedded Mermaid diagrams | 12 in the six internal-working sections | None has a matching source in `diagrams/`, even after normalizing whitespace. |
| External reference links | 0 in the 66 main chapter files | Reference sections list organizations/documentation names without specific source links. |
| Main section navigation | Docusaurus: 66/66; MkDocs: 1/66 | The main website sidebar is complete; the alternate navigation is not. |

Counts above exclude the separate `docs/volume-1/chapter-01-execution-model.md` unless explicitly stated. That file has different material and needs a deliberate place in the reading sequence.

## P1: Replace Template Text With Teaching Content

All six `02-theory.md` files repeat the sentence beginning “This area matters in production” under each named concept. For example, [Variables and Data Types theory](../docs/volume-1/chapter-02/02-theory.md), lines 7–33, names `var`, `let`, `const`, dynamic typing, `typeof`, memory, and the temporal dead zone without developing those rules. The same pattern covers 42 concepts across the volume.

The problem extends beyond theory:

- The internal-working sections reuse the same eight generic source-to-execution steps instead of tracing the chapter's operations. See [Coercion internals](../docs/volume-1/chapter-04/03-internal-working.md), lines 31–40.
- Interview sections provide prompts such as “Predict the output of a short program” without supplying that program or a worked answer. See [Variables interview material](../docs/volume-1/chapter-02/05-interview-perspective.md), lines 12–48.
- Topic-specific edge cases often repeat advice to test missing, empty, and boundary values without demonstrating an actual edge case. See [Coercion debugging](../docs/volume-1/chapter-04/09-edge-cases-debugging.md).
- Revision sheets tell the reader to “know the definition” instead of stating the definition or rule. See [Operators revision](../docs/volume-1/chapter-03/08-revision-summary.md), lines 5–11.
- Performance and field-guide sections repeatedly substitute topic names into general advice. They need concrete costs, failures, and decisions appropriate to the chapter.

**Repair:** teach the rule, demonstrate it, trace its execution, explain the relevant representation, and supply a realistic boundary case. Rewrite summaries as actual revision aids. A global wording cleanup will not close this gap.

## P1: Rebuild the Exercises and MCQs

Every exercise section contains identical implementations of `describeValue`, `requireString`, `markOrderReviewed`, and `normalizeEvents`. Compare [Chapter 1 exercises](../docs/volume-1/chapter-01/06-exercises-coding-challenges.md) with [Chapter 6 exercises](../docs/volume-1/chapter-06/06-exercises-coding-challenges.md), lines 12, 32, 52, and 70 in each file. These are four unique solutions spread over 24 placements, rather than chapter-specific practice.

The MCQs have 126 A answers. Typical distractors say that a language behavior is a formatting preference, browser-only, or handled by npm. See [Operators MCQs](../docs/volume-1/chapter-03/07-mcqs.md), lines 3–25. A reader can succeed by recognizing the pattern without understanding JavaScript.

**Repair:** write distinct problems for each chapter with concrete requirements, sample inputs, expected results, edge cases, complete solutions, and meaningful assertions. MCQ alternatives should represent plausible misconceptions; vary answer positions and explain why alternatives fail. Changing answer letters alone is insufficient.

## P1: Correct Demonstrated Behavior and Stated Contracts

These findings were reproduced by loading the existing source or example block and calling its functions with additional inputs.

| Location | Reproduction / observed behavior | Required correction |
| --- | --- | --- |
| [Feature gate](../code/volume-1/chapter-03/example-02-feature-gate.js), line 7 | `canAccessBeta({id:'u1',active:true,role:'member'}, {enabled:true})` throws because `allowedUserIds` is missing. | The chapter scenario promises safe handling of missing optional nested data. Validate or define a default for the list, or explicitly narrow the accepted input contract. |
| [Pagination parser](../code/volume-1/chapter-04/example-01-query-parser.js), lines 3–10 | The string `'9007199254740993'` is accepted as `9007199254740992`; `true` is accepted as `1`. | Define accepted string syntax, safe-integer limits, and pagination bounds. Conversion alone is not domain validation. |
| [UTC window](../code/volume-1/chapter-05/example-02-date-window.js), lines 3–10 | A non-ISO date such as `'July 6, 2026'` is accepted in the tested runtime. A string duration `'3600000'` makes a time two hours later pass a purported one-hour window because `+` concatenates. | Require a documented timestamp format/offset policy and finite numeric arguments. Validate duration and range before comparing. |
| [Job runner](../code/volume-1/chapter-06/example-01-job-runner.js), lines 6–10 | `[null]` throws; `[{}]` produces a processed record with an undefined ID. | The scenario says invalid entries are skipped. Implement that policy or narrow the claim. The scenario also mentions retries and a shutdown signal that the example does not implement. |
| [Legacy audit-recorder solution](../docs/volume-1/chapter-01-execution-model.md), lines 344–357 | Change `snapshot[0].id` after a call; the next returned history contains that changed ID. | The text claims the returned array copy protects internal state. It still shares the stored entry objects. Return contract-specific copies or immutable entries, and explain nested ownership. |

The money and checkout examples also use `Number.isInteger` without documenting safe range limits. Treat this as a boundary contract that needs definition; do not imply that arbitrary integer-valued Numbers preserve exact monetary inputs. [MDN's safe-integer reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isSafeInteger) explains the representable range.

`Date.parse` accepts more than a strict ISO-with-offset grammar, and a date-time string without a zone uses the local time zone. [MDN: Date.parse](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse). Array spread copies the outer array while retaining element identity. [MDN: spread syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax#copying_an_array).

These fixes should be reflected in both Markdown examples and companion scripts. The observed failures do not imply every helper must accept arbitrary objects; the essential requirement is an explicit contract that matches the implementation and teaching claims.

## P1: Make Validation Fail When an Example Fails

[The validation script](../scripts/validate-examples.ps1), lines 1–15, sets `$PSNativeCommandUseErrorActionPreference`, runs Node, and prints success without checking `$LASTEXITCODE`. [The npm command](../package.json) invokes `powershell`, which resolves to Windows PowerShell 5.1 in this workspace.

A separate probe using those same preference settings ran `node -e 'process.exit(7)'`. Windows PowerShell continued to the success message and exited with code 0. The current script can therefore report success after a failing native process in this environment.

**Repair:** check `$LASTEXITCODE` immediately after each Node invocation and throw on nonzero status, or explicitly require and invoke a suitable PowerShell version. The current [PowerShell preference documentation](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_preference_variables#psnativecommanduseerroractionpreference) describes native-error handling; it should not be assumed to apply to Windows PowerShell 5.1.

Then add assertions for the contracts actually being taught. Successful execution of a happy-path printout cannot detect the boundary failures above. Add exact expected output to independent examples as required by [the book production standard](../docs/book-production-standard.md).

## P1: Close the Foundation Gap Before Advanced Material

[Volume 1's chapter list](../docs/volume-1/README.md) ends at Control Flow. [Volume 2's first chapter](../docs/volume-2/chapter-01/01-introduction.md), line 49, assumes comfort with functions, object properties, arrays, and loops. Volume 1 uses functions, destructuring, spread, and arrays in examples but does not provide a systematic teaching sequence for those prerequisites.

This is a curriculum recommendation, not a claim that already-listed chapter directories are missing. Add clearly scoped fundamentals units or chapters covering:

1. Functions: declarations/expressions, calls, parameters, returns, defaults/rest, arrows, and callbacks; introduce scope before the deeper closure chapter.
2. Objects: property access, identity, ownership, destructuring, spread, and shallow-copy behavior; leave prototype internals to Volume 2.
3. Arrays and basic collections: indexing, mutation versus copying, iteration methods, sparse arrays, and choosing basic collection operations.
4. Errors and debugging: `throw`, `try`/`catch`/`finally`, error propagation, and executable assertions.
5. Module basics and execution modes: script versus module, strict mode, imports/exports, and how readers run the examples; reserve detailed loading internals for later material.

The separate execution-model chapter itself lists function declarations/calls as prerequisites, so linking it alone does not fill the function-basics gap.

## P2: Finish Diagrams, Prerequisites, and References

Each main chapter embeds two Mermaid blocks, but none of the 12 has a matching stored source in `diagrams/`. This fails the diagram storage requirement. The existing `chapter-01-execution-model.mmd` belongs to the separate legacy material and does not match these 12 diagrams.

Several sections labeled “Memory Diagram” contain an input-processing flow instead of showing bindings, values, references, or state. Examples include [Coercion](../docs/volume-1/chapter-04/03-internal-working.md), line 9, and [Control Flow](../docs/volume-1/chapter-06/03-internal-working.md), line 9. Choose a useful model for the topic and label it accurately; add a state or reference diagram where it helps explain the operation.

None of the six main introductions has an explicit prerequisites section. None of the 66 main chapter files includes an external Markdown source link. The reference sections list broad names such as ECMAScript, MDN, and V8 rather than the actual material supporting a claim.

**Repair:** add prerequisites and a running guide, save diagram sources and keep them synchronized with embeds, and cite specific primary references alongside technical claims. References and further reading should be actionable reading paths.

## P2: Reconcile Navigation and the Separate Execution-Model Chapter

- Docusaurus includes all 66 main section IDs, and Volume 1's summary links those sections. Preserve that working integration.
- [MkDocs navigation](../mkdocs.yml), lines 47–50, lists only the first chapter's introduction after Overview and Summary. Add all six chapter groups and their sections.
- [The book table of contents](../docs/table-of-contents.md), lines 5–78, lists Volume 1 chapters and sections as plain text, unlike the linked Volume 2 material. Add usable links.
- The separate [execution-model chapter](../docs/volume-1/chapter-01-execution-model.md) is linked as a Volume 2 prerequisite but has no Docusaurus sidebar entry. The preface also lacks a sidebar entry.
- [PDF](../scripts/build-pdf.ps1) and [EPUB](../scripts/build-epub.ps1) discovery includes the 66 files inside chapter directories and the preface, but omits the separate execution-model file. Decide whether to merge its useful material into the main chapters or intentionally include it as a distinct prerequisite; preserve existing links or redirects if relocating it.

No publishing build was needed for this read-only source audit. The navigation findings concern configuration/source inclusion, not a newly rendered PDF or EPUB.

## Chapter-by-Chapter Repair Targets

| Chapter | Main material to develop |
| --- | --- |
| 1. Introduction | Actual language/engine/host distinctions, a minimal runnable program, the standardization process, and a clear relationship to the separate execution-model chapter. |
| 2. Variables and Data Types | Binding and value distinctions; actual `var`/`let`/`const` comparison; scope, initialization and TDZ traces; primitive types, object identity, `typeof`, and reachability caveats. |
| 3. Operators and Expressions | Precedence versus evaluation order, operand-returning short circuits, optional-chain boundaries, `??` versus `||`, assignment side effects, and concrete bitwise examples. |
| 4. Conversion and Coercion | Conversion matrices and worked traces for strings/numbers/booleans, equality and relational comparison, object-to-primitive conversion, and a parser with explicit accepted syntax and bounds. |
| 5. Strings, Numbers, and Dates | UTF-16/code-point/grapheme distinctions, regex examples, finite/safe integer boundaries, floating-point and BigInt behavior, and explicit UTC/local-time/format contracts. |
| 6. Control Flow | Distinct branch and loop semantics, switch fallthrough, iteration over values versus keys, labels, termination and updates, and a validated processing example that implements its advertised behavior. |

These targets correspond to concepts already named in the volume. They should be demonstrated in the relevant theory, internals, practice, and revision sections rather than repeated as topic lists.

## Recommended Repair Order

1. Fix the validator's exit-code handling and the reproduced correctness/contract defects so subsequent checks are trustworthy.
2. Establish the foundation sequence, including the intended home of the execution-model material.
3. Rewrite Chapters 1–6 in order, replacing generic theory, internals, interviews, revision text, exercises, and MCQs together. Bring each chapter to the same reviewed standard before moving on.
4. Add the missing fundamentals units and verify that the bridge into Volume 2 no longer assumes untaught basics.
5. Complete source references, diagram assets, navigation, and export inclusion as each chapter is repaired; then perform the final whole-volume integration check.

Completion should require independently runnable examples with exact expected output, assertions for documented failure and ownership contracts, chapter-specific exercises and plausible MCQs, source-backed explanations, synchronized diagrams, clear prerequisites, and consistent navigation. Do not use section count or a successful website build as a substitute for that review.
