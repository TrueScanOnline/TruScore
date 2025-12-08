# Build Android APK for Direct Installation
# This builds an APK file that can be installed directly on Android devices

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  BUILD ANDROID APK FOR DIRECT INSTALLATION" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "This will build an APK file that you can install directly on your Android phone." -ForegroundColor Yellow
Write-Host "Note: APK is for direct installation, AAB is for Play Store submission." -ForegroundColor Gray
Write-Host ""

# Check authentication
Write-Host "Checking authentication..." -ForegroundColor Cyan
$whoami = eas whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Not authenticated. Please run: eas login" -ForegroundColor Red
    exit 1
}
Write-Host "OK: Authenticated as: $whoami" -ForegroundColor Green
Write-Host ""

# Build APK
Write-Host "============================================================" -ForegroundColor Green
Write-Host "Building Android APK..." -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""

Write-Host "Starting Android APK build (preview profile)..." -ForegroundColor Yellow
Write-Host "This will create an APK file you can install directly on your phone." -ForegroundColor Gray
Write-Host ""

eas build --platform android --profile preview --non-interactive

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "OK: Android APK build started successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Wait for build to complete (10-20 minutes)" -ForegroundColor Gray
    Write-Host "2. Check Expo.dev: https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/builds" -ForegroundColor Cyan
    Write-Host "3. Download the APK file when build finishes" -ForegroundColor Gray
    Write-Host "4. Install on your Android phone by tapping the downloaded APK file" -ForegroundColor Gray
    Write-Host ""
    Write-Host "To check build status:" -ForegroundColor Yellow
    Write-Host "   eas build:list --platform android --limit 1" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "ERROR: Build failed to start" -ForegroundColor Red
    exit 1
}

Write-Host ""
