# TrueScan Build Commands
# Run these commands in PowerShell

Write-Host "=== TrueScan Build Commands ===" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "app.config.js")) {
    Write-Host "ERROR: app.config.js not found. Please run this script from the project root directory." -ForegroundColor Red
    exit 1
}

Write-Host "Current directory: $PWD" -ForegroundColor Gray
Write-Host ""

# Step 1: Start iOS Production Build
Write-Host "=== Step 1: Starting iOS Production Build (Build #8) ===" -ForegroundColor Yellow
Write-Host "Command: npx eas build -p ios --profile production --non-interactive" -ForegroundColor Gray
Write-Host ""
Write-Host "Press any key to start iOS build..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

npx eas build -p ios --profile production --non-interactive

Write-Host ""
Write-Host "=== iOS Build Started ===" -ForegroundColor Green
Write-Host ""

# Step 2: Start Android APK Build
Write-Host "=== Step 2: Starting Android APK Build (Version Code 5) ===" -ForegroundColor Yellow
Write-Host "Command: npx eas build -p android --profile preview-apk --non-interactive" -ForegroundColor Gray
Write-Host ""
Write-Host "Press any key to start Android build..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

npx eas build -p android --profile preview-apk --non-interactive

Write-Host ""
Write-Host "=== Android Build Started ===" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "=== Build Commands Executed ===" -ForegroundColor Cyan
Write-Host "✅ iOS Production Build: Started" -ForegroundColor Green
Write-Host "✅ Android APK Build: Started" -ForegroundColor Green
Write-Host ""
Write-Host "To check build status:" -ForegroundColor Yellow
Write-Host "  npx eas build:list --platform all" -ForegroundColor White
Write-Host ""
Write-Host "To submit iOS build to App Store Connect (after build completes):" -ForegroundColor Yellow
Write-Host "  npx eas submit -p ios --latest --non-interactive" -ForegroundColor White
Write-Host ""

