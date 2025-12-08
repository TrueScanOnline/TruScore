# Configure Vercel Environment Variables Script
# Helps automate adding environment variables to Vercel

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Vercel Environment Variables Setup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Vercel CLI is installed
if (!(Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Vercel CLI not found. Please install: npm install -g vercel" -ForegroundColor Red
    exit 1
}

# Check if logged in
$whoami = vercel whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not logged in to Vercel. Please run: vercel login" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Logged in as: $whoami" -ForegroundColor Green
Write-Host ""

# Get project name
Write-Host "Step 1: Getting project information..." -ForegroundColor Yellow
$projectInfo = vercel ls --json 2>&1 | ConvertFrom-Json
if ($projectInfo) {
    Write-Host "Found projects:" -ForegroundColor Cyan
    $projectInfo | ForEach-Object { Write-Host "  - $($_.name)" -ForegroundColor White }
    Write-Host ""
}

# Database setup
Write-Host "Step 2: Database Configuration" -ForegroundColor Yellow
Write-Host "Choose database option:" -ForegroundColor White
Write-Host "1. Vercel Postgres (Recommended)" -ForegroundColor Cyan
Write-Host "2. MongoDB Atlas" -ForegroundColor Cyan
Write-Host "3. Skip (configure manually)" -ForegroundColor Cyan
$dbChoice = Read-Host "Enter choice (1-3)"

if ($dbChoice -eq "1") {
    Write-Host ""
    Write-Host "To create Vercel Postgres:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://vercel.com/dashboard" -ForegroundColor Cyan
    Write-Host "2. Select your project" -ForegroundColor Cyan
    Write-Host "3. Go to: Storage → Create Database → Postgres" -ForegroundColor Cyan
    Write-Host "4. Copy the connection string" -ForegroundColor Cyan
    Write-Host ""
    $postgresUrl = Read-Host "Paste POSTGRES_URL here (or press Enter to skip)"
    
    if ($postgresUrl) {
        Write-Host "Adding POSTGRES_URL to Vercel..." -ForegroundColor Yellow
        vercel env add POSTGRES_URL production
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ POSTGRES_URL added" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Failed to add via CLI. Please add manually in Vercel Dashboard" -ForegroundColor Yellow
        }
    }
} elseif ($dbChoice -eq "2") {
    Write-Host ""
    $mongodbUri = Read-Host "Enter MONGODB_URI (or press Enter to skip)"
    
    if ($mongodbUri) {
        Write-Host "Adding MONGODB_URI to Vercel..." -ForegroundColor Yellow
        vercel env add MONGODB_URI production
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ MONGODB_URI added" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Failed to add via CLI. Please add manually in Vercel Dashboard" -ForegroundColor Yellow
        }
    }
}

Write-Host ""

# Photo storage setup
Write-Host "Step 3: Photo Storage Configuration" -ForegroundColor Yellow
Write-Host "Choose storage option:" -ForegroundColor White
Write-Host "1. Vercel Blob Storage (Recommended)" -ForegroundColor Cyan
Write-Host "2. Cloudinary" -ForegroundColor Cyan
Write-Host "3. Skip (configure manually)" -ForegroundColor Cyan
$storageChoice = Read-Host "Enter choice (1-3)"

if ($storageChoice -eq "1") {
    Write-Host ""
    Write-Host "To create Vercel Blob Storage:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://vercel.com/dashboard" -ForegroundColor Cyan
    Write-Host "2. Select your project" -ForegroundColor Cyan
    Write-Host "3. Go to: Storage → Create Database → Blob" -ForegroundColor Cyan
    Write-Host "4. Copy the BLOB_READ_WRITE_TOKEN" -ForegroundColor Cyan
    Write-Host ""
    $blobToken = Read-Host "Paste BLOB_READ_WRITE_TOKEN here (or press Enter to skip)"
    
    if ($blobToken) {
        Write-Host "Adding BLOB_READ_WRITE_TOKEN to Vercel..." -ForegroundColor Yellow
        vercel env add BLOB_READ_WRITE_TOKEN production
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ BLOB_READ_WRITE_TOKEN added" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Failed to add via CLI. Please add manually in Vercel Dashboard" -ForegroundColor Yellow
        }
    }
} elseif ($storageChoice -eq "2") {
    Write-Host ""
    $cloudName = Read-Host "Enter CLOUDINARY_CLOUD_NAME (or press Enter to skip)"
    $apiKey = Read-Host "Enter CLOUDINARY_API_KEY (or press Enter to skip)"
    $apiSecret = Read-Host "Enter CLOUDINARY_API_SECRET (or press Enter to skip)"
    
    if ($cloudName -and $apiKey -and $apiSecret) {
        Write-Host "Adding Cloudinary credentials to Vercel..." -ForegroundColor Yellow
        vercel env add CLOUDINARY_CLOUD_NAME production
        vercel env add CLOUDINARY_API_KEY production
        vercel env add CLOUDINARY_API_SECRET production
        Write-Host "✅ Cloudinary credentials added" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Next Step: Redeploy Backend" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "After adding environment variables, redeploy:" -ForegroundColor White
Write-Host "  cd backend/vercel" -ForegroundColor Cyan
Write-Host "  vercel --prod" -ForegroundColor Cyan
Write-Host ""
Write-Host "Then verify:" -ForegroundColor White
Write-Host "  npm run verify-backend" -ForegroundColor Cyan
Write-Host ""



