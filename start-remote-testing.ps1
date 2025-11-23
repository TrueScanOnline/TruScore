# Start Expo Remote Testing for iOS Tester
# This script starts Expo with tunnel mode for remote testing

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Expo Remote Testing" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Expo is available
Write-Host "Checking Expo setup..." -ForegroundColor Yellow
$expoVersion = npx expo --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Expo not found!" -ForegroundColor Red
    Write-Host "Please make sure you're in the project directory." -ForegroundColor Yellow
    exit 1
}
Write-Host "Expo version: $expoVersion" -ForegroundColor Green
Write-Host ""

# Start Expo with Tunnel
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Expo Tunnel Mode" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting Expo dev server with tunnel..." -ForegroundColor Yellow
Write-Host "This may take 30-60 seconds to connect..." -ForegroundColor Yellow
Write-Host ""
Write-Host "IMPORTANT:" -ForegroundColor Yellow
Write-Host "- Look for URL starting with: exp://" -ForegroundColor White
Write-Host "- It will look like: exp://xxxxx.exp.direct:443" -ForegroundColor White
Write-Host "- Copy that URL and share with your tester!" -ForegroundColor White
Write-Host ""
Write-Host "If tunnel times out, wait 30 seconds and try again." -ForegroundColor Cyan
Write-Host ""

# Start Expo with tunnel in new window (force tunnel mode, ignore devices)
Write-Host "Note: If you have Android device connected, it will be ignored." -ForegroundColor Yellow
Write-Host ""
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; Write-Host '========================================' -ForegroundColor Cyan; Write-Host '  Expo Tunnel Mode - Terminal 1' -ForegroundColor Green; Write-Host '========================================' -ForegroundColor Cyan; Write-Host ''; Write-Host 'Starting Expo with tunnel...' -ForegroundColor Yellow; Write-Host 'Look for the exp:// URL below!' -ForegroundColor Yellow; Write-Host ''; Write-Host 'Press Ctrl+C to stop' -ForegroundColor Cyan; Write-Host ''; `$env:EXPO_NO_DOTENV='1'; npx expo start --tunnel --offline"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Instructions for Your Tester" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "ONCE YOU SEE THE exp:// URL IN TERMINAL 1:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Step 1: Copy the exp:// URL from Terminal 1" -ForegroundColor White
Write-Host "       (It will look like: exp://xxxxx.exp.direct:443)" -ForegroundColor White
Write-Host ""
Write-Host "Step 2: Send this message to your tester:" -ForegroundColor White
Write-Host ""
Write-Host "   Hi! Here's how to test the app:" -ForegroundColor Green
Write-Host ""
Write-Host "   1. Make sure you have Expo Go app installed from App Store" -ForegroundColor Green
Write-Host "   2. Open Expo Go app on your iPhone" -ForegroundColor Green
Write-Host "   3. Look for 'Enter URL manually' button or text field" -ForegroundColor Green
Write-Host "   4. Paste this URL: [PASTE EXP:// URL HERE]" -ForegroundColor Green
Write-Host "   5. Tap 'Connect' or press Enter" -ForegroundColor Green
Write-Host "   6. Wait 10-30 seconds for app to load" -ForegroundColor Green
Write-Host "   7. Done! You can now test the app!" -ForegroundColor Green
Write-Host ""
Write-Host "Note: If you don't see 'Enter URL manually', try:" -ForegroundColor Yellow
Write-Host "   - Look for a menu icon (☰) or settings icon" -ForegroundColor Yellow
Write-Host "   - Tap the screen (if you see camera view)" -ForegroundColor Yellow
Write-Host "   - Look at bottom of screen for options" -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Wait a bit for Expo to start
Start-Sleep -Seconds 3

Write-Host "Terminal 1 should now be starting..." -ForegroundColor Green
Write-Host "Watch Terminal 1 for the exp:// URL!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to open instructions file..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

