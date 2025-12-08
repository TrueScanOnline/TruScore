# Verify Builds in Expo.dev and Submit iOS to App Store Connect
# This script verifies builds are visible and submits iOS

$ErrorActionPreference = "Continue"

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "VERIFYING BUILDS AND SUBMITTING iOS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Get project info
$projectInfo = eas project:info --json 2>&1 | ConvertFrom-Json
if ($projectInfo) {
    Write-Host "Project: $($projectInfo.name)" -ForegroundColor Yellow
    Write-Host "Account: $($projectInfo.owner)" -ForegroundColor Yellow
    Write-Host "Slug: $($projectInfo.slug)" -ForegroundColor Yellow
    Write-Host "Project URL: https://expo.dev/accounts/$($projectInfo.owner)/projects/$($projectInfo.slug)/builds" -ForegroundColor Cyan
    Write-Host ""
}

# Get latest builds
Write-Host "📋 Fetching latest builds..." -ForegroundColor Yellow
$allBuilds = eas build:list --platform all --limit 10 --json 2>&1 | ConvertFrom-Json

if (-not $allBuilds -or $allBuilds.Count -eq 0) {
    Write-Host "❌ No builds found!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Found $($allBuilds.Count) recent builds" -ForegroundColor Green
Write-Host ""

# Separate Android and iOS builds
$androidBuilds = $allBuilds | Where-Object { $_.platform -eq "android" } | Sort-Object -Property createdAt -Descending
$iosBuilds = $allBuilds | Where-Object { $_.platform -eq "ios" } | Sort-Object -Property createdAt -Descending

# Display Android builds
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "🤖 ANDROID BUILDS" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

if ($androidBuilds.Count -gt 0) {
    $latestAndroid = $androidBuilds[0]
    Write-Host "Latest Android Build:" -ForegroundColor Cyan
    Write-Host "  ID: $($latestAndroid.id)" -ForegroundColor Gray
    Write-Host "  Status: $($latestAndroid.status)" -ForegroundColor $(if ($latestAndroid.status -eq "finished") { "Green" } else { "Yellow" })
    Write-Host "  Created: $($latestAndroid.createdAt)" -ForegroundColor Gray
    Write-Host "  URL: https://expo.dev/accounts/$($projectInfo.owner)/projects/$($projectInfo.slug)/builds/$($latestAndroid.id)" -ForegroundColor Cyan
    Write-Host ""
    
    if ($androidBuilds.Count -gt 1) {
        Write-Host "Recent Android Builds:" -ForegroundColor Gray
        $androidBuilds | Select-Object -First 5 | ForEach-Object {
            Write-Host "  - $($_.id) | $($_.status) | $($_.createdAt)" -ForegroundColor Gray
        }
    }
} else {
    Write-Host "⚠️  No Android builds found" -ForegroundColor Yellow
}

Write-Host ""

# Display iOS builds
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "🍎 iOS BUILDS" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

if ($iosBuilds.Count -gt 0) {
    $latestIOS = $iosBuilds[0]
    Write-Host "Latest iOS Build:" -ForegroundColor Cyan
    Write-Host "  ID: $($latestIOS.id)" -ForegroundColor Gray
    Write-Host "  Status: $($latestIOS.status)" -ForegroundColor $(if ($latestIOS.status -eq "finished") { "Green" } else { "Yellow" })
    Write-Host "  Created: $($latestIOS.createdAt)" -ForegroundColor Gray
    Write-Host "  URL: https://expo.dev/accounts/$($projectInfo.owner)/projects/$($projectInfo.slug)/builds/$($latestIOS.id)" -ForegroundColor Cyan
    Write-Host ""
    
    if ($iosBuilds.Count -gt 1) {
        Write-Host "Recent iOS Builds:" -ForegroundColor Gray
        $iosBuilds | Select-Object -First 5 | ForEach-Object {
            Write-Host "  - $($_.id) | $($_.status) | $($_.createdAt)" -ForegroundColor Gray
        }
    }
    
    # Submit iOS if finished
    if ($latestIOS.status -eq "finished") {
        Write-Host ""
        Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
        Write-Host "📤 SUBMITTING iOS TO APP STORE CONNECT" -ForegroundColor Green
        Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
        Write-Host ""
        
        Write-Host "Submitting iOS build $($latestIOS.id) to App Store Connect..." -ForegroundColor Yellow
        eas submit --platform ios --id $latestIOS.id --non-interactive
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✅ iOS build submitted to App Store Connect successfully!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Next steps:" -ForegroundColor Yellow
            Write-Host "1. Check App Store Connect: https://appstoreconnect.apple.com" -ForegroundColor Cyan
            Write-Host "2. Verify the build appears in your app's version" -ForegroundColor Gray
            Write-Host "3. Complete the submission process" -ForegroundColor Gray
        } else {
            Write-Host "❌ Failed to submit iOS build" -ForegroundColor Red
        }
    } else {
        Write-Host "⏳ iOS build is not finished yet. Status: $($latestIOS.status)" -ForegroundColor Yellow
        Write-Host "   Wait for build to complete, then run this script again or submit manually:" -ForegroundColor Gray
        Write-Host "   eas submit --platform ios --id $($latestIOS.id)" -ForegroundColor Cyan
    }
} else {
    Write-Host "⚠️  No iOS builds found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📊 SUMMARY" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "View all builds: https://expo.dev/accounts/$($projectInfo.owner)/projects/$($projectInfo.slug)/builds" -ForegroundColor Cyan
Write-Host ""
