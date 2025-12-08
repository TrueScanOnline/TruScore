# Convert DOCX files to text files that can be read

$docxDir = "C:\TrueScan-FoodScanner\TruScore logic"
$docxFiles = @(
    "Tru_Score_Engine_Detailed_Specification_20251129_v2.docx",
    "TruScore_Methodology_Explainer_20251129.docx"
)

Write-Host "Converting DOCX files to text..." -ForegroundColor Cyan

foreach ($docx in $docxFiles) {
    $docxPath = Join-Path $docxDir $docx
    $txtPath = Join-Path $docxDir ($docx -replace '\.docx$', '.txt')
    
    if (Test-Path $docxPath) {
        Write-Host "  Processing: $docx" -ForegroundColor Yellow
        
        try {
            # Try using Word COM object
            $word = New-Object -ComObject Word.Application
            $word.Visible = $false
            
            $doc = $word.Documents.Open($docxPath)
            $text = $doc.Content.Text
            $doc.Close($false)
            $word.Quit()
            
            [System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
            
            # Save as text file
            $text | Out-File -FilePath $txtPath -Encoding UTF8
            
            Write-Host "  ✓ Converted to: $txtPath" -ForegroundColor Green
            Write-Host "    Size: $($text.Length) characters" -ForegroundColor Gray
        } catch {
            Write-Host "  ✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "    Try: Open the DOCX file, Select All (Ctrl+A), Copy (Ctrl+C)," -ForegroundColor Yellow
            Write-Host "    then paste into a new .txt file manually." -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ✗ File not found: $docxPath" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Done! Text files should now be readable." -ForegroundColor Green
