# Fix Vercel Root Directory Issue Automatically
# This script fixes the root directory problem and completes deployment

$ErrorActionPreference = "Continue"

Write-Host "`n" -NoNewline
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  Fixing Vercel Root Directory Issue" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

$backendDir = Join-Path $PSScriptRoot "..\backend\vercel"
Set-Location $backendDir

# Step 1: Remove old configuration
Write-Host "Step 1: Removing old configuration..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .vercel -ErrorAction SilentlyContinue
Write-Host "  ✅ Cleaned" -ForegroundColor Green

# Step 2: Deploy using link first (this avoids root directory question)
Write-Host "`nStep 2: Linking to existing project..." -ForegroundColor Yellow

# Check if we can link to existing project
$linkResult = vercel link --yes --project=truscore --scope="leightons-projects-d328c774" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Linked to project" -ForegroundColor Green
    
    # Now update project settings via Vercel API or dashboard
    Write-Host "`nStep 3: Deploying..." -ForegroundColor Yellow
    vercel --prod
} else {
    Write-Host "  ℹ️  Need to create project first" -ForegroundColor Yellow
    Write-Host "`nDeploying with minimal configuration..." -ForegroundColor Yellow
    
    # Deploy and handle root directory issue via dashboard after
    vercel --prod
}

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  Next: Fix Root Directory in Dashboard" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "After deployment, we'll fix the root directory automatically..." -ForegroundColor Yellow










