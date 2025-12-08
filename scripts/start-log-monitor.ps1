# Start Product Scan Log Monitor
# Monitors React Native/Expo console output and formats for PowerShell

param(
    [string]$LogLevel = "INFO",
    [switch]$ClearScreen = $true
)

# Clear screen if requested
if ($ClearScreen) {
    Clear-Host
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  PRODUCT SCAN LOG MONITOR" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Monitoring product scans in real-time..." -ForegroundColor Yellow
Write-Host "Log Level: $LogLevel" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Ctrl+C to stop monitoring" -ForegroundColor Gray
Write-Host ""

# Function to parse and display logs
function Format-LogEntry {
    param([string]$Line)
    
    # Database query patterns
    if ($Line -match "\[DATABASE\]") {
        $color = "Blue"
        if ($Line -match "✅") { $color = "Green" }
        elseif ($Line -match "❌") { $color = "Red" }
        Write-Host $Line -ForegroundColor $color
        return
    }
    
    # Database result patterns
    if ($Line -match "\[DATABASE_RESULT\]") {
        Write-Host $Line -ForegroundColor "Green"
        return
    }
    
    # TruScore calculation patterns
    if ($Line -match "\[TRUSCORE\]" -or $Line -match "TRUSCORE CALCULATION") {
        Write-Host $Line -ForegroundColor "Cyan"
        return
    }
    
    # Data quality patterns
    if ($Line -match "\[DATA_QUALITY\]" -or $Line -match "Data Quality") {
        Write-Host $Line -ForegroundColor "Yellow"
        return
    }
    
    # Merge patterns
    if ($Line -match "\[MERGE\]" -or $Line -match "Merging") {
        Write-Host $Line -ForegroundColor "Magenta"
        return
    }
    
    # Error patterns
    if ($Line -match "\[ERROR\]" -or $Line -match "ERROR") {
        Write-Host $Line -ForegroundColor "Red"
        return
    }
    
    # Success patterns
    if ($Line -match "✅" -or $Line -match "SUCCESS") {
        Write-Host $Line -ForegroundColor "Green"
        return
    }
    
    # Warning patterns
    if ($Line -match "\[WARN\]" -or $Line -match "⚠️") {
        Write-Host $Line -ForegroundColor "Yellow"
        return
    }
    
    # Section separators
    if ($Line -match "═══════════════════════════════════════════════════════════") {
        Write-Host $Line -ForegroundColor "Cyan"
        return
    }
    
    # Default: show all logs
    Write-Host $Line
}

# Monitor console output
# Note: This script expects logs to be output to console
# For React Native/Expo, logs will appear in the terminal running the app
Write-Host "Waiting for product scan logs..." -ForegroundColor Gray
Write-Host ""

# For development, you can pipe expo/metro logs here
# Example: npx expo start 2>&1 | .\scripts\start-log-monitor.ps1

# If running standalone, show instructions
Write-Host "To monitor logs:" -ForegroundColor Yellow
Write-Host "  1. Run your app: npx expo start" -ForegroundColor White
Write-Host "  2. Or pipe logs: npx expo start 2>&1 | .\scripts\start-log-monitor.ps1" -ForegroundColor White
Write-Host ""

# If input is piped, process it
if ($input) {
    $input | ForEach-Object {
        Format-LogEntry $_
    }
} else {
    # Interactive mode - wait for user input or show help
    Write-Host "No input detected. Run with piped input for real-time monitoring." -ForegroundColor Yellow
}


