# Fix and Redeploy FSANZ API

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FSANZ API Fix and Redeploy" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $projectRoot

Write-Host "Step 1: Verifying files..." -ForegroundColor Yellow

# Check API file
if (Test-Path "backend\vercel\api\fsanz-query.ts") {
    Write-Host "  ✅ API file exists" -ForegroundColor Green
} else {
    Write-Host "  ❌ API file missing!" -ForegroundColor Red
    exit 1
}

# Check data files
if (Test-Path "backend\vercel\data\nzfcd.json") {
    $nzSize = (Get-Item "backend\vercel\data\nzfcd.json").Length / 1MB
    Write-Host "  ✅ NZFCD data: $([math]::Round($nzSize, 2)) MB" -ForegroundColor Green
} else {
    Write-Host "  ❌ NZFCD data missing!" -ForegroundColor Red
    exit 1
}

if (Test-Path "backend\vercel\data\afcd.json") {
    $auSize = (Get-Item "backend\vercel\data\afcd.json").Length / 1MB
    Write-Host "  ✅ AFCD data: $([math]::Round($auSize, 2)) MB" -ForegroundColor Green
} else {
    Write-Host "  ❌ AFCD data missing!" -ForegroundColor Red
    exit 1
}

# Check .vercelignore
$vercelIgnore = Get-Content "backend\vercel\.vercelignore" -Raw
if ($vercelIgnore -match "!data/") {
    Write-Host "  ✅ .vercelignore includes data files" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  .vercelignore might not include data files" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 2: Redeploying to Vercel..." -ForegroundColor Yellow
Set-Location "backend\vercel"

Write-Host "  Running: vercel --prod --yes" -ForegroundColor Gray
$deployOutput = vercel --prod --yes 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Deployment command completed" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Deployment may have issues, but continuing..." -ForegroundColor Yellow
}

Set-Location $projectRoot

Write-Host ""
Write-Host "Step 3: Waiting for deployment to process (60 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 60

Write-Host ""
Write-Host "Step 4: Testing API endpoint..." -ForegroundColor Yellow

$testUrl = "https://truscoreapi.vercel.app/api/fsanz-query?country=nz&productName=Milk"
Write-Host "  Testing: $testUrl" -ForegroundColor Gray

try {
    $response = Invoke-WebRequest -Uri $testUrl -Method GET -UseBasicParsing -TimeoutSec 30 -ErrorAction Stop
    
    if ($response.StatusCode -eq 200) {
        $json = $response.Content | ConvertFrom-Json
        Write-Host "  ✅ API is working!" -ForegroundColor Green
        Write-Host "     Status: $($response.StatusCode)" -ForegroundColor Gray
        Write-Host "     Found: $($json.found)" -ForegroundColor Gray
        if ($json.found) {
            Write-Host "     Product: $($json.product.productName)" -ForegroundColor Gray
            Write-Host "     Source: $($json.source)" -ForegroundColor Gray
        }
    } else {
        Write-Host "  ⚠️  API returned status: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    $statusCode = if ($_.Exception.Response) { $_.Exception.Response.StatusCode.value__ } else { "Unknown" }
    Write-Host "  ❌ API test failed: $statusCode" -ForegroundColor Red
    Write-Host "     Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($statusCode -eq 404) {
        Write-Host ""
        Write-Host "  ⚠️  404 Error - Endpoint not found" -ForegroundColor Yellow
        Write-Host "     This means the function is not deployed or not accessible" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "  Next steps:" -ForegroundColor Cyan
        Write-Host "  1. Check Vercel dashboard for deployment errors" -ForegroundColor White
        Write-Host "  2. Verify api/fsanz-query.ts is in the deployment" -ForegroundColor White
        Write-Host "  3. Check Vercel function logs for errors" -ForegroundColor White
        Write-Host "  4. Wait a few more minutes and test again" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Fix and Redeploy Complete" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "If API is still returning 404:" -ForegroundColor Yellow
Write-Host "1. Check Vercel dashboard: https://vercel.com/leightons-projects-d328c774/truscoreapi" -ForegroundColor White
Write-Host "2. Look at latest deployment logs" -ForegroundColor White
Write-Host "3. Check Functions tab to see if fsanz-query.ts is listed" -ForegroundColor White
Write-Host "4. Check Files tab to verify data files are included" -ForegroundColor White
Write-Host ""
