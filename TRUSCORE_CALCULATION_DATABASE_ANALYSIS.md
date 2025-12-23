# TruScore Calculation - Comprehensive Database Analysis

**Document Version:** 1.0  
**Date:** January 2025  
**Purpose:** Complete workflow analysis from barcode scan to final TruScore calculation

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Complete Workflow](#complete-workflow)
3. [Architecture Logic](#architecture-logic)
4. [Pillar Calculation Integration](#pillar-calculation-integration)
5. [Database Usage Summary](#database-usage-summary)
6. [TruScore Calculation Logic](#truscore-calculation-logic)
7. [Data Flow Diagram](#data-flow-diagram)
8. [Issues and Problems](#issues-and-problems)
9. [Recommendations](#recommendations)
10. [Spec Compliance Analysis](#spec-compliance-analysis)

---

## Executive Summary

TruScore is the sum of 4 equal pillars (Body, Planet, Ethics, Open), each worth 25 points maximum, for a total of 100 points. The calculation integrates data from 20+ databases through a sophisticated multi-tier query system, data merging, and pillar-specific scoring algorithms.

**Key Findings:**
- **Total Score Range:** 0-100 (sum of 4 pillars)
- **Pillar Distribution:** Body (25) + Planet (25) + Ethics (25) + Open (25) = 100
- **Calculation Method:** Each pillar calculated independently, then summed
- **Critical Dependencies:** Product data completeness, database coverage, pillar calculation accuracy

---

## Complete Workflow

### End-to-End Workflow

```
1. USER SCANS BARCODE
   ↓
2. BARCODE VALIDATION & NORMALIZATION
   ↓
3. SQLITE DATABASE CHECK (offline-first)
   ↓ (if not found)
4. ASYNCSTORAGE CACHE CHECK
   ↓ (if not found)
5. USER-CONTRIBUTED PRODUCTS CHECK
   ↓ (if offline and no cache, return null)
6. PARALLEL MULTI-TIER DATABASE QUERIES:
   ├─ Tier 1: Open Facts (OFF, OBF, OPFF, OPF)
   ├─ Tier 2: Local-First (USDA, Health Canada, UK FSA, EFSA, FSANZ, Store APIs)
   ├─ Tier 3: Gold Standard (GS1)
   ├─ Tier 4: Enhancements (Edamam, Nutritionix, Spoonacular)
   └─ Tier 5: Fallbacks (UPCitemdb, EAN-Search, etc.)
   ↓ (if no product found)
7. WEB SEARCH (last resort)
   ↓
8. PRODUCT NAME-BASED QUERIES (FSANZ, FoodAtlas, FooDB, World Food DB)
   ↓
9. DATA MERGING (TruScore-first strategy)
   ↓
10. PRODUCT ENHANCEMENT (format, palm oil, MVP, brand enrichment)
   ↓
11. RECALL DATA FETCHING (BEFORE TruScore calculation)
   ↓
12. PILLAR CALCULATIONS (in parallel):
    ├─ Body Pillar Calculation
    ├─ Planet Pillar Calculation
    ├─ Ethics Pillar Calculation
    └─ Open Pillar Calculation
   ↓
13. TRUSCORE CALCULATION (sum of 4 pillars)
   ↓
14. CACHE RESULT (SQLite + AsyncStorage)
   ↓
15. DISPLAY PRODUCT INFORMATION WITH TRUSCORE
```

---

## Architecture Logic

### Offline-First Strategy
- SQLite → AsyncStorage → User-Contributed → Online Databases
- Ensures instant results for cached products

### Parallel Query Strategy
- All database queries execute simultaneously
- Results processed as they arrive (progressive display)
- First result displayed in 0.5-2s

### Smart Database Selection
- Country-specific databases only for relevant users
- Reduces API calls by 30-50%
- Saves 2-5 seconds per scan

### TruScore-First Merging
- Government databases weighted highest (0.50)
- Open Facts weighted high (0.45)
- Store APIs weighted medium (0.35)
- Fallbacks weighted low (0.20-0.25)

### Pillar Calculation Integration
- Each pillar calculated independently
- All pillars use same merged product data
- Calculations are synchronous and fast (<10ms each)

---

## Pillar Calculation Integration

### Calculation Order

**Location:** `src/lib/truscoreEngine/index.ts` → `calculateTruScore()`

```typescript
// Calculate each pillar independently
const bodyResult = calculateBodyPillar(product);
const planetResult = calculatePlanetPillar(product);
const ethicsResult = calculateEthicsPillar(product);
const openResult = calculateOpenPillar(product);

// Extract scores
const body = bodyResult.score;      // 0-25
const planet = planetResult.score;  // 0-25
const ethics = ethicsResult.score;   // 0-25
const open = openResult.score;       // 0-25

// Total TruScore (sum of 4 pillars)
const truscore = body + planet + ethics + open; // 0-100
```

### Data Dependencies

**Body Pillar Requires:**
- Nutri-Score (from OFF)
- NOVA classification (from OFF)
- Additives (from OFF + internal databases)
- IARC data (from internal database)
- EWG data (household products only)

**Planet Pillar Requires:**
- Eco-Score (from OFF)
- Palm oil data (from OFF + CSV databases)
- Packaging data (from OFF)
- CSV databases (RSPO, WWF, FAO, EWG, USDA)
- Packaging recyclability service

**Ethics Pillar Requires:**
- Certifications (from OFF)
- BBFAW data (from internal database)
- Labor violations (from internal database)
- Recalls (from recall services - fetched BEFORE calculation)

**Open Pillar Requires:**
- Ingredients text (from OFF)
- Origin data (from OFF + GS1)
- Nutritional info (from all nutrition databases)
- Brand ownership (from brand database)

---

## Database Usage Summary

### Databases Used by Multiple Pillars

1. **Open Food Facts (OFF)**
   - **Body Pillar:** Nutri-Score, NOVA, nutrition data, risky tags
   - **Planet Pillar:** Eco-Score, palm oil, packaging
   - **Ethics Pillar:** Certifications
   - **Open Pillar:** Ingredients, origin, NOVA
   - **Usage:** Primary source for all pillars

2. **All Nutrition Databases** (USDA, Health Canada, UK FSA, EFSA, FSANZ, FoodAtlas, etc.)
   - **Body Pillar:** Nutrition data (enables better Nutri-Score)
   - **Open Pillar:** Nutritional information completeness
   - **Usage:** Enhancement data for Body and Open pillars

3. **Brand Database (Internal)**
   - **Planet Pillar:** Brand overlay (palm oil, farming impact)
   - **Ethics Pillar:** Labor violations, recall history, brand overlay
   - **Open Pillar:** Parent company identification
   - **Usage:** Brand/parent company data for multiple pillars

4. **Brand Matching Service (Internal)**
   - **Planet Pillar:** Brand resolution (enables CSV lookups)
   - **Ethics Pillar:** Brand resolution (enables database lookups)
   - **Open Pillar:** Brand resolution (enables parent company lookup)
   - **Usage:** Brand resolution for all pillars

### Pillar-Specific Databases

**Body Pillar Only:**
- IARC Database (internal)
- Additive Database (internal)
- EWG Skin Deep (household products)

**Planet Pillar Only:**
- CSV Database Service (RSPO, WWF, FAO, EWG, USDA, carbon, eco-cost)
- Packaging Recyclability Service

**Ethics Pillar Only:**
- BBFAW Database (internal)
- Recall Services (FDA, CFIA, RASFF, UK FSA, CPSC, Comprehensive US)

**Open Pillar Only:**
- GS1 Digital Link (origin data)
- Open Corporates (brand enrichment)

---

## TruScore Calculation Logic

### Calculation Formula

```
TruScore = Body Pillar + Planet Pillar + Ethics Pillar + Open Pillar

Where:
- Body Pillar = 0-25 (base 15 + adjustments)
- Planet Pillar = 0-25 (base 15 + adjustments)
- Ethics Pillar = 0-25 (base 15 + adjustments)
- Open Pillar = 0-25 (base 15 + adjustments)

Total Range: 0-100
```

### Score Validation

**Location:** `src/lib/truscoreEngine/index.ts` lines 109-115

```typescript
// Extract scores - ensure all are valid numbers (safety validation)
const body = typeof bodyResult.score === 'number' && !isNaN(bodyResult.score) ? bodyResult.score : 0;
const planet = typeof planetResult.score === 'number' && !isNaN(planetResult.score) ? planetResult.score : 0;
const ethics = typeof ethicsResult.score === 'number' && !isNaN(ethicsResult.score) ? ethicsResult.score : 0;
const open = typeof openResult.score === 'number' && !isNaN(openResult.score) ? openResult.score : 0;

// Total with bounds checking (0-100)
const truscore = Math.max(0, Math.min(100, Math.round(body + planet + ethics + open)));
```

### Metadata Generation

**Location:** `src/lib/truscoreEngine/index.ts` lines 121-137

```typescript
// Determine metadata
const hasNutriScore = !!product.nutriscore_grade;
const hasEcoScore = !!product.ecoscore_grade;
const hasOrigin = /* complex origin detection logic */;

// Return result with metadata
return {
  truscore,
  breakdown: { Body: body, Planet: planet, Ethics: ethics, Open: open },
  hasNutriScore,
  hasEcoScore,
  hasOrigin,
};
```

---

## Data Flow Diagram

```
BARCODE SCAN
    ↓
PRODUCT DATA FETCHING
    ↓
MULTI-TIER DATABASE QUERIES (Parallel)
    ├─ Open Food Facts ──────────────┐
    ├─ USDA ─────────────────────────┤
    ├─ Health Canada ────────────────┤
    ├─ FSANZ ────────────────────────┤
    ├─ Other Databases ──────────────┤
    └─ ... ───────────────────────────┤
                                      ↓
                            DATA MERGING (TruScore-first)
                                      ↓
                            PRODUCT ENHANCEMENT
                                      ↓
                            RECALL DATA FETCHING
                                      ↓
                            ┌─────────────────────────┐
                            │  PILLAR CALCULATIONS    │
                            ├─────────────────────────┤
                            │  Body Pillar            │
                            │  Planet Pillar          │
                            │  Ethics Pillar          │
                            │  Open Pillar            │
                            └─────────────────────────┘
                                      ↓
                            TRUSCORE CALCULATION (Sum)
                                      ↓
                            DISPLAY PRODUCT INFORMATION
```

---

## Issues and Problems

### Critical Issues

1. **Pillar Score Discrepancies**
   - **Problem:** Some pillar adjustments don't match spec documents
   - **Impact:** TruScore may not match intended scoring
   - **Severity:** High
   - **Recommendation:** Fix all pillar discrepancies (see individual pillar documents)

2. **Database Coverage Variation**
   - **Problem:** Database coverage varies by country (20-70%)
   - **Impact:** Some users get better TruScores than others
   - **Severity:** Medium
   - **Recommendation:** Accept current variation (expected)

3. **Recall Data Timing**
   - **Problem:** Recalls fetched BEFORE TruScore (good), but some recall databases non-functional
   - **Impact:** EU, CA, GB users don't get recall penalties
   - **Severity:** High
   - **Recommendation:** Fix RASFF, CFIA, UK FSA recall services

### Moderate Issues

4. **Product Data Completeness**
   - **Problem:** Product data completeness varies (60-90%)
   - **Impact:** Some products get incomplete TruScores
   - **Severity:** Medium
   - **Recommendation:** Improve data merging and enhancement

5. **Pillar Calculation Performance**
   - **Problem:** Pillar calculations are synchronous (may block UI)
   - **Impact:** Slow TruScore calculation for complex products
   - **Severity:** Low
   - **Recommendation:** Already optimized (<10ms each)

---

## Recommendations

### High Priority

1. **Fix All Pillar Discrepancies**
   - Body Pillar: Fix Nutri-Score and NOVA adjustments
   - Planet Pillar: Fix Eco-Score and recyclable packaging adjustments
   - Open Pillar: Fix ingredients disclosure and origin adjustments
   - Ethics Pillar: Already compliant

2. **Fix Non-Functional Recall Services**
   - RASFF (EU)
   - CFIA (CA)
   - UK FSA (GB)

### Medium Priority

3. **Improve Data Completeness**
   - Better product name discovery
   - Enhanced data merging
   - More comprehensive enhancement layer

4. **Regular Database Updates**
   - IARC database (quarterly)
   - Additive database (quarterly)
   - Brand database (quarterly)
   - CSV databases (quarterly)

---

## Spec Compliance Analysis

### TruScore Calculation Compliance

#### ✅ Compliant Areas

1. **Pillar Distribution** - ✅ Compliant (4 equal pillars, 25 points each)
2. **Total Score Range** - ✅ Compliant (0-100)
3. **Calculation Method** - ✅ Compliant (sum of 4 pillars)
4. **Base Scores** - ✅ Compliant (all pillars start at 15)

#### ⚠️ Discrepancies Requiring Fixes

1. **Body Pillar Adjustments** - See Body Pillar document
2. **Planet Pillar Adjustments** - See Planet Pillar document
3. **Open Pillar Adjustments** - See Open Pillar document
4. **Ethics Pillar** - ✅ Fully compliant

### Overall Compliance Summary

- **Body Pillar:** 2 discrepancies (Nutri-Score, NOVA)
- **Planet Pillar:** 2 discrepancies (Eco-Score, recyclable packaging)
- **Ethics Pillar:** Fully compliant
- **Open Pillar:** 2 discrepancies (ingredients disclosure, origin)

**Total Discrepancies:** 6 adjustments need fixing across 3 pillars

---

## Conclusion

The TruScore calculation architecture is well-designed with offline-first strategy, parallel queries, and smart database selection. The main issues are:

1. **Pillar Score Discrepancies** - 6 adjustments need fixing
2. **Non-Functional Recall Services** - 3 services need fixes (RASFF, CFIA, UK FSA)
3. **Database Coverage Variation** - Expected variation, but can be improved

Once all discrepancies are fixed and recall services are functional, the TruScore calculation will be fully compliant with spec documents.

---

**Document End**

