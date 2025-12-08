# TruScore Analysis Script
# Analyzes TruScore calculation for multiple barcodes with detailed breakdown
#
# Usage:
#   .\scripts\analyze-truscore.ps1 -Barcodes "9420020300194","1234567890123"
#   .\scripts\analyze-truscore.ps1 -BarcodesFile "barcodes.txt"
#
# Output: Detailed PowerShell logs showing TruScore calculation for each barcode

param(
    [Parameter(Mandatory=$false)]
    [string[]]$Barcodes = @(),
    
    [Parameter(Mandatory=$false)]
    [string]$BarcodesFile = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$Detailed = $true,
    
    [Parameter(Mandatory=$false)]
    [string]$OutputFile = "truscore-analysis-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
)

# Colors for output
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Write-Section {
    param([string]$Title)
    Write-Host ""
    Write-ColorOutput "═══════════════════════════════════════════════════════════" "Cyan"
    Write-ColorOutput "  $Title" "Cyan"
    Write-ColorOutput "═══════════════════════════════════════════════════════════" "Cyan"
    Write-Host ""
}

function Write-PillarDetails {
    param(
        [string]$PillarName,
        [int]$Score,
        [int]$MaxScore = 25,
        [hashtable]$Details
    )
    
    $percentage = [math]::Round(($Score / $MaxScore) * 100, 1)
    $color = if ($percentage -ge 80) { "Green" } 
             elseif ($percentage -ge 60) { "Yellow" } 
             else { "Red" }
    
    Write-ColorOutput "  [$PillarName Pillar] Score: $Score/$MaxScore ($percentage%)" $color
    
    if ($Details) {
        Write-Host "    Details:" -ForegroundColor Gray
        foreach ($key in $Details.Keys) {
            $value = $Details[$key]
            if ($value -is [hashtable]) {
                Write-Host "      $key :" -ForegroundColor Gray
                foreach ($subKey in $value.Keys) {
                    Write-Host "        $subKey : $($value[$subKey])" -ForegroundColor DarkGray
                }
            } else {
                Write-Host "      $key : $value" -ForegroundColor DarkGray
            }
        }
    }
}

# Load barcodes
$barcodeList = @()
if ($Barcodes.Count -gt 0) {
    $barcodeList = $Barcodes
} elseif ($BarcodesFile -ne "" -and (Test-Path $BarcodesFile)) {
    $barcodeList = Get-Content $BarcodesFile | Where-Object { $_.Trim() -ne "" }
} else {
    Write-ColorOutput "❌ No barcodes provided. Use -Barcodes or -BarcodesFile parameter." "Red"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\scripts\analyze-truscore.ps1 -Barcodes '9420020300194','1234567890123'"
    Write-Host "  .\scripts\analyze-truscore.ps1 -BarcodesFile 'barcodes.txt'"
    exit 1
}

Write-Section "TruScore Analysis Tool"
Write-ColorOutput "Analyzing $($barcodeList.Count) barcode(s)..." "Yellow"
Write-Host ""

# Change to project root
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath
Set-Location $projectRoot

# Results storage
$results = @()

