# Canonical post-dev / release commands for Windows PowerShell.
# Use ASCII-only headings so Windows PowerShell 5.1 parses reliably (Unicode em dash in strings can break parsing).
#
# If you ever linked Vercel at the repo root by mistake: run once from repo root:
#   yarn clean:vercel-root-link

Write-Host ""
Write-Host "=== One-time (only if you linked Vercel at repo root by mistake) ===" -ForegroundColor DarkGray
Write-Host "yarn clean:vercel-root-link"
Write-Host ""
Write-Host "=== Core quality gates ===" -ForegroundColor Cyan
Write-Host 'Set-Location "C:\TrueScan-FoodScanner"'
Write-Host "yarn test:pillars"
Write-Host "yarn test:share"
Write-Host "yarn lint"
Write-Host ""
Write-Host "=== Vercel env (strict) ===" -ForegroundColor Cyan
Write-Host "yarn check-vercel-env:strict"
Write-Host ""
Write-Host "=== Backend deploy (use this from repo root) ===" -ForegroundColor Cyan
Write-Host 'Set-Location "C:\TrueScan-FoodScanner"'
Write-Host "yarn deploy:vercel:prod"
Write-Host ""
Write-Host "Alternative (manual): cd to backend\vercel, then sync + vercel:" -ForegroundColor DarkGray
Write-Host 'Set-Location "C:\TrueScan-FoodScanner\backend\vercel"'
Write-Host "npm run sync-truescan-src"
Write-Host "npx vercel --prod"
Write-Host 'Set-Location "C:\TrueScan-FoodScanner"'
Write-Host ""
Write-Host "=== Post-deploy ===" -ForegroundColor Cyan
Write-Host "yarn verify-backend"
Write-Host "yarn test:e2e:ethics-open-backend"
Write-Host ""
Write-Host "=== Optional ===" -ForegroundColor Cyan
Write-Host "Local app (do not use global expo / expo-cli): yarn start   or clear cache: yarn start:clear"
Write-Host "yarn verify-off"
Write-Host "yarn test:user-contributions"
Write-Host "yarn test:user-contributions-e2e"
Write-Host "yarn doctor"
Write-Host "npx tsc --noEmit"
Write-Host ""
Write-Host "=== EAS production (two separate commands) ===" -ForegroundColor Cyan
Write-Host 'npx eas build -p android --profile production'
Write-Host 'npx eas build -p ios --profile production'
Write-Host ""
