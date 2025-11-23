# FSANZ Database Download and Import Instructions
## Step-by-Step Guide to Import Government Food Databases

**Purpose:** Import official FSANZ (Food Standards Australia New Zealand) databases to achieve 95%+ product recognition for NZ/AU users.

---

## Step 1: Download FSANZ Database Exports

### Australia: FSANZ Branded Food Database

1. **Visit FSANZ Website:**
   - URL: https://www.foodstandards.gov.au/science/monitoringnutrients/afcd/Pages/default.aspx
   - Or search: "FSANZ Australian Food Composition Database"

2. **Download Database Export:**
   - Look for "Download" or "Export" option
   - Download in Excel (.xlsx) or Access (.mdb) format
   - File size: ~50-100MB (varies by version)
   - Save to: `C:\TrueScan-FoodScanner\downloads\fsanz-au-export.xlsx`

3. **Alternative Sources:**
   - FSANZ Branded Food Database: https://www.foodstandards.gov.au/science/monitoringnutrients/Branded-food-database/Pages/default.aspx
   - May require registration for some exports

### New Zealand: MPI Food Composition Database

1. **Visit MPI Website:**
   - URL: https://www.mpi.govt.nz/food-safety/food-monitoring-and-surveillance/food-composition-database/
   - Or search: "New Zealand Food Composition Database MPI"

2. **Download Database Export:**
   - Look for download/export options
   - Download in Excel (.xlsx) or CSV format
   - File size: ~10-50MB (varies by version)
   - Save to: `C:\TrueScan-FoodScanner\downloads\fsanz-nz-export.xlsx`

---

## Step 2: Install Required Tools

### Install Node.js Dependencies

```bash
cd C:\TrueScan-FoodScanner
npm install xlsx
```

This installs the `xlsx` package needed to read Excel files.

---

## Step 3: Convert Database to JSON Format

### Run the Conversion Script

**For Australia:**
```bash
node scripts/importFSANZDatabase.js --input downloads/fsanz-au-export.xlsx --output data/fsanz-au.json --country AU
```

**For New Zealand:**
```bash
node scripts/importFSANZDatabase.js --input downloads/fsanz-nz-export.xlsx --output data/fsanz-nz.json --country NZ
```

### What the Script Does:
1. Reads Excel/CSV file
2. Extracts product data
3. Maps FSANZ fields to app format
4. Creates JSON file indexed by barcode
5. Outputs conversion statistics

### Expected Output:
```
Converting FSANZ AU database from downloads/fsanz-au-export.xlsx...
✅ Converted 45,231 products
📁 Output saved to: data/fsanz-au.json
📦 File size: 12.45 MB
```

---

## Step 4: Import into App

### Option A: Import via App UI (Future Implementation)

A UI screen can be added to allow users to:
1. Select JSON file from device storage
2. Choose country (AU/NZ)
3. Import database
4. View import progress and statistics

### Option B: Import Programmatically (Current)

Use the import service in your app initialization or settings:

```typescript
import { importFSANZDatabaseFromFile } from './src/services/fsanDatabaseImport';

// Import AU database
const result = await importFSANZDatabaseFromFile(
  'file:///path/to/fsanz-au.json',
  'AU'
);

if (result.success) {
  console.log(`✅ Imported ${result.productCount} products`);
} else {
  console.error(`❌ Import failed: ${result.error}`);
}
```

### Option C: Bundle with App (For Production)

For production apps, you can:
1. Convert FSANZ databases to JSON
2. Include JSON files in app bundle
3. Import on first app launch
4. Update periodically via app updates

---

## Step 5: Verify Import

### Check Database Status

```typescript
import { isFSANZDatabaseImported, getFSANZDatabaseMetadata } from './src/services/fsanDatabaseImport';

// Check if imported
const isImported = await isFSANZDatabaseImported('AU');
console.log('AU database imported:', isImported);

// Get metadata
const metadata = await getFSANZDatabaseMetadata('AU');
if (metadata) {
  console.log(`Products: ${metadata.productCount}`);
  console.log(`Imported: ${metadata.importDate}`);
  console.log(`Size: ${(metadata.dataSize / 1024 / 1024).toFixed(2)} MB`);
}
```

