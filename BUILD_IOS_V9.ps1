# iOS Build Script v9.0
# Complete build and submission process for iOS App Store Connect

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "iOS BUILD v9.0 - PRE-BUILD CHECKS & BUILD PROCESS" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

# ============================================================================
# STEP 1: PRE-BUILD CHECKS
# ============================================================================
Write-Host "STEP 1: Running Pre-Build Checks..." -ForegroundColor Cyan
Write-Host ""

# Check 1: Remove duplicate lock file
Write-Host "Check 1: Removing duplicate lock file..." -ForegroundColor Yellow
if (Test-Path "package-lock.json") {
    Write-Host "  ⚠️  Found package-lock.json (yarn is the package manager)" -ForegroundColor Yellow
    Write-Host "  🗑️  Removing package-lock.json..." -ForegroundColor Yellow
    Remove-Item "package-lock.json" -Force
    Write-Host "  ✅ Removed package-lock.json" -ForegroundColor Green
} else {
    Write-Host "  ✅ No package-lock.json found (yarn.lock only)" -ForegroundColor Green
}

# Check 2: Verify yarn.lock exists
if (Test-Path "yarn.lock") {
    Write-Host "  ✅ yarn.lock exists" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  WARNING: yarn.lock not found!" -ForegroundColor Red
    Write-Host "  💡 Run 'yarn install' to create yarn.lock" -ForegroundColor Yellow
}

# Check 3: Run expo-doctor
Write-Host ""
Write-Host "Check 2: Running expo-doctor..." -ForegroundColor Yellow
$doctorOutput = npx expo-doctor 2>&1
Write-Host $doctorOutput

# Check if expo-doctor passed
if ($LASTEXITCODE -eq 0 -or $doctorOutput -match "All checks passed") {
    Write-Host "  ✅ expo-doctor checks passed" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  expo-doctor found issues (see above)" -ForegroundColor Yellow
    Write-Host "  💡 Continuing with build (non-critical warnings may be present)" -ForegroundColor Yellow
}

# Check 4: Verify EAS CLI is installed
Write-Host ""
Write-Host "Check 3: Verifying EAS CLI..." -ForegroundColor Yellow
$easCheck = eas --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ EAS CLI installed: $easCheck" -ForegroundColor Green
} else {
    Write-Host "  ❌ EAS CLI not found!" -ForegroundColor Red
    Write-Host "  💡 Install with: npm install -g eas-cli" -ForegroundColor Yellow
    exit 1
}

# Check 5: Verify logged in to EAS
Write-Host ""
Write-Host "Check 4: Verifying EAS authentication..." -ForegroundColor Yellow
$whoami = eas whoami 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Authenticated: $whoami" -ForegroundColor Green
} else {
    Write-Host "  ❌ Not authenticated to EAS!" -ForegroundColor Red
    Write-Host "  💡 Login with: eas login" -ForegroundColor Yellow
    exit 1
}

# Check 6: Verify app.config.js exists
Write-Host ""
Write-Host "Check 5: Verifying app.config.js..." -ForegroundColor Yellow
if (Test-Path "app.config.js") {
    Write-Host "  ✅ app.config.js exists" -ForegroundColor Green
} else {
    Write-Host "  ❌ app.config.js not found!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "PRE-BUILD CHECKS COMPLETE" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

# ============================================================================
# STEP 2: UPDATE VERSION TO 9.0.0
# ============================================================================
Write-Host "STEP 2: Updating version to 9.0.0..." -ForegroundColor Cyan
Write-Host ""

# Read current app.config.js
$configContent = Get-Content "app.config.js" -Raw

# Update version
$configContent = $configContent -replace "version: '1\.0\.0'", "version: '9.0.0'"
$configContent = $configContent -replace "buildNumber: '8'", "buildNumber: '9'"

# Write updated config
Set-Content "app.config.js" -Value $configContent -NoNewline

Write-Host "  ✅ Updated version to 9.0.0" -ForegroundColor Green
Write-Host "  ✅ Updated iOS buildNumber to 9" -ForegroundColor Green
Write-Host ""

# Verify changes
$versionCheck = Select-String -Path "app.config.js" -Pattern "version: '9\.0\.0'"
$buildCheck = Select-String -Path "app.config.js" -Pattern "buildNumber: '9'"

if ($versionCheck -and $buildCheck) {
    Write-Host "  ✅ Version update verified" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  WARNING: Version update may have failed!" -ForegroundColor Red
    Write-Host "  💡 Please verify app.config.js manually" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "VERSION UPDATE COMPLETE" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

# ============================================================================
# STEP 3: BUILD AND SUBMIT TO APP STORE CONNECT
# ============================================================================
Write-Host "STEP 3: Building and Submitting iOS Build..." -ForegroundColor Cyan
Write-Host ""
Write-Host "This will:" -ForegroundColor Yellow
Write-Host "  1. Build iOS app with EAS Build" -ForegroundColor Yellow
Write-Host "  2. Submit to App Store Connect automatically" -ForegroundColor Yellow
Write-Host "  3. Make it available for TestFlight testing" -ForegroundColor Yellow
Write-Host ""
Write-Host "Build Profile: production (from eas.json)" -ForegroundColor Cyan
Write-Host "Version: 9.0.0 (Build 9)" -ForegroundColor Cyan
Write-Host ""

# Confirm before proceeding
$confirm = Read-Host "Continue with build and submission? (y/N)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host ""
    Write-Host "Build cancelled by user" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Starting build and submission..." -ForegroundColor Green
Write-Host ""

# Build and submit
# --auto-submit flag automatically submits to App Store Connect after build
# --platform ios specifies iOS build
# --profile production uses the production profile from eas.json
eas build --platform ios --profile production --auto-submit

# Check build result
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host "✅ BUILD AND SUBMISSION COMPLETE!" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "  1. Wait for App Store Connect processing (usually 10-30 minutes)" -ForegroundColor Yellow
    Write-Host "  2. Check App Store Connect: https://appstoreconnect.apple.com" -ForegroundColor Yellow
    Write-Host "  3. Once processed, add to TestFlight for testing" -ForegroundColor Yellow
    Write-Host "  4. Share TestFlight link with your Australian tester (iPhone 11)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Build Details:" -ForegroundColor Cyan
    Write-Host "  Version: 9.0.0" -ForegroundColor White
    Write-Host "  Build Number: 9" -ForegroundColor White
    Write-Host "  Platform: iOS" -ForegroundColor White
    Write-Host "  Profile: production" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Red
    Write-Host "❌ BUILD FAILED" -ForegroundColor Red
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Red
    Write-Host ""
    Write-Host "Check the error messages above for details" -ForegroundColor Yellow
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "  - Missing certificates or provisioning profiles" -ForegroundColor Yellow
    Write-Host "  - App Store Connect authentication issues" -ForegroundColor Yellow
    Write-Host "  - Build configuration errors" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

