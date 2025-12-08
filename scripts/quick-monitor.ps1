# Quick Monitor Script for Product Scans
# Simple script to monitor product scan logs in real-time

$logFile = "logs\product-scans-$(Get-Date -Format 'yyyy-MM-dd').log"

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  PRODUCT SCAN LOG MONITOR" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Monitoring product scans..." -ForegroundColor Yellow
Write-Host "Log file: $logFile" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

# Function to format log entries
function Format-LogEntry {
    param([string]$Line)
    
    # Database queries
    if ($Line -match "\[DATABASE\]") {
        if ($Line -match "✅") {
            Write-Host $Line -ForegroundColor Green
        } elseif ($Line -match "❌") {
            Write-Host $Line -ForegroundColor Red
        } else {
            Write-Host $Line -ForegroundColor Blue
        }
        return
    }
    
    # Database results
    if ($Line -match "\[DATABASE_RESULT\]") {
        Write-Host $Line -ForegroundColor Green
        return
    }
    
    # TruScore
    if ($Line -match "\[TRUSCORE\]" -or $Line -match "TRUSCORE") {
        Write-Host $Line -ForegroundColor Cyan
        return
    }
    
    # Data quality
    if ($Line -match "\[DATA_QUALITY\]") {
        Write-Host $Line -ForegroundColor Yellow
        return
    }
    
    # Merge
    if ($Line -match "\[MERGE\]") {
        Write-Host $Line -ForegroundColor Magenta
        return
    }
    
    # Errors
    if ($Line -match "\[ERROR\]" -or $Line -match "ERROR") {
        Write-Host $Line -ForegroundColor Red
        return
    }
    
    # Success
    if ($Line -match "✅" -or $Line -match "SUCCESS") {
        Write-Host $Line -ForegroundColor Green
        return
    }
    
    # Warnings
    if ($Line -match "\[WARN\]" -or $Line -match "⚠️") {
        Write-Host $Line -ForegroundColor Yellow
        return
    }
    
    # Section separators
    if ($Line -match "═══════════════════════════════════════════════════════════") {
        Write-Host $Line -ForegroundColor Cyan
        return
    }
    
    # Default
    Write-Host $Line
}

# Create logs directory if it doesn't exist
if (-not (Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs" -Force | Out-Null
}

# Monitor log file
if (Test-Path $logFile) {
    Get-Content $logFile -Wait -Tail 0 | ForEach-Object {
        Format-LogEntry $_
    }
} else {
    Write-Host "Waiting for log file: $logFile" -ForegroundColor Yellow
    Write-Host "Start your app and scan a product to see logs" -ForegroundColor Gray
    Write-Host ""
    
    # Wait for file to be created
    while (-not (Test-Path $logFile)) {
        Start-Sleep -Seconds 1
    }
    
    # Once file exists, start monitoring
    Get-Content $logFile -Wait -Tail 0 | ForEach-Object {
        Format-LogEntry $_
    }
}


