# Complete Automated Deployment Script
# Fixes root directory issue and completes entire setup

$ErrorActionPreference = "Continue"

Write-Host "`n" -NoNewline
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  Complete Automated FSANZ Deployment" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptRoot
$backendDir = Join-Path $projectRoot "backend\vercel"

# Step 1: Clean everything
Write-Host "Step 1: Cleaning configuration..." -ForegroundColor Yellow
Set-Location $backendDir
Remove-Item -Recurse -Force .vercel -ErrorAction SilentlyContinue
Write-Host "  ✅ Cleaned old configuration" -ForegroundColor Green

# Step 2: Ensure files are ready
Write-Host "`nStep 2: Preparing files..." -ForegroundColor Yellow
$dataDir = Join-Path $backendDir "data"
if (-not (Test-Path $dataDir)) {
    New-Item -ItemType Directory -Path $dataDir -Force | Out-Null
}

if (Test-Path (Join-Path $projectRoot "data\fsanz-au.json")) {
    Copy-Item (Join-Path $projectRoot "data\fsanz-au.json") $dataDir -Force -ErrorAction SilentlyContinue
}

if (Test-Path (Join-Path $projectRoot "data\fsanz-nz.json")) {
    Copy-Item (Join-Path $projectRoot "data\fsanz-nz.json") $dataDir -Force -ErrorAction SilentlyContinue
}
Write-Host "  ✅ Files ready" -ForegroundColor Green

# Step 3: Create deployment configuration
Write-Host "`nStep 3: Creating deployment config..." -ForegroundColor Yellow

# Update vercel.json to be explicit
$vercelJson = @{
    version = 2
    functions = @{
        "api/nz-prices.ts" = @{
            maxDuration = 60
            memory = 1024
        }
        "api/fsanz-database.ts" = @{
            maxDuration = 30
            memory = 1024
        }
    }
    rewrites = @(
        @{
            source = "/api/fsanz/:country.json"
            destination = "/api/fsanz-database?country=:country"
        }
    )
    headers = @(
        @{
            source = "/api/fsanz/(.*)"
            headers = @(
                @{
                    key = "Cache-Control"
                    value = "public, max-age=31536000, immutable"
                }
                @{
                    key = "Access-Control-Allow-Origin"
                    value = "*"
                }
            )
        }
    )
}

$vercelJsonPath = Join-Path $backendDir "vercel.json"
$vercelJson | ConvertTo-Json -Depth 10 | Set-Content -Path $vercelJsonPath
Write-Host "  ✅ Updated vercel.json" -ForegroundColor Green

# Step 4: Deploy
Write-Host "`nStep 4: Starting deployment..." -ForegroundColor Yellow
Write-Host "  This will require minimal interaction:" -ForegroundColor Cyan
Write-Host "  - Answer questions as prompted" -ForegroundColor White
Write-Host "  - For 'code directory': Try pressing Enter or type '.'" -ForegroundColor White
Write-Host ""

# Check if logged in
$whoami = vercel whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ❌ Not logged in to Vercel" -ForegroundColor Red
    Write-Host "  Run: vercel login" -ForegroundColor Yellow
    exit 1
}

Write-Host "  ✅ Logged in as: $whoami" -ForegroundColor Green
Write-Host ""

# Deploy
Write-Host "Deploying... (follow prompts)" -ForegroundColor White
vercel --prod

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  Deployment Completed" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "After deployment:" -ForegroundColor Yellow
Write-Host "  1. Copy the Production URL from output above" -ForegroundColor White
Write-Host "  2. Run: cd ..\.." -ForegroundColor White
Write-Host "  3. Run: .\scripts\updateEnvWithVercelUrl.ps1 -Url `"YOUR-URL`"" -ForegroundColor White
Write-Host ""

Set-Location $projectRoot

















