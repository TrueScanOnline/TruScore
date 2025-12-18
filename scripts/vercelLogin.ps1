# Vercel Login Helper Script
# Helps guide through the Vercel login process

Write-Host "`n" -NoNewline
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  Vercel Login Helper" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Vercel CLI is installed
Write-Host "Step 1: Checking Vercel CLI..." -ForegroundColor Yellow
try {
    $version = vercel --version 2>&1
    Write-Host "  ✅ Vercel CLI installed: $version" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Vercel CLI not found" -ForegroundColor Red
    Write-Host "  Installing Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Vercel CLI installed successfully!" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Failed to install Vercel CLI" -ForegroundColor Red
        Write-Host "  Please install manually: npm install -g vercel" -ForegroundColor Yellow
        exit 1
    }
}

# Check current login status
Write-Host "`nStep 2: Checking login status..." -ForegroundColor Yellow
$whoami = vercel whoami 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Already logged in as: $whoami" -ForegroundColor Green
    Write-Host "  ✅ Ready to deploy!" -ForegroundColor Green
    exit 0
}

# Need to login
Write-Host "  ⚠️  Not logged in to Vercel" -ForegroundColor Yellow
Write-Host "`nStep 3: Logging in to Vercel..." -ForegroundColor Yellow
Write-Host "  This will open a browser window..." -ForegroundColor Cyan
Write-Host "  Follow the prompts in the browser to complete login" -ForegroundColor Cyan
Write-Host ""

# Start login process
Write-Host "Starting login process..." -ForegroundColor White
vercel login

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n  ✅ Login successful!" -ForegroundColor Green
    
    # Verify login
    $whoami = vercel whoami 2>&1
    Write-Host "  ✅ Logged in as: $whoami" -ForegroundColor Green
    Write-Host "  ✅ Ready to deploy!" -ForegroundColor Green
} else {
    Write-Host "`n  ❌ Login failed" -ForegroundColor Red
    Write-Host "  Please try running 'vercel login' manually" -ForegroundColor Yellow
    exit 1
}















