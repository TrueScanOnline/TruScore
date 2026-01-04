# MVP Implementation Plan
## Based on Code Review Analysis Report Decisions

**Date**: 2025-12-29  
**Status**: Ready for Implementation  
**Reference**: CODE_REVIEW_ANALYSIS_REPORT.md

---

## Executive Summary

This document outlines the implementation plan based on the decisions made in response to the Code Review Analysis Report. All items have been reviewed and decisions documented. Implementation should proceed according to priority levels.

---

## Implementation Items

### ✅ ID 1: Database Simplification (High Priority)

**Decision**: 
1. **Remove** Non-Consumable databases (OPFF, OBF, OPF)
2. **Remove** Retailer Databases (Coles, Woolworths, Pak 'n'Save, New World, Walmart, etc.)
3. **Retain** Tier Structure

**Important Footnote**: Preserve ability to 'reconnect' those databases for post-MVP expansion to enable:
- Household scoring (OPFF, OBF, OPF)
- Pricing Modal implementation (retailer databases are critical dependency)

**Implementation Approach**:
- **Code Changes**: Comment out or conditionally disable database queries (don't delete code)
- **Configuration Flag**: Add `MVP_MODE` flag to enable/disable these databases
- **Future Reconnection**: Ensure database service methods remain intact for easy re-enabling

**Files to Modify**:
- `src/data/databases/truScoreOptimizedDatabase.ts`
  - `queryOpenFactsParallel()` - Remove OBF, OPFF, OPF queries
  - `queryLocalFirstParallel()` - Remove retailer API queries (Coles, Woolworths, etc.)
  - `queryEnhancementsParallel()` - Remove Walmart, FoodRepo if not needed

**Code Pattern**:
```typescript
// MVP MODE: Disabled for food/drink MVP scope
// Post-MVP: Re-enable for household products and pricing
const MVP_MODE = true; // Set to false post-MVP

if (!MVP_MODE) {
  // Non-consumable databases
  queries.push(fetchProductFromOBF(barcode));
  queries.push(fetchProductFromOPFF(barcode));
  queries.push(fetchProductFromOPF(barcode));
  
  // Retailer databases
  queries.push(fetchProductFromNZStores(barcode));
  queries.push(fetchProductFromAURetailers(barcode));
  queries.push(fetchProductFromWalmart(barcode));
}
```

**Estimated Impact**:
- API calls reduced: ~7-9 per scan
- Time saved: ~3-5 seconds per scan
- Hit rate reduction: <2% (minimal)

---

### ✅ ID 2: Remove Risky Tags Penalty (High Priority)

**Decision**: **Remove** 'Risky Tags' Penalty

**Rationale**: Duplicative with IARC and Safety penalties (as confirmed in analysis)

**Implementation**:
- **File**: `src/lib/truscoreEngine/pillars/bodyPillar.ts`
- **Lines to Remove**: 190-204
- **Also Remove**: `riskyTagsPenalty` from `BodyPillarResult.details` interface

**Code Change**:
```typescript
// REMOVE THIS ENTIRE SECTION:
// Risky tags
const riskyCount = analysisTags.filter((t: string) =>
  ['carcinogenic', 'endocrine', 'irritant', 'ewg-high-hazard'].some((x) =>
    t.toLowerCase().includes(x)
  )
).length;
const riskyTagsPenalty = riskyCount * 4;
if (riskyTagsPenalty > 0) {
  adjustments.push({
    description: `${riskyCount} risky tag(s) (carcinogenic, endocrine, irritant, EWG high-hazard)`,
    value: -riskyTagsPenalty,
    type: 'negative',
  });
  score -= riskyTagsPenalty;
}
```

**Impact**: Eliminates duplicate penalties, aligns with specification

---

### ✅ ID 3: Retain Universal Irritants Penalty (All 4) (No Change)

**Decision**: **Retain** Universal Irritants penalty (all 4 irritants) as per Alternative Recommendation

**Rationale**: All 4 irritants (phthalates, parabens, BPA, PFAS) are relevant for food/drink MVP scope due to packaging contamination risks

**Implementation**: **NO CODE CHANGES REQUIRED**

**Current Implementation** (lines 165-169 in `bodyPillar.ts`):
```typescript
const universalIrritants = ['phthalate', 'paraben', 'bpa', 'pfas'];
const irritantCount = universalIrritants.filter((i) => hasTerm(i)).length;
let universalIrritantPenalty = irritantCount * 5;
```

**Status**: ✅ Already correct - keep all 4 irritants

---

### ✅ ID 4: Retain Separate Caps (No Change)

**Decision**: **Retain** separate caps in code for Ingredients tags (-10) and Additives i.e. eNumbers (-15). Proven not duplicative.

**Rationale**: Separate penalty categories with separate caps (as confirmed in analysis)

**Implementation**: **NO CODE CHANGES REQUIRED**

**Current Implementation**:
- Additive Penalty Cap: -15 (lines 171-173)
- IARC Ingredient Penalty Cap: -10 (line 249)

**Status**: ✅ Already correct - separate caps maintained

---

### ✅ ID 5: Retain EWG Adjustment (No Change)

**Decision**: **Retain** EWG adjustment. Redundant for MVP but not impacting food/drink scoring and functionality.

**Rationale**: Already gated by `isHousehold` check, doesn't affect food/drink products

**Implementation**: **NO CODE CHANGES REQUIRED**

**Current Implementation** (lines 265-306 in `bodyPillar.ts`):
```typescript
const isHousehold = productCategory === 'household' || productCategory === 'cosmetics';
if (ewgData && isHousehold) {
  // EWG rating calculation
}
```

**Status**: ✅ Already correct - gated by household check

---

### ✅ ID 6: Remove Unknown Additive Scoring (High Priority)

**Decision**: **Remove** Unknown Additive scoring

**Implementation**:
- **File**: `src/lib/truscoreEngine/pillars/bodyPillar.ts`
- **Lines to Modify**: 155-158

**Code Change**:
```typescript
// OLD:
} else {
  // Unknown additive - use default penalty
  basePenalty = shouldAdjustAdditiveScoring ? 0.75 : 1.5;
}

// NEW:
} else {
  // Unknown additive - no penalty (only penalize confirmed classifications)
  basePenalty = 0;
}
```

**Impact**: Aligns with specification (only penalize confirmed risks)

---

### ⚠️ ID 7: Assess FSANZ Name Search Expansion (Assessment Required)

**Decision**: **Assess** suitability and estimated improvement in query success rate if expanding FSANZ name search functionality to other geo and nutritional database APIs:
- 'Early Product Name Discovery'
- 'Name Variations'
- 'Fuzzy Matching'

**Assessment Required**:

**Current FSANZ Success Rate**: 50-60% (with early product name discovery)

**Databases That Could Benefit**:
1. **UK FSA** (currently 25-35% success rate)
   - Currently: Barcode-only matching
   - With name search: Estimated +15-20% improvement
   - **Feasibility**: ⚠️ Unknown (need to check if UK FSA API supports name-based queries)

2. **Health Canada** (currently ~30-40% success rate)
   - Currently: Barcode-only matching
   - With name search: Estimated +10-15% improvement
   - **Feasibility**: ⚠️ Unknown (need to check if Health Canada API supports name-based queries)

3. **USDA FoodData** (currently ~40-50% success rate)
   - Currently: Barcode + name search (limited)
   - With enhanced name variations: Estimated +5-10% improvement
   - **Feasibility**: ✅ Yes (USDA API supports name search, can enhance with variations)

4. **EFSA** (currently ~25-35% success rate)
   - Currently: Barcode-only matching
   - With name search: Estimated +10-15% improvement
   - **Feasibility**: ⚠️ Unknown (need to check if EFSA API supports name-based queries)

**Implementation Strategy** (if feasible):

1. **Early Product Name Discovery** (already implemented):
   - ✅ Already works for FSANZ
   - Can be extended to other databases if they support name-based queries

2. **Name Variations** (enhancement):
   - Use `generateProductNameVariations()` from `productNameDiscovery.ts`
   - Try multiple name variations for each database query
   - **Estimated improvement**: +5-10% per database

3. **Fuzzy Matching** (enhancement):
   - Use fuzzy matching for database responses (not queries)
   - Match product names from database responses to scanned product
   - **Estimated improvement**: +3-5% per database

**Estimated Overall Improvement**:
- **UK FSA**: +15-20% (if API supports name queries)
- **Health Canada**: +10-15% (if API supports name queries)
- **USDA**: +5-10% (already supports, can enhance)
- **EFSA**: +10-15% (if API supports name queries)

**Total Estimated Improvement**: +10-15% overall query success rate (if all APIs support name-based queries)

**Next Steps**:
1. **Research API Capabilities**: Check if UK FSA, Health Canada, EFSA APIs support name-based queries
2. **Test USDA Enhancement**: Enhance USDA name search with variations
3. **Implement if Feasible**: Add name-based queries to supported databases

**Priority**: **Medium** (requires API research first)

---

### ✅ ID 8: Implement Nutri-Score Calculation (High Priority)

**Decision**: **Proceed** with implementation of NutriScore algorithm where OFF missing

**Implementation Plan**:

**Step 1: Create Nutri-Score Calculator**
- **New File**: `src/services/nutriscoreCalculator.ts`
- **Function**: `calculateNutriScoreFromNutrition(nutriments: ProductNutriments)`
- **Algorithm**: Official Nutri-Score algorithm (Santé Publique France)

**Step 2: Integration Point**
- **File**: `src/services/productEnhancementService.ts`
- **Location**: In `enhanceProduct()` or `calculateAndSetNutriScore()` function
- **Logic**: Calculate if `nutriscore_grade` is missing but nutrition data is available

**Step 3: Required Nutrients Check**
- Minimum required: Energy (kJ), Saturated fat, Sugars, Sodium
- Optional (affects accuracy): Fruits/vegetables/nuts, Fiber, Protein

**Step 4: Unit Conversion**
- Energy: kcal → kJ (if needed)
- Salt → Sodium (if needed)
- Ensure per-100g format

**Code Structure**:
```typescript
// src/services/nutriscoreCalculator.ts
export function calculateNutriScoreFromNutrition(
  nutriments: ProductNutriments
): { grade: 'a' | 'b' | 'c' | 'd' | 'e'; score: number } | null {
  // 1. Check required nutrients
  const energyKj = nutriments['energy-kj'] || (nutriments['energy-kcal'] * 4.184);
  const saturatedFat = nutriments['saturated-fat_100g'] || nutriments['saturated-fat'];
  const sugars = nutriments['sugars_100g'] || nutriments['sugars'];
  const sodium = nutriments['sodium_100g'] || nutriments['sodium'] || (nutriments['salt_100g'] / 2.54);
  
  if (!energyKj || !saturatedFat || !sugars || !sodium) {
    return null; // Insufficient data
  }
  
  // 2. Calculate negative points (N)
  let negativePoints = 0;
  // ... (implement official algorithm)
  
  // 3. Calculate positive points (P)
  let positivePoints = 0;
  // ... (implement official algorithm)
  
  // 4. Final score and grade
  const finalScore = negativePoints - positivePoints;
  // ... (map to grade A-E)
  
  return { grade, score: finalScore };
}
```

**Integration**:
```typescript
// src/services/productEnhancementService.ts
if (!product.nutriscore_grade && hasRequiredNutrients(product.nutriments)) {
  const calculated = calculateNutriScoreFromNutrition(product.nutriments);
  if (calculated) {
    product.nutriscore_grade = calculated.grade;
    product.nutriscore_score = calculated.score;
  }
}
```

**Priority**: **High** (improves Body Pillar scoring)

---

### ⚠️ ID 9: Assess Limited NOVA Approach (Assessment Required)

**Decision**: **Assess** feasibility of a limited approach to NOVA simulated scoring by limiting to NOVA Group 1 assessment and classification scoring only. i.e., does confidence level increase if only attempting to provide a NOVA score for natural or minimally processed foods? (where the NOVA score not published)

**Assessment Required**:

**NOVA Group 1 Criteria** (Unprocessed or Minimally Processed):
- Natural foods
- Cleaned, frozen, dried, pasteurized
- **No additives** (except salt, sugar, oil)
- **Simple processing** (cutting, grinding, freezing, drying)

**Confidence Assessment**:

**High Confidence Indicators** (likely NOVA 1):
1. ✅ **No additives** (`additives_tags` is empty or null)
2. ✅ **Short ingredients list** (≤5 ingredients)
3. ✅ **Natural ingredients only** (no processed ingredients like "modified starch", "hydrogenated oil")
4. ✅ **Simple processing tags** (frozen, dried, pasteurized - but not "ultra-processed")
5. ✅ **Category tags** (fruits, vegetables, fresh meat, milk - unprocessed categories)

**Medium Confidence Indicators**:
1. ⚠️ **Few additives** (1-2 additives, but might be preservatives for safety)
2. ⚠️ **Moderate ingredients list** (6-10 ingredients)
3. ⚠️ **Some processed ingredients** (but minimal)

**Low Confidence Indicators** (likely NOT NOVA 1):
1. ❌ **Many additives** (>3 additives)
2. ❌ **Long ingredients list** (>10 ingredients)
3. ❌ **Processed ingredients** (modified starches, hydrogenated oils, flavorings)

**Proposed Limited NOVA 1 Detection Algorithm**:

```typescript
function assessNOVAGroup1(product: Product): {
  likelyNOVA1: boolean;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
} {
  // High confidence: NOVA 1
  if (
    (!product.additives_tags || product.additives_tags.length === 0) &&
    product.ingredients_text &&
    product.ingredients_text.split(',').length <= 5 &&
    !hasProcessedIngredients(product.ingredients_text)
  ) {
    return {
      likelyNOVA1: true,
      confidence: 'high',
      reason: 'No additives, short ingredients list, natural ingredients only'
    };
  }
  
  // Medium confidence: Possibly NOVA 1
  if (
    product.additives_tags && product.additives_tags.length <= 2 &&
    product.ingredients_text &&
    product.ingredients_text.split(',').length <= 8 &&
    !hasHeavilyProcessedIngredients(product.ingredients_text)
  ) {
    return {
      likelyNOVA1: true,
      confidence: 'medium',
      reason: 'Few additives, moderate ingredients, minimal processing'
    };
  }
  
  // Low confidence or NOT NOVA 1
  return {
    likelyNOVA1: false,
    confidence: 'low',
    reason: 'Multiple additives or processed ingredients detected'
  };
}
```

**Confidence Level Analysis**:

**High Confidence (≥85% accuracy)**:
- ✅ No additives + ≤5 ingredients + natural ingredients only
- **Estimated coverage**: ~15-20% of products without NOVA scores
- **False positive rate**: <5%

**Medium Confidence (70-85% accuracy)**:
- ⚠️ ≤2 additives + ≤8 ingredients + minimal processing
- **Estimated coverage**: +10-15% of products
- **False positive rate**: 10-15%

**Low Confidence (<70% accuracy)**:
- ❌ >2 additives or >8 ingredients or processed ingredients
- **Should NOT assign NOVA 1** (too risky)

**Recommendation**:

**✅ PROCEED with Limited NOVA 1 Detection** (High Confidence Only):

**Implementation Strategy**:
1. **Only assign NOVA 1** if confidence is "high" (≥85% accuracy)
2. **Do NOT assign** NOVA 2, 3, or 4 (too risky)
3. **Display as**: "Likely unprocessed or minimally processed (NOVA Group 1)" with confidence indicator
4. **Use for scoring**: Only if confidence is "high"

**Code Implementation**:
```typescript
// Only assign NOVA 1 if high confidence
const novaAssessment = assessNOVAGroup1(product);
if (novaAssessment.likelyNOVA1 && novaAssessment.confidence === 'high') {
  product.nova_group = 1;
  // Add metadata for transparency
  product._nova_estimated = true;
  product._nova_confidence = 'high';
}
```

**Estimated Improvement**:
- **Coverage**: +15-20% of products without NOVA scores get NOVA 1 classification
- **Accuracy**: ≥85% (high confidence only)
- **Risk**: Low (only assigns NOVA 1, doesn't attempt NOVA 2-4)

**Priority**: **Medium** (requires careful implementation to maintain accuracy)

---

### ✅ ID 10: Remove User-Contributed Nutrition Override (High Priority)

**Decision**: **Remove** User-contributed Nutrition data override

**Important Footnote**: Retain user contribution capability for:
- a) Exporting to OFF
- b) Adding to in-house database where product not found when scanning (TruScore community verified process invoked)

