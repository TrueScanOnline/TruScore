# Remove Vercel Root Directory Setting
# This script helps remove the problematic root directory setting

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Remove Vercel Root Directory Setting" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "The root directory setting in Vercel is causing issues." -ForegroundColor Yellow
Write-Host "You MUST remove it in the Vercel Dashboard - CLI cannot do this directly." -ForegroundColor Red
Write-Host ""

Write-Host "STEP 1: Open Vercel Dashboard" -ForegroundColor Green
Write-Host "   URL: https://vercel.com/leightons-projects-d328c774/truscore/settings" -ForegroundColor Cyan
Write-Host ""

Write-Host "STEP 2: Remove Root Directory" -ForegroundColor Green
Write-Host "   1. Click 'General' tab" -ForegroundColor White
Write-Host "   2. Scroll to 'Root Directory' section" -ForegroundColor White
Write-Host "   3. DELETE the value (make it completely empty/blank)" -ForegroundColor White
Write-Host "   4. DO NOT set it to './' or anything else" -ForegroundColor Red
Write-Host "   5. Click 'Save'" -ForegroundColor White
Write-Host ""

Write-Host "STEP 3: Deploy Again" -ForegroundColor Green
Write-Host "   cd backend\vercel" -ForegroundColor Cyan
Write-Host "   vercel --prod" -ForegroundColor Cyan
Write-Host ""

Write-Host "Alternative: Try using Vercel API..." -ForegroundColor Yellow
Write-Host ""

# Check if we can access Vercel API
try {
    Write-Host "Checking Vercel CLI version..." -ForegroundColor Cyan
    $version = vercel --version
    Write-Host "Vercel CLI: $version" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "⚠️  Root directory must be removed in Dashboard" -ForegroundColor Yellow
    Write-Host "   CLI cannot modify this setting directly" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "After removing in dashboard, deployment will work!" -ForegroundColor Green
    
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "IMPORTANT: Root Directory must be EMPTY, not './'" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Cyan

