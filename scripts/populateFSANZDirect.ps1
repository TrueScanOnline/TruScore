# Direct FSANZ Population - Fetches and saves products directly
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('NZ','AU')]
    [string]$Country,
    
    [int]$Limit = 2000
)

$ErrorActionPreference = "Continue"
$outputFile = "backend\vercel\data\fsanz-$($Country.ToLower()).json"
$countryTag = if ($Country -eq 'NZ') { 'en:new-zealand' } else { 'en:australia' }

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Populate FSANZ $Country Database" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Target: $Limit products" -ForegroundColor Yellow
Write-Host ""

New-Item -ItemType Directory -Path (Split-Path $outputFile -Parent) -Force | Out-Null

$database = @{}
$page = 1
$fetched = 0
$pageSize = 100

while ($fetched -lt $Limit) {
    $url = "https://world.openfoodfacts.org/cgi/search.pl?action=process&countries_tags=$countryTag&page_size=$pageSize&page=$page&json=1&fields=code,product_name,product_name_en,brands,categories_tags,nutriments,ingredients_text"
    
    Write-Host "Fetching page $page... ($fetched/$Limit products)" -ForegroundColor Gray
    
    try {
        $response = Invoke-WebRequest -Uri $url -UserAgent "TrueScan-FoodScanner/1.0.0" -TimeoutSec 30 -UseBasicParsing
        $data = $response.Content | ConvertFrom-Json
        
        if (-not $data.products -or $data.products.Count -eq 0) {
            Write-Host "No more products found" -ForegroundColor Yellow
            break
        }
        
        foreach ($product in $data.products) {
            if ($fetched -ge $Limit) { break }
            
            $barcode = $product.code
            if (-not $barcode -or $barcode.Length -lt 8) { continue }
            
            $productName = if ($product.product_name) { $product.product_name } 
                          elseif ($product.product_name_en) { $product.product_name_en }
                          else { "Product $barcode" }
            
            if (-not $productName) { continue }
            
            $nutriments = if ($product.nutriments) { $product.nutriments } else { @{} }
            
            $fsanzProduct = @{
                productName = $productName
                country = $Country
            }
            
            if ($product.brands) { $fsanzProduct.brand = ($product.brands -split ',')[0].Trim() }
            if ($nutriments.'energy-kcal_100g') { $fsanzProduct.energyKcal = $nutriments.'energy-kcal_100g' }
            elseif ($nutriments.'energy-kj_100g') { $fsanzProduct.energyKcal = [math]::Round($nutriments.'energy-kj_100g' / 4.184, 2) }
            if ($nutriments.'fat_100g') { $fsanzProduct.fat = $nutriments.'fat_100g' }
            if ($nutriments.'saturated-fat_100g') { $fsanzProduct.saturatedFat = $nutriments.'saturated-fat_100g' }
            if ($nutriments.'carbohydrates_100g') { $fsanzProduct.carbohydrates = $nutriments.'carbohydrates_100g' }
            if ($nutriments.'sugars_100g') { $fsanzProduct.sugars = $nutriments.'sugars_100g' }
            if ($nutriments.'proteins_100g') { $fsanzProduct.protein = $nutriments.'proteins_100g' }
            if ($nutriments.'salt_100g') { $fsanzProduct.salt = $nutriments.'salt_100g' }
            if ($nutriments.'sodium_100g') { $fsanzProduct.sodium = $nutriments.'sodium_100g' }
            if ($nutriments.'fiber_100g') { $fsanzProduct.dietaryFiber = $nutriments.'fiber_100g' }
            if ($product.ingredients_text) { $fsanzProduct.ingredients = $product.ingredients_text }
            if ($product.categories_tags -and $product.categories_tags.Count -gt 0) { 
                $fsanzProduct.categories = $product.categories_tags[0..2] 
            }
            
            $database[$barcode] = $fsanzProduct
            $fetched++
        }
        
        Write-Host "  ✅ Fetched $($data.products.Count) products (total: $fetched)" -ForegroundColor Green
        
        if ($data.products.Count -lt $pageSize) {
            Write-Host "Reached end of available products" -ForegroundColor Yellow
            break
        }
        
        $page++
        Start-Sleep -Seconds 1
        
    } catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        break
    }
}

if ($database.Count -eq 0) {
    Write-Host "No products found!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Saving database..." -ForegroundColor Yellow

$json = $database | ConvertTo-Json -Depth 10
$json | Out-File -FilePath $outputFile -Encoding utf8 -NoNewline

$fileSize = (Get-Item $outputFile).Length

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Conversion Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Country: $Country" -ForegroundColor White
Write-Host "   Products: $($database.Count.ToString('N0'))" -ForegroundColor White
Write-Host "   Output: $outputFile" -ForegroundColor White
Write-Host "   Size: $([math]::Round($fileSize / 1MB, 2)) MB" -ForegroundColor White
Write-Host ""
