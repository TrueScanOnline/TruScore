# Add Vercel Environment Variables
# Adds POSTGRES_URL and BLOB_READ_WRITE_TOKEN to Vercel

param(
    [string]$PostgresUrl = "",
    [string]$BlobToken = ""
)

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

Write-Host ""
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "  ADD VERCEL ENVIRONMENT VARIABLES" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""

# Check Vercel CLI
Write-Info "Checking Vercel CLI..."
try {
    vercel --version | Out-Null
    Write-Success "Vercel CLI found"
} catch {
    Write-ErrorMsg "Vercel CLI not found! Install with: npm install -g vercel"
    exit 1
}

# Check authentication
Write-Info "Checking authentication..."
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

# Add POSTGRES_URL
if ($PostgresUrl) {
    Write-Info "Adding POSTGRES_URL environment variable..."
    Write-Info "Using provided connection string"
    
    # Use echo to pipe the value
    $PostgresUrl | vercel env add POSTGRES_URL production 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "POSTGRES_URL added successfully!"
    } else {
        Write-ErrorMsg "Failed to add POSTGRES_URL"
        Write-Info "Add manually: vercel env add POSTGRES_URL production"
        Write-Info "Then paste: $PostgresUrl"
    }
} else {
    Write-Info "Adding POSTGRES_URL (you'll be prompted to paste the value)..."
    Write-Info "Paste this value when prompted:"
    Write-Host "postgresql://neondb_owner:npg_3knzStHJMac1@ep-spring-union-a7fcjuim-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require" -ForegroundColor Yellow
    Write-Host ""
    vercel env add POSTGRES_URL production
}

# Add BLOB_READ_WRITE_TOKEN
if ($BlobToken) {
    Write-Info "Adding BLOB_READ_WRITE_TOKEN environment variable..."
    Write-Info "Using provided token"
    
    $BlobToken | vercel env add BLOB_READ_WRITE_TOKEN production 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "BLOB_READ_WRITE_TOKEN added successfully!"
    } else {
        Write-ErrorMsg "Failed to add BLOB_READ_WRITE_TOKEN"
        Write-Info "Add manually: vercel env add BLOB_READ_WRITE_TOKEN production"
        Write-Info "Get token from: Vercel Dashboard → Storage → Your Blob store → Settings"
    }
} else {
    Write-Info "Adding BLOB_READ_WRITE_TOKEN (you'll be prompted to paste the value)..."
    Write-Info "Get token from: Vercel Dashboard → Storage → Your Blob store → Settings"
    Write-Host ""
    vercel env add BLOB_READ_WRITE_TOKEN production
}

# List environment variables
Write-Host ""
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "  CURRENT ENVIRONMENT VARIABLES" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""

vercel env ls

Write-Host ""
Write-Success "Environment variables configured!"
Write-Info "Next: Redeploy backend with: vercel --prod"

Set-Location "..\.."
