# Codebase Cleanup Script
# This script performs a systematic cleanup of the codebase
# Strategy: Archive first, then delete only clearly temporary files

Write-Host "=== TrueScan Codebase Cleanup ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Delete temporary text files (clearly temporary, no value)
Write-Host "Step 1: Removing temporary build command files..." -ForegroundColor Yellow
$tempTxtFiles = @(
    "BUILD_APK_NOW.txt",
    "BUILD_IOS_NOW.txt", 
    "BUILD_IOS_V9_COMMANDS.txt",
    "COPY_PASTE_BUILD_SCRIPT.txt",
    "COPY_PASTE_THIS_COMMAND.txt",
    "COPY_THIS_INTO_POWERSHELL.txt",
    "FINAL_BUILD_COMMAND.txt",
    "REBUILD_AND_SUBMIT.txt",
    "RUN_FULL_BUILD.txt",
    "SUBMIT_IOS_NOW.txt"
)

$deletedCount = 0
foreach ($file in $tempTxtFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "  Deleted: $file" -ForegroundColor Green
        $deletedCount++
    }
}

Write-Host "  Deleted $deletedCount temporary text files" -ForegroundColor Green
Write-Host ""

# Step 2: Delete test JSON files (temporary test data)
Write-Host "Step 2: Removing temporary test JSON files..." -ForegroundColor Yellow
$testJsonFiles = Get-ChildItem -Path . -Filter "barcode_*.json" -File
$testResultFiles = Get-ChildItem -Path . -Filter "*TEST*.json" -File | Where-Object { $_.Name -notmatch "package" }

$deletedCount = 0
foreach ($file in $testJsonFiles) {
    Remove-Item $file.FullName -Force
    Write-Host "  Deleted: $($file.Name)" -ForegroundColor Green
    $deletedCount++
}

foreach ($file in $testResultFiles) {
    Remove-Item $file.FullName -Force
    Write-Host "  Deleted: $($file.Name)" -ForegroundColor Green
    $deletedCount++
}

Write-Host "  Deleted $deletedCount test JSON files" -ForegroundColor Green
Write-Host ""

# Step 3: Remove empty Analysis documents folder
Write-Host "Step 3: Checking for empty folders..." -ForegroundColor Yellow
if (Test-Path "Analysis documents" -PathType Container) {
    $items = Get-ChildItem "Analysis documents" -Force
    if ($items.Count -eq 0) {
        Remove-Item "Analysis documents" -Force
        Write-Host "  Removed empty 'Analysis documents' folder" -ForegroundColor Green
    } else {
        Write-Host "  'Analysis documents' folder has content, keeping it" -ForegroundColor Yellow
    }
}
Write-Host ""

# Step 4: Archive one-time fix scripts
Write-Host "Step 4: Archiving one-time fix scripts..." -ForegroundColor Yellow
$oneTimeScripts = @(
    "scripts\ABSOLUTE_FINAL_FIX.js",
    "scripts\FINAL_FIX_NZFCD.js",
    "scripts\finalNZFCDFix.js",
    "scripts\FIX_AND_VERIFY_FSANZ.js",
    "scripts\FIX_NZFCD_ONCE_AND_FOR_ALL.js",
    "scripts\fixNZFCD.js",
    "scripts\fixNZFCDDatabase.js",
    "scripts\forceFixNZFCD.js",
    "scripts\GUARANTEED_NZFCD_FIX.js",
    "scripts\ULTIMATE_NZFCD_FIX.js",
    "scripts\DEFINITIVE_NZFCD_FIX.js",
    "scripts\WORKING_NZFCD_GENERATOR.js",
    "scripts\regenerateNZFCDCorrectly.js",
    "scripts\directNZFCDGeneration.js",
    "scripts\finalFSANZFixAndTest.js",
    "scripts\completeFSANZFixAndTest.js"
)

$archivedCount = 0
foreach ($script in $oneTimeScripts) {
    if (Test-Path $script) {
        $dest = "scripts\archive\one-time\$(Split-Path $script -Leaf)"
        Move-Item $script $dest -Force
        Write-Host "  Archived: $(Split-Path $script -Leaf)" -ForegroundColor Green
        $archivedCount++
    }
}

Write-Host "  Archived $archivedCount one-time fix scripts" -ForegroundColor Green
Write-Host ""

# Step 5: Archive duplicate/test variation scripts (keeping originals referenced in package.json)
Write-Host "Step 5: Archiving duplicate script variations..." -ForegroundColor Yellow
$duplicateScripts = Get-ChildItem -Path "scripts" -Filter "test*.ts" -File | Where-Object {
    $name = $_.Name
    # Keep scripts referenced in package.json
    -not ($name -eq "test-user-contributions-e2e.ts" -or
          $name -eq "test-all-data-entry-e2e.ts" -or
          $name -eq "testBarcodePerformance.ts")
}

$archivedCount = 0
foreach ($script in $duplicateScripts) {
    $dest = "scripts\archive\one-time\$($script.Name)"
    Move-Item $script.FullName $dest -Force
    Write-Host "  Archived: $($script.Name)" -ForegroundColor Green
    $archivedCount++
}

# Also archive duplicate analyze scripts
$duplicateAnalyze = Get-ChildItem -Path "scripts" -Filter "analyze*.js" -File | Where-Object {
    $name = $_.Name
    -not ($name -eq "analyze-truscore-standalone.ts" -or $name -eq "analyze-pillar.ts")
}

foreach ($script in $duplicateAnalyze) {
    if ($script.Extension -eq ".js") {
        $dest = "scripts\archive\one-time\$($script.Name)"
        Move-Item $script.FullName $dest -Force
        Write-Host "  Archived: $($script.Name)" -ForegroundColor Green
        $archivedCount++
    }
}

Write-Host "  Archived $archivedCount duplicate/test variation scripts" -ForegroundColor Green
Write-Host ""

Write-Host "=== Cleanup Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Review the archived files in scripts\archive\one-time\" -ForegroundColor White
Write-Host "2. Consider archiving documentation files to docs\archive\" -ForegroundColor White
Write-Host "3. Run 'npx tsc --noEmit' to verify no broken imports" -ForegroundColor White
