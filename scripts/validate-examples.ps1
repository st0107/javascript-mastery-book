$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $true

$examples = Get-ChildItem -Path "code" -Filter "*.js" -Recurse

if ($examples.Count -eq 0) {
  throw "No JavaScript examples found."
}

foreach ($example in $examples) {
  Write-Host "Running $($example.FullName)"
  & node "$($example.FullName)"
}

Write-Host "All JavaScript examples ran successfully."
