# Complete FSANZ Check - Full Verification

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Complete FSANZ Database Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $projectRoot

# Step 1: Verify Local Files
Write-Host "Step 1: Verifying Local Files..." -ForegroundColor Yellow
Write-Host ""

$allGood = $true

# Check API file
if (Test-Path "backend\vercel\api\fsanz-query.ts") {
    Write-Host "  ✅ API file: backend\vercel\api\fsanz-query.ts" -ForegroundColor Green
} else {
    Write-Host "  ❌ API file missing!" -ForegroundColor Red
    $allGood = $false
}

# Check data files
if (Test-Path "backend\vercel\data\nzfcd.json") {
    $nzData = Get-Content "backend\vercel\data\nzfcd.json" -Raw | ConvertFrom-Json
    $nzSize = (Get-Item "backend\vercel\data\nzfcd.json").Length / 1MB
    Write-Host "  ✅ NZFCD: $($nzData.Count.ToString('N0')) foods, $([math]::Round($nzSize, 2)) MB" -ForegroundColor Green
} else {
    Write-Host "  ❌ NZFCD missing!" -ForegroundColor Red
    $allGood = $false
}

if (Test-Path "backend\vercel\data\afcd.json") {
    $auData = Get-Content "backend\vercel\data\afcd.json" -Raw | ConvertFrom-Json
    $auSize = (Get-Item "backend\vercel\data\afcd.json").Length / 1MB
    Write-Host "  ✅ AFCD: $($auData.Count.ToString('N0')) foods, $([math]::Round($auSize, 2)) MB" -ForegroundColor Green
} else {
    Write-Host "  ❌ AFCD missing!" -ForegroundColor Red
    $allGood = $false
}

if (-not $allGood) {
    Write-Host ""
    Write-Host "❌ Local files missing - cannot proceed" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Check Configuration
Write-Host "Step 2: Checking Configuration..." -ForegroundColor Yellow
Write-Host ""

$vj = Get-Content "backend\vercel\vercel.json" -Raw | ConvertFrom-Json
if ($vj.functions.'api/fsanz-query.ts') {
    Write-Host "  ✅ Function configured in vercel.json" -ForegroundColor Green
} else {
    Write-Host "  ❌ Function NOT in vercel.json!" -ForegroundColor Red
}

$ignore = Get-Content "backend\vercel\.vercelignore" -Raw
if ($ignore -match "!data/") {
    Write-Host "  ✅ Data files included in .vercelignore" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Data files might be excluded" -ForegroundColor Yellow
}

Write-Host ""

# Step 3: Test API
Write-Host "Step 3: Testing API Endpoint..." -ForegroundColor Yellow
Write-Host ""

$testUrl = "https://truscoreapi.vercel.app/api/fsanz-query?country=nz&productName=Milk"
Write-Host "  Testing: $testUrl" -ForegroundColor Gray

try {
    $ErrorActionPreference = "Stop"
    $response = Invoke-WebRequest -Uri $testUrl -Method GET -UseBasicParsing -TimeoutSec 30
    
    Write-Host "  ✅ API Response: $($response.StatusCode)" -ForegroundColor Green
    
    $json = $response.Content | ConvertFrom-Json
    
    if ($json.found) {
        Write-Host "  ✅ Product Found: $($json.product.productName)" -ForegroundColor Green
        Write-Host "     Energy: $($json.product.energyKcal) kcal" -ForegroundColor Gray
        Write-Host "     Source: $($json.source)" -ForegroundColor Gray
        Write-Host ""
        Write-Host "✅ FSANZ API is FULLY FUNCTIONAL!" -ForegroundColor Green
        Write-Host "   Users will get useful FSANZ data when scanning products" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Product not found (but API works)" -ForegroundColor Yellow
        Write-Host "     Message: $($json.message)" -ForegroundColor Gray
        Write-Host ""
        Write-Host "⚠️  API works but matching needs improvement" -ForegroundColor Yellow
    }
    
} catch {
    $statusCode = if ($_.Exception.Response) { $_.Exception.Response.StatusCode.value__ } else { "Unknown" }
    $errorMsg = $_.Exception.Message
    
    Write-Host "  ❌ API Test Failed" -ForegroundColor Red
    Write-Host "     Status: $statusCode" -ForegroundColor Yellow
    Write-Host "     Error: $errorMsg" -ForegroundColor Yellow
    
    if ($statusCode -eq 404) {
        Write-Host ""
        Write-Host "⚠️  404 Error = Endpoint not found" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Possible causes:" -ForegroundColor Cyan
        Write-Host "1. Deployment still processing (wait 1-2 minutes)" -ForegroundColor White
        Write-Host "2. Function not deployed (check Vercel dashboard)" -ForegroundColor White
        Write-Host "3. Wrong endpoint path" -ForegroundColor White
        Write-Host ""
        Write-Host "Check Vercel dashboard:" -ForegroundColor Cyan
        Write-Host "  https://vercel.com/leightons-projects-d328c774/truscoreapi" -ForegroundColor White
        Write-Host ""
        Write-Host "If deployment just completed, wait 60-90 seconds and test again" -ForegroundColor Yellow
    } elseif ($statusCode -eq 500) {
        Write-Host ""
        Write-Host "⚠️  500 Error = Server error" -ForegroundColor Yellow
        Write-Host "   Check Vercel function logs for details" -ForegroundColor White
    } elseif ($statusCode -eq 503) {
        Write-Host ""
        Write-Host "⚠️  503 Error = Database not available" -ForegroundColor Yellow
        Write-Host "   Data files might not be included in deployment" -ForegroundColor White
    } elseif ($errorMsg -like "*timeout*" -or $errorMsg -like "*connection*") {
        Write-Host ""
        Write-Host "⚠️  Network/Connection issue" -ForegroundColor Yellow
        Write-Host "   Check internet connection" -ForegroundColor White
    }
    
    Write-Host ""
    Write-Host "❌ API is not accessible - check deployment" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
















