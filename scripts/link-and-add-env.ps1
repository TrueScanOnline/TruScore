# Link Vercel Project and Add Environment Variables
# This script links the backend to Vercel project and adds environment variables

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Link Project & Add Environment Variables" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Vercel CLI is installed and logged in
if (!(Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Vercel CLI not found. Please install: npm install -g vercel" -ForegroundColor Red
    exit 1
}

$whoami = vercel whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not logged in to Vercel. Please run: vercel login" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Logged in as: $whoami" -ForegroundColor Green
Write-Host ""

# Navigate to backend directory
$backendPath = Join-Path $PSScriptRoot "..\backend\vercel"
if (!(Test-Path $backendPath)) {
    Write-Host "❌ Backend directory not found: $backendPath" -ForegroundColor Red
    exit 1
}

Push-Location $backendPath
Write-Host "Current directory: $backendPath" -ForegroundColor Gray
Write-Host ""

# Check if already linked
Write-Host "Step 1: Checking if project is linked..." -ForegroundColor Yellow
$linkCheck = vercel ls 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Project appears to be linked" -ForegroundColor Green
} else {
    Write-Host "⚠️  Project may not be linked. Attempting to link..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "You'll be prompted to:" -ForegroundColor White
    Write-Host "1. Select your project (truscoreapi)" -ForegroundColor Cyan
    Write-Host "2. Confirm linking" -ForegroundColor Cyan
    Write-Host ""
    vercel link
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to link project" -ForegroundColor Red
        Pop-Location
        exit 1
    }
}
Write-Host ""

# Environment variables
$postgresUrl = "postgresql://neondb_owner:npg_3knzStHJMac1@ep-spring-union-a7fcjuim-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require"
$blobToken = "vercel_blob_rw_cNcNogtFCGginHBs_9VYgB9gjW4HnFSzTpZ3sIyK9U0MOVD"

Write-Host "Step 2: Adding POSTGRES_URL..." -ForegroundColor Yellow
Write-Host "Note: You may be prompted to confirm" -ForegroundColor Gray
$postgresResult = echo $postgresUrl | vercel env add POSTGRES_URL production 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ POSTGRES_URL added successfully" -ForegroundColor Green
} else {
    Write-Host "⚠️  POSTGRES_URL may already exist" -ForegroundColor Yellow
    Write-Host "   Checking if it exists..." -ForegroundColor Gray
    $envCheck = vercel env ls 2>&1
    if ($envCheck -match "POSTGRES_URL") {
        Write-Host "✅ POSTGRES_URL already exists" -ForegroundColor Green
    } else {
        Write-Host "❌ POSTGRES_URL not found. Please add manually:" -ForegroundColor Red
        Write-Host "   Vercel Dashboard → Settings → Environment Variables" -ForegroundColor Cyan
        Write-Host "   Key: POSTGRES_URL" -ForegroundColor White
        Write-Host "   Value: $postgresUrl" -ForegroundColor White
    }
}
Write-Host ""

Write-Host "Step 3: Adding BLOB_READ_WRITE_TOKEN..." -ForegroundColor Yellow
Write-Host "Note: You may be prompted to confirm" -ForegroundColor Gray
$blobResult = echo $blobToken | vercel env add BLOB_READ_WRITE_TOKEN production 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ BLOB_READ_WRITE_TOKEN added successfully" -ForegroundColor Green
} else {
    Write-Host "⚠️  BLOB_READ_WRITE_TOKEN may already exist" -ForegroundColor Yellow
    Write-Host "   Checking if it exists..." -ForegroundColor Gray
    $envCheck = vercel env ls 2>&1
    if ($envCheck -match "BLOB_READ_WRITE_TOKEN") {
        Write-Host "✅ BLOB_READ_WRITE_TOKEN already exists" -ForegroundColor Green
    } else {
        Write-Host "❌ BLOB_READ_WRITE_TOKEN not found. Please add manually:" -ForegroundColor Red
        Write-Host "   Vercel Dashboard → Settings → Environment Variables" -ForegroundColor Cyan
        Write-Host "   Key: BLOB_READ_WRITE_TOKEN" -ForegroundColor White
        Write-Host "   Value: $blobToken" -ForegroundColor White
    }
}
Write-Host ""

# Verify
Write-Host "Step 4: Verifying environment variables..." -ForegroundColor Yellow
$envVars = vercel env ls 2>&1
if ($LASTEXITCODE -eq 0) {
    $hasPostgres = $envVars -match "POSTGRES_URL"
    $hasBlob = $envVars -match "BLOB_READ_WRITE_TOKEN"
    
    if ($hasPostgres) {
        Write-Host "✅ POSTGRES_URL is configured" -ForegroundColor Green
    } else {
        Write-Host "❌ POSTGRES_URL is NOT configured" -ForegroundColor Red
    }
    
    if ($hasBlob) {
        Write-Host "✅ BLOB_READ_WRITE_TOKEN is configured" -ForegroundColor Green
    } else {
        Write-Host "❌ BLOB_READ_WRITE_TOKEN is NOT configured" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️  Could not verify environment variables" -ForegroundColor Yellow
    Write-Host "   Please check manually in Vercel Dashboard" -ForegroundColor Yellow
}
Write-Host ""

Pop-Location

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Next Step: Redeploy Backend" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "After adding environment variables, redeploy:" -ForegroundColor White
Write-Host "  cd backend/vercel" -ForegroundColor Cyan
Write-Host "  vercel --prod" -ForegroundColor Cyan
Write-Host ""
Write-Host "Or run:" -ForegroundColor White
Write-Host "  npm run setup-backend:final" -ForegroundColor Cyan
Write-Host ""



