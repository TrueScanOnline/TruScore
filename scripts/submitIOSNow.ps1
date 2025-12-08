# Quick iOS Submit Script
# Use this if the build completed but the main script had JSON parsing issues

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "SUBMITTING iOS BUILD TO APP STORE CONNECT" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[INFO] Submitting latest iOS build to App Store Connect..." -ForegroundColor Gray
Write-Host ""

eas submit --platform ios --latest --non-interactive

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[SUCCESS] iOS build submitted to App Store Connect successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Check App Store Connect: https://appstoreconnect.apple.com" -ForegroundColor Gray
    Write-Host "  2. Complete the app submission process" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "[ERROR] Failed to submit iOS build" -ForegroundColor Red
    Write-Host "Exit code: $LASTEXITCODE" -ForegroundColor Red
    Write-Host ""
}
