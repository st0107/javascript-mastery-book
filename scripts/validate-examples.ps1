[CmdletBinding()]
param(
  [string]$ExamplesPath = (Join-Path $PSScriptRoot "../code")
)

$ErrorActionPreference = "Stop"

$examples = @(Get-ChildItem -LiteralPath $ExamplesPath -File -Recurse |
  Where-Object { $_.Extension -in @(".js", ".mjs", ".cjs") } |
  Sort-Object FullName)

if ($examples.Count -eq 0) {
  throw "No JavaScript examples found."
}

foreach ($example in $examples) {
  Write-Host "Running $($example.FullName)"
  & node "$($example.FullName)"
  if ($LASTEXITCODE -ne 0) {
    throw "JavaScript example failed with exit code ${LASTEXITCODE}: $($example.FullName)"
  }
}

Write-Host "All $($examples.Count) JavaScript examples ran successfully."
