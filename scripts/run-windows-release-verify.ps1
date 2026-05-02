# Full pre-release verification for Windows (npm install + gates + optional backend deploy).
# Run from repo root: powershell -ExecutionPolicy Bypass -File scripts/run-windows-release-verify.ps1
# Options:
#   -SkipInstall       Skip npm install
#   -SkipDeploy        Skip Vercel production deploy (use when backend unchanged)
#   -AuditOnly         Run npm audit only (informational; does not fail the script)

param(
  [switch] $SkipInstall,
  [switch] $SkipDeploy,
  [switch] $AuditOnly
)

$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')

function Step([string] $msg) {
  Write-Host "`n=== $msg ===" -ForegroundColor Cyan
}

if ($AuditOnly) {
  Step "npm audit only (informational)"
  npm audit
  exit $LASTEXITCODE
}

if (-not $SkipInstall) {
  Step "npm install"
  npm install
}

Step "npm audit (informational — track vulns; avoid npm audit fix --force without testing)"
npm audit 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host "npm audit reported findings. Review and plan remediation; continuing verification." -ForegroundColor Yellow
}

Step "Typecheck"
npm run typecheck

Step "Lint (must be 0 errors)"
npm run lint
if ($LASTEXITCODE -ne 0) { throw "Lint failed" }

Step "Pillar unit tests"
npm run test:pillars

Step "Share URL unit tests"
npm run test:share

Step "Workstream C (Signals / identity / legacy recall suppression)"
npm run test:workstreamC

Step "Vercel env (strict — Blob + DB)"
npm run check-vercel-env:strict

if (-not $SkipDeploy) {
  Step "Deploy backend (production)"
  npm run deploy:vercel:prod
} else {
  Write-Host "`n(Skipped deploy: -SkipDeploy)" -ForegroundColor Yellow
}

Step "Verify backend"
npm run verify-backend

Step "Ethics + Open pillar + backend smoke (e2e script)"
npm run test:e2e:ethics-open-backend

Step "User contributions integration"
npm run test:user-contributions

Step "User contributions E2E"
npm run test:user-contributions-e2e

Step "Open Food Facts write check"
npm run verify-off

Step "Expo doctor"
npm run doctor

Write-Host "`n=== All release verification steps completed successfully ===" -ForegroundColor Green
Write-Host "Next: EAS builds with EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT=1 for Skeleton Signals UAT, e.g.`n  npx eas build -p ios --profile production`n  npx eas build -p android --profile production" -ForegroundColor Gray
