# Test FSANZ Database Endpoint
# Verifies the Vercel endpoint is working correctly

param(
    [string]$Url = "https://truscore-2gm890hqf-leightons-projects-d328c774.vercel.app/api/fsanz-database"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FSANZ Database Endpoint Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Testing NZ endpoint..." -ForegroundColor Yellow
$nzUrl = "$Url?country=nz"
Write-Host "URL: $nzUrl" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri $nzUrl -Method GET -UseBasicParsing
    
    Write-Host "✅ Status Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "✅ Headers:" -ForegroundColor Green
    $response.Headers | Format-Table
    
    $content = $response.Content
    Write-Host ""
    Write-Host "Response Content (first 200 chars):" -ForegroundColor Cyan
    Write-Host $content.Substring(0, [Math]::Min(200, $content.Length)) -ForegroundColor Gray
    
    # Try to parse as JSON
    try {
        $json = $content | ConvertFrom-Json
        Write-Host ""
        Write-Host "✅ Valid JSON response" -ForegroundColor Green
        if ($json.PSObject.Properties.Count -eq 0) {
            Write-Host "⚠️  Empty database (expected if not populated)" -ForegroundColor Yellow
        } else {
            Write-Host "✅ Database contains data" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠️  Response is not valid JSON" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Error testing endpoint:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "Status Code: $statusCode" -ForegroundColor Red
        
        if ($statusCode -eq 401) {
            Write-Host ""
            Write-Host "⚠️  401 Unauthorized - Endpoint may not be deployed or requires authentication" -ForegroundColor Yellow
            Write-Host "   Solution: Deploy to Vercel using: .\scripts\deployFSANZFix.ps1" -ForegroundColor Yellow
        } elseif ($statusCode -eq 404) {
            Write-Host ""
            Write-Host "⚠️  404 Not Found - Endpoint not found" -ForegroundColor Yellow
            Write-Host "   Solution: Check Vercel deployment and endpoint path" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "Testing AU endpoint..." -ForegroundColor Yellow
$auUrl = "$Url?country=au"
Write-Host "URL: $auUrl" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri $auUrl -Method GET -UseBasicParsing
    
    Write-Host "✅ Status Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "✅ Response received successfully" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Error testing AU endpoint:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

