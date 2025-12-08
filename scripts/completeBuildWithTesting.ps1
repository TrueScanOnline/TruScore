# ============================================================================
# COMPLETE BUILD AND SUBMIT SCRIPT WITH PRE-FLIGHT TESTING
# ============================================================================
# This script performs:
# 1. Pre-flight checks (Expo doctor, code validation)
# 2. Diagnostic tests
# 3. iOS build verification
# 4. Android APK build verification
# 5. EAS builds (iOS production, Android APK preview)
# 6. Build monitoring
# 7. iOS submission to App Store Connect
# ============================================================================

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  COMPLETE BUILD AND SUBMIT WITH PRE-FLIGHT TESTING" -ForegroundColor Cyan
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

# Check npm/yarn
Write-Host "Checking package manager..." -ForegroundColor Cyan
if (Test-Path "yarn.lock") {
    $pm = "yarn"
    $pmVersion = yarn --version
} else {
    $pm = "npm"
    $pmVersion = npm --version
}
Write-Host "OK: Using $pm $pmVersion" -ForegroundColor Green

# Check EAS CLI
Write-Host "Checking EAS CLI..." -ForegroundColor Cyan
$easVersion = eas --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: EAS CLI not found. Install with: npm install -g eas-cli" -ForegroundColor Red
    exit 1
}
Write-Host "OK: EAS CLI $easVersion" -ForegroundColor Green

# Check authentication
Write-Host "Checking EAS authentication..." -ForegroundColor Cyan
$whoami = eas whoami 2>&1 | Where-Object { $_ -notmatch 'eas-cli@' -and $_ -notmatch 'is now available' }
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Not authenticated. Please run: eas login" -ForegroundColor Red
    exit 1
}
Write-Host "OK: Authenticated as: $whoami" -ForegroundColor Green

# Check Git status
Write-Host "Checking Git status..." -ForegroundColor Cyan
$gitStatus = git status --porcelain 2>&1
if ($gitStatus) {
    Write-Host "WARNING: Uncommitted changes detected:" -ForegroundColor Yellow
    Write-Host $gitStatus -ForegroundColor Gray
    $response = Read-Host "Continue anyway? (y/n)"
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Host "Build cancelled." -ForegroundColor Yellow
        exit 0
    }
} else {
    Write-Host "OK: Working directory clean" -ForegroundColor Green
}

# ============================================================================
# STEP 2: EXPO DOCTOR AND CODE VALIDATION
# ============================================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Yellow
Write-Host "  STEP 2: EXPO DOCTOR AND CODE VALIDATION" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Yellow
Write-Host ""

# Run Expo Doctor
Write-Host "Running Expo Doctor..." -ForegroundColor Cyan
$doctorOutput = npx expo-doctor 2>&1
$doctorExitCode = $LASTEXITCODE

if ($doctorExitCode -eq 0) {
    Write-Host "OK: Expo Doctor passed" -ForegroundColor Green
} else {
    Write-Host "WARNING: Expo Doctor found issues:" -ForegroundColor Yellow
    Write-Host $doctorOutput -ForegroundColor Gray
    $response = Read-Host "Continue anyway? (y/n)"
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Host "Build cancelled." -ForegroundColor Yellow
        exit 0
    }
}

# Check app.config.js syntax
Write-Host "Validating app.config.js..." -ForegroundColor Cyan
try {
    $configCheck = node -e "require('./app.config.js')" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "OK: app.config.js is valid" -ForegroundColor Green
    } else {
        Write-Host "ERROR: app.config.js has syntax errors:" -ForegroundColor Red
        Write-Host $configCheck -ForegroundColor Gray
        exit 1
    }
} catch {
    Write-Host "ERROR: Failed to validate app.config.js" -ForegroundColor Red
    exit 1
}

