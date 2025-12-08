# Complete Build and Submit Script
# This script runs the entire build process from start to finish
# and submits iOS to App Store Connect

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  TRUESCAN - COMPLETE BUILD AND SUBMIT SCRIPT" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Pre-flight Checks
Write-Host "STEP 1: Pre-flight Checks" -ForegroundColor Yellow
Write-Host "------------------------------------------------------------" -ForegroundColor Gray
Write-Host ""

# Check if in correct directory
if (-not (Test-Path "eas.json")) {
    Write-Host "ERROR: eas.json not found. Please run this script from the project root." -ForegroundColor Red
    exit 1
}
Write-Host "OK: Project directory verified" -ForegroundColor Green

# Check EAS CLI
Write-Host "Checking EAS CLI..." -ForegroundColor Cyan
$easInstalled = Get-Command eas -ErrorAction SilentlyContinue
if (-not $easInstalled) {
    Write-Host "WARNING: EAS CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g eas-cli@latest
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to install EAS CLI" -ForegroundColor Red
        exit 1
    }
    Write-Host "OK: EAS CLI installed" -ForegroundColor Green
} else {
    Write-Host "OK: EAS CLI found" -ForegroundColor Green
    $easVersion = eas --version 2>&1
    Write-Host "   Version: $easVersion" -ForegroundColor Gray
}

# Check authentication
Write-Host "Checking authentication..." -ForegroundColor Cyan
$whoami = eas whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Not authenticated. Please log in:" -ForegroundColor Red
    Write-Host "   Run: eas login" -ForegroundColor Yellow
    exit 1
}
Write-Host "OK: Authenticated as: $whoami" -ForegroundColor Green

# Verify project
Write-Host "Verifying project..." -ForegroundColor Cyan
$projectInfoRaw = eas project:info --json 2>&1
# Filter out EAS CLI version warnings
$projectInfoJson = ($projectInfoRaw | Where-Object { $_ -notmatch 'eas-cli@.*is now available' -and $_ -notmatch 'Proceeding with outdated' -and $_ -notmatch 'System\.Management' }) -join "`n"
$projectInfo = $projectInfoJson | ConvertFrom-Json -ErrorAction SilentlyContinue
if (-not $projectInfo -or $LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Failed to get project info, trying without JSON..." -ForegroundColor Yellow
    $projectInfoRaw2 = eas project:info 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   Attempting to initialize project..." -ForegroundColor Yellow
        eas project:init
    }
}

if ($projectInfo) {
    Write-Host "OK: Project verified:" -ForegroundColor Green
    Write-Host "   Name: $($projectInfo.name)" -ForegroundColor Gray
    Write-Host "   Owner: $($projectInfo.owner)" -ForegroundColor Gray
    Write-Host "   Slug: $($projectInfo.slug)" -ForegroundColor Gray
    $projectUrl = "https://expo.dev/accounts/$($projectInfo.owner)/projects/$($projectInfo.slug)/builds"
    Write-Host "   URL: $projectUrl" -ForegroundColor Cyan
} else {
    Write-Host "WARNING: Could not get project info, continuing anyway..." -ForegroundColor Yellow
    $projectUrl = "https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/builds"
}

Write-Host ""

# Step 2: Start Android Build
Write-Host "============================================================" -ForegroundColor Green
Write-Host "STEP 2: Starting Android Build" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""

Write-Host "Starting Android production build..." -ForegroundColor Yellow
Write-Host "This may take a moment..." -ForegroundColor Gray
Write-Host ""

$androidOutput = eas build --platform android --profile production --non-interactive 2>&1
$androidExitCode = $LASTEXITCODE

