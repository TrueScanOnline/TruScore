# Verify EAS builds are running
$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  EAS Build Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check authentication
Write-Host "1. Checking Authentication..." -ForegroundColor Yellow
$auth = npx eas-cli whoami 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ Authenticated: $auth" -ForegroundColor Green
} else {
    Write-Host "   ✗ NOT AUTHENTICATED" -ForegroundColor Red
    Write-Host "   Run: npx eas-cli login" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "2. Checking Recent Builds..." -ForegroundColor Yellow

# Get build list
$buildsJson = npx eas-cli build:list --platform all --limit 10 --json 2>&1
if ($LASTEXITCODE -eq 0) {
    try {
        $builds = $buildsJson | ConvertFrom-Json
        
        if ($builds -and $builds.Count -gt 0) {
            Write-Host "   Found $($builds.Count) recent build(s)" -ForegroundColor Green
            Write-Host ""
            Write-Host "   Recent Builds:" -ForegroundColor Cyan
            Write-Host "   " + ("=" * 70) -ForegroundColor Gray
            
            $activeCount = 0
            foreach ($build in $builds) {
                $status = $build.status
                $platform = $build.platform
                $created = [DateTime]::Parse($build.createdAt).ToString("yyyy-MM-dd HH:mm:ss")
                $id = $build.id
                
                $statusColor = switch ($status) {
                    "finished" { "Green" }
                    "in-progress" { "Yellow"; $activeCount++ }
                    "errored" { "Red" }
                    "canceled" { "Red" }
                    "new" { "Cyan" }
                    default { "White" }
                }
                
                Write-Host "   [$platform] $status | Created: $created" -ForegroundColor $statusColor
                Write-Host "   ID: $id" -ForegroundColor Gray
                Write-Host ""
            }
            
            if ($activeCount -gt 0) {
                Write-Host "   ✓ $activeCount active build(s) found!" -ForegroundColor Green
            } else {
                Write-Host "   ⚠ No active builds found" -ForegroundColor Yellow
                Write-Host "   Check if builds completed or failed to start" -ForegroundColor Yellow
            }
        } else {
            Write-Host "   ⚠ No builds found" -ForegroundColor Yellow
            Write-Host "   This could mean:" -ForegroundColor Yellow
            Write-Host "   - Builds haven't started yet" -ForegroundColor Gray
            Write-Host "   - Authentication issue" -ForegroundColor Gray
            Write-Host "   - Project not linked to EAS" -ForegroundColor Gray
        }
    } catch {
        Write-Host "   ✗ Error parsing build list: $_" -ForegroundColor Red
        Write-Host "   Raw output:" -ForegroundColor Yellow
        Write-Host $buildsJson
    }
} else {
    Write-Host "   ✗ Failed to get build list" -ForegroundColor Red
    Write-Host "   Output: $buildsJson" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "3. Dashboard Link:" -ForegroundColor Yellow
Write-Host "   https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/builds" -ForegroundColor Cyan
Write-Host ""











