# Comprehensive Barcode Test Runner
# 
# Runs three test scenarios:
# 1. General batch: 100-200 diverse barcodes
# 2. Region-specific: US/EU/AU/NZ barcodes
# 3. Ethics-focused: 50 known ethical/recall-heavy brands
#
# Usage:
#   .\scripts\runComprehensiveBarcodeTests.ps1 -TestType "all"
#   .\scripts\runComprehensiveBarcodeTests.ps1 -TestType "general"
#   .\scripts\runComprehensiveBarcodeTests.ps1 -TestType "regions"
#   .\scripts\runComprehensiveBarcodeTests.ps1 -TestType "ethics"

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("all", "general", "regions", "ethics")]
    [string]$TestType = "all",
    
    [Parameter(Mandatory=$false)]
    [switch]$OutputToFile = $true
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "[OK] Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js not found. Please install Node.js." -ForegroundColor Red
    exit 1
}

# Check ts-node
if (-not (Get-Command ts-node -ErrorAction SilentlyContinue)) {
    Write-Host "[WARN] Installing ts-node..." -ForegroundColor Yellow
    npm install -g ts-node typescript 2>&1 | Out-Null
}

# Import barcode collections
Write-Host "`n[INFO] Loading barcode collections..." -ForegroundColor Gray

# Create a temporary TypeScript file to extract barcodes
$extractBarcodesScript = @"
import { 
  GENERAL_BATCH_UNIQUE, 
  US_BARCODES, 
  EU_BARCODES, 
  AU_NZ_BARCODES, 
  ETHICS_FOCUSED_50 
} from './barcodeCollections';

const collections = {
  general: GENERAL_BATCH_UNIQUE,
  us: US_BARCODES,
  eu: EU_BARCODES,
  au_nz: AU_NZ_BARCODES,
  ethics: ETHICS_FOCUSED_50
};

console.log(JSON.stringify(collections, null, 2));
"@

$extractScriptPath = Join-Path $scriptDir "extractBarcodes.ts"
$extractBarcodesScript | Out-File -FilePath $extractScriptPath -Encoding UTF8

# Extract barcodes
$env:NODE_OPTIONS = "--no-experimental-strip-types"
$tsConfigPath = Join-Path $scriptDir "tsconfig.json"
$barcodeOutput = if (Test-Path $tsConfigPath) {
    & ts-node --project $tsConfigPath --transpile-only --skip-ignore $extractScriptPath 2>&1
} else {
    & ts-node --transpile-only --skip-ignore $extractScriptPath 2>&1
}
Remove-Item env:NODE_OPTIONS -ErrorAction SilentlyContinue
Remove-Item $extractScriptPath -ErrorAction SilentlyContinue

# Extract JSON from output (last line should be JSON)
$barcodeJson = ($barcodeOutput | Select-Object -Last 1).Trim()
try {
    $collections = $barcodeJson | ConvertFrom-Json
} catch {
    Write-Host "[ERROR] Failed to parse barcode collections. Using fallback..." -ForegroundColor Red
    # Fallback: use hardcoded collections
    $collections = @{
        general = @('894700010137','9310354982466','9300694335947','9316417008890','9310036039655','5449000000996','9310272002253','9300675016902','611269991000','9341650001766','9300650022898','7622300992675','793579769781','9326666610553','9310055105850','9310055105904','9300652014396','9300652010794','9300677006437','9313010000801','13000006408','9310061462206','9310061550101','3017620422003','9313958005890','9310412003577','9310047207180','9343787099105','9343787099104','9310653105733','9310354890006','9300830060733','9310988022378','40000511281','40000422068','44000032210','38000845017','9310645350899','8355030495','9310645176833','9342373000296','9357107000251','9320802000482','9342373000395','931839007104','9315090200102','9311208001241','58449450023','9310155305037','9310060011030','9315822010863','5052675000989','42272005024','93100062212972','9310645244846','75919000069','9317241301409','803678000095','9310645442532','9340860006547','9310645467740','9300675001113','9310645244839','7622210969472','5000159461125','8001090311027','8712561735036','4008400000000','5010024000000','5901234123457','5053990100124','7613034626844','0687437953712','9415077044894')
        us = @('034000000000','030000011000','038000010000','041303000000','5150024024','034000000001','034000000002','13000006408','40000511281','40000422068','44000032210','38000845017','8355030495','42272005024','75919000069','803678000095','58449450023','611269991000','894700010137','793579769781')
        eu = @('3017620422003','7622210969472','7622300992675','7613034626844','5000159461125','5010024000000','5901234123457','5052675000989','5053990100124','8001090311027','8712561735036','5449000000996','0687437953712','9415077044894','4008400000000')
        au_nz = @('9300675001113','9310645244839','9313958005890','9310047207180','9310645467740','9310354982466','9300694335947','9316417008890','9310036039655','9310272002253','9300675016902','9341650001766','9300650022898','9326666610553','9310055105850','9310055105904','9300652014396','9300652010794','9300677006437','9313010000801','9310061462206','9310061550101','9310412003577','9343787099105','9343787099104','9310653105733','9310354890006','9300830060733','9310988022378','9310645350899','9310645176833','9342373000296','9357107000251','9320802000482','9342373000395','931839007104','9315090200102','9311208001241','9310155305037','9310060011030','9315822010863','93100062212972','9310645244846','9317241301409','9310645442532','9340860006547')
        ethics = @('0687437953712','9415077044894','041303000000','3017620422003','7622210955930','5000159461125','7613034626844','7622210969472','034000000001','034000000002','034000000000','9300675001113','9310645244839','9313958005890','9310047207180','9310645467740','8001090311027','8712561735036','5053990100124','030000011000','038000010000','5150024024')
    }
}

