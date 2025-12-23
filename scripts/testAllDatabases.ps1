# Comprehensive Database Investigation Script
# Tests ALL databases/APIs used by TrueScan with real-world barcodes
# 
# This script will:
# 1. Test each database with real-world barcodes
# 2. Document which databases return useful data
# 3. Identify databases that are queried but return no data
# 4. Provide solutions for non-working databases

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Database Investigation Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test barcodes - real-world products
$testBarcodes = @(
    "9300675001113",  # Real barcode from test files (Coca-Cola)
    "9310645244839",  # Real barcode from test files (Tuna)
    "3017620422003",  # Nutella
    "7622210969472",  # Oreo cookies
    "5000159461125"   # Coca-Cola
)

# Database services to test (from truScoreOptimizedDatabase.ts)
$databases = @(
    @{ Name = "Open Food Facts"; Tier = 1; Service = "openFoodFacts"; Function = "fetchProductFromOFF"; RequiresKey = $false },
    @{ Name = "Open Beauty Facts"; Tier = 1; Service = "openBeautyFacts"; Function = "fetchProductFromOBF"; RequiresKey = $false },
    @{ Name = "Open Pet Food Facts"; Tier = 1; Service = "openPetFoodFacts"; Function = "fetchProductFromOPFF"; RequiresKey = $false },
    @{ Name = "Open Products Facts"; Tier = 1; Service = "openProductsFacts"; Function = "fetchProductFromOPF"; RequiresKey = $false },
    @{ Name = "USDA FoodData Central"; Tier = 1; Service = "usdaFoodData"; Function = "fetchProductFromUSDA"; RequiresKey = $true },
    @{ Name = "Health Canada"; Tier = 1; Service = "healthCanadaDatabase"; Function = "fetchProductFromHealthCanada"; RequiresKey = $false },
    @{ Name = "UK FSA"; Tier = 1; Service = "ukFsaDatabase"; Function = "fetchProductFromUKFSA"; RequiresKey = $false },
    @{ Name = "EFSA"; Tier = 1; Service = "efsaDatabase"; Function = "fetchProductFromEFSA"; RequiresKey = $false },
    @{ Name = "GS1 Data Source"; Tier = 1; Service = "gs1DataSource"; Function = "fetchProductFromGS1"; RequiresKey = $true },
    
    @{ Name = "UPCitemdb"; Tier = 3; Service = "upcitemdb"; Function = "fetchProductFromUPCitemdb"; RequiresKey = $false },
    @{ Name = "EAN-Search"; Tier = 3; Service = "eanSearchApi"; Function = "fetchProductFromEANSearch"; RequiresKey = $true },
    @{ Name = "Barcode Spider"; Tier = 3; Service = "barcodeSpider"; Function = "fetchProductFromBarcodeSpider"; RequiresKey = $false },
    @{ Name = "GoUPC"; Tier = 3; Service = "goUpcApi"; Function = "fetchProductFromGoUpc"; RequiresKey = $false },
    @{ Name = "Barcode Monster"; Tier = 3; Service = "barcodeMonsterApi"; Function = "fetchProductFromBarcodeMonster"; RequiresKey = $false },
    @{ Name = "UPC Database"; Tier = 3; Service = "upcDatabaseApi"; Function = "fetchProductFromUPCDatabase"; RequiresKey = $true },
    @{ Name = "Barcode Lookup"; Tier = 3; Service = "barcodeLookupApi"; Function = "fetchProductFromBarcodeLookup"; RequiresKey = $true },
    @{ Name = "EAN Data"; Tier = 3; Service = "eanDataApi"; Function = "fetchProductFromEANData"; RequiresKey = $true },
    @{ Name = "Open GTIN DB"; Tier = 3; Service = "openGtindbApi"; Function = "fetchProductFromOpenGtin"; RequiresKey = $false },
    @{ Name = "Open EAN"; Tier = 3; Service = "openEanApi"; Function = "fetchProductFromOpenEAN"; RequiresKey = $false },
    @{ Name = "Buycott"; Tier = 3; Service = "buycottApi"; Function = "fetchProductFromBuycott"; RequiresKey = $false },
    @{ Name = "Datakick"; Tier = 3; Service = "datakickApi"; Function = "fetchProductFromDatakick"; RequiresKey = $false },
    @{ Name = "Product Open Data"; Tier = 3; Service = "productOpenDataApi"; Function = "fetchProductFromProductOpenData"; RequiresKey = $false },
    @{ Name = "Barcode Lookup Com"; Tier = 3; Service = "barcodeLookupComApi"; Function = "fetchProductFromBarcodeLookupCom"; RequiresKey = $true },
    @{ Name = "Food Repo"; Tier = 3; Service = "foodRepoApi"; Function = "fetchProductFromFoodRepo"; RequiresKey = $false },
    @{ Name = "World Food Database"; Tier = 3; Service = "worldFoodDatabaseApi"; Function = "enhanceProductWithWorldFoodDatabase"; RequiresKey = $false },
    @{ Name = "FoodB"; Tier = 3; Service = "foodbApi"; Function = "enhanceProductWithFooDB"; RequiresKey = $false },
    
    @{ Name = "Edamam"; Tier = 3; Service = "edamamApi"; Function = "fetchProductFromEdamam"; RequiresKey = $true },
    @{ Name = "Nutritionix"; Tier = 3; Service = "nutritionixApi"; Function = "fetchProductFromNutritionix"; RequiresKey = $true },
    @{ Name = "Spoonacular"; Tier = 3; Service = "spoonacularApi"; Function = "fetchProductFromSpoonacular"; RequiresKey = $true },
    @{ Name = "Tesco Labs"; Tier = 3; Service = "tescoLabsApi"; Function = "fetchProductFromTesco"; RequiresKey = $true },
    @{ Name = "Walmart Open API"; Tier = 3; Service = "walmartOpenApi"; Function = "fetchProductFromWalmart"; RequiresKey = $true },
    @{ Name = "Best Buy"; Tier = 3; Service = "bestBuyApi"; Function = "fetchProductFromBestBuy"; RequiresKey = $true },
    @{ Name = "NZ Stores"; Tier = 2; Service = "nzStoreApi"; Function = "fetchProductFromNZStores"; RequiresKey = $false },
    @{ Name = "AU Retailers"; Tier = 2; Service = "auRetailerScraping"; Function = "fetchProductFromAURetailers"; RequiresKey = $false }
)

