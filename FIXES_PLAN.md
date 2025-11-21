# TrueScan Food Scanner - Comprehensive Fix Plan

## Issues Identified & Solutions

### 1. SCANNER BLACK SCREEN
**Problem:** Camera shows black/blank screen when app opens
**Root Cause:** Camera initialization or permission handling issue
**Solution:**
- Check camera permissions before initializing
- Add proper error handling for camera mount failures
- Ensure camera remounts correctly on focus
- Add fallback UI if camera fails to initialize

### 2. PRICING CARD - WRONG STORES & INACCURATE PRICES
**Problem:** 
- Shows US stores (Home Depot, Target, Kroger) for NZ users
- All prices show "the warehouse" even when not stocked
- Prices are inaccurate
- Google Shopping fallback returns international results

**Root Cause:**
- Google Shopping fallback in `storeWebScraping.ts` (line 101-103)
- Google Shopping fallback in `countryStores.ts` (line 396-398)
- No strict country filtering
- No 20-mile radius enforcement

**Solution:**
- Remove ALL Google Shopping fallbacks
- Enforce strict country code filtering
- Only use country-specific store chains
- Implement 20-mile radius check for nearby stores
- Validate store names match country-specific chains
- Return null instead of fallback if no local store found

### 3. FOOD RECALL ALERT - TOO BROAD
**Problem:** Shows recalls for similar products/manufacturers, not exact product
**Root Cause:** Fuzzy matching too lenient, matches on manufacturer only
**Solution:**
- Require minimum 2 matching product words (already implemented but may need tuning)
- Add barcode matching if available
- Increase matching threshold to 60%+ word match
- Filter out manufacturer-only matches
- Prioritize exact product name matches

### 4. IMAGE CACHING ERROR
**Problem:** `Error: Expected URL scheme 'http' or 'https' but was 'file'`
**Root Cause:** `cacheImage()` in `cacheService.ts` tries to download file:// URLs
**Solution:**
- Check if URL is already file:// before attempting download
- Skip caching for local file URIs (already implemented but may have edge case)
- Use `copyAsync` instead of `downloadAsync` for local files

### 5. ECO-SCORE NOT DISPLAYING
**Problem:** Always shows "eco-score not available"
**Root Cause:** 
- Data may not be fetched from Open Food Facts
- Grade calculation may fail
- Border color not matching score letter

**Solution:**
- Check `calculateEcoScore()` function in `openFoodFacts.ts`
- Ensure grade is calculated from score if missing
- Add border color matching grade (A=green, B=light green, C=yellow, D=orange, E=red)
- Fix display logic in result screen

### 6. INGREDIENTS CARD SHOWING BARCODE
**Problem:** Some cards display barcode instead of actual ingredients
**Root Cause:** `ingredients_text` field contains barcode pattern
**Solution:**
- Filter out barcode patterns (8-14 digits) from ingredients_text (already implemented in result screen line 1088-1095)
- May need to improve regex pattern
- Add validation before displaying

### 7. UNKNOWN PRODUCT - MANUAL ENTRY
**Problem:** No way to manually add product information when product not found
**Solution:**
- Create new component: `ManualProductEntryModal.tsx`
- Allow user to enter:
  - Product name
  - Brand
  - Ingredients
  - Nutrition facts (optional)
  - Image (optional)
- Save to local cache
- Submit to Open Food Facts (optional)

## Implementation Priority

1. **CRITICAL:** Fix pricing system (remove Google Shopping, enforce country filtering)
2. **HIGH:** Fix scanner black screen
3. **HIGH:** Fix image caching error
4. **MEDIUM:** Improve food recall filtering
5. **MEDIUM:** Fix eco-score display
6. **LOW:** Improve ingredients barcode filtering
7. **LOW:** Add manual product entry

## Files to Modify

1. `src/services/pricingService.ts` - Remove fallbacks, enforce country filtering
2. `src/services/pricingApis/storeWebScraping.ts` - Remove Google Shopping fallback
3. `src/services/pricingApis/countryStores.ts` - Remove Google Shopping fallback
4. `src/services/pricingApis/localStorePricing.ts` - Enforce 20-mile radius
5. `app/index.tsx` - Fix camera initialization
6. `src/services/cacheService.ts` - Fix image caching for file:// URLs
7. `src/services/fdaRecallService.ts` - Improve filtering
8. `src/services/openFoodFacts.ts` - Check eco-score calculation
9. `app/result/[barcode].tsx` - Fix eco-score display, add border color
10. `src/components/EcoScore.tsx` - Add border color matching grade
11. New: `src/components/ManualProductEntryModal.tsx` - Manual entry feature

