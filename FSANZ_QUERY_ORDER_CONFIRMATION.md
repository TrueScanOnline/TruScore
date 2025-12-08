# FSANZ Query Order - Confirmed ✅

## Query Order Confirmation

### ✅ CORRECT ORDER (As Implemented):

1. **User scans barcode** → App receives barcode (e.g., `9300645019629`)
2. **Open Food Facts (TIER 1)** → Queried FIRST by barcode
   - Returns: Product name, nutrition data, ingredients, etc.
   - Example: `"PASSATA CLASSIC"` with nutrition data
3. **FSANZ Database Query** → Queried AFTER OFF by product name
   - Uses product name from OFF: `"PASSATA CLASSIC"`
   - Queries: `GET /api/fsanz-query?country=nz&productName=PASSATA%20CLASSIC`
   - Returns: Official FSANZ nutrition data (if match found)
4. **Product Enhancement** → FSANZ data merged into product
5. **TruScore Calculation** → Uses enhanced product with FSANZ data

### Code Flow (from `productService.ts`):

```typescript
// Step 1: Query Open Food Facts by barcode (TIER 1)
const product = await fetchProductFromOFF(barcode);
// Returns: { product_name: "PASSATA CLASSIC", nutriments: {...}, ... }

// Step 2: Enhance with FSANZ by product name (AFTER OFF)
if (product && product.product_name) {
  const enhanced = await enhanceProductWithFSANZQuery(product);
  // Queries: /api/fsanz-query?country=nz&productName=PASSATA%20CLASSIC
  // Merges FSANZ nutrition data into product
  product = enhanced;
}

// Step 3: Calculate TruScore with enhanced product
const trustScore = calculateTrustScore(product);
// Uses: product.nutriments (now includes FSANZ data if found)
```

### ✅ Order is CORRECT:
- **OFF is queried FIRST** (by barcode) ✅
- **FSANZ is queried SECOND** (by product name from OFF) ✅
- **Product name is available** before FSANZ query ✅

## Current Issue: 404 Errors

### Problem:
All FSANZ queries are returning `404`:
```
LOG  [DEBUG] FSANZ query failed: 404
LOG  [DEBUG] FSANZ: No match found for "PASSATA CLASSIC"
```

### Root Cause:
The API endpoint `/api/fsanz-query` is returning 404, which means:
1. Either the endpoint doesn't exist on Vercel
2. Or the data files (`nzfcd.json`, `afcd.json`) aren't accessible

### Fix Required:
1. Ensure data files are created and deployed
2. Ensure API endpoint is deployed correctly
3. Test API endpoint accessibility

## FSANZ Data in TruScore

### ✅ FSANZ Data WOULD Be Used:

When FSANZ data is successfully merged, it:
1. **Enhances nutrition data:**
   - Adds missing nutrients (calcium, iron, etc.)
   - Fills gaps in existing nutrition data
   - Uses official government data

2. **Updates product source:**
   - Changes from: `openfoodfacts`
   - To: `openfoodfacts+nzfcd` or `openfoodfacts+afcd`

3. **Influences TruScore:**
   - TruScore uses `product.nutriments` for Body Pillar calculation
   - More complete nutrition data = better TruScore accuracy
   - Official FSANZ data = higher quality score

### Current Status:
- ❌ FSANZ data is NOT being used (due to 404 errors)
- ❌ TruScore only uses Open Food Facts data
- ✅ Once 404 is fixed, FSANZ data will automatically be used

## Summary

### ✅ Query Order: CORRECT
- OFF queried first (by barcode) ✅
- FSANZ queried second (by product name) ✅
- Product name available before FSANZ query ✅

### ❌ Current Issue: 404 Errors
- All FSANZ queries failing with 404
- API endpoint not accessible
- Data files may not be deployed

### ✅ FSANZ Would Be Used in TruScore
- Once 404 is fixed, FSANZ data will automatically:
  - Enhance nutrition data
  - Update product source
  - Improve TruScore accuracy
