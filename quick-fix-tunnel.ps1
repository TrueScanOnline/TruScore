# Quick Fix: Restart Tunnel Properly
# This stops any existing tunnel and starts a fresh one

Write-Host "Fixing Cloudflare Tunnel..." -ForegroundColor Yellow
Write-Host ""

# Check if cloudflared is running and stop it
Write-Host "Checking for existing tunnel processes..." -ForegroundColor Cyan
$processes = Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue
if ($processes) {
    Write-Host "Stopping existing tunnel processes..." -ForegroundColor Yellow
    Stop-Process -Name "cloudflared" -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "Starting fresh tunnel on port 8082..." -ForegroundColor Green
Write-Host "(Make sure Expo is running on Terminal 1 first!)" -ForegroundColor Yellow
Write-Host ""

# Wait a moment
Start-Sleep -Seconds 1

# Start tunnel
.\cloudflared.exe tunnel --url http://localhost:8082

Write-Host ""
Write-Host "If you see connection errors, try:" -ForegroundColor Yellow
Write-Host "1. Make sure Expo is running on Terminal 1" -ForegroundColor White
Write-Host "2. Check firewall/antivirus isn't blocking" -ForegroundColor White
Write-Host "3. Try LocalTunnel instead (npm install -g localtunnel)" -ForegroundColor White



