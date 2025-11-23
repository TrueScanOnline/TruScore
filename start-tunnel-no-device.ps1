# Start Expo Tunnel Mode (Ignore Connected Devices)
# This script starts Expo with tunnel mode and ignores any connected Android devices

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Expo Tunnel Mode" -ForegroundColor Green
Write-Host "  (Ignoring Connected Devices)" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Option 1: Try to disconnect Android device (optional)
Write-Host "Checking for connected Android devices..." -ForegroundColor Yellow
$adbCheck = Get-Command adb -ErrorAction SilentlyContinue
if ($adbCheck) {
    Write-Host "ADB found. Disconnecting Android devices..." -ForegroundColor Yellow
    adb disconnect 2>&1 | Out-Null
    Start-Sleep -Seconds 2
} else {
    Write-Host "ADB not found (this is OK if you don't need it)." -ForegroundColor Cyan
}
Write-Host ""

# Start Expo with tunnel mode
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Expo Tunnel" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting Expo with tunnel mode..." -ForegroundColor Yellow
Write-Host "This will ignore any connected devices." -ForegroundColor Yellow
Write-Host ""
Write-Host "IMPORTANT:" -ForegroundColor Yellow
Write-Host "- Look for URL starting with: exp://" -ForegroundColor White
Write-Host "- It will look like: exp://xxxxx.exp.direct:443" -ForegroundColor White
Write-Host "- Copy that URL and share with your tester!" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop" -ForegroundColor Cyan
Write-Host ""

# Start Expo with tunnel (offline mode prevents device detection)
$env:EXPO_NO_DOTENV = "1"
npx expo start --tunnel --offline

