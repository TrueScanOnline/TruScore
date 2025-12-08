# FSANZ Database Solution - Fixing the "4 Products" Issue

## Problem Summary

The app shows only **4 products** in the FSANZ database when there should be **2,860+ foods** (NZFCD) and **1,534+ foods** (AFCD).

## Root Cause

**FSANZ databases are FOOD COMPOSITION DATABASES, not product catalogs with barcodes.**

- ❌ **Wrong Approach:** App tries to query FSANZ by barcode → Only finds 4 test products
- ✅ **Correct Approach:** App queries FSANZ by product name → Has access to all 2,860+ foods

## Current Architecture

### System 1: Barcode-Based Lookup (BROKEN) ❌

**Files:**
- `src/services/fsanDatabase.ts` - Queries by barcode
- `src/data/databases/truScoreOptimizedDatabase.ts` - Calls `fetchProductFromFSANZ(barcode)`
- `src/services/fsanDatabaseAutoDownload.ts` - Downloads `fsanz-nz.json` (4 products)

**Problem:**
- FSANZ databases don't have barcodes
- Downloads test file with only 4 products
- Will never work because barcodes don't exist in FSANZ

### System 2: Name-Based Query (WORKING) ✅

**Files:**
- `src/services/fsanzQueryService.ts` - Queries by product name
- `src/services/productService.ts` - Calls `enhanceProductWithFSANZQuery()` after barcode scan
- `backend/vercel/api/fsanz-query.ts` - Vercel API endpoint
- `backend/vercel/data/nzfcd.json` - Full database (~2,860 foods)

**Status:**
- ✅ Already implemented and working
- ✅ Uses full database via Vercel API
- ✅ Queries by product name (correct approach)

## Solution: Remove Broken System, Use Working System

### Step 1: Remove Barcode-Based FSANZ Lookup

**File:** `src/data/databases/truScoreOptimizedDatabase.ts`

**Action:** Remove FSANZ barcode queries from Gold Standard phase

**Current Code (Lines 212-233):**
```typescript
if (userCountry === 'AU') {
  const query = fetchProductFromFSANZ(barcode, 'AU');
  queries.push(query);
  databaseNames.push('FSANZ-AU');
  // ...
}
if (userCountry === 'NZ') {
  const query = fetchProductFromFSANZ(barcode, 'NZ');
  queries.push(query);
  databaseNames.push('FSANZ-NZ');
  // ...
}
```

**Fix:** Remove these blocks. FSANZ will be queried by name later in the flow.

### Step 2: Verify Name-Based Query is Active

**File:** `src/services/productService.ts`

**Check:** Ensure `enhanceProductWithFSANZQuery()` is called after product name is obtained.

**Current Flow:**
1. Barcode scan → Get product from Open Food Facts (has product name)
2. Call `enhanceProductWithFSANZQuery(product)` → Queries FSANZ by name
3. Merge FSANZ nutrition data into product

**Status:** ✅ Already implemented

### Step 3: Generate Full Databases (If Needed)

**Check if databases are complete:**

```powershell
cd backend\vercel\data
$nz = Get-Content "nzfcd.json" -Raw | ConvertFrom-Json
Write-Host "NZFCD: $($nz.Count) foods (expected: ~2,860)"

$au = Get-Content "afcd.json" -Raw | ConvertFrom-Json
Write-Host "AFCD: $($au.Count) foods (expected: ~1,534)"
```

**If incomplete, regenerate:**

```bash
# Generate NZFCD from Excel
node scripts/createNZFCD.js

# Generate AFCD from Excel
node scripts/createAFCD.js

# Deploy to Vercel
cd backend/vercel
vercel --prod
```

### Step 4: Remove Auto-Download (Optional)

**File:** `src/services/fsanDatabaseAutoDownload.ts`

**Action:** Disable auto-download of barcode-based database (not needed for name-based queries)

**Or:** Keep it but update to download full `nzfcd.json` for offline use (requires SQLite, not AsyncStorage)

## Implementation Plan

### Immediate Fix (Remove Broken Barcode Lookup)

1. **Remove FSANZ barcode queries from `truScoreOptimizedDatabase.ts`**
   - Remove lines 212-222 (AU)
   - Remove lines 223-233 (NZ)
   - Keep other Gold Standard databases (USDA, Health Canada, etc.)

2. **Verify name-based query is working**
   - Check `productService.ts` calls `enhanceProductWithFSANZQuery()`
   - Test with product scan → should query FSANZ by name

3. **Test end-to-end**
   - Scan product → Get name from OFF → Query FSANZ by name → Get nutrition data

### Database Verification

1. **Check `nzfcd.json` has ~2,860 foods**
2. **Check `afcd.json` has ~1,534 foods**
3. **Verify Vercel API `/api/fsanz-query` is deployed**
4. **Test API with sample query**

### Clean Up (Optional)

1. **Remove unused files:**
   - `fsanz-nz.json` (test file)
   - `fsanz-au.json` (if test file)

2. **Update documentation:**
   - Document FSANZ is query-by-name, not barcode
   - Remove references to barcode-based lookup

## Expected Results After Fix

### Before Fix:
- ❌ FSANZ barcode lookup finds 0-4 products
- ❌ Only test data available
- ❌ Missing official nutrition data for NZ/AU users

### After Fix:
- ✅ FSANZ name-based query finds matching foods
- ✅ Full database (~2,860 NZ, ~1,534 AU) available
- ✅ Official nutrition data enhances TruScore for NZ/AU users
- ✅ Works for any product with a name (from barcode scan)

## Testing Checklist

- [ ] Remove barcode-based FSANZ lookup from `truScoreOptimizedDatabase.ts`
- [ ] Verify `nzfcd.json` contains ~2,860 foods
- [ ] Verify `afcd.json` contains ~1,534 foods
- [ ] Test Vercel API: `GET /api/fsanz-query?country=nz&productName=Bread`
- [ ] Test product scan → FSANZ enhancement flow
- [ ] Verify logs show FSANZ query-by-name working
- [ ] Verify TruScore uses FSANZ nutrition data

## Key Insight

**The app already has the correct system implemented!**

The "4 products" issue is from the **wrong system** (barcode-based lookup) that should never have been used for FSANZ.

The **correct system** (name-based query) is already working and has access to all 2,860+ foods.

**Solution:** Simply remove the broken barcode-based system and rely on the working name-based system.

