# Auto-Deploy Deep Links - Fully Automated Script
# This script automatically deploys all deep link configuration to Vercel

param(
    [string]$AppleTeamId = "",
    [string]$AndroidFingerprint = "",
    [string]$AppStoreId = ""
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Auto-Deploy Deep Links to Vercel" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to project root
$projectRoot = Split-Path -Parent $PSScriptRoot
$vercelDir = Join-Path $projectRoot "backend\vercel"

if (-not (Test-Path $vercelDir)) {
    Write-Host "❌ Error: Vercel backend directory not found" -ForegroundColor Red
    exit 1
}

Set-Location $vercelDir

# Check Vercel CLI
Write-Host "[1/5] Checking Vercel CLI..." -ForegroundColor Yellow
$vercelCheck = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelCheck) {
    Write-Host "   Installing Vercel CLI..." -ForegroundColor Gray
    npm install -g vercel 2>&1 | Out-Null
}

# Check login
Write-Host "[2/5] Checking Vercel login..." -ForegroundColor Yellow
$whoami = vercel whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ⚠ Not logged in. Please run: vercel login" -ForegroundColor Yellow
    exit 1
}
Write-Host "   ✓ Logged in" -ForegroundColor Green

# Set environment variables if provided
if ($AppleTeamId -or $AndroidFingerprint -or $AppStoreId) {
    Write-Host "[3/5] Setting environment variables..." -ForegroundColor Yellow
    
    if ($AppleTeamId) {
        Write-Host "   Setting APPLE_TEAM_ID..." -ForegroundColor Gray
        echo $AppleTeamId | vercel env add APPLE_TEAM_ID production 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✓ APPLE_TEAM_ID set" -ForegroundColor Green
        }
    }
    
    if ($AndroidFingerprint) {
        Write-Host "   Setting ANDROID_SHA256_FINGERPRINT..." -ForegroundColor Gray
        echo $AndroidFingerprint | vercel env add ANDROID_SHA256_FINGERPRINT production 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✓ ANDROID_SHA256_FINGERPRINT set" -ForegroundColor Green
        }
    }
    
    if ($AppStoreId) {
        Write-Host "   Setting APP_STORE_ID..." -ForegroundColor Gray
        echo $AppStoreId | vercel env add APP_STORE_ID production 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✓ APP_STORE_ID set" -ForegroundColor Green
        }
    }
} else {
    Write-Host "[3/5] Skipping environment variables (not provided)" -ForegroundColor Yellow
    Write-Host "   ⚠ You can set them later with:" -ForegroundColor Yellow
    Write-Host "     vercel env add APPLE_TEAM_ID production" -ForegroundColor Gray
    Write-Host "     vercel env add ANDROID_SHA256_FINGERPRINT production" -ForegroundColor Gray
    Write-Host "     vercel env add APP_STORE_ID production" -ForegroundColor Gray
}

# Deploy
Write-Host "[4/5] Deploying to Vercel..." -ForegroundColor Yellow
$deployOutput = vercel --prod --yes 2>&1
$deploySuccess = $LASTEXITCODE -eq 0

if ($deploySuccess) {
    Write-Host "   ✓ Deployment successful!" -ForegroundColor Green
    
    # Extract deployment URL
    $urlMatch = $deployOutput | Select-String -Pattern "https://[^\s]+"
    if ($urlMatch) {
        $deployUrl = $urlMatch.Matches[0].Value
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "✓ Deep Links Deployed Successfully!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Deployment URL: $deployUrl" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Your deep links are now available at:" -ForegroundColor White
        Write-Host "  • iOS AASA: $deployUrl/.well-known/apple-app-site-association" -ForegroundColor Cyan
        Write-Host "  • Android Asset Links: $deployUrl/.well-known/assetlinks.json" -ForegroundColor Cyan
        Write-Host "  • Barcode Redirect: $deployUrl/barcode/{barcode}" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "⚠ Next Steps:" -ForegroundColor Yellow
        Write-Host "  1. Configure domain 'truescan.app' in Vercel Dashboard" -ForegroundColor Gray
        Write-Host "  2. Update DNS records as instructed by Vercel" -ForegroundColor Gray
        Write-Host "  3. Set environment variables if not already set:" -ForegroundColor Gray
        Write-Host "     - APPLE_TEAM_ID (from Apple Developer account)" -ForegroundColor Gray
        Write-Host "     - ANDROID_SHA256_FINGERPRINT (from keystore)" -ForegroundColor Gray
        Write-Host "     - APP_STORE_ID (after app is published)" -ForegroundColor Gray
    }
} else {
    Write-Host "   ❌ Deployment failed" -ForegroundColor Red
    Write-Host $deployOutput -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[5/5] ✓ Complete!" -ForegroundColor Green
