# ============================================================================
# COMPLETE iOS BUILD AND SUBMIT SCRIPT
# ============================================================================
# This script:
# 1. Increments iOS build number to 6
# 2. Commits changes with git
# 3. Creates git tag
# 4. Builds iOS production build
# 5. Monitors build progress
# 6. Submits to App Store Connect for TestFlight
# 7. Pushes all changes to remote
# ============================================================================

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  iOS BUILD AND SUBMIT TO TESTFLIGHT" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# STEP 1: PRE-FLIGHT CHECKS
# ============================================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Yellow
Write-Host "  STEP 1: PRE-FLIGHT CHECKS" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Yellow
Write-Host ""

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Cyan
$nodeVersion = node --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Node.js not found. Please install Node.js." -ForegroundColor Red
    exit 1
}
Write-Host "OK: Node.js $nodeVersion" -ForegroundColor Green

# Check EAS CLI
Write-Host "Checking EAS CLI..." -ForegroundColor Cyan
$easVersion = eas --version 2>&1 | Where-Object { $_ -notmatch 'eas-cli@' -and $_ -notmatch 'is now available' }
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: EAS CLI not found. Install with: npm install -g eas-cli" -ForegroundColor Red
    exit 1
}
Write-Host "OK: EAS CLI installed" -ForegroundColor Green

# Check authentication
Write-Host "Checking EAS authentication..." -ForegroundColor Cyan
$whoami = eas whoami 2>&1 | Where-Object { $_ -notmatch 'eas-cli@' -and $_ -notmatch 'is now available' }
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Not authenticated. Please run: eas login" -ForegroundColor Red
    exit 1
}
Write-Host "OK: Authenticated as: $whoami" -ForegroundColor Green

# Check Git
Write-Host "Checking Git..." -ForegroundColor Cyan
$gitVersion = git --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Git not found. Please install Git." -ForegroundColor Red
    exit 1
}
Write-Host "OK: Git installed" -ForegroundColor Green

# ============================================================================
# STEP 2: INCREMENT iOS BUILD NUMBER
# ============================================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Yellow
Write-Host "  STEP 2: INCREMENT iOS BUILD NUMBER TO 6" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "Reading app.config.js..." -ForegroundColor Cyan
$appConfigPath = "app.config.js"
$appConfigContent = Get-Content $appConfigPath -Raw

# Check current build number
if ($appConfigContent -match "buildNumber:\s*['\`"](\d+)['\`"]") {
    $currentBuildNumber = $matches[1]
    Write-Host "Current iOS build number: $currentBuildNumber" -ForegroundColor Gray
} else {
    Write-Host "WARNING: Could not find buildNumber in app.config.js" -ForegroundColor Yellow
    $currentBuildNumber = "5"
}

# Increment to 6
$newBuildNumber = "6"
Write-Host "Setting iOS build number to: $newBuildNumber" -ForegroundColor Cyan

# Replace build number
$appConfigContent = $appConfigContent -replace "buildNumber:\s*['\`"]\d+['\`"]", "buildNumber: '$newBuildNumber'"

# Write updated config
Set-Content -Path $appConfigPath -Value $appConfigContent -NoNewline
Write-Host "OK: iOS build number updated to $newBuildNumber" -ForegroundColor Green

# ============================================================================
# STEP 3: GIT COMMIT AND TAG
# ============================================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Yellow
Write-Host "  STEP 3: GIT COMMIT AND TAG" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Yellow
Write-Host ""

# Get current date for tag
$dateTag = Get-Date -Format "yyyyMMdd"
$tagName = "iOSBuild6_$dateTag"

Write-Host "Staging changes..." -ForegroundColor Cyan
git add app.config.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Git add failed" -ForegroundColor Red
    exit 1
}

Write-Host "Committing changes..." -ForegroundColor Cyan
$commitMessage = "chore: Increment iOS build number to 6 for crash fix testing

- iOS build number: $currentBuildNumber -> $newBuildNumber
- Includes critical camera module lifecycle fixes
- Ready for TestFlight testing on iPhone 11"

