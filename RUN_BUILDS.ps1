# TrueScan Build Commands - Ready to Run
# Copy and paste each command into PowerShell

Write-Host "=== TrueScan Build Commands ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Navigate to project directory first:" -ForegroundColor Yellow
Write-Host "cd C:\TrueScan-FoodScanner" -ForegroundColor White
Write-Host ""

Write-Host "=== COMMAND 1: Start iOS Production Build ===" -ForegroundColor Green
Write-Host ""
Write-Host "npx eas build -p ios --profile production --non-interactive" -ForegroundColor White
Write-Host ""
Write-Host "Press Enter to continue to next command..." -ForegroundColor Gray
Read-Host

Write-Host ""
Write-Host "=== COMMAND 2: Start Android APK Build ===" -ForegroundColor Green
Write-Host ""
Write-Host "npx eas build -p android --profile preview-apk --non-interactive" -ForegroundColor White
Write-Host ""
Write-Host "Press Enter to continue to next command..." -ForegroundColor Gray
Read-Host

Write-Host ""
Write-Host "=== COMMAND 3: Check Build Status ===" -ForegroundColor Green
Write-Host ""
Write-Host "npx eas build:list --platform all" -ForegroundColor White
Write-Host ""
Write-Host "Press Enter to continue to next command..." -ForegroundColor Gray
Read-Host

Write-Host ""
Write-Host "=== COMMAND 4: Submit iOS to App Store Connect (Run AFTER iOS build completes) ===" -ForegroundColor Green
Write-Host ""
Write-Host "npx eas submit -p ios --latest --non-interactive" -ForegroundColor White
Write-Host ""
Write-Host "=== All commands displayed ===" -ForegroundColor Cyan
