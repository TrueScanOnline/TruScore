# PowerShell script to help extract PDF content
# This will guide you through extracting text from PDFs

Write-Host "=== PDF Content Extraction Guide ===" -ForegroundColor Cyan
Write-Host ""

$pdfDir = "C:\TrueScan-FoodScanner\TruScore logic"
$pdfs = @(
    "Tru_Score_Engine_Detailed_Specification_20251129_v2.pdf",
    "TruScore_Methodology_Explainer_20251129.pdf"
)

Write-Host "PDF Files to Analyze:" -ForegroundColor Yellow
foreach ($pdf in $pdfs) {
    $fullPath = Join-Path $pdfDir $pdf
    if (Test-Path $fullPath) {
        $size = (Get-Item $fullPath).Length / 1MB
        Write-Host "  ✓ $pdf ($([math]::Round($size, 2)) MB)" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $pdf (NOT FOUND)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Options to Extract PDF Content:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Option 1: Manual Copy/Paste (Easiest)" -ForegroundColor Cyan
Write-Host "  1. Open each PDF in Adobe Reader or browser"
Write-Host "  2. Select All (Ctrl+A) and Copy (Ctrl+C)"
Write-Host "  3. Paste the content into a text file or provide to AI"
Write-Host ""
Write-Host "Option 2: Use Online Converter" -ForegroundColor Cyan
Write-Host "  1. Go to: https://www.ilovepdf.com/pdf_to_txt"
Write-Host "  2. Upload the PDFs"
Write-Host "  3. Download as .txt files"
Write-Host "  4. Place .txt files in: $pdfDir"
Write-Host ""
Write-Host "Option 3: PowerShell with Word (if Word is installed)" -ForegroundColor Cyan
Write-Host "  This script will attempt to use Word to extract text..."
Write-Host ""

# Try to extract using Word if available
try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    
    Write-Host "Attempting to extract text using Microsoft Word..." -ForegroundColor Yellow
    
    foreach ($pdf in $pdfs) {
        $pdfPath = Join-Path $pdfDir $pdf
        $txtPath = Join-Path $pdfDir ($pdf -replace '\.pdf$', '.txt')
        
        if (Test-Path $pdfPath) {
            try {
                Write-Host "  Processing: $pdf" -ForegroundColor Gray
                $doc = $word.Documents.Open($pdfPath)
                $doc.SaveAs([ref]$txtPath, [ref]2) # 2 = wdFormatText
                $doc.Close()
                Write-Host "  ✓ Extracted to: $txtPath" -ForegroundColor Green
            } catch {
                Write-Host "  ✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    }
    
    $word.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
} catch {
    Write-Host "Word is not available. Please use Option 1 or 2 above." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Once text is extracted, I can analyze it against the current code." -ForegroundColor Green
