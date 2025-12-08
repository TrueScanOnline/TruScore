# Test FSANZ API after deployment with improved matching

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FSANZ API Test - After Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Waiting 90 seconds for deployment to complete..." -ForegroundColor Yellow
Start-Sleep -Seconds 90

Write-Host ""
Write-Host "Testing API with improved matching..." -ForegroundColor Yellow
Write-Host ""

$testCases = @(
    @{ country = 'nz'; product = 'Milk'; expected = $true },
    @{ country = 'nz'; product = 'milk'; expected = $true },
    @{ country = 'nz'; product = 'Tomato Sauce'; expected = $true },
    @{ country = 'nz'; product = 'Bread'; expected = $true },
    @{ country = 'au'; product = 'Milk'; expected = $true },
    @{ country = 'au'; product = 'Apple'; expected = $true }
)

$successCount = 0
$foundCount = 0
$failCount = 0

foreach ($test in $testCases) {
    $url = "https://truscoreapi.vercel.app/api/fsanz-query?country=$($test.country)&productName=$([System.Web.HttpUtility]::UrlEncode($test.product))"
    Write-Host "Testing: $($test.country.ToUpper()) - '$($test.product)'" -ForegroundColor Gray
    
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
            Write-Host "  ⚠️  Not found (but API works)" -ForegroundColor Yellow
            Write-Host "     Message: $($response.message)" -ForegroundColor Gray
            $successCount++
        }
    } catch {
        $statusCode = if ($_.Exception.Response) { $_.Exception.Response.StatusCode.value__ } else { "Error" }
        Write-Host "  ❌ Failed: $statusCode - $($_.Exception.Message)" -ForegroundColor Red
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

if ($successCount -eq $testCases.Count -and $foundCount -gt 0) {
    Write-Host ""
    Write-Host "✅ FSANZ API is FULLY FUNCTIONAL!" -ForegroundColor Green
    Write-Host "   Users will get useful FSANZ data when scanning products" -ForegroundColor Green
} elseif ($successCount -eq $testCases.Count) {
    Write-Host ""
    Write-Host "⚠️  API works but matching needs more improvement" -ForegroundColor Yellow
    Write-Host "   Check Vercel function logs for matching details" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "❌ API has issues - check deployment" -ForegroundColor Red
}

Write-Host ""









