# Deploy FSANZ Endpoint - Workaround for Root Directory Issue
# This deploys from project root to bypass root directory problems

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deploy FSANZ Endpoint - Workaround" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "This workaround deploys from project root to avoid root directory issues." -ForegroundColor Yellow
Write-Host ""

# Check if we're in the right directory
$currentDir = Get-Location
Write-Host "Current directory: $currentDir" -ForegroundColor Gray

if (-not (Test-Path "backend\vercel\api\fsanz-database.ts")) {
    Write-Host "❌ Error: Must run from project root (C:\TrueScan-FoodScanner)" -ForegroundColor Red
    Write-Host "   Current: $currentDir" -ForegroundColor Yellow
    Write-Host "   Expected: C:\TrueScan-FoodScanner" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Found FSANZ endpoint files" -ForegroundColor Green
Write-Host ""

Write-Host "Option 1: Try deploying from backend/vercel with --cwd flag" -ForegroundColor Cyan
Write-Host "   cd backend\vercel" -ForegroundColor White
Write-Host "   vercel --prod --cwd ." -ForegroundColor White
Write-Host ""

Write-Host "Option 2: Remove root directory in Vercel Dashboard FIRST" -ForegroundColor Cyan
Write-Host "   1. Go to: https://vercel.com/leightons-projects-d328c774/truscore/settings" -ForegroundColor White
Write-Host "   2. General tab → Root Directory" -ForegroundColor White
Write-Host "   3. DELETE the value (make it empty)" -ForegroundColor White
Write-Host "   4. Save" -ForegroundColor White
Write-Host "   5. Then run: cd backend\vercel && vercel --prod" -ForegroundColor White
Write-Host ""

Write-Host "Option 3: Create new project with different name" -ForegroundColor Cyan
Write-Host "   cd backend\vercel" -ForegroundColor White
Write-Host "   vercel --prod" -ForegroundColor White
Write-Host "   When asked 'Link to existing project?' → NO" -ForegroundColor White
Write-Host "   Project name: truscore-api" -ForegroundColor White
Write-Host "   Then update .env URLs" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Which option? (1/2/3) or press Enter to try Option 1"

if ($choice -eq "2") {
    Write-Host ""
    Write-Host "Please remove root directory in dashboard first, then run:" -ForegroundColor Yellow
    Write-Host "   cd backend\vercel" -ForegroundColor Cyan
    Write-Host "   vercel --prod" -ForegroundColor Cyan
} elseif ($choice -eq "3") {
    Write-Host ""
    Write-Host "Creating new project..." -ForegroundColor Yellow
    Write-Host "Run: cd backend\vercel && vercel --prod" -ForegroundColor Cyan
    Write-Host "Answer 'no' to linking existing project" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "Trying Option 1..." -ForegroundColor Yellow
    Set-Location backend\vercel
    Write-Host "Running: vercel --prod" -ForegroundColor Cyan
    vercel --prod
}

