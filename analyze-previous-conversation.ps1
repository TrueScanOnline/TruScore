# Script to Help Prepare Previous Conversation for Review
# This script helps split large files and prepare them for analysis

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Previous Conversation Analysis Helper" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$projectPath = "C:\TrueScan-FoodScanner"
$conversationFile = Join-Path $projectPath "previous-conversation.txt"

# Check if file exists
if (-not (Test-Path $conversationFile)) {
    Write-Host "❌ File not found: $conversationFile" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please save your Word document as:" -ForegroundColor Yellow
    Write-Host "  $conversationFile" -ForegroundColor White
    Write-Host ""
    Write-Host "Instructions:" -ForegroundColor Cyan
    Write-Host "1. Open Word document" -ForegroundColor White
    Write-Host "2. File → Save As" -ForegroundColor White
    Write-Host "3. Save as type: Plain Text (*.txt)" -ForegroundColor White
    Write-Host "4. Name: previous-conversation.txt" -ForegroundColor White
    Write-Host "5. Location: $projectPath" -ForegroundColor White
    Write-Host ""
    exit 1
}

# Get file info
$fileInfo = Get-Item $conversationFile
$fileSize = $fileInfo.Length
$fileSizeMB = [math]::Round($fileSize / 1MB, 2)
$lineCount = (Get-Content $conversationFile | Measure-Object -Line).Lines

Write-Host "✅ File found: $conversationFile" -ForegroundColor Green
Write-Host "   Size: $fileSizeMB MB" -ForegroundColor White
Write-Host "   Lines: $lineCount" -ForegroundColor White
Write-Host ""

# Check if file is very large
if ($fileSizeMB -gt 5) {
    Write-Host "⚠️  File is large ($fileSizeMB MB)" -ForegroundColor Yellow
    Write-Host "   Consider splitting into smaller parts for easier analysis" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Would you like to split the file? (Y/N)" -ForegroundColor Cyan
    $split = Read-Host
    
    if ($split -eq "Y" -or $split -eq "y") {
        Write-Host ""
        Write-Host "How many lines per file? (Recommended: 5000-10000)" -ForegroundColor Cyan
        $linesPerFile = Read-Host
        
        try {
            $linesPerFile = [int]$linesPerFile
            $content = Get-Content $conversationFile
            $totalParts = [math]::Ceiling($content.Length / $linesPerFile)
            
            Write-Host ""
            Write-Host "Splitting into $totalParts parts..." -ForegroundColor Yellow
            
            for ($i = 0; $i -lt $totalParts; $i++) {
                $start = $i * $linesPerFile
                $end = [math]::Min($start + $linesPerFile - 1, $content.Length - 1)
                $partFile = Join-Path $projectPath "previous-conversation-part$($i + 1).txt"
                
                $content[$start..$end] | Out-File -FilePath $partFile -Encoding UTF8
                Write-Host "  ✅ Created: previous-conversation-part$($i + 1).txt" -ForegroundColor Green
            }
            
            Write-Host ""
            Write-Host "✅ Split complete! Review parts sequentially." -ForegroundColor Green
        } catch {
            Write-Host "❌ Error splitting file: $_" -ForegroundColor Red
        }
    }
} else {
    Write-Host "✅ File size is manageable for analysis" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "File is ready for analysis!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next step: Tell the Cursor agent:" -ForegroundColor Cyan
Write-Host '  "Please review previous-conversation.txt and identify' -ForegroundColor White
Write-Host '   what development work is missing from the codebase."' -ForegroundColor White
Write-Host ""



