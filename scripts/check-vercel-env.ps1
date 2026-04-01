# Check Vercel Environment Variables (PowerShell)
# Runs CLI from backend/vercel (linked .vercel/project.json). Safe to run from repo root.
# ASCII-only status tags ([OK]/[MISS]/[WARN]) for readable output on all Windows code pages.
#
# Usage:
#   .\scripts\check-vercel-env.ps1                    # DB required; photo storage warns
#   .\scripts\check-vercel-env.ps1 -RequirePhotoCdn # exit 1 if BLOB or Cloudinary not set (recommended before prod)
#
param(
    [switch] $RequirePhotoCdn
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Vercel Environment Variables Check" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
if ($RequirePhotoCdn) {
    Write-Host "Mode: -RequirePhotoCdn (fail if no BLOB / Cloudinary)" -ForegroundColor DarkYellow
}
Write-Host ""

$RepoRoot = Split-Path -Parent $PSScriptRoot
$VercelDir = Join-Path $RepoRoot "backend\vercel"

if (-not (Test-Path $VercelDir)) {
    Write-Host "[FAIL] Expected Vercel app folder not found: $VercelDir" -ForegroundColor Red
    exit 1
}

$ProjectJson = Join-Path $VercelDir ".vercel\project.json"
if (-not (Test-Path $ProjectJson)) {
    Write-Host "[FAIL] Vercel project not linked in backend/vercel" -ForegroundColor Red
    Write-Host "   Run:" -ForegroundColor Yellow
    Write-Host "   Set-Location `"$VercelDir`"; npx vercel link" -ForegroundColor Yellow
    exit 1
}

Write-Host "Using Vercel project directory: $VercelDir" -ForegroundColor DarkGray

$cmdPrefix = "cd /d `"$VercelDir`" && npx --yes vercel@latest"

Write-Host "Checking Vercel CLI session..." -ForegroundColor Cyan
$who = cmd /c "$cmdPrefix whoami 2>&1"
if ($LASTEXITCODE -ne 0) {
    Write-Host "[WARN] Not logged in to Vercel CLI (exit $LASTEXITCODE)" -ForegroundColor Yellow
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
    Write-Host "[WARN] Could not list environment variables" -ForegroundColor Yellow
    Write-Host $envVars -ForegroundColor DarkGray
    Write-Host "   Try: Set-Location `"$VercelDir`"; npx vercel link" -ForegroundColor Yellow
    exit 1
}

$envText = if ($envVars -is [string]) { $envVars } else { $envVars | Out-String }

# backend/vercel/lib/database.ts uses DATABASE_URL || POSTGRES_URL (Neon often provides DATABASE_URL only)
$databaseVarNames = @("POSTGRES_URL", "DATABASE_URL", "MONGODB_URI")
$blobAndCloudinary = @(
    "BLOB_READ_WRITE_TOKEN",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET"
)

Write-Host "Database (need at least one - required for manual_products + photos tables):" -ForegroundColor Cyan
Write-Host "------------------------------------------------------------------------------" -ForegroundColor Cyan

$hasDatabase = $false
foreach ($var in $databaseVarNames) {
    if ($envText -match [regex]::Escape($var)) {
        Write-Host "[OK]   $var is set" -ForegroundColor Green
        $hasDatabase = $true
    } else {
        Write-Host "[MISS] $var is NOT set" -ForegroundColor Red
    }
}

if (-not $hasDatabase) {
    Write-Host ""
    Write-Host "[FAIL] No database env var found." -ForegroundColor Red
    Write-Host "   Add on Vercel: POSTGRES_URL or DATABASE_URL (Neon/Supabase/Vercel Postgres) or MONGODB_URI" -ForegroundColor Yellow
    Write-Host "   Without this, user photos and submissions are lost on cold start." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Photo CDN (need Vercel Blob OR full Cloudinary - required for HTTPS URLs other users can load):" -ForegroundColor Cyan
Write-Host "------------------------------------------------------------------------------------------------" -ForegroundColor Cyan

$hasBlob = $envText -match [regex]::Escape("BLOB_READ_WRITE_TOKEN")
$hasCloudinary =
    ($envText -match [regex]::Escape("CLOUDINARY_CLOUD_NAME")) -and
    ($envText -match [regex]::Escape("CLOUDINARY_API_KEY")) -and
    ($envText -match [regex]::Escape("CLOUDINARY_API_SECRET"))

if ($hasBlob) {
    Write-Host "[OK]   BLOB_READ_WRITE_TOKEN is set (Vercel Blob - recommended)" -ForegroundColor Green
} else {
    Write-Host "[MISS] BLOB_READ_WRITE_TOKEN is NOT set" -ForegroundColor Yellow
}

if ($hasCloudinary) {
    Write-Host "[OK]   Cloudinary triple (CLOUDINARY_*) is set" -ForegroundColor Green
} else {
    Write-Host "[INFO] Full Cloudinary not detected (need CLOUD_NAME + API_KEY + API_SECRET)" -ForegroundColor DarkGray
}

$hasPhotoCdn = $hasBlob -or $hasCloudinary

if (-not $hasPhotoCdn) {
    Write-Host ""
    Write-Host "[WARN] No public photo CDN configured." -ForegroundColor Yellow
    Write-Host "   The API may fall back to embedded data: URLs; the app only merges http(s) images for other users." -ForegroundColor Yellow
    Write-Host "   Vercel Dashboard -> Storage -> Blob -> connect store -> copy BLOB_READ_WRITE_TOKEN -> Env Vars" -ForegroundColor Yellow
    if ($RequirePhotoCdn) {
        exit 1
    }
}

Write-Host ""
Write-Host "Optional (Open Food Facts submissions)" -ForegroundColor Cyan
Write-Host "--------------------------------------" -ForegroundColor Cyan
foreach ($var in @("OFF_USERNAME", "OFF_PASSWORD")) {
    if ($envText -match [regex]::Escape($var)) {
        Write-Host "[OK]   $var" -ForegroundColor Green
    } else {
        Write-Host "[MISS] $var (optional)" -ForegroundColor DarkGray
    }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Summary" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "[OK] Database variables present - persistence enabled" -ForegroundColor Green
if ($hasPhotoCdn) {
    Write-Host "[OK] Photo CDN configured - HTTPS community hero images can work" -ForegroundColor Green
    exit 0
}
Write-Host "[WARN] Add BLOB or Cloudinary for production-grade community photos" -ForegroundColor Yellow
exit 0
