# Start Cloudflare Tunnel for Port 8082
# Expo is running on port 8082, so tunnel needs to point there

Write-Host "Starting Cloudflare Tunnel for port 8082..." -ForegroundColor Green
.\cloudflared.exe tunnel --url http://localhost:8082

# This will show a URL like: https://xxxxx.trycloudflare.com
# Share that URL with your tester!




