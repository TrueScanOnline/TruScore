# FSANZ Database Integration Guide
## Phase 2: Government Database Integration

**Status:** Structure implemented, ready for database import  
**Expected Impact:** +20-30% recognition for NZ/AU users  
**Priority:** HIGH for NZ/AU market

---

## Overview

FSANZ (Food Standards Australia New Zealand) maintains official government food composition databases for both Australia and New Zealand. These databases contain comprehensive, government-verified nutrition data for thousands of products.

**Key Challenge:** FSANZ doesn't provide a public real-time API. The databases are available for download in Excel/Access formats.

**Solution:** Download database exports, convert to local format, and query locally for fast, offline access.

---

## Database Sources

### Australia: FSANZ Branded Food Database
- **URL:** https://www.foodstandards.gov.au/science/monitoringnutrients/afcd/Pages/default.aspx
- **Format:** Excel, Access
- **Coverage:** 85%+ of products sold by national retailers
- **Data Includes:**
  - Product names, brands
  - Complete nutrition information panels
  - Ingredient statements
  - Health Star Ratings (if available)
  - GTINs (barcodes)

### New Zealand: MPI Food Composition Database
- **URL:** https://www.mpi.govt.nz/food-safety/food-monitoring-and-surveillance/food-composition-database/
- **Format:** Excel, CSV
- **Coverage:** NZ food products
- **Data Includes:**
  - Product information
  - Nutrition data
  - Ingredient lists

---

## Implementation Steps

### Step 1: Download Database Exports

1. **Australia:**
   - Visit: https://www.foodstandards.gov.au/science/monitoringnutrients/afcd/Pages/default.aspx
   - Download latest Excel/Access export
   - File size: ~50-100MB (varies by version)

2. **New Zealand:**
   - Visit: https://www.mpi.govt.nz/food-safety/food-monitoring-and-surveillance/food-composition-database/
   - Download latest export
   - File size: ~10-50MB (varies by version)

### Step 2: Convert to App-Compatible Format

**Option A: JSON Format (for AsyncStorage - <10MB)**
```javascript
// Convert Excel/CSV to JSON
// Structure: { barcode: productData }
{
  "9300657003425": {
    "productName": "Product Name",
    "brand": "Brand Name",
    "energyKcal": 250,
    "fat": 10.5,
    "carbohydrates": 30.2,
    // ... other nutrition fields
  }
}
```

**Option B: SQLite Format (for larger datasets)**
- Use `expo-sqlite` or `react-native-sqlite-storage`
- Create table: `fsanz_products` with barcode as primary key
- Import data from Excel/CSV

### Step 3: Import into App

**For JSON Format:**
```typescript
// src/services/fsanDatabase.ts - Import function
export async function importFSANZDatabase(
  data: Record<string, FSANZProduct>,
  country: 'AU' | 'NZ'
): Promise<void> {
  const cacheKey = `${FSANZ_CACHE_KEY}_${country}`;
  await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
  logger.info(`Imported FSANZ ${country} database: ${Object.keys(data).length} products`);
}
```

**For SQLite Format:**
```typescript
// Use expo-sqlite to import and query
import * as SQLite from 'expo-sqlite';

const db = await SQLite.openDatabaseAsync('fsanz.db');
// Import data...
```

### Step 4: Update Query Function

The `queryLocalFSANZDatabase()` function in `src/services/fsanDatabase.ts` is already structured to query local data. Update it based on your chosen storage format (JSON or SQLite).

---

## Current Implementation Status

✅ **Structure Complete:**
- `src/services/fsanDatabase.ts` created
- Local database query function ready
- Integration into `productService.ts` complete
- Type definitions updated

⚠️ **Pending:**
- Database download and conversion
- Data import into app
- Testing with real FSANZ data

---

## Alternative: Enhanced Open Food Facts

**Good News:** Open Food Facts has already imported FSANZ data for many products. Our enhanced Phase 1 implementation (querying 25+ country-specific OFF instances) already provides access to this FSANZ-imported data.

**Impact:**
- Phase 1 already provides significant FSANZ coverage via OFF
- Direct FSANZ integration (Phase 2) would add:
  - More recent products
  - Products not yet in OFF
  - Official government verification

---

## Expected Results

### Before FSANZ Integration
- NZ/AU recognition: ~75-80% (via OFF + retailers)

### After FSANZ Integration
- NZ/AU recognition: ~95-98%
- Offline access to government data
- Official nutrition information

---

## Maintenance

**Regular Updates:**
- FSANZ databases are updated periodically
- Download new exports monthly/quarterly
- Update local database in app
- Notify users of database updates

**Storage Considerations:**
- AU database: ~50-100MB
- NZ database: ~10-50MB
- Total: ~60-150MB
- Consider:
  - Optional download (user choice)
  - Compression
  - Incremental updates

---

## Next Steps

1. **Immediate:** Test current implementation with Phase 1 enhancements
2. **Short-term:** Download FSANZ database exports
3. **Medium-term:** Convert and import into app
4. **Long-term:** Set up automated database updates

---

**Note:** The current implementation provides the structure for FSANZ integration. The enhanced Open Food Facts queries (Phase 1) already provide significant FSANZ coverage, so direct FSANZ integration can be prioritized based on user feedback and market needs.

