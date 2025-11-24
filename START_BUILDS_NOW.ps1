# PowerShell script to start EAS builds for Android and iOS
# Run this script to start both builds simultaneously

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting EAS Builds for Testing" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if logged in
Write-Host "Checking EAS login status..." -ForegroundColor Yellow
$whoami = eas whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Not logged in. Please run: eas login" -ForegroundColor Red
    exit 1
}
Write-Host "Logged in as: $whoami" -ForegroundColor Green
Write-Host ""

# Configure EAS project if needed
Write-Host "Configuring EAS project..." -ForegroundColor Yellow
Write-Host "If prompted, type 'y' and press Enter to create project" -ForegroundColor Cyan
Write-Host ""

# Try to configure (may need manual input)
$configureResult = eas build:configure 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Configuration may need manual input. Continuing anyway..." -ForegroundColor Yellow
    Write-Host "You can run 'eas build:configure' manually if needed" -ForegroundColor Cyan
    Write-Host ""
}

# Start Android build
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Android Build" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will take 10-20 minutes..." -ForegroundColor Yellow
Write-Host "Build runs in the cloud - you can close this window" -ForegroundColor Cyan
Write-Host ""

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; Write-Host '========================================' -ForegroundColor Cyan; Write-Host '  Android Build - Terminal 1' -ForegroundColor Green; Write-Host '========================================' -ForegroundColor Cyan; Write-Host ''; Write-Host 'Starting Android build...' -ForegroundColor Yellow; Write-Host 'This will take 10-20 minutes' -ForegroundColor Cyan; Write-Host ''; eas build --platform android --profile preview"

Write-Host "Android build started in new window!" -ForegroundColor Green
Write-Host ""

# Start iOS build
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting iOS Build" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will take 15-30 minutes..." -ForegroundColor Yellow
Write-Host "Build runs in the cloud - you can close this window" -ForegroundColor Cyan
Write-Host ""

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; Write-Host '========================================' -ForegroundColor Cyan; Write-Host '  iOS Build - Terminal 2' -ForegroundColor Green; Write-Host '========================================' -ForegroundColor Cyan; Write-Host ''; Write-Host 'Starting iOS build...' -ForegroundColor Yellow; Write-Host 'This will take 15-30 minutes' -ForegroundColor Cyan; Write-Host ''; eas build --platform ios --profile preview"

Write-Host "iOS build started in new window!" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Builds Started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Watch both terminal windows for build progress" -ForegroundColor White
Write-Host "2. When builds complete, you'll get download links" -ForegroundColor White
Write-Host "3. Share links with testers (see EAS_BUILD_AND_TEST_NOW.md)" -ForegroundColor White
Write-Host ""
Write-Host "Check build status anytime:" -ForegroundColor Cyan
Write-Host "  eas build:list" -ForegroundColor White
Write-Host ""

