# Monitor Builds and Auto-Submit Script
# This script monitors iOS and Android builds and submits iOS when ready

param(
    [int]$CheckInterval = 60,  # Check every 60 seconds
    [int]$MaxWaitTime = 7200   # Maximum wait time: 2 hours (7200 seconds)
)

Write-Host "=== TrueScan Build Monitor and Auto-Submit ===" -ForegroundColor Cyan
Write-Host "Monitoring builds and will submit iOS build when ready..." -ForegroundColor Yellow
Write-Host ""

$startTime = Get-Date
$elapsed = 0

while ($elapsed -lt $MaxWaitTime) {
    Write-Host "[$((Get-Date).ToString('HH:mm:ss'))] Checking build status..." -ForegroundColor Gray
    
    # Check iOS build
    try {
        $iosBuildJson = npx eas build:list --platform ios --limit 1 --json --non-interactive 2>&1 | Out-String
        $iosBuild = $iosBuildJson | ConvertFrom-Json | Select-Object -First 1
        
        if ($iosBuild) {
            $iosStatus = $iosBuild.status
            $iosId = $iosBuild.id
            
            Write-Host "  iOS Build Status: $iosStatus (ID: $iosId)" -ForegroundColor $(if ($iosStatus -eq 'finished') { 'Green' } elseif ($iosStatus -eq 'in-progress' -or $iosStatus -eq 'in_progress') { 'Yellow' } else { 'Red' })
            
            if ($iosStatus -eq 'finished' -or $iosStatus -eq 'completed') {
                Write-Host ""
                Write-Host "✅ iOS build completed! Submitting to App Store Connect..." -ForegroundColor Green
                
                # Submit to App Store Connect
                $submitResult = npx eas submit -p ios --id $iosId --non-interactive 2>&1
                Write-Host $submitResult
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host ""
                    Write-Host "✅ iOS build submitted successfully to App Store Connect!" -ForegroundColor Green
                } else {
                    Write-Host ""
                    Write-Host "⚠️  iOS submission had issues. Check output above." -ForegroundColor Yellow
                    Write-Host "You can manually submit with: npx eas submit -p ios --id $iosId" -ForegroundColor Yellow
                }
                
                break
            } elseif ($iosStatus -eq 'errored' -or $iosStatus -eq 'failed') {
                Write-Host ""
                Write-Host "❌ iOS build failed! Check EAS dashboard for details." -ForegroundColor Red
                break
            }
        }
    } catch {
        Write-Host "  Could not parse iOS build status" -ForegroundColor Yellow
    }
    
    # Check Android build
    try {
        $androidBuildJson = npx eas build:list --platform android --limit 1 --json --non-interactive 2>&1 | Out-String
        $androidBuild = $androidBuildJson | ConvertFrom-Json | Select-Object -First 1
        
        if ($androidBuild) {
            $androidStatus = $androidBuild.status
            $androidId = $androidBuild.id
            
            Write-Host "  Android Build Status: $androidStatus (ID: $androidId)" -ForegroundColor $(if ($androidStatus -eq 'finished') { 'Green' } elseif ($androidStatus -eq 'in-progress' -or $androidStatus -eq 'in_progress') { 'Yellow' } else { 'Red' })
            
            if ($androidStatus -eq 'finished' -or $androidStatus -eq 'completed') {
                Write-Host ""
                Write-Host "✅ Android build completed!" -ForegroundColor Green
            } elseif ($androidStatus -eq 'errored' -or $androidStatus -eq 'failed') {
                Write-Host ""
                Write-Host "❌ Android build failed! Check EAS dashboard for details." -ForegroundColor Red
            }
        }
    } catch {
        Write-Host "  Could not parse Android build status" -ForegroundColor Yellow
    }
    
    Write-Host ""
    
    # Wait before next check
    Start-Sleep -Seconds $CheckInterval
    $elapsed = ((Get-Date) - $startTime).TotalSeconds
}

Write-Host ""
Write-Host "=== Monitoring Complete ===" -ForegroundColor Cyan
Write-Host "Elapsed time: $([math]::Round($elapsed / 60, 1)) minutes" -ForegroundColor Gray
Write-Host ""
Write-Host "To check build status manually:" -ForegroundColor Yellow
Write-Host "  npx eas build:list --platform all" -ForegroundColor White
Write-Host ""
Write-Host "To submit iOS build manually (if not auto-submitted):" -ForegroundColor Yellow
Write-Host "  npx eas submit -p ios --latest --non-interactive" -ForegroundColor White
