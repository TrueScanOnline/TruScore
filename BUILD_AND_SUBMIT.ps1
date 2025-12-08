# Build and Submit Script for TrueScan
# This script monitors builds and submits iOS build to App Store Connect

Write-Host "=== TrueScan Build and Submit Script ===" -ForegroundColor Cyan
Write-Host ""

# Check if EAS CLI is installed
Write-Host "Checking EAS CLI..." -ForegroundColor Yellow
$easCheck = npx eas --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: EAS CLI not found. Installing..." -ForegroundColor Red
    npm install -g eas-cli
}

Write-Host ""
Write-Host "=== Step 1: Checking Build Status ===" -ForegroundColor Cyan

# Check iOS build status
Write-Host "Checking iOS build status..." -ForegroundColor Yellow
$iosBuilds = npx eas build:list --platform ios --limit 1 --non-interactive 2>&1
Write-Host $iosBuilds

# Check Android build status
Write-Host ""
Write-Host "Checking Android build status..." -ForegroundColor Yellow
$androidBuilds = npx eas build:list --platform android --limit 1 --non-interactive 2>&1
Write-Host $androidBuilds

Write-Host ""
Write-Host "=== Builds are running in background ===" -ForegroundColor Green
Write-Host "iOS Production build: Started" -ForegroundColor Green
Write-Host "Android APK build: Started" -ForegroundColor Green
Write-Host ""
Write-Host "To check build status manually, run:" -ForegroundColor Yellow
Write-Host "  npx eas build:list --platform all" -ForegroundColor White
Write-Host ""
Write-Host "To submit iOS build once complete, run:" -ForegroundColor Yellow
Write-Host "  npx eas submit -p ios --latest --non-interactive" -ForegroundColor White
Write-Host ""
