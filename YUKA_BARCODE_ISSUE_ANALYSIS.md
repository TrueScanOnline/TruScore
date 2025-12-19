# Yuka Barcode Issue - Root Cause Analysis

## Problem
Yuka successfully returns product information for 10 barcodes using Open Food Facts, but our app does not.

## Test Barcodes
1. `9310036039655` (13 digits - EAN-13)
2. `9310412003577` (13 digits - EAN-13)
3. `9300601249114` (13 digits - EAN-13)
4. `9343787099111` (13 digits - EAN-13)
5. `4008355030495` (13 digits - EAN-13)
6. `9310645176833` (13 digits - EAN-13)
7. `9357107000251` (13 digits - EAN-13)
8. `9342373000395` (13 digits - EAN-13)
9. `931839007104` (12 digits - UPC-A, should normalize to EAN-13)
10. `93100062212972` (14 digits - might be invalid or need special handling)

## Root Cause Analysis

### Issue #1: 3-Second Query Timeout ⚠️ **LIKELY CAUSE**
**Location:** `src/data/databases/truScoreOptimizedDatabase.ts:122`
- Query has a 3-second timeout
- If OFF takes longer than 3 seconds, query times out
- Returns partial results or null
- **Yuka likely has a longer timeout or no timeout**

### Issue #2: Country-Specific Instance Strategy
**Location:** `src/services/openFoodFacts.ts:74-120`
- We try country-specific instances first, then global
- Some products might only exist in specific country instances
- If user's country instance is slow/down, we might timeout before trying global
- **Yuka might try global instance first or use different strategy**

### Issue #3: Barcode Normalization
**Location:** `src/utils/barcodeNormalization.ts`
- Barcode #9 (12 digits) should normalize to EAN-13
- Barcode #10 (14 digits) might be invalid
- Need to verify normalization is working correctly

### Issue #4: Product Validation
**Location:** `src/utils/productValidation.ts`
- ProductSchema requires `code: z.string().min(8).max(14).regex(/^\d+$/)`
- 14-digit barcode (#10) is at max limit - might fail validation
- Need to check if validation is rejecting valid products

### Issue #5: Missing Product Name Filter
**Location:** `src/services/productSearchService.ts:68, 118, 165`
- Search functions filter: `.filter((p: any) => p.code && p.product_name)`
- This is for SEARCH only, not direct barcode lookup
- Direct lookup should work without product_name

## Recommended Fixes

### Fix #1: Increase Query Timeout (CRITICAL)
**File:** `src/data/databases/truScoreOptimizedDatabase.ts`
- Change timeout from 3 seconds to 10 seconds
- Or remove timeout entirely for OFF queries
- Yuka likely has longer timeout

### Fix #2: Try Global Instance First
**File:** `src/services/openFoodFacts.ts`
- Try global instance (`world.openfoodfacts.org`) FIRST
- Then try country-specific instances
- This matches Yuka's likely strategy

### Fix #3: Fix Barcode Normalization
**File:** `src/utils/barcodeNormalization.ts`
- Verify 12-digit barcodes normalize correctly
- Handle 14-digit barcodes (might need to truncate or special handling)

### Fix #4: Make Product Name Optional
**File:** `src/utils/productValidation.ts`
- Already optional, but verify it's not being filtered elsewhere
- Check if any code requires product_name after validation

### Fix #5: Add Better Error Logging
- Log when OFF queries timeout
- Log which instances were tried
- Log barcode normalization results
- Log validation failures

## Immediate Action Items

1. **Test each barcode directly against OFF API** to verify they exist
2. **Increase query timeout** from 3s to 10s
3. **Try global instance first** before country-specific
4. **Add detailed logging** for debugging
5. **Test all 10 barcodes** after fixes

## Testing Plan

1. Test each barcode against: `https://world.openfoodfacts.org/api/v2/product/{barcode}.json`
2. Compare response with what our code receives
3. Check if timeout is the issue
4. Verify barcode normalization
5. Check validation results