# Function to run a test batch
function Run-TestBatch {
    param(
        [string]$Name,
        [string[]]$Barcodes,
        [string]$OutputPrefix
    )
    
    Write-Host "`n================================================" -ForegroundColor Cyan
    Write-Host "[TEST] $Name" -ForegroundColor Cyan
    Write-Host "Barcodes: $($Barcodes.Count)" -ForegroundColor Cyan
    Write-Host "================================================`n" -ForegroundColor Cyan
    
    $barcodeArgs = $Barcodes -join " "
    $testScriptPath = Join-Path $scriptDir "testBarcodePerformance.ts"
    $outputFile = Join-Path $projectRoot "${OutputPrefix}_results.json"
    $fullOutputFile = Join-Path $projectRoot "${OutputPrefix}_full.txt"
    
    $env:NODE_OPTIONS = "--no-experimental-strip-types"
    $startTime = Get-Date
    
    if (Test-Path $tsConfigPath) {
        $output = & ts-node --project $tsConfigPath --transpile-only --skip-ignore $testScriptPath $barcodeArgs 2>&1
    } else {
        $output = & ts-node --transpile-only --skip-ignore $testScriptPath $barcodeArgs 2>&1
    }
    
    Remove-Item env:NODE_OPTIONS -ErrorAction SilentlyContinue
    
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalSeconds
    
    # Extract JSON from output
    $jsonStart = $output | Select-String -Pattern "TEST RESULTS \(JSON\)" -Context 0,10000
    if ($jsonStart) {
        $jsonLines = $jsonStart.Context.PostContext | Where-Object { $_ -notmatch "TEST SUMMARY" }
        $jsonContent = $jsonLines -join "`n"
        
        # Try to extract JSON object
        $jsonMatch = [regex]::Match($jsonContent, '\{.*\}', [System.Text.RegularExpressions.RegexOptions]::Singleline)
        if ($jsonMatch.Success) {
            $jsonContent = $jsonMatch.Value
            $jsonContent | Out-File -FilePath $outputFile -Encoding UTF8
            Write-Host "[OK] Results saved to: $outputFile" -ForegroundColor Green
        }
    }
    
    # Save full output
    $output | Out-File -FilePath $fullOutputFile -Encoding UTF8
    Write-Host "[OK] Full output saved to: $fullOutputFile" -ForegroundColor Green
    Write-Host "[INFO] Test duration: $([math]::Round($duration, 2)) seconds" -ForegroundColor Gray
    
    return @{
        Name = $Name
        Barcodes = $Barcodes.Count
        OutputFile = $outputFile
        FullOutputFile = $fullOutputFile
        Duration = $duration
    }
}

# Run tests based on TestType
$results = @()

if ($TestType -eq "all" -or $TestType -eq "general") {
    Write-Host "`n[INFO] Running GENERAL BATCH test (100-200 barcodes)..." -ForegroundColor Yellow
    $generalResult = Run-TestBatch -Name "General Batch" -Barcodes $collections.general -OutputPrefix "general_batch"
    $results += $generalResult
}

if ($TestType -eq "all" -or $TestType -eq "regions") {
    Write-Host "`n[INFO] Running REGION-SPECIFIC tests..." -ForegroundColor Yellow
    
    $usResult = Run-TestBatch -Name "US Barcodes" -Barcodes $collections.us -OutputPrefix "region_us"
    $results += $usResult
    
    $euResult = Run-TestBatch -Name "EU Barcodes" -Barcodes $collections.eu -OutputPrefix "region_eu"
    $results += $euResult
    
    $auNzResult = Run-TestBatch -Name "AU/NZ Barcodes" -Barcodes $collections.au_nz -OutputPrefix "region_au_nz"
    $results += $auNzResult
}

if ($TestType -eq "all" -or $TestType -eq "ethics") {
    Write-Host "`n[INFO] Running ETHICS-FOCUSED test (50 barcodes)..." -ForegroundColor Yellow
    $ethicsResult = Run-TestBatch -Name "Ethics Focused" -Barcodes $collections.ethics -OutputPrefix "ethics_focused"
    $results += $ethicsResult
}

# Summary
Write-Host "`n================================================" -ForegroundColor Green
Write-Host "[SUMMARY] All Tests Completed" -ForegroundColor Green
Write-Host "================================================`n" -ForegroundColor Green

foreach ($result in $results) {
    Write-Host "$($result.Name):" -ForegroundColor Cyan
    Write-Host "  Barcodes: $($result.Barcodes)" -ForegroundColor Gray
    Write-Host "  Duration: $([math]::Round($result.Duration, 2))s" -ForegroundColor Gray
    Write-Host "  Output: $($result.OutputFile)" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "[OK] All tests completed!`n" -ForegroundColor Green
