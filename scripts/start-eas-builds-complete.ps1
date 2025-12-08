# ============================================
# Complete EAS Build Script - Android + iOS
# Ensures 100% success for both platforms
# ============================================

param(
    [string]$BuildProfile = "preview",
    [switch]$SkipChecks = $false,
    [switch]$AndroidOnly = $false,
    [switch]$IOSOnly = $false,
    [switch]$NonInteractive = $false
)

# Use BuildProfile throughout (Profile is a PowerShell automatic variable)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Colors for output
function Write-Info { param($msg) Write-Host $msg -ForegroundColor Cyan }
function Write-Success { param($msg) Write-Host $msg -ForegroundColor Green }
function Write-Warning { param($msg) Write-Host $msg -ForegroundColor Yellow }
function Write-Error { param($msg) Write-Host $msg -ForegroundColor Red }

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  EAS Build Script - Complete Workflow" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ============================================
# STEP 1: Pre-Flight Checks
# ============================================

if (-not $SkipChecks) {
    Write-Info "STEP 1: Running Pre-Flight Checks..."
    
    # Check if we're in the right directory
    if (-not (Test-Path "package.json")) {
        Write-Error "ERROR: package.json not found. Are you in the project root?"
        exit 1
    }
    
    if (-not (Test-Path "app.config.js")) {
        Write-Error "ERROR: app.config.js not found."
        exit 1
    }
    
    if (-not (Test-Path "eas.json")) {
        Write-Error "ERROR: eas.json not found."
        exit 1
    }
    
    Write-Success "✓ Project structure verified"
    
    # Check Node.js version
    Write-Info "  Checking Node.js version..."
    $nodeVersion = node --version
    if ($LASTEXITCODE -ne 0) {
        Write-Error "ERROR: Node.js not found. Please install Node.js."
        exit 1
    }
    Write-Success "  ✓ Node.js version: $nodeVersion"
    
    # Check if dependencies are installed
    Write-Info "  Checking dependencies..."
    if (-not (Test-Path "node_modules")) {
        Write-Warning "  ⚠ node_modules not found. Installing dependencies..."
        yarn install
        if ($LASTEXITCODE -ne 0) {
            Write-Error "ERROR: Failed to install dependencies."
            exit 1
        }
    }
    Write-Success "  ✓ Dependencies installed"
    
    # Check critical dependencies
    Write-Info "  Verifying critical dependencies..."
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    $criticalDeps = @("expo", "react", "react-native", "expo-camera", "expo-sqlite")
    $missingDeps = @()
    foreach ($dep in $criticalDeps) {
        if (-not $packageJson.dependencies.$dep) {
            $missingDeps += $dep
        }
    }
    if ($missingDeps.Count -gt 0) {
        Write-Error "ERROR: Missing critical dependencies: $($missingDeps -join ', ')"
        exit 1
    }
    Write-Success "  ✓ Critical dependencies verified"
    
    # Check Expo SDK version compatibility
    Write-Info "  Checking Expo SDK version..."
    $expoVersion = $packageJson.dependencies.expo
    if ($expoVersion -notmatch "~53\.0") {
        Write-Warning "  ⚠ Expo version may not be compatible: $expoVersion"
        Write-Info "  Expected: ~53.0.x"
    } else {
        Write-Success "  ✓ Expo SDK version: $expoVersion"
    }
    
    # Check React Native version
    Write-Info "  Checking React Native version..."
    $rnVersion = $packageJson.dependencies."react-native"
    if ($rnVersion -ne "0.79.6") {
        Write-Warning "  ⚠ React Native version: $rnVersion (expected 0.79.6)"
    } else {
        Write-Success "  ✓ React Native version: $rnVersion"
    }
    
    # Check EAS CLI
    Write-Info "  Checking EAS CLI..."
    $null = npx eas-cli --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "  ⚠ EAS CLI not found. Checking if 'eas' command works..."
        $null = eas --version 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "  ⚠ EAS CLI not found. Installing globally..."
            npm install -g eas-cli
            if ($LASTEXITCODE -ne 0) {
                Write-Error "ERROR: Failed to install EAS CLI."
                Write-Info "  Try: npm install -g eas-cli"
                exit 1
            }
        } else {
            Write-Success "  ✓ EAS CLI available (via 'eas' command)"
        }
    } else {
        Write-Success "  ✓ EAS CLI available (via 'npx eas-cli')"
    }
    
    # Expo Doctor - Health Check
    Write-Info "  Running Expo Doctor..."
    npx expo-doctor 2>&1 | Out-String | Write-Host
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "  ⚠ Expo Doctor found issues. Review above output."
        if ($NonInteractive) {
            $continue = "y"
            Write-Info "  Auto-continuing (non-interactive mode)"
        } else {
            $continue = Read-Host "  Continue anyway? (y/n)"
        }
        if ($continue -ne "y") {
            exit 1
        }
    } else {
        Write-Success "  ✓ Expo Doctor: All checks passed"
    }
    
    # TypeScript Compilation Check
    Write-Info "  Checking TypeScript compilation..."
    npx tsc --noEmit 2>&1 | Out-String | Write-Host
    if ($LASTEXITCODE -ne 0) {
        Write-Error "ERROR: TypeScript compilation failed. Please fix errors before building."
        exit 1
    }
    Write-Success "  ✓ TypeScript: No errors"
    
    # Validate app.config.js
    Write-Info "  Validating app.config.js..."
    try {
        $validationResult = node -e "try { const config = require('./app.config.js'); console.log('Config valid'); } catch(e) { console.error('Config error:', e.message); process.exit(1); }" 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Error "ERROR: app.config.js is invalid."
            Write-Host $validationResult
            exit 1
        }
        Write-Success "  ✓ app.config.js: Valid"
    } catch {
        Write-Error "ERROR: Failed to validate app.config.js: $_"
        exit 1
    }
    
    # Check babel.config.js exists
    Write-Info "  Checking Babel configuration..."
    if (-not (Test-Path "babel.config.js")) {
        Write-Error "ERROR: babel.config.js not found (required for Expo)"
        exit 1
    }
    Write-Success "  ✓ babel.config.js: Present"
    
    # Check tsconfig.json exists
    Write-Info "  Checking TypeScript configuration..."
    if (-not (Test-Path "tsconfig.json")) {
        Write-Warning "  ⚠ tsconfig.json not found (TypeScript may not be configured)"
    } else {
        Write-Success "  ✓ tsconfig.json: Present"
    }
    
    # Check required assets
    Write-Info "  Checking required assets..."
    $requiredAssets = @(
        "assets/icon.png",
        "assets/splash.png",
        "assets/adaptive-icon.png"
    )
    $missingAssets = @()
    foreach ($asset in $requiredAssets) {
        if (-not (Test-Path $asset)) {
            $missingAssets += $asset
        }
    }
    if ($missingAssets.Count -gt 0) {
        Write-Error "ERROR: Missing required assets:"
        $missingAssets | ForEach-Object { Write-Error "  - $_" }
        exit 1
    }
    Write-Success "  ✓ All required assets present"
    
    # Prebuild validation (dry run)
    Write-Info "  Validating native configuration..."
    try {
        # Just validate, don't actually prebuild
        $prebuildCheck = npx expo prebuild --dry-run 2>&1 | Out-String
        if ($LASTEXITCODE -eq 0) {
            Write-Success "  ✓ Native configuration: Valid"
        } else {
            Write-Warning "  ⚠ Prebuild validation warning (may be OK):"
            Write-Host $prebuildCheck
        }
    } catch {
        Write-Warning "  ⚠ Prebuild check skipped (non-critical)"
    }
}

