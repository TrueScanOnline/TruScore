# Full Build Script for Android and iOS
# This script builds both platforms and uploads iOS to App Store Connect

param(
    [switch]$SkipAndroid,
    [switch]$SkipIOS,
    [switch]$SkipUpload
)

$ErrorActionPreference = "Stop"

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "TRUESCAN FOOD SCANNER - FULL BUILD SCRIPT" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check if EAS CLI is installed
Write-Host "📦 Checking EAS CLI installation..." -ForegroundColor Yellow
$easInstalled = Get-Command eas -ErrorAction SilentlyContinue
if (-not $easInstalled) {
    Write-Host "❌ EAS CLI not found. Installing..." -ForegroundColor Red
    npm install -g eas-cli
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install EAS CLI" -ForegroundColor Red
        exit 1
    }
}

# Check if logged in to EAS
Write-Host "🔐 Checking EAS authentication..." -ForegroundColor Yellow
$easWhoami = eas whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Not logged in to EAS. Please run: eas login" -ForegroundColor Yellow
    Write-Host "Attempting to login..." -ForegroundColor Yellow
    eas login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to login to EAS" -ForegroundColor Red
        exit 1
    }
}

# Android Build
if (-not $SkipAndroid) {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host "🤖 BUILDING ANDROID (Production AAB)" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Starting Android production build..." -ForegroundColor Yellow
    eas build --platform android --profile production --non-interactive
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Android build failed!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Android build completed successfully!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "⏭️  Skipping Android build (--SkipAndroid flag set)" -ForegroundColor Yellow
}

# iOS Build
if (-not $SkipIOS) {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host "🍎 BUILDING iOS (Production)" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Starting iOS production build..." -ForegroundColor Yellow
    eas build --platform ios --profile production --non-interactive
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ iOS build failed!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ iOS build completed successfully!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "⏭️  Skipping iOS build (--SkipIOS flag set)" -ForegroundColor Yellow
}

# Upload iOS to App Store Connect
if (-not $SkipUpload -and -not $SkipIOS) {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host "📤 UPLOADING iOS TO APP STORE CONNECT" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Uploading latest iOS build to App Store Connect..." -ForegroundColor Yellow
    eas submit --platform ios --latest --non-interactive
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ iOS upload failed!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ iOS build uploaded to App Store Connect successfully!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "⏭️  Skipping iOS upload (--SkipUpload flag set or iOS build skipped)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ ALL BUILDS COMPLETED SUCCESSFULLY!" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

