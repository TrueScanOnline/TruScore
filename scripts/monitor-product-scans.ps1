# PowerShell script to monitor and display product scan logs
# Captures console output from React Native/Expo and formats for PowerShell

param(
    [string]$LogFile = "product-scans.log",
    [switch]$Follow = $true,
    [switch]$Color = $true
)

# Color functions for PowerShell
function Write-ColorLog {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    
    switch ($Level) {
        "DEBUG" { $color = "Cyan" }
        "INFO" { $color = "Blue" }
        "SUCCESS" { $color = "Green" }
        "WARN" { $color = "Yellow" }
        "ERROR" { $color = "Red" }
        default { $color = "White" }
    }
    
    if ($Color) {
        Write-Host "[$timestamp] " -NoNewline -ForegroundColor Gray
        Write-Host "[$Level] " -NoNewline -ForegroundColor $color
        Write-Host $Message
    } else {
        Write-Host "[$timestamp] [$Level] $Message"
    }
}

# Parse log line and extract information
function Parse-LogLine {
    param([string]$Line)
    
    # Pattern matching for different log types
    if ($Line -match "TRUSCORE DATABASE QUERY") {
        Write-ColorLog "═══════════════════════════════════════════════════════════" "INFO"
        Write-ColorLog "🔍 DATABASE QUERY STARTED" "INFO"
        if ($Line -match "(\d+)") {
            Write-ColorLog "Barcode: $($matches[1])" "INFO"
        }
    }
    elseif ($Line -match "PHASE (\d+)") {
        Write-ColorLog "📊 Phase $($matches[1]) Starting..." "INFO"
    }
    elseif ($Line -match "Found: (\d+)") {
        Write-ColorLog "✅ Products Found: $($matches[1])" "SUCCESS"
    }
    elseif ($Line -match "TOTAL DATABASES QUERIED") {
        Write-ColorLog "═══════════════════════════════════════════════════════════" "SUCCESS"
        Write-ColorLog "✅ DATABASE QUERY COMPLETE" "SUCCESS"
    }
    elseif ($Line -match "TRUSCORE-OPTIMIZED DATABASE QUERY") {
        Write-ColorLog "═══════════════════════════════════════════════════════════" "INFO"
        Write-ColorLog "🔍 TRUSCORE-OPTIMIZED QUERY" "INFO"
    }
    elseif ($Line -match "TruScore Calculated") {
        Write-ColorLog "═══════════════════════════════════════════════════════════" "SUCCESS"
        Write-ColorLog "🎯 TRUSCORE CALCULATION" "SUCCESS"
        if ($Line -match "(\d+)/100") {
            Write-ColorLog "Score: $($matches[1])/100" "SUCCESS"
        }
    }
    elseif ($Line -match "Data Quality Assessment") {
        Write-ColorLog "📊 DATA QUALITY ASSESSMENT" "INFO"
    }
    elseif ($Line -match "Merged (\d+) products") {
        Write-ColorLog "🔄 MERGE: $($matches[1]) products merged" "SUCCESS"
    }
    elseif ($Line -match "\[DATABASE\]") {
        Write-ColorLog $Line "INFO"
    }
    elseif ($Line -match "\[DATABASE_RESULT\]") {
        Write-ColorLog $Line "SUCCESS"
    }
    elseif ($Line -match "\[TRUSCORE\]") {
        Write-ColorLog $Line "SUCCESS"
    }
    elseif ($Line -match "\[DATA_QUALITY\]") {
        Write-ColorLog $Line "INFO"
    }
    elseif ($Line -match "\[ERROR\]") {
        Write-ColorLog $Line "ERROR"
    }
    else {
        # Default: show all logs
        Write-Host $Line
    }
}

# Main monitoring function
function Start-ProductScanMonitor {
    Write-Host ""
    Write-ColorLog "═══════════════════════════════════════════════════════════" "INFO"
    Write-ColorLog "  PRODUCT SCAN LOG MONITOR" "INFO"
    Write-ColorLog "═══════════════════════════════════════════════════════════" "INFO"
    Write-Host ""
    Write-ColorLog "Monitoring product scans..." "INFO"
    Write-ColorLog "Log file: $LogFile" "INFO"
    Write-Host ""
    
    if ($Follow) {
        Write-ColorLog "Following logs (Ctrl+C to stop)..." "INFO"
        Write-Host ""
        
        # Monitor log file if it exists
        if (Test-Path $LogFile) {
            Get-Content $LogFile -Wait -Tail 0 | ForEach-Object {
                Parse-LogLine $_
            }
        } else {
            Write-ColorLog "Log file not found. Waiting for logs..." "WARN"
            Write-ColorLog "Make sure the app is running and logging to: $LogFile" "INFO"
        }
    } else {
        # Show existing logs
        if (Test-Path $LogFile) {
            Get-Content $LogFile | ForEach-Object {
                Parse-LogLine $_
            }
        } else {
            Write-ColorLog "Log file not found: $LogFile" "ERROR"
        }
    }
}

# Start monitoring
Start-ProductScanMonitor


