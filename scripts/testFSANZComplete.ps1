# Complete FSANZ Test - Verify NZ and AU databases work

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Complete FSANZ Database Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Waiting 90 seconds for deployment..." -ForegroundColor Yellow
Start-Sleep -Seconds 90

Write-Host ""
Write-Host "Testing FSANZ API..." -ForegroundColor Yellow
Write-Host ""

$testCases = @(
    @{ country = 'nz'; product = 'Milk'; description = 'NZ - Milk' },
    @{ country = 'nz'; product = 'Bread'; description = 'NZ - Bread' },
    @{ country = 'nz'; product = 'Tomato Sauce'; description = 'NZ - Tomato Sauce' },
    @{ country = 'au'; product = 'Milk'; description = 'AU - Milk' },
    @{ country = 'au'; product = 'Apple'; description = 'AU - Apple' }
)

$successCount = 0
$foundCount = 0
$failCount = 0

foreach ($test in $testCases) {
    $url = "https://truscoreapi.vercel.app/api/fsanz-query?country=$($test.country)&productName=$([System.Web.HttpUtility]::UrlEncode($test.product))"
    Write-Host "Testing: $($test.description)" -ForegroundColor Gray
    
    try {
        $response = Invoke-RestMethod -Uri $url -Method GET -TimeoutSec 30 -ErrorAction Stop
        
        if ($response.found) {
            Write-Host "  ✅ FOUND: $($response.product.productName)" -ForegroundColor Green
            Write-Host "     Energy: $($response.product.energyKcal) kcal | Source: $($response.source)" -ForegroundColor Gray
            if ($response.fallback) {
                Write-Host "     ⚠️  Used NZFCD fallback" -ForegroundColor Yellow
            }
            $successCount++
            $foundCount++
        } else {
            Write-Host "  ⚠️  Not found" -ForegroundColor Yellow
            Write-Host "     Message: $($response.message)" -ForegroundColor Gray
            if ($response.diagnostic) {
                Write-Host "     Database Size: $($response.diagnostic.databaseSize)" -ForegroundColor Gray
                Write-Host "     Direct Matches: $($response.diagnostic.directContainsMatches)" -ForegroundColor Gray
            }
            $successCount++
        }
    } catch {
        $statusCode = if ($_.Exception.Response) { $_.Exception.Response.StatusCode.value__ } else { "Error" }
        Write-Host "  ❌ Failed: $statusCode" -ForegroundColor Red
        $failCount++
    }
    
    Start-Sleep -Milliseconds 500
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Results" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Total Tests: $($testCases.Count)" -ForegroundColor White
Write-Host "✅ API Successful: $successCount" -ForegroundColor $(if ($successCount -eq $testCases.Count) { "Green" } else { "Yellow" })
Write-Host "✅ Products Found: $foundCount" -ForegroundColor $(if ($foundCount -gt 0) { "Green" } else { "Yellow" })
Write-Host "❌ Failed: $failCount" -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Red" })

Write-Host ""

if ($successCount -eq $testCases.Count -and $foundCount -ge 3) {
    Write-Host "✅ FSANZ API is FULLY FUNCTIONAL!" -ForegroundColor Green
    Write-Host "   NZ and AU users will get FSANZ data for TruScore" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "  1. Test in app by scanning products" -ForegroundColor White
    Write-Host "  2. Verify TruScore uses FSANZ data" -ForegroundColor White
    Write-Host "  3. Check app logs for FSANZ enhancement" -ForegroundColor White
} elseif ($foundCount -gt 0) {
    Write-Host "⚠️  Partial success - some products found" -ForegroundColor Yellow
    Write-Host "   Check Vercel logs for matching issues" -ForegroundColor Yellow
} else {
    Write-Host "❌ API has issues - check deployment and logs" -ForegroundColor Red
}

Write-Host ""









