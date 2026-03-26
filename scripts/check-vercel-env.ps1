# Check Vercel Environment Variables (PowerShell)
# Runs CLI from backend/vercel (linked .vercel/project.json). Safe to run from repo root.

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Vercel Environment Variables Check" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Resolve repo root (parent of /scripts) and Vercel app directory
$RepoRoot = Split-Path -Parent $PSScriptRoot
$VercelDir = Join-Path $RepoRoot "backend\vercel"

if (-not (Test-Path $VercelDir)) {
    Write-Host "❌ Expected Vercel app folder not found: $VercelDir" -ForegroundColor Red
    exit 1
}

$ProjectJson = Join-Path $VercelDir ".vercel\project.json"
if (-not (Test-Path $ProjectJson)) {
    Write-Host "❌ Vercel project not linked in backend/vercel" -ForegroundColor Red
    Write-Host "   Run:" -ForegroundColor Yellow
    Write-Host "   Set-Location `"$VercelDir`"; npx vercel link" -ForegroundColor Yellow
    exit 1
}

Write-Host "Using Vercel project directory: $VercelDir" -ForegroundColor DarkGray

# Use cmd /c so Node stderr ("Retrieving project…") does not surface as PowerShell errors
$cmdPrefix = "cd /d `"$VercelDir`" && npx --yes vercel@latest"

Write-Host "Checking Vercel CLI session..." -ForegroundColor Cyan
$who = cmd /c "$cmdPrefix whoami 2>&1"
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Not logged in to Vercel CLI (exit $LASTEXITCODE)" -ForegroundColor Yellow
    Write-Host $who -ForegroundColor DarkGray
    Write-Host "   Run (interactive): npx vercel login" -ForegroundColor Yellow
    Write-Host "   Then re-run this script." -ForegroundColor Yellow
    exit 1
}
$whoFirst = ($who -split "`r?`n" | Where-Object { $_.Trim().Length -gt 0 } | Select-Object -First 1)
Write-Host "   Logged in as: $whoFirst" -ForegroundColor Green
Write-Host ""

Write-Host "Fetching environment variables (vercel env ls)..." -ForegroundColor Cyan
$envVars = cmd /c "$cmdPrefix env ls 2>&1"
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Could not list environment variables" -ForegroundColor Yellow
    Write-Host $envVars -ForegroundColor DarkGray
    Write-Host "   Try: Set-Location `"$VercelDir`"; npx vercel link" -ForegroundColor Yellow
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

$envText = if ($envVars -is [string]) { $envVars } else { $envVars | Out-String }

Write-Host "Required Variables (at least one database must be set):" -ForegroundColor Cyan
Write-Host "--------------------------------------------------------" -ForegroundColor Cyan

$hasDatabase = $false

foreach ($var in $requiredVars) {
    if ($envText -match [regex]::Escape($var)) {
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
    if ($envText -match [regex]::Escape($var)) {
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
