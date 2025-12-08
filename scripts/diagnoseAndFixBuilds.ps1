# Diagnose and Fix Build Issues
# This script checks everything and initiates builds properly

$ErrorActionPreference = "Continue"

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "DIAGNOSING BUILD ISSUES" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check EAS CLI
Write-Host "🔍 Step 1: Checking EAS CLI..." -ForegroundColor Yellow
$easInstalled = Get-Command eas -ErrorAction SilentlyContinue
if (-not $easInstalled) {
    Write-Host "❌ EAS CLI not found. Installing..." -ForegroundColor Red
    npm install -g eas-cli
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install EAS CLI" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ EAS CLI found: $($easInstalled.Source)" -ForegroundColor Green
    $easVersion = eas --version 2>&1
    Write-Host "   Version: $easVersion" -ForegroundColor Gray
}
Write-Host ""

# Step 2: Check Authentication
Write-Host "🔍 Step 2: Checking Authentication..." -ForegroundColor Yellow
$whoami = eas whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not authenticated with EAS" -ForegroundColor Red
    Write-Host "   Attempting to login..." -ForegroundColor Yellow
    eas login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Login failed. Please run 'eas login' manually" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Authenticated as: $whoami" -ForegroundColor Green
}
Write-Host ""

# Step 3: Check Project Configuration
Write-Host "🔍 Step 3: Checking Project Configuration..." -ForegroundColor Yellow

# Check eas.json
if (-not (Test-Path "eas.json")) {
    Write-Host "❌ eas.json not found!" -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ eas.json found" -ForegroundColor Green
    $easConfig = Get-Content "eas.json" | ConvertFrom-Json
    Write-Host "   Build profiles: $($easConfig.build.PSObject.Properties.Name -join ', ')" -ForegroundColor Gray
}

# Check app.config.js
if (-not (Test-Path "app.config.js")) {
    Write-Host "❌ app.config.js not found!" -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ app.config.js found" -ForegroundColor Green
}

# Check package.json
if (-not (Test-Path "package.json")) {
    Write-Host "❌ package.json not found!" -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ package.json found" -ForegroundColor Green
}
Write-Host ""

# Step 4: Get Project Info
Write-Host "🔍 Step 4: Getting Project Information..." -ForegroundColor Yellow
$projectInfo = eas project:info --json 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to get project info" -ForegroundColor Red
    Write-Host "   Output: $projectInfo" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Attempting to link project..." -ForegroundColor Yellow
    eas project:init
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to initialize project" -ForegroundColor Red
        exit 1
    }
    $projectInfo = eas project:info --json 2>&1 | ConvertFrom-Json
} else {
    $projectInfo = $projectInfo | ConvertFrom-Json
}

if ($projectInfo) {
    Write-Host "✅ Project Information:" -ForegroundColor Green
    Write-Host "   ID: $($projectInfo.id)" -ForegroundColor Gray
    Write-Host "   Name: $($projectInfo.name)" -ForegroundColor Gray
    Write-Host "   Owner: $($projectInfo.owner)" -ForegroundColor Gray
    Write-Host "   Slug: $($projectInfo.slug)" -ForegroundColor Gray
    Write-Host "   URL: https://expo.dev/accounts/$($projectInfo.owner)/projects/$($projectInfo.slug)/builds" -ForegroundColor Cyan
} else {
    Write-Host "⚠️  Could not get project info" -ForegroundColor Yellow
}
Write-Host ""

