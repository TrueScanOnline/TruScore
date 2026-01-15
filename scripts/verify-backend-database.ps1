# Backend Database Verification Script
# Verifies that Vercel backend has a persistent database configured
# Date: January 2025

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Backend Database Verification" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Vercel CLI is installed
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelInstalled) {
    Write-Host "❌ Vercel CLI is not installed" -ForegroundColor Red
    Write-Host "   Install with: npm i -g vercel" -ForegroundColor Yellow
    Write-Host "   Then run: vercel login" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Vercel CLI found" -ForegroundColor Green
Write-Host ""

# Check if logged in
Write-Host "Checking Vercel authentication..." -ForegroundColor Yellow
$vercelWhoami = vercel whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not logged in to Vercel" -ForegroundColor Red
    Write-Host "   Run: vercel login" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Logged in to Vercel" -ForegroundColor Green
Write-Host ""

# Navigate to backend directory
$backendDir = Join-Path $PSScriptRoot "..\backend\vercel"
if (-not (Test-Path $backendDir)) {
    Write-Host "❌ Backend directory not found: $backendDir" -ForegroundColor Red
    exit 1
}

Push-Location $backendDir

Write-Host "Checking environment variables..." -ForegroundColor Yellow
Write-Host ""

# Get environment variables
$envVars = vercel env ls 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to fetch environment variables" -ForegroundColor Red
    Write-Host "   Make sure you're in the correct project" -ForegroundColor Yellow
    Pop-Location
    exit 1
}

# Check for database variables
$hasPostgres = $envVars -match "POSTGRES_URL"
$hasMongoDB = $envVars -match "MONGODB_URI"
$hasDatabase = $hasPostgres -or $hasMongoDB

Write-Host "Database Configuration:" -ForegroundColor Cyan
Write-Host "----------------------" -ForegroundColor Cyan

if ($hasPostgres) {
    Write-Host "✅ POSTGRES_URL is configured" -ForegroundColor Green
} else {
    Write-Host "❌ POSTGRES_URL is NOT configured" -ForegroundColor Red
}

if ($hasMongoDB) {
    Write-Host "✅ MONGODB_URI is configured" -ForegroundColor Green
} else {
    Write-Host "❌ MONGODB_URI is NOT configured" -ForegroundColor Red
}

Write-Host ""

# Check for photo storage
$hasBlob = $envVars -match "BLOB_READ_WRITE_TOKEN"
$hasCloudinary = ($envVars -match "CLOUDINARY_CLOUD_NAME") -and ($envVars -match "CLOUDINARY_API_KEY")

Write-Host "Photo Storage Configuration:" -ForegroundColor Cyan
Write-Host "---------------------------" -ForegroundColor Cyan

if ($hasBlob) {
    Write-Host "✅ BLOB_READ_WRITE_TOKEN is configured" -ForegroundColor Green
} else {
    Write-Host "⚠️  BLOB_READ_WRITE_TOKEN is NOT configured" -ForegroundColor Yellow
}

if ($hasCloudinary) {
    Write-Host "✅ Cloudinary is configured" -ForegroundColor Green
} else {
    Write-Host "⚠️  Cloudinary is NOT configured" -ForegroundColor Yellow
}

Write-Host ""

# Summary
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Summary" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

if ($hasDatabase) {
    Write-Host "✅ Database is configured" -ForegroundColor Green
    Write-Host "   Backend will use persistent storage" -ForegroundColor Green
} else {
    Write-Host "❌ CRITICAL: No database is configured!" -ForegroundColor Red
    Write-Host "   Backend will use in-memory storage (data lost on restart)" -ForegroundColor Red
    Write-Host ""
    Write-Host "   To fix:" -ForegroundColor Yellow
    Write-Host "   1. Go to Vercel Dashboard → Your Project → Storage" -ForegroundColor Yellow
    Write-Host "   2. Create Postgres database OR MongoDB" -ForegroundColor Yellow
    Write-Host "   3. Copy connection string" -ForegroundColor Yellow
    Write-Host "   4. Go to Settings → Environment Variables" -ForegroundColor Yellow
    Write-Host "   5. Add POSTGRES_URL or MONGODB_URI" -ForegroundColor Yellow
    Write-Host "   6. Redeploy: vercel --prod" -ForegroundColor Yellow
}

if (-not $hasBlob -and -not $hasCloudinary) {
    Write-Host ""
    Write-Host "⚠️  Photo storage is not configured" -ForegroundColor Yellow
    Write-Host "   Photos will not be stored permanently" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   To fix:" -ForegroundColor Yellow
    Write-Host "   1. Go to Vercel Dashboard → Your Project → Storage" -ForegroundColor Yellow
    Write-Host "   2. Create Blob storage OR set up Cloudinary" -ForegroundColor Yellow
    Write-Host "   3. Add environment variables" -ForegroundColor Yellow
    Write-Host "   4. Redeploy: vercel --prod" -ForegroundColor Yellow
}

Write-Host ""

# Test backend connection
Write-Host "Testing backend connection..." -ForegroundColor Yellow
$backendUrl = "https://truscoreapi.vercel.app"
try {
    $response = Invoke-WebRequest -Uri "$backendUrl/api/manual-products" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Backend is accessible" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Backend connection test failed (may be normal if endpoint requires auth)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Verification complete!" -ForegroundColor Green

Pop-Location