**Implementation**:

**Step 1: Remove Nutrition Override**
- **File**: `src/services/productDataMerger.ts`
- **Lines to Modify**: 231-250

**Code Change**:
```typescript
// OLD:
if (userContributedProduct && userContributedProduct.nutriments) {
  mergedProduct.nutriments = { ...userContributedProduct.nutriments };
  logger.info(`  Nutrition: Using user-contributed data (from package label) - highest accuracy`);
} else {
  mergedProduct.nutriments = mergeNutriments(allNutriments, normalizedWeights);
}

// NEW:
// Exclude user-contributed nutrition data from merging (use trusted sources only)
const trustedNutriments = productsToMerge
  .filter(p => p.source !== 'user_contributed') // Exclude user-contributed
  .map(p => p.nutriments)
  .filter((n): n is ProductNutriments => n !== undefined);

if (trustedNutriments.length > 0) {
  mergedProduct.nutriments = mergeNutriments(trustedNutriments, normalizedWeights);
  logger.info(`  Nutrition: Merged from ${trustedNutriments.length} trusted sources (weighted average)`);
}
```

**Step 2: Retain User Contribution Features**
- **Export to OFF**: Keep `submitProductToOpenFoodFacts()` functionality
- **In-House Database**: Keep user contribution storage for products not found
- **Community Verification**: Implement verification process for user-contributed products

