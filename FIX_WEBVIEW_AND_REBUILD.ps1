# Fix WebView Missing Module and Rebuild
# This script installs react-native-webview and rebuilds the app

Write-Host "=== Fixing WebView Module ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Install dependencies
Write-Host "Step 1: Installing dependencies..." -ForegroundColor Yellow
npm install
Write-Host "Dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 2: Rebuild app (required for native modules)
Write-Host "Step 2: Rebuilding app with native modules..." -ForegroundColor Yellow
Write-Host "This is required because react-native-webview is a native module" -ForegroundColor Gray
Write-Host ""

Write-Host "Running: npx expo run:android" -ForegroundColor Cyan
Write-Host "This will take 2-3 minutes (faster than first build)" -ForegroundColor Gray
Write-Host ""

npx expo run:android