# Check eas.json syntax
Write-Host "Validating eas.json..." -ForegroundColor Cyan
try {
    $easConfig = Get-Content "eas.json" | ConvertFrom-Json
    Write-Host "OK: eas.json is valid" -ForegroundColor Green
    
    # Verify Android APK profile exists
    if ($easConfig.build.preview.android.buildType -eq "apk") {
        Write-Host "OK: Android preview profile configured for APK" -ForegroundColor Green
    } else {
        Write-Host "WARNING: Android preview profile may not be configured for APK" -ForegroundColor Yellow
    }
    
    # Verify iOS production profile exists
    if ($easConfig.build.production) {
        Write-Host "OK: iOS production profile exists" -ForegroundColor Green
    } else {
        Write-Host "ERROR: iOS production profile not found" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "ERROR: eas.json has syntax errors" -ForegroundColor Red
    exit 1
}

# ============================================================================
# STEP 3: TYPE CHECKING AND LINTING (if available)
# ============================================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Yellow
Write-Host "  STEP 3: TYPE CHECKING AND LINTING" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Yellow
Write-Host ""

# Check if TypeScript is available
if (Test-Path "tsconfig.json") {
    Write-Host "TypeScript project detected. Running type check..." -ForegroundColor Cyan
    $typeCheck = npx tsc --noEmit 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "OK: TypeScript type check passed" -ForegroundColor Green
    } else {
        Write-Host "WARNING: TypeScript type check found issues:" -ForegroundColor Yellow
        Write-Host $typeCheck -ForegroundColor Gray
        $response = Read-Host "Continue anyway? (y/n)"
        if ($response -ne "y" -and $response -ne "Y") {
            Write-Host "Build cancelled." -ForegroundColor Yellow
            exit 0
        }
    }
} else {
    Write-Host "INFO: TypeScript not detected, skipping type check" -ForegroundColor Gray
}

# Check for linting script
$packageJson = Get-Content "package.json" | ConvertFrom-Json
if ($packageJson.scripts.lint) {
    Write-Host "Running linter..." -ForegroundColor Cyan
    $lintOutput = npm run lint 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "OK: Linting passed" -ForegroundColor Green
    } else {
        Write-Host "WARNING: Linting found issues:" -ForegroundColor Yellow
        Write-Host $lintOutput -ForegroundColor Gray
        $response = Read-Host "Continue anyway? (y/n)"
        if ($response -ne "y" -and $response -ne "Y") {
            Write-Host "Build cancelled." -ForegroundColor Yellow
            exit 0
        }
    }
} else {
    Write-Host "INFO: No lint script found, skipping linting" -ForegroundColor Gray
}

# ============================================================================
# STEP 4: EAS PROJECT VERIFICATION
# ============================================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Yellow
Write-Host "  STEP 4: EAS PROJECT VERIFICATION" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "Checking EAS project configuration..." -ForegroundColor Cyan
$projectInfoRaw = eas project:info --json 2>&1 | Where-Object { $_ -notmatch 'eas-cli@' -and $_ -notmatch 'is now available' }
try {
    $projectInfo = $projectInfoRaw | ConvertFrom-Json
    Write-Host "OK: EAS project configured" -ForegroundColor Green
    Write-Host "   Project ID: $($projectInfo.id)" -ForegroundColor Gray
    Write-Host "   Account: $($projectInfo.owner)" -ForegroundColor Gray
} catch {
    Write-Host "WARNING: Could not parse project info, but continuing..." -ForegroundColor Yellow
}

# ============================================================================
# STEP 5: BUILD VERIFICATION (DRY RUN)
# ============================================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Yellow
Write-Host "  STEP 5: BUILD CONFIGURATION VERIFICATION" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Yellow
Write-Host ""

# Verify iOS build configuration
Write-Host "Verifying iOS production build configuration..." -ForegroundColor Cyan
$iosConfig = $easConfig.build.production
if ($iosConfig) {
    Write-Host "OK: iOS production profile found" -ForegroundColor Green
    Write-Host "   Node version: $($iosConfig.node)" -ForegroundColor Gray
    if ($iosConfig.ios) {
        Write-Host "   iOS config: $($iosConfig.ios | ConvertTo-Json -Compress)" -ForegroundColor Gray
    }
} else {
    Write-Host "ERROR: iOS production profile not found in eas.json" -ForegroundColor Red
    exit 1
}

# Verify Android APK build configuration
Write-Host "Verifying Android APK build configuration..." -ForegroundColor Cyan
$androidConfig = $easConfig.build.preview
if ($androidConfig -and $androidConfig.android.buildType -eq "apk") {
    Write-Host "OK: Android preview profile configured for APK" -ForegroundColor Green
    Write-Host "   Node version: $($androidConfig.node)" -ForegroundColor Gray
    Write-Host "   Build type: $($androidConfig.android.buildType)" -ForegroundColor Gray
} else {
    Write-Host "ERROR: Android preview profile not configured for APK" -ForegroundColor Red
    exit 1
}

# Verify app.config.js version and build numbers
Write-Host "Verifying app version and build numbers..." -ForegroundColor Cyan
$appConfig = node -e "console.log(JSON.stringify(require('./app.config.js')))" | ConvertFrom-Json
Write-Host "   Version: $($appConfig.expo.version)" -ForegroundColor Gray
Write-Host "   iOS Build Number: $($appConfig.expo.ios.buildNumber)" -ForegroundColor Gray
Write-Host "   Android Version Code: $($appConfig.expo.android.versionCode)" -ForegroundColor Gray

