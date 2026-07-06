$ErrorActionPreference = "Stop"

$output = "pdf/javascript-mastery-for-faang-interviews.pdf"
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
  throw "Pandoc is required to build the PDF. Install Pandoc and a LaTeX engine, then rerun this script."
}

pandoc $sources -o $output --toc --number-sections --metadata title="JavaScript Mastery for FAANG Interviews"

Write-Host "PDF generated at $output"

