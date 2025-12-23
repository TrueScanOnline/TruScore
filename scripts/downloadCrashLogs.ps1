# Download iOS Crash Logs from App Store Connect
# This script helps Windows users download and analyze crash logs

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  iOS CRASH LOG DOWNLOAD GUIDE" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Since you're on Windows, here's how to get crash logs:" -ForegroundColor Yellow
Write-Host ""

Write-Host "METHOD 1: App Store Connect Web Interface" -ForegroundColor Green
Write-Host "1. Go to: https://appstoreconnect.apple.com" -ForegroundColor Gray
Write-Host "2. Sign in with your Apple Developer account" -ForegroundColor Gray
Write-Host "3. Navigate to: My Apps > TrueScan > TestFlight > Crashes" -ForegroundColor Gray
Write-Host "4. Click on the crash report" -ForegroundColor Gray
Write-Host "5. Click 'Download' button" -ForegroundColor Gray
Write-Host "6. Save to: C:\TrueScan-FoodScanner\crash-logs\" -ForegroundColor Gray
Write-Host ""

Write-Host "METHOD 2: Ask iOS Tester to Share" -ForegroundColor Green
Write-Host "1. Tester opens TestFlight app on iPhone" -ForegroundColor Gray
Write-Host "2. Taps on TrueScan app" -ForegroundColor Gray
Write-Host "3. Scrolls to 'Crash Reports' section" -ForegroundColor Gray
Write-Host "4. Taps on crash report" -ForegroundColor Gray
Write-Host "5. Taps 'Share' button" -ForegroundColor Gray
Write-Host "6. Emails or shares the crash log" -ForegroundColor Gray
Write-Host ""

Write-Host "METHOD 3: Create Crash Logs Directory" -ForegroundColor Green
$crashLogsDir = "C:\TrueScan-FoodScanner\crash-logs"
if (-not (Test-Path $crashLogsDir)) {
    New-Item -ItemType Directory -Path $crashLogsDir | Out-Null
    Write-Host "Created directory: $crashLogsDir" -ForegroundColor Green
} else {
    Write-Host "Directory exists: $crashLogsDir" -ForegroundColor Gray
}
Write-Host ""

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  WHAT TO DO WITH CRASH LOGS" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Once you have the crash log:" -ForegroundColor Yellow
Write-Host "1. Save it to: $crashLogsDir" -ForegroundColor Gray
Write-Host "2. Open it in Notepad or text editor" -ForegroundColor Gray
Write-Host "3. Copy the content and share it for analysis" -ForegroundColor Gray
Write-Host "4. Or save as: crash-log-$(Get-Date -Format 'yyyy-MM-dd').txt" -ForegroundColor Gray
Write-Host ""

Write-Host "The crash log will show:" -ForegroundColor Yellow
Write-Host "- Exception type (what kind of crash)" -ForegroundColor Gray
Write-Host "- Crashed thread (which thread crashed)" -ForegroundColor Gray
Write-Host "- Stack trace (exact code location)" -ForegroundColor Gray
Write-Host "- Binary images (loaded libraries)" -ForegroundColor Gray
Write-Host ""

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
















