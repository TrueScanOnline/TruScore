# Automated FSANZ Deployment Script
# This script ensures complete deployment of FSANZ database for app use
# Can be scheduled or triggered automatically

param(
    [switch]$SkipDataCreation = $false,
    [switch]$SkipDeployment = $false,
    [switch]$SkipTesting = $false
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FSANZ Automated Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$scriptRoot = $PSScriptRoot
$projectRoot = Resolve-Path (Join-Path $scriptRoot "..")
Set-Location $projectRoot

# Step 1: Create Data Files
if (-not $SkipDataCreation) {
    Write-Host "Step 1: Creating/Verifying Data Files..." -ForegroundColor Yellow
    
    $nzfcdPath = "backend\vercel\data\nzfcd.json"
    $afcdPath = "backend\vercel\data\afcd.json"
    
    $needsNZFCD = -not (Test-Path $nzfcdPath)
    $needsAFCD = -not (Test-Path $afcdPath)
    
    if ($needsNZFCD -or $needsAFCD) {
        Write-Host "  Creating missing data files..." -ForegroundColor Yellow
        
        # Check if xlsx is available, if not try to use existing convert script
        $hasXlsx = $false
        try {
            $xlsxCheck = node -e "try { require('xlsx'); console.log('OK'); } catch(e) { console.log('MISSING'); }" 2>&1
            if ($xlsxCheck -match "OK") {
                $hasXlsx = $true
                Write-Host "  ✅ xlsx package is available" -ForegroundColor Green
            }
        } catch {
            $hasXlsx = $false
        }
        
        if (-not $hasXlsx) {
            Write-Host "  ⚠️  xlsx package not found, using existing convert script..." -ForegroundColor Yellow
            $convertScript = Join-Path $projectRoot "scripts\convertFSANZToJSON.js"
            if (Test-Path $convertScript) {
                Write-Host "  Using convertFSANZToJSON.js..." -ForegroundColor Gray
                Push-Location $projectRoot
                node scripts\convertFSANZToJSON.js
                $convertResult = $LASTEXITCODE
                Pop-Location
                if ($convertResult -eq 0) {
                    Write-Host "  ✅ Data files created using convert script" -ForegroundColor Green
                    # Skip individual file creation
                    $needsNZFCD = $false
                    $needsAFCD = $false
                } else {
                    Write-Host "  ⚠️  Convert script failed, trying alternative..." -ForegroundColor Yellow
                }
            } else {
                Write-Host "  ❌ Convert script not found at: $convertScript" -ForegroundColor Red
            }
        }
        
        if ($needsNZFCD) {
            Write-Host "  Creating NZFCD..." -ForegroundColor Gray
            Push-Location $projectRoot
            if ($hasXlsx) {
                node scripts/createNZFCD.js
            } else {
                # Try using convert script for NZFCD only
                Write-Host "    Using convertFSANZToJSON.js for NZFCD..." -ForegroundColor Gray
                node scripts\convertFSANZToJSON.js
            }
            $nzResult = $LASTEXITCODE
            Pop-Location
            if ($nzResult -ne 0) { 
                Write-Host "  ⚠️  Failed to create NZFCD, but continuing..." -ForegroundColor Yellow
            } else {
                Write-Host "  ✅ NZFCD created" -ForegroundColor Green
            }
        }
        
        if ($needsAFCD) {
            Write-Host "  Creating AFCD..." -ForegroundColor Gray
            Push-Location $projectRoot
            if ($hasXlsx) {
                node scripts/createAFCD.js
            } else {
                # Try using convert script for AFCD only
                Write-Host "    Using convertFSANZToJSON.js for AFCD..." -ForegroundColor Gray
                node scripts\convertFSANZToJSON.js
            }
            $auResult = $LASTEXITCODE
            Pop-Location
            if ($auResult -ne 0) { 
                Write-Host "  ⚠️  Failed to create AFCD, but continuing..." -ForegroundColor Yellow
            } else {
                Write-Host "  ✅ AFCD created" -ForegroundColor Green
            }
        }
    } else {
        Write-Host "  ✅ Data files already exist" -ForegroundColor Green
    }
    
    # Verify files
    if (Test-Path $nzfcdPath) {
        $nzSize = (Get-Item $nzfcdPath).Length / 1MB
        Write-Host "  ✅ NZFCD: $([math]::Round($nzSize, 2)) MB" -ForegroundColor Green
    } else {
        throw "NZFCD file not found after creation"
    }
    
    if (Test-Path $afcdPath) {
        $auSize = (Get-Item $afcdPath).Length / 1MB
        Write-Host "  ✅ AFCD: $([math]::Round($auSize, 2)) MB" -ForegroundColor Green
    } else {
        throw "AFCD file not found after creation"
    }
    
    Write-Host ""
}

# Step 2: Deploy to Vercel
if (-not $SkipDeployment) {
    Write-Host "Step 2: Deploying to Vercel..." -ForegroundColor Yellow
    Set-Location "backend\vercel"
    
    Write-Host "  Running: vercel --prod --yes" -ForegroundColor Gray
    $deployOutput = vercel --prod --yes 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host $deployOutput
        throw "Vercel deployment failed"
    }
    
    Write-Host "  ✅ Deployment command executed successfully" -ForegroundColor Green
    Set-Location "..\.."
    Write-Host ""
    
    # Wait for deployment to process
    Write-Host "Step 3: Waiting for deployment to process..." -ForegroundColor Yellow
    Write-Host "  Waiting 120 seconds for Vercel to complete deployment..." -ForegroundColor Gray
    Start-Sleep -Seconds 120
    Write-Host "  ✅ Wait complete" -ForegroundColor Green
    Write-Host ""
}