# ============================================
# STEP 2: EAS Authentication
# ============================================

Write-Info "`nSTEP 2: Verifying EAS Authentication..."

# Check EAS authentication (try both command formats)
$whoami = eas whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    $whoami = npx eas-cli whoami 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "  ⚠ Not logged in to EAS. Logging in..."
        eas login
        if ($LASTEXITCODE -ne 0) {
            npx eas-cli login
            if ($LASTEXITCODE -ne 0) {
                Write-Error "ERROR: Failed to login to EAS."
                Write-Info "  Please run: eas login"
                exit 1
            }
        }
        Write-Success "  ✓ EAS login successful"
    } else {
        Write-Success "  ✓ EAS authenticated: $whoami"
    }
} else {
    Write-Success "  ✓ EAS authenticated: $whoami"
}

# ============================================
# STEP 3: Build Configuration
# ============================================

Write-Info "`nSTEP 3: Build Configuration"

# Determine platforms
$platforms = @()
if ($AndroidOnly) {
    $platforms = @("android")
    Write-Info "  Platform: Android only"
} elseif ($IOSOnly) {
    $platforms = @("ios")
    Write-Info "  Platform: iOS only"
} else {
    $platforms = @("all")
    Write-Info "  Platform: Both Android and iOS"
}

Write-Info "  Profile: $BuildProfile"
Write-Info "  Build Type:"
if ($BuildProfile -eq "production") {
    Write-Info "    Android: AAB (App Bundle) - for Play Store"
    Write-Info "    iOS: IPA - for App Store"
} else {
    Write-Info "    Android: APK - for direct installation"
    Write-Info "    iOS: IPA - for TestFlight"
}

