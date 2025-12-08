# Full End-to-End Test Runner
# Runs all data entry tests and checks logs

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Full E2E Test Suite" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Run tests
Write-Host "Step 1: Running all data entry tests..." -ForegroundColor Yellow
Write-Host ""
npm run test:all-data-entry

$testExit = $LASTEXITCODE

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Step 2: Check logs
Write-Host "Step 2: Checking Vercel logs..." -ForegroundColor Yellow
Write-Host ""

# Try to extract test barcode from results file
$resultsFile = Join-Path $PSScriptRoot "..\test-results-e2e.json"
if (Test-Path $resultsFile) {
    try {
        $results = Get-Content $resultsFile | ConvertFrom-Json
        $testBarcode = $results.testBarcode
        
        if ($testBarcode) {
            Write-Host "Found test barcode: $testBarcode" -ForegroundColor Gray
            Write-Host ""
            & (Join-Path $PSScriptRoot "check-vercel-logs-simple.ps1") -Barcode $testBarcode
        } else {
            Write-Host "⚠️  Could not extract test barcode from results" -ForegroundColor Yellow
            & (Join-Path $PSScriptRoot "check-vercel-logs-simple.ps1")
        }
    } catch {
        Write-Host "⚠️  Could not parse results file" -ForegroundColor Yellow
        & (Join-Path $PSScriptRoot "check-vercel-logs-simple.ps1")
    }
} else {
    Write-Host "⚠️  Results file not found, showing deployment info" -ForegroundColor Yellow
    & (Join-Path $PSScriptRoot "check-vercel-logs-simple.ps1")
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Test Suite Complete" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

if ($testExit -eq 0) {
    Write-Host "✅ All tests completed" -ForegroundColor Green
} else {
    Write-Host "⚠️  Some tests had issues (check output above)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "1. Review test results above" -ForegroundColor Cyan
Write-Host "2. Check Vercel logs for backend activity" -ForegroundColor Cyan
Write-Host "3. Test from mobile app to verify end-to-end" -ForegroundColor Cyan
Write-Host ""

