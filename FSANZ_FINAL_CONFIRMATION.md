# FSANZ Query Order & TruScore - Final Confirmation

## ✅ Query Order: CONFIRMED CORRECT

### Order (As Implemented):

1. **User scans barcode** → `9300645019629`
2. **Open Food Facts (TIER 1)** → Queried FIRST by barcode
   - Returns: `product_name: "PASSATA CLASSIC"` + nutrition data
3. **FSANZ Query** → Queried AFTER OFF by product name
   - Uses: `"PASSATA CLASSIC"` from OFF
   - Queries: `/api/fsanz-query?country=nz&productName=PASSATA%20CLASSIC`
4. **Enhancement** → FSANZ data merged (if found)
5. **TruScore** → Uses enhanced product

### ✅ Order is CORRECT:
- OFF queried FIRST (by barcode) ✅
- FSANZ queried SECOND (by product name) ✅
- Product name available before FSANZ query ✅

## ❌ Current Issue: 404 Errors

All FSANZ queries return `404`:
```
LOG  [DEBUG] FSANZ query failed: 404
```

**Impact:**
- FSANZ data NOT being used
- TruScore only uses Open Food Facts data

## ✅ FSANZ Data in TruScore

### When Working (After 404 Fix):

1. **Enhances nutrition:**
   - Adds: calcium, iron, dietary fiber, etc.
   - Uses official government data

2. **Updates source:**
   - From: `openfoodfacts`
   - To: `openfoodfacts+nzfcd`

3. **Improves TruScore:**
   - Body Pillar: Better nutrition completeness
   - Data Quality: Official government data
   - Overall: More accurate scoring

### Current Status:
- ❌ Source: `openfoodfacts` only
- ❌ No FSANZ data used
- ✅ Once fixed, will show `openfoodfacts+nzfcd`

## Next Steps

1. Fix 404 errors (ensure API deployed)
2. Test API endpoint
3. Verify FSANZ queries work
4. Confirm TruScore uses FSANZ data
