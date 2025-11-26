# EAS Build Setup Script for Dual User Testing
# Run this script to set up EAS Build for testing

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "EAS Build Setup for TrueScan Testing" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if EAS CLI is installed
Write-Host "Step 1: Checking EAS CLI..." -ForegroundColor Yellow
$easInstalled = Get-Command eas -ErrorAction SilentlyContinue

if (-not $easInstalled) {
    Write-Host "EAS CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g eas-cli
    Write-Host "✅ EAS CLI installed!" -ForegroundColor Green
} else {
    Write-Host "✅ EAS CLI already installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 2: Login to Expo..." -ForegroundColor Yellow
Write-Host "This will open your browser to login." -ForegroundColor White
Write-Host "Press Enter to continue..." -ForegroundColor White
Read-Host

eas login

Write-Host ""
Write-Host "Step 3: Configuring EAS Build..." -ForegroundColor Yellow
Write-Host "This will create/update eas.json file." -ForegroundColor White
Write-Host "Press Enter to continue..." -ForegroundColor White
Read-Host

eas build:configure

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Build Android: eas build --platform android --profile preview" -ForegroundColor White
Write-Host "2. Build iOS: eas build --platform ios --profile preview" -ForegroundColor White
Write-Host "3. Share download links with your testers" -ForegroundColor White
Write-Host ""
Write-Host "Note: iOS builds require Apple Developer account ($99/year)" -ForegroundColor Yellow
Write-Host ""