**Files to Verify** (no changes needed, just ensure they remain functional):
- `src/services/manualProductService.ts` - User contribution submission
- `src/services/userContributedProductsService.ts` - User contribution retrieval
- `src/services/openFoodFactsSubmission.ts` - OFF export

**Priority**: **High** (data quality and safety issue)

---

### ✅ ID 11: Adopt Golden Source Approach (Medium Priority)

**Decision**: **Adopt** Golden Source Approach for Nutrition Data

**Important Footnote**: Ensure retention of benchmark conversions functionality i.e. per 100g

**Implementation Plan**:

**Step 1: Implement Golden Source Logic**
- **File**: `src/services/productDataMerger.ts`
- **Function**: Modify `mergeNutriments()` or create new `mergeNutrimentsGoldenSource()`

**Priority Order**:
1. **Tier 1**: Open Food Facts (if available) - Golden Source
2. **Tier 2**: Government Databases (FSANZ, USDA, Health Canada, UK FSA, EFSA) - Supplements
3. **Tier 3**: Commercial Nutrition APIs (Spoonacular, Nutritionix, Edamam) - Supplements
4. **Tier 4**: Other sources - Supplements

**Code Implementation**:
```typescript
function mergeNutrimentsGoldenSource(products: Product[]): ProductNutriments {
  // Step 1: Find OFF product (golden source)
  const offProduct = products.find(p => p.source === 'openfoodfacts' && p.nutriments);
  
  if (offProduct && offProduct.nutriments) {
    // Start with OFF nutrition data
    let mergedNutriments = { ...offProduct.nutriments };
    
    // Step 2: Supplement missing fields from government databases
    const governmentProducts = products.filter(p => 
      ['fsanz_au', 'fsanz_nz', 'usda_fooddata', 'health_canada_cnf', 'uk_fsa', 'efsa'].includes(p.source || '')
    );
    
    for (const govProduct of governmentProducts) {
      if (govProduct.nutriments) {
        for (const [key, value] of Object.entries(govProduct.nutriments)) {
          if (!mergedNutriments[key] && value !== undefined) {
            mergedNutriments[key] = value; // Supplement missing field
          }
        }
      }
    }
    
    // Step 3: Supplement missing fields from commercial APIs (if still missing)
    const commercialApiProducts = products.filter(p => 
      ['spoonacular', 'nutritionix', 'edamam'].includes(p.source || '')
    );
    
    for (const apiProduct of commercialApiProducts) {
      if (apiProduct.nutriments) {
        for (const [key, value] of Object.entries(apiProduct.nutriments)) {
          if (!mergedNutriments[key] && value !== undefined) {
            mergedNutriments[key] = value; // Supplement missing field
          }
        }
      }
    }
    
    // Step 4: Normalize to per-100g (CRITICAL: retain benchmark conversions)
    mergedNutriments = normalizeNutritionToPer100g(mergedNutriments);
    
    return mergedNutriments;
  }
  
  // Fallback: If OFF not available, use Base Product Selection logic
  const baseProduct = selectBaseProduct(products);
  if (baseProduct && baseProduct.nutriments) {
    let mergedNutriments = { ...baseProduct.nutriments };
    
    // Supplement from other sources
    // ... (same supplement logic as above)
    
    // Normalize to per-100g
    mergedNutriments = normalizeNutritionToPer100g(mergedNutriments);
    
    return mergedNutriments;
  }
  
  return {};
}
```

