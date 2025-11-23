# Start Expo Tunnel for Remote Testing
# This script starts Expo with tunnel mode, ignoring connected devices

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Expo Remote Testing" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Starting Expo tunnel mode..." -ForegroundColor Yellow
Write-Host ""
Write-Host "IMPORTANT:" -ForegroundColor Yellow
Write-Host "- Look for URL starting with: exp://" -ForegroundColor White
Write-Host "- It will look like: exp://xxxxx.exp.direct:443" -ForegroundColor White
Write-Host "- Copy that URL and share with your tester!" -ForegroundColor White
Write-Host ""
Write-Host "This may take 30-60 seconds to connect..." -ForegroundColor Cyan
Write-Host ""

# Disconnect Android device first (if connected)
Write-Host "Checking for connected Android devices..." -ForegroundColor Yellow
$adbCheck = Get-Command adb -ErrorAction SilentlyContinue
if ($adbCheck) {
    Write-Host "Disconnecting Android devices to prevent conflicts..." -ForegroundColor Yellow
    adb disconnect 2>&1 | Out-Null
    Start-Sleep -Seconds 2
    Write-Host "Android devices disconnected." -ForegroundColor Green
    Write-Host ""
}

# Start Expo with tunnel in new window (just --tunnel, no --offline)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; Write-Host '========================================' -ForegroundColor Cyan; Write-Host '  Expo Tunnel Mode - Terminal 1' -ForegroundColor Green; Write-Host '========================================' -ForegroundColor Cyan; Write-Host ''; Write-Host 'Starting Expo with tunnel mode...' -ForegroundColor Yellow; Write-Host 'Look for the exp:// URL below!' -ForegroundColor Yellow; Write-Host ''; Write-Host 'Press Ctrl+C to stop' -ForegroundColor Cyan; Write-Host ''; npx expo start --tunnel"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Terminal 1 Opened!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Watch Terminal 1 for the exp:// URL!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Instructions for your tester:" -ForegroundColor Cyan
Write-Host "1. Wait for exp:// URL to appear in Terminal 1" -ForegroundColor White
Write-Host "2. Copy the URL (starts with exp://)" -ForegroundColor White
Write-Host "3. Share with tester in Australia" -ForegroundColor White
Write-Host "4. They open Expo Go and paste the URL" -ForegroundColor White
Write-Host ""
Write-Host "See TESTER_INSTRUCTIONS.md for detailed steps." -ForegroundColor Cyan
Write-Host ""

