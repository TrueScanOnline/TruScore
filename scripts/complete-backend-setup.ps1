# Complete Backend Setup Script
# Guides you through the remaining manual steps and helps automate what's possible

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Complete Backend Setup - Interactive Guide" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check current status
Write-Host "Step 1: Checking current configuration..." -ForegroundColor Yellow
$envFile = Join-Path $PSScriptRoot "..\.env"
$backendUrl = $null

if (Test-Path $envFile) {
    $envContent = Get-Content $envFile -Raw
    if ($envContent -match "EXPO_PUBLIC_BACKEND_URL=(.+)") {
        $backendUrl = $matches[1].Trim()
        Write-Host "✅ Backend URL found: $backendUrl" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Backend URL not found in .env" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  .env file not found" -ForegroundColor Yellow
}

Write-Host ""

# Check Vercel environment variables
Write-Host "Step 2: Checking Vercel environment variables..." -ForegroundColor Yellow
if (Get-Command vercel -ErrorAction SilentlyContinue) {
    $envVars = vercel env ls 2>&1
    if ($LASTEXITCODE -eq 0) {
        $hasPostgres = $envVars -match "POSTGRES_URL"
        $hasMongo = $envVars -match "MONGODB_URI"
        $hasBlob = $envVars -match "BLOB_READ_WRITE_TOKEN"
        $hasCloudinary = $envVars -match "CLOUDINARY_CLOUD_NAME"
        
        if ($hasPostgres -or $hasMongo) {
            Write-Host "✅ Database configured" -ForegroundColor Green
        } else {
            Write-Host "❌ Database not configured" -ForegroundColor Red
        }
        
        if ($hasBlob -or $hasCloudinary) {
            Write-Host "✅ Photo storage configured" -ForegroundColor Green
        } else {
            Write-Host "❌ Photo storage not configured" -ForegroundColor Red
        }
    } else {
        Write-Host "⚠️  Could not check Vercel environment variables" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Vercel CLI not found" -ForegroundColor Yellow
}

Write-Host ""

# Database setup guide
Write-Host "Step 3: Database Setup" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To set up the database:" -ForegroundColor White
Write-Host ""
Write-Host "1. Open Vercel Dashboard:" -ForegroundColor Cyan
Write-Host "   https://vercel.com/dashboard" -ForegroundColor White
Write-Host ""
Write-Host "2. Select your project" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Go to: Storage → Create Database → Postgres" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Copy the connection string (looks like:)" -ForegroundColor Cyan
Write-Host "   postgres://user:password@host:port/database?sslmode=require" -ForegroundColor Gray
Write-Host ""
$postgresUrl = Read-Host "5. Paste the POSTGRES_URL here (or press Enter to skip)"

if ($postgresUrl) {
    Write-Host ""
    Write-Host "Adding POSTGRES_URL to Vercel..." -ForegroundColor Yellow
    $addResult = echo $postgresUrl | vercel env add POSTGRES_URL production 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ POSTGRES_URL added successfully" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Failed to add via CLI. Error:" -ForegroundColor Yellow
        Write-Host $addResult -ForegroundColor Gray
        Write-Host ""
        Write-Host "Please add manually:" -ForegroundColor Yellow
        Write-Host "1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables" -ForegroundColor Cyan
        Write-Host "2. Click 'Add New'" -ForegroundColor Cyan
        Write-Host "3. Key: POSTGRES_URL" -ForegroundColor Cyan
        Write-Host "4. Value: $postgresUrl" -ForegroundColor Cyan
        Write-Host "5. Environment: Production" -ForegroundColor Cyan
    }
} else {
    Write-Host "Skipped. You can add POSTGRES_URL manually in Vercel Dashboard." -ForegroundColor Yellow
}

Write-Host ""

# Photo storage setup guide
Write-Host "Step 4: Photo Storage Setup" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To set up photo storage:" -ForegroundColor White
Write-Host ""
Write-Host "1. Open Vercel Dashboard:" -ForegroundColor Cyan
Write-Host "   https://vercel.com/dashboard" -ForegroundColor White
Write-Host ""
Write-Host "2. Select your project" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Go to: Storage → Create Database → Blob" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Copy the BLOB_READ_WRITE_TOKEN" -ForegroundColor Cyan
Write-Host ""
$blobToken = Read-Host "5. Paste the BLOB_READ_WRITE_TOKEN here (or press Enter to skip)"

if ($blobToken) {
    Write-Host ""
    Write-Host "Adding BLOB_READ_WRITE_TOKEN to Vercel..." -ForegroundColor Yellow
    $addResult = echo $blobToken | vercel env add BLOB_READ_WRITE_TOKEN production 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ BLOB_READ_WRITE_TOKEN added successfully" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Failed to add via CLI. Error:" -ForegroundColor Yellow
        Write-Host $addResult -ForegroundColor Gray
        Write-Host ""
        Write-Host "Please add manually:" -ForegroundColor Yellow
        Write-Host "1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables" -ForegroundColor Cyan
        Write-Host "2. Click 'Add New'" -ForegroundColor Cyan
        Write-Host "3. Key: BLOB_READ_WRITE_TOKEN" -ForegroundColor Cyan
        Write-Host "4. Value: $blobToken" -ForegroundColor Cyan
        Write-Host "5. Environment: Production" -ForegroundColor Cyan
    }
} else {
    Write-Host "Skipped. You can add BLOB_READ_WRITE_TOKEN manually in Vercel Dashboard." -ForegroundColor Yellow
}

Write-Host ""

# Redeploy prompt
Write-Host "Step 5: Redeploy Backend" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "After adding environment variables, you need to redeploy the backend." -ForegroundColor White
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
        Write-Host "✅ Backend redeployed successfully" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Redeployment had issues. Check output above." -ForegroundColor Yellow
    }
} else {
    Write-Host "Skipped. Redeploy manually with:" -ForegroundColor Yellow
    Write-Host "  cd backend/vercel" -ForegroundColor Cyan
    Write-Host "  vercel --prod" -ForegroundColor Cyan
}

Write-Host ""

# Final verification
Write-Host "Step 6: Final Verification" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Run verification to check if everything is configured:" -ForegroundColor White
Write-Host "  npm run verify-backend" -ForegroundColor Cyan
Write-Host ""
$verify = Read-Host "Would you like to run verification now? (y/n)"

if ($verify -eq 'y' -or $verify -eq 'Y') {
    Write-Host ""
    Write-Host "Running verification..." -ForegroundColor Yellow
    Push-Location (Join-Path $PSScriptRoot "..")
    npm run verify-backend
    Pop-Location
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""