**Step 2: Ensure Per-100g Conversions Retained**
- **File**: `src/services/productDataMerger.ts`
- **Function**: `normalizeNutritionToPer100g()` (already exists, ensure it's called)
- **Verification**: Ensure all nutrition data is normalized to per-100g format

**Priority**: **Medium** (improves data quality, simplifies logic)

---

### ✅ ID 12: Implement Product Name Discovery Enhancements (Medium Priority)

**Decision**: **Implement** Product Name Discovery enhancements

**Implementation Plan**:

**Current Implementation**: `src/services/productNameDiscovery.ts`
- ✅ SQLite lookup
- ✅ Cache lookup
- ✅ Quick API calls (UPCitemdb, Barcode Spider, EAN-Search)

**Enhancements to Add**:

1. **Add GS1 to Quick APIs** (if API key available):
   ```typescript
   // In discoverProductNameEarly(), add GS1 strategy
   if (process.env.EXPO_PUBLIC_GS1_API_KEY) {
     quickApiPromises.push(
       Promise.race([
         fetchProductFromGS1(barcode).then(p => p?.product_name || null),
         new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000)),
       ]).catch(() => null)
     );
   }
   ```

2. **Add Barcode Lookup API** (free tier):
   ```typescript
   quickApiPromises.push(
     Promise.race([
       fetchProductFromBarcodeLookup(barcode).then(p => p?.product_name || null),
       new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000)),
     ]).catch(() => null)
   );
   ```

3. **Improve Name Extraction**:
   - Better pattern matching for product names
   - Handle brand prefixes better
   - Handle size/weight suffixes better

**Expected Improvement**: 
- Current: ~60-70% success rate
- Target: ~75-80% success rate (+10-15% improvement)

**Priority**: **Medium**

---

### ✅ ID 13: Defer Server-Side Database Updates (Deferred)

**Decision**: **Defer** implementation of Option 1 (Server Side Updates) post MVP launch

**Status**: **DEFERRED** - No implementation required for MVP

**Post-MVP Implementation**:
- IARC database updates (quarterly)
- Additive database updates (quarterly)
- Server-side update infrastructure

---

### ✅ ID 14: Defer WiseCode Integration (Deferred)

**Decision**: **Defer** potential integration of WiseCode nutritional scoring

**Status**: **DEFERRED** - No implementation required for MVP

**Post-MVP Research**:
- Evaluate WiseCode algorithm availability
- Compare accuracy with Nutri-Score
- Assess user value and recognition

---

## Implementation Priority Summary

### High Priority (Implement Before MVP)
1. ✅ ID 1: Remove Non-Consumable & Retailer Databases (with reconnection capability)
2. ✅ ID 2: Remove Risky Tags Penalty
3. ✅ ID 6: Remove Unknown Additive Scoring
4. ✅ ID 8: Implement Nutri-Score Calculation
5. ✅ ID 10: Remove User-Contributed Nutrition Override

### Medium Priority (Implement for MVP if Time Permits)
6. ⚠️ ID 7: Assess FSANZ Name Search Expansion (requires API research)
7. ⚠️ ID 9: Assess Limited NOVA Approach (requires careful implementation)
8. ✅ ID 11: Adopt Golden Source Approach
9. ✅ ID 12: Implement Product Name Discovery Enhancements

### No Change Required
- ✅ ID 3: Universal Irritants (already correct)
- ✅ ID 4: Separate Caps (already correct)
- ✅ ID 5: EWG Adjustment (already correct)

### Deferred (Post-MVP)
- ✅ ID 13: Server-Side Database Updates
- ✅ ID 14: WiseCode Integration

---

## Implementation Checklist

### Phase 1: High Priority Items (Week 1)
- [ ] ID 1: Remove databases (with MVP_MODE flag)
- [ ] ID 2: Remove risky tags penalty
- [ ] ID 6: Remove unknown additive scoring
- [ ] ID 10: Remove user-contributed nutrition override

### Phase 2: Algorithm Implementation (Week 2)
- [ ] ID 8: Implement Nutri-Score calculator
- [ ] ID 8: Integrate Nutri-Score calculation into enhancement service

### Phase 3: Medium Priority (Week 3)
- [ ] ID 7: Research API capabilities for name-based queries
- [ ] ID 9: Implement limited NOVA 1 detection (high confidence only)
- [ ] ID 11: Implement Golden Source approach
- [ ] ID 12: Enhance product name discovery

### Phase 4: Testing & Validation
- [ ] Test all changes with sample products
- [ ] Verify nutrition data merging (Golden Source)
- [ ] Verify Nutri-Score calculation accuracy
- [ ] Verify NOVA 1 detection accuracy (if implemented)

---

## Questions for Clarification

### ID 7: FSANZ Name Search Expansion - SIMPLIFIED QUESTION

**What I'm asking**: 
Right now, FSANZ (the Australian/New Zealand food database) can find products by searching with the product name (like "G Syrup") instead of just the barcode. This helps find more products.

**The Question**: 
Do you want me to check if other government databases (UK FSA, Health Canada, EFSA) can also search by product name? If they can, we could find more products from those databases too.

**Your Options**:
- **Option A**: Yes, research it now - Check if UK FSA, Health Canada, and EFSA support name-based searches, and if they do, add that feature before MVP launch.
- **Option B**: No, wait until after MVP - Skip this research for now and focus on other MVP tasks.

**What I need from you**: Choose Option A or Option B.

---

### ID 9: Limited NOVA Approach - SIMPLIFIED QUESTION

**What I'm asking**: 
NOVA scores tell us how processed a food is (Group 1 = unprocessed, Group 4 = ultra-processed). Sometimes products don't have a NOVA score from Open Food Facts.

**The Question**: 
Do you want me to add a feature that tries to guess if a product is "NOVA Group 1" (unprocessed/minimally processed) when the NOVA score is missing? This would only work for products that are clearly unprocessed (like fresh fruits, vegetables, plain milk) - I would NOT try to guess NOVA 2, 3, or 4 because that's too risky.

**Your Options**:
- **Option A**: Yes, implement it now - Add the feature to detect NOVA Group 1 for clearly unprocessed foods (only when we're very confident, ≥85% accuracy).
- **Option B**: No, wait until after MVP - Skip this feature for now and focus on other MVP tasks.

**What I need from you**: Choose Option A or Option B.

---

### ID 1: Database Removal - SIMPLIFIED QUESTION

**What I'm asking**: 
You want me to remove certain databases (like Open Beauty Facts, Open Pet Food Facts, retailer databases) for the MVP, but keep the code so we can easily turn them back on later.

**The Question**: 
How do you want me to implement the "on/off switch" for these databases?

**Your Options**:
- **Option A**: Simple code constant - Add a line like `const MVP_MODE = true;` at the top of the file. When you want to turn databases back on, change it to `false`. This is the simplest approach.
- **Option B**: Environment variable - Use `process.env.MVP_MODE` so you can turn databases on/off without changing code. This requires setting up environment variables.
- **Option C**: Feature flag system - Build a more complex system that lets you turn features on/off from a settings file or API. This is more flexible but takes longer to build.

**What I need from you**: Choose Option A, Option B, or Option C.

**My Recommendation**: Option A (simple code constant) - It's the fastest to implement and easiest to understand. You can always upgrade to Option B or C later if needed.

---

## Next Steps

1. **Confirm Clarifications**: Answer questions above
2. **Begin Implementation**: Start with High Priority items (Phase 1)
3. **Progress Updates**: Provide updates as each item is completed
4. **Testing**: Comprehensive testing after each phase

---

## Notes

- All code changes should maintain backward compatibility where possible
- Database removal should use flags/configuration (not hard deletion) for easy re-enabling
- User contribution features (export to OFF, in-house database) must remain functional
- Per-100g normalization must be retained in all nutrition merging logic