# Results storage
$results = @()
$summary = @{}

Write-Host "Testing $($databases.Count) databases with $($testBarcodes.Count) barcodes..." -ForegroundColor Yellow
Write-Host ""

# Change to project directory
Set-Location $PSScriptRoot\..

# Test each database
foreach ($db in $databases) {
    Write-Host "Testing: $($db.Name) (Tier $($db.Tier))" -ForegroundColor Cyan
    
    $dbResults = @{
        Database = $db.Name
        Tier = $db.Tier
        RequiresKey = $db.RequiresKey
        Tests = @()
        SuccessCount = 0
        FailureCount = 0
        DataReturnCount = 0
        NoDataCount = 0
        TotalResponseTime = 0
    }
    
    foreach ($barcode in $testBarcodes) {
        Write-Host "  Barcode: $barcode" -NoNewline
        
        # Use ts-node to test the database function
        $testScript = @"
import { $($db.Function) } from './src/services/$($db.Service)';
const result = await $($db.Function)('$barcode');
if (result && result.product_name) {
    console.log('SUCCESS|HAS_DATA|' + Object.keys(result).length);
} else if (result) {
    console.log('SUCCESS|NO_DATA|0');
} else {
    console.log('FAILURE|NO_DATA|0');
}
"@
        
        $tempFile = [System.IO.Path]::GetTempFileName() + ".ts"
        $testScript | Out-File -FilePath $tempFile -Encoding UTF8
        
        try {
            $startTime = Get-Date
            $output = node -e "require('ts-node/register'); require('$tempFile')" 2>&1
            $responseTime = ((Get-Date) - $startTime).TotalMilliseconds
            
            if ($output -match "SUCCESS\|HAS_DATA\|(\d+)") {
                $fieldCount = $matches[1]
                Write-Host " - SUCCESS (Has Data: $fieldCount fields, $([math]::Round($responseTime))ms)" -ForegroundColor Green
                $dbResults.SuccessCount++
                $dbResults.DataReturnCount++
            } elseif ($output -match "SUCCESS\|NO_DATA") {
                Write-Host " - SUCCESS (No Data, $([math]::Round($responseTime))ms)" -ForegroundColor Yellow
                $dbResults.SuccessCount++
                $dbResults.NoDataCount++
            } else {
                Write-Host " - FAILED ($([math]::Round($responseTime))ms)" -ForegroundColor Red
                $dbResults.FailureCount++
            }
            
            $dbResults.TotalResponseTime += $responseTime
            $dbResults.Tests += @{
                Barcode = $barcode
                Success = $output -match "SUCCESS"
                HasData = $output -match "HAS_DATA"
                ResponseTime = $responseTime
            }
        } catch {
            Write-Host " - ERROR: $_" -ForegroundColor Red
            $dbResults.FailureCount++
        } finally {
            Remove-Item $tempFile -ErrorAction SilentlyContinue
        }
        
        Start-Sleep -Milliseconds 200  # Rate limiting
    }
    
    $dbResults.AverageResponseTime = $dbResults.TotalResponseTime / $testBarcodes.Count
    $summary[$db.Name] = $dbResults
    
    Write-Host ""
}

