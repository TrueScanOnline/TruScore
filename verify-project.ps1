# TrueScan Project Verification Script
# Run this before making any changes to ensure you're in the correct project

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TrueScan Project Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$projectPath = "C:\TrueScan-FoodScanner"
$currentPath = Get-Location

# Check 1: Current Directory
Write-Host "Check 1: Current Directory" -ForegroundColor Yellow
if ($currentPath.Path -eq $projectPath) {
    Write-Host "  ✅ Correct directory: $projectPath" -ForegroundColor Green
} else {
    Write-Host "  ❌ WRONG DIRECTORY!" -ForegroundColor Red
    Write-Host "  Current: $($currentPath.Path)" -ForegroundColor Red
    Write-Host "  Expected: $projectPath" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Run: cd C:\TrueScan-FoodScanner" -ForegroundColor Yellow
    exit 1
}

# Check 2: Package.json exists
Write-Host ""
Write-Host "Check 2: Package.json" -ForegroundColor Yellow
$packageJson = Join-Path $projectPath "package.json"
if (Test-Path $packageJson) {
    Write-Host "  ✅ package.json exists" -ForegroundColor Green
    
    # Check 3: Package name
    try {
        $package = Get-Content $packageJson | ConvertFrom-Json
        if ($package.name -eq "truescan-food-scanner") {
            Write-Host "  ✅ Package name correct: truescan-food-scanner" -ForegroundColor Green
        } else {
            Write-Host "  ❌ WRONG PACKAGE NAME!" -ForegroundColor Red
            Write-Host "  Found: $($package.name)" -ForegroundColor Red
            Write-Host "  Expected: truescan-food-scanner" -ForegroundColor Yellow
            exit 1
        }
    } catch {
        Write-Host "  ❌ Could not parse package.json" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  ❌ package.json not found!" -ForegroundColor Red
    exit 1
}

# Check 4: Key directories
Write-Host ""
Write-Host "Check 3: Project Structure" -ForegroundColor Yellow
$requiredDirs = @("app", "src", "assets")
$allFound = $true

foreach ($dir in $requiredDirs) {
    $dirPath = Join-Path $projectPath $dir
    if (Test-Path $dirPath) {
        Write-Host "  ✅ $dir/ exists" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $dir/ NOT FOUND!" -ForegroundColor Red
        $allFound = $false
    }
}

if (-not $allFound) {
    Write-Host ""
    Write-Host "  ❌ Project structure incomplete!" -ForegroundColor Red
    exit 1
}

# Check 5: README.md
Write-Host ""
Write-Host "Check 4: README.md" -ForegroundColor Yellow
$readme = Join-Path $projectPath "README.md"
if (Test-Path $readme) {
    $readmeContent = Get-Content $readme -Raw
    if ($readmeContent -match "TrueScan") {
        Write-Host "  ✅ README.md contains 'TrueScan'" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  README.md doesn't mention TrueScan" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ⚠️  README.md not found" -ForegroundColor Yellow
}

# Final Result
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ VERIFICATION PASSED" -ForegroundColor Green
Write-Host "You are in the CORRECT project!" -ForegroundColor Green
Write-Host "Project: TrueScan Food Scanner" -ForegroundColor Green
Write-Host "Location: $projectPath" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

exit 0


