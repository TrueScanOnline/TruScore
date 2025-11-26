# ============================================
# COMPLETE EAS BUILD WORKFLOW - ANDROID + iOS
# Transitions from Expo Go to EAS Builds
# Runs both platforms simultaneously
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "COMPLETE EAS BUILD WORKFLOW" -ForegroundColor Cyan
Write-Host "Android + iOS Simultaneous Builds" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Health Checks
Write-Host "Step 1: Running health checks..." -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray

Write-Host "`n[1/3] Running Expo Doctor..." -ForegroundColor Cyan
$doctorResult = npx expo-doctor 2>&1
$doctorOutput = $doctorResult | Out-String

# Check if expo-doctor found issues
if ($LASTEXITCODE -ne 0) {
    # Check if the only issue is the non-blocking app config warning
    # This warning appears when native folders exist - it's expected and non-blocking
    $hasAppConfigWarning = $doctorOutput -match "app config fields that may not be synced"
    $hasOnlyOneFailure = $doctorOutput -match "1 checks failed"
    $hasOnlyAppConfigWarning = $hasAppConfigWarning -and $hasOnlyOneFailure
    
    if ($hasOnlyAppConfigWarning) {
        Write-Host "⚠️  Expo Doctor: Non-blocking warning detected (app config sync)" -ForegroundColor Yellow
        Write-Host "   This is expected when native folders exist. Build will proceed." -ForegroundColor Gray
        Write-Host "✅ Expo Doctor: Proceeding with build (warning is non-blocking)" -ForegroundColor Green
    } else {
        Write-Host "`n⚠️  Expo Doctor found issues. Please fix them before continuing." -ForegroundColor Red
        Write-Host $doctorResult -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "✅ Expo Doctor: All checks passed" -ForegroundColor Green
}

Write-Host "`n[2/3] Generating native code (validation)..." -ForegroundColor Cyan
$prebuildResult = npx expo prebuild --clean 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n⚠️  Prebuild failed. Please check the errors above." -ForegroundColor Red
    Write-Host $prebuildResult -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Prebuild: Native code generated successfully" -ForegroundColor Green

Write-Host "`n[3/3] Verifying EAS configuration..." -ForegroundColor Cyan
if (Test-Path "eas.json") {
    try {
        $easConfig = Get-Content eas.json | ConvertFrom-Json
        Write-Host "✅ eas.json is valid" -ForegroundColor Green
        Write-Host "   Build profiles: $($easConfig.build.PSObject.Properties.Name -join ', ')" -ForegroundColor Gray
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

$whoamiResult = eas whoami 2>&1
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
    $accountInfo = ($whoamiResult | Select-String -Pattern "Logged in as").ToString()
    if ($accountInfo) {
        Write-Host "   $accountInfo" -ForegroundColor Gray
    }
}

Write-Host ""

# Step 3: Build Configuration
Write-Host "Step 3: Build configuration" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""
Write-Host "Build Configuration:" -ForegroundColor Cyan
Write-Host "  Platform: Android + iOS (simultaneous)" -ForegroundColor White
Write-Host "  Profile: preview" -ForegroundColor White
Write-Host "  Distribution:" -ForegroundColor White
Write-Host "    - Android: internal (APK)" -ForegroundColor Gray
Write-Host "    - iOS: store (TestFlight)" -ForegroundColor Gray
Write-Host ""
Write-Host "Estimated Time:" -ForegroundColor Cyan
Write-Host "  Android: 10-15 minutes" -ForegroundColor White
Write-Host "  iOS: 15-25 minutes" -ForegroundColor White
Write-Host "  Total: 20-40 minutes (builds run in parallel)" -ForegroundColor White
Write-Host ""
Write-Host "Monitor builds at:" -ForegroundColor Cyan
Write-Host "  https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/builds" -ForegroundColor White
Write-Host ""

$confirm = Read-Host "Start builds for both platforms? (Y/N)"
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

# Start the build for both platforms
Write-Host "Starting build command..." -ForegroundColor Cyan
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
    Write-Host ""
    Write-Host "Android:" -ForegroundColor Cyan
    Write-Host "  - Download APK file" -ForegroundColor White
    Write-Host "  - Share with Android tester" -ForegroundColor White
    Write-Host "  - Tester installs directly (no account needed)" -ForegroundColor White
    Write-Host ""
    Write-Host "iOS:" -ForegroundColor Cyan
    Write-Host "  - Build will be submitted to App Store Connect" -ForegroundColor White
    Write-Host "  - Run: eas submit --platform ios" -ForegroundColor White
    Write-Host "  - Add tester in App Store Connect TestFlight" -ForegroundColor White
    Write-Host "  - Tester receives email invitation" -ForegroundColor White
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
    Write-Host "  - Check build credits (free: 30/month)" -ForegroundColor White
    Write-Host ""
}

