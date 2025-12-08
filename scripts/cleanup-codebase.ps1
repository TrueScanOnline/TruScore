# Codebase Cleanup Script
# Archives old documentation and identifies files for cleanup

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TrueScan Codebase Cleanup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$rootPath = "c:\TrueScan-FoodScanner"
$archivePath = "$rootPath\docs\archive"

# Ensure archive directory exists
if (-not (Test-Path $archivePath)) {
    New-Item -ItemType Directory -Path $archivePath -Force | Out-Null
    Write-Host "Created archive directory: $archivePath" -ForegroundColor Green
}

# Patterns for files to archive (temporary reports, fix docs, etc.)
$archivePatterns = @(
    "FSANZ_*",
    "AFCD_*",
    "DEPLOY_*",
    "FIX_*",
    "EXECUTE_*",
    "START_*",
    "BUILD_*",
    "TESTING_*",
    "EAS_BUILD_*",
    "*_FIX_*.md",
    "*_COMPLETE_*.md",
    "*_ANALYSIS_*.md",
    "*_STATUS_*.md",
    "*_SUMMARY_*.md",
    "*_REPORT_*.md",
    "*_GUIDE_*.md",
    "*_SOLUTION_*.md"
)

# Essential files to keep in root
$essentialFiles = @(
    "README.md",
    "TRUSCORE_SPECIFICATION_VS_CODE_ANALYSIS.md",
    "CODEBASE_CLEANUP_SUMMARY.md",
    "CLEANUP_REPORT.md",
    "package.json",
    "tsconfig.json",
    "eas.json",
    ".gitignore"
)

Write-Host "Scanning for files to archive..." -ForegroundColor Yellow
$filesToArchive = @()

Get-ChildItem -Path $rootPath -Filter "*.md" -File | ForEach-Object {
    $fileName = $_.Name
    $isEssential = $essentialFiles -contains $fileName
    
    if (-not $isEssential) {
        foreach ($pattern in $archivePatterns) {
            if ($fileName -like $pattern) {
                $filesToArchive += $_
                break
            }
        }
    }
}

Write-Host ""
Write-Host "Found $($filesToArchive.Count) files to archive" -ForegroundColor Cyan
Write-Host ""

if ($filesToArchive.Count -gt 0) {
    Write-Host "Files to archive:" -ForegroundColor Yellow
    $filesToArchive | ForEach-Object {
        Write-Host "  - $($_.Name)" -ForegroundColor Gray
    }
    
    Write-Host ""
    $confirm = Read-Host "Archive these files? (y/n)"
    
    if ($confirm -eq 'y') {
        $archived = 0
        foreach ($file in $filesToArchive) {
            try {
                $destPath = Join-Path $archivePath $file.Name
                Move-Item -Path $file.FullName -Destination $destPath -Force
                $archived++
            } catch {
                Write-Host "  Error archiving $($file.Name): $_" -ForegroundColor Red
            }
        }
        Write-Host ""
        Write-Host "Archived $archived files to $archivePath" -ForegroundColor Green
    } else {
        Write-Host "Archive cancelled." -ForegroundColor Yellow
    }
} else {
    Write-Host "No files to archive." -ForegroundColor Green
}

Write-Host ""
Write-Host "Cleanup scan complete!" -ForegroundColor Cyan
