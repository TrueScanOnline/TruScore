# Check Vercel Logs for Test Activity
# Shows recent logs and filters for test barcode

param(
    [string]$Barcode = "",
    [int]$Limit = 50
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Checking Vercel Logs" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$backendPath = Join-Path $PSScriptRoot "..\backend\vercel"
if (!(Test-Path $backendPath)) {
    Write-Host "❌ Backend directory not found: $backendPath" -ForegroundColor Red
    exit 1
}

Push-Location $backendPath

try {
    # Get latest deployment URL (without --json flag for compatibility)
    Write-Host "Getting latest deployment..." -ForegroundColor Yellow
    $deploymentInfo = vercel ls --prod 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to get deployments" -ForegroundColor Red
        Write-Host "   Make sure you're logged in: vercel login" -ForegroundColor Yellow
        Write-Host "   Error output: $deploymentInfo" -ForegroundColor Gray
        exit 1
    }
    
    # Extract URL from text output (format: https://vercel-xxx.vercel.app)
    $urlMatches = $deploymentInfo | Select-String -Pattern "https://[^\s]+\.vercel\.app" -AllMatches
    if ($urlMatches -and $urlMatches.Matches.Count -gt 0) {
        # Get the first URL (most recent deployment)
        $deploymentUrl = $urlMatches.Matches[0].Value
        Write-Host "   Deployment: $deploymentUrl" -ForegroundColor Gray
        Write-Host ""
    } else {
        Write-Host "❌ Could not determine deployment URL from output" -ForegroundColor Red
        Write-Host "   Output preview:" -ForegroundColor Gray
        Write-Host $deploymentInfo.Substring(0, [Math]::Min(200, $deploymentInfo.Length)) -ForegroundColor DarkGray
        exit 1
    }
    
    Write-Host "Fetching recent logs..." -ForegroundColor Yellow
    Write-Host ""
    
    $logs = vercel logs $deploymentUrl 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        if ($Barcode) {
            Write-Host "Filtering for barcode: $Barcode" -ForegroundColor Yellow
            Write-Host ""
            
            $filteredLogs = $logs | Select-String -Pattern $Barcode -Context 2
            
            if ($filteredLogs) {
                Write-Host "✅ Found logs containing barcode:" -ForegroundColor Green
                Write-Host ""
                $filteredLogs | ForEach-Object {
                    Write-Host $_.Line -ForegroundColor Gray
                    if ($_.Context.PreContext) {
                        $_.Context.PreContext | ForEach-Object {
                            Write-Host "  $_" -ForegroundColor DarkGray
                        }
                    }
                    if ($_.Context.PostContext) {
                        $_.Context.PostContext | ForEach-Object {
                            Write-Host "  $_" -ForegroundColor DarkGray
                        }
                    }
                    Write-Host ""
                }
            } else {
                Write-Host "⚠️  No logs found containing barcode: $Barcode" -ForegroundColor Yellow
                Write-Host "   Logs may take a few seconds to appear" -ForegroundColor Gray
            }
        } else {
            Write-Host "Recent logs:" -ForegroundColor Yellow
            Write-Host ""
            Write-Host $logs -ForegroundColor Gray
        }
    } else {
        Write-Host "❌ Failed to retrieve logs" -ForegroundColor Red
        Write-Host "   Make sure you're logged in: vercel login" -ForegroundColor Yellow
        Write-Host "   Output: $logs" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Error checking logs: $_" -ForegroundColor Red
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Log Check Complete" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

