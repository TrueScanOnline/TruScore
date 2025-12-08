# Submit iOS Build to App Store Connect (Interactive)
# This script submits iOS build and will prompt for credentials if needed

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  SUBMIT iOS BUILD TO APP STORE CONNECT" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Check authentication
Write-Host "Checking authentication..." -ForegroundColor Cyan
$whoami = eas whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Not authenticated. Please run: eas login" -ForegroundColor Red
    exit 1
}
Write-Host "OK: Authenticated as: $whoami" -ForegroundColor Green
Write-Host ""

# List iOS builds
Write-Host "Recent iOS builds:" -ForegroundColor Cyan
eas build:list --platform ios --limit 3
Write-Host ""

# Submit latest iOS build
Write-Host "============================================================" -ForegroundColor Green
Write-Host "Submitting Latest iOS Build" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""

Write-Host "Submitting latest iOS build to App Store Connect..." -ForegroundColor Yellow
Write-Host "Note: You may be prompted for Apple credentials if not configured." -ForegroundColor Gray
Write-Host ""

# Submit without --non-interactive to allow prompts
eas submit --platform ios --latest

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "OK: iOS build submitted successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Check App Store Connect: https://appstoreconnect.apple.com" -ForegroundColor Cyan
    Write-Host "2. Verify the build appears in your app version" -ForegroundColor Gray
    Write-Host "3. Complete the submission process" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "ERROR: Submission failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "1. Missing Apple credentials - configure in App Store Connect" -ForegroundColor Gray
    Write-Host "2. Build not finished - wait for build to complete" -ForegroundColor Gray
    Write-Host "3. Check App Store Connect API key configuration" -ForegroundColor Gray
}

Write-Host ""
