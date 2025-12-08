# Fix FSANZ API 404 Error - Step by Step

## Problem
FSANZ API endpoint is returning 404 errors:
```
❌ [FSANZ QUERY] API request failed: 404
```

## Root Cause Analysis

The 404 error means the endpoint is not found. Possible causes:

1. **Function not deployed** - The `api/fsanz-query.ts` file might not be in the deployment
2. **Data files missing** - The `data/nzfcd.json` and `data/afcd.json` files might not be included
3. **Path resolution issue** - The function can't find the data files
4. **Vercel configuration** - The function might not be recognized

## Solution Steps

### Step 1: Verify Files Exist Locally

```powershell
cd C:\TrueScan-FoodScanner\backend\vercel
```

Check:
- ✅ `api/fsanz-query.ts` exists
- ✅ `data/nzfcd.json` exists (97.43 MB)
- ✅ `data/afcd.json` exists (0.51 MB)
- ✅ `vercel.json` includes `api/fsanz-query.ts` configuration

### Step 2: Verify .vercelignore

The `.vercelignore` file should **include** data files:
```
!data/
!data/*.json
```

This ensures data files are deployed.

### Step 3: Redeploy with Verification

```powershell
cd C:\TrueScan-FoodScanner\backend\vercel
vercel --prod --yes
```

Wait for deployment to complete (1-2 minutes).

### Step 4: Test API Endpoint

After deployment, test:
```powershell
# Test NZ
Invoke-WebRequest -Uri "https://truscoreapi.vercel.app/api/fsanz-query?country=nz&productName=Milk"

# Test AU
Invoke-WebRequest -Uri "https://truscoreapi.vercel.app/api/fsanz-query?country=au&productName=Milk"
```

### Step 5: Check Vercel Logs

1. Go to: https://vercel.com/leightons-projects-d328c774/truscoreapi
2. Click on the latest deployment
3. Check "Functions" tab
4. Look for `api/fsanz-query.ts`
5. Check logs for errors

### Step 6: Verify Data Files in Deployment

In Vercel dashboard:
1. Go to deployment
2. Check "Files" tab
3. Verify `data/nzfcd.json` and `data/afcd.json` are present

## Expected Results After Fix

✅ API returns 200 status  
✅ JSON response with `found: true` or `found: false`  
✅ Products get enhanced with FSANZ data  
✅ TruScore Body pillar improves (2-10 → 15-20)  

## If Still Getting 404

1. **Check Vercel project settings:**
   - Root directory should be `backend/vercel` or `.`
   - Build command should be empty (no build needed)
   - Output directory should be empty

2. **Verify function is recognized:**
   - In Vercel dashboard, check if `api/fsanz-query.ts` appears in Functions list
   - If not, the file might not be in the right location

3. **Check file extensions:**
   - Should be `.ts` (TypeScript)
   - Vercel automatically compiles TypeScript

4. **Try manual test:**
   ```bash
   curl "https://truscoreapi.vercel.app/api/fsanz-query?country=nz&productName=Milk"
   ```

## Quick Fix Script

Run this to verify and fix:

```powershell
cd C:\TrueScan-FoodScanner\backend\vercel

# Verify files
Write-Host "Verifying files..." -ForegroundColor Cyan
if (Test-Path "api\fsanz-query.ts") { Write-Host "✅ API file exists" -ForegroundColor Green } else { Write-Host "❌ API file missing" -ForegroundColor Red }
if (Test-Path "data\nzfcd.json") { Write-Host "✅ NZFCD data exists" -ForegroundColor Green } else { Write-Host "❌ NZFCD data missing" -ForegroundColor Red }
if (Test-Path "data\afcd.json") { Write-Host "✅ AFCD data exists" -ForegroundColor Green } else { Write-Host "❌ AFCD data missing" -ForegroundColor Red }

# Redeploy
Write-Host "`nRedeploying..." -ForegroundColor Cyan
vercel --prod --yes

# Wait and test
Write-Host "`nWaiting 30 seconds for deployment..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host "`nTesting API..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "https://truscoreapi.vercel.app/api/fsanz-query?country=nz&productName=Milk" -UseBasicParsing
    Write-Host "✅ API Status: $($response.StatusCode)" -ForegroundColor Green
    $json = $response.Content | ConvertFrom-Json
    Write-Host "✅ Response: found=$($json.found)" -ForegroundColor Green
} catch {
    Write-Host "❌ API still failing: $($_.Exception.Message)" -ForegroundColor Red
}
```
