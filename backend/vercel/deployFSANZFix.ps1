# Deploy FSANZ Query API with Fixed Matching Algorithm
# This script deploys the updated fsanz-query.ts endpoint to Vercel

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deploying FSANZ Query API to Vercel" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to vercel directory
Set-Location $PSScriptRoot

Write-Host "Current directory: $(Get-Location)" -ForegroundColor Gray
Write-Host ""

# Check if vercel CLI is available
Write-Host "Checking for Vercel CLI..." -ForegroundColor Yellow
try {
    $vercelVersion = npx vercel --version 2>&1
    Write-Host "✅ Vercel CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g vercel
}

Write-Host ""
Write-Host "Deploying to production..." -ForegroundColor Yellow
Write-Host ""

# Deploy to production
# Note: This will prompt for authentication if not already logged in
npx vercel --prod

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Wait 90 seconds for deployment to complete" -ForegroundColor White
Write-Host "2. Run the test script: .\scripts\testFSANZComplete.ps1" -ForegroundColor White
Write-Host "3. Verify that NZ and AU queries return accurate matches" -ForegroundColor White
Write-Host ""