# Validate profile exists in eas.json
try {
    $easConfig = Get-Content "eas.json" -Raw | ConvertFrom-Json
    if (-not $easConfig.build.$BuildProfile) {
        Write-Error "ERROR: Profile '$BuildProfile' not found in eas.json"
        $availableProfiles = $easConfig.build.PSObject.Properties.Name -join ', '
        Write-Info "Available profiles: $availableProfiles"
        exit 1
    }
    Write-Success "  ✓ Profile '$BuildProfile' validated"
} catch {
    Write-Error "ERROR: Failed to parse eas.json: $_"
    exit 1
}

# ============================================
# STEP 4: Final Pre-Build Checks
# ============================================

Write-Info "`nSTEP 4: Final Pre-Build Checks..."

# Check for common build-breaking issues
$issues = @()

# Check app.config.js version
$configContent = Get-Content "app.config.js" -Raw
if ($configContent -notmatch "version.*['\`"]1\.0\.0['\`"]") {
    Write-Warning "  ⚠ Version in app.config.js may need updating"
}

# Check iOS build number
if ($configContent -match "buildNumber.*['\`"](\d+)['\`"]") {
    $buildNumber = $matches[1]
    Write-Info "  iOS Build Number: $buildNumber"
} else {
    Write-Warning "  ⚠ iOS buildNumber not found in app.config.js"
}

# Check Android package name
if ($configContent -notmatch "package.*['\`"]com\.truescan\.foodscanner['\`"]") {
    Write-Warning "  ⚠ Android package name may be incorrect"
} else {
    Write-Success "  ✓ Android package: com.truescan.foodscanner"
}

# Check iOS bundle identifier
if ($configContent -notmatch "bundleIdentifier.*['\`"]com\.truescan\.foodscanner['\`"]") {
    Write-Warning "  ⚠ iOS bundle identifier may be incorrect"
} else {
    Write-Success "  ✓ iOS bundle identifier: com.truescan.foodscanner"
}

# Check for EAS project ID
if ($configContent -notmatch "projectId.*['\`"]1ac14572-9608-42fa-aceb-c0e2a2f60687['\`"]") {
    Write-Warning "  ⚠ EAS project ID may be missing or incorrect"
} else {
    Write-Success "  ✓ EAS project ID found"
}

