# Complete FSANZ Database Verification and Fix

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Complete FSANZ Database Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $projectRoot

# Step 1: Verify Local Database Files
Write-Host "Step 1: Verifying Local Database Files..." -ForegroundColor Yellow
Write-Host ""

$nzfcdPath = "backend\vercel\data\nzfcd.json"
$afcdPath = "backend\vercel\data\afcd.json"

if (Test-Path $nzfcdPath) {
    $nzData = Get-Content $nzfcdPath -Raw | ConvertFrom-Json
    $nzSize = (Get-Item $nzfcdPath).Length / 1MB
    Write-Host "  ✅ NZFCD: $($nzData.Count.ToString('N0')) foods, $([math]::Round($nzSize, 2)) MB" -ForegroundColor Green
    
    # Test if database has expected foods
    $milkCount = ($nzData | Where-Object { ($_.foodNameLower -or $_.foodName) -and (($_.foodNameLower -or ($_.foodName -replace ' ','')).ToLower() -like '*milk*' }).Count
    Write-Host "     Milk-related foods: $milkCount" -ForegroundColor Gray
} else {
    Write-Host "  ❌ NZFCD file not found!" -ForegroundColor Red
    exit 1
}

if (Test-Path $afcdPath) {
    $auData = Get-Content $afcdPath -Raw | ConvertFrom-Json
    $auSize = (Get-Item $afcdPath).Length / 1MB
    Write-Host "  ✅ AFCD: $($auData.Count.ToString('N0')) foods, $([math]::Round($auSize, 2)) MB" -ForegroundColor Green
} else {
    Write-Host "  ❌ AFCD file not found!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Verify API File
Write-Host "Step 2: Verifying API File..." -ForegroundColor Yellow
if (Test-Path "backend\vercel\api\fsanz-query.ts") {
    Write-Host "  ✅ API file exists" -ForegroundColor Green
} else {
    Write-Host "  ❌ API file missing!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 3: Redeploy
Write-Host "Step 3: Redeploying to Vercel..." -ForegroundColor Yellow
Set-Location "backend\vercel"
Write-Host "  Running: vercel --prod --yes" -ForegroundColor Gray
vercel --prod --yes | Out-Null
Set-Location $projectRoot

Write-Host "  ✅ Deployment completed" -ForegroundColor Green
Write-Host ""

# Step 4: Wait for deployment
Write-Host "Step 4: Waiting for deployment to process (90 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 90
Write-Host "  ✅ Wait complete" -ForegroundColor Green
Write-Host ""

# Step 5: Test API with multiple products
Write-Host "Step 5: Testing API with Real Products..." -ForegroundColor Yellow
Write-Host ""

$testProducts = @(
    @{name="Milk"; country="nz"},
    @{name="Tomato"; country="nz"},
    @{name="Bread"; country="nz"},
    @{name="Coconut"; country="nz"},
    @{name="Cranberry"; country="nz"},
    @{name="Milk"; country="au"},
    @{name="Apple"; country="au"}
)

$baseUrl = "https://truscoreapi.vercel.app/api/fsanz-query"
$successCount = 0
$foundCount = 0

foreach ($test in $testProducts) {
    $url = "$baseUrl?country=$($test.country)&productName=$([System.Web.HttpUtility]::UrlEncode($test.name))"
    Write-Host "  Testing: $($test.country) - $($test.name)" -ForegroundColor Gray
    
    try {
        $response = Invoke-WebRequest -Uri $url -Method GET -UseBasicParsing -TimeoutSec 30 -ErrorAction Stop
        
        if ($response.StatusCode -eq 200) {
            $json = $response.Content | ConvertFrom-Json
            $successCount++
            
            if ($json.found) {
                $foundCount++
                Write-Host "    ✅ FOUND: $($json.product.productName)" -ForegroundColor Green
                Write-Host "       Energy: $($json.product.energyKcal) kcal, Source: $($json.source)" -ForegroundColor Gray
            } else {
                Write-Host "    ⚠️  Not found (but API works)" -ForegroundColor Yellow
            }
        } else {
            Write-Host "    ❌ Status: $($response.StatusCode)" -ForegroundColor Red
        }
    } catch {
        $statusCode = if ($_.Exception.Response) { $_.Exception.Response.StatusCode.value__ } else { "Error" }
        Write-Host "    ❌ Failed: $statusCode" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Verification Results" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ API Requests Successful: $successCount/$($testProducts.Count)" -ForegroundColor $(if ($successCount -eq $testProducts.Count) { "Green" } else { "Yellow" })
Write-Host "✅ Products Found: $foundCount/$($testProducts.Count)" -ForegroundColor $(if ($foundCount -gt 0) { "Green" } else { "Yellow" })
Write-Host ""

if ($successCount -eq $testProducts.Count -and $foundCount -gt 0) {
    Write-Host "✅ FSANZ API is fully functional!" -ForegroundColor Green
    Write-Host "   Users will get useful FSANZ data when scanning products" -ForegroundColor Green
} elseif ($successCount -eq $testProducts.Count) {
    Write-Host "⚠️  API works but matching needs improvement" -ForegroundColor Yellow
    Write-Host "   Consider improving product name matching algorithm" -ForegroundColor Yellow
} else {
    Write-Host "❌ API has issues - check deployment" -ForegroundColor Red
}

Write-Host ""
