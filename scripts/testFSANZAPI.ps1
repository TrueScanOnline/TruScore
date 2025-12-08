# Test FSANZ API Endpoint

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FSANZ API Endpoint Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "https://truscoreapi.vercel.app/api/fsanz-query"

$testCases = @(
    @{country="nz"; product="Milk"; expected=true},
    @{country="nz"; product="Apple"; expected=true},
    @{country="nz"; product="Bread"; expected=true},
    @{country="au"; product="Milk"; expected=true},
    @{country="au"; product="Apple"; expected=true}
)

Write-Host "Testing API endpoint: $baseUrl" -ForegroundColor Yellow
Write-Host ""

$successCount = 0
$failCount = 0

foreach ($test in $testCases) {
    $url = "$baseUrl?country=$($test.country)&productName=$([System.Web.HttpUtility]::UrlEncode($test.product))"
    Write-Host "Testing: $($test.country) - $($test.product)" -ForegroundColor Gray
    Write-Host "  URL: $url" -ForegroundColor Gray
    
    try {
        $response = Invoke-WebRequest -Uri $url -Method GET -UseBasicParsing -TimeoutSec 30 -ErrorAction Stop
        
        if ($response.StatusCode -eq 200) {
            $json = $response.Content | ConvertFrom-Json
            
            if ($json.found) {
                Write-Host "  ✅ FOUND: $($json.product.productName)" -ForegroundColor Green
                Write-Host "     Energy: $($json.product.energyKcal) kcal" -ForegroundColor Gray
                Write-Host "     Source: $($json.source)" -ForegroundColor Gray
                if ($json.fallback) {
                    Write-Host "     ⚠️  Used fallback (NZFCD for AU)" -ForegroundColor Yellow
                }
                $successCount++
            } else {
                Write-Host "  ⚠️  Not found (but API works)" -ForegroundColor Yellow
                $successCount++
            }
        } else {
            Write-Host "  ❌ Status: $($response.StatusCode)" -ForegroundColor Red
            $failCount++
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "  ❌ Error: $statusCode - $($_.Exception.Message)" -ForegroundColor Red
        
        if ($statusCode -eq 404) {
            Write-Host "     ⚠️  404 = Endpoint not found or not deployed" -ForegroundColor Yellow
        }
        $failCount++
    }
    
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Results" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Successful: $successCount" -ForegroundColor Green
Write-Host "❌ Failed: $failCount" -ForegroundColor $(if ($failCount -gt 0) { "Red" } else { "Green" })
Write-Host ""

if ($failCount -eq 0) {
    Write-Host "✅ API is working correctly!" -ForegroundColor Green
} else {
    Write-Host "❌ API has issues - check deployment" -ForegroundColor Red
}