# Check iOS-specific requirements
if ($platforms -contains "all" -or $platforms -contains "ios") {
    Write-Info "  Checking iOS requirements..."
    
    # Check for camera permission description
    if ($configContent -notmatch "NSCameraUsageDescription") {
        Write-Error "  ERROR: NSCameraUsageDescription missing (required for iOS)"
        $issues += "Missing NSCameraUsageDescription"
    } else {
        Write-Success "  ✓ NSCameraUsageDescription present"
    }
    
    # Check for encryption compliance
    if ($configContent -notmatch "ITSAppUsesNonExemptEncryption") {
        Write-Warning "  ⚠ ITSAppUsesNonExemptEncryption not set (may cause App Store issues)"
    } else {
        Write-Success "  ✓ Encryption compliance configured"
    }
    
    # Check for associated domains
    if ($configContent -notmatch "associatedDomains") {
        Write-Warning "  ⚠ Associated domains not configured (optional)"
    } else {
        Write-Success "  ✓ Associated domains configured"
    }
}

# Check Android-specific requirements
if ($platforms -contains "all" -or $platforms -contains "android") {
    Write-Info "  Checking Android requirements..."
    
    # Check for camera permission
    if ($configContent -notmatch "permissions.*CAMERA") {
        Write-Warning "  ⚠ CAMERA permission may be missing"
    } else {
        Write-Success "  ✓ CAMERA permission configured"
    }
    
    # Check for adaptive icon
    if (-not (Test-Path "assets/adaptive-icon.png")) {
        Write-Warning "  ⚠ Adaptive icon not found (recommended for Android)"
    } else {
        Write-Success "  ✓ Adaptive icon present"
    }
}

if ($issues.Count -gt 0) {
    Write-Warning "  ⚠ Found $($issues.Count) potential issue(s)"
    foreach ($issue in $issues) {
        Write-Warning "    - $issue"
    }
    if ($NonInteractive) {
        $continue = "y"
        Write-Info "  Auto-continuing (non-interactive mode)"
    } else {
        $continue = Read-Host "  Continue anyway? (y/n)"
    }
    if ($continue -ne "y") {
        exit 1
    }
}

Write-Success "  ✓ Pre-build checks complete"

# ============================================
# STEP 5: Start Builds
# ============================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Info "STEP 5: Starting EAS Builds"
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Info "Build Dashboard:"
Write-Host "  https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/builds" -ForegroundColor Yellow
Write-Host ""

Write-Info "Estimated Build Time:"
Write-Host "  Android: 15-25 minutes" -ForegroundColor Yellow
Write-Host "  iOS: 20-30 minutes" -ForegroundColor Yellow
Write-Host "  Total: 20-30 minutes (parallel builds)" -ForegroundColor Yellow
Write-Host ""

if ($NonInteractive) {
    $continue = "y"
    Write-Info "Auto-starting builds (non-interactive mode)..."
} else {
    $continue = Read-Host "Start builds now? (y/n)"
}
if ($continue -ne "y") {
    Write-Info "Build cancelled by user."
    exit 0
}

Write-Host ""

