# Deploy FSANZ Database Fix to Vercel
# This script redeploys the Vercel backend with the FSANZ database fixes

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FSANZ Database Endpoint - Deployment Fix" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "backend\vercel\api\fsanz-database.ts")) {
    Write-Host "❌ Error: Must run from project root directory" -ForegroundColor Red
    Write-Host "   Current directory: $(Get-Location)" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Found FSANZ database endpoint" -ForegroundColor Green
Write-Host ""

# Check if Vercel CLI is installed
try {
    $vercelVersion = vercel --version 2>&1
    Write-Host "✅ Vercel CLI found: $vercelVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Vercel CLI not found" -ForegroundColor Red
    Write-Host "   Install with: npm install -g vercel" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📦 Checking database files..." -ForegroundColor Cyan

# Check if database files exist
$nzFile = "backend\vercel\data\fsanz-nz.json"
$auFile = "backend\vercel\data\fsanz-au.json"

if (Test-Path $nzFile) {
    Write-Host "✅ Found: $nzFile" -ForegroundColor Green
} else {
    Write-Host "⚠️  Missing: $nzFile (will return empty database)" -ForegroundColor Yellow
}

if (Test-Path $auFile) {
    Write-Host "✅ Found: $auFile" -ForegroundColor Green
} else {
    Write-Host "⚠️  Missing: $auFile (will return empty database)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Cyan
Write-Host ""

# Change to vercel directory
Set-Location backend\vercel

try {
    # Deploy to production
    Write-Host "Running: vercel --prod" -ForegroundColor Yellow
    Write-Host ""
    
    vercel --prod
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✅ Deployment Complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Next Steps:" -ForegroundColor Cyan
    Write-Host "   1. Copy the deployment URL shown above" -ForegroundColor White
    Write-Host "   2. Test the endpoint:" -ForegroundColor White
    Write-Host "      https://your-url.vercel.app/api/fsanz-database?country=nz" -ForegroundColor Gray
    Write-Host "   3. Should return status 200 (not 401!)" -ForegroundColor White
    Write-Host "   4. Update .env if URL changed:" -ForegroundColor White
    Write-Host "      EXPO_PUBLIC_FSANZ_NZ_URL=https://your-url.vercel.app/api/fsanz-database?country=nz" -ForegroundColor Gray
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Yellow
    exit 1
} finally {
    # Return to project root
    Set-Location ..\..
}

