# Check FSANZ database health on Vercel

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FSANZ Health Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Waiting 60 seconds for deployment..." -ForegroundColor Yellow
Start-Sleep -Seconds 60

Write-Host ""
Write-Host "Checking database files on Vercel..." -ForegroundColor Yellow
Write-Host ""

try {
    $health = Invoke-RestMethod -Uri "https://truscoreapi.vercel.app/api/fsanz-health" -TimeoutSec 30 -ErrorAction Stop
    
    Write-Host "NZFCD Database:" -ForegroundColor Cyan
    Write-Host "  Found: $($health.nzfcd.found)" -ForegroundColor $(if ($health.nzfcd.found) { "Green" } else { "Red" })
    Write-Host "  Size: $($health.nzfcd.sizeMB) MB" -ForegroundColor White
    Write-Host "  Entries: $($health.nzfcd.entries)" -ForegroundColor White
    if (-not $health.nzfcd.found) {
        Write-Host "  ⚠️  File not found on Vercel!" -ForegroundColor Yellow
        Write-Host "  Tried paths:" -ForegroundColor Gray
        $health.nzfcd.paths | ForEach-Object { Write-Host "    - $_" -ForegroundColor Gray }
    }
    
    Write-Host ""
    Write-Host "AFCD Database:" -ForegroundColor Cyan
    Write-Host "  Found: $($health.afcd.found)" -ForegroundColor $(if ($health.afcd.found) { "Green" } else { "Red" })
    Write-Host "  Size: $($health.afcd.sizeMB) MB" -ForegroundColor White
    Write-Host "  Entries: $($health.afcd.entries)" -ForegroundColor White
    
    Write-Host ""
    Write-Host "Server Info:" -ForegroundColor Cyan
    Write-Host "  Working Dir: $($health.workingDir)" -ForegroundColor Gray
    Write-Host "  __dirname: $($health.__dirname)" -ForegroundColor Gray
    
    Write-Host ""
    if ($health.nzfcd.found -and $health.nzfcd.entries -gt 0) {
        Write-Host "✅ NZFCD database is loaded!" -ForegroundColor Green
        Write-Host "   Issue is with matching algorithm" -ForegroundColor Yellow
    } elseif (-not $health.nzfcd.found) {
        Write-Host "❌ NZFCD database file NOT FOUND on Vercel!" -ForegroundColor Red
        Write-Host "   File is not being deployed - check .vercelignore" -ForegroundColor Yellow
    } elseif ($health.nzfcd.entries -eq 0) {
        Write-Host "❌ NZFCD database is empty or can't be parsed!" -ForegroundColor Red
        Write-Host "   File exists but JSON parsing failed" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Error checking health: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""









