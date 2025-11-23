# FSANZ Database Import Instructions
## Step-by-Step Guide to Import FSANZ Databases

**Purpose:** Import official FSANZ (Food Standards Australia New Zealand) government databases to achieve 95%+ product recognition for NZ/AU users.

---

## Prerequisites

1. **Node.js installed** (for conversion script)
2. **Excel or CSV file** from FSANZ (see download links below)
3. **Storage space:** ~50-150MB for database files

---

## Step 1: Download FSANZ Database Exports

### Australia: FSANZ Branded Food Database

1. Visit: https://www.foodstandards.gov.au/science/monitoringnutrients/afcd/Pages/default.aspx
2. Look for "Download Database" or "Database Export" section
3. Download the latest Excel (.xlsx) or Access (.mdb) file
4. File typically named: `FSANZ_Branded_Food_Database.xlsx` or similar
5. Save to: `C:\TrueScan-FoodScanner\data\fsanz_au.xlsx`

**Alternative:** If direct download not available:
- Visit: https://www.foodstandards.gov.au/science/monitoringnutrients/brandedfood/Pages/default.aspx
- Look for "Data Download" or "Export" options
- May require registration (free)

### New Zealand: MPI Food Composition Database

1. Visit: https://www.mpi.govt.nz/food-safety/food-monitoring-and-surveillance/food-composition-database/
2. Look for database download link
3. Download Excel or CSV file
4. Save to: `C:\TrueScan-FoodScanner\data\fsanz_nz.xlsx`

**Note:** If downloads are not directly available, contact:
- FSANZ: info@foodstandards.gov.au
- MPI NZ: info@mpi.govt.nz

---

## Step 2: Install Required Dependencies

```bash
cd C:\TrueScan-FoodScanner
npm install xlsx
```

This package is needed to parse Excel files.

---

## Step 3: Convert Database to JSON Format

### For Australia:

```bash
node scripts/importFSANZDatabase.js --input data/fsanz_au.xlsx --output data/fsanz_au.json --country AU
```

### For New Zealand:

```bash
node scripts/importFSANZDatabase.js --input data/fsanz_nz.xlsx --output data/fsanz_nz.json --country NZ
```

**Output:**
- Creates `data/fsanz_au.json` or `data/fsanz_nz.json`
- JSON format optimized for app import
- File size: ~10-50MB (varies by database size)

**If you have CSV instead of Excel:**

1. Use the script with `.csv` extension:
   ```bash
   node scripts/importFSANZDatabase.js --input data/fsanz_au.csv --output data/fsanz_au.json --country AU
   ```

2. Or convert Excel to CSV first:
   - Open in Excel/LibreOffice
   - Save As → CSV format
   - Then use script with `.csv` file

---

## Step 4: Import into App

### Option A: Manual Import (Development)

Create a temporary import script:

```typescript
// scripts/importToApp.ts (temporary file)
import * as fs from 'fs';
import { importFSANZDatabase } from '../src/services/fsanDatabaseImporter';

async function importDatabase() {
  // Read JSON file
  const auData = JSON.parse(fs.readFileSync('data/fsanz_au.json', 'utf-8'));
  
  // Import into app
  const result = await importFSANZDatabase(auData, 'AU');
  console.log('Import result:', result);
}

importDatabase();
```

### Option B: Runtime Import (Production)

Add an admin/settings screen in the app that allows:
1. User selects JSON file from device storage
2. App reads and imports using `importFSANZDatabase()`
3. Shows progress and confirmation

**Implementation:**
```typescript
// In a settings/admin screen
import * as DocumentPicker from 'expo-document-picker';
import { importFSANZDatabase } from '../services/fsanDatabaseImporter';

const handleImportFSANZ = async () => {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
  });
  
  if (result.type === 'success') {
    // Read file (requires expo-file-system)
    const fileContent = await FileSystem.readAsStringAsync(result.uri);
    const databaseData = JSON.parse(fileContent);
    
    // Import
    const importResult = await importFSANZDatabase(databaseData, 'AU');
    // Show success/error message
  }
};
```

