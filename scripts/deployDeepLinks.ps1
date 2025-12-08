# Deploy Deep Links to Vercel - Automated Script
# This script deploys all deep link configuration files to Vercel

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deploying Deep Links to Vercel" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to Vercel backend directory
$vercelDir = Join-Path $PSScriptRoot "..\backend\vercel"
if (-not (Test-Path $vercelDir)) {
    Write-Host "❌ Error: Vercel backend directory not found at: $vercelDir" -ForegroundColor Red
    exit 1
}

Write-Host "Changing to Vercel directory: $vercelDir" -ForegroundColor Yellow
Set-Location $vercelDir

# Check if vercel CLI is installed
Write-Host "Checking for Vercel CLI..." -ForegroundColor Yellow
$vercelCheck = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelCheck) {
    Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Red
    npm install -g vercel
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install Vercel CLI" -ForegroundColor Red
        exit 1
    }
}

# Check if logged in
Write-Host "Checking Vercel login status..." -ForegroundColor Yellow
$whoami = vercel whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠ Not logged in to Vercel. Please log in:" -ForegroundColor Yellow
    Write-Host "  vercel login" -ForegroundColor Gray
    Write-Host ""
    $login = Read-Host "Login now? (y/n)"
    if ($login -eq 'y' -or $login -eq 'Y') {
        vercel login
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Login failed" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "❌ Cannot deploy without logging in" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✓ Logged in as: $whoami" -ForegroundColor Green
}

Write-Host ""
Write-Host "Deploying to Vercel (production)..." -ForegroundColor Yellow
Write-Host "This will deploy:" -ForegroundColor White
Write-Host "  - /.well-known/apple-app-site-association (iOS)" -ForegroundColor Gray
Write-Host "  - /.well-known/assetlinks.json (Android)" -ForegroundColor Gray
Write-Host "  - /barcode/:barcode (Redirect page)" -ForegroundColor Gray
Write-Host ""

# Deploy to production
vercel --prod

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✓ Deployment Successful!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your deep links are now live at:" -ForegroundColor White
    Write-Host "  - iOS AASA: https://truescan.app/.well-known/apple-app-site-association" -ForegroundColor Cyan
    Write-Host "  - Android Asset Links: https://truescan.app/.well-known/assetlinks.json" -ForegroundColor Cyan
    Write-Host "  - Barcode Redirect: https://truescan.app/barcode/{barcode}" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "⚠ Important: Make sure your domain (truescan.app) is configured in Vercel!" -ForegroundColor Yellow
    Write-Host "  1. Go to Vercel Dashboard → Your Project → Settings → Domains" -ForegroundColor Gray
    Write-Host "  2. Add 'truescan.app' as a domain" -ForegroundColor Gray
    Write-Host "  3. Update DNS records as instructed" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed. Check the error messages above." -ForegroundColor Red
    exit 1
}
