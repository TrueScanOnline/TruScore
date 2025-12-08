# Deploy as Fresh Project - Bypass Root Directory Issue
# This creates a NEW Vercel project to avoid root directory conflicts

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deploy as Fresh Vercel Project" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "This will create a NEW Vercel project to avoid root directory issues." -ForegroundColor Yellow
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "api\fsanz-database.ts")) {
    Write-Host "❌ Error: Must run from backend\vercel directory" -ForegroundColor Red
    Write-Host "   Current: $(Get-Location)" -ForegroundColor Yellow
    Write-Host "   Run: cd backend\vercel" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Found FSANZ endpoint files" -ForegroundColor Green
Write-Host ""

# Remove old .vercel folder
if (Test-Path ".vercel") {
    Write-Host "Removing old .vercel configuration..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force .vercel
    Write-Host "✅ Removed old configuration" -ForegroundColor Green
    Write-Host ""
}

Write-Host "Ready to create new project!" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT: When asked 'Link to existing project?' → Answer: NO" -ForegroundColor Red
Write-Host ""
Write-Host "Project name suggestion: truscore-api" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Enter to start deployment..." -ForegroundColor Yellow
Read-Host

Write-Host ""
Write-Host "Deploying..." -ForegroundColor Cyan
Write-Host ""

vercel --prod

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "After Deployment:" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Copy the deployment URL shown above" -ForegroundColor White
Write-Host "2. Update .env file with new URLs:" -ForegroundColor White
Write-Host "   EXPO_PUBLIC_FSANZ_NZ_URL=https://your-new-url.vercel.app/api/fsanz-database?country=nz" -ForegroundColor Gray
Write-Host "   EXPO_PUBLIC_FSANZ_AU_URL=https://your-new-url.vercel.app/api/fsanz-database?country=au" -ForegroundColor Gray
Write-Host "3. Test endpoint in browser" -ForegroundColor White
Write-Host "4. Restart app - FSANZ will auto-download!" -ForegroundColor White
Write-Host ""
