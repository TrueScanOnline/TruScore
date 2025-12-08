# Redeploy Backend Script
# Redeploys the backend with existing environment variables

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Redeploying Backend" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Vercel CLI is installed
if (!(Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Vercel CLI not found. Please install: npm install -g vercel" -ForegroundColor Red
    exit 1
}

# Navigate to backend directory
$backendPath = Join-Path $PSScriptRoot "..\backend\vercel"
if (!(Test-Path $backendPath)) {
    Write-Host "❌ Backend directory not found: $backendPath" -ForegroundColor Red
    exit 1
}

Push-Location $backendPath
Write-Host "Deploying from: $backendPath" -ForegroundColor Gray
Write-Host ""

# Check if project is linked
Write-Host "Step 1: Checking project link..." -ForegroundColor Yellow
$linkCheck = vercel ls 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Project not linked. Linking now..." -ForegroundColor Yellow
    Write-Host "   You'll be prompted to select your project (truscoreapi)" -ForegroundColor Gray
    vercel link --yes
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to link project" -ForegroundColor Red
        Pop-Location
        exit 1
    }
}
Write-Host "✅ Project is linked" -ForegroundColor Green
Write-Host ""

# Deploy
Write-Host "Step 2: Deploying to production..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Gray
Write-Host ""

# Use --yes to avoid prompts
$deployOutput = vercel --prod --yes 2>&1
$deployExit = $LASTEXITCODE

Pop-Location

if ($deployExit -eq 0) {
    Write-Host ""
    Write-Host "✅ Backend redeployed successfully!" -ForegroundColor Green
    Write-Host ""
    
    # Extract deployment URL
    $urlMatch = $deployOutput | Select-String -Pattern "https://[^\s]+\.vercel\.app"
    if ($urlMatch) {
        $deploymentUrl = $urlMatch.Matches[0].Value
        Write-Host "Deployment URL: $deploymentUrl" -ForegroundColor Cyan
        Write-Host ""
    }
    
    # Show deployment output
    Write-Host "Deployment Summary:" -ForegroundColor Yellow
    $deployOutput | Select-String -Pattern "(Production|Deployment|Ready)" | ForEach-Object {
        Write-Host $_.Line -ForegroundColor Gray
    }
} else {
    Write-Host ""
    Write-Host "⚠️  Deployment had issues" -ForegroundColor Yellow
    Write-Host "Full output:" -ForegroundColor Gray
    Write-Host $deployOutput -ForegroundColor Gray
}

Write-Host ""

# Verify
Write-Host "Step 3: Verifying configuration..." -ForegroundColor Yellow
Write-Host ""
Push-Location (Join-Path $PSScriptRoot "..")
npm run verify-backend
Pop-Location

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Redeployment Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""



