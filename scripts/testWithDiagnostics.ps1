# Test FSANZ API with diagnostic information

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FSANZ API Test with Diagnostics" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Waiting 90 seconds for deployment..." -ForegroundColor Yellow
Start-Sleep -Seconds 90

Write-Host ""
Write-Host "Testing NZ - 'Milk'..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "https://truscoreapi.vercel.app/api/fsanz-query?country=nz&productName=Milk" -TimeoutSec 30 -ErrorAction Stop
    
    Write-Host "Response:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5
    
    if ($response.diagnostic) {
        Write-Host ""
        Write-Host "Diagnostic Information:" -ForegroundColor Cyan
        Write-Host "  Database Size: $($response.diagnostic.databaseSize)" -ForegroundColor White
        Write-Host "  Direct Contains Matches: $($response.diagnostic.directContainsMatches)" -ForegroundColor White
        if ($response.diagnostic.firstMatch) {
            Write-Host "  First Match: $($response.diagnostic.firstMatch)" -ForegroundColor White
            Write-Host ""
            Write-Host "⚠️  Database HAS matches but matching algorithm failed!" -ForegroundColor Yellow
        } else {
            Write-Host ""
            Write-Host "⚠️  Database has NO matches for 'milk'" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""