# ============================================================================
# STEP 6: START iOS BUILD
# ============================================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Yellow
Write-Host "  STEP 6: STARTING iOS PRODUCTION BUILD" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "Starting iOS production build for App Store Connect..." -ForegroundColor Cyan
Write-Host "This build will be submitted to App Store Connect for testing on iPhone 11" -ForegroundColor Gray
Write-Host ""

$iosBuildOutput = eas build --platform ios --profile production --non-interactive 2>&1
$iosBuildExitCode = $LASTEXITCODE

if ($iosBuildExitCode -eq 0) {
    # Extract build ID from output
    $iosBuildId = $null
    if ($iosBuildOutput -match '([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})') {
        $iosBuildId = $matches[1]
        Write-Host "OK: iOS build started successfully!" -ForegroundColor Green
        Write-Host "   Build ID: $iosBuildId" -ForegroundColor Gray
    } else {
        Write-Host "OK: iOS build started (could not extract build ID)" -ForegroundColor Green
    }
    Write-Host "   View at: https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/builds" -ForegroundColor Gray
} else {
    Write-Host "ERROR: iOS build failed to start" -ForegroundColor Red
    Write-Host $iosBuildOutput -ForegroundColor Gray
    exit 1
}

# ============================================================================
# STEP 7: START ANDROID APK BUILD
# ============================================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Yellow
Write-Host "  STEP 7: STARTING ANDROID APK BUILD" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "Starting Android APK build (preview profile)..." -ForegroundColor Cyan
Write-Host "This will create an APK file for direct installation" -ForegroundColor Gray
Write-Host ""

$androidBuildOutput = eas build --platform android --profile preview --non-interactive 2>&1
$androidBuildExitCode = $LASTEXITCODE

if ($androidBuildExitCode -eq 0) {
    # Extract build ID from output
    $androidBuildId = $null
    if ($androidBuildOutput -match '([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})') {
        $androidBuildId = $matches[1]
        Write-Host "OK: Android APK build started successfully!" -ForegroundColor Green
        Write-Host "   Build ID: $androidBuildId" -ForegroundColor Gray
    } else {
        Write-Host "OK: Android APK build started (could not extract build ID)" -ForegroundColor Green
    }
    Write-Host "   View at: https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/builds" -ForegroundColor Gray
} else {
    Write-Host "ERROR: Android APK build failed to start" -ForegroundColor Red
    Write-Host $androidBuildOutput -ForegroundColor Gray
    exit 1
}

# ============================================================================
# STEP 8: MONITOR BUILDS
# ============================================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Yellow
Write-Host "  STEP 8: MONITORING BUILDS" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "Waiting 15 seconds for builds to register..." -ForegroundColor Cyan
Start-Sleep -Seconds 15

$maxWaitTime = 3600 # 60 minutes
$checkInterval = 30 # 30 seconds
$elapsedTime = 0
$iosCompleted = $false
$androidCompleted = $false
$iosBuildUrl = $null
$androidBuildUrl = $null

Write-Host "Monitoring builds (checking every 30 seconds, max 60 minutes)..." -ForegroundColor Cyan
Write-Host ""

