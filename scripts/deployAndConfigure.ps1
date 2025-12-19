# Complete FSANZ Deployment and Configuration Script
# This script guides you through deployment and automatically configures .env

Write-Host "`n" -NoNewline
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  FSANZ Database - Complete Deployment" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Verify login
Write-Host "Step 1: Checking Vercel login..." -ForegroundColor Yellow
$whoami = vercel whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ❌ Not logged in to Vercel" -ForegroundColor Red
    Write-Host "  Please run: vercel login" -ForegroundColor Yellow
    exit 1
}
Write-Host "  ✅ Logged in as: $whoami" -ForegroundColor Green

# Step 2: Ensure data files are in place
Write-Host "`nStep 2: Checking data files..." -ForegroundColor Yellow
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptRoot

if (-not (Test-Path "$projectRoot\backend\vercel\data")) {
    New-Item -ItemType Directory -Path "$projectRoot\backend\vercel\data" -Force | Out-Null
    Write-Host "  ✅ Created data directory" -ForegroundColor Green
}

if (Test-Path "$projectRoot\data\fsanz-au.json") {
    Copy-Item "$projectRoot\data\fsanz-au.json" "$projectRoot\backend\vercel\data\" -Force -ErrorAction SilentlyContinue
    Write-Host "  ✅ Copied AU database file" -ForegroundColor Green
}

if (Test-Path "$projectRoot\data\fsanz-nz.json") {
    Copy-Item "$projectRoot\data\fsanz-nz.json" "$projectRoot\backend\vercel\data\" -Force -ErrorAction SilentlyContinue
    Write-Host "  ✅ Copied NZ database file" -ForegroundColor Green
}

# Step 3: Deploy to Vercel
Write-Host "`nStep 3: Deploying to Vercel..." -ForegroundColor Yellow
Write-Host "  This may take a few minutes..." -ForegroundColor Cyan
Write-Host "  Look for the deployment URL in the output below" -ForegroundColor Cyan
Write-Host ""

Set-Location "$projectRoot\backend\vercel"

# Run deployment
Write-Host "Running: vercel --prod" -ForegroundColor White
Write-Host "  (This will show output below - look for the deployment URL)" -ForegroundColor Gray
Write-Host ""

vercel --prod

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  Deployment Complete!" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Step 4: Get deployment URL
$deploymentUrl = Read-Host "Enter your Vercel deployment URL (e.g., https://truescan-backend.vercel.app)"

if ([string]::IsNullOrWhiteSpace($deploymentUrl)) {
    Write-Host "  ⚠️  No URL provided. Skipping .env update." -ForegroundColor Yellow
    Write-Host "  You can update .env manually later." -ForegroundColor Yellow
    Set-Location $projectRoot
    exit 0
}

# Remove trailing slash
$deploymentUrl = $deploymentUrl.TrimEnd('/')

# Step 5: Update .env file
Write-Host "`nStep 4: Updating .env file..." -ForegroundColor Yellow

Set-Location $projectRoot

$envPath = Join-Path $projectRoot ".env"

# Read existing .env content
$envContent = ""
if (Test-Path $envPath) {
    $envContent = Get-Content $envPath -Raw
} else {
    $envContent = ""
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
Write-Host ""
Write-Host "Added URLs:" -ForegroundColor Cyan
Write-Host "  EXPO_PUBLIC_FSANZ_AU_URL=$deploymentUrl/api/fsanz-database?country=au" -ForegroundColor Gray
Write-Host "  EXPO_PUBLIC_FSANZ_NZ_URL=$deploymentUrl/api/fsanz-database?country=nz" -ForegroundColor Gray

# Summary
Write-Host "`n" -NoNewline
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Vercel deployment: $deploymentUrl" -ForegroundColor Green
Write-Host "✅ Environment variables configured" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Next step: Restart your development server" -ForegroundColor Cyan
Write-Host "   Run: npm start" -ForegroundColor White
Write-Host ""

















