[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $repoRoot

$env:PYTHONUTF8 = "1"
$env:PYTHONIOENCODING = "utf-8"

function Invoke-Step {
    param(
        [Parameter(Mandatory)]
        [string]$Label,
        [Parameter(Mandatory)]
        [string]$Command,
        [Parameter(Mandatory)]
        [string[]]$Arguments
    )
    Write-Host "==> $Label"
    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "$Label failed with exit code $LASTEXITCODE"
    }
}

Invoke-Step -Label "Compile maintained Python tools" -Command "python" -Arguments @("-m", "compileall", "-q", "tools")
Invoke-Step -Label "Check Markdown links" -Command "python" -Arguments @("tools/check_links.py")
Invoke-Step -Label "Fork hygiene contract tests" -Command "pnpm" -Arguments @("exec", "vitest", "run", "test/fork-hygiene.test.ts")
Invoke-Step -Label "Upstream baseline watermark check" -Command "python" -Arguments @("tools/check_upstream_updates.py", "--strict")

Write-Host "`nWINDOWS DEV CHECK GREEN"