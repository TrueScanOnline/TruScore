# Automated Backend Setup Script
# This script automates as much of the backend setup as possible

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "TrueScan Backend Setup - Automated" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Vercel CLI is installed
Write-Host "Step 1: Checking Vercel CLI..." -ForegroundColor Yellow
if (!(Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "Vercel CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g vercel
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install Vercel CLI" -ForegroundColor Red
        Write-Host "Please install manually: npm install -g vercel" -ForegroundColor Yellow
        exit 1
    }
}
Write-Host "✅ Vercel CLI is installed" -ForegroundColor Green
Write-Host ""

# Check if logged in to Vercel
Write-Host "Step 2: Checking Vercel login status..." -ForegroundColor Yellow
$vercelWhoami = vercel whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Not logged in to Vercel" -ForegroundColor Yellow
    Write-Host "Please login: vercel login" -ForegroundColor Yellow
    Write-Host ""
    $login = Read-Host "Would you like to login now? (y/n)"
    if ($login -eq 'y' -or $login -eq 'Y') {
        vercel login
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Login failed" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "Skipping login. You'll need to login before deployment." -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ Logged in as: $vercelWhoami" -ForegroundColor Green
}
Write-Host ""

# Navigate to backend directory
Write-Host "Step 3: Preparing backend for deployment..." -ForegroundColor Yellow
$backendPath = Join-Path $PSScriptRoot "..\backend\vercel"
if (!(Test-Path $backendPath)) {
    Write-Host "❌ Backend directory not found: $backendPath" -ForegroundColor Red
    exit 1
}

Push-Location $backendPath
Write-Host "✅ Backend directory found" -ForegroundColor Green
Write-Host ""

# Check if .env file exists
Write-Host "Step 4: Checking environment configuration..." -ForegroundColor Yellow
$envFile = Join-Path $backendPath ".env"
$envLocalFile = Join-Path $backendPath ".env.local"

if (!(Test-Path $envFile) -and !(Test-Path $envLocalFile)) {
    Write-Host "⚠️  No .env file found. Creating template..." -ForegroundColor Yellow
    @"
# Backend Environment Variables
# Add these to Vercel Dashboard after deployment:
# Settings → Environment Variables

# Database (Required - Choose ONE)
# POSTGRES_URL=postgres://user:password@host:port/database?sslmode=require
# OR
# MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/truescan

# Photo Storage (Required - Choose ONE)
# BLOB_READ_WRITE_TOKEN=vercel_blob_token_here
# OR
# CLOUDINARY_CLOUD_NAME=your_cloud_name
# CLOUDINARY_API_KEY=your_api_key
# CLOUDINARY_API_SECRET=your_api_secret

# Open Food Facts (Optional)
# OFF_USERNAME=your_username
# OFF_PASSWORD=your_password
"@ | Out-File -FilePath $envFile -Encoding UTF8
    Write-Host "✅ Created .env template at: $envFile" -ForegroundColor Green
} else {
    Write-Host "✅ Environment file exists" -ForegroundColor Green
}
Write-Host ""

# Deploy to Vercel
Write-Host "Step 5: Deploying backend to Vercel..." -ForegroundColor Yellow
Write-Host "This will deploy your backend. Press Ctrl+C to cancel." -ForegroundColor Yellow
Start-Sleep -Seconds 2

$deployOutput = vercel --prod 2>&1
$deployExitCode = $LASTEXITCODE

if ($deployExitCode -eq 0) {
    # Extract deployment URL from output
    $urlMatch = $deployOutput | Select-String -Pattern "https://[^\s]+\.vercel\.app"
    if ($urlMatch) {
        $backendUrl = $urlMatch.Matches[0].Value
        Write-Host ""
        Write-Host "✅ Backend deployed successfully!" -ForegroundColor Green
        Write-Host "Backend URL: $backendUrl" -ForegroundColor Cyan
        Write-Host ""
        
        # Update .env file in project root
        Write-Host "Step 6: Updating app configuration..." -ForegroundColor Yellow
        $projectRoot = Join-Path $PSScriptRoot ".."
        $appEnvFile = Join-Path $projectRoot ".env"
        
        $envContent = @"
# Backend Configuration
EXPO_PUBLIC_BACKEND_URL=$backendUrl
"@
        
        if (Test-Path $appEnvFile) {
            # Check if EXPO_PUBLIC_BACKEND_URL already exists
            $existingContent = Get-Content $appEnvFile -Raw
            if ($existingContent -match "EXPO_PUBLIC_BACKEND_URL") {
                $existingContent = $existingContent -replace "EXPO_PUBLIC_BACKEND_URL=.*", "EXPO_PUBLIC_BACKEND_URL=$backendUrl"
                $existingContent | Out-File -FilePath $appEnvFile -Encoding UTF8 -NoNewline
                Write-Host "✅ Updated existing .env file" -ForegroundColor Green
            } else {
                Add-Content -Path $appEnvFile -Value "`n$envContent"
                Write-Host "✅ Added backend URL to .env file" -ForegroundColor Green
            }
        } else {
            $envContent | Out-File -FilePath $appEnvFile -Encoding UTF8
            Write-Host "✅ Created .env file with backend URL" -ForegroundColor Green
        }
        
        Write-Host ""
        Write-Host "==========================================" -ForegroundColor Cyan
        Write-Host "Next Steps (Manual):" -ForegroundColor Yellow
        Write-Host "==========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "1. Go to Vercel Dashboard:" -ForegroundColor White
        Write-Host "   https://vercel.com/dashboard" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "2. Select your project → Settings → Environment Variables" -ForegroundColor White
        Write-Host ""
        Write-Host "3. Add Database (Required):" -ForegroundColor White
        Write-Host "   - Go to Storage → Create Database → Postgres" -ForegroundColor Cyan
        Write-Host "   - Copy connection string" -ForegroundColor Cyan
        Write-Host "   - Add as: POSTGRES_URL" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "4. Add Photo Storage (Required):" -ForegroundColor White
        Write-Host "   - Go to Storage → Create Database → Blob" -ForegroundColor Cyan
        Write-Host "   - Copy token" -ForegroundColor Cyan
        Write-Host "   - Add as: BLOB_READ_WRITE_TOKEN" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "5. Redeploy backend:" -ForegroundColor White
        Write-Host "   cd backend/vercel" -ForegroundColor Cyan
        Write-Host "   vercel --prod" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "6. Verify configuration:" -ForegroundColor White
        Write-Host "   npm run verify-backend" -ForegroundColor Cyan
        Write-Host ""
        
    } else {
        Write-Host "⚠️  Could not extract backend URL from deployment output" -ForegroundColor Yellow
        Write-Host "Please check Vercel dashboard for your deployment URL" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    Write-Host "Deployment output:" -ForegroundColor Yellow
    Write-Host $deployOutput
    Write-Host ""
    Write-Host "Please check the error above and try again." -ForegroundColor Yellow
}

Pop-Location

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Setup Complete (Partial)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Backend deployment attempted" -ForegroundColor Green
Write-Host "⚠️  Manual steps required:" -ForegroundColor Yellow
Write-Host "   - Configure database in Vercel Dashboard" -ForegroundColor White
Write-Host "   - Configure photo storage in Vercel Dashboard" -ForegroundColor White
Write-Host "   - Redeploy backend after adding environment variables" -ForegroundColor White
Write-Host ""



