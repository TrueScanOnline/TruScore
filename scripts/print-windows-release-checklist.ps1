# Canonical post-dev / release commands for Windows PowerShell.
# ASCII-only output so Windows PowerShell 5.1 always parses when copy-pasting snippets from here.
#
# If you ever linked Vercel at the repo root by mistake (run once from repo root):
#   npm run clean:vercel-root-link

Write-Host ""
Write-Host "=== Copy-paste: FULL manual sequence (same order as scripts/run-windows-release-verify.ps1) ===" -ForegroundColor Green
Write-Host "# Repo root"
Write-Host 'Set-Location "C:\TrueScan-FoodScanner"'
Write-Host ""
Write-Host "# --- Dependencies (advisory: npm audit)"
Write-Host "npm install"
Write-Host "npm audit"
Write-Host ""
Write-Host "# --- Core quality gates"
Write-Host "npm run typecheck"
Write-Host "npm run lint"
Write-Host "npm run test:pillars"
Write-Host "npm run test:share"
Write-Host "npm run test:workstreamC"
Write-Host ""
Write-Host "# --- Vercel env (strict: DB + Blob / photo CDN)"
Write-Host "npm run check-vercel-env:strict"
Write-Host ""
Write-Host "# --- Backend: production deploy (SKIP this block when backend unchanged; use no-deploy verify instead)"
Write-Host "npm run deploy:vercel:prod"
Write-Host ""
Write-Host "# --- Post-deploy / backend proof"
Write-Host "npm run verify-backend"
Write-Host "npm run test:e2e:ethics-open-backend"
Write-Host ""
Write-Host "# --- Integrations"
Write-Host "npm run test:user-contributions"
Write-Host "npm run test:user-contributions-e2e"
Write-Host "npm run verify-off"
Write-Host ""
Write-Host "# --- Expo health"
Write-Host "npm run doctor"
Write-Host ""
Write-Host "# --- Optional: Workstream C CSV/bundle changed since last commit"
Write-Host "# npm run workstreamC:generate-runtime-bundle"
Write-Host "# npm run test:workstreamC"
Write-Host ""
Write-Host "# --- Optional: same as typecheck"
Write-Host "# npx tsc --noEmit"
Write-Host ""
Write-Host "=== One-shot automated verify (same steps as above) ===" -ForegroundColor Cyan
Write-Host "npm run release:verify:windows"
Write-Host "npm run release:verify:windows:no-deploy"
Write-Host "npm run release:verify:windows:skip-install-no-deploy"
Write-Host ""
Write-Host "=== One-shot flags (raw PowerShell) ===" -ForegroundColor Cyan
Write-Host 'powershell -ExecutionPolicy Bypass -File "C:\TrueScan-FoodScanner\scripts\run-windows-release-verify.ps1"'
Write-Host 'powershell -ExecutionPolicy Bypass -File "C:\TrueScan-FoodScanner\scripts\run-windows-release-verify.ps1" -SkipDeploy'
Write-Host 'powershell -ExecutionPolicy Bypass -File "C:\TrueScan-FoodScanner\scripts\run-windows-release-verify.ps1" -SkipInstall -SkipDeploy'
Write-Host 'powershell -ExecutionPolicy Bypass -File "C:\TrueScan-FoodScanner\scripts\run-windows-release-verify.ps1" -AuditOnly'
Write-Host ""
Write-Host "=== EAS production (Dynamic Signals Asset: enablement is founder-gated; do not bake Skeleton UAT) ===" -ForegroundColor Cyan
Write-Host 'npx eas build -p android --profile production'
Write-Host 'npx eas build -p ios --profile production'
Write-Host ""
Write-Host "=== Local dev (use project Expo, not global expo-cli) ===" -ForegroundColor DarkGray
Write-Host "npm start"
Write-Host "npm run start:clear"
Write-Host ""
