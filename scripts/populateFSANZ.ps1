# Populate FSANZ Database from Open Food Facts
# Usage: .\scripts\populateFSANZ.ps1 -Country NZ -Limit 2000

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('NZ','AU')]
    [string]$Country,
    
    [Parameter(Mandatory=$false)]
    [int]$Limit = 2000
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Populate FSANZ $Country Database" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$outputFile = Join-Path $PSScriptRoot "..\backend\vercel\data\fsanz-$($Country.ToLower()).json"
$outputDir = Split-Path $outputFile -Parent

if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
    Write-Host "Created output directory: $outputDir" -ForegroundColor Green
}

$countryTag = if ($Country -eq 'NZ') { 'en:new-zealand' } else { 'en:australia' }
$database = @{}
$page = 1
$fetched = 0
$pageSize = 100

Write-Host "Fetching $Country products from Open Food Facts..." -ForegroundColor Yellow
Write-Host "Target: $Limit products" -ForegroundColor Yellow
Write-Host ""

while ($fetched -lt $Limit) {
    try {
        $url = "https://world.openfoodfacts.org/cgi/search.pl?action=process&countries_tags=$countryTag&page_size=$pageSize&page=$page&json=1&fields=code,product_name,product_name_en,brands,categories_tags,nutriments,ingredients_text"
        
        Write-Host "Fetching page $page... ($fetched/$Limit products)" -ForegroundColor Gray
        
        try {
            $response = Invoke-WebRequest -Uri $url -UserAgent "TrueScan-FoodScanner/1.0.0" -TimeoutSec 30 -UseBasicParsing -ErrorAction Stop
            $data = $response.Content | ConvertFrom-Json -ErrorAction Stop
        } catch {
            Write-Host "HTTP Error: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "URL: $url" -ForegroundColor Gray
            throw
        }
        
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
            
            $nutriments = $product.nutriments
            if (-not $nutriments) { $nutriments = @{} }
            
            $fsanzProductObj = @{
                productName = $productName
                country = $Country
            }
            
            if ($product.brands) { $fsanzProductObj.brand = ($product.brands -split ',')[0].Trim() }
            if ($nutriments.'energy-kcal_100g') { $fsanzProductObj.energyKcal = $nutriments.'energy-kcal_100g' }
            elseif ($nutriments.'energy-kj_100g') { $fsanzProductObj.energyKcal = [math]::Round($nutriments.'energy-kj_100g' / 4.184, 2) }
            if ($nutriments.'fat_100g') { $fsanzProductObj.fat = $nutriments.'fat_100g' }
            if ($nutriments.'saturated-fat_100g') { $fsanzProductObj.saturatedFat = $nutriments.'saturated-fat_100g' }
            if ($nutriments.'carbohydrates_100g') { $fsanzProductObj.carbohydrates = $nutriments.'carbohydrates_100g' }
            if ($nutriments.'sugars_100g') { $fsanzProductObj.sugars = $nutriments.'sugars_100g' }
            if ($nutriments.'proteins_100g') { $fsanzProductObj.protein = $nutriments.'proteins_100g' }
            if ($nutriments.'salt_100g') { $fsanzProductObj.salt = $nutriments.'salt_100g' }
            if ($nutriments.'sodium_100g') { $fsanzProductObj.sodium = $nutriments.'sodium_100g' }
            if ($nutriments.'fiber_100g') { $fsanzProductObj.dietaryFiber = $nutriments.'fiber_100g' }
            if ($product.ingredients_text) { $fsanzProductObj.ingredients = $product.ingredients_text }
            if ($product.categories_tags -and $product.categories_tags.Count -gt 0) { 
                $fsanzProductObj.categories = $product.categories_tags[0..2] 
            }
            
            $database[$barcode] = $fsanzProductObj
            $fetched++
        }
        
        Write-Host "  Fetched $($data.products.Count) products (total: $fetched)" -ForegroundColor Green
        
        if ($data.products.Count -lt $pageSize) {
            Write-Host "Reached end of available products" -ForegroundColor Yellow
            break
        }
        
        $page++
        Start-Sleep -Seconds 1  # Rate limiting
        
    } catch {
        Write-Host "Error fetching page $page : $($_.Exception.Message)" -ForegroundColor Red
        break
    }
}

if ($database.Count -eq 0) {
    Write-Host "No products found!" -ForegroundColor Red
    exit 1
}

# Convert to JSON and save
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
Write-Host "Next step: Deploy to Vercel" -ForegroundColor Yellow
Write-Host "   cd backend\vercel" -ForegroundColor Gray
Write-Host "   vercel --prod" -ForegroundColor Gray
Write-Host ""
