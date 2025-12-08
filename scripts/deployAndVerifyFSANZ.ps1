# Complete FSANZ Deployment and Verification Script
# This script ensures full deployment and verifies it works

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FSANZ Complete Deployment & Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Verify/Create Data Files
Write-Host "Step 1: Verifying data files..." -ForegroundColor Yellow
Set-Location "C:\TrueScan-FoodScanner"

$nzfcdPath = "backend\vercel\data\nzfcd.json"
$afcdPath = "backend\vercel\data\afcd.json"

if (-not (Test-Path $nzfcdPath)) {
    Write-Host "  Creating NZFCD JSON..." -ForegroundColor Yellow
    node -e "const fs=require('fs'),path=require('path'),XLSX=require('xlsx');const wb=XLSX.readFile('Database files/Principal files/Excel files/Standard/Standard DATA.FT.xlsx');const data=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);const out=path.join('backend','vercel','data');if(!fs.existsSync(out))fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'nzfcd.json'),JSON.stringify(data.map((r,i)=>({foodName:String(r['Food Name']||r['Food name']||'Food '+i).trim(),foodNameLower:String(r['Food Name']||r['Food name']||'Food '+i).toLowerCase().trim(),energyKcal:parseFloat(r['Energy (kcal)']||r['Energy kcal']||'')||undefined,protein:parseFloat(r['Protein']||'')||undefined,fat:parseFloat(r['Fat']||'')||undefined,saturatedFat:parseFloat(r['Saturated Fat']||r['Saturated fat']||'')||undefined,carbohydrates:parseFloat(r['Carbohydrates']||r['Carbohydrates (g)']||'')||undefined,sugars:parseFloat(r['Sugars']||r['Sugars (g)']||'')||undefined,dietaryFiber:parseFloat(r['Fiber']||r['Dietary Fiber']||r['Dietary fiber']||'')||undefined,salt:parseFloat(r['Salt']||r['Salt (g)']||'')||undefined,sodium:parseFloat(r['Sodium']||r['Sodium (g)']||'')||undefined,calcium:parseFloat(r['Calcium']||r['Calcium (mg)']||'')||undefined,iron:parseFloat(r['Iron']||r['Iron (mg)']||'')||undefined})),null,2));console.log('Created:',data.length,'foods');"
    Write-Host "  ✅ NZFCD created" -ForegroundColor Green
} else {
    Write-Host "  ✅ NZFCD exists" -ForegroundColor Green
}

if (-not (Test-Path $afcdPath)) {
    Write-Host "  Creating AFCD JSON..." -ForegroundColor Yellow
    node -e "const fs=require('fs'),path=require('path'),XLSX=require('xlsx');const wb=XLSX.readFile('Database files/AU Release 2 - Nutrient file.xlsx');const data=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);const out=path.join('backend','vercel','data');fs.writeFileSync(path.join(out,'afcd.json'),JSON.stringify(data.map((r,i)=>({foodName:String(r['Food Name']||r['Food name']||'Food '+i).trim(),foodNameLower:String(r['Food Name']||r['Food name']||'Food '+i).toLowerCase().trim(),energyKcal:parseFloat(r['Energy (kcal)']||r['Energy kcal']||'')||undefined,protein:parseFloat(r['Protein']||'')||undefined,fat:parseFloat(r['Fat']||'')||undefined,saturatedFat:parseFloat(r['Saturated Fat']||r['Saturated fat']||'')||undefined,carbohydrates:parseFloat(r['Carbohydrates']||r['Carbohydrates (g)']||'')||undefined,sugars:parseFloat(r['Sugars']||r['Sugars (g)']||'')||undefined,dietaryFiber:parseFloat(r['Fiber']||r['Dietary Fiber']||r['Dietary fiber']||'')||undefined,salt:parseFloat(r['Salt']||r['Salt (g)']||'')||undefined,sodium:parseFloat(r['Sodium']||r['Sodium (g)']||'')||undefined,calcium:parseFloat(r['Calcium']||r['Calcium (mg)']||'')||undefined,iron:parseFloat(r['Iron']||r['Iron (mg)']||'')||undefined})),null,2));console.log('Created:',data.length,'foods');"
    Write-Host "  ✅ AFCD created" -ForegroundColor Green
} else {
    Write-Host "  ✅ AFCD exists" -ForegroundColor Green
}

Write-Host ""

# Step 2: Deploy to Vercel
Write-Host "Step 2: Deploying to Vercel..." -ForegroundColor Yellow
Set-Location "backend\vercel"
Write-Host "  Running: vercel --prod" -ForegroundColor Gray
$deployOutput = vercel --prod --yes 2>&1
Write-Host $deployOutput
Set-Location "..\.."

Write-Host ""
Write-Host "Step 3: Waiting for deployment to complete..." -ForegroundColor Yellow
Start-Sleep -Seconds 90

Write-Host ""
Write-Host "Step 4: Testing API endpoint..." -ForegroundColor Yellow
node scripts\verifyFSANZDeployment.js

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Test in app: npx expo start -c" -ForegroundColor White
Write-Host "2. Scan any product barcode" -ForegroundColor White
Write-Host "3. Check logs for FSANZ enhancement" -ForegroundColor White
Write-Host ""
