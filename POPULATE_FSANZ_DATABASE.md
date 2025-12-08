# How to Populate FSANZ Database with Actual Product Data

## Overview

The FSANZ database system is working, but the database files are currently empty (`{}`). To make them usable, you need to:

1. **Convert your existing FSANZ database files** to JSON format
2. **Deploy the JSON files** to Vercel
3. **App will automatically download** the populated database

## Step 1: Install Required Dependencies

```powershell
cd C:\TrueScan-FoodScanner
npm install xlsx --save
```

## Step 2: Convert FSANZ Database Files to JSON

You have FSANZ database files in `Database files/` directory. Convert them:

### For New Zealand:

```powershell
node scripts/importFSANZDatabase.js --input "Database files/Principal files/Excel files/Standard DATA.FT.xlsx" --output backend/vercel/data/fsanz-nz.json --country NZ
```

Or if you have a different file with barcodes:

```powershell
node scripts/importFSANZDatabase.js --input "path/to/your/fsanz-nz-file.xlsx" --output backend/vercel/data/fsanz-nz.json --country NZ
```

### For Australia:

```powershell
node scripts/importFSANZDatabase.js --input "Database files/AU Release 2 - Food Details.xlsx" --output backend/vercel/data/fsanz-au.json --country AU
```

## Step 3: Verify JSON Files

Check that the JSON files were created and contain data:

```powershell
# Check file size (should be > 0 bytes)
dir backend\vercel\data\fsanz-*.json

# Check first few lines (should show product data)
Get-Content backend\vercel\data\fsanz-nz.json -Head 20
```

## Step 4: Deploy to Vercel

Once the JSON files are populated:

```powershell
cd backend\vercel
vercel --prod
```

This will deploy the populated database files to Vercel.

## Step 5: App Will Auto-Download

After deployment:

1. **Restart your app**
2. **App will automatically download** the populated database
3. **Database will be imported** into AsyncStorage
4. **Products will be found** when scanning barcodes

## Important Notes

### File Format Requirements

The import script expects Excel/CSV files with these columns:
- **Barcode** (required) - Product barcode/GTIN/EAN
- **Product Name** (required) - Product name
- **Brand** (optional) - Brand name
- **Energy (kcal)** or **Energy (kJ)** - Energy content
- **Fat (g)**, **Saturated Fat (g)** - Fat content
- **Carbohydrates (g)**, **Sugars (g)** - Carbohydrate content
- **Protein (g)** - Protein content
- **Salt (g)**, **Sodium (g)** - Salt/sodium content
- **Fiber (g)** or **Dietary Fiber (g)** - Fiber content
- **Ingredients** - Ingredient list
- **Package Size**, **Serving Size** - Size information
- **Category** - Food category

### If Your Files Don't Have Barcodes

The FSANZ government databases (AFCD/NZFCD) are **food composition databases**, not product databases. They contain:
- Generic foods (e.g., "Apple, raw")
- Nutrition data per 100g
- **No barcodes** (they're not product-specific)

**To get product-specific data with barcodes, you need:**

1. **Product databases** that map barcodes to products
2. **Combine** with FSANZ nutrition data
3. **Or use** Open Food Facts NZ/AU instances which have barcodes

### Alternative: Use Open Food Facts Data

If FSANZ files don't have barcodes, you can:

1. **Export from Open Food Facts** (NZ/AU instances)
2. **Filter for NZ/AU products**
3. **Convert to FSANZ format**
4. **Populate the database**

## Expected Result

After populating and deploying:

1. **Database files** will contain product data (not empty `{}`)
2. **App will download** populated database automatically
3. **Products will be found** when scanning matching barcodes
4. **TruScore will use** FSANZ data for better accuracy

## Troubleshooting

### Script Fails to Find Barcodes

If the script skips all rows:
- Check that your Excel file has a "Barcode", "GTIN", "EAN", or "UPC" column
- The column name must match exactly (case-sensitive)
- Or modify the script to match your column names

### Database Too Large

If the database exceeds 10MB:
- Consider using SQLite instead of AsyncStorage
- Or filter to only include common products
- Or split into multiple databases

### Products Still Not Found

After populating:
- Verify barcodes in JSON file match scanned barcodes
- Check that barcode format is correct (EAN-13, EAN-8, etc.)
- Ensure database was downloaded (check app logs)

## Quick Test

After populating, test with a known barcode:

1. **Find a barcode** in your populated JSON file
2. **Scan it** in the app
3. **Check logs** for: `✅ FSANZ NZ: Found product`
4. **Verify** TruScore uses FSANZ data
