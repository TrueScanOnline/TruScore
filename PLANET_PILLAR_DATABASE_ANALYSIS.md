# Planet Pillar - Comprehensive Database Analysis

**Document Version:** 1.0  
**Date:** January 2025  
**Purpose:** Complete workflow analysis from barcode scan to Planet Pillar score calculation

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Complete Workflow](#complete-workflow)
3. [Architecture Logic](#architecture-logic)
4. [Databases Specific to Planet Pillar](#databases-specific-to-planet-pillar)
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

The Planet Pillar evaluates environmental impact using Eco-Score, palm oil/deforestation data, packaging recyclability, and farming impact. The pillar starts at a base score of 15/25 and applies adjustments based on data from multiple databases.

**Key Findings:**
- **Base Score:** 15/25 (uniform baseline)
- **Primary Data Sources:** Open Food Facts (Eco-Score, palm oil, packaging), CSV databases (RSPO, WWF, FAO, EWG, USDA), packaging recyclability service
- **Scoring Range:** 0-25 (minimum floor of 0)
- **Critical Dependencies:** Eco-Score availability, palm oil detection, packaging data completeness

---

## Complete Workflow

### Workflow Steps (Same as Body Pillar)

The Planet Pillar follows the same workflow as Body Pillar:
1. Barcode scan → 2. Product data fetching → 3. Multi-tier database queries → 4. Product name-based queries → 5. Data merging → 6. Product enhancement → 7. **Planet Pillar score calculation** → 8. TruScore calculation → 9. Display

**Key Difference:** Planet Pillar calculation occurs at Step 7, using merged product data.

---

## Architecture Logic

Same as Body Pillar (offline-first, parallel queries, smart selection, TruScore-first merging).

---

## Databases Specific to Planet Pillar

### Primary Databases (Eco-Score & Palm Oil)

1. **Open Food Facts (OFF)**
   - **Purpose:** Eco-Score grade, palm oil detection, packaging data
   - **API Fields:** `ecoscore_grade`, `ecoscore_score`, `ecoscore_data`, `palm_oil_analysis`, `packagings`, `packaging_tags`
   - **Query Method:** Barcode lookup via REST API
   - **Success Rate:** ~60-70% for food products
   - **Response Time:** 0.5-1.5s
   - **Used For:** Planet Pillar scoring (Eco-Score, palm oil, packaging)

2. **CSV Database Service (Internal)**
   - **Purpose:** RSPO certification, WWF commitment, FAO crop data, EWG Dirty Dozen, USDA PDP, high carbon footprint, high eco-cost materials
   - **Data Sources:** Multiple CSV files (RSPO, WWF, FAO, EWG, USDA, carbon factors)
   - **Query Method:** In-memory lookup via `getCSVDatabaseService()`
   - **Success Rate:** 100% (if data in CSV files)
   - **Response Time:** <1ms (instant)
   - **Used For:** Planet Pillar scoring (palm oil certification, brand overlay, farming impact, carbon fallback, packaging eco-cost)

### Packaging Databases

3. **Packaging Recyclability Service (Internal)**
   - **Purpose:** Local recyclability status based on user location
   - **Data Source:** ECR Guides, ReCoRe, Recycling Partnership CSVs
   - **Query Method:** In-memory lookup via `getLocalRecyclabilityStatus()`
   - **Success Rate:** 100% (if packaging material in database)
   - **Response Time:** <1ms (instant)
   - **Used For:** Planet Pillar scoring (recyclable packaging bonus)

### Enhancement Databases (Limited Planet Pillar Data)

4. **GS1 Digital Link**
   - **Purpose:** Brand/company information (may include sustainability data)
   - **API Field:** `brands`, `brand_owner`
   - **Query Method:** Barcode lookup via REST API
   - **Success Rate:** ~20-30%
   - **Response Time:** 2-5s
   - **Used For:** Brand identification (enables CSV database lookups)

---

## Database Query Order and Logic

Same query order as Body Pillar. Planet Pillar data extracted from merged product.

**Key Data Extraction Points:**
1. **Eco-Score:** From Open Food Facts (`ecoscore_grade`)
2. **Palm Oil:** From Open Food Facts (`palm_oil_analysis`, `ingredients_analysis_tags`)
3. **Packaging:** From Open Food Facts (`packagings`, `packaging_tags`)
4. **Brand/Parent:** From product data (`brand_owner`, `brands`) → CSV database lookups
5. **Crops:** From ingredients text → CSV database lookups (FAO, EWG, USDA)

---

## Scoring Metrics and Information

### Base Score
- **Value:** 15/25
- **Rationale:** Uniform baseline, assumes eco until bad detected
- **Source:** Internal logic

### Eco-Score Adjustment
- **Source:** Open Food Facts (primary)
- **Mapping:**
  - A = +7 (total 22)
  - B = +3 (total 18)
  - C = 0 (total 15)
  - D = -3 (total 12)
  - E = -7 (total 8)
- **Fallback:** If Eco-Score missing, CSV carbon fallback (-5 if high carbon)
- **Database:** Open Food Facts (`ecoscore_grade`), CSV Database Service (`hasHighCarbonFootprint()`)

### Palm Oil Penalty
- **Source:** Open Food Facts (`palm_oil_analysis`), CSV Database Service (RSPO certification)
- **Penalties:**
  - Non-certified palm oil = -8
  - Certified sustainable (not RSPO) = -5
  - RSPO certified = 0 (neutral)
- **Brand Overlay:** -4 if brand/parent has low WWF/RSPO commitment (even on clean products)
- **Database:** Open Food Facts, CSV Database Service (`isRSPOCertified()`, `queryRSPOCertified()`)

### Recyclable Packaging Bonus
- **Source:** Packaging Recyclability Service (local laws)
- **Bonuses:**
  - All packaging recyclable = +3
  - Some packaging recyclable = +1
- **Database:** Packaging Recyclability Service (`getLocalRecyclabilityStatus()`)

### Packaging Eco-Cost Penalty
- **Source:** CSV Database Service (Idemat eco-cost data)
- **Penalty:** -5 for high eco-cost materials
- **Database:** CSV Database Service (`isHighEcoCostMaterial()`)

### Non-Animal Farming Impact
- **Source:** CSV Database Service (FAO, EWG, USDA)
- **Adjustments:**
  - High-impact farming = -5
  - Low-impact farming = +3
  - Brand/parent high-impact overlay = -3
- **Crop Detection:** From ingredients text (not origins_tags)
- **Database:** CSV Database Service (`queryFAOCropData()`, `queryEWGDirtyDozen()`, `queryUSDAPDP()`, `hasHighFarmingImpact()`)

### Final Score Capping
- **Minimum Floor:** 0/25
- **Maximum Ceiling:** 25/25

---

## Database Results Analysis

### Databases That Return Planet Pillar Data

**High Success Rate (>50%):**
1. **Open Food Facts** - ~60-70% (Eco-Score, palm oil, packaging)

**Always Available (100%):**
2. **CSV Database Service** - 100% (if data in CSV files)
3. **Packaging Recyclability Service** - 100% (if packaging material in database)

**Low Success Rate (<30%):**
4. **GS1 Digital Link** - ~20-30% (brand info, enables CSV lookups)

### Databases That Do NOT Return Planet Pillar Data

Most databases don't directly contribute to Planet Pillar scoring, but may provide:
- Product name (enables crop detection from ingredients)
- Brand information (enables CSV database lookups)

---

## Decision Tree Logic

### Eco-Score Decision Tree

```
IF ecoscore_grade exists:
  ├─ A → +7 (total 22)
  ├─ B → +3 (total 18)
  ├─ C → 0 (total 15)
  ├─ D → -3 (total 12)
  └─ E → -7 (total 8)
ELSE IF CSV carbon fallback available:
  ├─ High carbon → -5
  └─ Low/unknown carbon → 0 (baseline 15)
ELSE:
  └─ Baseline 15 (no penalty, no bonus)
```

### Palm Oil Decision Tree

```
IF palm_oil_analysis.exists AND containsPalmOil AND !isPalmOilFree:
  ├─ IF isRSPOCertified (CSV lookup):
  │   └─ 0 (neutral, no penalty)
  ├─ ELSE IF isCertifiedSustainable:
  │   └─ -5
  └─ ELSE:
      └─ -8
ELSE IF brand/parent has low WWF/RSPO commitment (CSV lookup):
  └─ -4 (brand overlay, even on clean products)
ELSE:
  └─ No penalty
```

### Recyclable Packaging Decision Tree

```
IF packagings.length > 0:
  ├─ Check local recyclability (user location)
  ├─ IF all recyclable:
  │   └─ +3
  ├─ ELSE IF some recyclable:
  │   └─ +1
  └─ ELSE:
      └─ 0 (no bonus)
ELSE:
  └─ 0 (no packaging data)
```

### Farming Impact Decision Tree

```
IF ingredients_text exists:
  ├─ Extract crops from ingredients_text
  ├─ FOR EACH crop:
  │   ├─ Verify crop in CSV databases (FAO, EWG, USDA)
  │   └─ IF verified:
  │       ├─ Check farming impact (high/low)
  │       └─ Apply adjustment
  ├─ IF high-impact detected:
  │   ├─ -5 (product-level)
  │   └─ -3 (brand/parent overlay)
  └─ ELSE IF all verified crops are low-impact:
      └─ +3
ELSE:
  └─ No farming impact adjustment
```

---

## TruScore vs Information Usage

### Databases Used for Planet Pillar Scoring

**Primary Scoring Data:**
1. **Open Food Facts** - Eco-Score, palm oil, packaging
2. **CSV Database Service** - RSPO, WWF, FAO, EWG, USDA, carbon, eco-cost
3. **Packaging Recyclability Service** - Local recyclability

**Enhancement Data:**
4. **GS1 Digital Link** - Brand identification (enables CSV lookups)

### Databases Used for Information Display Only

Most databases provide product information but don't directly contribute to Planet Pillar scoring.

---

## Issues and Problems

### Critical Issues

1. **Eco-Score Availability**
   - **Problem:** Eco-Score only available from Open Food Facts (~60-70% coverage)
   - **Impact:** Products without Eco-Score use baseline 15 or CSV carbon fallback
   - **Severity:** High
   - **Recommendation:** Implement Eco-Score calculation from LCA data if missing

2. **Palm Oil Detection Accuracy**
   - **Problem:** Palm oil detection relies on Open Food Facts tags (may miss some products)
   - **Impact:** Some palm oil products may not be penalized
   - **Severity:** Medium
   - **Recommendation:** Enhance palm oil detection (ingredients text analysis)

3. **Crop Detection from Ingredients**
   - **Problem:** Crop detection relies on keyword matching in ingredients text
   - **Impact:** May miss crops with different names or misspelled ingredients
   - **Severity:** Low
   - **Recommendation:** Improve crop detection (fuzzy matching, synonyms)

### Moderate Issues

4. **CSV Database Completeness**
   - **Problem:** CSV databases may not cover all brands/crops
   - **Impact:** Some products don't get brand overlay or farming impact adjustments
   - **Severity:** Low
   - **Recommendation:** Regularly update CSV databases

5. **Packaging Data Availability**
   - **Problem:** Packaging data only available from Open Food Facts (~60-70% coverage)
   - **Impact:** Products without packaging data get no recyclability bonus
   - **Severity:** Low
   - **Recommendation:** Accept current coverage (packaging data is limited)

---

## Recommendations

### High Priority

1. **Implement Eco-Score Calculation**
   - Calculate from Agribalyse LCA data if missing
   - Use carbon factors, water footprint, land use

2. **Enhance Palm Oil Detection**
   - Improve ingredients text analysis
   - Add palm oil synonyms/variations

### Medium Priority

3. **Improve Crop Detection**
   - Add fuzzy matching
   - Add crop synonyms
   - Handle misspellings

4. **Regular CSV Database Updates**
   - Quarterly updates for RSPO, WWF, FAO, EWG, USDA

---

## Spec Compliance Analysis

### Comparison with PLANET Pillar.xlsx Spec

#### ✅ Compliant Areas

1. **Base Score: 15/25** - ✅ Compliant
2. **Eco-Score Mapping** - ⚠️ Partially Compliant (current: A=+7, B=+3, C=0, D=-3, E=-7; spec: A=+10, B=+5, C=0, D=-5, E=-10)
3. **Palm Oil Penalties** - ✅ Compliant (non-certified=-8, RSPO=0, brand overlay=-4)
4. **Recyclable Packaging** - ⚠️ Partially Compliant (current: all=+3, some=+1; spec: all=+5, some=+2)
5. **Packaging Eco-Cost** - ✅ Compliant (-5)
6. **Farming Impact** - ✅ Compliant (high=-5, low=+3, brand overlay=-3)
7. **Score Capping** - ✅ Compliant (0-25)

#### ⚠️ Discrepancies Requiring Fixes

1. **Eco-Score Adjustments** - Update to A=+10, B=+5, C=0, D=-5, E=-10
2. **Recyclable Packaging** - Update to all=+5, some=+2

---

## Conclusion

The Planet Pillar implementation is largely compliant with minor discrepancies in Eco-Score and recyclable packaging adjustments. Main improvements needed:
1. Fix Eco-Score adjustments to match spec
2. Fix recyclable packaging bonuses to match spec
3. Implement Eco-Score calculation from LCA data
4. Enhance palm oil detection accuracy

---

**Document End**