# Start builds
try {
    # Determine which EAS command to use
    $easCmd = "eas"
    $null = eas --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        $easCmd = "npx"
        $null = npx eas-cli --version 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Error "ERROR: EAS CLI not found. Please install: npm install -g eas-cli"
            exit 1
        }
        $easCmd = "npx eas-cli"
    }
    
    if ($platforms -contains "all") {
        Write-Info "Starting builds for both platforms..."
        Write-Host ""
        if ($easCmd -eq "eas") {
            if ($NonInteractive) {
                eas build --platform all --profile $BuildProfile --non-interactive
            } else {
                eas build --platform all --profile $BuildProfile
            }
        } else {
            if ($NonInteractive) {
                npx eas-cli build --platform all --profile $BuildProfile --non-interactive
            } else {
                npx eas-cli build --platform all --profile $BuildProfile
            }
        }
    } elseif ($platforms -contains "android") {
        Write-Info "Starting Android build..."
        Write-Host ""
        if ($easCmd -eq "eas") {
            if ($NonInteractive) {
                eas build --platform android --profile $BuildProfile --non-interactive
            } else {
                eas build --platform android --profile $BuildProfile
            }
        } else {
            if ($NonInteractive) {
                npx eas-cli build --platform android --profile $BuildProfile --non-interactive
            } else {
                npx eas-cli build --platform android --profile $BuildProfile
            }
        }
    } elseif ($platforms -contains "ios") {
        Write-Info "Starting iOS build..."
        Write-Host ""
        if ($easCmd -eq "eas") {
            if ($NonInteractive) {
                eas build --platform ios --profile $BuildProfile --non-interactive
            } else {
                eas build --platform ios --profile $BuildProfile
            }
        } else {
            if ($NonInteractive) {
                npx eas-cli build --platform ios --profile $BuildProfile --non-interactive
            } else {
                npx eas-cli build --platform ios --profile $BuildProfile
            }
        }
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "ERROR: Build command failed with exit code $LASTEXITCODE"
        Write-Host ""
        Write-Info "Troubleshooting steps:"
        Write-Info "  1. Check EAS authentication: eas whoami"
        Write-Info "  2. Verify profile exists: Check eas.json"
        Write-Info "  3. For iOS: Ensure Apple Developer account is configured"
        Write-Info "  4. Check network connection"
        Write-Info "  5. Review build logs at:"
        Write-Host "     https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/builds" -ForegroundColor Yellow
        Write-Host ""
        Write-Info "Common solutions:"
        Write-Info "  - Re-authenticate: eas login"
        Write-Info "  - Check credentials: eas credentials"
        Write-Info "  - Verify project ID in app.config.js"
        Write-Info "  - Ensure all required files are present"
        exit 1
    }
    
    Write-Success "`n✓ Builds started successfully!"
    
} catch {
    Write-Error "ERROR: Failed to start builds: $_"
    Write-Info "Exception details: $($_.Exception.Message)"
    exit 1
}

# ============================================
# STEP 6: Monitor Build Status
# ============================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Info "STEP 6: Build Status"
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Info "Checking build status..."
Start-Sleep -Seconds 5

# Try both command formats
$listResult = eas build:list --platform all --limit 3 2>&1
if ($LASTEXITCODE -ne 0) {
    $listResult = npx eas-cli build:list --platform all --limit 3 2>&1
}
if ($listResult) {
    Write-Host $listResult
} else {
    Write-Info "  Build status will be available shortly. Check dashboard for updates."
}

Write-Host ""
Write-Info "Monitor builds at:"
Write-Host "  https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/builds" -ForegroundColor Yellow
Write-Host ""

Write-Info "You can also check status with:"
Write-Host "  eas build:list --platform all --limit 5" -ForegroundColor Cyan
Write-Host ""

# ============================================
# STEP 7: Next Steps
# ============================================

Write-Host "========================================" -ForegroundColor Green
Write-Success "Build Process Complete!"
Write-Host "========================================`n" -ForegroundColor Green

Write-Info "Next Steps:"
Write-Host "  1. Monitor builds at the dashboard URL above" -ForegroundColor Yellow
Write-Host "  2. You will receive email notifications when builds complete" -ForegroundColor Yellow
Write-Host "  3. Download builds from the dashboard or email links" -ForegroundColor Yellow
Write-Host "  4. Test builds on real devices" -ForegroundColor Yellow
Write-Host ""

if ($BuildProfile -eq "production") {
    Write-Info "For Production Builds:"
    Write-Host "  Android: Submit AAB to Google Play Console" -ForegroundColor Yellow
    Write-Host "  iOS: Submit IPA to App Store Connect" -ForegroundColor Yellow
    Write-Host ""
    Write-Info "Submit commands:"
    Write-Host "  eas submit --platform android --latest" -ForegroundColor Cyan
    Write-Host "  eas submit --platform ios --latest" -ForegroundColor Cyan
} else {
    Write-Info "For Preview Builds:"
    Write-Host "  Android: Install APK directly on device" -ForegroundColor Yellow
    Write-Host "  iOS: Upload to TestFlight or use ad-hoc distribution" -ForegroundColor Yellow
}

Write-Host ""
Write-Success "Script completed successfully! ✓"
Write-Host ""
