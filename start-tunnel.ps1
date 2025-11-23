# Cloudflare Tunnel Starter Script
# This starts a Cloudflare tunnel for your Expo dev server

Write-Host "Starting Cloudflare Tunnel..." -ForegroundColor Green
Write-Host "This will create a public URL for your Expo dev server." -ForegroundColor Yellow
Write-Host ""

# Start the tunnel
.\cloudflared.exe tunnel --url http://localhost:8081

# Note: The tunnel will show a URL like https://xxxxx.trycloudflare.com
# Share that URL with your tester!
