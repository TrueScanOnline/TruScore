# Open Pillar - Comprehensive Database Analysis

**Document Version:** 1.0  
**Date:** January 2025  
**Purpose:** Complete workflow analysis from barcode scan to Open Pillar score calculation

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Complete Workflow](#complete-workflow)
3. [Architecture Logic](#architecture-logic)
4. [Databases Specific to Open Pillar](#databases-specific-to-open-pillar)
5. [Database Query Order and Logic](#database-query-order-and-logic)
6. [Scoring Metrics and Information](#scoring-metrics-and-information)
7. [Database Results Analysis](#database-results-analysis)
8. [Decision Tree Logic](#decision-tree-logic)
9. [TruScore vs Information Usage](#truscore-vs-information-usage)
10. [Issues and Problems](#issues-and-problems)
11. [Recommendations](#recommendations)
12. [Spec Compliance Analysis](#spec-compliance-analysis)

---

## Executive Summary

The Open Pillar evaluates transparency using ingredients disclosure, hidden terms detection, nutritional information, origin disclosure, and brand ownership transparency. The pillar starts at a base score of 15/25 and applies adjustments based on data from multiple databases.

**Key Findings:**
- **Base Score:** 15/25 (uniform baseline)
- **Primary Data Sources:** Open Food Facts (ingredients, origin, NOVA), Brand database (parent company), Product data (nutritional info)
- **Scoring Range:** 0-25 (minimum floor of 0)
- **Critical Dependencies:** Ingredients text availability, origin data completeness, brand ownership data

---

## Complete Workflow

### Workflow Steps (Same as Body Pillar)

The Open Pillar follows the same workflow as Body Pillar:
1. Barcode scan → 2. Product data fetching → 3. Multi-tier database queries → 4. Product name-based queries → 5. Data merging → 6. Product enhancement → 7. **Open Pillar score calculation** → 8. TruScore calculation → 9. Display

**Key Difference:** Open Pillar calculation occurs at Step 7, using merged product data.

---

## Architecture Logic

Same as Body Pillar (offline-first, parallel queries, smart selection, TruScore-first merging).

---

## Databases Specific to Open Pillar

### Primary Databases (Ingredients & Origin)

1. **Open Food Facts (OFF)**
   - **Purpose:** Ingredients text, origin data, NOVA classification
   - **API Fields:** `ingredients_text`, `origins_tags`, `manufacturing_places_tags`, `origins`, `manufacturing_places`, `nova_group`
   - **Query Method:** Barcode lookup via REST API
   - **Success Rate:** ~60-70% for food products
   - **Response Time:** 0.5-1.5s
   - **Used For:** Open Pillar scoring (ingredients disclosure, hidden terms, origin, NOVA amplification)

2. **GS1 Digital Link**
   - **Purpose:** Origin/supplier/processing data (2D Sunrise 2027)
   - **API Field:** Origin/supplier data (future-proof)
   - **Query Method:** Barcode lookup via REST API
   - **Success Rate:** ~20-30%
   - **Response Time:** 2-5s
   - **Used For:** Open Pillar scoring (origin bonus if complete via GS1)

### Nutritional Information Databases

3. **All Nutrition Databases** (USDA, Health Canada, UK FSA, EFSA, FSANZ, FoodAtlas, etc.)
   - **Purpose:** Nutritional information completeness
   - **API Fields:** `nutriments` (per 100g, serving size)
   - **Query Method:** Various (barcode or product name lookup)
   - **Success Rate:** Varies by database (20-70%)
   - **Response Time:** 2-5s
   - **Used For:** Open Pillar scoring (nutritional information completeness)

### Brand Ownership Databases

4. **Brand Database (Internal)**
   - **Purpose:** Parent company identification
   - **Data Source:** Internal database
   - **Query Method:** In-memory lookup via `getBrandData()`
   - **Success Rate:** 100% (if brand in database)
   - **Response Time:** <1ms (instant)
   - **Used For:** Open Pillar scoring (brand ownership transparency)

5. **Brand Matching Service (Internal)**
   - **Purpose:** Fuzzy brand matching for better brand resolution
   - **Data Source:** Internal fuzzy matching algorithm
   - **Query Method:** Fuzzy matching via `matchBrands()`, `getBestBrandMatch()`
   - **Success Rate:** 100% (always returns match with confidence score)
   - **Response Time:** <1ms (instant)
   - **Used For:** Brand resolution (enables parent company lookup)

6. **Open Corporates API**
   - **Purpose:** Company information (parent company data)
   - **API Field:** Company data, parent company
   - **Query Method:** Brand lookup via REST API
   - **Success Rate:** ~30-40%
   - **Response Time:** 2-3s
   - **Used For:** Brand enrichment (indirect contribution to Open Pillar)

---

## Database Query Order and Logic

Same query order as Body Pillar. Open Pillar data extracted from merged product.

**Key Data Extraction Points:**
1. **Ingredients:** From Open Food Facts (`ingredients_text`)
2. **Hidden Terms:** From ingredients text analysis (word boundary matching)
3. **Nutritional Info:** From all nutrition databases (`nutriments`)
4. **Origin:** From Open Food Facts (`origins_tags`, `manufacturing_places_tags`, `origins`, `manufacturing_places`)
5. **Brand Ownership:** From product data (`brand_owner`, `brands`) → Brand database lookup

---

## Scoring Metrics and Information

### Base Score
- **Value:** 15/25
- **Rationale:** Uniform baseline, assumes transparent until hidden detected
- **Source:** Internal logic

### Ingredients Disclosure Adjustment
- **Source:** Open Food Facts (`ingredients_text`)
- **Adjustments:**
  - Present = +2
  - None/Placeholder = -3
- **Database:** Open Food Facts

### Hidden Terms Penalty
- **Source:** Ingredients text analysis (word boundary matching)
- **Penalties:**
  - 1 hidden term = -2
  - 2 hidden terms = -6
  - ≥3 hidden terms = -11
- **NOVA Amplification:** +1 to hidden count if NOVA≥3
- **Hidden Terms:** parfum, fragrance, aroma, flavor, flavour, natural flavor, artificial flavor, proprietary, proprietary blend, secret formula, essence, spice, extract
- **Database:** Product data (from any source)

### Zero Hidden Rewards
- **Source:** Ingredients text analysis + NOVA classification
- **Bonuses:**
  - Zero hidden + NOVA 1-2 = +4
  - Zero hidden + NOVA 3-4 = +2
- **Database:** Product data (from any source)

### Nutritional Information Adjustment
- **Source:** All nutrition databases (`nutriments`)
- **Adjustments:**
  - Complete (per 100g/serve benchmarks) = +3
  - Partial (key nutrients present) = +1
  - None = -3
- **Database:** All nutrition databases (USDA, Health Canada, UK FSA, EFSA, FSANZ, FoodAtlas, etc.)

### Origin Adjustment
- **Source:** Open Food Facts (`origins_tags`, `manufacturing_places_tags`, `origins`, `manufacturing_places`), GS1 Digital Link
- **Adjustments:**
  - Complete origin = +4
  - Partial origin = 0
  - No origin/Placeholder = -4
- **Database:** Open Food Facts, GS1 Digital Link

### Brand Ownership Penalty
- **Source:** Brand Database (internal), Brand Matching Service
- **Penalty:** -3 if parent company is hidden/opaque
- **Database:** Brand Database, Brand Matching Service

### Final Score Capping
- **Minimum Floor:** 0/25
- **Maximum Ceiling:** 25/25

---

## Database Results Analysis

### Databases That Return Open Pillar Data

**High Success Rate (>50%):**
1. **Open Food Facts** - ~60-70% (ingredients, origin, NOVA)

**Medium Success Rate (30-50%):**
2. **Nutrition Databases** - Varies (20-70%) (nutritional information)
3. **Open Corporates** - ~30-40% (brand ownership)

**Low Success Rate (<30%):**
4. **GS1 Digital Link** - ~20-30% (origin data)

**Always Available (100%):**
5. **Brand Database** - 100% (if brand in database)
6. **Brand Matching Service** - 100% (always returns match)

---

## Decision Tree Logic

### Ingredients Disclosure Decision Tree

```
IF ingredients_text exists AND length > 0:
  ├─ IF is placeholder text:
  │   └─ -3
  └─ ELSE:
      └─ +2
ELSE:
  └─ -3
```

### Hidden Terms Decision Tree

```
Count hidden terms in ingredients_text (word boundary matching)
├─ IF NOVA >= 3:
│   └─ Add +1 to hidden count (NOVA amplification)
├─ IF effective hidden count >= 3:
│   └─ -11
├─ ELSE IF effective hidden count === 2:
│   └─ -6
└─ ELSE IF effective hidden count === 1:
    └─ -2
```

### Zero Hidden Rewards Decision Tree

```
IF hidden count === 0:
  ├─ IF NOVA === 1 OR NOVA === 2:
  │   └─ +4 (sophistication bonus)
  └─ ELSE:
      └─ +2 (transparency bonus)
ELSE:
  └─ No bonus
```

### Nutritional Information Decision Tree

```
IF nutriments exist:
  ├─ Check for per 100g format AND serving size AND key nutrients
  ├─ IF complete (per 100g + serve + key nutrients):
  │   └─ +3
  ├─ ELSE IF partial (key nutrients present):
  │   └─ +1
  └─ ELSE:
      └─ 0 (neutral)
ELSE:
  └─ -3
```

### Origin Decision Tree

```
Check all origin fields (origins_tags, manufacturing_places_tags, origins, manufacturing_places, text fields)
├─ IF no origin found OR placeholder:
│   └─ -4
├─ ELSE IF complete origin (tags + string OR multiple tags):
│   └─ +4
└─ ELSE:
    └─ 0 (partial origin, neutral)
```

### Brand Ownership Decision Tree

```
IF brand_owner exists AND not placeholder:
  └─ 0 (disclosed, no penalty)
ELSE:
  ├─ Use fuzzy matching to find parent company
  ├─ IF parent company found in database:
  │   └─ 0 (identified via database, no penalty)
  └─ ELSE:
      └─ -3 (hidden/opaque parent company)
```

---

## TruScore vs Information Usage

### Databases Used for Open Pillar Scoring

**Primary Scoring Data:**
1. **Open Food Facts** - Ingredients, origin, NOVA
2. **All Nutrition Databases** - Nutritional information completeness
3. **Brand Database** - Parent company identification
4. **Brand Matching Service** - Brand resolution

**Enhancement Data:**
5. **GS1 Digital Link** - Origin data (future-proof)
6. **Open Corporates** - Brand enrichment (indirect contribution)

---

## Issues and Problems

### Critical Issues

1. **Ingredients Text Availability**
   - **Problem:** Ingredients text only available from Open Food Facts (~60-70% coverage)
   - **Impact:** Products without ingredients get -3 penalty
   - **Severity:** Medium
   - **Recommendation:** Accept current coverage (ingredients data is limited)

2. **Origin Data Completeness**
   - **Problem:** Origin data only available from Open Food Facts (~60-70% coverage)
   - **Impact:** Products without origin get -4 penalty
   - **Severity:** Medium
   - **Recommendation:** Accept current coverage (origin data is limited)

### Moderate Issues

3. **Hidden Terms Detection Accuracy**
   - **Problem:** Hidden terms detection relies on keyword matching (may miss variations)
   - **Impact:** Some hidden terms may not be detected
   - **Severity:** Low
   - **Recommendation:** Improve hidden terms detection (fuzzy matching, synonyms)

4. **Brand Ownership Database Completeness**
   - **Problem:** Brand database may not cover all brands
   - **Impact:** Some products get -3 penalty even if parent company exists elsewhere
   - **Severity:** Low
   - **Recommendation:** Regularly update brand database

---

## Recommendations

### High Priority

1. **Improve Hidden Terms Detection**
   - Add fuzzy matching for hidden terms
   - Add synonyms/variations
   - Handle misspellings

### Medium Priority

2. **Regular Brand Database Updates**
   - Quarterly updates for parent company data

3. **Enhance Origin Detection**
   - Improve text field parsing
   - Add more origin patterns

---

## Spec Compliance Analysis

### Comparison with OPEN Pillar.xlsx Spec

#### ✅ Compliant Areas

1. **Base Score: 15/25** - ✅ Compliant
2. **Ingredients Disclosure** - ⚠️ Partially Compliant (current: Present=+2, None=-3; spec: Present=+5, Partial=+5-10, None=-5)
3. **Hidden Terms** - ✅ Compliant (1=-2, 2=-6, ≥3=-11; NOVA amplification)
4. **Zero Hidden Rewards** - ✅ Compliant (zero hidden + NOVA 1-2=+4, zero hidden + NOVA 3-4=+2)
5. **Nutritional Information** - ✅ Compliant (Complete=+3, Partial=+1, None=-3)
6. **Origin** - ⚠️ Partially Compliant (current: Complete=+4, None=-4; spec: Complete=+5, None=-8)
7. **Brand Ownership** - ✅ Compliant (-3 if hidden/opaque)
8. **Score Capping** - ✅ Compliant (0-25)

#### ⚠️ Discrepancies Requiring Fixes

1. **Ingredients Disclosure** - Update to Present=+5, Partial=+5-10, None=-5
2. **Origin** - Update to Complete=+5, None=-8

---

## Conclusion

The Open Pillar implementation is largely compliant with minor discrepancies in ingredients disclosure and origin adjustments. Main improvements needed:
1. Fix ingredients disclosure adjustments to match spec
2. Fix origin adjustments to match spec
3. Improve hidden terms detection accuracy

---

**Document End**

