# Full Build Script with Complete Verification
# Builds Android and iOS with distinct names, verifies in Expo.dev, and submits to App Store Connect

$ErrorActionPreference = "Stop"

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "TRUESCAN - FULL BUILD WITH VERIFICATION" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Step 1: Pre-flight checks
Write-Host "🔍 Step 1: Pre-flight Checks" -ForegroundColor Yellow
Write-Host "───────────────────────────────────────────────────────────" -ForegroundColor Gray
Write-Host ""

# Check EAS CLI
Write-Host "📦 Checking EAS CLI..." -ForegroundColor Cyan
$easInstalled = Get-Command eas -ErrorAction SilentlyContinue
if (-not $easInstalled) {
    Write-Host "❌ EAS CLI not found. Installing..." -ForegroundColor Red
    npm install -g eas-cli
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install EAS CLI" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ EAS CLI installed" -ForegroundColor Green

# Check EAS login
Write-Host "🔐 Checking EAS authentication..." -ForegroundColor Cyan
$whoami = eas whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not logged in to EAS. Please run: eas login" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Logged in as: $whoami" -ForegroundColor Green

# Check project configuration
Write-Host "📋 Checking project configuration..." -ForegroundColor Cyan
if (-not (Test-Path "eas.json")) {
    Write-Host "❌ eas.json not found" -ForegroundColor Red
    exit 1
}
if (-not (Test-Path "app.config.js")) {
    Write-Host "❌ app.config.js not found" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Configuration files found" -ForegroundColor Green

# Get project info
Write-Host "📊 Getting project information..." -ForegroundColor Cyan
$projectInfo = eas project:info --json 2>&1 | ConvertFrom-Json
if ($projectInfo) {
    Write-Host "   Project ID: $($projectInfo.id)" -ForegroundColor Gray
    Write-Host "   Project Name: $($projectInfo.name)" -ForegroundColor Gray
    Write-Host "   Account: $($projectInfo.owner)" -ForegroundColor Gray
}
Write-Host ""

# Step 2: Android Build
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "🤖 Step 2: Building Android (Production AAB)" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

$androidBuildName = "TrueScan-Android-v1.0.0-build4-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Write-Host "Build Name: $androidBuildName" -ForegroundColor Yellow
Write-Host ""

Write-Host "Starting Android production build..." -ForegroundColor Yellow
$androidBuildOutput = eas build --platform android --profile production --non-interactive --json 2>&1
$androidBuildResult = $androidBuildOutput | ConvertFrom-Json

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Android build failed!" -ForegroundColor Red
    Write-Host $androidBuildOutput -ForegroundColor Red
    exit 1
}

$androidBuildId = $androidBuildResult.id
Write-Host "✅ Android build started successfully!" -ForegroundColor Green
Write-Host "   Build ID: $androidBuildId" -ForegroundColor Gray
Write-Host "   View at: https://expo.dev/accounts/$($projectInfo.owner)/projects/$($projectInfo.slug)/builds/$androidBuildId" -ForegroundColor Cyan
Write-Host ""

# Step 3: iOS Build
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "🍎 Step 3: Building iOS (Production)" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

$iosBuildName = "TrueScan-iOS-v1.0.0-build4-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Write-Host "Build Name: $iosBuildName" -ForegroundColor Yellow
Write-Host ""

Write-Host "Starting iOS production build..." -ForegroundColor Yellow
$iosBuildOutput = eas build --platform ios --profile production --non-interactive --json 2>&1
$iosBuildResult = $iosBuildOutput | ConvertFrom-Json

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ iOS build failed!" -ForegroundColor Red
    Write-Host $iosBuildOutput -ForegroundColor Red
    exit 1
}

$iosBuildId = $iosBuildResult.id
Write-Host "✅ iOS build started successfully!" -ForegroundColor Green
Write-Host "   Build ID: $iosBuildId" -ForegroundColor Gray
Write-Host "   View at: https://expo.dev/accounts/$($projectInfo.owner)/projects/$($projectInfo.slug)/builds/$iosBuildId" -ForegroundColor Cyan
Write-Host ""

# Step 4: Monitor Builds
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "⏳ Step 4: Monitoring Builds" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""

function Wait-ForBuildCompletion {
    param($BuildId, $Platform, $MaxWaitMinutes = 60)
    
    $checkIntervalSeconds = 30
    $elapsedMinutes = 0
    
    Write-Host "Monitoring $Platform build (ID: $BuildId)..." -ForegroundColor Cyan
    Write-Host "Checking every $checkIntervalSeconds seconds (max $MaxWaitMinutes minutes)" -ForegroundColor Gray
    Write-Host ""
    
    while ($elapsedMinutes -lt $MaxWaitMinutes) {
        Start-Sleep -Seconds $checkIntervalSeconds
        $elapsedMinutes += ($checkIntervalSeconds / 60)
        
        $buildInfo = eas build:view $BuildId --json 2>&1 | ConvertFrom-Json
        
        if ($buildInfo) {
            $status = $buildInfo.status
            Write-Host "   [$Platform] Status: $status (elapsed: $([math]::Round($elapsedMinutes, 1)) min)" -ForegroundColor Gray
            
            if ($status -eq "finished") {
                Write-Host "✅ $Platform build completed successfully!" -ForegroundColor Green
                return $true
            } elseif ($status -eq "errored" -or $status -eq "canceled") {
                Write-Host "❌ $Platform build failed with status: $status" -ForegroundColor Red
                return $false
            }
        }
    }
    
    Write-Host "⏱️  Timeout waiting for $Platform build" -ForegroundColor Yellow
    return $false
}

