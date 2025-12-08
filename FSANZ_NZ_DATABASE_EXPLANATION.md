# FSANZ NZ Database - Explanation & Setup Guide

**Date:** January 2025  
**Issue:** "FSANZ NZ database not found in local storage" error message

---

## What is FSANZ NZ Database?

**FSANZ (Food Standards Australia New Zealand)** is the official government database for food products in Australia and New Zealand. The NZ database contains comprehensive nutrition data for thousands of NZ food products.

**Why it's important:**
- ✅ **Gold Standard Data** - Official government nutrition data
- ✅ **High Quality** - 90% quality rating, 85% completion
- ✅ **Country-Specific** - Tailored for NZ food products
- ✅ **Free** - Government database, no API costs

---

## Current Status

**The error message means:**
- ❌ The FSANZ NZ database has **NOT been downloaded/imported yet**
- ❌ The database is **not available** in local storage (AsyncStorage)
- ✅ The app **still works** without it - this is a **non-critical** message

**What happens when it's not available:**
- The app gracefully skips FSANZ NZ database queries
- Products are still found via other databases (Open Food Facts, etc.)
- The app continues to function normally
- This is just a **DEBUG** log message (not an error)

---

## Do You Need It?

### ✅ **You DON'T need it if:**
- You're just testing the app
- Products are being found via other databases
- You don't need the extra NZ-specific nutrition data
- The app is working fine without it

### ⭐ **You SHOULD import it if:**
- You want **best-in-class accuracy** for NZ products
- You want official government nutrition data
- You're deploying to NZ users and want 95%+ coverage
- You want to use the enhanced NZ food composition data

---

## How to Import FSANZ NZ Database

### Method 1: Through App Settings (Recommended)

1. **Open the App:**
   - Launch TrueScan app
   - Go to **Settings** screen

2. **Find FSANZ Import Option:**
   - Look for **"FSANZ Database Import"** option
   - Tap it to open the import modal

3. **Download Database:**
   - The modal will guide you to download the FSANZ database
   - Or manually download from: https://www.foodstandards.gov.au/

4. **Import:**
   - Select the downloaded file (Excel/CSV format)
   - The app will import and store it in local storage

### Method 2: Manual Import via Script

1. **Download FSANZ Database:**
   - Visit: https://www.foodstandards.gov.au/
   - Download the NZ food composition database
   - Save as: `data/fsanz_nz.xlsx` or `data/fsanz_nz.csv`

2. **Run Import Script:**
   ```bash
   cd C:\TrueScan-FoodScanner
   node scripts/importFSANZDatabase.js --input data/fsanz_nz.xlsx --output data/fsanz_nz.json --country NZ
   ```

3. **Import via Settings:**
   - Open app Settings
   - Use "FSANZ Database Import" option
   - Select the generated `fsanz_nz.json` file

---

## What Happens After Import?

Once imported, the FSANZ NZ database will:
- ✅ Be stored in AsyncStorage (local device storage)
- ✅ Be queried automatically for NZ users
- ✅ Provide high-quality nutrition data
- ✅ Merge with other database results
- ✅ No more "database not found" messages

**Storage:**
- Key: `@truescan_fsanz_cache_NZ`
- Format: JSON object with barcode → product data mapping
- Location: Device AsyncStorage (persistent across app restarts)

---

## Code Reference

**Files Involved:**
- `src/services/fsanDatabase.ts` - Queries the database
- `src/services/fsanDatabaseImporter.ts` - Handles import/export
- `src/components/FSANZDatabaseImportModal.tsx` - UI for importing
- `scripts/importFSANZDatabase.js` - Script to convert Excel/CSV to JSON
- `app/settings.tsx` - Settings screen with import option

**Error Location:**
- File: `src/services/fsanDatabase.ts`
- Lines: 29, 38
- Function: `queryFSANZLocalDatabase()`
- Log Level: **DEBUG** (not an error)

```typescript
// This is just a debug message - not an error
if (!isAvailable) {
  logger.debug(`FSANZ ${country} database not found in local storage`);
  return null; // Gracefully skip - app continues normally
}
```

---

## Alternative: Auto-Update System

The app also has an **auto-update system** (`fsanDatabaseAutoUpdate.ts`) that can:
- ✅ Check for database updates periodically
- ✅ Download updates automatically (if configured)
- ✅ Notify users when updates are available

**Status:**
- Currently initialized in `app/_layout.tsx` (non-blocking)
- May require API configuration for automatic downloads

---

## Summary

**Question:** "FSANZ NZ database not found in local storage" - Does it need to be downloaded?

**Answer:** 
- ✅ **Yes, it needs to be downloaded and imported** (optional, not required)
- ✅ The app works fine without it - this is a **non-critical DEBUG message**
- ✅ To import: Use Settings → "FSANZ Database Import" option
- ✅ Once imported, it will be stored locally and used automatically

**Recommendation:**
- If you're testing: **Skip it for now** (app works fine)
- If you're deploying to NZ: **Import it** for best accuracy
- The message will disappear once the database is imported

---

**Status:** ⚠️ **Optional Enhancement** - Not required for basic functionality