git commit -m $commitMessage
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Git commit failed" -ForegroundColor Red
    exit 1
}
Write-Host "OK: Changes committed" -ForegroundColor Green

Write-Host "Creating git tag: $tagName" -ForegroundColor Cyan
git tag -a $tagName -m "iOS Build 6 - Camera crash fixes for TestFlight"
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Git tag creation failed, continuing anyway..." -ForegroundColor Yellow
} else {
    Write-Host "OK: Git tag created: $tagName" -ForegroundColor Green
}

# ============================================================================
# STEP 4: BUILD iOS
# ============================================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Yellow
Write-Host "  STEP 4: BUILDING iOS FOR TESTFLIGHT" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "Starting iOS production build (build number $newBuildNumber)..." -ForegroundColor Cyan
Write-Host "This build will be submitted to App Store Connect for TestFlight" -ForegroundColor Gray
Write-Host ""

$buildOutput = eas build --platform ios --profile production --non-interactive 2>&1
$buildExitCode = $LASTEXITCODE

if ($buildExitCode -eq 0) {
    # Extract build ID from output
    $buildId = $null
    if ($buildOutput -match '([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})') {
        $buildId = $matches[1]
        Write-Host "OK: iOS build started successfully!" -ForegroundColor Green
        Write-Host "   Build ID: $buildId" -ForegroundColor Gray
    } else {
        Write-Host "OK: iOS build started (could not extract build ID)" -ForegroundColor Green
    }
    Write-Host "   View at: https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/builds" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Build is running in the background. Monitoring progress..." -ForegroundColor Cyan
} else {
    Write-Host "ERROR: iOS build failed to start" -ForegroundColor Red
    Write-Host $buildOutput -ForegroundColor Gray
    exit 1
}

# ============================================================================
# STEP 5: MONITOR BUILD
# ============================================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Yellow
Write-Host "  STEP 5: MONITORING BUILD PROGRESS" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "Waiting 15 seconds for build to register..." -ForegroundColor Cyan
Start-Sleep -Seconds 15

$maxWaitTime = 3600 # 60 minutes
$checkInterval = 30 # 30 seconds
$elapsedTime = 0
$buildCompleted = $false
$buildUrl = $null

Write-Host "Monitoring build (checking every 30 seconds, max 60 minutes)..." -ForegroundColor Cyan
Write-Host ""

while ($elapsedTime -lt $maxWaitTime -and -not $buildCompleted) {
    Start-Sleep -Seconds $checkInterval
    $elapsedTime += $checkInterval
    
    Write-Host "[$([math]::Floor($elapsedTime / 60))m $($elapsedTime % 60)s] Checking build status..." -ForegroundColor Gray
    
    $buildsRaw = eas build:list --platform ios --limit 1 --json 2>&1 | Where-Object { $_ -notmatch 'eas-cli@' -and $_ -notmatch 'is now available' }
    try {
        $builds = $buildsRaw | ConvertFrom-Json
        if ($builds -and $builds.Count -gt 0) {
            $latestBuild = $builds[0]
            $status = $latestBuild.status
            
            if ($status -eq "finished") {
                Write-Host "OK: iOS build completed successfully!" -ForegroundColor Green
                $buildCompleted = $true
                $buildUrl = $latestBuild.artifacts.buildUrl
                Write-Host "   Build URL: $buildUrl" -ForegroundColor Gray
                Write-Host "   Build Number: $newBuildNumber" -ForegroundColor Gray
            } elseif ($status -eq "errored" -or $status -eq "canceled") {
                Write-Host "ERROR: iOS build failed with status: $status" -ForegroundColor Red
                Write-Host "   Check: https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/builds" -ForegroundColor Gray
                $buildCompleted = $true
            } else {
                Write-Host "   Status: $status" -ForegroundColor Gray
            }
        }
    } catch {
        Write-Host "   Could not check build status" -ForegroundColor Yellow
    }
    
    Write-Host ""
}

