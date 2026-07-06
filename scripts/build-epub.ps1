$ErrorActionPreference = "Stop"

$output = "epub/javascript-mastery-for-faang-interviews.epub"
$sources = @(
  "docs/index.md",
  "docs/book-production-standard.md",
  "docs/table-of-contents.md",
  "docs/volume-1/index.md",
  "docs/volume-1/chapter-01-execution-model.md",
  "appendix/glossary.md",
  "appendix/references.md"
)

if (-not (Get-Command pandoc -ErrorAction SilentlyContinue)) {
  throw "Pandoc is required to build the EPUB. Install Pandoc, then rerun this script."
}

pandoc $sources -o $output --toc --metadata title="JavaScript Mastery for FAANG Interviews"

Write-Host "EPUB generated at $output"

