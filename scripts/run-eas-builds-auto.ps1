# Auto-run EAS builds with automatic prompt handling
param(
    [string]$BuildProfile = "preview"
)

$ErrorActionPreference = "Continue"

# Function to run command with auto-yes for prompts
function Invoke-AutoYes {
    param([string]$Command)
    
    # Create a here-string with "y" responses
    $yesInput = "y`n" * 10
    
    $yesInput | & $Command 2>&1
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting EAS Builds (Auto Mode)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check EAS authentication
Write-Host "Checking EAS authentication..." -ForegroundColor Yellow
$whoami = eas whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Not authenticated. Attempting login..." -ForegroundColor Yellow
    # Note: This will require manual login if not already logged in
    eas login
}

# Start Android build
Write-Host ""
Write-Host "Starting Android build..." -ForegroundColor Green
eas build --platform android --profile $BuildProfile --non-interactive

# Start iOS build  
Write-Host ""
Write-Host "Starting iOS build..." -ForegroundColor Green
eas build --platform ios --profile $BuildProfile --non-interactive

Write-Host ""
Write-Host "Builds started! Monitor at:" -ForegroundColor Cyan
Write-Host "https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/builds" -ForegroundColor Yellow














