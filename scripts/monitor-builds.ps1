# Monitor EAS builds and report status
$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  EAS Build Monitor" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to check build status
function Get-BuildStatus {
    Write-Host "Checking build status..." -ForegroundColor Yellow
    $builds = npx eas-cli build:list --platform all --limit 10 --json 2>&1 | ConvertFrom-Json
    
    if ($builds) {
        Write-Host ""
        Write-Host "Recent Builds:" -ForegroundColor Cyan
        Write-Host "==============" -ForegroundColor Cyan
        
        foreach ($build in $builds) {
            $status = $build.status
            $platform = $build.platform
            $created = $build.createdAt
            $id = $build.id
            
            $color = switch ($status) {
                "finished" { "Green" }
                "in-progress" { "Yellow" }
                "errored" { "Red" }
                "canceled" { "Red" }
                default { "White" }
            }
            
            Write-Host "  [$platform] Status: $status | Created: $created | ID: $id" -ForegroundColor $color
        }
        
        # Check for in-progress builds
        $inProgress = $builds | Where-Object { $_.status -eq "in-progress" }
        if ($inProgress) {
            Write-Host ""
            Write-Host "Active builds: $($inProgress.Count)" -ForegroundColor Yellow
            return $true
        } else {
            Write-Host ""
            Write-Host "No active builds" -ForegroundColor Green
            return $false
        }
    } else {
        Write-Host "No builds found or error retrieving builds" -ForegroundColor Yellow
        return $false
    }
}

# Monitor loop
$maxChecks = 60  # Check for up to 60 times (30 minutes if checking every 30 seconds)
$checkCount = 0
$hasActiveBuilds = $true

while ($hasActiveBuilds -and $checkCount -lt $maxChecks) {
    $checkCount++
    Write-Host ""
    Write-Host "Check #$checkCount at $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Cyan
    $hasActiveBuilds = Get-BuildStatus
    
    if ($hasActiveBuilds) {
        Write-Host "Waiting 30 seconds before next check..." -ForegroundColor Gray
        Start-Sleep -Seconds 30
    }
}

if ($checkCount -ge $maxChecks) {
    Write-Host ""
    Write-Host "Maximum check count reached. Stopping monitoring." -ForegroundColor Yellow
    Write-Host "You can check builds manually at:" -ForegroundColor Cyan
    Write-Host "https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/builds" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "All builds completed!" -ForegroundColor Green
}

Write-Host ""
Write-Host "Final build status:" -ForegroundColor Cyan
Get-BuildStatus














