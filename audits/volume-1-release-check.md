# Volume One Release Check

Reviewed: 2026-10-25. Scope: the remaining validation, visual-review, and standalone-export gaps following the [October 1 resolution](volume-1-gap-resolution.md).

## Completed Repairs

- Clarified four technical details across six chapter files: function-valued checks versus class constructors, lone surrogates in string iteration, array length after deleting the final element, and function declaration initialization during ES module instantiation. No missing foundation chapter was found.
- Improved snippet timeout and process-launch diagnostics to identify the document and JavaScript block. Regression checks confirm failure remains fatal and temporary snippets are removed. The 10-second limit is unchanged; the earlier Chapter 2 timeout did not recur in two complete validation runs.
- Added an accessible, keyboard-focusable scroll region for wide website Mermaid diagrams. The diagram keeps at least 85% of its intrinsic width, preventing unreadably small labels on phones.
- Added a standalone Volume One export pipeline using local Chrome, Chromium, or Edge. It includes the 121 chapter sections, overview, preface, and execution-model companion. Generated contents replace the source section summary, giving 124 source documents. Both books include 24 offline diagram images and internal links. Very wide printed graphs are reflowed vertically while preserving their labels and relationships.
- Added PDF bookmarks, page numbering, a responsive EPUB cover, and a print rule preventing multiline headings from splitting across pages. The final PDF has 326 pages.
- Added a permanent artifact validator and documented its pinned Python dependency. Default PDF/EPUB commands build Volume One; the older Pandoc collection builds remain separate commands. CI now includes documented-snippet and validator-regression checks.

## Validation Evidence

| Check | Result |
| --- | --- |
| Companion programs | All 73 repository programs passed |
| Documented JavaScript | Full checks passed 125 documents, 289 runnable blocks, 280 local links, and 24 synchronized diagrams; 97 affected blocks also passed after the content corrections |
| Curriculum and navigation | 121 main sections, 66 exercises, and 176 MCQs verified |
| Validator regressions | Failure, format, default path, temporary-file exclusion, launch-error/timeout diagnostics, and cleanup checks passed |
| Website production build | Passed with the final content and diagram wrapper |
| Website browser review | All 125 Volume One routes returned successfully; all 24 diagrams rendered at both 1440px and 390px (48 checks), with no page overflow or browser runtime errors and minimum diagram scale above 0.85. Keyboard diagram scrolling, mobile menu, chapter links, next-section navigation, search results, and dark theme passed |
| EPUB artifact integrity | 124 source documents, 126 spine entries, 301 exact code fences (including shell commands), 24 valid PNG diagrams, and 421 local resource/fragment references passed; source hash matches current Markdown |
| PDF structure | 326 pages, 67 valid named destinations, bookmarks, and tagged structure passed |
| EPUBCheck 5.4.0 | Zero fatal errors, errors, or warnings |
| EPUB visual review | Strict XHTML rendered at 1440px and 390px across six representative documents: cover, navigation, diagrams, code, and tables; no XML errors, broken images, clipping, or page overflow |
| PDF visual review | All 326 pages rendered to contact sheets; representative full-size diagram, code, table, cover, contents, and chapter pages inspected. A split heading on pages 143-144 was corrected and those final pages rechecked. Text-boundary checks found no clipping |
| Source whitespace | `git diff --check` passed for maintained sources |

The EPUB visual review used browser-rendered XHTML, not a dedicated ebook-reader application. Reader-selected fonts and pagination can vary. This is a local build and review; no external publication or merge is claimed.

## Rebuild

Install JavaScript dependencies with `npm ci`. Use Python 3 and install the PDF validator once:

```bash
python -m pip install -r scripts/requirements-export-validation.txt
npm run build:all
```

`build:all` runs companion examples, validator regressions, documented examples, the website build, both Volume One exports, and artifact integrity checks. `npm run volume1:build` rebuilds just the two books; `npm run volume1:exports:test` verifies that combined build. For EPUB-only validation without Python packages, run `python scripts/validate-volume-one-exports.py --epub-only`.

The browser is discovered in standard installation paths; set `BOOK_BROWSER_PATH` for a custom location. Pandoc and LaTeX are not needed for the standalone books. Intermediate HTML, images, and the source manifest live in `build/volume-1/`; review screenshots and machine-readable checks live in `build/volume-1-qa/`.

## Deliverables

- [Volume One PDF](../pdf/javascript-mastery-volume-1.pdf), 326 pages.
- [Volume One EPUB](../epub/javascript-mastery-volume-1.epub), reflowable with offline diagrams and nested navigation.
- Generated website in `website/`.

SHA-256 checksums of the reviewed book files:

```text
d911424e737a5177361549fd5a74c0d393a0d7adfc9af1d242595f9ebefae05d  javascript-mastery-volume-1.pdf
22fec2b214dbccf680cecaa2f244338fdcdcbbac723a7336fa5300dbe297bf2d  javascript-mastery-volume-1.epub
```
