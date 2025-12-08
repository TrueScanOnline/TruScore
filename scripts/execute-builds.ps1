# Execute EAS builds and capture all output
$ErrorActionPreference = "Continue"
$ProgressPreference = "Continue"

$logFile = "build-execution.log"

function Write-Log {
    param($Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp - $Message" | Tee-Object -FilePath $logFile -Append | Write-Host
}

Write-Log "========================================="
Write-Log "Starting EAS Build Execution"
Write-Log "========================================="
Write-Log ""

# Check EAS CLI
Write-Log "Checking EAS CLI availability..."
try {
    $easVersion = npx eas-cli --version 2>&1
    Write-Log "EAS CLI version: $easVersion"
} catch {
    Write-Log "ERROR: EAS CLI not available: $_"
    exit 1
}

# Check authentication
Write-Log "Checking EAS authentication..."
$whoami = npx eas-cli whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Log "WARNING: Not authenticated. Attempting login..."
    Write-Log "NOTE: Manual login may be required"
    # Don't auto-login as it requires interactive input
} else {
    Write-Log "Authenticated as: $whoami"
}

Write-Log ""
Write-Log "Starting Android build..."
Write-Log "Command: npx eas-cli build --platform android --profile preview --non-interactive"
$androidOutput = npx eas-cli build --platform android --profile preview --non-interactive 2>&1
Write-Log "Android build output:"
$androidOutput | ForEach-Object { Write-Log $_ }
Write-Log "Android build exit code: $LASTEXITCODE"

Write-Log ""
Write-Log "Starting iOS build..."
Write-Log "Command: npx eas-cli build --platform ios --profile preview --non-interactive"
$iosOutput = npx eas-cli build --platform ios --profile preview --non-interactive 2>&1
Write-Log "iOS build output:"
$iosOutput | ForEach-Object { Write-Log $_ }
Write-Log "iOS build exit code: $LASTEXITCODE"

Write-Log ""
Write-Log "Checking build status..."
Start-Sleep -Seconds 10
$buildList = npx eas-cli build:list --platform all --limit 5 2>&1
Write-Log "Recent builds:"
$buildList | ForEach-Object { Write-Log $_ }

Write-Log ""
Write-Log "Build execution complete!"
Write-Log "Check build-execution.log for full details"









