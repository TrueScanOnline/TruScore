# Fix Vercel Root Directory Issue
# This script helps remove the incorrect root directory setting

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fix Vercel Root Directory" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "The error indicates Vercel has a root directory setting that's incorrect." -ForegroundColor Yellow
Write-Host ""
Write-Host "SOLUTION: Remove Root Directory in Vercel Dashboard" -ForegroundColor Green
Write-Host ""
Write-Host "1. Go to: https://vercel.com/leightons-projects-d328c774/truscore/settings" -ForegroundColor White
Write-Host "2. Click 'General' tab" -ForegroundColor White
Write-Host "3. Find 'Root Directory' setting" -ForegroundColor White
Write-Host "4. CLEAR/REMOVE the value (set to empty)" -ForegroundColor White
Write-Host "5. Click 'Save'" -ForegroundColor White
Write-Host "6. Come back here and run: vercel --prod" -ForegroundColor White
Write-Host ""

Write-Host "Alternative: Try updating via CLI..." -ForegroundColor Yellow
Write-Host ""

# Try to get project info
try {
    Write-Host "Checking project settings..." -ForegroundColor Cyan
    $projectInfo = vercel project ls 2>&1
    Write-Host $projectInfo
    
    Write-Host ""
    Write-Host "⚠️  Root directory must be removed in Vercel Dashboard" -ForegroundColor Yellow
    Write-Host "   CLI cannot directly modify root directory setting" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "After removing in dashboard, run:" -ForegroundColor Green
    Write-Host "   vercel --prod" -ForegroundColor White
    
} catch {
    Write-Host "Error checking project: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please use Vercel Dashboard to fix:" -ForegroundColor Yellow
    Write-Host "https://vercel.com/leightons-projects-d328c774/truscore/settings" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

