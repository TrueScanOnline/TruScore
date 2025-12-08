# Complete Guide: Populate FSANZ Database

## Overview

The FSANZ database system is **fully functional** but currently empty. To make it usable, you need to populate it with product data that includes **barcodes**.

## The Challenge

**FSANZ Government Databases** (what you have in `Database files/`):
- ✅ Government-verified nutrition data
- ✅ High quality, official data
- ❌ **No barcodes** (generic foods like "Apple, raw")
- ❌ Not product-specific

**What You Need:**
- ✅ Product databases with **barcodes**
- ✅ Maps barcodes → products → nutrition

## Solution: Use Open Food Facts

Open Food Facts has product databases with barcodes for NZ/AU products. We'll use that to populate FSANZ database.

## Step-by-Step Guide

### Step 1: Populate Database from Open Food Facts

Run the population script:

**For New Zealand:**
```powershell
npm run populate-fsanz -- --country NZ --limit 5000
```

**For Australia:**
```powershell
npm run populate-fsanz -- --country AU --limit 5000
```

**What it does:**
- Fetches NZ/AU products from Open Food Facts
- Converts to FSANZ format
- Saves to `backend/vercel/data/fsanz-nz.json` or `fsanz-au.json`
- Includes barcodes, product names, nutrition data

**Parameters:**
- `--country NZ` or `--country AU` - Which country
- `--limit 5000` - How many products to fetch (default: 1000)

### Step 2: Verify JSON Files

Check that files were created with data:

```powershell
# Check file size (should be > 0 bytes, probably several MB)
dir backend\vercel\data\fsanz-*.json

# Check product count (first line should show barcode)
Get-Content backend\vercel\data\fsanz-nz.json -Head 5
```

### Step 3: Deploy to Vercel

Deploy the populated database files:

```powershell
cd backend\vercel
vercel --prod
```

### Step 4: App Will Auto-Download

After deployment:

1. **Restart your app**
2. **App automatically downloads** the populated database
3. **Database imported** into AsyncStorage
4. **Products found** when scanning matching barcodes

## Expected Result

After populating and deploying:

### Before:
```
✅ FSANZ NZ Database: AVAILABLE
   Products: 0
```

### After:
```
✅ FSANZ NZ Database: AVAILABLE
   Products: 5,000
```

### When Scanning:
```
🔍 Trying FSANZ NZ Database (Gold Standard)...
✅ FSANZ NZ: Found product | [FSANZ_NZ] | Total: 85% | ...
```

## Alternative: Use Your Existing Files

If your FSANZ files somehow have barcodes, use the import script:

```powershell
# Install xlsx package first
npm install xlsx --save

# Convert NZ database
npm run import-fsanz -- --input "Database files/your-file.xlsx" --output backend/vercel/data/fsanz-nz.json --country NZ
```

**Note:** This will likely skip all rows if files don't have barcode columns.

## Quick Test

After populating, test with a known barcode:

1. **Check JSON file** for a barcode (e.g., `9400580012345`)
2. **Scan it** in the app
3. **Check logs** for: `✅ FSANZ NZ: Found product`
4. **Verify** TruScore uses FSANZ data

## Troubleshooting

### Script Fails to Fetch

- Check internet connection
- Open Food Facts might be rate-limiting
- Try smaller `--limit` value (e.g., `--limit 100`)

### No Products Found

- Verify country code is correct (NZ or AU)
- Check Open Food Facts has products for that country
- Try world instance: modify script to use `world.openfoodfacts.org`

### Database Too Large

- Reduce `--limit` value
- Filter to only common products
- Consider using SQLite for larger databases

## Summary

1. **Run:** `npm run populate-fsanz -- --country NZ --limit 5000`
2. **Deploy:** `cd backend/vercel && vercel --prod`
3. **Restart app** - Database will auto-download
4. **Scan products** - FSANZ data will be used in TruScore

**The system is ready - just needs data!** 🎉
