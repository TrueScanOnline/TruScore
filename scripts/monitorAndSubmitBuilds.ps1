# Monitor EAS Builds and Auto-Submit iOS to App Store Connect
# This script monitors both Android and iOS builds, then submits iOS when ready

$ErrorActionPreference = "Continue"

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "MONITORING EAS BUILDS AND AUTO-SUBMITTING iOS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Function to check build status
function Get-BuildStatus {
    param($Platform)
    
    $builds = eas build:list --platform $Platform --limit 1 --json 2>&1 | ConvertFrom-Json
    if ($builds -and $builds.Count -gt 0) {
        return $builds[0]
    }
    return $null
}

# Function to wait for build completion
function Wait-ForBuild {
    param($Platform, $BuildId)
    
    $maxWaitMinutes = 60
    $checkIntervalSeconds = 30
    $elapsedMinutes = 0
    
    Write-Host "⏳ Waiting for $Platform build to complete..." -ForegroundColor Yellow
    Write-Host "   Build ID: $BuildId" -ForegroundColor Gray
    Write-Host "   Checking every $checkIntervalSeconds seconds (max $maxWaitMinutes minutes)" -ForegroundColor Gray
    Write-Host ""
    
    while ($elapsedMinutes -lt $maxWaitMinutes) {
        Start-Sleep -Seconds $checkIntervalSeconds
        $elapsedMinutes += ($checkIntervalSeconds / 60)
        
        $build = Get-BuildStatus -Platform $Platform
        if ($build -and $build.id -eq $BuildId) {
            $status = $build.status
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

# Get latest build IDs
Write-Host "📋 Checking latest builds..." -ForegroundColor Yellow
$androidBuild = Get-BuildStatus -Platform "android"
$iosBuild = Get-BuildStatus -Platform "ios"

if ($androidBuild) {
    Write-Host "🤖 Android Build:" -ForegroundColor Cyan
    Write-Host "   ID: $($androidBuild.id)" -ForegroundColor Gray
    Write-Host "   Status: $($androidBuild.status)" -ForegroundColor Gray
    Write-Host "   Created: $($androidBuild.createdAt)" -ForegroundColor Gray
    Write-Host ""
}

if ($iosBuild) {
    Write-Host "🍎 iOS Build:" -ForegroundColor Cyan
    Write-Host "   ID: $($iosBuild.id)" -ForegroundColor Gray
    Write-Host "   Status: $($iosBuild.status)" -ForegroundColor Gray
    Write-Host "   Created: $($iosBuild.createdAt)" -ForegroundColor Gray
    Write-Host ""
}

# Wait for Android build if in progress
if ($androidBuild -and $androidBuild.status -ne "finished" -and $androidBuild.status -ne "errored" -and $androidBuild.status -ne "canceled") {
    $androidSuccess = Wait-ForBuild -Platform "android" -BuildId $androidBuild.id
    if (-not $androidSuccess) {
        Write-Host "⚠️  Android build did not complete successfully" -ForegroundColor Yellow
    }
} elseif ($androidBuild -and $androidBuild.status -eq "finished") {
    Write-Host "✅ Android build already completed" -ForegroundColor Green
    Write-Host ""
}

# Wait for iOS build if in progress
if ($iosBuild -and $iosBuild.status -ne "finished" -and $iosBuild.status -ne "errored" -and $iosBuild.status -ne "canceled") {
    $iosSuccess = Wait-ForBuild -Platform "ios" -BuildId $iosBuild.id
    if (-not $iosSuccess) {
        Write-Host "❌ iOS build failed - cannot submit to App Store Connect" -ForegroundColor Red
        exit 1
    }
} elseif ($iosBuild -and $iosBuild.status -eq "finished") {
    Write-Host "✅ iOS build already completed" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "⚠️  No iOS build found or build failed" -ForegroundColor Yellow
    exit 1
}

# Submit iOS to App Store Connect
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "📤 SUBMITTING iOS BUILD TO APP STORE CONNECT" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

Write-Host "Submitting latest iOS build to App Store Connect..." -ForegroundColor Yellow
eas submit --platform ios --latest --non-interactive

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ iOS build submitted to App Store Connect successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "✅ ALL TASKS COMPLETED!" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Check App Store Connect for the submitted build" -ForegroundColor Gray
    Write-Host "2. Complete the app submission process in App Store Connect" -ForegroundColor Gray
    Write-Host "3. Monitor build status: eas build:list" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "❌ Failed to submit iOS build to App Store Connect" -ForegroundColor Red
    exit 1
}

