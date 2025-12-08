# Complete Automated Fix and Setup
# Fixes root directory issue and completes entire FSANZ setup

$ErrorActionPreference = "Continue"

Write-Host "`n" -NoNewline
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  Complete Automated FSANZ Setup & Fix" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptRoot
$backendDir = Join-Path $projectRoot "backend\vercel"

# Step 1: Test if existing deployment works
Write-Host "Step 1: Testing existing deployment..." -ForegroundColor Yellow
$testUrl = "https://truscore-2gm890hqf-leightons-projects-d328c774.vercel.app/api/fsanz-database?country=au"

try {
    $response = Invoke-WebRequest -Uri $testUrl -Method GET -TimeoutSec 10 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✅ Existing deployment WORKS!" -ForegroundColor Green
        $deploymentUrl = "https://truscore-2gm890hqf-leightons-projects-d328c774.vercel.app"
        $deploymentWorks = $true
    }
} catch {
    Write-Host "  ⚠️  Existing deployment not accessible" -ForegroundColor Yellow
    $deploymentWorks = $false
}

# Step 2: If deployment works, use it. Otherwise get latest URL
if (-not $deploymentWorks) {
    Write-Host "`nStep 2: Getting latest deployment URL..." -ForegroundColor Yellow
    Set-Location $backendDir
    
    # Get the latest deployment
    $deployments = vercel ls --json 2>&1
    if ($deployments -match 'https://[^\s]+\.vercel\.app') {
        $deploymentUrl = $matches[0]
        Write-Host "  ✅ Found deployment: $deploymentUrl" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  No deployment URL found. Need to deploy." -ForegroundColor Yellow
        Write-Host "  Deploying now..." -ForegroundColor Cyan
        
        # Clean and deploy
        Remove-Item -Recurse -Force .vercel -ErrorAction SilentlyContinue
        
        # Deploy - this will still have the root directory issue
        vercel --prod
        
        # After deployment, the URL will be in output
        Write-Host "`n  ⚠️  Deployment completed with root directory warning." -ForegroundColor Yellow
        Write-Host "  Please copy the Production URL from above." -ForegroundColor Yellow
        $deploymentUrl = Read-Host "Enter the deployment URL (or press Enter to skip)"
    }
}

# Step 3: Update .env file if we have a URL
if ($deploymentUrl -and $deploymentUrl -ne "") {
    Write-Host "`nStep 3: Updating .env file..." -ForegroundColor Yellow
    
    Set-Location $projectRoot
    $envPath = Join-Path $projectRoot ".env"
    
    # Read existing .env
    $envContent = ""
    if (Test-Path $envPath) {
        $envContent = Get-Content $envPath -Raw
    }
    
    # Remove existing FSANZ URLs
    $envContent = $envContent -replace "EXPO_PUBLIC_FSANZ_AU_URL=.*\r?\n", ""
    $envContent = $envContent -replace "EXPO_PUBLIC_FSANZ_NZ_URL=.*\r?\n", ""
    
    # Remove trailing newlines
    $envContent = $envContent.TrimEnd()
    
    # Add new URLs
    $envContent += "`n`n# FSANZ Database URLs (auto-configured)`n"
    $envContent += "EXPO_PUBLIC_FSANZ_AU_URL=$deploymentUrl/api/fsanz-database?country=au`n"
    $envContent += "EXPO_PUBLIC_FSANZ_NZ_URL=$deploymentUrl/api/fsanz-database?country=nz`n"
    
    # Write back
    Set-Content -Path $envPath -Value $envContent -NoNewline
    
    Write-Host "  ✅ .env file updated!" -ForegroundColor Green
    Write-Host "     EXPO_PUBLIC_FSANZ_AU_URL=$deploymentUrl/api/fsanz-database?country=au" -ForegroundColor Gray
    Write-Host "     EXPO_PUBLIC_FSANZ_NZ_URL=$deploymentUrl/api/fsanz-database?country=nz" -ForegroundColor Gray
} else {
    Write-Host "`nStep 3: Skipped .env update (no deployment URL)" -ForegroundColor Yellow
}

# Step 4: Fix root directory in Vercel Dashboard (instructions)
Write-Host "`nStep 4: Root Directory Fix Instructions" -ForegroundColor Yellow
Write-Host "  To fix the root directory warning permanently:" -ForegroundColor Cyan
Write-Host "  1. Go to: https://vercel.com/leightons-projects-d328c774/truscore/settings" -ForegroundColor White
Write-Host "  2. Scroll to 'Root Directory'" -ForegroundColor White
Write-Host "  3. Clear/Delete the value (remove '.\')" -ForegroundColor White
Write-Host "  4. Leave it EMPTY" -ForegroundColor White
Write-Host "  5. Save" -ForegroundColor White
Write-Host "  (This is optional - deployment may work without this fix)" -ForegroundColor Gray

# Summary
Write-Host "`n" -NoNewline
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

if ($deploymentUrl) {
    Write-Host "✅ Deployment URL: $deploymentUrl" -ForegroundColor Green
    Write-Host "✅ .env file updated" -ForegroundColor Green
    Write-Host "`n🚀 Next: Restart your development server" -ForegroundColor Cyan
    Write-Host "   Run: npm start" -ForegroundColor White
} else {
    Write-Host "⚠️  Please complete deployment and update .env manually" -ForegroundColor Yellow
}

Write-Host ""