---

## Step 6: Test Product Lookup

After import, test with known barcodes:

```typescript
import { fetchProductFromFSANZ } from './src/services/fsanDatabase';

// Test lookup
const product = await fetchProductFromFSANZ('9300657003425'); // Example NZ barcode
if (product) {
  console.log('Found in FSANZ:', product.product_name);
} else {
  console.log('Not found in FSANZ database');
}
```

---

## Database Update Schedule

**Recommended Update Frequency:**
- **Monthly:** For active apps with many users
- **Quarterly:** For general use
- **As needed:** When FSANZ releases major updates

**Update Process:**
1. Download latest FSANZ export
2. Convert to JSON using script
3. Import new database (replaces old)
4. Clear app cache if needed

---

## Troubleshooting

### Issue: "Cannot find module 'xlsx'"
**Solution:** Run `npm install xlsx` in project root

### Issue: "Invalid database format"
**Solution:** Check that input file is valid Excel/CSV. Try converting Excel to CSV first.

### Issue: "Database is empty"
**Solution:** Check that the Excel file has data in the first sheet. Some exports use multiple sheets.

### Issue: "File size exceeds limit"
**Solution:** 
- Database is too large for AsyncStorage (>50MB)
- Consider using SQLite instead (future enhancement)
- Or split database by category

### Issue: "No products found after import"
**Solution:**
- Check barcode format in database (may need normalization)
- Verify barcode field mapping in conversion script
- Check that barcodes match expected format (EAN-13, etc.)

---

## Field Mapping Reference

The conversion script maps FSANZ fields to app format:

| FSANZ Field | App Field | Notes |
|-------------|-----------|-------|
| GTIN / Barcode | barcode | Primary key |
| Product Name | productName | |
| Brand | brand | |
| Energy (kcal) | energyKcal | Or converted from kJ |
| Fat | fat | |
| Saturated Fat | saturatedFat | |
| Carbohydrates | carbohydrates | |
| Sugars | sugars | |
| Protein | protein | |
| Salt | salt | |
| Sodium | sodium | |
| Dietary Fiber | dietaryFiber | |
| Ingredients | ingredients | |
| Package Size | packageSize | |
| Serving Size | servingSize | |
| Category | categories | Array |
| Health Star Rating | healthStarRating | If available |

---

## Expected Results

### Before FSANZ Import:
- NZ/AU recognition: ~75-80%

### After FSANZ Import:
- NZ/AU recognition: ~95-98%
- Offline access to government data
- Official nutrition information
- Comprehensive product coverage

---

## File Structure

After setup, you should have:

```
TrueScan-FoodScanner/
├── downloads/
│   ├── fsanz-au-export.xlsx    (original download)
│   └── fsanz-nz-export.xlsx    (original download)
├── data/
│   ├── fsanz-au.json           (converted, ready to import)
│   └── fsanz-nz.json           (converted, ready to import)
├── scripts/
│   └── importFSANZDatabase.js  (conversion script)
└── src/
    └── services/
        ├── fsanDatabase.ts           (query functions)
        └── fsanDatabaseImport.ts    (import functions)
```

---

## Next Steps After Import

1. **Test Recognition:** Scan products known to be in FSANZ database
2. **Monitor Performance:** Check recognition rates improve
3. **User Feedback:** Gather feedback on data quality
4. **Regular Updates:** Schedule periodic database updates
5. **Optimize:** Consider SQLite for larger databases if needed

---

## Support

If you encounter issues:
1. Check conversion script output for errors
2. Verify JSON file is valid (open in text editor)
3. Check AsyncStorage limits (50MB per database)
4. Review field mapping if products missing

---

**Status:** Import system ready. Download FSANZ exports and run conversion script to enable full functionality.

