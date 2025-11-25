# ============================================
# EAS BUILD WORKFLOW SCRIPT
# Transitions from Expo Go to EAS Builds
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "EAS BUILD WORKFLOW - ANDROID + iOS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Health Checks
Write-Host "Step 1: Running health checks..." -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray

Write-Host "`n[1/3] Running Expo Doctor..." -ForegroundColor Cyan
npx expo-doctor
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n⚠️  Expo Doctor found issues. Please fix them before continuing." -ForegroundColor Red
    exit 1
}

Write-Host "`n[2/3] Generating native code (validation)..." -ForegroundColor Cyan
npx expo prebuild --clean
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n⚠️  Prebuild failed. Please check the errors above." -ForegroundColor Red
    exit 1
}

Write-Host "`n[3/3] Verifying EAS configuration..." -ForegroundColor Cyan
if (Test-Path "eas.json") {
    try {
        Get-Content eas.json | ConvertFrom-Json | Out-Null
        Write-Host "✅ eas.json is valid" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  eas.json is invalid. Please check the file." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "⚠️  eas.json not found. Run 'eas build:configure' first." -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ All health checks passed!" -ForegroundColor Green
Write-Host ""

# Step 2: EAS Login Check
Write-Host "Step 2: Checking EAS authentication..." -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray

$whoami = eas whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n⚠️  Not logged in to EAS." -ForegroundColor Yellow
    Write-Host "Logging in now..." -ForegroundColor Cyan
    eas login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`n❌ Login failed. Please try again." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Already logged in to EAS" -ForegroundColor Green
    Write-Host $whoami -ForegroundColor Gray
}

Write-Host ""

# Step 3: Build Confirmation
Write-Host "Step 3: Ready to start builds" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""
Write-Host "Build Configuration:" -ForegroundColor Cyan
Write-Host "  Platform: Android + iOS" -ForegroundColor White
Write-Host "  Profile: preview" -ForegroundColor White
Write-Host "  Distribution: internal (for testing)" -ForegroundColor White
Write-Host ""
Write-Host "Estimated Time:" -ForegroundColor Cyan
Write-Host "  Android: 10-15 minutes" -ForegroundColor White
Write-Host "  iOS: 15-25 minutes" -ForegroundColor White
Write-Host "  Total: 20-40 minutes (builds run in parallel)" -ForegroundColor White
Write-Host ""
Write-Host "Monitor builds at:" -ForegroundColor Cyan
Write-Host "  https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/builds" -ForegroundColor White
Write-Host ""

$confirm = Read-Host "Start builds now? (Y/N)"
if ($confirm -ne "Y" -and $confirm -ne "y") {
    Write-Host "`nBuild cancelled." -ForegroundColor Yellow
    exit 0
}

# Step 4: Start Builds
Write-Host ""
Write-Host "Step 4: Starting EAS builds..." -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""
Write-Host "🚀 Building both platforms simultaneously..." -ForegroundColor Green
Write-Host "   This will take 20-40 minutes." -ForegroundColor Gray
Write-Host "   You can close this window - builds continue on EAS servers." -ForegroundColor Gray
Write-Host "   Check your email or dashboard for completion notifications." -ForegroundColor Gray
Write-Host ""

# Start the build
eas build --platform all --profile preview

# Check exit code
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✅ BUILD WORKFLOW COMPLETE!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "  1. Check your email for build completion notifications" -ForegroundColor White
    Write-Host "  2. Visit the dashboard to download builds:" -ForegroundColor White
    Write-Host "     https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/builds" -ForegroundColor White
    Write-Host "  3. Install Android APK on test device" -ForegroundColor White
    Write-Host "  4. Install iOS build via TestFlight or ad-hoc distribution" -ForegroundColor White
    Write-Host ""
    Write-Host "To check build status:" -ForegroundColor Cyan
    Write-Host "  eas build:list --platform all --limit 5" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "❌ BUILD FAILED" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Check the error messages above." -ForegroundColor Yellow
    Write-Host "Common fixes:" -ForegroundColor Cyan
    Write-Host "  - Run 'npx expo-doctor' to check for issues" -ForegroundColor White
    Write-Host "  - Verify app.config.js is valid" -ForegroundColor White
    Write-Host "  - Check eas.json configuration" -ForegroundColor White
    Write-Host "  - Review build logs: eas build:list" -ForegroundColor White
    Write-Host ""
}

