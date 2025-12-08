# Add Vercel Environment Variables Script
# Helps add database and storage credentials to Vercel

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Add Vercel Environment Variables" -ForegroundColor Cyan
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

# Get Neon Postgres connection string
Write-Host "Step 1: Neon Postgres Database" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "From the Neon integration page you showed:" -ForegroundColor White
Write-Host "1. Find the 'Quickstart' section" -ForegroundColor Cyan
Write-Host "2. Click on '.env.local' tab" -ForegroundColor Cyan
Write-Host "3. Copy the DATABASE_URL value" -ForegroundColor Cyan
Write-Host ""
Write-Host "The connection string should look like:" -ForegroundColor Gray
Write-Host "postgres://user:password@host.neon.tech/dbname?sslmode=require" -ForegroundColor Gray
Write-Host ""
$postgresUrl = Read-Host "Paste the DATABASE_URL here (or press Enter to skip)"

if ($postgresUrl) {
    Write-Host ""
    Write-Host "Adding POSTGRES_URL to Vercel..." -ForegroundColor Yellow
    Write-Host "Note: You'll need to paste the value when prompted" -ForegroundColor Yellow
    Write-Host ""
    
    # Use vercel env add command
    $envAdd = echo $postgresUrl | vercel env add POSTGRES_URL production 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ POSTGRES_URL added successfully" -ForegroundColor Green
    } else {
        Write-Host "⚠️  CLI method may require interactive input" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Alternative: Add manually in Vercel Dashboard:" -ForegroundColor Yellow
        Write-Host "1. Go to: https://vercel.com/dashboard" -ForegroundColor Cyan
        Write-Host "2. Select project: truscoreapi" -ForegroundColor Cyan
        Write-Host "3. Settings → Environment Variables" -ForegroundColor Cyan
        Write-Host "4. Add:" -ForegroundColor Cyan
        Write-Host "   Key: POSTGRES_URL" -ForegroundColor White
        Write-Host "   Value: $postgresUrl" -ForegroundColor White
        Write-Host "   Environment: Production" -ForegroundColor White
    }
} else {
    Write-Host "Skipped. You can add POSTGRES_URL manually." -ForegroundColor Yellow
}

Write-Host ""

# Get Blob storage token
Write-Host "Step 2: Vercel Blob Storage" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "From the Blob Store page you showed:" -ForegroundColor White
Write-Host "1. Look for 'Environment Variables' or 'Connection Details'" -ForegroundColor Cyan
Write-Host "2. Or check the 'Quickstart' section for the token" -ForegroundColor Cyan
Write-Host ""
Write-Host "The token should look like:" -ForegroundColor Gray
Write-Host "vercel_blob_rw_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" -ForegroundColor Gray
Write-Host ""
Write-Host "If you can't find it:" -ForegroundColor Yellow
Write-Host "1. Go to: Settings → Environment Variables" -ForegroundColor Cyan
Write-Host "2. Look for BLOB_READ_WRITE_TOKEN (may already be there)" -ForegroundColor Cyan
Write-Host ""
$blobToken = Read-Host "Paste the BLOB_READ_WRITE_TOKEN here (or press Enter to skip)"

if ($blobToken) {
    Write-Host ""
    Write-Host "Adding BLOB_READ_WRITE_TOKEN to Vercel..." -ForegroundColor Yellow
    Write-Host "Note: You'll need to paste the value when prompted" -ForegroundColor Yellow
    Write-Host ""
    
    $envAdd = echo $blobToken | vercel env add BLOB_READ_WRITE_TOKEN production 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ BLOB_READ_WRITE_TOKEN added successfully" -ForegroundColor Green
    } else {
        Write-Host "⚠️  CLI method may require interactive input" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Alternative: Add manually in Vercel Dashboard:" -ForegroundColor Yellow
        Write-Host "1. Go to: https://vercel.com/dashboard" -ForegroundColor Cyan
        Write-Host "2. Select project: truscoreapi" -ForegroundColor Cyan
        Write-Host "3. Settings → Environment Variables" -ForegroundColor Cyan
        Write-Host "4. Add:" -ForegroundColor Cyan
        Write-Host "   Key: BLOB_READ_WRITE_TOKEN" -ForegroundColor White
        Write-Host "   Value: $blobToken" -ForegroundColor White
        Write-Host "   Environment: Production" -ForegroundColor White
    }
} else {
    Write-Host "Skipped. You can add BLOB_READ_WRITE_TOKEN manually." -ForegroundColor Yellow
}

Write-Host ""

# Check if variables are already set
Write-Host "Step 3: Verifying Environment Variables" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Checking current environment variables..." -ForegroundColor White
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
    Write-Host "⚠️  Could not check environment variables" -ForegroundColor Yellow
}

Write-Host ""

# Redeploy prompt
Write-Host "Step 4: Redeploy Backend" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "After adding environment variables, redeploy the backend:" -ForegroundColor White
Write-Host ""
$redeploy = Read-Host "Would you like to redeploy now? (y/n)"

if ($redeploy -eq 'y' -or $redeploy -eq 'Y') {
    Write-Host ""
    Write-Host "Redeploying backend..." -ForegroundColor Yellow
    $backendPath = Join-Path $PSScriptRoot "..\backend\vercel"
    Push-Location $backendPath
    vercel --prod
    $redeployExit = $LASTEXITCODE
    Pop-Location
    
    if ($redeployExit -eq 0) {
        Write-Host ""
        Write-Host "✅ Backend redeployed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Now verify the configuration:" -ForegroundColor Yellow
        Write-Host "  npm run verify-backend" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "⚠️  Redeployment had issues. Check output above." -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "To redeploy manually:" -ForegroundColor Yellow
    Write-Host "  cd backend/vercel" -ForegroundColor Cyan
    Write-Host "  vercel --prod" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""



