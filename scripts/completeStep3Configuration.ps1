# Complete Step 3: Configure Vercel Environment Variables
# This script helps you configure database and photo storage

$ErrorActionPreference = "Stop"

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-ErrorMsg {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "  STEP 3: CONFIGURE VERCEL ENVIRONMENT VARIABLES" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""

# Check Vercel CLI
Write-Info "Checking Vercel CLI..."
try {
    $vercelVersion = vercel --version 2>&1 | Out-String
    Write-Success "Vercel CLI found"
} catch {
    Write-ErrorMsg "Vercel CLI not found! Install with: npm install -g vercel"
    exit 1
}

# Check authentication
Write-Info "Checking Vercel authentication..."
try {
    $whoami = vercel whoami 2>&1 | Out-String
    if ($LASTEXITCODE -ne 0) {
        Write-ErrorMsg "Not logged into Vercel! Run: vercel login"
        exit 1
    }
    Write-Success "Authenticated with Vercel"
} catch {
    Write-ErrorMsg "Error checking authentication"
    exit 1
}

# Navigate to backend
Set-Location "backend\vercel"

Write-Host ""
Write-Host "===============================================================" -ForegroundColor Yellow
Write-Host "  DATABASE CONFIGURATION" -ForegroundColor Yellow
Write-Host "===============================================================" -ForegroundColor Yellow
Write-Host ""

Write-Info "You need to configure a database. Choose an option:"
Write-Host ""
Write-Host "1. Vercel Postgres (Recommended - Easiest)" -ForegroundColor Green
Write-Host "   - Go to Vercel Dashboard → Your Project → Storage" -ForegroundColor White
Write-Host "   - Click 'Create Database' → Select 'Postgres'" -ForegroundColor White
Write-Host "   - Copy the connection string" -ForegroundColor White
Write-Host ""
Write-Host "2. MongoDB Atlas (Alternative)" -ForegroundColor Green
Write-Host "   - Create account at https://www.mongodb.com/cloud/atlas" -ForegroundColor White
Write-Host "   - Create free cluster" -ForegroundColor White
Write-Host "   - Get connection string" -ForegroundColor White
Write-Host ""
Write-Host "3. Skip for now (uses in-memory storage - data lost on restart)" -ForegroundColor Yellow
Write-Host ""

$dbChoice = Read-Host "Enter choice (1, 2, or 3)"

if ($dbChoice -eq "1") {
    Write-Info "Setting up Vercel Postgres..."
    Write-Warning "You need to create the database in Vercel Dashboard first!"
    Write-Info "After creating, run: vercel env add POSTGRES_URL production"
    Write-Info "Then paste the connection string when prompted"
    
    $proceed = Read-Host "Have you created the Postgres database? (y/n)"
    if ($proceed -eq "y") {
        Write-Info "Adding POSTGRES_URL environment variable..."
        Write-Info "When prompted, paste your Postgres connection string"
        vercel env add POSTGRES_URL production
        if ($LASTEXITCODE -eq 0) {
            Write-Success "POSTGRES_URL configured!"
        } else {
            Write-Warning "Could not add POSTGRES_URL. Add it manually in Vercel Dashboard"
        }
    }
} elseif ($dbChoice -eq "2") {
    Write-Info "Setting up MongoDB Atlas..."
    Write-Warning "You need to create MongoDB Atlas cluster first!"
    Write-Info "After creating, run: vercel env add MONGODB_URI production"
    Write-Info "Then paste the connection string when prompted"
    
    $proceed = Read-Host "Have you created the MongoDB cluster? (y/n)"
    if ($proceed -eq "y") {
        Write-Info "Adding MONGODB_URI environment variable..."
        Write-Info "When prompted, paste your MongoDB connection string"
        vercel env add MONGODB_URI production
        if ($LASTEXITCODE -eq 0) {
            Write-Success "MONGODB_URI configured!"
        } else {
            Write-Warning "Could not add MONGODB_URI. Add it manually in Vercel Dashboard"
        }
    }
} else {
    Write-Warning "Skipping database configuration (using in-memory storage)"
    Write-Warning "⚠️  Data will be lost on function restart!"
}

Write-Host ""
Write-Host "===============================================================" -ForegroundColor Yellow
Write-Host "  PHOTO STORAGE CONFIGURATION" -ForegroundColor Yellow
Write-Host "===============================================================" -ForegroundColor Yellow
Write-Host ""

Write-Info "You need to configure photo storage. Choose an option:"
Write-Host ""
Write-Host "1. Vercel Blob Storage (Recommended - Easiest)" -ForegroundColor Green
Write-Host "   - Go to Vercel Dashboard → Your Project → Storage" -ForegroundColor White
Write-Host "   - Click 'Create Database' → Select 'Blob'" -ForegroundColor White
Write-Host "   - Copy the BLOB_READ_WRITE_TOKEN" -ForegroundColor White
Write-Host ""
Write-Host "2. Cloudinary (Alternative)" -ForegroundColor Green
Write-Host "   - Create account at https://cloudinary.com" -ForegroundColor White
Write-Host "   - Get credentials from Dashboard" -ForegroundColor White
Write-Host ""
Write-Host "3. Skip for now (uses base64 in database - not recommended for production)" -ForegroundColor Yellow
Write-Host ""

$photoChoice = Read-Host "Enter choice (1, 2, or 3)"

if ($photoChoice -eq "1") {
    Write-Info "Setting up Vercel Blob Storage..."
    Write-Warning "You need to create the Blob storage in Vercel Dashboard first!"
    Write-Info "After creating, run: vercel env add BLOB_READ_WRITE_TOKEN production"
    Write-Info "Then paste the token when prompted"
    
    $proceed = Read-Host "Have you created the Blob storage? (y/n)"
    if ($proceed -eq "y") {
        Write-Info "Adding BLOB_READ_WRITE_TOKEN environment variable..."
        Write-Info "When prompted, paste your blob token"
        vercel env add BLOB_READ_WRITE_TOKEN production
        if ($LASTEXITCODE -eq 0) {
            Write-Success "BLOB_READ_WRITE_TOKEN configured!"
        } else {
            Write-Warning "Could not add BLOB_READ_WRITE_TOKEN. Add it manually in Vercel Dashboard"
        }
    }
} elseif ($photoChoice -eq "2") {
    Write-Info "Setting up Cloudinary..."
    Write-Warning "You need to create Cloudinary account first!"
    Write-Info "After creating, you'll need to add 3 environment variables:"
    Write-Host "  - CLOUDINARY_CLOUD_NAME" -ForegroundColor White
    Write-Host "  - CLOUDINARY_API_KEY" -ForegroundColor White
    Write-Host "  - CLOUDINARY_API_SECRET" -ForegroundColor White
    
    $proceed = Read-Host "Have you created the Cloudinary account? (y/n)"
    if ($proceed -eq "y") {
        Write-Info "Adding Cloudinary environment variables..."
        
        Write-Info "Adding CLOUDINARY_CLOUD_NAME..."
        vercel env add CLOUDINARY_CLOUD_NAME production
        Write-Info "Adding CLOUDINARY_API_KEY..."
        vercel env add CLOUDINARY_API_KEY production
        Write-Info "Adding CLOUDINARY_API_SECRET..."
        vercel env add CLOUDINARY_API_SECRET production
        
        Write-Success "Cloudinary credentials configured!"
    }
} else {
    Write-Warning "Skipping photo storage configuration (using base64 in database)"
    Write-Warning "⚠️  Not recommended for production!"
}

# List current environment variables
Write-Host ""
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "  CURRENT ENVIRONMENT VARIABLES" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""

vercel env ls

Write-Host ""
Write-Success "Configuration complete!"
Write-Info "Next: Redeploy backend with: vercel --prod"
Write-Host ""

Set-Location "..\.."
