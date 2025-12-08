# Fix WebView Metro Cache Issue
# Clears Metro cache and rebuilds app

Write-Host "=== Fixing WebView Metro Cache Issue ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Stop any running Metro processes
Write-Host "Step 1: Stopping Metro bundler..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -like "*node*" -or $_.ProcessName -like "*expo*"} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "Metro stopped" -ForegroundColor Green
Write-Host ""

# Step 2: Clear Metro cache
Write-Host "Step 2: Clearing Metro bundler cache..." -ForegroundColor Yellow
if (Test-Path ".expo") {
    Remove-Item -Recurse -Force ".expo" -ErrorAction SilentlyContinue
}
if (Test-Path "node_modules\.cache") {
    Remove-Item -Recurse -Force "node_modules\.cache" -ErrorAction SilentlyContinue
}
Write-Host "Cache cleared" -ForegroundColor Green
Write-Host ""

# Step 3: Verify package is installed
Write-Host "Step 3: Verifying react-native-webview installation..." -ForegroundColor Yellow
if (Test-Path "node_modules\react-native-webview") {
    Write-Host "✅ react-native-webview is installed" -ForegroundColor Green
} else {
    Write-Host "❌ react-native-webview not found - installing..." -ForegroundColor Red
    npm install react-native-webview@^13.12.2 --legacy-peer-deps
}
Write-Host ""

# Step 4: Rebuild app
Write-Host "Step 4: Rebuilding app with cleared cache..." -ForegroundColor Yellow
Write-Host "This will take 2-3 minutes" -ForegroundColor Gray
Write-Host ""

npx expo run:android --clear