# Generate report
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Investigation Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$report = @"
# Database Investigation Report

**Generated:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Test Barcodes:** $($testBarcodes -join ', ')
**Total Databases Tested:** $($databases.Count)

## Executive Summary

"@

$working = 0
$partial = 0
$notWorking = 0
$requiresKey = 0

foreach ($db in $databases) {
    $dbResult = $summary[$db.Name]
    if ($dbResult.DataReturnCount -gt 0) {
        if ($dbResult.DataReturnCount -eq $testBarcodes.Count) {
            $working++
        } else {
            $partial++
        }
    } elseif ($dbResult.RequiresKey) {
        $requiresKey++
    } else {
        $notWorking++
    }
}

$report += @"
- ✅ **Working:** $working databases
- ⚠️ **Partial:** $partial databases  
- 🔑 **Requires Key:** $requiresKey databases
- ❌ **Not Working:** $notWorking databases

## Detailed Results

"@

foreach ($tier in 1..3) {
    $tierDbs = $databases | Where-Object { $_.Tier -eq $tier }
    if ($tierDbs.Count -eq 0) { continue }
    
    $report += @"
### Tier $tier Databases

| Database | Status | Success Rate | Data Returns | Avg Response | Issues |
|-----------|--------|-------------|--------------|--------------|--------|
"@
    
    foreach ($db in $tierDbs) {
        $dbResult = $summary[$db.Name]
        $successRate = [math]::Round(($dbResult.SuccessCount / $testBarcodes.Count) * 100)
        $dataRate = "$($dbResult.DataReturnCount)/$($testBarcodes.Count)"
        $avgTime = [math]::Round($dbResult.AverageResponseTime)
        
        $status = if ($dbResult.DataReturnCount -eq $testBarcodes.Count) { "✅ working" }
                  elseif ($dbResult.DataReturnCount -gt 0) { "⚠️ partial" }
                  elseif ($dbResult.RequiresKey) { "🔑 requires_key" }
                  else { "❌ not_working" }
        
        $issues = @()
        if ($dbResult.FailureCount -eq $testBarcodes.Count) {
            $issues += "All queries failed"
        }
        if ($dbResult.NoDataCount -eq $dbResult.SuccessCount -and $dbResult.SuccessCount -gt 0) {
            $issues += "Returns empty data"
        }
        if ($dbResult.RequiresKey) {
            $issues += "API key required"
        }
        
        $report += "| $($db.Name) | $status | ${successRate}% | $dataRate | ${avgTime}ms | $($issues -join '; ') |`n"
    }
    
    $report += "`n"
}

# Save report
$reportPath = "DATABASE_INVESTIGATION_REPORT.md"
$report | Out-File -FilePath $reportPath -Encoding UTF8

Write-Host "Report saved to: $reportPath" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "  Working: $working" -ForegroundColor Green
Write-Host "  Partial: $partial" -ForegroundColor Yellow
Write-Host "  Requires Key: $requiresKey" -ForegroundColor Cyan
Write-Host "  Not Working: $notWorking" -ForegroundColor Red



