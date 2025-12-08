# Add Environment Variables and Redeploy Script
# Automatically adds POSTGRES_URL and BLOB_READ_WRITE_TOKEN to Vercel

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Adding Environment Variables & Redeploying" -ForegroundColor Cyan
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

# Environment variables to add
$postgresUrl = "postgresql://neondb_owner:npg_3knzStHJMac1@ep-spring-union-a7fcjuim-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require"
$blobToken = "vercel_blob_rw_cNcNogtFCGginHBs_9VYgB9gjW4HnFSzTpZ3sIyK9U0MOVD"

Write-Host "Step 1: Adding POSTGRES_URL..." -ForegroundColor Yellow
# Use echo to pipe the value to vercel env add
$postgresResult = echo $postgresUrl | vercel env add POSTGRES_URL production 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ POSTGRES_URL added successfully" -ForegroundColor Green
} else {
    Write-Host "⚠️  POSTGRES_URL may already exist or CLI needs interactive input" -ForegroundColor Yellow
    Write-Host "   If it failed, add manually in Vercel Dashboard" -ForegroundColor Yellow
    Write-Host "   Output: $postgresResult" -ForegroundColor Gray
}
Write-Host ""

Write-Host "Step 2: Adding BLOB_READ_WRITE_TOKEN..." -ForegroundColor Yellow
$blobResult = echo $blobToken | vercel env add BLOB_READ_WRITE_TOKEN production 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ BLOB_READ_WRITE_TOKEN added successfully" -ForegroundColor Green
} else {
    Write-Host "⚠️  BLOB_READ_WRITE_TOKEN may already exist or CLI needs interactive input" -ForegroundColor Yellow
    Write-Host "   If it failed, add manually in Vercel Dashboard" -ForegroundColor Yellow
    Write-Host "   Output: $blobResult" -ForegroundColor Gray
}
Write-Host ""

# Verify environment variables
Write-Host "Step 3: Verifying environment variables..." -ForegroundColor Yellow
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
}
Write-Host ""

# Redeploy backend
Write-Host "Step 4: Redeploying backend..." -ForegroundColor Yellow
Write-Host "This will deploy with the new environment variables." -ForegroundColor White
Write-Host ""

$backendPath = Join-Path $PSScriptRoot "..\backend\vercel"
Push-Location $backendPath

Write-Host "Deploying from: $backendPath" -ForegroundColor Gray
$deployOutput = vercel --prod 2>&1
$deployExit = $LASTEXITCODE

Pop-Location

if ($deployExit -eq 0) {
    Write-Host ""
    Write-Host "✅ Backend redeployed successfully!" -ForegroundColor Green
    Write-Host ""
    
    # Extract deployment URL
    $urlMatch = $deployOutput | Select-String -Pattern "https://[^\s]+\.vercel\.app"
    if ($urlMatch) {
        $deploymentUrl = $urlMatch.Matches[0].Value
        Write-Host "Deployment URL: $deploymentUrl" -ForegroundColor Cyan
    }
} else {
    Write-Host ""
    Write-Host "⚠️  Redeployment had issues. Check output above." -ForegroundColor Yellow
    Write-Host "Deployment output:" -ForegroundColor Gray
    Write-Host $deployOutput -ForegroundColor Gray
}

Write-Host ""

# Final verification
Write-Host "Step 5: Running final verification..." -ForegroundColor Yellow
Write-Host ""
Push-Location (Join-Path $PSScriptRoot "..")
npm run verify-backend
$verifyExit = $LASTEXITCODE
Pop-Location

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
if ($verifyExit -eq 0) {
    Write-Host "✅ Setup Complete!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Setup Complete (with warnings)" -ForegroundColor Yellow
}
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "1. Check verification output above" -ForegroundColor Cyan
Write-Host "2. Test user contributions in the app" -ForegroundColor Cyan
Write-Host "3. Verify data is stored globally" -ForegroundColor Cyan
Write-Host ""



