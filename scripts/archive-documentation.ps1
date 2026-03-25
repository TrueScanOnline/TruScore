# Documentation Archiving Script
# This script archives historical documentation files to docs/archive/
# Strategy: Archive by category to keep organized

Write-Host "=== Documentation Archiving ===" -ForegroundColor Cyan
Write-Host "This script will ARCHIVE (not delete) documentation files" -ForegroundColor Yellow
Write-Host ""

# Ensure archive directories exist
$archiveDirs = @(
    "docs\archive\implementation-reports",
    "docs\archive\database-analysis", 
    "docs\archive\build-deployment",
    "docs\archive\pillar-analysis",
    "docs\archive\fixes-and-issues",
    "docs\archive\testing-reports",
    "docs\archive\setup-guides"
)

foreach ($dir in $archiveDirs) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
}

# Patterns to match and archive locations
$archivePatterns = @{
    # Implementation reports
    "implementation-reports" = @(
        "*_COMPLETE.md",
        "*_IMPLEMENTATION*.md",
        "*_SUMMARY.md",
        "*_FINAL*.md",
        "*_STATUS*.md"
    )
    
    # Database analysis
    "database-analysis" = @(
        "DATABASE_*.md",
        "DATABASE_TEST*.json"
    )
    
    # Build and deployment
    "build-deployment" = @(
        "BUILD_*.md",
        "DEPLOYMENT_*.md",
        "FSANZ_*.md",
        "ANDROID_*.md",
        "IOS_*.md",
        "EAS_*.md",
        "VERCEL_*.md"
    )
    
    # Pillar analysis
    "pillar-analysis" = @(
        "*_PILLAR_*.md",
        "ETHICS_PILLAR*.md",
        "BODY_PILLAR*.md",
        "PLANET_PILLAR*.md",
        "OPEN_PILLAR*.md",
        "CROSS_PILLAR*.md"
    )
    
    # Fixes and issues
    "fixes-and-issues" = @(
        "*_FIX*.md",
        "*_CRITICAL*.md",
        "*_ISSUES*.md",
        "*_TROUBLESHOOTING*.md",
        "*_DIAGNOSIS*.md",
        "FIX_*.md",
        "CRASH_*.md"
    )
    
    # Testing reports
    "testing-reports" = @(
        "*_TESTING*.md",
        "*_TEST*.md",
        "*_VERIFICATION*.md",
        "*_ANALYSIS*.md",
        "E2E_*.md"
    )
    
    # Setup guides (one-time)
    "setup-guides" = @(
        "*_SETUP*.md",
        "*_CONFIGURATION*.md",
        "*_GUIDE.md",
        "*_INSTRUCTIONS*.md"
    )
}

# Files to KEEP in root (essential documentation)
$keepFiles = @(
    "README.md",
    "CLEANUP_PLAN.md",
    "QONVERSION_SETUP.md",  # If actively used
    "Barcode data flow v1.0.md"  # Architecture doc
)

$totalArchived = 0

# Archive files by pattern
foreach ($category in $archivePatterns.Keys) {
    $destDir = "docs\archive\$category"
    $patterns = $archivePatterns[$category]
    
    Write-Host "Archiving $category files..." -ForegroundColor Yellow
    
    foreach ($pattern in $patterns) {
        $files = Get-ChildItem -Path . -Filter $pattern -File -ErrorAction SilentlyContinue
        
        foreach ($file in $files) {
            # Skip files we want to keep
            if ($keepFiles -contains $file.Name) {
                continue
            }
            
            # Skip if already in docs folder
            if ($file.FullName -like "*\docs\*") {
                continue
            }
            
            try {
                $dest = Join-Path $destDir $file.Name
                
                # Handle duplicates by adding timestamp
                if (Test-Path $dest) {
                    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
                    $nameWithoutExt = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
                    $ext = $file.Extension
                    $dest = Join-Path $destDir "$nameWithoutExt-$timestamp$ext"
                }
                
                Move-Item $file.FullName $dest -Force
                Write-Host "  Archived: $($file.Name)" -ForegroundColor Green
                $totalArchived++
            } catch {
                Write-Host "  Error archiving $($file.Name): $_" -ForegroundColor Red
            }
        }
    }
    
    Write-Host ""
}

Write-Host "=== Archiving Complete ===" -ForegroundColor Cyan
Write-Host "Archived $totalArchived documentation files" -ForegroundColor Green
Write-Host ""
Write-Host "Files kept in root:" -ForegroundColor Yellow
foreach ($keep in $keepFiles) {
    if (Test-Path $keep) {
        Write-Host "  - $keep" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "Review the archived files in docs\archive\" -ForegroundColor Yellow