---

## Step 5: Verify Import

Check if database was imported successfully:

```typescript
import { getFSANZDatabaseMetadata, isFSANZDatabaseAvailable } from '../services/fsanDatabaseImporter';

// Check if available
const isAvailable = await isFSANZDatabaseAvailable('AU');
console.log('FSANZ AU database available:', isAvailable);

// Get metadata
const metadata = await getFSANZDatabaseMetadata('AU');
console.log('Database info:', metadata);
// Output: { exists: true, productCount: 50000, importedAt: 1234567890, sizeInBytes: 5242880 }
```

---

## Step 6: Test Product Lookup

After import, test with a known barcode:

```typescript
import { fetchProductFromFSANZ } from '../services/fsanDatabase';

const product = await fetchProductFromFSANZ('9300657003425'); // Example NZ barcode
if (product) {
  console.log('Found in FSANZ:', product.product_name);
}
```

---

## Database Structure Reference

The conversion script expects FSANZ database to have these columns (adjust in script if different):

**Required:**
- `GTIN` or `Barcode` or `Product Code` - Product barcode
- `Product Name` or `Name` - Product name

**Optional but Recommended:**
- `Brand` or `Brand Name` - Brand name
- `Energy (kcal)` or `Energy` - Calories per 100g
- `Fat` - Fat per 100g
- `Saturated Fat` or `Saturated` - Saturated fat per 100g
- `Carbohydrates` or `Carbs` - Carbohydrates per 100g
- `Sugars` - Sugars per 100g
- `Protein` or `Proteins` - Protein per 100g
- `Salt` or `Sodium` - Salt/Sodium per 100g
- `Dietary Fiber` or `Fiber` - Fiber per 100g
- `Ingredients` or `Ingredient Statement` - Ingredients list
- `Package Size` or `Size` - Package size
- `Category` or `Categories` - Product category
- `Health Star Rating` or `HSR` - Health star rating (AU)

---

## Troubleshooting

### Issue: "xlsx package not installed"
**Solution:** Run `npm install xlsx` in project root

### Issue: "File too large (>10MB)"
**Solution:** 
- Use SQLite instead of AsyncStorage (see Phase 3)
- Or compress JSON before import
- Or split into multiple smaller databases

### Issue: "No products found after import"
**Solution:**
- Check barcode format in source file
- Verify column names match script expectations
- Check conversion script logs for errors

### Issue: "Cannot find FSANZ download link"
**Solution:**
- Contact FSANZ directly: info@foodstandards.gov.au
- Check FSANZ website for latest download instructions
- Alternative: Use Open Food Facts (already includes FSANZ data)

---

## Expected Results

### Before Import:
- Recognition rate: ~75-80% (via OFF + retailers)

### After Import:
- Recognition rate: ~95-98%
- Offline access to government-verified data
- Official nutrition information

---

## Maintenance

**Regular Updates:**
- FSANZ databases are updated periodically (monthly/quarterly)
- Download new exports regularly
- Re-import to update app database
- Notify users of database updates

**Storage Management:**
- Monitor database size
- Consider compression
- Provide option to clear/re-import

---

## Alternative: Use Open Food Facts (Already Implemented)

**Good News:** Open Food Facts has already imported FSANZ data for many products. Our enhanced Phase 1 implementation (querying 25+ country-specific OFF instances) already provides significant FSANZ coverage.

**When to use direct FSANZ import:**
- Need latest products not yet in OFF
- Require official government verification
- Want offline access
- Need 100% FSANZ coverage

**Current Status:**
- Phase 1 (OFF enhancement) provides ~80% FSANZ coverage
- Phase 2 (direct FSANZ) adds remaining ~15-20%

---

## Next Steps After Import

1. Test with real barcodes from NZ/AU products
2. Monitor recognition rate improvements
3. Set up automated update schedule
4. Consider Phase 3: SQLite for larger databases

---

**Questions?** Check `FSANZ_DATABASE_INTEGRATION_GUIDE.md` for more details.

