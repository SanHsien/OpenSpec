[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $repoRoot

Write-Host "==> [1/4] Checking prerequisites..."
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "Node.js is not on PATH. Please install Node.js >= 20.19.0."
}
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    throw "pnpm is not on PATH. Please install pnpm."
}
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    throw "Python is not on PATH. Please install Python 3.10+."
}

Write-Host "==> [2/4] Installing dependencies with pnpm..."
& pnpm install
if ($LASTEXITCODE -ne 0) {
    throw "pnpm install failed with exit code $LASTEXITCODE"
}

Write-Host "==> [3/4] Building OpenSpec project..."
& pnpm run build
if ($LASTEXITCODE -ne 0) {
    throw "pnpm run build failed with exit code $LASTEXITCODE"
}

Write-Host "==> [4/4] Setting default GitHub repo to SanHsien/OpenSpec..."
if (Get-Command gh -ErrorAction SilentlyContinue) {
    & gh repo set-default SanHsien/OpenSpec
}

Write-Host "`nBOOTSTRAP SUCCESSFUL! Running dev_check..."
& (Join-Path $PSScriptRoot "dev_check.ps1")