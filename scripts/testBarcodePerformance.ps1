# PowerShell Test Script for TrueScan Barcode Performance Testing
# 
# This script allows you to test barcode lookups and generate comprehensive logs showing:
# - Performance metrics (time to find product, time to calculate TruScore)
# - Overall performance metrics
# - Which database(s) were used
# - Detailed calculation of each of the 4 pillars
# - Data sources for ingredients, nutrition, allergens & additives, country of origin, score highlights
#
# Usage:
#   Single barcode:   .\scripts\testBarcodePerformance.ps1 -Barcodes "9300633910198"
#   Multiple barcodes: .\scripts\testBarcodePerformance.ps1 -Barcodes "9300633910198","0726684754229","1234567890123"
#
# Example:
#   .\scripts\testBarcodePerformance.ps1 -Barcodes "9300633910198","0726684754229"

param(
    [Parameter(Mandatory=$true)]
    [string[]]$Barcodes,
    
    [Parameter(Mandatory=$false)]
    [switch]$OutputToFile,
    
    [Parameter(Mandatory=$false)]
    [string]$OutputPath = "barcode_test_results.json"
)

# Get script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir

# Check if Node.js is available
try {
    $nodeVersion = node --version
    Write-Host "[OK] Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js not found. Please install Node.js to run this script." -ForegroundColor Red
    exit 1
}

# Check if TypeScript runner is available (MUST use ts-node - tsx CANNOT handle React Native)
# CRITICAL: tsx uses esbuild which fails on React Native code. We MUST use ts-node.
$tsRunner = $null

# Force ts-node - it's the ONLY runner that works with React Native code
# Do NOT use tsx even if it's installed
Write-Host "[INFO] Checking for ts-node (required for React Native compatibility)..." -ForegroundColor Gray

if (Get-Command ts-node -ErrorAction SilentlyContinue) {
    $tsRunner = "ts-node"
    Write-Host "[OK] Using ts-node to run TypeScript" -ForegroundColor Green
} else {
    Write-Host "[WARN] ts-node not found. Installing ts-node and typescript..." -ForegroundColor Yellow
    Write-Host "      NOTE: tsx cannot handle React Native imports - ts-node is required" -ForegroundColor Yellow
    npm install -g ts-node typescript 2>&1 | Out-Null
    
    # Refresh command cache
    $null = Get-Command ts-node -ErrorAction SilentlyContinue
    
    if (Get-Command ts-node -ErrorAction SilentlyContinue) {
        $tsRunner = "ts-node"
        Write-Host "[OK] ts-node installed successfully" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Failed to install ts-node. Please install manually:" -ForegroundColor Red
        Write-Host "       npm install -g ts-node typescript" -ForegroundColor Red
        Write-Host "       Then restart PowerShell and try again." -ForegroundColor Red
        exit 1
    }
}

# Build command arguments
$barcodeArgs = $Barcodes -join " "

# Run the TypeScript test script
Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "[TEST] Testing Barcodes: $($Barcodes -join ', ')" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

$testScriptPath = Join-Path $scriptDir "testBarcodePerformance.ts"

if (-not (Test-Path $testScriptPath)) {
    Write-Host "[ERROR] Test script not found at: $testScriptPath" -ForegroundColor Red
    exit 1
}

# Execute the TypeScript test script
# MUST use ts-node with scripts/tsconfig.json (handles React Native imports)
# Use transpileOnly and skipLibCheck to avoid processing node_modules
# Also set NODE_OPTIONS to disable Node.js v22 type stripping for node_modules
$env:NODE_OPTIONS = "--no-experimental-strip-types"
$tsConfigPath = Join-Path $scriptDir "tsconfig.json"
if (Test-Path $tsConfigPath) {
    Write-Host "[INFO] Using tsconfig: $tsConfigPath" -ForegroundColor Gray
    $output = & $tsRunner --project $tsConfigPath --transpile-only --skip-ignore $testScriptPath $barcodeArgs 2>&1
} else {
    Write-Host "[WARN] scripts/tsconfig.json not found, using default config" -ForegroundColor Yellow
    $output = & $tsRunner --transpile-only --skip-ignore $testScriptPath $barcodeArgs 2>&1
}
# Clean up environment variable
Remove-Item env:NODE_OPTIONS -ErrorAction SilentlyContinue

# Display output
$output

# Save to file if requested
if ($OutputToFile) {
    # Extract JSON from output (everything after "TEST RESULTS (JSON)")
    $jsonStart = $output | Select-String -Pattern "TEST RESULTS \(JSON\)" -Context 0,1000
    if ($jsonStart) {
        $jsonLines = $jsonStart.Context.PostContext | Where-Object { $_ -notmatch "TEST SUMMARY" }
        $jsonContent = $jsonLines -join "`n"
        
        # Try to extract JSON object
        $jsonMatch = [regex]::Match($jsonContent, '\{.*\}', [System.Text.RegularExpressions.RegexOptions]::Singleline)
        if ($jsonMatch.Success) {
            $jsonContent = $jsonMatch.Value
            $jsonContent | Out-File -FilePath $OutputPath -Encoding UTF8
            Write-Host "`n[OK] Results saved to: $OutputPath" -ForegroundColor Green
        }
    }
    
    # Also save full output
    $fullOutputPath = $OutputPath -replace '\.json$', '_full.txt'
    $output | Out-File -FilePath $fullOutputPath -Encoding UTF8
    Write-Host "[OK] Full output saved to: $fullOutputPath" -ForegroundColor Green
}

Write-Host "`n[OK] Test completed!`n" -ForegroundColor Green
