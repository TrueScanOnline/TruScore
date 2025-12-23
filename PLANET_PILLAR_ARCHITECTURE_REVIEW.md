# PLANET Pillar - Complete Architecture Review

**Date:** January 2025  
**Purpose:** Comprehensive review of PLANET Pillar architecture to ensure reliable, consistent scoring

---

## Executive Summary

After reviewing the entire PLANET Pillar implementation, several architectural issues have been identified that prevent reliable scoring:

1. **Farming Impact Detection is Fundamentally Flawed**
   - Using regex pattern matching on `origins_tags` is unreliable
   - `origins_tags` contains country codes (e.g., "en:thailand"), not crop names
   - No reliable way to extract crop names from product data
   - Logic incorrectly flags low-impact crops as high-impact

2. **Database Query Logic Issues**
   - Thresholds are arbitrary (2000 L/kg, 5000 L/kg)
   - Category-based detection is too broad
   - No validation of data quality

3. **Test Architecture Problems**
   - Missing imports in test files
   - Tests don't reflect real-world data structure
   - No validation of actual product data flow

---

## Core Issues Identified

### Issue 1: Origins Tags Misunderstanding

**Problem:**
```typescript
// Current code tries to extract crops from origins_tags
function extractCropsFromOrigins(originsTags: string[]): string[] {
  // This is WRONG - origins_tags contains country codes, not crops!
  // Example: ["en:thailand", "en:usa"] NOT ["rice", "wheat"]
}
```

**Reality:**
- `origins_tags` in Open Food Facts contains **country codes** (e.g., "en:thailand", "en:usa")
- `origins_tags` does NOT contain crop names
- Crop information is NOT reliably available in OFF product data
- The spec mentions "origins_tags" but likely means ingredient origins, not country codes

**Impact:**
- Farming impact detection **cannot work** with current approach
- All products with origins_tags will incorrectly trigger farming impact checks
- Potatoes/tomatoes are flagged because they match regex patterns in country names

---

### Issue 2: Farming Impact Logic Flaws

**Current Logic:**
```typescript
hasHighFarmingImpact(cropName: string): boolean {
  // Checks: water > 2000 OR category='high' OR dirty dozen OR high residue
  // Problem: This is too broad - rice has category='high' but waterUsage=2500
  // Potatoes have low water but might match other criteria incorrectly
}
```

**Problems:**
1. **Threshold too low:** 2000 L/kg catches too many crops
2. **Category-based detection:** "high" category is too broad
3. **No validation:** Doesn't verify crop name actually matches product

---

### Issue 3: Data Source Reliability

**Current Data Sources:**
- EWG Dirty Dozen: ✅ Reliable (hardcoded list)
- RSPO Certified: ✅ Reliable (hardcoded list)
- FAO Crop Data: ⚠️ Limited (28 crops, many missing)
- USDA PDP: ⚠️ Limited (18 crops, many missing)
- Agribalyse: ⚠️ Limited (15 categories, very basic)

**Issues:**
- Databases are too small for real-world coverage
- No fallback when crop/product not in database
- No confidence scoring for matches

---

## Spec Alignment Analysis

### What the Spec Actually Requires

Based on `PLANET_PILLAR_COMPREHENSIVE_CRITICAL_ANALYSIS.md`:

1. **Eco-Score:** ✅ Correctly implemented
2. **Palm Oil:** ✅ Correctly implemented (RSPO = 0)
3. **Packaging:** ✅ Correctly implemented
4. **Non-Animal Farming:** ❌ **FUNDAMENTALLY BROKEN**

**Spec Requirement:**
> "High-water/carbon/land/crop treatment (pesticides/herbicides residue): -5"
> "Data Sources: FAO FAOSTAT + Idemat + EWG Dirty Dozen/USDA PDP CSVs"
> "Decision Tree: 1. Country OFF > 2. Global OFF; deduct if high FAO/Idemat/EWG/USDA CSV impact on origins_tags"

**Interpretation:**
- The spec likely means: Check ingredient origins, not country codes
- Should use ingredient-level data, not product-level origins_tags
- Need to match ingredients against farming impact databases

---

## Proposed Solution

### Solution 1: Fix Farming Impact Detection

**Option A: Use Ingredients (Recommended)**
```typescript
// Extract crops from ingredients_text, not origins_tags
function extractCropsFromIngredients(ingredientsText: string): string[] {
  // Parse ingredients_text to find crop names
  // Match against known crop database
  // Return matched crops
}
```

**Option B: Disable Until Data Available**
```typescript
// If we can't reliably detect crops, disable farming impact
// Only apply when we have high-confidence matches
if (highConfidenceCropMatch) {
  // Apply farming impact
}
```

**Option C: Use Product Categories**
```typescript
// Use categories_tags to infer crop type
// Example: "en:fruits" + "en:strawberries" = strawberry product
// More reliable than origins_tags
```

### Solution 2: Improve Database Coverage

1. **Expand FAO Database:** Add more crops with accurate water/carbon data
2. **Add Confidence Scoring:** Only apply penalties for high-confidence matches
3. **Add Fallback Logic:** If crop not found, don't penalize (unknown = neutral)

### Solution 3: Fix Test Architecture

1. **Proper Imports:** Fix missing imports
2. **Real Data Tests:** Use actual OFF product structure
3. **Integration Tests:** Test full data flow from product → score

---

## Recommended Implementation

### Phase 1: Immediate Fixes (Critical)

1. **Fix Test Imports**
   ```typescript
   import { initializeCSVDatabases } from '../../../../services/csvDatabases/csvDatabaseService';
   ```

2. **Fix Farming Impact Detection**
   - Remove origins_tags-based detection (unreliable)
   - Use ingredients_text parsing instead
   - Add confidence scoring

3. **Fix Database Queries**
   - Only apply penalties for high-confidence matches
   - Add "unknown" handling (don't penalize if not found)

### Phase 2: Architecture Improvements

1. **Ingredient-Based Detection**
   - Parse ingredients_text for crop names
   - Match against farming impact databases
   - Apply penalties only for verified matches

2. **Category-Based Fallback**
   - Use categories_tags as secondary source
   - Infer crop type from product category
   - Lower confidence, but better than nothing

3. **Data Quality Validation**
   - Verify database entries are accurate
   - Add data source citations
   - Track data freshness

---

## Decision Required

**Question:** How should we handle farming impact detection?

**Options:**
1. **Disable until reliable:** Remove farming impact until we have proper ingredient parsing
2. **Use ingredients_text:** Parse ingredients to find crops (more complex, more accurate)
3. **Use categories_tags:** Infer from product categories (simpler, less accurate)
4. **Hybrid approach:** Try ingredients first, fallback to categories

**Recommendation:** Option 4 (Hybrid) - Most reliable while maintaining functionality

---

## Next Steps

1. ✅ Fix test imports (immediate)
2. ✅ Fix farming impact detection logic (immediate)
3. ⏳ Implement ingredient-based crop detection (short-term)
4. ⏳ Expand databases (medium-term)
5. ⏳ Add confidence scoring (medium-term)

---

**Status:** Architecture review complete - ready for implementation decisions











