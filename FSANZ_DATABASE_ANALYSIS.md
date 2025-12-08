# FSANZ Database Architecture Analysis

## Executive Summary

**Problem Identified:** Only 4 products are available in the FSANZ database when there should be **2,860+ foods** (NZFCD) and **1,534+ foods** (AFCD).

**Root Cause:** The FSANZ database architecture has a fundamental mismatch:
- FSANZ databases are **FOOD COMPOSITION DATABASES** (nutrition data by food name), NOT product databases with barcodes
- The app is trying to download a barcode-based JSON file (`fsanz-nz.json`) which only contains 4 test products
- The actual full database exists in `nzfcd.json` (~2,860 foods) but is only used for query-by-name, not barcode lookup

## Database File Structure Analysis

### Source Files in `Database files/`

1. **Standard DATA.AP** (~2,860 lines)
   - Format: Tab-delimited (`~`)
   - Structure: One row per food with all nutrients in columns
   - Contains: FoodID, Food Name, and ~80+ nutrient columns
   - Example: `A10001~Bread, from potato and wheat flour...~0~4~0.13~1.8~48.4...`

2. **Standard DATA.FT** (~221,853 lines)
   - Format: Tab-delimited (`~`)
   - Structure: One row per component per food
   - Contains: FoodID, Component Identifier, Value, Units, etc.
   - Example: `A10001~ALC~0~g~W~~LZ~S~U~MIR007`

3. **NAME.FT** (~2,860 lines)
   - Format: Tab-delimited (`~`)
   - Structure: One row per food with metadata
   - Contains: FoodID, Food Name, Short Name, Description, Categories, etc.

### Key Insight: FSANZ Databases Don't Have Barcodes

- **FoodID Format:** `A10001`, `A1011`, `A1014`, etc. (NOT barcodes)
- **Query Method:** By product name (e.g., "Bread, from potato and wheat flour")
- **Data Type:** Food composition (nutrition per 100g), not product catalog

## Current Architecture Issues

### Issue 1: Wrong Database Format for Barcode Lookup

**Location:** `src/services/fsanDatabase.ts`

**Problem:**
- Tries to query FSANZ by **barcode** (`queryFSANZLocalDatabase(barcode, country)`)
- Stores data in AsyncStorage as `{ [barcode: string]: FSANZProduct }`
- FSANZ databases **don't have barcodes** - they have FoodIDs

**Current Flow (BROKEN):**
```
User scans barcode → App queries fsanz-nz.json by barcode → Only 4 products available → Not found
```

### Issue 2: Correct System Exists But Not Fully Utilized

**Location:** `src/services/fsanzQueryService.ts` ✅

**Status:** This system is **CORRECT** and working:
- Queries FSANZ by **product name** (not barcode)
- Uses Vercel API: `/api/fsanz-query?country=nz&productName=...`
- Vercel API loads full `nzfcd.json` (~2,860 foods) from `backend/vercel/data/`
- Returns official nutrition data

**Current Flow (WORKING):**
```
User scans barcode → Gets product name from Open Food Facts → Queries FSANZ by name → Returns nutrition data
```

### Issue 3: Wrong File Being Served for Download

**Location:** `backend/vercel/api/fsanz-database.ts`

**Problem:**
- Serves `fsanz-nz.json` (only 4 products - test/placeholder file)
- Should serve full database OR the app shouldn't download barcode-based database at all

**Files in `backend/vercel/data/`:**
- `nzfcd.json` - ✅ Full database (~2,860 foods) - Used by `/api/fsanz-query`
- `fsanz-nz.json` - ❌ Only 4 products - Served by `/api/fsanz-database`
- `afcd.json` - ✅ Full database (~1,534 foods) - Used by `/api/fsanz-query`
- `fsanz-au.json` - ❌ Likely only test data - Served by `/api/fsanz-database`

## Why Only 4 Products?

The `fsanz-nz.json` file is a **placeholder/test file** that was created for the barcode-based lookup system. However, since FSANZ databases don't have barcodes, this approach is fundamentally flawed.

The 4 products are likely:
1. Test entries created during development
2. Manually added examples
3. Not from the actual FOODfiles database

## Solution Architecture

### Recommended Approach: Use Query-by-Name System (Already Implemented)

The app **already has** the correct system in place:

1. **Product Name Query System** (`fsanzQueryService.ts`) ✅
   - Queries Vercel API by product name
   - Uses full `nzfcd.json` database (~2,860 foods)
   - Returns official nutrition data
   - **This is working correctly**

2. **Integration Point** (`productService.ts`)
   - After barcode scan, gets product name from Open Food Facts
   - Calls `enhanceProductWithFSANZQuery()` to get official nutrition data
   - Merges FSANZ data into product for TruScore calculation

### What Needs to Be Fixed

#### Fix 1: Remove Barcode-Based FSANZ Lookup

**File:** `src/services/fsanDatabase.ts`

**Action:** 
- Remove or deprecate `queryFSANZLocalDatabase()` (barcode-based lookup)
- Keep only the query-by-name system via `fsanzQueryService.ts`

**Reason:** FSANZ databases don't have barcodes, so barcode lookup will never work.

#### Fix 2: Update Database Download System

**File:** `src/services/fsanDatabaseAutoDownload.ts`

