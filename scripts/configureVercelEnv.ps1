# Configure Vercel Environment Variables Script
# Sets up database and photo storage environment variables

param(
    [string]$PostgresUrl = "",
    [string]$MongoDbUri = "",
    [string]$BlobToken = "",
    [string]$CloudinaryCloudName = "",
    [string]$CloudinaryApiKey = "",
    [string]$CloudinaryApiSecret = ""
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

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "  CONFIGURE VERCEL ENVIRONMENT VARIABLES" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""

# Check if in correct directory
$currentDir = Get-Location
if (-not (Test-Path "backend\vercel")) {
    Write-ErrorMsg "Please run this script from the project root directory"
    exit 1
}

# Check if Vercel CLI is installed
Write-Info "Checking Vercel CLI..."
try {
    $vercelVersion = vercel --version 2>&1 | Out-String
    Write-Success "Vercel CLI found: $($vercelVersion.Trim())"
} catch {
    Write-ErrorMsg "Vercel CLI not found!"
    Write-Info "Install with: npm install -g vercel"
    exit 1
}

# Check if logged into Vercel
Write-Info "Checking Vercel authentication..."
try {
    $whoamiOutput = vercel whoami 2>&1 | Out-String
    $whoamiExitCode = $LASTEXITCODE
    if ($whoamiExitCode -ne 0) {
        Write-ErrorMsg "Not logged into Vercel! Please run: vercel login"
        exit 1
    }
    $vercelUser = $whoamiOutput.Trim()
    Write-Success "Logged into Vercel as: $vercelUser"
} catch {
    Write-ErrorMsg "Error checking Vercel authentication: $_"
    exit 1
}

# Navigate to backend/vercel
Set-Location "backend\vercel"

# Configure Database
Write-Host ""
Write-Host "===============================================================" -ForegroundColor Yellow
Write-Host "  DATABASE CONFIGURATION" -ForegroundColor Yellow
Write-Host "===============================================================" -ForegroundColor Yellow
Write-Host ""

if ($PostgresUrl) {
    Write-Info "Setting POSTGRES_URL..."
    try {
        $result = vercel env add POSTGRES_URL production 2>&1 | Out-String
        Write-Success "POSTGRES_URL configured"
        Write-Info "Note: You may need to paste the value manually if prompted"
    } catch {
        Write-Warning "Could not set POSTGRES_URL automatically"
        Write-Info "Set it manually: vercel env add POSTGRES_URL production"
    }
} elseif ($MongoDbUri) {
    Write-Info "Setting MONGODB_URI..."
    try {
        $result = vercel env add MONGODB_URI production 2>&1 | Out-String
        Write-Success "MONGODB_URI configured"
        Write-Info "Note: You may need to paste the value manually if prompted"
    } catch {
        Write-Warning "Could not set MONGODB_URI automatically"
        Write-Info "Set it manually: vercel env add MONGODB_URI production"
    }
} else {
    Write-Warning "No database configured"
    Write-Info "To configure database, run:"
    Write-Host "  vercel env add POSTGRES_URL production" -ForegroundColor White
    Write-Host "  OR" -ForegroundColor White
    Write-Host "  vercel env add MONGODB_URI production" -ForegroundColor White
    Write-Host ""
    Write-Info "Or use Vercel Dashboard → Settings → Environment Variables"
}

# Configure Photo Storage
Write-Host ""
Write-Host "===============================================================" -ForegroundColor Yellow
Write-Host "  PHOTO STORAGE CONFIGURATION" -ForegroundColor Yellow
Write-Host "===============================================================" -ForegroundColor Yellow
Write-Host ""

if ($BlobToken) {
    Write-Info "Setting BLOB_READ_WRITE_TOKEN..."
    try {
        $result = vercel env add BLOB_READ_WRITE_TOKEN production 2>&1 | Out-String
        Write-Success "BLOB_READ_WRITE_TOKEN configured"
    } catch {
        Write-Warning "Could not set BLOB_READ_WRITE_TOKEN automatically"
        Write-Info "Set it manually: vercel env add BLOB_READ_WRITE_TOKEN production"
    }
} elseif ($CloudinaryCloudName -and $CloudinaryApiKey -and $CloudinaryApiSecret) {
    Write-Info "Setting Cloudinary credentials..."
    try {
        vercel env add CLOUDINARY_CLOUD_NAME production 2>&1 | Out-Null
        vercel env add CLOUDINARY_API_KEY production 2>&1 | Out-Null
        vercel env add CLOUDINARY_API_SECRET production 2>&1 | Out-Null
        Write-Success "Cloudinary credentials configured"
    } catch {
        Write-Warning "Could not set Cloudinary credentials automatically"
        Write-Info "Set them manually:"
        Write-Host "  vercel env add CLOUDINARY_CLOUD_NAME production" -ForegroundColor White
        Write-Host "  vercel env add CLOUDINARY_API_KEY production" -ForegroundColor White
        Write-Host "  vercel env add CLOUDINARY_API_SECRET production" -ForegroundColor White
    }
} else {
    Write-Warning "No photo storage configured"
    Write-Info "To configure photo storage, run:"
    Write-Host "  vercel env add BLOB_READ_WRITE_TOKEN production" -ForegroundColor White
    Write-Host "  OR set Cloudinary credentials:" -ForegroundColor White
    Write-Host "  vercel env add CLOUDINARY_CLOUD_NAME production" -ForegroundColor White
    Write-Host "  vercel env add CLOUDINARY_API_KEY production" -ForegroundColor White
    Write-Host "  vercel env add CLOUDINARY_API_SECRET production" -ForegroundColor White
    Write-Host ""
    Write-Info "Or use Vercel Dashboard → Settings → Environment Variables"
}

# List current environment variables
Write-Host ""
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "  CURRENT ENVIRONMENT VARIABLES" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""

try {
    vercel env ls
} catch {
    Write-Warning "Could not list environment variables"
}

Write-Host ""
Write-Success "Configuration complete!"
Write-Info "Next: Redeploy backend with: vercel --prod"

Set-Location "..\.."