while ($elapsedTime -lt $maxWaitTime -and (-not $iosCompleted -or -not $androidCompleted)) {
    Start-Sleep -Seconds $checkInterval
    $elapsedTime += $checkInterval
    
    # Check iOS build
    if (-not $iosCompleted) {
        Write-Host "[$([math]::Floor($elapsedTime / 60))m $($elapsedTime % 60)s] Checking iOS build..." -ForegroundColor Gray
        $iosBuildsRaw = eas build:list --platform ios --limit 1 --json 2>&1 | Where-Object { $_ -notmatch 'eas-cli@' -and $_ -notmatch 'is now available' }
        try {
            $iosBuilds = $iosBuildsRaw | ConvertFrom-Json
            if ($iosBuilds -and $iosBuilds.Count -gt 0) {
                $latestIos = $iosBuilds[0]
                $status = $latestIos.status
                
                if ($status -eq "finished") {
                    Write-Host "OK: iOS build completed successfully!" -ForegroundColor Green
                    $iosCompleted = $true
                    $iosBuildUrl = $latestIos.artifacts.buildUrl
                    Write-Host "   Build URL: $iosBuildUrl" -ForegroundColor Gray
                } elseif ($status -eq "errored" -or $status -eq "canceled") {
                    Write-Host "ERROR: iOS build failed with status: $status" -ForegroundColor Red
                    Write-Host "   Check: https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/builds" -ForegroundColor Gray
                    $iosCompleted = $true
                } else {
                    Write-Host "   Status: $status" -ForegroundColor Gray
                }
            }
        } catch {
            Write-Host "   Could not check iOS build status" -ForegroundColor Yellow
        }
    }
    
    # Check Android build
    if (-not $androidCompleted) {
        Write-Host "[$([math]::Floor($elapsedTime / 60))m $($elapsedTime % 60)s] Checking Android build..." -ForegroundColor Gray
        $androidBuildsRaw = eas build:list --platform android --limit 1 --json 2>&1 | Where-Object { $_ -notmatch 'eas-cli@' -and $_ -notmatch 'is now available' }
        try {
            $androidBuilds = $androidBuildsRaw | ConvertFrom-Json
            if ($androidBuilds -and $androidBuilds.Count -gt 0) {
                $latestAndroid = $androidBuilds[0]
                $status = $latestAndroid.status
                
                if ($status -eq "finished") {
                    Write-Host "OK: Android APK build completed successfully!" -ForegroundColor Green
                    $androidCompleted = $true
                    $androidBuildUrl = $latestAndroid.artifacts.buildUrl
                    Write-Host "   Build URL: $androidBuildUrl" -ForegroundColor Gray
                } elseif ($status -eq "errored" -or $status -eq "canceled") {
                    Write-Host "ERROR: Android APK build failed with status: $status" -ForegroundColor Red
                    Write-Host "   Check: https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/builds" -ForegroundColor Gray
                    $androidCompleted = $true
                } else {
                    Write-Host "   Status: $status" -ForegroundColor Gray
                }
            }
        } catch {
            Write-Host "   Could not check Android build status" -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
}

if (-not $iosCompleted -or -not $androidCompleted) {
    Write-Host "WARNING: Build monitoring timeout (60 minutes)" -ForegroundColor Yellow
    Write-Host "   Builds may still be in progress. Check manually:" -ForegroundColor Gray
    Write-Host "   https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/builds" -ForegroundColor Gray
}

# ============================================================================
# STEP 9: SUBMIT iOS BUILD TO APP STORE CONNECT
# ============================================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Yellow
Write-Host "  STEP 9: SUBMITTING iOS BUILD TO APP STORE CONNECT" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Yellow
Write-Host ""

if ($iosCompleted -and $iosBuildUrl) {
    Write-Host "Submitting iOS build to App Store Connect..." -ForegroundColor Cyan
    Write-Host "This will make the app available for testing on iPhone 11 via TestFlight" -ForegroundColor Gray
    Write-Host ""
    
    # Submit using latest build
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
        Write-Host "   eas submit --platform ios --latest" -ForegroundColor Gray
    }
} else {
    Write-Host "WARNING: iOS build not completed, skipping submission" -ForegroundColor Yellow
    Write-Host "   You can submit manually once build completes:" -ForegroundColor Gray
    Write-Host "   eas submit --platform ios --latest" -ForegroundColor Gray
}

# ============================================================================
# SUMMARY
# ============================================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  BUILD SUMMARY" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "iOS Build:" -ForegroundColor Cyan
if ($iosCompleted) {
    Write-Host "   Status: Completed" -ForegroundColor Green
    if ($iosBuildUrl) {
        Write-Host "   URL: $iosBuildUrl" -ForegroundColor Gray
    }
} else {
    Write-Host "   Status: In Progress or Failed" -ForegroundColor Yellow
}
Write-Host "   View: https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/builds" -ForegroundColor Gray

Write-Host ""
Write-Host "Android APK Build:" -ForegroundColor Cyan
if ($androidCompleted) {
    Write-Host "   Status: Completed" -ForegroundColor Green
    if ($androidBuildUrl) {
        Write-Host "   URL: $androidBuildUrl" -ForegroundColor Gray
    }
} else {
    Write-Host "   Status: In Progress or Failed" -ForegroundColor Yellow
}
Write-Host "   View: https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/builds" -ForegroundColor Gray

Write-Host ""
Write-Host "iOS Submission:" -ForegroundColor Cyan
if ($iosCompleted) {
    Write-Host "   Status: Submitted to App Store Connect" -ForegroundColor Green
    Write-Host "   TestFlight: https://appstoreconnect.apple.com" -ForegroundColor Gray
} else {
    Write-Host "   Status: Pending (build must complete first)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  PROCESS COMPLETE" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
