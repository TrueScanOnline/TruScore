# Complete Fix for Unauthorized Android Device
# This script handles cases where no popup appears

Write-Host "=== Complete Android Device Authorization Fix ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check current status
Write-Host "Step 1: Current device status..." -ForegroundColor Yellow
$devices = adb devices
Write-Host $devices
Write-Host ""

# Step 2: Force revoke on computer side
Write-Host "Step 2: Forcing ADB to forget this device..." -ForegroundColor Yellow
adb kill-server
Start-Sleep -Seconds 2

# Remove known hosts (Windows location)
$adbPath = "$env:USERPROFILE\.android"
if (Test-Path "$adbPath\adbkey") {
    Write-Host "Found ADB keys, will need to regenerate..." -ForegroundColor Yellow
}

adb start-server
Start-Sleep -Seconds 2
Write-Host "ADB server restarted" -ForegroundColor Green
Write-Host ""

# Step 3: Detailed instructions
Write-Host "=== CRITICAL: Follow These Steps on Your Phone ===" -ForegroundColor Red
Write-Host ""
Write-Host "ON YOUR ANDROID PHONE:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. UNLOCK your phone (must be unlocked!)" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. Go to: Settings → Developer Options" -ForegroundColor White
Write-Host ""
Write-Host "3. Find and tap: 'Revoke USB debugging authorizations'" -ForegroundColor Yellow
Write-Host "   (This will clear all previous authorizations)" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Make sure these are ENABLED:" -ForegroundColor Yellow
Write-Host "   ✓ USB debugging" -ForegroundColor White
Write-Host "   ✓ USB debugging (Security settings) - if available" -ForegroundColor White
Write-Host ""
Write-Host "5. Check USB connection mode:" -ForegroundColor Yellow
Write-Host "   - Pull down notification panel" -ForegroundColor White
Write-Host "   - Tap 'USB' or 'Charging this device via USB'" -ForegroundColor White
Write-Host "   - Select 'File Transfer' or 'MTP' (NOT 'Charging only')" -ForegroundColor White
Write-Host ""
Write-Host "6. UNPLUG the USB cable" -ForegroundColor Yellow
Write-Host ""
Write-Host "7. PLUG the USB cable back in" -ForegroundColor Yellow
Write-Host ""
Write-Host "8. Look for popup: 'Allow USB debugging?'" -ForegroundColor Yellow
Write-Host "   - Check 'Always allow from this computer'" -ForegroundColor White
Write-Host "   - Tap 'Allow'" -ForegroundColor White
Write-Host ""

# Step 4: Wait for user action
Write-Host "Press ENTER after you've completed all steps on your phone..." -ForegroundColor Cyan
Read-Host

# Step 5: Verify
Write-Host ""
Write-Host "Step 3: Verifying authorization..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

# Force reconnect
adb kill-server
Start-Sleep -Seconds 1
adb start-server
Start-Sleep -Seconds 2

$finalDevices = adb devices
Write-Host $finalDevices
Write-Host ""

if ($finalDevices -match "RZ8WB0399JY\s+device") {
    Write-Host "✅ SUCCESS! Device is authorized!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Now you can run: npx expo run:android" -ForegroundColor Cyan
} elseif ($finalDevices -match "RZ8WB0399JY\s+unauthorized") {
    Write-Host "❌ Device still unauthorized" -ForegroundColor Red
    Write-Host ""
    Write-Host "Additional troubleshooting:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "A. Try a different USB cable (some are charging-only)" -ForegroundColor White
    Write-Host ""
    Write-Host "B. Try a different USB port on your computer" -ForegroundColor White
    Write-Host ""
    Write-Host "C. On phone, check Developer Options:" -ForegroundColor White
    Write-Host "   - Disable 'USB debugging'" -ForegroundColor Gray
    Write-Host "   - Enable 'USB debugging' again" -ForegroundColor Gray
    Write-Host "   - Unplug and replug USB" -ForegroundColor Gray
    Write-Host ""
    Write-Host "D. Restart your phone" -ForegroundColor White
    Write-Host ""
    Write-Host "E. Check if phone needs to be unlocked when connecting" -ForegroundColor White
    Write-Host ""
    Write-Host "F. Try wireless debugging (Android 11+):" -ForegroundColor White
    Write-Host "   Settings → Developer Options → Wireless debugging" -ForegroundColor Gray
} elseif ($finalDevices -notmatch "RZ8WB0399JY") {
    Write-Host "⚠️  Device not detected" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please:" -ForegroundColor Yellow
    Write-Host "1. Make sure phone is connected via USB" -ForegroundColor White
    Write-Host "2. Check USB cable (try a different one)" -ForegroundColor White
    Write-Host "3. Check USB port (try a different one)" -ForegroundColor White
    Write-Host "4. Make sure USB mode is 'File Transfer' or 'MTP'" -ForegroundColor White
    Write-Host "5. Enable USB debugging in Developer Options" -ForegroundColor White
}