# Step 5: Check Existing Builds
Write-Host "🔍 Step 5: Checking Existing Builds..." -ForegroundColor Yellow
$builds = eas build:list --platform all --limit 10 --json 2>&1
if ($LASTEXITCODE -eq 0 -and $builds) {
    $buildsJson = $builds | ConvertFrom-Json
    if ($buildsJson -and $buildsJson.Count -gt 0) {
        Write-Host "✅ Found $($buildsJson.Count) recent builds:" -ForegroundColor Green
        $buildsJson | ForEach-Object {
            $statusColor = if ($_.status -eq "finished") { "Green" } elseif ($_.status -eq "errored") { "Red" } else { "Yellow" }
            Write-Host "   [$($_.platform)] $($_.id) - $($_.status) - $($_.createdAt)" -ForegroundColor $statusColor
        }
    } else {
        Write-Host "⚠️  No builds found in project" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Could not retrieve builds list" -ForegroundColor Yellow
    Write-Host "   Output: $builds" -ForegroundColor Gray
}
Write-Host ""

# Step 6: Initiate New Builds
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "🚀 Step 6: Initiating New Builds" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

# Android Build
Write-Host "🤖 Starting Android Build..." -ForegroundColor Cyan
Write-Host "   Profile: production" -ForegroundColor Gray
Write-Host "   Build Type: app-bundle" -ForegroundColor Gray
Write-Host ""

$androidOutput = eas build --platform android --profile production --non-interactive 2>&1
$androidExitCode = $LASTEXITCODE

if ($androidExitCode -eq 0) {
    Write-Host "✅ Android build initiated successfully!" -ForegroundColor Green
    
    # Try to extract build ID from output
    if ($androidOutput -match 'build.*id.*([a-f0-9-]+)') {
        $androidBuildId = $matches[1]
        Write-Host "   Build ID: $androidBuildId" -ForegroundColor Gray
    } elseif ($androidOutput -match 'https://expo.dev.*builds/([a-f0-9-]+)') {
        $androidBuildId = $matches[1]
        Write-Host "   Build ID: $androidBuildId" -ForegroundColor Gray
    }
    
    Write-Host "   View at: https://expo.dev/accounts/$($projectInfo.owner)/projects/$($projectInfo.slug)/builds" -ForegroundColor Cyan
} else {
    Write-Host "❌ Android build failed to start!" -ForegroundColor Red
    Write-Host "   Exit Code: $androidExitCode" -ForegroundColor Gray
    Write-Host "   Output: $androidOutput" -ForegroundColor Gray
}
Write-Host ""

# Wait a bit before starting iOS
Start-Sleep -Seconds 5

# iOS Build
Write-Host "🍎 Starting iOS Build..." -ForegroundColor Cyan
Write-Host "   Profile: production" -ForegroundColor Gray
Write-Host "   Build Number: 4" -ForegroundColor Gray
Write-Host ""

$iosOutput = eas build --platform ios --profile production --non-interactive 2>&1
$iosExitCode = $LASTEXITCODE

if ($iosExitCode -eq 0) {
    Write-Host "✅ iOS build initiated successfully!" -ForegroundColor Green
    
    # Try to extract build ID from output
    if ($iosOutput -match 'build.*id.*([a-f0-9-]+)') {
        $iosBuildId = $matches[1]
        Write-Host "   Build ID: $iosBuildId" -ForegroundColor Gray
    } elseif ($iosOutput -match 'https://expo.dev.*builds/([a-f0-9-]+)') {
        $iosBuildId = $matches[1]
        Write-Host "   Build ID: $iosBuildId" -ForegroundColor Gray
    }
    
    Write-Host "   View at: https://expo.dev/accounts/$($projectInfo.owner)/projects/$($projectInfo.slug)/builds" -ForegroundColor Cyan
} else {
    Write-Host "❌ iOS build failed to start!" -ForegroundColor Red
    Write-Host "   Exit Code: $iosExitCode" -ForegroundColor Gray
    Write-Host "   Output: $iosOutput" -ForegroundColor Gray
}
Write-Host ""

# Step 7: Verify Builds Started
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "✅ Step 7: Verifying Builds Started" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""

Write-Host "Waiting 10 seconds for builds to register..." -ForegroundColor Gray
Start-Sleep -Seconds 10

$recentBuilds = eas build:list --platform all --limit 5 --json 2>&1 | ConvertFrom-Json

if ($recentBuilds -and $recentBuilds.Count -gt 0) {
    Write-Host "✅ Recent builds found:" -ForegroundColor Green
    $recentBuilds | ForEach-Object {
        $statusColor = if ($_.status -eq "finished") { "Green" } elseif ($_.status -eq "errored") { "Red" } elseif ($_.status -eq "in-progress" -or $_.status -eq "in_queue") { "Yellow" } else { "Gray" }
        Write-Host "   [$($_.platform)] $($_.id) - $($_.status) - $($_.createdAt)" -ForegroundColor $statusColor
    }
    Write-Host ""
    Write-Host "View all builds: https://expo.dev/accounts/$($projectInfo.owner)/projects/$($projectInfo.slug)/builds" -ForegroundColor Cyan
} else {
    Write-Host "⚠️  No recent builds found. They may take a moment to appear." -ForegroundColor Yellow
    Write-Host "   Check manually: https://expo.dev/accounts/$($projectInfo.owner)/projects/$($projectInfo.slug)/builds" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ DIAGNOSIS COMPLETE" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Check Expo.dev dashboard: https://expo.dev/accounts/$($projectInfo.owner)/projects/$($projectInfo.slug)/builds" -ForegroundColor Cyan
Write-Host "2. Monitor builds: eas build:list --platform all" -ForegroundColor Gray
Write-Host "3. Run verification script when builds complete: scripts\verifyAndSubmitBuilds.ps1" -ForegroundColor Gray
Write-Host ""
