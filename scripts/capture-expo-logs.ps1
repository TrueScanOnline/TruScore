# Capture Expo/Metro Bundler logs and format for PowerShell
# This script captures console output from Expo and formats it for clear viewing

param(
    [switch]$SaveToFile = $false,
    [string]$LogFile = "logs\expo-$(Get-Date -Format 'yyyy-MM-dd-HHmmss').log"
)

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  EXPO LOG CAPTURE & MONITOR" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "This script will capture and format Expo/Metro logs" -ForegroundColor Yellow
Write-Host ""

# Create logs directory
if (-not (Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs" -Force | Out-Null
}

# Function to format log lines
function Format-ExpoLog {
    param([string]$Line)
    
    # Skip empty lines
    if ([string]::IsNullOrWhiteSpace($Line)) {
        return
    }
    
    # Database query patterns
    if ($Line -match "\[DATABASE\]" -or $Line -match "DATABASE QUERY") {
        if ($Line -match "Querying") {
            Write-Host $Line -ForegroundColor Blue
        } elseif ($Line -match "✅" -or $Line -match "Found") {
            Write-Host $Line -ForegroundColor Green
        } elseif ($Line -match "❌" -or $Line -match "Error") {
            Write-Host $Line -ForegroundColor Red
        } else {
            Write-Host $Line -ForegroundColor Cyan
        }
        return
    }
    
    # Database result patterns
    if ($Line -match "\[DATABASE_RESULT\]" -or $Line -match "DATABASE_RESULT") {
        Write-Host $Line -ForegroundColor Green
        return
    }
    
    # TruScore patterns
    if ($Line -match "\[TRUSCORE\]" -or $Line -match "TRUSCORE" -or $Line -match "TruScore") {
        Write-Host $Line -ForegroundColor Cyan
        return
    }
    
    # Data quality patterns
    if ($Line -match "\[DATA_QUALITY\]" -or $Line -match "Data Quality" -or $Line -match "Completeness") {
        Write-Host $Line -ForegroundColor Yellow
        return
    }
    
    # Merge patterns
    if ($Line -match "\[MERGE\]" -or $Line -match "Merging" -or $Line -match "Merged") {
        Write-Host $Line -ForegroundColor Magenta
        return
    }
    
    # Phase patterns
    if ($Line -match "PHASE" -or $Line -match "Phase") {
        Write-Host $Line -ForegroundColor Blue
        return
    }
    
    # Success patterns
    if ($Line -match "✅" -or $Line -match "SUCCESS") {
        Write-Host $Line -ForegroundColor Green
        return
    }
    
    # Error patterns
    if ($Line -match "\[ERROR\]" -or $Line -match "ERROR" -or $Line -match "❌") {
        Write-Host $Line -ForegroundColor Red
        return
    }
    
    # Warning patterns
    if ($Line -match "\[WARN\]" -or $Line -match "WARN" -or $Line -match "⚠️") {
        Write-Host $Line -ForegroundColor Yellow
        return
    }
    
    # Section separators
    if ($Line -match "═══════════════════════════════════════════════════════════" -or $Line -match "═══") {
        Write-Host $Line -ForegroundColor Cyan
        return
    }
    
    # Product scan patterns
    if ($Line -match "PRODUCT SCAN" -or $Line -match "🔍") {
        Write-Host $Line -ForegroundColor Cyan
        return
    }
    
    # Default: show all logs
    Write-Host $Line
}

Write-Host "Instructions:" -ForegroundColor Yellow
Write-Host "  1. Start Expo in another terminal: npx expo start" -ForegroundColor White
Write-Host "  2. This script will format the logs as they appear" -ForegroundColor White
Write-Host "  3. Scan a product in the app to see logs" -ForegroundColor White
Write-Host ""
Write-Host "Waiting for Expo logs..." -ForegroundColor Gray
Write-Host ""

# If input is piped, process it
if ($input) {
    $input | ForEach-Object {
        $line = $_
        Format-ExpoLog $line
        if ($SaveToFile) {
            Add-Content -Path $LogFile -Value $line
        }
    }
} else {
    Write-Host "No input detected." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To capture Expo logs, run:" -ForegroundColor Yellow
    Write-Host "  npx expo start 2>&1 | .\scripts\capture-expo-logs.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "Or to save to file:" -ForegroundColor Yellow
    Write-Host "  npx expo start 2>&1 | .\scripts\capture-expo-logs.ps1 -SaveToFile" -ForegroundColor White
}


