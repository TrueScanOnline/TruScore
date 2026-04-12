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
#   From text file (one barcode per line): .\scripts\testBarcodePerformance.ps1 -InputFile ".\barcodes\barcodes-88.txt"
#   Writes JSON + a single shareable HTML page (same name, .html next to .json) unless you add --no-html via ts-node.
#
# Example:
#   .\scripts\testBarcodePerformance.ps1 -Barcodes "9300633910198","0726684754229"

param(
    [Parameter(Mandatory=$false)]
    [string[]]$Barcodes = @(),

    [Parameter(Mandatory=$false)]
    [string]$InputFile = "",

    [Parameter(Mandatory=$false)]
    [string]$OutputPath = "reports\test_results.json",

    [Parameter(Mandatory=$false)]
    [switch]$OutputToFile
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

# Build command arguments - ensure each barcode is a separate argument
$barcodeArgs = @()
foreach ($barcode in $Barcodes) {
    $cleanBarcode = $barcode.ToString().Trim()
    if ($cleanBarcode -ne '') {
        $barcodeArgs += $cleanBarcode
    }
}

$useInputFile = $false
$resolvedInputFile = $null
if ($InputFile -ne "" -and $InputFile.Trim() -ne "") {
    $resolvedInputFile = if ([System.IO.Path]::IsPathRooted($InputFile)) { $InputFile } else { Join-Path $projectRoot $InputFile }
    if (-not (Test-Path $resolvedInputFile)) {
        Write-Host "[ERROR] Input file not found: $resolvedInputFile" -ForegroundColor Red
        exit 1
    }
    $useInputFile = $true
}

if (-not $useInputFile -and $barcodeArgs.Count -eq 0) {
    Write-Host "[ERROR] Provide -Barcodes and/or -InputFile (one barcode per line in the file)." -ForegroundColor Red
    exit 1
}

# Run the TypeScript test script
Write-Host "`n================================================" -ForegroundColor Cyan
if ($useInputFile) {
    Write-Host "[TEST] Input file: $resolvedInputFile" -ForegroundColor Cyan
    $lineCount = (Get-Content -Path $resolvedInputFile | Where-Object { $_.Trim() -ne '' -and -not $_.Trim().StartsWith('#') }).Count
    Write-Host "[TEST] Non-empty lines (barcodes): $lineCount" -ForegroundColor Cyan
} else {
    Write-Host "[TEST] Testing Barcodes: $($Barcodes -join ', ')" -ForegroundColor Cyan
    Write-Host "Barcodes Count: $($barcodeArgs.Count)" -ForegroundColor Cyan
}
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
# CRITICAL: Pass barcodes as separate arguments after the script path
$env:NODE_OPTIONS = "--no-experimental-strip-types"
$tsConfigPath = Join-Path $scriptDir "tsconfig.json"

# Resolve output path (JSON report) — under project root if relative
$resolvedOutputPath = if ([System.IO.Path]::IsPathRooted($OutputPath)) { $OutputPath } else { Join-Path $projectRoot $OutputPath }

# Build arguments - ts-node options first, then script, then flags / barcodes
$tsArgs = @()
if (Test-Path $tsConfigPath) {
    Write-Host "[INFO] Using tsconfig: $tsConfigPath" -ForegroundColor Gray
    $tsArgs = @('--project', $tsConfigPath, '--transpile-only', '--skip-ignore', $testScriptPath)
} else {
    Write-Host "[WARN] scripts/tsconfig.json not found, using default config" -ForegroundColor Yellow
    $tsArgs = @('--transpile-only', '--skip-ignore', $testScriptPath)
}

if ($useInputFile) {
    $tsArgs += @('--file', $resolvedInputFile, '--out', $resolvedOutputPath)
    $tsArgs += $barcodeArgs
} else {
    $tsArgs += $barcodeArgs
}

$output = & $tsRunner @tsArgs 2>&1
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
            $jsonContent | Out-File -FilePath $resolvedOutputPath -Encoding UTF8
            Write-Host "`n[OK] Results saved to: $resolvedOutputPath" -ForegroundColor Green
        }
    }
    
    # Also save full output
    $fullOutputPath = $resolvedOutputPath -replace '\.json$', '_full.txt'
    $output | Out-File -FilePath $fullOutputPath -Encoding UTF8
    Write-Host "[OK] Full output saved to: $fullOutputPath" -ForegroundColor Green
}

Write-Host "`n[OK] Test completed!`n" -ForegroundColor Green
