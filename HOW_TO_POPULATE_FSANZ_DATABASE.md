# How to Populate FSANZ Database - Complete Guide

## Current Situation

✅ **System is working** - Downloads, imports, and queries FSANZ database  
⚠️ **Database is empty** - Needs to be populated with product data  
📁 **You have FSANZ files** - In `Database files/` directory

## Important: FSANZ Government Databases vs Product Databases

### What You Have (Food Composition Databases)

The files in `Database files/` are **food composition databases** (AFCD/NZFCD):
- ✅ Contains nutrition data for generic foods
- ✅ Government-verified data
- ❌ **No barcodes** (not product-specific)
- ❌ Examples: "Apple, raw", "Milk, whole", "Bread, white"

These are **NOT product databases** - they don't map barcodes to products.

### What You Need (Product Databases)

To make FSANZ work with barcode scanning, you need:
- ✅ **Product databases** with barcodes
- ✅ Maps barcodes → products → nutrition data
- ✅ Examples: "9400580012345" → "Pams Milk 2L" → nutrition data

## Solution Options

### Option 1: Use Open Food Facts Data (Recommended)

Open Food Facts has product databases with barcodes for NZ/AU:

1. **Export from Open Food Facts:**
   - NZ: https://world.openfoodfacts.org/data/data-fields.txt (filter for NZ)
   - Or use their API to get NZ/AU products

2. **Convert to FSANZ format:**
   - Map Open Food Facts products to FSANZ format
   - Include barcodes, product names, nutrition data

3. **Populate database:**
   - Save as `backend/vercel/data/fsanz-nz.json`
   - Deploy to Vercel

### Option 2: Combine FSANZ Nutrition + Product Barcodes

1. **Get product database** with barcodes (from retailers, Open Food Facts, etc.)
2. **Match products** to FSANZ food composition data
3. **Create combined database** with barcodes + FSANZ nutrition

### Option 3: Use Existing Import Script (If Files Have Barcodes)

If your FSANZ files somehow have barcodes:

```powershell
# Install xlsx package
npm install xlsx --save

# Convert NZ database
npm run import-fsanz -- --input "Database files/Principal files/Excel files/Standard DATA.FT.xlsx" --output backend/vercel/data/fsanz-nz.json --country NZ

# Convert AU database  
npm run import-fsanz -- --input "Database files/AU Release 2 - Food Details.xlsx" --output backend/vercel/data/fsanz-au.json --country AU
```

**Note:** This will likely skip all rows if the files don't have barcode columns.

## Recommended Approach: Use Open Food Facts

Since FSANZ government databases don't have barcodes, the best approach is:

### Step 1: Get Product Data from Open Food Facts

Open Food Facts has product databases with barcodes for NZ/AU products.

### Step 2: Create Conversion Script

Create a script that:
1. Fetches NZ/AU products from Open Food Facts
2. Converts to FSANZ format
3. Saves as JSON files

### Step 3: Deploy to Vercel

```powershell
cd backend\vercel
vercel --prod
```

### Step 4: App Auto-Downloads

App will automatically download the populated database on next launch.

## Quick Start: Test with Sample Data

To test the system works with actual data, create a small test database:

```powershell
# Create test database with a few products
$testData = @{
    "9400580012345" = @{
        productName = "Pams Milk 2L"
        brand = "Pams"
        energyKcal = 280
        fat = 3.3
        protein = 3.4
        carbohydrates = 4.8
        country = "NZ"
    }
} | ConvertTo-Json -Depth 10

$testData | Out-File -FilePath "backend\vercel\data\fsanz-nz.json" -Encoding utf8
```

Then deploy:
```powershell
cd backend\vercel
vercel --prod
```

Restart app and scan barcode `9400580012345` - it should find the product!

## Current Status

- ✅ **System:** Fully functional
- ✅ **Download:** Working
- ✅ **Import:** Working
- ✅ **Query:** Working
- ⚠️ **Data:** Empty (needs product database with barcodes)

## Next Steps

1. **Decide on data source:**
   - Open Food Facts (has barcodes)
   - Retailer databases (if available)
   - Custom product database

2. **Convert to FSANZ format:**
   - Use existing script or create new one
   - Ensure barcodes are included

3. **Deploy to Vercel:**
   - Place JSON files in `backend/vercel/data/`
   - Deploy: `cd backend/vercel && vercel --prod`

4. **App will auto-download:**
   - No user action needed
   - Database will be available for queries

## Summary

The FSANZ system is **100% functional** - it just needs product data with barcodes. The government FSANZ files you have are food composition databases (no barcodes), so you'll need to either:
- Use Open Food Facts product data
- Get product databases from retailers
- Create a combined database

Once you have product data with barcodes in the correct format, deploy it to Vercel and the app will automatically use it!