if ($androidExitCode -eq 0) {
    Write-Host "OK: Android build started successfully!" -ForegroundColor Green
    
    # Try to extract build ID
    $androidBuildId = $null
    if ($androidOutput -match '([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})') {
        $androidBuildId = $matches[1]
        Write-Host "   Build ID: $androidBuildId" -ForegroundColor Gray
    } else {
        Write-Host "   Build ID: (will be retrieved from build list)" -ForegroundColor Gray
    }
    
    Write-Host "   View at: $projectUrl" -ForegroundColor Cyan
} else {
    Write-Host "ERROR: Android build failed to start!" -ForegroundColor Red
    Write-Host "   Exit Code: $androidExitCode" -ForegroundColor Gray
    Write-Host "   Output:" -ForegroundColor Gray
    $androidOutput | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
    Write-Host ""
    Write-Host "WARNING: Continuing with iOS build..." -ForegroundColor Yellow
}

Write-Host ""

# Step 3: Start iOS Build
Write-Host "============================================================" -ForegroundColor Green
Write-Host "STEP 3: Starting iOS Build" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""

Write-Host "Starting iOS production build..." -ForegroundColor Yellow
Write-Host "This may take a moment..." -ForegroundColor Gray
Write-Host ""

$iosOutput = eas build --platform ios --profile production --non-interactive 2>&1
$iosExitCode = $LASTEXITCODE

