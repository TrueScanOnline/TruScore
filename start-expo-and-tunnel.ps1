# Start Expo Dev Server + Cloudflare Tunnel
# This starts both Expo and the tunnel in separate windows

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Expo + Cloudflare Tunnel" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start Expo Dev Server
Write-Host "Starting Expo dev server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npx expo start"

# Wait for Expo to start
Write-Host "Waiting for Expo to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# Start Cloudflare Tunnel
Write-Host "Starting Cloudflare tunnel..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; .\cloudflared.exe tunnel --url http://localhost:8081"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Instructions:" -ForegroundColor Yellow
Write-Host "1. Check Terminal 2 (Cloudflare Tunnel) for the URL" -ForegroundColor White
Write-Host "2. It will look like: https://xxxxx.trycloudflare.com" -ForegroundColor White
Write-Host "3. Copy that URL and share with your tester" -ForegroundColor White
Write-Host "4. They open Expo Go and enter the URL" -ForegroundColor White
Write-Host ""
Write-Host "Note: Keep both terminals open while testing!" -ForegroundColor Cyan
Write-Host ""
