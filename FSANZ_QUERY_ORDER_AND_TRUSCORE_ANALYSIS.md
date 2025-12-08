# FSANZ Query Order & TruScore Analysis

## ✅ Query Order Confirmation

### CORRECT ORDER (As Implemented):

1. **User scans barcode** → App receives barcode (e.g., `9300645019629`)

2. **Open Food Facts (TIER 1)** → Queried FIRST by barcode
   ```
   LOG  [INFO] 📊 TIER 1: Open Facts Family (Parallel Query)
   LOG  [INFO] ✅ Open Food Facts: Found product | [OFF] | Total: 77%
   ```
   - Returns: Product name (`"PASSATA CLASSIC"`), nutrition data, ingredients, etc.

3. **FSANZ Database Query** → Queried AFTER OFF by product name
   ```
   LOG  [INFO] 🔍 Querying FSANZ (NZ) by product name: "PASSATA CLASSIC"...
   ```
   - Uses product name from OFF: `"PASSATA CLASSIC"`
   - Queries: `GET /api/fsanz-query?country=nz&productName=PASSATA%20CLASSIC`
   - **This happens AFTER Open Food Facts returns the product name** ✅

4. **Product Enhancement** → FSANZ data merged into product (if found)

5. **TruScore Calculation** → Uses enhanced product with FSANZ data

### Code Location:
- **File:** `src/services/productService.ts`
- **Lines 967-981:** FSANZ enhancement happens AFTER product is found from OFF

```typescript
// Step 1: Query Open Food Facts by barcode (TIER 1)
const product = await fetchProductFromOFF(barcode);
// Returns: { product_name: "PASSATA CLASSIC", nutriments: {...}, ... }

// Step 2: Enhance with FSANZ by product name (AFTER OFF)
if (product && product.product_name) {
  const enhanced = await enhanceProductWithFSANZQuery(product);
  // Queries: /api/fsanz-query?country=nz&productName=PASSATA%20CLASSIC
  product = enhanced;
}
```

### ✅ Order is CORRECT:
- **OFF is queried FIRST** (by barcode) ✅
- **FSANZ is queried SECOND** (by product name from OFF) ✅
- **Product name is available** before FSANZ query ✅

## Current Issue: 404 Errors

### Problem from Logs:
```
LOG  [DEBUG] Querying FSANZ by product name: "PASSATA CLASSIC" (NZ)
LOG  [DEBUG] FSANZ query failed: 404
LOG  [DEBUG] FSANZ: No match found for "PASSATA CLASSIC"
```

All FSANZ queries are returning `404`, which means:
- The API endpoint `/api/fsanz-query` is not accessible
- OR the data files (`nzfcd.json`, `afcd.json`) aren't deployed correctly

### Impact:
- ❌ FSANZ data is NOT being merged into products
- ❌ TruScore only uses Open Food Facts data
- ❌ No official FSANZ nutrition data is being used

## FSANZ Data in TruScore

### ✅ FSANZ Data WOULD Be Used (Once 404 is Fixed):

When FSANZ data is successfully merged, it:

1. **Enhances nutrition data:**
   - Adds missing nutrients (calcium, iron, dietary fiber, etc.)
   - Fills gaps in existing nutrition data
   - Uses official government data (higher quality)

2. **Updates product source:**
   - Changes from: `openfoodfacts`
   - To: `openfoodfacts+nzfcd` or `openfoodfacts+afcd`
   - This indicates official FSANZ data was merged

3. **Influences TruScore calculation:**
   - **Body Pillar:** Uses `product.nutriments` for nutrition scoring
     - More complete nutrition data = better Body Pillar score
     - Official FSANZ data = higher quality/accuracy
   - **Data Quality:** Official government data improves overall quality score
   - **Completeness:** Additional nutrients improve data completeness score

### Current Status from Logs:
```
LOG  [INFO]   Source: openfoodfacts
LOG  [INFO]   TruScore: 68/100
LOG  [INFO]   Body Pillar: 20/25
```

- ❌ Source is only `openfoodfacts` (no `+nzfcd` suffix)
- ❌ TruScore only uses Open Food Facts data
- ✅ Once 404 is fixed, source will show `openfoodfacts+nzfcd`
- ✅ TruScore will use enhanced nutrition data from FSANZ

### Expected After Fix:
```
LOG  [INFO] ✅ FSANZ: Enhanced product with official nutrition data
LOG  [INFO]   Source: openfoodfacts+nzfcd
LOG  [INFO]   TruScore: 72/100 (improved with FSANZ data)
LOG  [INFO]   Body Pillar: 22/25 (improved with complete nutrition)
```

## Summary

### ✅ Query Order: CORRECT
- OFF queried first (by barcode) ✅
- FSANZ queried second (by product name) ✅
- Product name available before FSANZ query ✅

### ❌ Current Issue: 404 Errors
- All FSANZ queries failing with 404
- API endpoint not accessible
- Data files may not be deployed correctly

### ✅ FSANZ Would Be Used in TruScore
- Once 404 is fixed, FSANZ data will automatically:
  - Enhance nutrition data (calcium, iron, etc.)
  - Update product source (`openfoodfacts+nzfcd`)
  - Improve TruScore Body Pillar (more complete nutrition)
  - Improve overall data quality and accuracy

### Next Steps:
1. Ensure data files (`nzfcd.json`, `afcd.json`) exist and are deployed
2. Redeploy API endpoint to Vercel
3. Test API endpoint accessibility
4. Verify FSANZ queries work in app logs
