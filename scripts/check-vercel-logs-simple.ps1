# Simple Vercel Logs Checker
# Shows recent logs without requiring deployment URL

param(
    [string]$Barcode = ""
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Checking Vercel Logs (Simple)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: This script shows recent logs from Vercel Dashboard." -ForegroundColor Yellow
Write-Host "For detailed logs, use Vercel Dashboard → Your Project → Logs" -ForegroundColor Yellow
Write-Host ""

$backendPath = Join-Path $PSScriptRoot "..\backend\vercel"
if (!(Test-Path $backendPath)) {
    Write-Host "❌ Backend directory not found: $backendPath" -ForegroundColor Red
    exit 1
}

Push-Location $backendPath

try {
    Write-Host "Getting deployment information..." -ForegroundColor Yellow
    Write-Host ""
    
    # Get list of deployments
    $deployments = vercel ls --prod 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Recent deployments:" -ForegroundColor Green
        Write-Host ""
        Write-Host $deployments -ForegroundColor Gray
        Write-Host ""
        
        if ($Barcode) {
            Write-Host "Looking for barcode: $Barcode" -ForegroundColor Yellow
            Write-Host ""
            
            if ($deployments -match $Barcode) {
                Write-Host "✅ Found references to test barcode in deployment list" -ForegroundColor Green
            } else {
                Write-Host "⚠️  Test barcode not found in deployment list" -ForegroundColor Yellow
                Write-Host "   This is normal - logs may take time to appear" -ForegroundColor Gray
            }
        }
        
        Write-Host ""
        Write-Host "To view detailed logs:" -ForegroundColor Cyan
        Write-Host "1. Go to: https://vercel.com/dashboard" -ForegroundColor White
        Write-Host "2. Select your project" -ForegroundColor White
        Write-Host "3. Click 'Logs' tab" -ForegroundColor White
        Write-Host "4. Filter by your test barcode: $Barcode" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host "❌ Failed to get deployments" -ForegroundColor Red
        Write-Host "   Make sure you're logged in: vercel login" -ForegroundColor Yellow
        Write-Host "   Error: $deployments" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Log Check Complete" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

