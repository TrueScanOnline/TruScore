# Final FSANZ Test - Complete Verification

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Final FSANZ API Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "https://truscoreapi.vercel.app/api/fsanz-query"

# Test with products from actual user logs
$testCases = @(
    @{country="nz"; product="Tomato Sauce"; expected=$true},
    @{country="nz"; product="Whole Cranberry Sauce"; expected=$true},
    @{country="nz"; product="Panko Bread Crumbs"; expected=$true},
    @{country="nz"; product="Coconut milk"; expected=$true},
    @{country="nz"; product="Pizza Sauce"; expected=$true},
    @{country="nz"; product="Milk"; expected=$true},
    @{country="nz"; product="Bread"; expected=$true},
    @{country="nz"; product="Tomato"; expected=$true},
    @{country="au"; product="Milk"; expected=$true},
    @{country="au"; product="Apple"; expected=$true}
)

Write-Host "Testing with real product names from user logs..." -ForegroundColor Yellow
Write-Host ""

$successCount = 0
$foundCount = 0
$failCount = 0

foreach ($test in $testCases) {
    $url = "$baseUrl?country=$($test.country)&productName=$([System.Web.HttpUtility]::UrlEncode($test.product))"
    
    Write-Host "Testing: $($test.country.ToUpper()) - '$($test.product)'" -ForegroundColor Gray
    
    try {
        $response = Invoke-WebRequest -Uri $url -Method GET -UseBasicParsing -TimeoutSec 30 -ErrorAction Stop
        
        if ($response.StatusCode -eq 200) {
            $successCount++
            $json = $response.Content | ConvertFrom-Json
            
            if ($json.found) {
                $foundCount++
                Write-Host "  ✅ FOUND: $($json.product.productName)" -ForegroundColor Green
                Write-Host "     Energy: $($json.product.energyKcal) kcal | Protein: $($json.product.protein)g | Source: $($json.source)" -ForegroundColor Gray
                if ($json.fallback) {
                    Write-Host "     ⚠️  Used NZFCD fallback" -ForegroundColor Yellow
                }
            } else {
                Write-Host "  ⚠️  Not found (API works but no match)" -ForegroundColor Yellow
            }
        } else {
            Write-Host "  ❌ Status: $($response.StatusCode)" -ForegroundColor Red
            $failCount++
        }
    } catch {
        $statusCode = if ($_.Exception.Response) { $_.Exception.Response.StatusCode.value__ } else { "Error" }
        $errorMsg = $_.Exception.Message
        Write-Host "  ❌ Failed: $statusCode - $errorMsg" -ForegroundColor Red
        
        # If it's a 404, show more details
        if ($statusCode -eq 404) {
            Write-Host "     ⚠️  404 = Endpoint not found or not deployed" -ForegroundColor Yellow
        } elseif ($errorMsg -like "*timeout*" -or $errorMsg -like "*connection*") {
            Write-Host "     ⚠️  Network/connection issue" -ForegroundColor Yellow
        }
        
        $failCount++
    }
    
    Start-Sleep -Milliseconds 500
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Results Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Total Tests: $($testCases.Count)" -ForegroundColor White
Write-Host "✅ API Successful: $successCount" -ForegroundColor $(if ($successCount -eq $testCases.Count) { "Green" } else { "Yellow" })
Write-Host "✅ Products Found: $foundCount" -ForegroundColor $(if ($foundCount -gt 0) { "Green" } else { "Red" })
Write-Host "❌ Failed: $failCount" -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Red" })
Write-Host ""

$matchRate = if ($successCount -gt 0) { [math]::Round(($foundCount / $successCount) * 100, 1) } else { 0 }
Write-Host "Match Rate: $matchRate%" -ForegroundColor $(if ($matchRate -ge 50) { "Green" } elseif ($matchRate -ge 25) { "Yellow" } else { "Red" })
Write-Host ""

if ($successCount -eq $testCases.Count -and $foundCount -gt 0) {
    Write-Host "✅ FSANZ API is FUNCTIONAL!" -ForegroundColor Green
    Write-Host "   Users will receive useful FSANZ data when scanning products" -ForegroundColor Green
    Write-Host "   TruScore will be enhanced with official nutrition data" -ForegroundColor Green
} elseif ($successCount -eq $testCases.Count) {
    Write-Host "⚠️  API works but matching needs improvement" -ForegroundColor Yellow
    Write-Host "   Consider:" -ForegroundColor Yellow
    Write-Host "   - Improving product name normalization" -ForegroundColor White
    Write-Host "   - Adding more synonyms/common names" -ForegroundColor White
    Write-Host "   - Making matching even more lenient" -ForegroundColor White
} else {
    Write-Host "❌ API has issues - check deployment" -ForegroundColor Red
}

Write-Host ""
