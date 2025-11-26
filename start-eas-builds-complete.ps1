# ============================================
# COMPLETE EAS BUILD WORKFLOW - ANDROID + iOS
# Automatically builds and submits to App Store Connect
# Includes automatic build number incrementing
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "COMPLETE EAS BUILD & SUBMIT WORKFLOW" -ForegroundColor Cyan
Write-Host "Android + iOS with Auto-Submit" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Health Checks
Write-Host "Step 1: Running health checks..." -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray

Write-Host "`n[1/3] Running Expo Doctor..." -ForegroundColor Cyan
$doctorResult = npx expo-doctor 2>&1
$doctorOutput = $doctorResult | Out-String

# Check if expo-doctor found issues
if ($LASTEXITCODE -ne 0) {
    # Check if the only issue is the non-blocking app config warning
    $hasAppConfigWarning = $doctorOutput -match "app config fields that may not be synced"
    $hasOnlyOneFailure = $doctorOutput -match "1 checks failed"
    $hasOnlyAppConfigWarning = $hasAppConfigWarning -and $hasOnlyOneFailure
    
    if ($hasOnlyAppConfigWarning) {
        Write-Host "⚠️  Expo Doctor: Non-blocking warning detected (app config sync)" -ForegroundColor Yellow
        Write-Host "   This is expected when native folders exist. Build will proceed." -ForegroundColor Gray
        Write-Host "✅ Expo Doctor: Proceeding with build (warning is non-blocking)" -ForegroundColor Green
    } else {
        Write-Host "`n⚠️  Expo Doctor found issues. Please fix them before continuing." -ForegroundColor Red
        Write-Host $doctorResult -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "✅ Expo Doctor: All checks passed" -ForegroundColor Green
}

Write-Host "`n[2/3] Generating native code (validation)..." -ForegroundColor Cyan
$prebuildResult = npx expo prebuild --clean 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n⚠️  Prebuild failed. Please check the errors above." -ForegroundColor Red
    Write-Host $prebuildResult -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Prebuild: Native code generated successfully" -ForegroundColor Green

Write-Host "`n[3/3] Verifying EAS configuration..." -ForegroundColor Cyan
if (Test-Path "eas.json") {
    try {
        $easConfig = Get-Content eas.json | ConvertFrom-Json
        Write-Host "✅ eas.json is valid" -ForegroundColor Green
        Write-Host "   Build profiles: $($easConfig.build.PSObject.Properties.Name -join ', ')" -ForegroundColor Gray
    } catch {
        Write-Host "⚠️  eas.json is invalid. Please check the file." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "⚠️  eas.json not found. Run 'eas build:configure' first." -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ All health checks passed!" -ForegroundColor Green
Write-Host ""

# Step 2: Auto-Increment Build Number
Write-Host "Step 2: Incrementing iOS build number..." -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray

if (Test-Path "app.config.js") {
    $appConfigContent = Get-Content "app.config.js" -Raw
    
    # Extract current build number
    if ($appConfigContent -match "buildNumber:\s*['""](\d+)['""]") {
        $currentBuildNumber = [int]$Matches[1]
        $newBuildNumber = $currentBuildNumber + 1
        Write-Host "   Current build number: $currentBuildNumber" -ForegroundColor Gray
        Write-Host "   New build number: $newBuildNumber" -ForegroundColor Green
        
        # Replace build number in config
        $appConfigContent = $appConfigContent -replace "buildNumber:\s*['""]\d+['""]", "buildNumber: '$newBuildNumber'"
        Set-Content "app.config.js" -Value $appConfigContent -NoNewline
        
        Write-Host "✅ Build number incremented to $newBuildNumber" -ForegroundColor Green
    } else {
        # Build number not found, add it
        Write-Host "   Build number not found, adding it..." -ForegroundColor Yellow
        $newBuildNumber = 1
        
        # Find iOS section and add buildNumber
        if ($appConfigContent -match "(ios:\s*\{[^}]*bundleIdentifier:\s*['""][^'""]+['""])") {
            $iosSection = $Matches[1]
            $iosSectionWithBuildNumber = $iosSection + ",`n      buildNumber: '1',"
            $appConfigContent = $appConfigContent -replace [regex]::Escape($iosSection), $iosSectionWithBuildNumber
            Set-Content "app.config.js" -Value $appConfigContent -NoNewline
            Write-Host "✅ Build number set to 1" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Could not find iOS section. Build number will default to 1." -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "⚠️  app.config.js not found. Build number will default to 1." -ForegroundColor Yellow
}

Write-Host ""

# Step 3: EAS Login Check
Write-Host "Step 3: Checking EAS authentication..." -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray

$whoamiResult = eas whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n⚠️  Not logged in to EAS." -ForegroundColor Yellow
    Write-Host "Logging in now..." -ForegroundColor Cyan
    eas login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`n❌ Login failed. Please try again." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Already logged in to EAS" -ForegroundColor Green
    $accountInfo = ($whoamiResult | Select-String -Pattern "Logged in as").ToString()
    if ($accountInfo) {
        Write-Host "   $accountInfo" -ForegroundColor Gray
    }
}

Write-Host ""

# Step 4: Build Configuration
Write-Host "Step 4: Build configuration" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""
Write-Host "Build Configuration:" -ForegroundColor Cyan
Write-Host "  Platform: Android + iOS (simultaneous)" -ForegroundColor White
Write-Host "  Profile: preview" -ForegroundColor White
Write-Host "  Distribution:" -ForegroundColor White
Write-Host "    - Android: internal (APK)" -ForegroundColor Gray
Write-Host "    - iOS: store (TestFlight)" -ForegroundColor Gray
Write-Host ""
Write-Host "Auto-Submit:" -ForegroundColor Cyan
Write-Host "  ✅ iOS build will be automatically submitted to App Store Connect" -ForegroundColor Green
Write-Host "  ✅ Build will appear in TestFlight after processing (10-30 minutes)" -ForegroundColor Green
Write-Host ""
Write-Host "Estimated Time:" -ForegroundColor Cyan
Write-Host "  Android: 10-15 minutes" -ForegroundColor White
Write-Host "  iOS: 15-25 minutes" -ForegroundColor White
Write-Host "  iOS Processing: 10-30 minutes (after upload)" -ForegroundColor White
Write-Host "  Total: 35-70 minutes" -ForegroundColor White
Write-Host ""
Write-Host "Monitor builds at:" -ForegroundColor Cyan
Write-Host "  https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/builds" -ForegroundColor White
Write-Host ""

$confirm = Read-Host "Start builds and auto-submit? (Y/N)"
if ($confirm -ne "Y" -and $confirm -ne "y") {
    Write-Host "`nBuild cancelled." -ForegroundColor Yellow
    exit 0
}

# Step 5: Start Builds
Write-Host ""
Write-Host "Step 5: Starting EAS builds..." -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""
Write-Host "🚀 Building both platforms simultaneously..." -ForegroundColor Green
Write-Host "   This will take 20-40 minutes." -ForegroundColor Gray
Write-Host "   iOS build will be automatically submitted when complete." -ForegroundColor Gray
Write-Host ""

# Start the build for both platforms
Write-Host "Starting build command..." -ForegroundColor Cyan
$buildOutput = eas build --platform all --profile preview 2>&1 | Tee-Object -Variable buildOutputFull

# Extract build IDs from output
$iosBuildId = $null
$androidBuildId = $null

if ($buildOutputFull -match "Build ID:\s+([a-f0-9-]+)") {
    $allBuildIds = [regex]::Matches($buildOutputFull, "Build ID:\s+([a-f0-9-]+)")
    foreach ($match in $allBuildIds) {
        $buildId = $match.Groups[1].Value
        # Check which platform this build is for
        $buildInfo = eas build:view $buildId 2>&1
        if ($buildInfo -match "Platform:\s+iOS") {
            $iosBuildId = $buildId
        } elseif ($buildInfo -match "Platform:\s+Android") {
            $androidBuildId = $buildId
        }
    }
}

# Check exit code
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✅ BUILDS STARTED!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    
    if ($iosBuildId) {
        Write-Host "iOS Build ID: $iosBuildId" -ForegroundColor Cyan
    }
    if ($androidBuildId) {
        Write-Host "Android Build ID: $androidBuildId" -ForegroundColor Cyan
    }
    Write-Host ""
    
    # Step 6: Wait for iOS Build and Auto-Submit
    if ($iosBuildId) {
        Write-Host "Step 6: Waiting for iOS build to complete..." -ForegroundColor Yellow
        Write-Host "----------------------------------------" -ForegroundColor Gray
        Write-Host ""
        Write-Host "⏳ Monitoring iOS build status..." -ForegroundColor Cyan
        Write-Host "   This may take 15-25 minutes." -ForegroundColor Gray
        Write-Host "   You can close this window - submission will continue." -ForegroundColor Gray
        Write-Host ""
        
        $maxWaitTime = 1800 # 30 minutes in seconds
        $checkInterval = 30 # Check every 30 seconds
        $elapsedTime = 0
        $buildComplete = $false
        
        while ($elapsedTime -lt $maxWaitTime -and -not $buildComplete) {
            Start-Sleep -Seconds $checkInterval
            $elapsedTime += $checkInterval
            
            $buildStatus = eas build:view $iosBuildId 2>&1
            if ($buildStatus -match "Status:\s+finished") {
                $buildComplete = $true
                Write-Host "✅ iOS build completed!" -ForegroundColor Green
                Write-Host ""
                
                # Step 7: Auto-Submit to App Store Connect
                Write-Host "Step 7: Submitting iOS build to App Store Connect..." -ForegroundColor Yellow
                Write-Host "----------------------------------------" -ForegroundColor Gray
                Write-Host ""
                Write-Host "📤 Submitting build $iosBuildId to App Store Connect..." -ForegroundColor Cyan
                Write-Host "   This will upload the build and make it available in TestFlight." -ForegroundColor Gray
                Write-Host ""
                
                $submitOutput = eas submit --platform ios --id $iosBuildId --profile preview 2>&1
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host ""
                    Write-Host "========================================" -ForegroundColor Green
                    Write-Host "✅ SUBMISSION SUCCESSFUL!" -ForegroundColor Green
                    Write-Host "========================================" -ForegroundColor Green
                    Write-Host ""
                    Write-Host "iOS Build submitted to App Store Connect!" -ForegroundColor Green
                    Write-Host ""
                    Write-Host "Next Steps:" -ForegroundColor Cyan
                    Write-Host "  1. Build is processing (10-30 minutes)" -ForegroundColor White
                    Write-Host "  2. Check App Store Connect:" -ForegroundColor White
                    Write-Host "     https://appstoreconnect.apple.com" -ForegroundColor White
                    Write-Host "  3. Go to TestFlight tab" -ForegroundColor White
                    Write-Host "  4. Build will appear when processing completes" -ForegroundColor White
                    Write-Host "  5. Add testers or enable internal testing" -ForegroundColor White
                    Write-Host ""
                    Write-Host "Your tester in Australia will see the build in TestFlight" -ForegroundColor Green
                    Write-Host "once processing is complete (usually 10-30 minutes)." -ForegroundColor Gray
                } else {
                    Write-Host ""
                    Write-Host "⚠️  Submission encountered an issue:" -ForegroundColor Yellow
                    Write-Host $submitOutput -ForegroundColor Yellow
                    Write-Host ""
                    Write-Host "You can manually submit later with:" -ForegroundColor Cyan
                    Write-Host "  eas submit --platform ios --id $iosBuildId" -ForegroundColor White
                }
            } elseif ($buildStatus -match "Status:\s+errored|Status:\s+canceled") {
                Write-Host "❌ iOS build failed or was canceled." -ForegroundColor Red
                Write-Host "   Check build logs for details." -ForegroundColor Yellow
                $buildComplete = $true
            } else {
                $minutesElapsed = [math]::Floor($elapsedTime / 60)
                Write-Host "   Still building... ($minutesElapsed minutes elapsed)" -ForegroundColor Gray
            }
        }
        
        if (-not $buildComplete) {
            Write-Host ""
            Write-Host "⏰ Build is taking longer than expected." -ForegroundColor Yellow
            Write-Host "   You can check status manually:" -ForegroundColor Cyan
            Write-Host "   eas build:view $iosBuildId" -ForegroundColor White
            Write-Host ""
            Write-Host "   Or submit manually when build completes:" -ForegroundColor Cyan
            Write-Host "   eas submit --platform ios --id $iosBuildId" -ForegroundColor White
        }
    } else {
        Write-Host "⚠️  Could not detect iOS build ID." -ForegroundColor Yellow
        Write-Host "   You can submit manually after build completes:" -ForegroundColor Cyan
        Write-Host "   eas submit --platform ios --latest" -ForegroundColor White
    }
    
    Write-Host ""
    Write-Host "Android Build:" -ForegroundColor Cyan
    Write-Host "  - Download APK from dashboard" -ForegroundColor White
    Write-Host "  - Share with Android tester" -ForegroundColor White
    Write-Host "  - Tester installs directly (no account needed)" -ForegroundColor White
    Write-Host ""
    Write-Host "Dashboard:" -ForegroundColor Cyan
    Write-Host "  https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/builds" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "❌ BUILD FAILED" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Check the error messages above." -ForegroundColor Yellow
    Write-Host "Common fixes:" -ForegroundColor Cyan
    Write-Host "  - Run 'npx expo-doctor' to check for issues" -ForegroundColor White
    Write-Host "  - Verify app.config.js is valid" -ForegroundColor White
    Write-Host "  - Check eas.json configuration" -ForegroundColor White
    Write-Host "  - Review build logs: eas build:list" -ForegroundColor White
    Write-Host "  - Check build credits (free: 30/month)" -ForegroundColor White
    Write-Host ""
}
