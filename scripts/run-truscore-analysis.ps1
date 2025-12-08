# TruScore Analysis Runner
# Wraps the TypeScript analysis script for easy PowerShell usage
#
# Usage:
#   .\scripts\run-truscore-analysis.ps1 -Barcodes "9420020300194","1234567890123"
#   .\scripts\run-truscore-analysis.ps1 -BarcodesFile "barcodes.txt"

param(
    [Parameter(Mandatory=$false)]
    [string[]]$Barcodes = @(),
    
    [Parameter(Mandatory=$false)]
    [string]$BarcodesFile = ""
)

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath
Set-Location $projectRoot

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  TruScore Analysis Tool" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Prepare barcodes
$barcodeList = @()
if ($Barcodes.Count -gt 0) {
    $barcodeList = $Barcodes
} elseif ($BarcodesFile -ne "" -and (Test-Path $BarcodesFile)) {
    $barcodeList = Get-Content $BarcodesFile | Where-Object { $_.Trim() -ne "" }
} else {
    Write-Host "❌ No barcodes provided. Use -Barcodes or -BarcodesFile parameter." -ForegroundColor Red
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\scripts\run-truscore-analysis.ps1 -Barcodes '9420020300194','1234567890123'"
    Write-Host "  .\scripts\run-truscore-analysis.ps1 -BarcodesFile 'barcodes.txt'"
    exit 1
}

# Build command
$barcodeArgs = $barcodeList -join " "

Write-Host "Running analysis for $($barcodeList.Count) barcode(s)..." -ForegroundColor Yellow
Write-Host ""

# Run the TypeScript script
npm run analyze-truscore -- $barcodeArgs

Write-Host ""
Write-Host "✅ Analysis complete!" -ForegroundColor Green
Write-Host ""

