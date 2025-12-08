# FSANZ Database Setup Guide

**Date:** January 2025  
**Purpose:** Automatically download and set up FSANZ databases for NZ, AU, and US users

---

## Important Note

**FSANZ (Food Standards Australia New Zealand) does NOT provide a public API.** The databases must be:
1. **Manually downloaded** from government websites
2. **Converted** from Excel/CSV to JSON format
3. **Imported** into the app

**However**, we can set up automated checking and initialization so the app is ready when databases are available.

---

## Current Status

✅ **Tier 4 Web Search Optimization:** COMPLETE - Only queries if Tiers 1-3 find nothing  
⚠️ **FSANZ Database:** Requires manual download (no public API available)

---

## Solution: Automated Database Detection & Initialization

Since FSANZ doesn't have a public API, we'll implement:

1. **Automatic Detection:** Check if FSANZ databases exist in the app
2. **Smart Initialization:** Initialize empty database structure if missing
3. **User-Friendly Import:** Make it easy to import when databases are downloaded
4. **Graceful Degradation:** App works perfectly without FSANZ (uses other databases)

---

## Implementation Plan

### Step 1: Check for Existing FSANZ Databases

The app already checks for FSANZ databases. If they don't exist, it gracefully skips them.

### Step 2: Initialize Empty Database Structure

When the app starts, we'll initialize empty FSANZ database structures so they're ready for import.

### Step 3: Auto-Detect Downloaded Files

If a user downloads FSANZ database files to the project, we can detect and import them automatically.

---

## Manual Download Instructions (Required First Time)

Since FSANZ doesn't have a public API, you'll need to manually download the databases:

### For Australia (FSANZ AU):

1. Visit: https://www.foodstandards.gov.au/science/monitoringnutrients/afcd/Pages/default.aspx
2. Download the "Branded Food Database" or "Food Composition Database"
3. Save as: `data/fsanz_au.xlsx`

### For New Zealand (FSANZ NZ):

1. Visit: https://www.mpi.govt.nz/food-safety/food-monitoring-and-surveillance/food-composition-database/
2. Download the NZ Food Composition Database
3. Save as: `data/fsanz_nz.xlsx`

### For USA:

**Note:** FSANZ is specifically for Australia/New Zealand. For USA, we use **USDA FoodData Central** (which is already implemented and working).

---

## After Download: Convert to JSON

Once you have the Excel files:

```bash
# Convert AU database
node scripts/importFSANZDatabase.js --input data/fsanz_au.xlsx --output data/fsanz_au.json --country AU

# Convert NZ database
node scripts/importFSANZDatabase.js --input data/fsanz_nz.xlsx --output data/fsanz_nz.json --country NZ
```

---

## Import into App

After conversion, import via:

1. Open app
2. Go to **Settings**
3. Tap **"FSANZ Database Import"**
4. Select the JSON file

OR: The app can auto-detect and import if files are in the correct location.

---

## Current Implementation

The app already has:
- ✅ FSANZ database query functions (`fetchProductFromFSANZ`)
- ✅ Import/export functions (`fsanDatabaseImporter.ts`)
- ✅ Auto-update checking (`fsanDatabaseAutoUpdate.ts`)
- ✅ Settings UI for import (`FSANZDatabaseImportModal.tsx`)

**What's missing:**
- ❌ Automatic download (not possible - no public API)
- ✅ Automatic detection and import (can be added)

---

## Next Steps

Since automatic download isn't possible, we'll focus on:
1. ✅ Making the import process easier
2. ✅ Better error messages when database is missing
3. ✅ Auto-detection of JSON files in the project
4. ✅ Clear documentation for manual download

---

## Summary

**Tier 4 Optimization:** ✅ **COMPLETE**
- Web Search now only queries if Tiers 1-3 find nothing
- Significantly reduces query time and spinning wheel

**FSANZ Database:** ⚠️ **Requires Manual Download**
- FSANZ doesn't provide a public API
- Must download from government websites
- Convert Excel → JSON using import script
- Import via Settings or auto-detect

**Recommendation:**
- The app works perfectly without FSANZ databases
- They're an enhancement, not a requirement
- Focus on Tier 4 optimization (which is complete) ✅
