[CmdletBinding()]
param(
  [string]$ExamplesPath
)

$ErrorActionPreference = "Stop"

# Windows PowerShell 5.1 can evaluate parameter defaults before PSScriptRoot is set.
if (-not $PSBoundParameters.ContainsKey("ExamplesPath")) {
  $ExamplesPath = Join-Path $PSScriptRoot "../code"
}

$examples = @(Get-ChildItem -LiteralPath $ExamplesPath -File -Recurse |
  Where-Object {
    $_.Extension -in @(".js", ".mjs", ".cjs") -and
    $_.Name -notlike ".book-snippet-*"
  } |
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
