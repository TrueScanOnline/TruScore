# Get Product Counts for NZFCD and AFCD

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DATABASE PRODUCT COUNT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$nzfcdPath = "backend\vercel\data\nzfcd.json"
$afcdPath = "backend\vercel\data\afcd.json"

# NZFCD Count
if (Test-Path $nzfcdPath) {
    Write-Host "🇳🇿 NEW ZEALAND (NZFCD):" -ForegroundColor Green
    $nzContent = Get-Content $nzfcdPath -Raw
    $nzData = $nzContent | ConvertFrom-Json
    $nzSize = (Get-Item $nzfcdPath).Length / 1MB
    Write-Host "   Products: $($nzData.Count.ToString('N0'))" -ForegroundColor White
    Write-Host "   Size: $([math]::Round($nzSize, 2)) MB" -ForegroundColor Gray
} else {
    Write-Host "🇳🇿 NEW ZEALAND (NZFCD): File not found" -ForegroundColor Red
}

Write-Host ""

# AFCD Count
if (Test-Path $afcdPath) {
    Write-Host "🇦🇺 AUSTRALIA (AFCD):" -ForegroundColor Green
    $auContent = Get-Content $afcdPath -Raw
    $auData = $auContent | ConvertFrom-Json
    $auSize = (Get-Item $afcdPath).Length / 1MB
    Write-Host "   Products: $($auData.Count.ToString('N0'))" -ForegroundColor White
    Write-Host "   Size: $([math]::Round($auSize, 2)) MB" -ForegroundColor Gray
} else {
    Write-Host "🇦🇺 AUSTRALIA (AFCD): File not found" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
