# Create New Vercel Project - Bypass Root Directory Issue
# This creates a fresh project without the root directory problem

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Create New Vercel Project" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "This will create a NEW Vercel project to bypass the root directory issue." -ForegroundColor Yellow
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
Write-Host "Removing old Vercel configuration..." -ForegroundColor Cyan
if (Test-Path ".vercel") {
    Remove-Item -Recurse -Force .vercel -ErrorAction SilentlyContinue
    Write-Host "✅ Removed old configuration" -ForegroundColor Green
} else {
    Write-Host "✅ No old configuration found" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "IMPORTANT: When prompted:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. 'Link to existing project?' → NO" -ForegroundColor Red
Write-Host "2. 'What's your project's name?' → truscore-api" -ForegroundColor White
Write-Host "3. 'In which directory is your code located?' → Press Enter" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to start deployment..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host ""
Write-Host "Deploying..." -ForegroundColor Green
Write-Host ""

# Deploy
vercel --prod

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "After Deployment:" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Copy the deployment URL shown above" -ForegroundColor White
Write-Host "2. Update .env file with new URLs:" -ForegroundColor White
Write-Host "   EXPO_PUBLIC_FSANZ_NZ_URL=https://new-url.vercel.app/api/fsanz-database?country=nz" -ForegroundColor Gray
Write-Host "   EXPO_PUBLIC_FSANZ_AU_URL=https://new-url.vercel.app/api/fsanz-database?country=au" -ForegroundColor Gray
Write-Host "3. Test endpoint in browser" -ForegroundColor White
Write-Host "4. Restart app - FSANZ will auto-download!" -ForegroundColor White
Write-Host ""
