# Removes a mistaken Vercel project link from the REPO ROOT only.
# The real backend project must stay linked under backend/vercel/.vercel
#
# When: you ran "npx vercel" or "vercel link" from C:\TrueScan-FoodScanner (root)
# instead of from backend\vercel. That creates root\.vercel and can confuse deploys.

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$rootVercel = Join-Path $repoRoot '.vercel'

if (-not (Test-Path $rootVercel)) {
    Write-Host "OK: No .vercel folder at repo root ($repoRoot). Nothing to remove." -ForegroundColor DarkGray
    exit 0
}

Remove-Item -LiteralPath $rootVercel -Recurse -Force
Write-Host "Removed mistaken Vercel link: $rootVercel" -ForegroundColor Green
Write-Host "Your backend link should remain at: $(Join-Path $repoRoot 'backend\vercel\.vercel')" -ForegroundColor Cyan
Write-Host ""
Write-Host "Optional: If root .env.local was created by a mistaken 'vercel pull', review or delete it yourself (it is gitignored)." -ForegroundColor DarkGray