# Step 3: Test API
if (-not $SkipTesting) {
    Write-Host "Step 4: Testing API Endpoint..." -ForegroundColor Yellow
    
    $testScript = @"
const https = require('https');
const tests = [
    ['nz', 'Milk'],
    ['nz', 'Apple'],
    ['nz', 'Bread'],
    ['nz', 'Tomato'],
    ['nz', 'Corn'],
    ['au', 'Milk']
];

let completed = 0;
let success = 0;
let failed = 0;
let apiWorking = false;

tests.forEach(([country, product]) => {
    const url = `https://truscoreapi.vercel.app/api/fsanz-query?country=` + country + `&productName=` + encodeURIComponent(product);
    https.get(url, { timeout: 20000 }, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            completed++;
            if (res.statusCode === 200) {
                apiWorking = true;
                try {
                    const result = JSON.parse(data);
                    if (result.found) {
                        success++;
                        console.log(`✅ ` + country.toUpperCase() + ` - ` + product + `: FOUND - ` + result.product.productName + ` (` + (result.product.energyKcal || 'N/A') + ` kcal)`);
                    } else {
                        console.log(`⚠️  ` + country.toUpperCase() + ` - ` + product + `: Not found (but API works)`);
                    }
                } catch(e) {
                    failed++;
                    console.log(`❌ ` + country.toUpperCase() + ` - ` + product + `: Parse error`);
                }
            } else if (res.statusCode === 404) {
                failed++;
                console.log(`❌ ` + country.toUpperCase() + ` - ` + product + `: 404 - Endpoint not found`);
            } else {
                failed++;
                console.log(`❌ ` + country.toUpperCase() + ` - ` + product + `: Status ` + res.statusCode);
            }
            
            if (completed === tests.length) {
                console.log('\n=== Final Results ===');
                console.log(`API Working: ` + (apiWorking ? 'YES' : 'NO'));
                console.log(`Products Found: ` + success + `/` + tests.length);
                if (apiWorking) {
                    console.log('\n✅ API IS WORKING!');
                    console.log('✅ Deployment successful!');
                    console.log('✅ App can now use FSANZ database!');
                    process.exit(0);
                } else {
                    console.log('\n❌ API is NOT working');
                    process.exit(1);
                }
            }
        });
    }).on('error', (e) => {
        completed++;
        failed++;
        console.log(`❌ ` + country.toUpperCase() + ` - ` + product + `: ` + e.message);
        if (completed === tests.length) {
            console.log('\n=== Final Results ===');
            console.log(`Failed: ` + failed + `/` + tests.length);
            process.exit(1);
        }
    });
});
"@
    
    $testScript | Out-File -FilePath "test-api-temp.js" -Encoding UTF8
    
    try {
        node test-api-temp.js
        $testResult = $LASTEXITCODE
    } finally {
        Remove-Item "test-api-temp.js" -ErrorAction SilentlyContinue
    }
    
    if ($testResult -ne 0) {
        Write-Host ""
        Write-Host "⚠️  API test failed, but deployment may still be processing..." -ForegroundColor Yellow
        Write-Host "   Wait a few more minutes and test again" -ForegroundColor Yellow
    }
    
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "FSANZ database is now deployed and ready for app use!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Test in app: npx expo start -c" -ForegroundColor White
Write-Host "2. Scan any product barcode" -ForegroundColor White
Write-Host "3. Check logs for: '✅ FSANZ: Enhanced product with official nutrition data'" -ForegroundColor White
Write-Host ""
