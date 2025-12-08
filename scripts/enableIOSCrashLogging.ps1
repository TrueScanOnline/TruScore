# Enable iOS Crash Logging and Diagnostics
# This script helps diagnose iOS crashes by enabling comprehensive logging

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  iOS CRASH DIAGNOSTICS SETUP" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "To diagnose iOS crashes, the user in Australia should:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Enable Developer Mode on iPhone:" -ForegroundColor Cyan
Write-Host "   Settings > Privacy & Security > Developer Mode (enable)" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Connect iPhone to Mac and use Console.app:" -ForegroundColor Cyan
Write-Host "   - Open Console.app on Mac" -ForegroundColor Gray
Write-Host "   - Select the iPhone device" -ForegroundColor Gray
Write-Host "   - Filter for 'TrueScan' or 'crash'" -ForegroundColor Gray
Write-Host "   - Reproduce the crash by scanning a barcode" -ForegroundColor Gray
Write-Host "   - Copy the crash log" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Or use Xcode:" -ForegroundColor Cyan
Write-Host "   - Connect iPhone to Mac" -ForegroundColor Gray
Write-Host "   - Open Xcode > Window > Devices and Simulators" -ForegroundColor Gray
Write-Host "   - Select iPhone > View Device Logs" -ForegroundColor Gray
Write-Host "   - Find TrueScan crash logs" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Check TestFlight Crash Reports:" -ForegroundColor Cyan
Write-Host "   - Go to App Store Connect" -ForegroundColor Gray
Write-Host "   - Navigate to your app > TestFlight > Crashes" -ForegroundColor Gray
Write-Host "   - View crash reports if available" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Enable Remote Logging:" -ForegroundColor Cyan
Write-Host "   - The app now includes comprehensive error logging" -ForegroundColor Gray
Write-Host "   - Check console logs when crash occurs" -ForegroundColor Gray
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