if (-not $buildCompleted) {
    Write-Host "WARNING: Build monitoring timeout (60 minutes)" -ForegroundColor Yellow
    Write-Host "   Build may still be in progress. Check manually:" -ForegroundColor Gray
    Write-Host "   https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/builds" -ForegroundColor Gray
    Write-Host ""
    Write-Host "You can submit manually once build completes:" -ForegroundColor Cyan
    Write-Host "   eas submit --platform ios --latest --non-interactive" -ForegroundColor Gray
}

# ============================================================================
# STEP 6: SUBMIT TO APP STORE CONNECT
# ============================================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Yellow
Write-Host "  STEP 6: SUBMITTING TO APP STORE CONNECT" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Yellow
Write-Host ""

if ($buildCompleted -and $buildUrl) {
    Write-Host "Submitting iOS build to App Store Connect for TestFlight..." -ForegroundColor Cyan
    Write-Host "This will make the app available for testing on iPhone 11" -ForegroundColor Gray
    Write-Host ""
    
    $submitOutput = eas submit --platform ios --latest --non-interactive 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "OK: iOS build submitted to App Store Connect successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "1. Go to App Store Connect: https://appstoreconnect.apple.com" -ForegroundColor Gray
        Write-Host "2. Navigate to your app > TestFlight" -ForegroundColor Gray
        Write-Host "3. Wait for processing to complete (usually 10-30 minutes)" -ForegroundColor Gray
        Write-Host "4. Add the iOS tester in Australia as a TestFlight tester" -ForegroundColor Gray
        Write-Host "5. The tester can install via TestFlight app on iPhone 11" -ForegroundColor Gray
    } else {
        Write-Host "WARNING: iOS submission may have failed" -ForegroundColor Yellow
        Write-Host $submitOutput -ForegroundColor Gray
        Write-Host ""
        Write-Host "You can try submitting manually with:" -ForegroundColor Cyan
        Write-Host "   eas submit --platform ios --latest --non-interactive" -ForegroundColor Gray
    }
} else {
    Write-Host "WARNING: iOS build not completed, skipping submission" -ForegroundColor Yellow
    Write-Host "   You can submit manually once build completes:" -ForegroundColor Gray
    Write-Host "   eas submit --platform ios --latest --non-interactive" -ForegroundColor Gray
}

# ============================================================================
# STEP 7: PUSH TO REMOTE
# ============================================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Yellow
Write-Host "  STEP 7: PUSHING TO REMOTE REPOSITORY" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "Pushing commits to remote..." -ForegroundColor Cyan
git push
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Git push failed" -ForegroundColor Yellow
} else {
    Write-Host "OK: Commits pushed to remote" -ForegroundColor Green
}

Write-Host "Pushing tags to remote..." -ForegroundColor Cyan
git push --tags
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Git tag push failed" -ForegroundColor Yellow
} else {
    Write-Host "OK: Tags pushed to remote" -ForegroundColor Green
}

# ============================================================================
# SUMMARY
# ============================================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  BUILD AND SUBMIT SUMMARY" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "iOS Build:" -ForegroundColor Cyan
Write-Host "   Build Number: $newBuildNumber" -ForegroundColor Gray
if ($buildCompleted) {
    Write-Host "   Status: Completed" -ForegroundColor Green
    if ($buildUrl) {
        Write-Host "   URL: $buildUrl" -ForegroundColor Gray
    }
} else {
    Write-Host "   Status: In Progress or Failed" -ForegroundColor Yellow
}
Write-Host "   View: https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/builds" -ForegroundColor Gray

Write-Host ""
Write-Host "App Store Connect:" -ForegroundColor Cyan
if ($buildCompleted -and $LASTEXITCODE -eq 0) {
    Write-Host "   Status: Submitted" -ForegroundColor Green
    Write-Host "   TestFlight: https://appstoreconnect.apple.com" -ForegroundColor Gray
} else {
    Write-Host "   Status: Pending (build must complete first)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Git Operations:" -ForegroundColor Cyan
Write-Host "   Commit: Created" -ForegroundColor Green
Write-Host "   Tag: $tagName" -ForegroundColor Green
Write-Host "   Push: Completed" -ForegroundColor Green

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  PROCESS COMPLETE" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""













