# Schedule FSANZ Deployment Script
# This can be set up as a scheduled task or triggered automatically

# Usage:
#   - Run manually: .\scheduleFSANZDeployment.ps1
#   - Schedule in Task Scheduler: Run daily/weekly
#   - Trigger on Git push: Use GitHub Actions or similar

param(
    [string]$Schedule = "manual"  # manual, daily, weekly
)

$ScriptPath = Join-Path $PSScriptRoot "deployFSANZAutomated.ps1"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FSANZ Deployment Scheduler" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($Schedule -eq "manual") {
    Write-Host "Running deployment now..." -ForegroundColor Yellow
    & $ScriptPath
} elseif ($Schedule -eq "daily") {
    Write-Host "Setting up daily deployment..." -ForegroundColor Yellow
    # This would set up a Windows Task Scheduler task
    # For now, just run it
    & $ScriptPath
} elseif ($Schedule -eq "weekly") {
    Write-Host "Setting up weekly deployment..." -ForegroundColor Yellow
    # This would set up a Windows Task Scheduler task
    # For now, just run it
    & $ScriptPath
} else {
    Write-Host "Unknown schedule: $Schedule" -ForegroundColor Red
    Write-Host "Usage: .\scheduleFSANZDeployment.ps1 [-Schedule manual|daily|weekly]" -ForegroundColor Yellow
}