foreach ($barcode in $barcodeList) {
    $barcode = $barcode.Trim()
    if ($barcode -eq "") { continue }
    
    Write-Section "Barcode: $barcode"
    
    try {
        # Run Node.js script to analyze TruScore
        $nodeScript = @"
const { fetchProduct } = require('./src/services/productService.ts');
const { calculateTruScore } = require('./src/lib/truscoreEngine.ts');

async function analyzeBarcode(barcode) {
    try {
        console.log('[ANALYZE] Fetching product:', barcode);
        const product = await fetchProduct(barcode, true, false, false);
        
        if (!product) {
            console.log('[ANALYZE] Product not found');
            return { error: 'Product not found', barcode };
        }
        
        console.log('[ANALYZE] Calculating TruScore...');
        const result = calculateTruScore(product);
        
        return {
            barcode,
            productName: product.product_name || 'Unknown',
            truScore: result.truscore,
            breakdown: result.breakdown,
            hasNutriScore: result.hasNutriScore,
            hasEcoScore: result.hasEcoScore,
            hasOrigin: result.hasOrigin,
            product: {
                nutriscore_grade: product.nutriscore_grade,
                ecoscore_grade: product.ecoscore_grade,
                nova_group: product.nova_group,
                additives_count: product.additives_tags?.length || 0,
                hasIngredients: !!product.ingredients_text,
                ingredientsLength: product.ingredients_text?.length || 0,
                hasPalmOil: product.ingredients_analysis_tags?.some(t => t.includes('palm-oil')) || false,
                certifications: product.certifications?.map(c => c.name) || [],
                labels: product.labels_tags || [],
            }
        };
    } catch (error) {
        return { error: error.message, barcode };
    }
}

const barcode = process.argv[2];
analyzeBarcode(barcode).then(result => {
    console.log(JSON.stringify(result, null, 2));
}).catch(err => {
    console.error(JSON.stringify({ error: err.message, barcode }, null, 2));
});
"@
        
        # Save temporary script
        $tempScript = "$env:TEMP\analyze-truscore-$barcode.js"
        $nodeScript | Out-File -FilePath $tempScript -Encoding UTF8
        
        # Run analysis (we'll use a TypeScript approach instead)
        Write-ColorOutput "  📊 Fetching product data..." "Yellow"
        
        # Use npm script or direct node execution
        $analysisResult = node -e $nodeScript $barcode 2>&1
        
        if ($LASTEXITCODE -ne 0) {
            Write-ColorOutput "  ❌ Error analyzing barcode: $barcode" "Red"
            Write-Host "  Error: $analysisResult" -ForegroundColor Red
            continue
        }
        
        # Parse JSON result
        $result = $analysisResult | ConvertFrom-Json
        
        if ($result.error) {
            Write-ColorOutput "  ❌ $($result.error)" "Red"
            continue
        }
        
        # Display results
        Write-ColorOutput "  Product: $($result.productName)" "Green"
        Write-Host ""
        
        Write-ColorOutput "  [TruScore] Total: $($result.truScore)/100" "Cyan"
        Write-Host ""
        
        # Body Pillar
        Write-PillarDetails "Body" $result.breakdown.Body 25 @{
            "Nutri-Score" = if ($result.hasNutriScore) { "Grade: $($result.product.nutriscore_grade)" } else { "Not available" }
            "NOVA Group" = if ($result.product.nova_group) { "Group $($result.product.nova_group)" } else { "Not available" }
            "Additives" = "$($result.product.additives_count) additive(s)"
        }
        
        # Planet Pillar
        Write-PillarDetails "Planet" $result.breakdown.Planet 25 @{
            "Eco-Score" = if ($result.hasEcoScore) { "Grade: $($result.product.ecoscore_grade)" } else { "Not available" }
            "Palm Oil" = if ($result.product.hasPalmOil) { "Contains palm oil" } else { "No palm oil detected" }
        }
        
        # Care Pillar
        Write-PillarDetails "Care" $result.breakdown.Care 25 @{
            "Certifications" = if ($result.product.certifications.Count -gt 0) { $result.product.certifications -join ", " } else { "None" }
            "Labels" = if ($result.product.labels.Count -gt 0) { "$($result.product.labels.Count) label(s)" } else { "None" }
        }
        
        # Open Pillar
        Write-PillarDetails "Open" $result.breakdown.Open 25 @{
            "Ingredients" = if ($result.product.hasIngredients) { "$($result.product.ingredientsLength) characters" } else { "Not available" }
            "Origin" = if ($result.hasOrigin) { "Available" } else { "Not available" }
        }
        
        Write-Host ""
        Write-ColorOutput "  ✅ Analysis complete" "Green"
        
        # Store result
        $results += $result
        
    } catch {
        Write-ColorOutput "  ❌ Error: $_" "Red"
        $results += @{
            barcode = $barcode
            error = $_.Exception.Message
        }
    }
    
    Write-Host ""
}

# Summary
Write-Section "Summary"
Write-ColorOutput "Analyzed $($results.Count) barcode(s)" "Cyan"

if ($results.Count -gt 0) {
    $avgScore = ($results | Where-Object { $_.truScore } | Measure-Object -Property truScore -Average).Average
    Write-ColorOutput "Average TruScore: $([math]::Round($avgScore, 1))/100" "Cyan"
    
    # Save results to file
    $results | ConvertTo-Json -Depth 10 | Out-File -FilePath $OutputFile -Encoding UTF8
    Write-ColorOutput "Results saved to: $OutputFile" "Green"
}

Write-Host ""

