$ErrorActionPreference = "Stop"

$output = "pdf/javascript-mastery-for-faang-interviews.pdf"
$fixedSources = @(
  "docs/index.md",
  "docs/book-production-standard.md",
  "docs/table-of-contents.md",
  "docs/volume-1/README.md",
  "docs/volume-1/SUMMARY.md",
  "docs/volume-1/preface.md"
)

$volumeOneSources = Get-ChildItem -LiteralPath "docs/volume-1" -Directory -Filter "chapter-*" |
  ForEach-Object { Get-ChildItem -LiteralPath $_.FullName -File -Filter "*.md" } |
  Sort-Object FullName |
  ForEach-Object { $_.FullName }

$volumeTwoSources = Get-ChildItem -LiteralPath "docs/volume-2" -Directory -Filter "chapter-*" |
  ForEach-Object { Get-ChildItem -LiteralPath $_.FullName -File -Filter "*.md" } |
  Sort-Object FullName |
  ForEach-Object { $_.FullName }

$sources = @(
  $fixedSources
  $volumeOneSources
  "docs/volume-1/chapter-01-execution-model.md"
  "docs/volume-2/index.md",
  "docs/volume-2/SUMMARY.md"
  $volumeTwoSources
  "appendix/glossary.md",
  "appendix/references.md"
)

if (-not (Get-Command pandoc -ErrorAction SilentlyContinue)) {
  throw "Pandoc is required to build the PDF. Install Pandoc and a LaTeX engine, then rerun this script."
}

pandoc $sources -o $output --toc --number-sections --metadata title="JavaScript Mastery for FAANG Interviews"
if ($LASTEXITCODE -ne 0) {
  throw "Pandoc PDF generation failed with exit code $LASTEXITCODE."
}

Write-Host "PDF generated at $output"
