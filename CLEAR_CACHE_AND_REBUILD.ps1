# Clear Metro Cache and Rebuild App
# Correct way to clear cache for expo run:android

Write-Host "=== Clearing Cache and Rebuilding ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Clear Metro cache directories
Write-Host "Step 1: Clearing Metro and Expo caches..." -ForegroundColor Yellow

# Clear Expo cache
if (Test-Path ".expo") {
    Remove-Item -Recurse -Force ".expo" -ErrorAction SilentlyContinue
    Write-Host "✅ Cleared .expo cache" -ForegroundColor Green
}

# Clear Metro cache
if (Test-Path "node_modules\.cache") {
    Remove-Item -Recurse -Force "node_modules\.cache" -ErrorAction SilentlyContinue
    Write-Host "✅ Cleared Metro cache" -ForegroundColor Green
}

# Clear watchman cache (if exists)
if (Get-Command watchman -ErrorAction SilentlyContinue) {
    watchman watch-del-all 2>$null
    Write-Host "✅ Cleared Watchman cache" -ForegroundColor Green
}

Write-Host ""

# Step 2: Verify package
Write-Host "Step 2: Verifying react-native-webview..." -ForegroundColor Yellow
if (Test-Path "node_modules\react-native-webview") {
    $version = (Get-Content "node_modules\react-native-webview\package.json" | ConvertFrom-Json).version
    Write-Host "✅ react-native-webview v$version installed" -ForegroundColor Green
} else {
    Write-Host "❌ Package not found!" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 3: Rebuild
Write-Host "Step 3: Rebuilding app..." -ForegroundColor Yellow
Write-Host "This will take 2-3 minutes" -ForegroundColor Gray
Write-Host ""

npx expo run:android