**Options:**
- **Option A:** Remove auto-download entirely (query-by-name doesn't need local storage)
- **Option B:** Download full `nzfcd.json` for offline query-by-name (requires SQLite, not AsyncStorage)

**Recommendation:** Option A - Remove auto-download. The query-by-name system works via API and doesn't need local storage.

#### Fix 3: Ensure Full Database is Deployed

**File:** `backend/vercel/data/nzfcd.json`

**Action:**
- Verify `nzfcd.json` contains all ~2,860 foods
- Ensure it's deployed to Vercel
- Verify `/api/fsanz-query` can load it

**Verification:**
```bash
cd backend/vercel/data
node -e "const data = require('./nzfcd.json'); console.log('Foods:', data.length);"
```

## Database Conversion Process

### How to Generate Full `nzfcd.json` from Source Files

**Script:** `scripts/createNZFCD.js`

**Process:**
1. Reads `Database files/Principal files/Excel files/Standard/Standard DATA.FT.xlsx`
2. Extracts food names and nutrition data
3. Normalizes to JSON format with fields:
   - `foodName` (e.g., "Bread, from potato and wheat flour...")
   - `foodNameLower` (lowercase for matching)
   - `energyKcal`, `protein`, `fat`, `carbohydrates`, etc.
4. Writes to `backend/vercel/data/nzfcd.json`

**Expected Output:**
- ~2,860 foods (one per FoodID in Standard DATA.AP)
- ~2-5 MB JSON file
- Array format: `[{ foodName: "...", energyKcal: 216, ... }, ...]`

### How to Generate Full `afcd.json` from Source Files

**Script:** `scripts/createAFCD.js`

**Process:**
1. Reads `Database files/AU Release 2 - Nutrient file.xlsx`
2. Processes multiple sheets (solids & liquids, liquids only)
3. Also reads `Database files/AU Release 2 - Food Details.xlsx`
4. Combines and normalizes to JSON format
5. Writes to `backend/vercel/data/afcd.json`

**Expected Output:**
- ~1,534 foods
- ~1-3 MB JSON file
- Array format similar to NZFCD

## Verification Steps

### Step 1: Check Source Files

```powershell
# Count foods in Standard DATA.AP (should be ~2,860)
cd "C:\TrueScan-FoodScanner\Database files"
(Get-Content "Principal files\ASCII Text Files\Standard\Standard DATA.AP" | Measure-Object -Line).Lines
```

### Step 2: Check Generated JSON Files

```powershell
# Check nzfcd.json
cd "C:\TrueScan-FoodScanner\backend\vercel\data"
$data = Get-Content "nzfcd.json" -Raw | ConvertFrom-Json
Write-Host "NZFCD: $($data.Count) foods"

# Check fsanz-nz.json (will show only 4)
$data = Get-Content "fsanz-nz.json" -Raw | ConvertFrom-Json
Write-Host "FSANZ-NZ: $($data.Count) products"
```

### Step 3: Test Vercel API

```bash
# Test query-by-name (should work with full database)
curl "https://truscoreapi.vercel.app/api/fsanz-query?country=nz&productName=Bread"
```

### Step 4: Verify App Integration

Check that `productService.ts` calls `enhanceProductWithFSANZQuery()` after getting product name from barcode scan.

## Recommended Action Plan

### Phase 1: Immediate Fix (Remove Broken System)

1. **Disable barcode-based FSANZ lookup**
   - Comment out `fetchProductFromFSANZ()` calls in `truScoreOptimizedDatabase.ts`
   - Remove `fsanDatabaseAutoDownload.ts` auto-download on app launch
   - Keep `fsanzQueryService.ts` (query-by-name) - this is working correctly

2. **Verify query-by-name system is active**
   - Check `productService.ts` calls `enhanceProductWithFSANZQuery()`
   - Verify Vercel API `/api/fsanz-query` is deployed and working
   - Test with real product scans

### Phase 2: Generate Full Databases (If Needed)

1. **Regenerate `nzfcd.json`**
   ```bash
   node scripts/createNZFCD.js
   ```

2. **Regenerate `afcd.json`**
   ```bash
   node scripts/createAFCD.js
   ```

3. **Deploy to Vercel**
   ```bash
   cd backend/vercel
   vercel --prod
   ```

### Phase 3: Clean Up (Optional)

1. **Remove unused files:**
   - `fsanz-nz.json` (test file with 4 products)
   - `fsanz-au.json` (if it's also test data)

2. **Update documentation:**
   - Document that FSANZ is query-by-name, not barcode
   - Update architecture docs

## Key Takeaways

1. **FSANZ databases are FOOD composition databases, not product catalogs**
   - They don't have barcodes
   - They are queried by product name
   - They contain ~2,860 foods (NZ) and ~1,534 foods (AU)

2. **The app has TWO FSANZ systems:**
   - ❌ **Barcode-based** (`fsanDatabase.ts`) - Broken, only 4 products
   - ✅ **Name-based** (`fsanzQueryService.ts`) - Working, full database

3. **The correct system is already implemented:**
   - Query-by-name via Vercel API
   - Uses full `nzfcd.json` database
   - Integrated into product scanning flow

4. **The "4 products" issue is from the wrong system:**
   - The barcode-based download system downloads a test file
   - This system should be removed/deprecated
   - The name-based system already has access to all 2,860+ foods

## Next Steps

1. ✅ **Verify** `nzfcd.json` contains ~2,860 foods
2. ✅ **Verify** `/api/fsanz-query` is working with full database
3. ✅ **Test** product scan → name query → nutrition data flow
4. ⚠️ **Remove** barcode-based FSANZ lookup (it's fundamentally broken)
5. ⚠️ **Update** app to rely solely on query-by-name system

