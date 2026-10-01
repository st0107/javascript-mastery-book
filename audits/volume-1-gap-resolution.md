# Volume 1 Gap Resolution

Reviewed: 2026-10-01. This report closes the source, curriculum, example-contract, and integration findings in the [2026-09-27 audit](volume-1-gap-audit.md). The original audit is retained as a historical record; its old counts and line numbers describe the pre-repair state.

## Delivered Scope

All eleven sections of Chapters 1–6 were rewritten with actual language rules, execution traces, concrete failure cases, production contracts, worked practice, and revision material. Five foundation chapters now supply prerequisites previously assumed by Volume 2:

7. [Functions and Callbacks](../docs/volume-1/chapter-07/01-introduction.md)
8. [Objects and Data Ownership](../docs/volume-1/chapter-08/01-introduction.md)
9. [Arrays and Collections](../docs/volume-1/chapter-09/01-introduction.md)
10. [Errors and Debugging](../docs/volume-1/chapter-10/01-introduction.md)
11. [Modules and Execution Modes](../docs/volume-1/chapter-11/01-introduction.md)

The [execution-model companion](../docs/volume-1/chapter-01-execution-model.md) retains its URL and now has a deliberate reading position, accurate initialization explanations, owned audit snapshots, matching diagrams, and four assertion programs. The [Volume 1 overview](../docs/volume-1/README.md) and [section summary](../docs/volume-1/SUMMARY.md) describe the complete reading path.

## Final Inventory

| Measure | Result |
| --- | --- |
| Main chapter sections | 11 chapters × 11 sections = 121 |
| Volume 1 documents checked | 125, including overview, summary, preface, and execution companion |
| Worked exercises | 66; six distinct tasks per chapter |
| MCQs | 176; sixteen per chapter, with all four answer positions used in each chapter |
| Runnable documented JavaScript blocks | 289, checked in fresh Node processes against exact expected output |
| Companion files for Volume 1 and its execution companion | 53: 50 assertion programs and three intentionally quiet ESM libraries |
| All repository companion files executed | 73, including the existing Volume 2 programs |
| Synchronized Mermaid diagrams | 24: two per chapter plus two for the execution companion |
| Local file links checked in Volume 1 | 280 |
| Reference links in Volume 1 | 179 placements pointing to 99 distinct external URLs |
| Main-section navigation coverage | 121/121 in Docusaurus, MkDocs, the volume summary, and the book table of contents |

Counts establish coverage. Contract assertions, independently executed snippets, and review of the explanations provide the additional correctness evidence; a file count alone is not the completion criterion.

## Finding-by-Finding Resolution

| Original finding | Repair and evidence |
| --- | --- |
| Generic topic substitutions | Replaced theory, internals, interviews, revision, edge cases, performance/security, and field guides across Chapters 1–6. The original repeated teaching-placeholder phrases are absent. |
| Repeated exercises and answer-pattern MCQs | Added chapter-specific requirements, hints, solutions, complexity/trade-offs, plausible answer alternatives, and explanations. Coverage checks enforce exercise and question minimums and all four answer positions. |
| Missing expected output and assertions | Every documented JavaScript block now has expected output. Companion programs exercise invalid input, boundaries, control flow, error identity, and ownership as appropriate. Chapter 11 explicitly names its runtime and required local module files. |
| Feature gate throws on missing allowlist | Missing/null lists have a documented empty-list policy; ordinary members are denied. Invalid supplied lists and malformed records fail closed under the ordinary-data contract. See `code/volume-1/chapter-03/example-02-feature-gate.js`. |
| Numeric parser coerces booleans or rounds unsafe input | Pagination uses bounded primitive-string grammar and safe numeric ranges. Booleans, malformed text, unsafe integers, and out-of-range page settings are rejected. See `code/volume-1/chapter-04/example-01-query-parser.js`. |
| Money input lacks a safe range | Checkout and formatting examples specify bounded integer minor units, reject coerced and unsafe values, and restrict the supported formatting contract. See Chapters 1 and 5 production examples and companions. |
| Date window accepts ambiguous text and concatenates duration | The window requires canonical UTC text with a calendar round-trip, safe numeric timestamps, a bounded integer duration, and a half-open interval. See `code/volume-1/chapter-05/example-02-date-window.js`. |
| Job runner contradicts invalid-entry and stopping policy | Invalid jobs are skipped, valid-record stop precedence is explicit, and the prose no longer promises unimplemented retry or signal behavior. See `code/volume-1/chapter-06/example-01-job-runner.js`. |
| Audit snapshot shares internal records | The companion copies the accepted string fields on ingress and copies records on egress. Assertions mutate both inputs and returned histories. See `code/chapter-01/example-04-owned-audit-recorder.js`. |
| Windows PowerShell reports success after failure | The validator checks native exit codes, rejects empty selections, supports `.js`/`.mjs`/`.cjs`, and resolves its default folder after parameter initialization. Regression tests cover a silent exit 7, stopping before later files, the normal default invocation from another directory, and ignoring temporary snippet files. |
| Missing foundation sequence | Chapters 7–11 teach the required function, object, collection, error, and module fundamentals. Volume 2's closure introduction links directly to these prerequisites. |
| Missing diagram sources, prerequisites, references | All 24 diagrams match their stored sources. Every chapter has explicit prerequisites and concrete primary reference links. |
| Incomplete navigation and export inclusion | Both navigation systems and both contents lists cover every section. The preface and execution companion are discoverable. PDF/EPUB discovery includes all chapter directories and explicitly includes the execution companion. Export scripts reject nonzero Pandoc exits. |

## Reproducible Checks

Run from the repository root:

```bash
npm run examples:test
npm run examples:validator:test
npm run docs:examples:test
npm run docs:build
```

- `examples:test`: passed all 73 files on Node.js 20.19.0.
- `examples:validator:test`: passed failure, format, default-path, and temporary-file regression checks under Windows PowerShell 5.1.
- `docs:examples:test`: passed 125 documents, 289 runnable blocks, 280 local links, 24 diagram comparisons, and all chapter/navigation coverage checks.
- `docs:build`: passed after correcting MDX escaping for literal operators and object expressions in prose. Generated output includes all 125 Volume 1 routes; static checks passed 7,216 internal links and anchors and confirmed the latest error-cause explanations are present.
- PDF/EPUB source and failure-path checks: a controlled Pandoc stub verified 121 existing chapter inputs, the preface, the execution companion, and rejection of exit code 7 in both export scripts. No PDF or EPUB was generated by this check.
- `git diff --check`: passed. No temporary snippet files remain.

The permanent [Volume 1 validator](../scripts/validate-volume-one.cjs) executes actual temporary `.cjs` or `.mjs` files beside their chapter dependencies and removes only files it created. A focused chapter run is available with `npm run docs:examples:test -- --chapter 11`.

## Verification Limits

Pandoc is not installed, so this work does not claim newly generated or visually reviewed PDF/EPUB artifacts. Source inclusion and failure reporting are checked separately from real export rendering.

The browser connection failed before a tab could open, so interactive layout and rendered Mermaid appearance have not been visually checked. Diagram source equality and site-build/static-artifact checks do not replace that visual review.

Node.js 20.19.0 is the reproducibility baseline used here, not a deployment support recommendation. No dependency upgrade, external publication, or merge was performed as part of this repair.
