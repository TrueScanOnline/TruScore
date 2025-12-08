# Deploy Backend and Configure Script
# Automates backend deployment and configuration

param(
    [string]$VercelUrl = "",
    [string]$OffUserId = "",
    [string]$OffPassword = ""
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
Write-Host "  DEPLOY BACKEND AND CONFIGURE" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if in correct directory
$currentDir = Get-Location
if (-not (Test-Path "backend\vercel")) {
    Write-ErrorMsg "Please run this script from the project root directory"
    Write-Info "Expected: backend\vercel directory should exist"
    exit 1
}

# Step 2: Check if Vercel CLI is installed
Write-Info "Checking Vercel CLI..."
try {
    $vercelVersion = vercel --version 2>&1 | Out-String
    Write-Success "Vercel CLI found: $($vercelVersion.Trim())"
} catch {
    Write-ErrorMsg "Vercel CLI not found!"
    Write-Info "Install with: npm install -g vercel"
    exit 1
}

# Step 3: Check if logged into Vercel
Write-Info "Checking Vercel authentication..."
try {
    $easWhoamiOutput = vercel whoami 2>&1 | Out-String
    $easWhoamiExitCode = $LASTEXITCODE
    if ($easWhoamiExitCode -ne 0) {
        Write-ErrorMsg "Not logged into Vercel! Please run: vercel login"
        exit 1
    }
    $vercelUser = $easWhoamiOutput.Trim()
    if ($vercelUser) {
        Write-Success "Logged into Vercel as: $vercelUser"
    } else {
        Write-Success "Logged into Vercel"
    }
} catch {
    Write-ErrorMsg "Error checking Vercel authentication: $_"
    Write-ErrorMsg "Please run: vercel login"
    exit 1
}

# Step 4: Install dependencies
Write-Info "Installing backend dependencies..."
Set-Location "backend\vercel"
try {
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-ErrorMsg "npm install failed!"
        exit 1
    }
    Write-Success "Dependencies installed"
} catch {
    Write-ErrorMsg "Error installing dependencies: $_"
    exit 1
}

# Step 5: Deploy to Vercel
Write-Info "Deploying to Vercel..."
Write-Warning "This may take a few minutes..."
try {
    $deployOutput = vercel --prod --yes 2>&1 | Out-String
    
    # Extract deployment URL from output
    $deploymentUrl = $null
    if ($deployOutput -match 'https://[^\s]+\.vercel\.app') {
        $deploymentUrl = $matches[0]
        Write-Success "Deployment URL: $deploymentUrl"
    } else {
        Write-Warning "Could not extract deployment URL from output"
        Write-Info "Please check Vercel dashboard for your deployment URL"
        if ($VercelUrl) {
            $deploymentUrl = $VercelUrl
            Write-Info "Using provided URL: $deploymentUrl"
        } else {
            $deploymentUrl = Read-Host "Enter your Vercel deployment URL"
        }
    }
    
    if (-not $deploymentUrl) {
        Write-ErrorMsg "Deployment URL is required!"
        exit 1
    }
    
    Write-Success "Backend deployed successfully!"
} catch {
    Write-ErrorMsg "Deployment failed: $_"
    exit 1
}

# Step 6: Update .env file
Write-Info "Updating .env file..."
Set-Location "..\.."
$envPath = ".env"

# Read existing .env or create new
$envContent = @{}
if (Test-Path $envPath) {
    Get-Content $envPath | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $envContent[$matches[1]] = $matches[2]
        }
    }
}

# Update backend URL
$envContent['EXPO_PUBLIC_BACKEND_URL'] = $deploymentUrl
Write-Success "Updated EXPO_PUBLIC_BACKEND_URL: $deploymentUrl"

# Update Open Food Facts credentials if provided
if ($OffUserId) {
    $envContent['EXPO_PUBLIC_OFF_USER_ID'] = $OffUserId
    Write-Success "Updated EXPO_PUBLIC_OFF_USER_ID"
}

if ($OffPassword) {
    $envContent['EXPO_PUBLIC_OFF_PASSWORD'] = $OffPassword
    Write-Success "Updated EXPO_PUBLIC_OFF_PASSWORD"
}

# Write .env file
$envLines = $envContent.GetEnumerator() | ForEach-Object {
    "$($_.Key)=$($_.Value)"
}
$envLines | Set-Content $envPath

Write-Success ".env file updated"

# Step 7: Instructions for Vercel Environment Variables
Write-Host ""
Write-Host "===============================================================" -ForegroundColor Yellow
Write-Host "  NEXT STEPS - Configure Vercel Environment Variables" -ForegroundColor Yellow
Write-Host "===============================================================" -ForegroundColor Yellow
Write-Host ""
Write-Info "Go to Vercel Dashboard → Your Project → Settings → Environment Variables"
Write-Host ""
Write-Info "Add these variables:"
Write-Host ""
Write-Host "1. DATABASE (Choose ONE):" -ForegroundColor Cyan
Write-Host "   POSTGRES_URL=postgres://..." -ForegroundColor White
Write-Host "   OR"
Write-Host "   MONGODB_URI=mongodb+srv://..." -ForegroundColor White
Write-Host ""
Write-Host "2. PHOTO STORAGE (Choose ONE):" -ForegroundColor Cyan
Write-Host "   BLOB_READ_WRITE_TOKEN=vercel_blob_token" -ForegroundColor White
Write-Host "   OR"
Write-Host "   CLOUDINARY_CLOUD_NAME=your_cloud_name" -ForegroundColor White
Write-Host "   CLOUDINARY_API_KEY=your_api_key" -ForegroundColor White
Write-Host "   CLOUDINARY_API_SECRET=your_api_secret" -ForegroundColor White
Write-Host ""
Write-Info "After adding environment variables, redeploy:"
Write-Host "  cd backend\vercel" -ForegroundColor White
Write-Host "  vercel --prod" -ForegroundColor White
Write-Host ""

# Step 8: Test endpoints
Write-Info "Testing API endpoints..."
$testUrl = "$deploymentUrl/api/manufacturing-country?barcode=1234567890123"
try {
    $response = Invoke-WebRequest -Uri $testUrl -Method GET -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Success "API endpoint is accessible!"
    }
} catch {
    Write-Warning "Could not test API endpoint (may need environment variables first)"
}

Write-Host ""
Write-Success "Configuration complete!"
Write-Info "Backend URL: $deploymentUrl"
Write-Info "Next: Configure Vercel environment variables and redeploy"
