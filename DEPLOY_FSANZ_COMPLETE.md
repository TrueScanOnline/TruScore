# Deploy FSANZ Complete - Full Deployment Script

## Complete Deployment Script

**File:** `scripts/deployFSANZComplete.ps1`

This script automatically deploys **BOTH** New Zealand and Australian FSANZ databases with complete coverage.

## What It Does

### Step 1: Creates/Verifies Data Files
- ✅ **NZFCD:** Creates from `Standard DATA.FT.xlsx` (221,851 foods)
- ✅ **AFCD:** Creates complete database including:
  - "All solids & liquids per 100g" sheet
  - "Liquids only per 100mL" sheet
  - "AU Release 2 - Food Details.xlsx" (all sheets merged)

### Step 2: Deploys to Vercel
- ✅ Uploads both databases to Vercel
- ✅ Waits for deployment to complete (120 seconds)

### Step 3: Tests API Endpoints
- ✅ Tests NZ database (4 products)
- ✅ Tests AU database (4 products)
- ✅ Verifies both are working

## Usage

### Run Complete Deployment:
```powershell
cd C:\TrueScan-FoodScanner
.\scripts\deployFSANZComplete.ps1
```

### Options:
```powershell
# Skip data creation (if files already exist)
.\scripts\deployFSANZComplete.ps1 -SkipDataCreation

# Skip deployment (only create files)
.\scripts\deployFSANZComplete.ps1 -SkipDeployment

# Skip testing (only deploy)
.\scripts\deployFSANZComplete.ps1 -SkipTesting
```

## What Gets Deployed

### New Zealand (NZFCD):
- ✅ 221,851 foods
- ✅ Complete nutrition data
- ✅ Official government database

### Australia (AFCD):
- ✅ All foods from "All solids & liquids per 100g" sheet
- ✅ All foods from "Liquids only per 100mL" sheet
- ✅ All metadata from "Food Details" file
- ✅ Complete Australian database

## Expected Output

```
========================================
FSANZ Complete Deployment
New Zealand + Australia Databases
========================================

Step 1: Creating/Verifying Data Files...
  ✅ NZFCD: 221,851 foods, 97.43 MB
  ✅ AFCD: [total] foods, [size] MB
     (Includes: All solids & liquids per 100g + Liquids only per 100mL + Food Details)

Step 2: Deploying to Vercel...
  ✅ Deployment command executed successfully

Step 3: Waiting for deployment to process...
  ✅ Wait complete

Step 4: Testing API Endpoints...
  ✅ NZ - Milk: FOUND
  ✅ AU - Milk: FOUND
  ...

✅ BOTH DATABASES ARE DEPLOYED AND WORKING!
```

## Status After Deployment

- ✅ **NZ Database:** 221,851 foods available
- ✅ **AU Database:** Complete database available
- ✅ **Both APIs:** Accessible and working
- ✅ **App Ready:** Can query FSANZ for both countries

## Summary

✅ **Complete deployment script ready**
✅ **Includes all NZ and AU data**
✅ **Automated testing included**
✅ **Ready to run!**
