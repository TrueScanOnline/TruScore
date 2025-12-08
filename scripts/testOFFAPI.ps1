# Test Open Food Facts API
$url = "https://world.openfoodfacts.org/cgi/search.pl?action=process&countries_tags=en:new-zealand&page_size=5&page=1&json=1&fields=code,product_name"

Write-Host "Testing API: $url" -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri $url -UserAgent "TrueScan-FoodScanner/1.0.0" -TimeoutSec 30 -UseBasicParsing
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    
    $data = $response.Content | ConvertFrom-Json
    Write-Host "Products found: $($data.products.Count)" -ForegroundColor Green
    
    if ($data.products.Count -gt 0) {
        Write-Host "`nFirst 3 products:" -ForegroundColor Yellow
        $data.products[0..2] | ForEach-Object {
            Write-Host "  - $($_.code): $($_.product_name)" -ForegroundColor White
        }
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Full error: $_" -ForegroundColor Red
}