if ($iosExitCode -eq 0) {
    Write-Host "OK: iOS build started successfully!" -ForegroundColor Green
    
    # Try to extract build ID
    $iosBuildId = $null
    if ($iosOutput -match '([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})') {
        $iosBuildId = $matches[1]
        Write-Host "   Build ID: $iosBuildId" -ForegroundColor Gray
    } else {
        Write-Host "   Build ID: (will be retrieved from build list)" -ForegroundColor Gray
    }
    
    Write-Host "   View at: $projectUrl" -ForegroundColor Cyan
} else {
    Write-Host "ERROR: iOS build failed to start!" -ForegroundColor Red
    Write-Host "   Exit Code: $iosExitCode" -ForegroundColor Gray
    Write-Host "   Output:" -ForegroundColor Gray
    $iosOutput | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
    Write-Host ""
    Write-Host "ERROR: Cannot continue without iOS build" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 4: Wait and Verify Builds
Write-Host "============================================================" -ForegroundColor Yellow
Write-Host "STEP 4: Waiting for Builds to Register" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "Waiting 15 seconds for builds to register in Expo.dev..." -ForegroundColor Gray
Start-Sleep -Seconds 15

Write-Host "Checking builds..." -ForegroundColor Cyan
$buildsRaw = eas build:list --platform all --limit 10 --json 2>&1
# Filter out EAS CLI version warnings
$buildsJson = ($buildsRaw | Where-Object { $_ -notmatch 'eas-cli@.*is now available' -and $_ -notmatch 'Proceeding with outdated' -and $_ -notmatch 'System\.Management' }) -join "`n"
$builds = $buildsJson | ConvertFrom-Json -ErrorAction SilentlyContinue

if ($builds -and $builds.Count -gt 0) {
    Write-Host "OK: Found $($builds.Count) recent builds:" -ForegroundColor Green
    Write-Host ""
    
    $androidBuilds = $builds | Where-Object { $_.platform -eq "android" } | Sort-Object -Property createdAt -Descending
    $iosBuilds = $builds | Where-Object { $_.platform -eq "ios" } | Sort-Object -Property createdAt -Descending
    
    if ($androidBuilds.Count -gt 0) {
        $latestAndroid = $androidBuilds[0]
        Write-Host "Latest Android Build:" -ForegroundColor Cyan
        Write-Host "   ID: $($latestAndroid.id)" -ForegroundColor Gray
        Write-Host "   Status: $($latestAndroid.status)" -ForegroundColor $(if ($latestAndroid.status -eq "finished") { "Green" } elseif ($latestAndroid.status -eq "errored") { "Red" } else { "Yellow" })
        Write-Host "   Created: $($latestAndroid.createdAt)" -ForegroundColor Gray
        Write-Host ""
    }
    
    if ($iosBuilds.Count -gt 0) {
        $latestIOS = $iosBuilds[0]
        Write-Host "Latest iOS Build:" -ForegroundColor Cyan
        Write-Host "   ID: $($latestIOS.id)" -ForegroundColor Gray
        Write-Host "   Status: $($latestIOS.status)" -ForegroundColor $(if ($latestIOS.status -eq "finished") { "Green" } elseif ($latestIOS.status -eq "errored") { "Red" } else { "Yellow" })
        Write-Host "   Created: $($latestIOS.createdAt)" -ForegroundColor Gray
        Write-Host ""
        
        $iosBuildId = $latestIOS.id
    }
} else {
    Write-Host "WARNING: No builds found yet. They may take a moment to appear." -ForegroundColor Yellow
    Write-Host "   Check manually: $projectUrl" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   Attempting to get iOS build ID from recent output..." -ForegroundColor Gray
}

Write-Host ""

# Step 5: Monitor iOS Build
Write-Host "============================================================" -ForegroundColor Yellow
Write-Host "STEP 5: Monitoring iOS Build" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Yellow
Write-Host ""

if (-not $iosBuildId) {
    Write-Host "WARNING: Could not determine iOS build ID. Attempting to find latest iOS build..." -ForegroundColor Yellow
    $iosBuildsRaw = eas build:list --platform ios --limit 1 --json 2>&1
    # Filter out EAS CLI version warnings
    $iosBuildsJson = ($iosBuildsRaw | Where-Object { $_ -notmatch 'eas-cli@.*is now available' -and $_ -notmatch 'Proceeding with outdated' -and $_ -notmatch 'System\.Management' }) -join "`n"
    $iosBuilds = $iosBuildsJson | ConvertFrom-Json -ErrorAction SilentlyContinue
    
    if ($iosBuilds -and $iosBuilds.Count -gt 0) {
        $iosBuildId = $iosBuilds[0].id
        Write-Host "OK: Found iOS build ID: $iosBuildId" -ForegroundColor Green
    } else {
        # Try non-JSON approach
        Write-Host "   Trying alternative method to find iOS build..." -ForegroundColor Gray
        $iosBuildsText = eas build:list --platform ios --limit 1 2>&1
        if ($iosBuildsText -match '([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})') {
            $iosBuildId = $matches[1]
            Write-Host "OK: Found iOS build ID: $iosBuildId" -ForegroundColor Green
        } else {
            Write-Host "ERROR: Could not find iOS build. Please check Expo.dev manually." -ForegroundColor Red
            Write-Host "   URL: $projectUrl" -ForegroundColor Cyan
            Write-Host "   You can submit manually with: eas submit --platform ios --latest" -ForegroundColor Yellow
            exit 1
        }
    }
}

Write-Host "Monitoring iOS build: $iosBuildId" -ForegroundColor Cyan
Write-Host "Checking every 30 seconds (max 60 minutes)..." -ForegroundColor Gray
Write-Host ""

$maxWaitMinutes = 60
$checkIntervalSeconds = 30
$elapsedMinutes = 0
$buildFinished = $false

while ($elapsedMinutes -lt $maxWaitMinutes -and -not $buildFinished) {
    Start-Sleep -Seconds $checkIntervalSeconds
    $elapsedMinutes += ($checkIntervalSeconds / 60)
    
    $buildInfoRaw = eas build:view $iosBuildId --json 2>&1
    # Filter out EAS CLI version warnings
    $buildInfoJson = ($buildInfoRaw | Where-Object { $_ -notmatch 'eas-cli@.*is now available' -and $_ -notmatch 'Proceeding with outdated' -and $_ -notmatch 'System\.Management' }) -join "`n"
    $buildInfo = $buildInfoJson | ConvertFrom-Json -ErrorAction SilentlyContinue
    
    if ($buildInfo) {
        $status = $buildInfo.status
        Write-Host "   Status: $status (elapsed: $([math]::Round($elapsedMinutes, 1)) min)" -ForegroundColor Gray
        
        if ($status -eq "finished") {
            Write-Host ""
            Write-Host "OK: iOS build completed successfully!" -ForegroundColor Green
            $buildFinished = $true
        } elseif ($status -eq "errored" -or $status -eq "canceled") {
            Write-Host ""
            Write-Host "ERROR: iOS build failed with status: $status" -ForegroundColor Red
            Write-Host "   View details: $projectUrl" -ForegroundColor Cyan
            exit 1
        }
    } else {
        Write-Host "   Could not get build status, retrying..." -ForegroundColor Yellow
    }
}

if (-not $buildFinished) {
    Write-Host ""
    Write-Host "Timeout waiting for iOS build (60 minutes)" -ForegroundColor Yellow
    Write-Host "   Build may still be in progress. Check manually:" -ForegroundColor Gray
    Write-Host "   $projectUrl" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   You can submit manually when build completes:" -ForegroundColor Yellow
    Write-Host "   eas submit --platform ios --id $iosBuildId" -ForegroundColor Cyan
    exit 0
}

Write-Host ""

# Step 6: Submit iOS to App Store Connect
Write-Host "============================================================" -ForegroundColor Green
Write-Host "STEP 6: Submitting iOS to App Store Connect" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""

Write-Host "Submitting iOS build to App Store Connect..." -ForegroundColor Yellow
Write-Host "Build ID: $iosBuildId" -ForegroundColor Gray
Write-Host ""

$submitOutput = eas submit --platform ios --id $iosBuildId --non-interactive 2>&1
$submitExitCode = $LASTEXITCODE

if ($submitExitCode -eq 0) {
    Write-Host ""
    Write-Host "OK: iOS build submitted to App Store Connect successfully!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "ERROR: Failed to submit iOS build" -ForegroundColor Red
    Write-Host "   Exit Code: $submitExitCode" -ForegroundColor Gray
    Write-Host "   Output:" -ForegroundColor Gray
    $submitOutput | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
    Write-Host ""
    Write-Host "   You can try submitting manually:" -ForegroundColor Yellow
    Write-Host "   eas submit --platform ios --id $iosBuildId" -ForegroundColor Cyan
}

Write-Host ""

# Final Summary
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "BUILD SUMMARY" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Android Build:" -ForegroundColor Yellow
Write-Host "  Status: $(if ($androidExitCode -eq 0) { 'OK: Started' } else { 'ERROR: Failed' })" -ForegroundColor $(if ($androidExitCode -eq 0) { 'Green' } else { 'Red' })
if ($androidBuildId) {
    Write-Host "  Build ID: $androidBuildId" -ForegroundColor Gray
}
Write-Host "  View: $projectUrl" -ForegroundColor Cyan
Write-Host ""

Write-Host "iOS Build:" -ForegroundColor Yellow
Write-Host "  Status: $(if ($buildFinished) { 'OK: Completed and Submitted' } else { 'In Progress' })" -ForegroundColor $(if ($buildFinished) { 'Green' } else { 'Yellow' })
Write-Host "  Build ID: $iosBuildId" -ForegroundColor Gray
Write-Host "  View: $projectUrl" -ForegroundColor Cyan
if ($submitExitCode -eq 0) {
    Write-Host "  App Store Connect: OK: Submitted" -ForegroundColor Green
} else {
    Write-Host "  App Store Connect: WARNING: Submission failed or pending" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "PROCESS COMPLETE!" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Check Expo.dev: $projectUrl" -ForegroundColor Cyan
Write-Host "2. Check App Store Connect: https://appstoreconnect.apple.com" -ForegroundColor Cyan
Write-Host "3. Complete app submission in App Store Connect" -ForegroundColor Gray
Write-Host ""