# Wait for both builds (in parallel conceptually, but sequentially for simplicity)
Write-Host "Waiting for Android build..." -ForegroundColor Yellow
$androidSuccess = Wait-ForBuildCompletion -BuildId $androidBuildId -Platform "Android" -MaxWaitMinutes 60

Write-Host ""
Write-Host "Waiting for iOS build..." -ForegroundColor Yellow
$iosSuccess = Wait-ForBuildCompletion -BuildId $iosBuildId -Platform "iOS" -MaxWaitMinutes 60

Write-Host ""

# Step 5: Verify Builds in Expo.dev
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ Step 5: Verifying Builds in Expo.dev" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "Checking builds in Expo.dev..." -ForegroundColor Yellow
$allBuilds = eas build:list --platform all --limit 10 --json 2>&1 | ConvertFrom-Json

if ($allBuilds) {
    $androidBuild = $allBuilds | Where-Object { $_.id -eq $androidBuildId }
    $iosBuild = $allBuilds | Where-Object { $_.id -eq $iosBuildId }
    
    if ($androidBuild) {
        Write-Host "✅ Android build found in Expo.dev:" -ForegroundColor Green
        Write-Host "   ID: $($androidBuild.id)" -ForegroundColor Gray
        Write-Host "   Status: $($androidBuild.status)" -ForegroundColor Gray
        Write-Host "   Platform: $($androidBuild.platform)" -ForegroundColor Gray
        Write-Host "   Created: $($androidBuild.createdAt)" -ForegroundColor Gray
        Write-Host "   URL: https://expo.dev/accounts/$($projectInfo.owner)/projects/$($projectInfo.slug)/builds/$($androidBuild.id)" -ForegroundColor Cyan
    } else {
        Write-Host "⚠️  Android build not found in recent builds list" -ForegroundColor Yellow
    }
    
    Write-Host ""
    
    if ($iosBuild) {
        Write-Host "✅ iOS build found in Expo.dev:" -ForegroundColor Green
        Write-Host "   ID: $($iosBuild.id)" -ForegroundColor Gray
        Write-Host "   Status: $($iosBuild.status)" -ForegroundColor Gray
        Write-Host "   Platform: $($iosBuild.platform)" -ForegroundColor Gray
        Write-Host "   Created: $($iosBuild.createdAt)" -ForegroundColor Gray
        Write-Host "   URL: https://expo.dev/accounts/$($projectInfo.owner)/projects/$($projectInfo.slug)/builds/$($iosBuild.id)" -ForegroundColor Cyan
    } else {
        Write-Host "⚠️  iOS build not found in recent builds list" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Could not retrieve builds list" -ForegroundColor Yellow
}

Write-Host ""

# Step 6: Submit iOS to App Store Connect
if ($iosSuccess) {
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host "📤 Step 6: Submitting iOS to App Store Connect" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Submitting iOS build to App Store Connect..." -ForegroundColor Yellow
    Write-Host "Build ID: $iosBuildId" -ForegroundColor Gray
    Write-Host ""
    
    eas submit --platform ios --id $iosBuildId --non-interactive
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ iOS build submitted to App Store Connect successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "1. Check App Store Connect: https://appstoreconnect.apple.com" -ForegroundColor Cyan
        Write-Host "2. Verify the build appears in App Store Connect" -ForegroundColor Gray
        Write-Host "3. Complete the submission process in App Store Connect" -ForegroundColor Gray
        Write-Host ""
    } else {
        Write-Host "❌ Failed to submit iOS build to App Store Connect" -ForegroundColor Red
        Write-Host "You can submit manually with: eas submit --platform ios --id $iosBuildId" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Skipping iOS submission - build did not complete successfully" -ForegroundColor Yellow
}

# Final Summary
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📊 BUILD SUMMARY" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Android Build:" -ForegroundColor Yellow
Write-Host "  Status: $(if ($androidSuccess) { '✅ Completed' } else { '❌ Failed' })" -ForegroundColor $(if ($androidSuccess) { 'Green' } else { 'Red' })
Write-Host "  Build ID: $androidBuildId" -ForegroundColor Gray
Write-Host "  View: https://expo.dev/accounts/$($projectInfo.owner)/projects/$($projectInfo.slug)/builds/$androidBuildId" -ForegroundColor Cyan
Write-Host ""
Write-Host "iOS Build:" -ForegroundColor Yellow
Write-Host "  Status: $(if ($iosSuccess) { '✅ Completed' } else { '❌ Failed' })" -ForegroundColor $(if ($iosSuccess) { 'Green' } else { 'Red' })
Write-Host "  Build ID: $iosBuildId" -ForegroundColor Gray
Write-Host "  View: https://expo.dev/accounts/$($projectInfo.owner)/projects/$($projectInfo.slug)/builds/$iosBuildId" -ForegroundColor Cyan
Write-Host ""
Write-Host "All Builds:" -ForegroundColor Yellow
Write-Host "  View all: https://expo.dev/accounts/$($projectInfo.owner)/projects/$($projectInfo.slug)/builds" -ForegroundColor Cyan
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ BUILD PROCESS COMPLETE!" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
