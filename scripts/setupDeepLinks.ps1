# Setup Deep Links - Automated Configuration Script
# This script helps you get the required values and sets up environment variables

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TrueScan Deep Links Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Get Apple Team ID
Write-Host "Step 1: Apple Developer Team ID" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Yellow
Write-Host "To get your Apple Team ID:" -ForegroundColor White
Write-Host "1. Go to: https://developer.apple.com/account" -ForegroundColor Gray
Write-Host "2. Sign in with your Apple Developer account" -ForegroundColor Gray
Write-Host "3. Click on 'Membership' in the sidebar" -ForegroundColor Gray
Write-Host "4. Find your 'Team ID' (10 characters, alphanumeric)" -ForegroundColor Gray
Write-Host ""
$appleTeamId = Read-Host "Enter your Apple Team ID (or press Enter to skip)"

if ($appleTeamId) {
    Write-Host "Setting APPLE_TEAM_ID environment variable..." -ForegroundColor Green
    # Set for current session
    $env:APPLE_TEAM_ID = $appleTeamId
    Write-Host "✓ APPLE_TEAM_ID set to: $appleTeamId" -ForegroundColor Green
} else {
    Write-Host "⚠ Skipping Apple Team ID (you can set it later)" -ForegroundColor Yellow
}

Write-Host ""

# Step 2: Get Android SHA256 Fingerprint
Write-Host "Step 2: Android SHA256 Certificate Fingerprint" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Yellow
Write-Host "To get your Android SHA256 fingerprint:" -ForegroundColor White
Write-Host ""
Write-Host "For DEBUG keystore (development):" -ForegroundColor Cyan
Write-Host "  keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android" -ForegroundColor Gray
Write-Host ""
Write-Host "For RELEASE keystore (production):" -ForegroundColor Cyan
Write-Host "  keytool -list -v -keystore your-release-key.keystore -alias your-key-alias" -ForegroundColor Gray
Write-Host ""
Write-Host "Look for the 'SHA256:' value in the output" -ForegroundColor White
Write-Host ""
$androidFingerprint = Read-Host "Enter your Android SHA256 fingerprint (or press Enter to skip)"

if ($androidFingerprint) {
    Write-Host "Setting ANDROID_SHA256_FINGERPRINT environment variable..." -ForegroundColor Green
    # Set for current session
    $env:ANDROID_SHA256_FINGERPRINT = $androidFingerprint
    Write-Host "✓ ANDROID_SHA256_FINGERPRINT set" -ForegroundColor Green
} else {
    Write-Host "⚠ Skipping Android fingerprint (you can set it later)" -ForegroundColor Yellow
}

Write-Host ""

# Step 3: Get App Store ID (optional, for when app is published)
Write-Host "Step 3: iOS App Store ID (Optional)" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Yellow
Write-Host "This is only needed after your app is published to the App Store." -ForegroundColor White
Write-Host "You can find it in App Store Connect after submission." -ForegroundColor White
Write-Host ""
$appStoreId = Read-Host "Enter your App Store ID (or press Enter to skip)"

if ($appStoreId) {
    Write-Host "Setting APP_STORE_ID environment variable..." -ForegroundColor Green
    $env:APP_STORE_ID = $appStoreId
    Write-Host "✓ APP_STORE_ID set to: $appStoreId" -ForegroundColor Green
} else {
    Write-Host "⚠ Skipping App Store ID (set this after app is published)" -ForegroundColor Yellow
}

Write-Host ""

# Step 4: Set Vercel Environment Variables
Write-Host "Step 4: Configure Vercel Environment Variables" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Yellow
Write-Host "Now we'll set these values in your Vercel project." -ForegroundColor White
Write-Host ""

$vercelProject = "truscoreapi"  # Your Vercel project name
$setVercelVars = Read-Host "Set environment variables in Vercel? (y/n)"

if ($setVercelVars -eq 'y' -or $setVercelVars -eq 'Y') {
    Write-Host ""
    Write-Host "Setting Vercel environment variables..." -ForegroundColor Green
    
    if ($appleTeamId) {
        Write-Host "Setting APPLE_TEAM_ID..." -ForegroundColor Cyan
        $result = vercel env add APPLE_TEAM_ID production 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ APPLE_TEAM_ID set in Vercel" -ForegroundColor Green
        } else {
            Write-Host "⚠ Failed to set APPLE_TEAM_ID. You may need to set it manually:" -ForegroundColor Yellow
            Write-Host "  vercel env add APPLE_TEAM_ID production" -ForegroundColor Gray
        }
    }
    
    if ($androidFingerprint) {
        Write-Host "Setting ANDROID_SHA256_FINGERPRINT..." -ForegroundColor Cyan
        $result = vercel env add ANDROID_SHA256_FINGERPRINT production 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ ANDROID_SHA256_FINGERPRINT set in Vercel" -ForegroundColor Green
        } else {
            Write-Host "⚠ Failed to set ANDROID_SHA256_FINGERPRINT. You may need to set it manually:" -ForegroundColor Yellow
            Write-Host "  vercel env add ANDROID_SHA256_FINGERPRINT production" -ForegroundColor Gray
        }
    }
    
    if ($appStoreId) {
        Write-Host "Setting APP_STORE_ID..." -ForegroundColor Cyan
        $result = vercel env add APP_STORE_ID production 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ APP_STORE_ID set in Vercel" -ForegroundColor Green
        } else {
            Write-Host "⚠ Failed to set APP_STORE_ID. You may need to set it manually:" -ForegroundColor Yellow
            Write-Host "  vercel env add APP_STORE_ID production" -ForegroundColor Gray
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Deploy the new API routes to Vercel:" -ForegroundColor White
Write-Host "   cd backend\vercel" -ForegroundColor Gray
Write-Host "   vercel --prod" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Configure your domain (truescan.app) to point to Vercel" -ForegroundColor White
Write-Host "   - Add domain in Vercel Dashboard" -ForegroundColor Gray
Write-Host "   - Update DNS records as instructed" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Test the deep links:" -ForegroundColor White
Write-Host "   - iOS: https://truescan.app/.well-known/apple-app-site-association" -ForegroundColor Gray
Write-Host "   - Android: https://truescan.app/.well-known/assetlinks.json" -ForegroundColor Gray
Write-Host "   - Redirect: https://truescan.app/barcode/1234567890" -ForegroundColor Gray
Write-Host ""
Write-Host "✓ Setup complete!" -ForegroundColor Green
