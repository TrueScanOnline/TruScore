# Fix Unauthorized Android Device
# Run this script to troubleshoot and fix device authorization

Write-Host "=== Android Device Authorization Fix ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check current status
Write-Host "Step 1: Checking current device status..." -ForegroundColor Yellow
$devices = adb devices
Write-Host $devices
Write-Host ""

# Step 2: Restart ADB server
Write-Host "Step 2: Restarting ADB server..." -ForegroundColor Yellow
adb kill-server
Start-Sleep -Seconds 2
adb start-server
Start-Sleep -Seconds 2
Write-Host "ADB server restarted" -ForegroundColor Green
Write-Host ""

# Step 3: Check devices again
Write-Host "Step 3: Checking devices after restart..." -ForegroundColor Yellow
$devicesAfter = adb devices
Write-Host $devicesAfter
Write-Host ""

# Step 4: Instructions
Write-Host "=== IMPORTANT: Check Your Phone Now ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Look at your Android phone screen" -ForegroundColor White
Write-Host "2. You should see a popup: 'Allow USB debugging?'" -ForegroundColor White
Write-Host "3. Check the box: 'Always allow from this computer'" -ForegroundColor White
Write-Host "4. Tap 'Allow'" -ForegroundColor White
Write-Host ""
Write-Host "If you DON'T see a popup:" -ForegroundColor Yellow
Write-Host "  - Unplug USB cable" -ForegroundColor White
Write-Host "  - Plug it back in" -ForegroundColor White
Write-Host "  - The popup should appear" -ForegroundColor White
Write-Host ""
Write-Host "If still no popup:" -ForegroundColor Yellow
Write-Host "  - On phone: Settings → Developer Options" -ForegroundColor White
Write-Host "  - Tap 'Revoke USB debugging authorizations'" -ForegroundColor White
Write-Host "  - Unplug and replug USB cable" -ForegroundColor White
Write-Host ""

# Step 5: Wait and verify
Write-Host "Waiting 10 seconds for you to authorize on phone..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "Step 4: Final verification..." -ForegroundColor Yellow
$finalDevices = adb devices
Write-Host $finalDevices
Write-Host ""

if ($finalDevices -match "device\s*$") {
    Write-Host "✅ SUCCESS! Device is authorized!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Now you can run: npx expo run:android" -ForegroundColor Cyan
} elseif ($finalDevices -match "unauthorized") {
    Write-Host "❌ Device still unauthorized" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please:" -ForegroundColor Yellow
    Write-Host "1. Check your phone for the authorization popup" -ForegroundColor White
    Write-Host "2. Make sure 'USB debugging' is enabled in Developer Options" -ForegroundColor White
    Write-Host "3. Try a different USB cable or USB port" -ForegroundColor White
    Write-Host "4. Run this script again" -ForegroundColor White
} else {
    Write-Host "⚠️  No device detected" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please:" -ForegroundColor Yellow
    Write-Host "1. Make sure phone is connected via USB" -ForegroundColor White
    Write-Host "2. Enable USB debugging in Developer Options" -ForegroundColor White
    Write-Host "3. Check USB connection mode (should be File Transfer/MTP)" -ForegroundColor White
}
