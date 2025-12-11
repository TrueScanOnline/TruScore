# Direct API test with full response inspection

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Direct FSANZ API Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$url = "https://truscoreapi.vercel.app/api/fsanz-query?country=nz&productName=Milk&_$(Get-Date -Format 'yyyyMMddHHmmss')"

Write-Host "Testing: $url" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 30 -ErrorAction Stop
    
    Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Raw Response Body:" -ForegroundColor Yellow
    Write-Host $response.Content
    Write-Host ""
    
    $json = $response.Content | ConvertFrom-Json
    
    Write-Host "Parsed Response Keys: $($json.PSObject.Properties.Name -join ', ')" -ForegroundColor Cyan
    Write-Host ""
    
    if ($json.diagnostic) {
        Write-Host "✅ DIAGNOSTIC FOUND!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Diagnostic Information:" -ForegroundColor Yellow
        Write-Host "  Database Size: $($json.diagnostic.databaseSize)" -ForegroundColor White
        Write-Host "  Direct Contains Matches: $($json.diagnostic.directContainsMatches)" -ForegroundColor White
        Write-Host "  First Match: $($json.diagnostic.firstMatch)" -ForegroundColor White
        if ($json.diagnostic.sampleEntry) {
            Write-Host "  Sample Entry:" -ForegroundColor White
            Write-Host "    foodName: $($json.diagnostic.sampleEntry.foodName)" -ForegroundColor Gray
            Write-Host "    foodNameLower: $($json.diagnostic.sampleEntry.foodNameLower)" -ForegroundColor Gray
            Write-Host "    Keys: $($json.diagnostic.sampleEntry.keys -join ', ')" -ForegroundColor Gray
        }
        
        Write-Host ""
        if ($json.diagnostic.directContainsMatches -gt 0) {
            Write-Host "⚠️  MATCHING ALGORITHM BUG!" -ForegroundColor Red
            Write-Host "   Database HAS $($json.diagnostic.directContainsMatches) matches but algorithm didn't find them!" -ForegroundColor Yellow
        } elseif ($json.diagnostic.databaseSize -eq 0) {
            Write-Host "⚠️  DATABASE NOT LOADING!" -ForegroundColor Red
            Write-Host "   Database size is 0 - file not found or empty!" -ForegroundColor Yellow
        } else {
            Write-Host "⚠️  NO MATCHES IN DATABASE" -ForegroundColor Yellow
            Write-Host "   Database loaded ($($json.diagnostic.databaseSize) entries) but no matches for 'Milk'" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ NO DIAGNOSTIC IN RESPONSE" -ForegroundColor Red
        Write-Host "   This means the deployment doesn't have the latest code!" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Full Response:" -ForegroundColor Gray
        $json | ConvertTo-Json -Depth 10
    }
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $body = $reader.ReadToEnd()
        Write-Host "Response Body: $body" -ForegroundColor Yellow
    }
}

Write-Host ""











