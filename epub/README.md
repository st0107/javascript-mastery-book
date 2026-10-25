# EPUB Output

Generated EPUB files are written to this directory by `scripts/build-epub.ps1`.

Run `npm run epub:build` to generate `javascript-mastery-volume-1.epub`, or `npm run volume1:build` to generate PDF and EPUB together. The standalone EPUB includes all Volume One chapters, the preface, overview, execution-model companion, a nested navigation table of contents, and 24 offline diagram images.

The build uses installed Chrome, Chromium, or Edge to render diagrams. Set `BOOK_BROWSER_PATH` for a nonstandard executable location. No Pandoc is required. With Python 3, run `python scripts/validate-volume-one-exports.py --epub-only` to verify package structure, source coverage, image resources, and internal links without additional Python dependencies. To check PDF as well, install `scripts/requirements-export-validation.txt` with pip and run `npm run volume1:exports:test` after a combined `volume1:build`. The release is also checked with the official EPUBCheck validator.

The EPUB is reflowable; reader font and page settings can vary. The older combined-volume Pandoc script is available separately as `npm run epub:collection` and is not the standalone Volume One release.

