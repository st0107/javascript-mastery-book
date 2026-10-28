# Changelog

All notable changes to this book repository are documented here.

## Unreleased - 2026-10-28

- Added Volume 2 Chapter 6: Iterators and Generators across eleven sections, including two production examples, six solved exercises, sixteen MCQs, five assertion companions, and two synchronized diagrams.
- Covered repeatable and single-use traversal, generator state and feedback, delegation, ownership, bounded pulls, and cleanup on normal and exceptional exits.
- Integrated every section into both navigation systems and contents lists, updated the website reading path, and advanced the next planned chapter to Functional Programming in JavaScript.

## Unreleased - 2026-10-27

- Added Volume 2 Chapter 5: Descriptors, Immutability, and Proxies across eleven sections, with two production contracts, six worked exercises, sixteen MCQs, five assertion companions, and two synchronized diagrams.
- Integrated Chapter 5 into both website navigation systems and both contents lists; advanced the next planned chapter to Iterators and Generators.
- Added exact-output documentation validation for authored Volume 2 chapters and filled Chapter 1's practice set to six exercises and sixteen MCQs.

## Unreleased - 2026-10-25

- Completed standalone Volume One PDF and EPUB export support using the authored Markdown and a local browser, including rendered diagrams, internal links, navigation, and a source manifest. Default export commands now build Volume One; the legacy combined-volume Pandoc commands remain explicitly available.
- Added export structure and source-coverage validation. Expanded the documentation validator's timeout/process-launch diagnostics and failure-cleanup regression checks without relaxing the execution limit.
- Clarified callable checks versus class constructors, lone-surrogate behavior in string iteration, array length after deleting the last element, and ES module function initialization timing.
- Made wide website Mermaid diagrams readable on mobile through an accessible scroll region and completed website and book rendering checks.

## Unreleased - 2026-10-01

- Rewrote all eleven sections of Volume 1 Chapters 1–6 with concrete explanations, execution traces, production contracts, distinct exercises, varied MCQs, prerequisites, and primary references.
- Added five complete foundation chapters: Functions and Callbacks, Objects and Data Ownership, Arrays and Collections, Errors and Debugging, and Modules and Execution Modes. Volume 1 now contains 121 main chapter sections, 66 exercises, and 176 MCQs.
- Corrected feature-gate, numeric parsing, bounded money, UTC date-window, job-processing, and snapshot-ownership examples, with assertions for invalid inputs and boundary behavior.
- Reworked the execution-model companion, preserved its existing URL, and integrated it and the preface into navigation and PDF/EPUB source lists. Linked every Volume 1 section from both navigation systems, the volume summary, and the table of contents.
- Added synchronized Mermaid sources and runnable assertion companions, including explicit ES module and CommonJS examples.
- Fixed native exit-code handling in the example validator and export scripts. Added validator regression checks and `npm run docs:examples:test` for exact snippet output, chapter coverage, navigation, links, and diagram-source checks.

## 2026-09-27

- Added Volume 2, Chapter 4: Classes and Object Creation Patterns across eleven sections, including initialization order, fields and private state, invariants, factories, composition, interviews, six exercises with solutions, and sixteen MCQs.
- Added five runnable assertion programs covering the class model, reservation state, injected notification behavior, creation challenges, and edge cases.
- Added construction-flow and class-memory diagrams and integrated the chapter into both navigation systems, the volume summary, and the table of contents. Existing PDF/EPUB source discovery includes the chapter automatically.
- Updated writing status and the next planned chapter to Descriptors, Immutability, and Proxies.

## 2026-09-26

- Added Volume 2, Chapter 3: Prototypes and Inheritance across eleven sections, including property lookup, descriptors and receivers, constructor links, shared-state ownership, class inheritance, interview preparation, exercises with solutions, and MCQs.
- Added five runnable chapter scripts covering the prototype model, shared inventory records, safe option parsing, coding challenges, and edge cases.
- Added property-lookup and prototype-memory diagrams and integrated the chapter into the sidebar, MkDocs navigation, volume summary, and book table of contents. Existing PDF/EPUB source discovery includes the chapter automatically.
- Updated writing status and the next planned chapter to Classes and Object Creation Patterns.

## 2026-09-25

- Added Volume 2, Chapter 2: `this`, Call, Apply, and Bind across eleven sections, including receiver selection, lexical arrows, explicit calls, partial application, bound construction, production patterns, interviews, exercises with solutions, and MCQs.
- Added five runnable chapter scripts with assertions for receiver behavior, listener lifecycle, method forwarding, coding challenges, and edge cases.
- Added receiver-selection and bound-function memory diagrams and integrated the chapter into both site navigation systems, the volume summary, and the book table of contents. Existing PDF/EPUB source discovery includes the new chapter automatically.
- Updated writing status and the next planned chapter to Prototypes and Inheritance.

## 2026-09-06

- Added Volume 2, Chapter 1: Lexical Scope and Closures across eleven sections, including internals, production patterns, interview preparation, exercises with solutions, MCQs, debugging, and performance and security notes.
- Added runnable closure examples and supporting chapter diagrams.
- Added the Volume 2 chapter summary and integrated the chapter into the Docusaurus sidebar, MkDocs navigation, table of contents, and PDF/EPUB source lists.
- Updated writing status to reflect the six existing Volume 1 chapter drafts and the next planned chapter: `this`, Call, Apply, and Bind.

## 0.1.0 - 2026-07-06

- Created the production repository structure.
- Added Docusaurus, MkDocs, GitBook-style, PDF, and EPUB configuration.
- Added the full six-volume table of contents.
- Added the book production standard used for every chapter.
- Completed Volume 1, Chapter 1: JavaScript Execution Model.
- Added executable Chapter 1 examples.
- Added Chapter 1 Mermaid diagrams.
- Added interview questions, cheatsheet, glossary, references, and project catalog.
