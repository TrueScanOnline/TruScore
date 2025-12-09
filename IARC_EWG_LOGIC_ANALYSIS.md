# IARC & EWG Logic Analysis

## APP Logic for Products with Both IARC and EWG Information

### Data Flow

1. **Product Fetching** (`src/services/productService.ts`)
   - Product is fetched from various sources (OFF, OBF, etc.)
   - Product data is merged and validated

2. **Enhancement Layer** (`src/services/enhancements/enhancementLayer.ts`)
   - `applyMVPEnhancements()` is called after primary data sources
   - EWG enhancement is applied via `enhanceWithEWGSkinDeep()`
   - EWG data is stored in `product.ewg_skin_deep`

3. **TruScore Calculation** (`src/lib/truscoreEngine/pillars/bodyPillar.ts`)
   - BODY Pillar checks for IARC-classified ingredients using `matchIngredientsAgainstIARC()`
   - BODY Pillar checks for IARC-classified additives (E-numbers) from `ADDITIVE_DATABASE`
   - BODY Pillar checks for EWG data for cosmetics/household products
   - Penalties are applied and capped

4. **UI Display** (`src/components/AdditivesRiskCard.tsx`)
   - Card component checks for IARC risks (ingredients + additives)
   - Card component checks for EWG data (cosmetics/household only)
   - Card only displays if `hasRisks === true`

---

## Current Issues

### Issue 1: AdditivesRiskCard Not Displaying

**Problem:** The card returns `null` if `!risks.hasRisks`, but the logic might not be detecting risks correctly.

**Root Causes:**
1. **IARC Matching:** `matchIngredientsAgainstIARC()` might not be finding matches
2. **EWG Detection:** EWG data might not be present or category detection might be failing
3. **Product Category:** The `isHousehold` check might be too strict

**Debugging Steps:**
- Check if `product.ingredients_text` exists
- Check if `product.additives_tags` exists
- Check if `product.ewg_skin_deep` exists
- Check if `isHousehold` is correctly detecting cosmetics/household products

### Issue 2: EWG Database Size

**Current Implementation:**
- EWG data is NOT from a static database
- EWG data is calculated on-the-fly based on ingredient analysis
- The `ewgSkinDeepEnhancement.ts` checks for known irritants/allergens in ingredients
- **Total EWG items in code:** ~30 irritants/allergens (hardcoded list)

**EWG Items in Database:**
- **High-hazard irritants (7-10):** 13 items
  - formaldehyde, toluene, benzene, 1,4-dioxane, ethylene oxide, coal tar, hydroquinone, lead acetate, mercury, parabens, phthalates, triclosan, resorcinol
- **Moderate-hazard irritants (4-6):** 11 items
  - sodium lauryl sulfate, sodium laureth sulfate, alcohol denat, fragrance, parfum, phenoxyethanol, peg, propylene glycol, talc, titanium dioxide (nano), zinc oxide (nano)
- **Common allergens:** 7 items
  - lanolin, lanolin alcohol, lanolin derivatives, fragrance mix, balsam of peru, formaldehyde releasers, methylisothiazolinone, methylchloroisothiazolinone

**Total:** ~31 items (not a queryable database, but a hardcoded list for ingredient matching)

---

## Fixes Needed

### Fix 1: Debug AdditivesRiskCard

1. Add console logging to see what data is available
2. Check if IARC matching is working
3. Check if EWG data is being added
4. Verify category detection

### Fix 2: Improve EWG Detection

1. Make EWG category detection more robust
2. Ensure EWG enhancement is being called
3. Add fallback detection methods

### Fix 3: Improve IARC Matching

1. Verify `findIARCInIngredients()` and `getIARCInfo()` are working
2. Check if ingredient extraction is working correctly
3. Add better logging for debugging

