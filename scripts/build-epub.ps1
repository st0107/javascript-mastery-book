$ErrorActionPreference = "Stop"

$output = "epub/javascript-mastery-for-faang-interviews.epub"
$fixedSources = @(
  "docs/index.md",
  "docs/book-production-standard.md",
  "docs/table-of-contents.md",
  "docs/volume-1/README.md",
  "docs/volume-1/SUMMARY.md",
  "docs/volume-1/preface.md"
)

$volumeOneSources = Get-ChildItem -Path "docs/volume-1/chapter-*" -Filter "*.md" -Recurse |
  Where-Object { $_.FullName -notlike "*chapter-01-execution-model.md" } |
  Sort-Object FullName |
  ForEach-Object { $_.FullName }

$sources = @(
  $fixedSources
  $volumeOneSources
  "appendix/glossary.md",
  "appendix/references.md"
)

if (-not (Get-Command pandoc -ErrorAction SilentlyContinue)) {
  throw "Pandoc is required to build the EPUB. Install Pandoc, then rerun this script."
}

pandoc $sources -o $output --toc --metadata title="JavaScript Mastery for FAANG Interviews"

Write-Host "EPUB generated at $output"
