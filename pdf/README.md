# PDF Output

Run `npm run pdf:build` to generate `javascript-mastery-volume-1.pdf` from the Volume One Markdown source. Run `npm run volume1:build` to generate PDF and EPUB together.

The standalone book includes all 11 chapters, the preface, overview, execution-model companion, 24 rendered diagrams, clickable contents and links, PDF bookmarks, and page numbers. The generated contents replace the source section summary.

The build uses installed Chrome, Chromium, or Edge through Puppeteer. Set `BOOK_BROWSER_PATH` to a custom executable location. No Pandoc or LaTeX is required. Intermediate HTML, images, and a source manifest are written under `build/volume-1/`.

The older combined-volume Pandoc build remains available as `npm run pdf:collection`; it requires Pandoc and a LaTeX engine and is not the standalone Volume One release.

