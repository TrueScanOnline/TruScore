# Submit Latest iOS Build to App Store Connect
# This script finds the latest completed iOS build and submits it

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  SUBMIT LATEST iOS BUILD TO APP STORE CONNECT" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Check authentication
Write-Host "Checking authentication..." -ForegroundColor Cyan
$whoami = eas whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Not authenticated. Please run: eas login" -ForegroundColor Red
    exit 1
}
Write-Host "OK: Authenticated as: $whoami" -ForegroundColor Green
Write-Host ""

# Get latest iOS builds
Write-Host "Finding latest iOS builds..." -ForegroundColor Cyan
$iosBuildsRaw = eas build:list --platform ios --limit 5 2>&1

# Filter out EAS CLI warnings and extract build info
$iosBuilds = @()
$iosBuildsRaw | ForEach-Object {
    $line = $_
    if ($line -match '([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})') {
        $buildId = $matches[1]
        $status = "unknown"
        if ($line -match '(finished|in-progress|in_queue|errored|canceled)') {
            $status = $matches[1]
        }
        $iosBuilds += @{
            id = $buildId
            status = $status
            line = $line
        }
    }
}

if ($iosBuilds.Count -eq 0) {
    Write-Host "ERROR: No iOS builds found" -ForegroundColor Red
    Write-Host "   Check: https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/builds" -ForegroundColor Cyan
    exit 1
}

Write-Host "Found $($iosBuilds.Count) iOS builds:" -ForegroundColor Green
$iosBuilds | ForEach-Object {
    $statusColor = if ($_.status -eq "finished") { "Green" } elseif ($_.status -eq "errored") { "Red" } else { "Yellow" }
    Write-Host "   $($_.id) - $($_.status)" -ForegroundColor $statusColor
}
Write-Host ""

# Find latest finished build
$latestFinished = $iosBuilds | Where-Object { $_.status -eq "finished" } | Select-Object -First 1

if (-not $latestFinished) {
    Write-Host "WARNING: No finished iOS builds found" -ForegroundColor Yellow
    Write-Host "   Latest build status: $($iosBuilds[0].status)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Options:" -ForegroundColor Yellow
    Write-Host "   1. Wait for build to finish" -ForegroundColor Gray
    Write-Host "   2. Submit manually: eas submit --platform ios --latest" -ForegroundColor Cyan
    exit 0
}

$iosBuildId = $latestFinished.id
Write-Host "Using latest finished iOS build:" -ForegroundColor Green
Write-Host "   Build ID: $iosBuildId" -ForegroundColor Gray
Write-Host "   Status: finished" -ForegroundColor Green
Write-Host ""

# Submit to App Store Connect
Write-Host "============================================================" -ForegroundColor Green
Write-Host "Submitting iOS Build to App Store Connect" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""

Write-Host "Submitting build $iosBuildId..." -ForegroundColor Yellow
$submitOutput = eas submit --platform ios --id $iosBuildId --non-interactive 2>&1
$submitExitCode = $LASTEXITCODE

if ($submitExitCode -eq 0) {
    Write-Host ""
    Write-Host "OK: iOS build submitted to App Store Connect successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Check App Store Connect: https://appstoreconnect.apple.com" -ForegroundColor Cyan
    Write-Host "2. Verify the build appears in your app version" -ForegroundColor Gray
    Write-Host "3. Complete the submission process" -ForegroundColor Gray
} else {
    Write-Host "ERROR: Failed to submit iOS build" -ForegroundColor Red
    Write-Host "   Exit Code: $submitExitCode" -ForegroundColor Gray
    Write-Host "   Output:" -ForegroundColor Gray
    $submitOutput | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
    Write-Host ""
    Write-Host "   Try submitting manually:" -ForegroundColor Yellow
    Write-Host "   eas submit --platform ios --id $iosBuildId" -ForegroundColor Cyan
}

Write-Host ""
