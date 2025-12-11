# Comprehensive FSANZ Diagnosis

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FSANZ Complete Diagnosis" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check local files
Write-Host "Step 1: Checking Local Files..." -ForegroundColor Yellow
if (Test-Path "backend\vercel\api\fsanz-query.ts") {
    Write-Host "  ✅ API file exists" -ForegroundColor Green
} else {
    Write-Host "  ❌ API file missing!" -ForegroundColor Red
    exit 1
}

if (Test-Path "backend\vercel\data\nzfcd.json") {
    $nzSize = (Get-Item "backend\vercel\data\nzfcd.json").Length / 1MB
    Write-Host "  ✅ NZFCD: $([math]::Round($nzSize, 2)) MB" -ForegroundColor Green
} else {
    Write-Host "  ❌ NZFCD missing!" -ForegroundColor Red
}

if (Test-Path "backend\vercel\data\afcd.json") {
    $auSize = (Get-Item "backend\vercel\data\afcd.json").Length / 1MB
    Write-Host "  ✅ AFCD: $([math]::Round($auSize, 2)) MB" -ForegroundColor Green
} else {
    Write-Host "  ❌ AFCD missing!" -ForegroundColor Red
}

Write-Host ""

# Step 2: Test API with detailed error handling
Write-Host "Step 2: Testing API Endpoint..." -ForegroundColor Yellow
$testUrl = "https://truscoreapi.vercel.app/api/fsanz-query?country=nz&productName=Milk"
Write-Host "  URL: $testUrl" -ForegroundColor Gray

try {
    $ErrorActionPreference = "Stop"
    $response = Invoke-WebRequest -Uri $testUrl -Method GET -UseBasicParsing -TimeoutSec 30
    
    Write-Host "  ✅ Status: $($response.StatusCode)" -ForegroundColor Green
    
    $json = $response.Content | ConvertFrom-Json
    Write-Host "  Response:" -ForegroundColor Gray
    Write-Host "    Found: $($json.found)" -ForegroundColor $(if ($json.found) { "Green" } else { "Yellow" })
    if ($json.found) {
        Write-Host "    Product: $($json.product.productName)" -ForegroundColor Green
        Write-Host "    Source: $($json.source)" -ForegroundColor Gray
    } else {
        Write-Host "    Message: $($json.message)" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "  ❌ Request Failed" -ForegroundColor Red
    Write-Host "    Error Type: $($_.Exception.GetType().Name)" -ForegroundColor Yellow
    Write-Host "    Message: $($_.Exception.Message)" -ForegroundColor Yellow
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "    Status Code: $statusCode" -ForegroundColor Yellow
        
        if ($statusCode -eq 404) {
            Write-Host ""
            Write-Host "  ⚠️  404 Error = Endpoint not found" -ForegroundColor Yellow
            Write-Host "     Possible causes:" -ForegroundColor Yellow
            Write-Host "     1. Function not deployed to Vercel" -ForegroundColor White
            Write-Host "     2. Deployment still processing (wait 1-2 minutes)" -ForegroundColor White
            Write-Host "     3. Wrong endpoint path" -ForegroundColor White
            Write-Host ""
            Write-Host "     Check Vercel dashboard:" -ForegroundColor Cyan
            Write-Host "     https://vercel.com/leightons-projects-d328c774/truscoreapi" -ForegroundColor White
        } elseif ($statusCode -eq 500) {
            Write-Host "  ⚠️  500 Error = Server error (check Vercel logs)" -ForegroundColor Yellow
        } elseif ($statusCode -eq 503) {
            Write-Host "  ⚠️  503 Error = Service unavailable (database not loaded)" -ForegroundColor Yellow
        }
    } elseif ($_.Exception.Message -like "*timeout*" -or $_.Exception.Message -like "*connection*") {
        Write-Host "  ⚠️  Network/Connection issue" -ForegroundColor Yellow
        Write-Host "     Check internet connection" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "Step 3: Recommendations..." -ForegroundColor Yellow
Write-Host "  1. Check Vercel dashboard for deployment status" -ForegroundColor White
Write-Host "  2. Wait 1-2 minutes if deployment just completed" -ForegroundColor White
Write-Host "  3. Check Vercel function logs for errors" -ForegroundColor White
Write-Host "  4. Verify data files are included in deployment" -ForegroundColor White
Write-Host ""











