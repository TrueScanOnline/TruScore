# Simple FSANZ Population Script with File Logging
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('NZ','AU')]
    [string]$Country,
    
    [int]$Limit = 2000
)

$logFile = "populate-fsanz-$Country.log"
$outputFile = "backend\vercel\data\fsanz-$($Country.ToLower()).json"

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp - $Message" | Out-File -FilePath $logFile -Append
    Write-Host $Message
}

Write-Log "========================================"
Write-Log "Populate FSANZ $Country Database"
Write-Log "========================================"
Write-Log "Target: $Limit products"
Write-Log ""

$countryTag = if ($Country -eq 'NZ') { 'en:new-zealand' } else { 'en:australia' }
$database = @{}
$page = 1
$fetched = 0
$pageSize = 100

New-Item -ItemType Directory -Path (Split-Path $outputFile -Parent) -Force | Out-Null

while ($fetched -lt $Limit) {
    try {
        $url = "https://world.openfoodfacts.org/cgi/search.pl?action=process&countries_tags=$countryTag&page_size=$pageSize&page=$page&json=1&fields=code,product_name,product_name_en,brands,categories_tags,nutriments,ingredients_text"
        
        Write-Log "Fetching page $page... ($fetched/$Limit products)"
        
        $response = Invoke-WebRequest -Uri $url -UserAgent "Rveel/1.0.0" -TimeoutSec 30 -UseBasicParsing
        $data = $response.Content | ConvertFrom-Json
        
        if (-not $data.products -or $data.products.Count -eq 0) {
            Write-Log "No more products found"
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
        
        Write-Log "  Fetched $($data.products.Count) products (total: $fetched)"
        
        if ($data.products.Count -lt $pageSize) {
            Write-Log "Reached end of available products"
            break
        }
        
        $page++
        Start-Sleep -Seconds 1
        
    } catch {
        Write-Log "Error fetching page $page : $($_.Exception.Message)"
        break
    }
}

if ($database.Count -eq 0) {
    Write-Log "No products found!"
    exit 1
}

$json = $database | ConvertTo-Json -Depth 10
$json | Out-File -FilePath $outputFile -Encoding utf8 -NoNewline

$fileSize = (Get-Item $outputFile).Length

Write-Log ""
Write-Log "========================================"
Write-Log "✅ Conversion Complete!"
Write-Log "========================================"
Write-Log "   Country: $Country"
Write-Log "   Products: $($database.Count.ToString('N0'))"
Write-Log "   Output: $outputFile"
Write-Log "   Size: $([math]::Round($fileSize / 1MB, 2)) MB"
Write-Log ""
