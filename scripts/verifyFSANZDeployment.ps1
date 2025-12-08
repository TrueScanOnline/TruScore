# Verify FSANZ API Deployment

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FSANZ API Deployment Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "https://truscoreapi.vercel.app/api/fsanz-query"

Write-Host "Step 1: Testing API endpoint availability..." -ForegroundColor Yellow
Write-Host ""

# Test 1: Simple connectivity test
try {
    $response = Invoke-WebRequest -Uri "$baseUrl?country=nz&productName=Milk" -Method GET -UseBasicParsing -TimeoutSec 30 -ErrorAction Stop
    
    Write-Host "✅ API endpoint is accessible" -ForegroundColor Green
    Write-Host "   Status Code: $($response.StatusCode)" -ForegroundColor Gray
    
    if ($response.StatusCode -eq 200) {
        $json = $response.Content | ConvertFrom-Json
        
        if ($json.found) {
            Write-Host "   ✅ Found product: $($json.product.productName)" -ForegroundColor Green
            Write-Host "   ✅ Source: $($json.source)" -ForegroundColor Green
            Write-Host "   ✅ Energy: $($json.product.energyKcal) kcal" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  Product not found (but API works)" -ForegroundColor Yellow
        }
    }
} catch {
    $statusCode = if ($_.Exception.Response) { $_.Exception.Response.StatusCode.value__ } else { "Unknown" }
    Write-Host "❌ API endpoint failed" -ForegroundColor Red
    Write-Host "   Status: $statusCode" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($statusCode -eq 404) {
        Write-Host ""
        Write-Host "⚠️  404 Error = Endpoint not found" -ForegroundColor Yellow
        Write-Host "   Possible causes:" -ForegroundColor Yellow
        Write-Host "   1. Function not deployed to Vercel" -ForegroundColor White
        Write-Host "   2. Wrong file path (should be: api/fsanz-query.ts)" -ForegroundColor White
        Write-Host "   3. Vercel function not recognized" -ForegroundColor White
        Write-Host ""
        Write-Host "   Check:" -ForegroundColor Cyan
        Write-Host "   - Verify api/fsanz-query.ts exists in backend/vercel/" -ForegroundColor White
        Write-Host "   - Check Vercel dashboard for deployment errors" -ForegroundColor White
        Write-Host "   - Verify vercel.json includes fsanz-query.ts" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "Step 2: Checking local files..." -ForegroundColor Yellow
Write-Host ""

if (Test-Path "backend\vercel\api\fsanz-query.ts") {
    Write-Host "✅ API file exists: backend\vercel\api\fsanz-query.ts" -ForegroundColor Green
} else {
    Write-Host "❌ API file NOT found: backend\vercel\api\fsanz-query.ts" -ForegroundColor Red
}

if (Test-Path "backend\vercel\data\nzfcd.json") {
    $size = (Get-Item "backend\vercel\data\nzfcd.json").Length / 1MB
    Write-Host "✅ NZFCD data file exists: $([math]::Round($size, 2)) MB" -ForegroundColor Green
} else {
    Write-Host "❌ NZFCD data file NOT found" -ForegroundColor Red
}

if (Test-Path "backend\vercel\data\afcd.json") {
    $size = (Get-Item "backend\vercel\data\afcd.json").Length / 1MB
    Write-Host "✅ AFCD data file exists: $([math]::Round($size, 2)) MB" -ForegroundColor Green
} else {
    Write-Host "❌ AFCD data file NOT found" -ForegroundColor Red
}

Write-Host ""
Write-Host "Step 3: Checking vercel.json configuration..." -ForegroundColor Yellow
Write-Host ""

$vercelConfig = Get-Content "backend\vercel\vercel.json" -Raw | ConvertFrom-Json
if ($vercelConfig.functions.'api/fsanz-query.ts') {
    Write-Host "✅ fsanz-query.ts configured in vercel.json" -ForegroundColor Green
    Write-Host "   Max Duration: $($vercelConfig.functions.'api/fsanz-query.ts'.maxDuration)s" -ForegroundColor Gray
    Write-Host "   Memory: $($vercelConfig.functions.'api/fsanz-query.ts'.memory)MB" -ForegroundColor Gray
} else {
    Write-Host "❌ fsanz-query.ts NOT configured in vercel.json" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
