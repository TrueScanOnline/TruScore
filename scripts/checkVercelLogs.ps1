# Guide to check Vercel logs for FSANZ debugging

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Vercel Logs Check Guide" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "To check Vercel function logs:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Open Vercel Dashboard:" -ForegroundColor Cyan
Write-Host "   https://vercel.com/leightons-projects-d328c774/truscoreapi" -ForegroundColor White
Write-Host ""
Write-Host "2. Click on the latest deployment" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Go to 'Functions' tab" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Click on 'api/fsanz-query'" -ForegroundColor Cyan
Write-Host ""
Write-Host "5. Check 'Logs' tab" -ForegroundColor Cyan
Write-Host ""
Write-Host "6. Look for these log entries:" -ForegroundColor Yellow
Write-Host "   - [FSANZ-QUERY] Database loaded: X foods" -ForegroundColor Gray
Write-Host "   - [FSANZ-QUERY] Sample entry keys: ..." -ForegroundColor Gray
Write-Host "   - [FSANZ-QUERY] Direct contains search for 'milk': X matches" -ForegroundColor Gray
Write-Host "   - [MATCH] Database size: X, checking first 10 entries..." -ForegroundColor Gray
Write-Host "   - [MATCH] Entry 0: foodName='...', foodNameLower='...'" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test API First" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Run this to generate logs:" -ForegroundColor Yellow
Write-Host "  Invoke-RestMethod -Uri 'https://truscoreapi.vercel.app/api/fsanz-query?country=nz&productName=Milk'" -ForegroundColor White
Write-Host ""

Write-Host "Then check Vercel logs (see above)" -ForegroundColor Yellow
Write-Host ""











