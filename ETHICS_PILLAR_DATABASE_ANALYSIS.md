# Ethics Pillar - Comprehensive Database Analysis

**Document Version:** 1.0  
**Date:** January 2025  
**Purpose:** Complete workflow analysis from barcode scan to Ethics Pillar score calculation

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Complete Workflow](#complete-workflow)
3. [Architecture Logic](#architecture-logic)
4. [Databases Specific to Ethics Pillar](#databases-specific-to-ethics-pillar)
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

The Ethics Pillar evaluates ethical standards using certifications, animal cruelty (BBFAW), labor violations, and recalls. The pillar starts at a base score of 15/25 and applies adjustments based on data from multiple databases.

**Key Findings:**
- **Base Score:** 15/25 (uniform baseline)
- **Primary Data Sources:** Open Food Facts (certifications), BBFAW database (animal cruelty), Brand database (labor violations, recalls), Recall services (FDA, CFIA, RASFF, UK FSA, CPSC)
- **Scoring Range:** 0-25 (minimum floor of 0)
- **Critical Dependencies:** Certification detection, BBFAW coverage, recall data availability

---

## Complete Workflow

### Workflow Steps (Same as Body Pillar)

The Ethics Pillar follows the same workflow as Body Pillar, with one critical addition:

**Step 6.5: Recall Data Fetching (BEFORE TruScore Calculation)**
- **Location:** `src/services/productService.ts` lines 793-895
- **Purpose:** Fetch recalls BEFORE TruScore calculation so Ethics Pillar can use them
- **Databases:** FDA, Comprehensive US Recalls, RASFF, CFIA, CPSC, UK FSA
- **Timing:** Fast timeout (2 seconds) to avoid blocking product display

**Key Difference:** Ethics Pillar requires recall data fetched BEFORE scoring.

---

## Architecture Logic

Same as Body Pillar, with recall fetching integrated before scoring.

---

## Databases Specific to Ethics Pillar

### Primary Databases (Certifications)

1. **Open Food Facts (OFF)**
   - **Purpose:** Certification labels (Fairtrade, Organic, MSC/ASC, RSPCA, etc.)
   - **API Field:** `labels_tags` (array of certification tags)
   - **Query Method:** Barcode lookup via REST API
   - **Success Rate:** ~60-70% for food products
   - **Response Time:** 0.5-1.5s
   - **Used For:** Ethics Pillar scoring (certification bonuses)

### Animal Cruelty Databases

2. **BBFAW Database (Internal)**
   - **Purpose:** BBFAW tier-based animal cruelty assessment (top 150 food companies)
   - **Data Source:** Internal database (BBFAW tier data)
   - **Query Method:** In-memory lookup via `checkBBFAWTier()`
   - **Success Rate:** 100% (if brand in database, ~150 companies)
   - **Response Time:** <1ms (instant)
   - **Used For:** Ethics Pillar scoring (animal cruelty adjustment: Tier 1=+4, Tier 2=+2, Tier 6=-7, E/F=-7)
   - **Note:** SPEC COMPLIANCE - BBFAW ONLY, no fallback violation system

### Labor Violation Databases

3. **Brand Database (Internal)**
   - **Purpose:** Labor violation data (DOL, Walk Free, Oxfam, ILO)
   - **Data Source:** Internal database (labor violation records)
   - **Query Method:** In-memory lookup via `checkLaborViolations()`
   - **Success Rate:** 100% (if brand in database)
   - **Response Time:** <1ms (instant)
   - **Used For:** Ethics Pillar scoring (labor violation penalties: Limited=-4, Moderate=-8, Major=-15)

4. **Open Corporates API**
   - **Purpose:** Company information (may include labor violation data)
   - **API Field:** Company data
   - **Query Method:** Brand lookup via REST API
   - **Success Rate:** ~30-40%
   - **Response Time:** 2-3s
   - **Used For:** Brand enrichment (indirect contribution to Ethics Pillar)

### Recall Databases

5. **FDA Recalls**
   - **Purpose:** US food recalls
   - **API:** `https://api.fda.gov/food/enforcement.json`
   - **Query Method:** Product name/brand/barcode lookup via REST API
   - **Success Rate:** ~95% (reliable API)
   - **Response Time:** ~1.8s
   - **Used For:** Ethics Pillar scoring (recall penalties: Class I=-15, Class II=-8, Class III=-4)

6. **Comprehensive US Recalls (recalls.gov)**
   - **Purpose:** Comprehensive US recalls (multiple agencies)
   - **API:** `https://www.recalls.gov/api/recalls`
   - **Query Method:** Product name/brand/barcode lookup via REST API
   - **Success Rate:** ~80-90%
   - **Response Time:** ~2-3s
   - **Used For:** Ethics Pillar scoring (recall penalties)

7. **RASFF Alerts**
   - **Purpose:** EU food safety alerts
   - **API:** Web scraping (HTML parsing)
   - **Query Method:** Product name/brand/barcode lookup
   - **Success Rate:** ⚠️ Currently 0% (HTML parsing issues)
   - **Response Time:** ~15s
   - **Used For:** Ethics Pillar scoring (recall penalties) - **NON-FUNCTIONAL**

8. **CFIA Recalls**
   - **Purpose:** Canadian food recalls
   - **API:** Web scraping (HTML parsing)
   - **Query Method:** Product name/brand/barcode lookup
   - **Success Rate:** ⚠️ Currently 0% (HTML parsing issues)
   - **Response Time:** ~20s
   - **Used For:** Ethics Pillar scoring (recall penalties) - **NON-FUNCTIONAL**

9. **CPSC Recalls**
   - **Purpose:** US consumer product recalls (may include food-related items)
   - **API:** `https://www.saferproducts.gov/RestWebServices/Recall`
   - **Query Method:** Product name/brand/barcode lookup via REST API
   - **Success Rate:** ~0% for food products (CPSC is for consumer products, not food)
   - **Response Time:** ~0.1s
   - **Used For:** Ethics Pillar scoring (recall penalties) - **EXPECTED BEHAVIOR** (no food recalls)

10. **UK FSA Recalls**
    - **Purpose:** UK food recalls
    - **API:** ⚠️ Currently disabled (endpoint returns 404)
    - **Query Method:** N/A (disabled)
    - **Success Rate:** 0% (API not available)
    - **Response Time:** N/A
    - **Used For:** Ethics Pillar scoring (recall penalties) - **NON-FUNCTIONAL**

### Brand Overlay Databases

11. **Brand Database (Internal)**
    - **Purpose:** Brand/parent company recall history and violations
    - **Data Source:** Internal database
    - **Query Method:** In-memory lookup via `hasRecallHistory()`, `hasHighImpactLaborViolations()`
    - **Success Rate:** 100% (if brand in database)
    - **Response Time:** <1ms (instant)
    - **Used For:** Ethics Pillar scoring (brand overlay penalties: Limited=-4, Moderate=-8, Major=-15)

12. **Brand Matching Service (Internal)**
    - **Purpose:** Fuzzy brand matching for better brand resolution
    - **Data Source:** Internal fuzzy matching algorithm
    - **Query Method:** Fuzzy matching via `matchBrands()`, `getBestBrandMatch()`
    - **Success Rate:** 100% (always returns match with confidence score)
    - **Response Time:** <1ms (instant)
    - **Used For:** Brand resolution (enables database lookups)

---

## Database Query Order and Logic

### Recall Fetching (Before TruScore Calculation)

**Location:** `src/services/productService.ts` lines 793-895

**Query Order:**
1. **FDA Recalls** (always queried, fast and reliable)
2. **Comprehensive US Recalls** (US users only)
3. **CPSC Recalls** (US users only, consumer products)
4. **RASFF Alerts** (EU users only) - **NON-FUNCTIONAL**
5. **UK FSA Recalls** (GB users only) - **NON-FUNCTIONAL**
6. **CFIA Recalls** (CA users only) - **NON-FUNCTIONAL**

**Timing:** Fast timeout (2 seconds) to avoid blocking product display

**Code Reference:**
```793:895:src/services/productService.ts
// CRITICAL FIX: Fetch recalls BEFORE TruScore calculation
// This ensures Ethics Pillar can use recall data for scoring
```

### Certification Detection

**Source:** Open Food Facts (`labels_tags` array)
**Detection:** Label matching (case-insensitive, partial matching)

**Certifications Detected:**
- Fairtrade (`fair-trade`)
- Organic (`organic`, `usda-organic`, `eu-organic`, `bio`, `ecocert`)
- Rainforest Alliance (`rainforest-alliance`)
- UTZ (`utz`)
- MSC/ASC (`en:msc`, `en:asc`)
- Ocean Wise (`ocean-wise`, `oceanwise`)
- RSPCA (`rspca`)
- Leaping Bunny (`leaping-bunny`, `cruelty-free`)
- B-Corp (`b-corp`, `bcorp`)
- Free-Roaming (`free-roaming`, `freeroaming`)
- Friend of the Sea (`friend-of-the-sea`, `friendofthesea`)
- GlobalG.A.P (`globalgap`, `global-gap`)
- Free-Range (`free-range`)
- Cage-Free (`cage-free`)

### BBFAW Lookup

**Source:** BBFAW Database (internal)
**Method:** Brand name lookup via `checkBBFAWTier()`
**Coverage:** Top 150 food companies only
**SPEC COMPLIANCE:** BBFAW ONLY, no fallback violation system

### Labor Violation Lookup

**Source:** Brand Database (internal)
**Method:** Brand name lookup via `checkLaborViolations()`
**Coverage:** DOL, Walk Free, Oxfam, ILO data

### Brand Overlay Lookup

**Source:** Brand Database (internal)
**Method:** Brand/parent company lookup via `hasRecallHistory()`, `hasHighImpactLaborViolations()`
**Logic:** Mutually exclusive - only applied if product doesn't have the violation

---

## Scoring Metrics and Information

### Base Score
- **Value:** 15/25
- **Rationale:** Uniform baseline, assumes ethical until violations detected
- **Source:** Internal logic

### Certification Bonuses (Stacked, Cap +15)

**Bonuses:**
- Fairtrade = +8
- Organic = +7
- Rainforest Alliance = +6
- UTZ = +6
- MSC/ASC = +6
- Ocean Wise = +5
- RSPCA = +5
- Leaping Bunny = +5
- B-Corp = +5
- Free-Roaming = +5
- Friend of the Sea = +4
- GlobalG.A.P = +4
- Free-Range = +3
- Cage-Free = +1

**Cap:** +15 total (if sum exceeds 15, cap at 15)

### Animal Cruelty Adjustment (BBFAW Tier-Based ONLY)

**SPEC COMPLIANCE:** BBFAW ONLY, no fallback violation system

**Adjustments:**
- Tier 1 = +4
- Tier 2 = +2
- Tier 6 = -7
- E/F = -7

**If BBFAW Not Found:** Nil return (no adjustment, no penalty) per spec

### Labor Violation Penalties (3-Tier System)

**Penalties:**
- Limited = -4 (under-pay, over-work, min breaks, unpaid overtime, Walk Free low-risk)
- Moderate = -8 (unsafe conditions, Walk Free medium-risk)
- Major = -15 (child labor, slavery, Walk Free high-risk)

**Mutually Exclusive Logic:** Product-level violations take priority over brand overlay

### Recall Penalties (3-Tier System, 3-Month Window)

**Penalties:**
- Class I = -15 (serious health risk)
- Class II = -8 (moderate health risk)
- Class III = -4 (low health risk)

**Timing:** Only active recalls within last 3 months (universal, not country-specific)

### Brand/Parent Overlay Penalties (Mutually Exclusive)

**Penalties:**
- Limited = -4
- Moderate = -8
- Major = -15

**Logic:** Only applied if product doesn't have the violation (mutually exclusive)

### Final Score Capping
- **Minimum Floor:** 0/25
- **Maximum Ceiling:** 25/25

---

## Database Results Analysis

### Databases That Return Ethics Pillar Data

**High Success Rate (>50%):**
1. **Open Food Facts** - ~60-70% (certifications)
2. **FDA Recalls** - ~95% (reliable API)
3. **Comprehensive US Recalls** - ~80-90%

**Always Available (100%):**
4. **BBFAW Database** - 100% (if brand in database, ~150 companies)
5. **Brand Database** - 100% (if brand in database)
6. **Brand Matching Service** - 100% (always returns match)

**Low Success Rate (<30%):**
7. **Open Corporates** - ~30-40% (brand enrichment)

**Non-Functional (0%):**
8. **RASFF Alerts** - 0% (HTML parsing issues)
9. **CFIA Recalls** - 0% (HTML parsing issues)
10. **UK FSA Recalls** - 0% (API endpoint returns 404)

**Expected Behavior (0% for food):**
11. **CPSC Recalls** - 0% for food products (CPSC is for consumer products)

---

## Decision Tree Logic

### Certification Decision Tree

```
FOR EACH label in labels_tags:
  ├─ IF Fairtrade → +8
  ├─ IF Organic → +7
  ├─ IF Rainforest Alliance → +6
  ├─ IF UTZ → +6
  ├─ IF MSC/ASC → +6
  ├─ IF Ocean Wise → +5
  ├─ IF RSPCA → +5
  ├─ IF Leaping Bunny → +5
  ├─ IF B-Corp → +5
  ├─ IF Free-Roaming → +5
  ├─ IF Friend of the Sea → +4
  ├─ IF GlobalG.A.P → +4
  ├─ IF Free-Range → +3
  └─ IF Cage-Free → +1

IF total certification bonus > 15:
  └─ Cap at +15
```

### Animal Cruelty Decision Tree (BBFAW ONLY)

```
FOR EACH brand in allBrands:
  ├─ Check BBFAW tier via checkBBFAWTier()
  ├─ IF BBFAW tier found:
  │   ├─ Tier 1 → +4
  │   ├─ Tier 2 → +2
  │   ├─ Tier 6 → -7
  │   └─ E/F → -7
  └─ ELSE:
      └─ Nil return (no adjustment, no penalty) per spec

SPEC COMPLIANCE: BBFAW ONLY, no fallback violation system
```

### Labor Violation Decision Tree

```
Check labor violations via checkLaborViolations()
├─ IF has violations:
│   ├─ IF violation is product-level OR product has no certifications:
│   │   ├─ Major → -15
│   │   ├─ Moderate → -8
│   │   └─ Limited → -4
│   └─ ELSE IF violation is parent-level AND product has certifications:
│       └─ Use brand overlay instead (mutually exclusive)
└─ ELSE:
    └─ No penalty
```

### Recall Decision Tree

```
IF recalls exist AND recalls are active AND recalls are within 3 months:
  ├─ Determine highest severity:
  │   ├─ Class I → -15
  │   ├─ Class II → -8
  │   └─ Class III → -4
  └─ Apply penalty
ELSE:
  └─ No penalty
```

### Brand Overlay Decision Tree (Mutually Exclusive)

```
IF product doesn't have violation:
  ├─ Check brand/parent for violations:
  │   ├─ IF has high-impact animal cruelty (BBFAW Tier 6/E/F):
  │   │   └─ Apply brand overlay penalty
  │   ├─ IF has labor violations:
  │   │   └─ Apply brand overlay penalty
  │   └─ IF has recall history:
  │       └─ Apply brand overlay penalty
  └─ Determine severity (Limited/Moderate/Major)
ELSE:
  └─ No brand overlay (product violation takes priority)
```

---

## TruScore vs Information Usage

### Databases Used for Ethics Pillar Scoring

**Primary Scoring Data:**
1. **Open Food Facts** - Certifications
2. **BBFAW Database** - Animal cruelty (tier-based)
3. **Brand Database** - Labor violations, recall history
4. **FDA Recalls** - Product recalls
5. **Comprehensive US Recalls** - Product recalls

**Enhancement Data:**
6. **Brand Matching Service** - Brand resolution (enables database lookups)
7. **Open Corporates** - Brand enrichment (indirect contribution)

### Databases Used for Information Display Only

- Most databases provide product information but don't directly contribute to Ethics Pillar scoring.

---

## Issues and Problems

### Critical Issues

1. **RASFF Alerts Non-Functional**
   - **Problem:** HTML parsing issues, returns 0 results
   - **Impact:** EU users don't get RASFF recall data
   - **Severity:** High
   - **Recommendation:** Fix HTML parsing or use alternative API

2. **CFIA Recalls Non-Functional**
   - **Problem:** HTML parsing issues, returns 0 results
   - **Impact:** CA users don't get CFIA recall data
   - **Severity:** High
   - **Recommendation:** Fix HTML parsing or use alternative API

3. **UK FSA Recalls Non-Functional**
   - **Problem:** API endpoint returns 404
   - **Impact:** GB users don't get UK FSA recall data
   - **Severity:** High
   - **Recommendation:** Contact UK FSA for correct endpoint or use alternative source

### Moderate Issues

4. **BBFAW Coverage Limited**
   - **Problem:** BBFAW only covers top 150 food companies
   - **Impact:** Most products don't get BBFAW adjustment (nil return per spec)
   - **Severity:** Low (expected per spec)
   - **Recommendation:** Accept current coverage (spec-compliant)

5. **Brand Database Completeness**
   - **Problem:** Brand database may not cover all brands
   - **Impact:** Some products don't get labor violation or recall history data
   - **Severity:** Low
   - **Recommendation:** Regularly update brand database

---

## Recommendations

### High Priority

1. **Fix RASFF HTML Parsing**
   - Inspect actual RASFF website HTML structure
   - Refine parsing patterns
   - Or use alternative API if available

2. **Fix CFIA HTML Parsing**
   - Inspect actual CFIA website HTML structure
   - Refine parsing patterns
   - Or use alternative API if available

3. **Fix UK FSA API Endpoint**
   - Contact UK FSA (data@food.gov.uk)
   - Verify correct endpoint
   - Or use alternative source

### Medium Priority

4. **Regular Brand Database Updates**
   - Quarterly updates for labor violations
   - Quarterly updates for recall history
   - Quarterly updates for BBFAW data

5. **Improve Brand Matching**
   - Already implemented fuzzy matching
   - Consider improving confidence thresholds

---

## Spec Compliance Analysis

### Comparison with ETHICS Pillar.xlsx Spec

#### ✅ Compliant Areas

1. **Base Score: 15/25** - ✅ Compliant
2. **Certification Bonuses** - ✅ Compliant (matches spec exactly)
3. **Certification Cap: +15** - ✅ Compliant
4. **Animal Cruelty (BBFAW ONLY)** - ✅ Compliant (BBFAW tier-based, no fallback)
5. **Labor Violations (3-Tier)** - ✅ Compliant (Limited=-4, Moderate=-8, Major=-15)
6. **Recalls (3-Tier, 3-Month)** - ✅ Compliant (Class I=-15, Class II=-8, Class III=-4)
7. **Brand Overlay (Mutually Exclusive)** - ✅ Compliant
8. **Score Capping** - ✅ Compliant (0-25)

#### ⚠️ Issues Requiring Attention

1. **Recall Database Functionality**
   - RASFF, CFIA, UK FSA are non-functional
   - Need fixes for EU, CA, GB users

---

## Conclusion

The Ethics Pillar implementation is fully compliant with the spec. Main issues are non-functional recall databases (RASFF, CFIA, UK FSA) that need fixes. The BBFAW-only approach is spec-compliant (no fallback violation system).

---

**Document End**
