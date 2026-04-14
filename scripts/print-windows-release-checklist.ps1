# Canonical post-dev / release commands for Windows PowerShell.
# Use ASCII-only headings so Windows PowerShell 5.1 parses reliably (Unicode em dash in strings can break parsing).
#
# If you ever linked Vercel at the repo root by mistake: run once from repo root:
#   npm run clean:vercel-root-link

Write-Host ""
Write-Host "=== One-time (only if you linked Vercel at repo root by mistake) ===" -ForegroundColor DarkGray
Write-Host "npm run clean:vercel-root-link"
Write-Host ""
Write-Host "=== Core quality gates ===" -ForegroundColor Cyan
Write-Host 'Set-Location "C:\TrueScan-FoodScanner"'
Write-Host "npm run test:pillars"
Write-Host "npm run test:share"
Write-Host "npm run lint"
Write-Host ""
Write-Host "=== Vercel env (strict) ===" -ForegroundColor Cyan
Write-Host "npm run check-vercel-env:strict"
Write-Host ""
Write-Host "=== Backend deploy (use this from repo root) ===" -ForegroundColor Cyan
Write-Host 'Set-Location "C:\TrueScan-FoodScanner"'
Write-Host "npm run deploy:vercel:prod"
Write-Host ""
Write-Host "Alternative (manual): cd to backend\vercel, then sync + vercel:" -ForegroundColor DarkGray
Write-Host 'Set-Location "C:\TrueScan-FoodScanner\backend\vercel"'
Write-Host "npm run sync-truescan-src"
Write-Host "npx vercel --prod"
Write-Host 'Set-Location "C:\TrueScan-FoodScanner"'
Write-Host ""
Write-Host "=== Post-deploy ===" -ForegroundColor Cyan
Write-Host "npm run verify-backend"
Write-Host "npm run test:e2e:ethics-open-backend"
Write-Host ""
Write-Host "=== Optional ===" -ForegroundColor Cyan
Write-Host "Local app (do not use global expo / expo-cli): npm start   or clear cache: npm run start:clear"
Write-Host "npm run verify-off"
Write-Host "npm run test:user-contributions"
Write-Host "npm run test:user-contributions-e2e"
Write-Host "npm run doctor"
Write-Host "npx tsc --noEmit"
Write-Host ""
Write-Host "=== EAS production (two separate commands) ===" -ForegroundColor Cyan
Write-Host 'npx eas build -p android --profile production'
Write-Host 'npx eas build -p ios --profile production'
Write-Host ""
