# Complete FSANZ Database Deployment Script
# This script completes the entire FSANZ setup process

Write-Host "`n" -NoNewline
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  FSANZ Database - Complete Deployment Setup" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Vercel CLI
Write-Host "Step 1: Checking Vercel CLI..." -ForegroundColor Yellow
try {
    $vercelVersion = vercel --version 2>&1
    Write-Host "  ✅ Vercel CLI found: $vercelVersion" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Vercel CLI not found. Installing..." -ForegroundColor Red
    npm install -g vercel
}

# Step 2: Check Vercel login status
Write-Host "`nStep 2: Checking Vercel login status..." -ForegroundColor Yellow
$loginCheck = vercel whoami 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "  ⚠️  Not logged in to Vercel" -ForegroundColor Yellow
    Write-Host "  📝 Please log in to Vercel..." -ForegroundColor Cyan
    Write-Host "     Run: vercel login" -ForegroundColor White
    Write-Host "     Then press Enter here after logging in..." -ForegroundColor White
    Read-Host "Press Enter after logging in to Vercel"
} else {
    Write-Host "  ✅ Logged in as: $loginCheck" -ForegroundColor Green
}

# Step 3: Deploy to Vercel
Write-Host "`nStep 3: Deploying to Vercel..." -ForegroundColor Yellow
Write-Host "  📦 This may take a few minutes..." -ForegroundColor Cyan

Set-Location "$PSScriptRoot\..\backend\vercel"

# Deploy to production
$deployOutput = vercel --prod --yes 2>&1 | Out-String

# Extract deployment URL from output
$deploymentUrl = $null
if ($deployOutput -match 'https://[^\s]+\.vercel\.app') {
    $deploymentUrl = $matches[0]
    Write-Host "  ✅ Deployment successful!" -ForegroundColor Green
    Write-Host "  🌐 Deployment URL: $deploymentUrl" -ForegroundColor Cyan
} else {
    Write-Host "  ⚠️  Could not extract deployment URL from output" -ForegroundColor Yellow
    Write-Host "  Please check the output above for the deployment URL" -ForegroundColor Yellow
    $deploymentUrl = Read-Host "Enter your Vercel deployment URL"
}

Set-Location "$PSScriptRoot\.."

# Step 4: Update .env file
if ($deploymentUrl) {
    Write-Host "`nStep 4: Updating .env file..." -ForegroundColor Yellow
    
    $envPath = Join-Path $PSScriptRoot "..\.env"
    
    # Check if .env exists
    if (-not (Test-Path $envPath)) {
        Write-Host "  📝 Creating .env file..." -ForegroundColor Cyan
        New-Item -Path $envPath -ItemType File | Out-Null
    }
    
    # Read existing .env content
    $envContent = ""
    if (Test-Path $envPath) {
        $envContent = Get-Content $envPath -Raw
    }
    
    # Remove existing FSANZ URLs
    $envContent = $envContent -replace "EXPO_PUBLIC_FSANZ_AU_URL=.*\r?\n", ""
    $envContent = $envContent -replace "EXPO_PUBLIC_FSANZ_NZ_URL=.*\r?\n", ""
    
    # Add new FSANZ URLs
    $envContent += "`n# FSANZ Database URLs (auto-configured)`n"
    $envContent += "EXPO_PUBLIC_FSANZ_AU_URL=$deploymentUrl/api/fsanz-database?country=au`n"
    $envContent += "EXPO_PUBLIC_FSANZ_NZ_URL=$deploymentUrl/api/fsanz-database?country=nz`n"
    
    # Write back to .env
    Set-Content -Path $envPath -Value $envContent -NoNewline
    
    Write-Host "  ✅ .env file updated!" -ForegroundColor Green
    Write-Host "     EXPO_PUBLIC_FSANZ_AU_URL=$deploymentUrl/api/fsanz-database?country=au" -ForegroundColor Gray
    Write-Host "     EXPO_PUBLIC_FSANZ_NZ_URL=$deploymentUrl/api/fsanz-database?country=nz" -ForegroundColor Gray
}

# Step 5: Verify setup
Write-Host "`nStep 5: Verifying setup..." -ForegroundColor Yellow

$checks = @(
    @{ Name = "AU JSON file"; Path = "data\fsanz-au.json" },
    @{ Name = "NZ JSON file"; Path = "data\fsanz-nz.json" },
    @{ Name = "Vercel backend AU file"; Path = "backend\vercel\data\fsanz-au.json" },
    @{ Name = "Vercel backend NZ file"; Path = "backend\vercel\data\fsanz-nz.json" },
    @{ Name = ".env file"; Path = ".env" }
)

$allGood = $true
foreach ($check in $checks) {
    $fullPath = Join-Path $PSScriptRoot "..\$($check.Path)"
    if (Test-Path $fullPath) {
        Write-Host "  ✅ $($check.Name) exists" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $($check.Name) missing" -ForegroundColor Red
        $allGood = $false
    }
}

# Summary
Write-Host "`n" -NoNewline
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

if ($allGood) {
    Write-Host "✅ All files are in place!" -ForegroundColor Green
    Write-Host "✅ Vercel deployment: $deploymentUrl" -ForegroundColor Green
    Write-Host "✅ Environment variables configured" -ForegroundColor Green
    Write-Host "`n🚀 Next step: Restart your development server" -ForegroundColor Cyan
    Write-Host "   Run: npm start" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "⚠️  Some files are missing. Please check the errors above." -ForegroundColor Yellow
    Write-Host ""
}










