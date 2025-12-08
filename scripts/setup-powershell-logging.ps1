# Setup PowerShell Logging for Product Scans
# Configures the environment to capture and display product scan logs

param(
    [string]$LogDirectory = "logs",
    [switch]$Install = $false
)

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  POWERSHELL LOGGING SETUP" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Create log directory
if (-not (Test-Path $LogDirectory)) {
    New-Item -ItemType Directory -Path $LogDirectory -Force | Out-Null
    Write-Host "✅ Created log directory: $LogDirectory" -ForegroundColor Green
} else {
    Write-Host "✅ Log directory exists: $LogDirectory" -ForegroundColor Green
}

# Create log file path
$logFile = Join-Path $LogDirectory "product-scans-$(Get-Date -Format 'yyyy-MM-dd').log"

Write-Host ""
Write-Host "Logging Configuration:" -ForegroundColor Yellow
Write-Host "  Log Directory: $LogDirectory" -ForegroundColor White
Write-Host "  Log File: $logFile" -ForegroundColor White
Write-Host ""

# Create helper script to start monitoring
$monitorScript = @"
# Quick start script for monitoring product scans
# Usage: .\scripts\quick-monitor.ps1

`$logFile = "logs\product-scans-$(Get-Date -Format 'yyyy-MM-dd').log"

Write-Host "Monitoring product scans..." -ForegroundColor Green
Write-Host "Log file: `$logFile" -ForegroundColor Gray
Write-Host ""

if (Test-Path `$logFile) {
    Get-Content `$logFile -Wait -Tail 50 | ForEach-Object {
        `$_ | Format-LogEntry
    }
} else {
    Write-Host "Waiting for log file..." -ForegroundColor Yellow
}
"@

$quickMonitorPath = Join-Path (Split-Path $PSScriptRoot) "scripts\quick-monitor.ps1"
$monitorScript | Out-File -FilePath $quickMonitorPath -Encoding UTF8

Write-Host "✅ Created quick monitor script: $quickMonitorPath" -ForegroundColor Green
Write-Host ""

# Instructions
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  SETUP COMPLETE" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "To monitor product scans:" -ForegroundColor Yellow
Write-Host "  1. Start your app: npx expo start" -ForegroundColor White
Write-Host "  2. Run monitor: .\scripts\monitor-product-scans.ps1" -ForegroundColor White
Write-Host "  3. Or use quick monitor: .\scripts\quick-monitor.ps1" -ForegroundColor White
Write-Host ""
Write-Host "Logs will show:" -ForegroundColor Yellow
Write-Host "  • Databases being queried" -ForegroundColor White
Write-Host "  • Query results from each database" -ForegroundColor White
Write-Host "  • TruScore calculations" -ForegroundColor White
Write-Host "  • Data quality metrics" -ForegroundColor White
Write-Host ""


