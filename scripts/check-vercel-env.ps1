# Check Vercel Environment Variables (PowerShell)
# This script helps verify that required environment variables are set in Vercel

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Vercel Environment Variables Check" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if vercel CLI is installed
try {
    $null = Get-Command vercel -ErrorAction Stop
} catch {
    Write-Host "❌ Vercel CLI is not installed" -ForegroundColor Red
    Write-Host "   Install with: npm i -g vercel" -ForegroundColor Yellow
    exit 1
}

Write-Host "Checking Vercel environment variables..." -ForegroundColor Cyan
Write-Host ""

# Get environment variables from Vercel
try {
    $envVars = vercel env ls 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Vercel command failed"
    }
} catch {
    Write-Host "⚠️  Could not fetch environment variables from Vercel" -ForegroundColor Yellow
    Write-Host "   Make sure you're logged in: vercel login" -ForegroundColor Yellow
    Write-Host "   And in the correct project directory" -ForegroundColor Yellow
    exit 1
}

# Check for required variables
$requiredVars = @(
    "POSTGRES_URL",
    "MONGODB_URI"
)

$optionalVars = @(
    "BLOB_READ_WRITE_TOKEN",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
    "OFF_USERNAME",
    "OFF_PASSWORD"
)

Write-Host "Required Variables (at least one database must be set):" -ForegroundColor Cyan
Write-Host "--------------------------------------------------------" -ForegroundColor Cyan

$hasDatabase = $false

foreach ($var in $requiredVars) {
    if ($envVars -match $var) {
        Write-Host "✅ $var is set" -ForegroundColor Green
        if ($var -eq "POSTGRES_URL" -or $var -eq "MONGODB_URI") {
            $hasDatabase = $true
        }
    } else {
        Write-Host "❌ $var is NOT set" -ForegroundColor Red
    }
}

if (-not $hasDatabase) {
    Write-Host ""
    Write-Host "⚠️  WARNING: No database is configured!" -ForegroundColor Yellow
    Write-Host "   Backend will use in-memory storage (data lost on restart)" -ForegroundColor Yellow
    Write-Host "   Set POSTGRES_URL or MONGODB_URI in Vercel dashboard" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Optional Variables (recommended for production):" -ForegroundColor Cyan
Write-Host "------------------------------------------------" -ForegroundColor Cyan

$hasPhotoStorage = $false

foreach ($var in $optionalVars) {
    if ($envVars -match $var) {
        Write-Host "✅ $var is set" -ForegroundColor Green
        if ($var -eq "BLOB_READ_WRITE_TOKEN" -or $var -eq "CLOUDINARY_CLOUD_NAME") {
            $hasPhotoStorage = $true
        }
    } else {
        Write-Host "⚠️  $var is NOT set (optional)" -ForegroundColor Yellow
    }
}

if (-not $hasPhotoStorage) {
    Write-Host ""
    Write-Host "⚠️  WARNING: Photo storage is not configured!" -ForegroundColor Yellow
    Write-Host "   Large photos may fail to upload" -ForegroundColor Yellow
    Write-Host "   Set BLOB_READ_WRITE_TOKEN or Cloudinary credentials" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

if ($hasDatabase -and $hasPhotoStorage) {
    Write-Host "✅ Backend is properly configured for production" -ForegroundColor Green
    exit 0
} elseif ($hasDatabase) {
    Write-Host "⚠️  Database is configured, but photo storage is missing" -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "❌ Database is NOT configured - CRITICAL for production" -ForegroundColor Red
    exit 1
}

