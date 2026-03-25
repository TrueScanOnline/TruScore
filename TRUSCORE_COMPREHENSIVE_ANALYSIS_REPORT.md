# TruScore Comprehensive Analysis Report
**Date:** January 2025  
**Purpose:** Complete analysis of TruScore data gathering, database integration, scoring engine, and logging system  
**Scope:** End-to-end process from barcode scan to TruScore display

---

## Executive Summary

This report provides a comprehensive analysis of the TrueScan FoodScanner app's TruScore generation system. The analysis covers:

1. **Database Architecture** - All 40+ data sources, their priority, geo-location logic, weightings, and API status
2. **Data Gathering Process** - Complete flow from barcode scan through multi-tier database interrogation
3. **Data Merging Logic** - How multiple sources are combined with weighted priority
4. **TruScore Engine** - Detailed breakdown of each pillar calculation (Body, Planet, Care, Open)
5. **Missing Data Handling** - Fallback strategies and baseline scoring
6. **Duplicate Data Resolution** - How conflicts are resolved
7. **Logging System** - Current setup and verification capabilities
8. **Recommendations** - Path to world-leading status

**Key Finding:** The app uses a sophisticated 3-tier database architecture with 40+ sources, intelligent merging, and comprehensive fallback strategies. The TruScore engine implements a 4-pillar system (25 points each) with robust missing data handling.

---

## Part 1: Database Architecture & Data Sources

### 1.1 Complete Database Inventory

The app integrates **40+ data sources** organized into a 3-tier priority system:

#### **TIER 0: Offline-First (Highest Priority)**
| Database | Type | Geo-Location | API Required | Status | Weight |
|----------|------|--------------|--------------|--------|--------|
| **SQLite Local Database** | Local | Country-specific | ❌ No | ✅ Active | N/A (offline cache) |

**Purpose:** Offline-first product lookup with country-specific data  
**Implementation:** `src/services/sqliteProductDatabase.ts`  
**Coverage:** Cached products from previous scans, country-specific

---

#### **TIER 1: Open Facts Family (Parallel Query)**

| Database | Type | Geo-Location | API Required | Status | Weight |
|----------|------|--------------|--------------|--------|--------|
| **Open Food Facts (OFF)** | Public API | ✅ Country-specific instances | ❌ Free | ✅ Active | 0.40 |
| **Open Beauty Facts (OBF)** | Public API | ❌ Global only | ❌ Free | ✅ Active | 0.35 |
| **Open Pet Food Facts (OPFF)** | Public API | ❌ Global only | ❌ Free | ✅ Active | 0.35 |
| **Open Products Facts (OPF)** | Public API | ❌ Global only | ❌ Free | ✅ Active | 0.35 |

**Query Strategy:** All 4 databases queried **in parallel** for all barcode variants  
**Geo-Location Logic:**
- OFF uses country-specific instances (e.g., `us.openfoodfacts.org`, `nz.openfoodfacts.org`)
- Tries user's country first, then common countries, then global instance
- Other Open Facts databases use global instances

**Coverage:**
- OFF: ~2.5M+ products (food, drinks)
- OBF: ~500K+ products (cosmetics, personal care)
- OPFF: ~50K+ products (pet food)
- OPF: ~100K+ products (general products)

**Data Quality:** High - community-driven, regularly updated

---

#### **TIER 1.5: Country-Specific Gold Standard Databases**

**Query Strategy:** Sequential, country-specific (only queried if user is in that country)

| Database | Country | Type | API Required | Status | Weight |
|----------|---------|------|--------------|--------|--------|
| **NZ Store APIs** | NZ | Store APIs | ❌ Free | ✅ Active | 0.30 |
| **AU Retailer APIs** | AU | Store APIs | ❌ Free | ✅ Active | 0.30 |
| **FSANZ Database** | AU/NZ | Government | ❌ Free (local DB) | ✅ Active | 0.40 |
| **USDA FoodData Central** | US | Government | ❌ Free (requires key) | ✅ Active | 0.40 |
| **Health Canada CNF** | CA | Government | ❌ Free (local DB) | ⚠️ Placeholder | 0.40 |
| **UK FSA** | GB | Government | ❌ Free | ⚠️ Placeholder | 0.40 |
| **EFSA** | EU | Government | ❌ Free | ⚠️ Placeholder | 0.40 |
| **Tesco Labs API** | GB | Store API | ✅ Free (requires key) | ✅ Active | 0.35 |
| **Walmart Open API** | US | Store API | ✅ Free (requires key) | ✅ Active | 0.35 |
| **FoodRepo API** | CH/EU | Public API | ❌ Free | ✅ Active | 0.35 |

**Special Logic:**
- **USDA (US):** Primary override for US users when OFF data is incomplete
- **FSANZ (AU/NZ):** Gold standard nutrition data for Australia/New Zealand
- **Health Canada (CA):** Canadian Nutrient File (CNF) - local database import
- **Tesco/Walmart:** Regional store APIs for better product coverage

**Coverage:**
- USDA: ~1.2M US branded products
- FSANZ: Complete AU/NZ food composition database
- Tesco: UK grocery products
- Walmart: US products

---

#### **TIER 2: Official & Verified Sources**

| Database | Type | Geo-Location | API Required | Status | Weight |
|----------|------|--------------|--------------|--------|--------|
| **GS1 Data Source** | Official | Global | ✅ Requires key | ✅ Active | 0.40 |
| **USDA (Non-US users)** | Government | US | ❌ Free | ✅ Active | 0.40 |

**Query Strategy:** Parallel query (both queried simultaneously)

---

#### **TIER 3: Fallback APIs (Parallel Query)**

| Database | Type | Geo-Location | API Required | Status | Weight |
|----------|------|--------------|--------------|--------|--------|
| **UPCitemdb** | Public API | Global | ❌ Free | ✅ Active | 0.20 |
| **Barcode Spider** | Public API | Global | ❌ Free | ✅ Active | 0.20 |
| **Go-UPC** | Public API | Global | ❌ Free | ✅ Active | 0.20 |
| **Buycott** | Public API | Global | ❌ Free | ✅ Active | 0.20 |
| **Open GTIN DB** | Public API | Global | ❌ Free | ✅ Active | 0.20 |
| **Barcode Monster** | Public API | Global | ❌ Free | ✅ Active | 0.20 |
| **EAN-Search** | Public API | Global | ❌ Free | ✅ Active | 0.20 |
| **UPC Database API** | Public API | Global | ❌ Free | ✅ Active | 0.20 |
| **Edamam** | Public API | Global | ✅ Free tier | ✅ Active | 0.25 |
| **Barcode Lookup API** | Public API | Global | ✅ Free tier | ✅ Active | 0.20 |
| **Nutritionix** | Public API | Global | ✅ Free tier | ✅ Active | 0.25 |
| **Spoonacular** | Public API | Global | ✅ Free tier | ✅ Active | 0.25 |
| **Best Buy API** | Public API | Global | ✅ Free tier | ✅ Active | 0.20 |
| **EANData API** | Public API | Global | ✅ Free tier | ✅ Active | 0.20 |

**Query Strategy:** All queried in parallel for speed  
**Coverage:** Varies by database (ranging from 100K to 1B+ products)

---

#### **TIER 4: Web Search Fallback (Guaranteed Result)**

| Database | Type | Geo-Location | API Required | Status | Weight |
|----------|------|--------------|--------------|--------|--------|
| **Web Search (DuckDuckGo)** | Web Scraping | Global | ❌ Free | ✅ Active | 0.10 |

**Purpose:** Ensures app **ALWAYS** returns a product (even if minimal data)  
**Strategy:** Only used if all other databases fail

---

### 1.2 Database Priority Order Summary

**Execution Flow:**
```
1. SQLite (offline cache) → If found, return immediately
2. Tier 1: Open Facts Family (parallel) → Merge results
3. Tier 1.5: Country-specific (sequential, conditional) → Merge with Tier 1
4. Tier 2: Official sources (parallel) → Merge with existing
5. Tier 3: Fallback APIs (parallel) → Merge with existing
6. Tier 4: Web Search → Guaranteed result
```

**Key Principle:** Higher tiers are queried first, results are merged with weighted priority

---

### 1.3 Geo-Location Logic

**Country Detection:**
- **Primary:** Device locale (`expo-localization`)
- **Fallback:** Extracts country code from `languageTag` or `regionCode`
- **Implementation:** `src/utils/countryDetection.ts`

**Country-Specific Database Selection:**
```typescript
// User's country determines which Tier 1.5 databases are queried
if (userCountry === 'NZ') → NZ Store APIs, FSANZ
if (userCountry === 'AU') → AU Retailer APIs, FSANZ
if (userCountry === 'US') → USDA (primary override), Walmart, Recalls.gov
if (userCountry === 'CA') → Health Canada CNF, CFIA Recalls
if (userCountry === 'GB') → UK FSA, Tesco Labs
if (isEUCountry(userCountry)) → EFSA, FoodRepo, EU RASFF
```

**Open Food Facts Country Instances:**
- Tries country-specific instance first (e.g., `us.openfoodfacts.org`)
- Falls back to global instance (`world.openfoodfacts.org`)
- Supports 50+ country instances

---

### 1.4 Database Weightings

**Weight System:** 0.0 - 1.0 scale (higher = more trusted)

**Government Databases (0.40):**
- FSANZ (AU/NZ)
- USDA FoodData
- GS1 Data Source
- Health Canada CNF
- UK FSA
- EFSA

**Open Facts Databases (0.35-0.40):**
- Open Food Facts: 0.40
- Open Beauty Facts: 0.35
- Open Pet Food Facts: 0.35
- Open Products Facts: 0.35

**Regional Store APIs (0.35):**
- Tesco Labs: 0.35
- Walmart Open: 0.35
- FoodRepo: 0.35

**Store APIs (0.30):**
- NZ Store APIs: 0.30
- AU Retailer APIs: 0.30

**Verified APIs (0.20-0.25):**
- Edamam: 0.25
- Nutritionix: 0.25
- Spoonacular: 0.25
- Others: 0.20

**Fallback (0.10):**
- Web Search: 0.10

**Weight Usage:** Used in `productDataMerger.ts` for weighted averaging of nutrition data and priority selection

---

### 1.5 API Status & Requirements

**Free APIs (No Key Required):**
- ✅ Open Food Facts family (OFF, OBF, OPFF, OPF)
- ✅ FSANZ (local database import)
- ✅ Health Canada CNF (local database import)
- ✅ FoodRepo
- ✅ UPCitemdb, Barcode Spider, Go-UPC, Buycott, Open GTIN, Barcode Monster, EAN-Search, UPC Database
- ✅ Web Search (DuckDuckGo)

**Free APIs (Key Required):**
- ✅ USDA FoodData Central (free registration)
- ✅ Tesco Labs API (free registration)
- ✅ Walmart Open API (free registration)
- ✅ EAN-Search Brand API (free tier: 1,000/day)
- ✅ OpenCorporates API (free tier)
- ✅ GS1 Data Source (requires membership)

**Placeholder APIs (Not Yet Integrated):**
- ⚠️ UK FSA (API only provides hygiene ratings, not product lookup)
- ⚠️ EFSA (API provides safety data, not product lookup - expected 2026+)
- ⚠️ EU RASFF (requires registration)
- ⚠️ CFIA (no public API available)
- ⚠️ OpenNutrition (API structure unknown)

**Total Active Databases:** 35+  
**Total Placeholder Databases:** 5

---

## Part 2: Data Gathering Process

### 2.1 Complete Flow: Barcode Scan → Product Data

**Step-by-Step Process:**

```
1. USER SCANS BARCODE
   ↓
2. BARCODE NORMALIZATION
   - Normalize to primary format (EAN-13, UPC-A)
   - Generate variants (with/without check digit, leading zeros)
   ↓
3. CHECK SQLITE (Tier 0)
   - Country-specific lookup
   - If found: Return immediately (offline-first)
   ↓
4. CHECK CACHE
   - AsyncStorage cache
   - Premium users: Larger cache
   - If found: Return cached product
   ↓
5. TIER 1: OPEN FACTS FAMILY (Parallel)
   - Query OFF, OBF, OPFF, OPF simultaneously
   - Try all barcode variants in parallel
   - Collect all results
   - Merge if multiple found
   ↓
6. TIER 1.5: COUNTRY-SPECIFIC (Sequential, Conditional)
   - Only if user is in supported country
   - Query country-specific databases
   - Merge with Tier 1 results
   - Special: USDA primary override for US users
   ↓
7. TIER 2: OFFICIAL SOURCES (Parallel)
   - Query GS1, USDA (if not US user)
   - Merge with existing results
   ↓
8. TIER 3: FALLBACK APIS (Parallel)
   - Query all 13+ fallback APIs simultaneously
   - Merge with existing results
   ↓
9. TIER 4: WEB SEARCH (Guaranteed)
   - Only if no product found yet
   - DuckDuckGo Instant Answer
   - Creates minimal product result
   ↓
10. ENHANCEMENT LAYER
    - MVP Enhancements (EWG, WWF, Leaping Bunny)
    - Brand Enrichment (EAN-Search, OpenCorporates, B-Corp)
    ↓
11. RECALL CHECKS (Non-blocking)
    - FDA Recalls (all users)
    - Recalls.gov (US users)
    - EU RASFF (EU users)
    - CFIA (Canadian users)
    ↓
12. CACHE RESULT
    - Save to AsyncStorage
    - Save to SQLite (country-specific)
    ↓
13. CALCULATE TRUSCORE
    - Apply confidence scoring
    - Calculate TruScore (4 pillars)
    ↓
14. RETURN PRODUCT WITH TRUSCORE
```

**Key Features:**
- **Offline-First:** SQLite checked before any network calls
- **Parallel Queries:** Tier 1, Tier 2, Tier 3 all use parallel execution
- **Guaranteed Result:** Web search ensures product is always returned
- **Non-Blocking:** Recalls checked asynchronously, don't delay product display

---

### 2.2 Barcode Variant Generation

**Purpose:** Handle different barcode formats and edge cases

**Variants Generated:**
1. Primary barcode (normalized)
2. Original barcode (if different)
3. Variants with/without check digit
4. Variants with/without leading zeros

**Implementation:** `src/utils/barcodeNormalization.ts`

**Example:**
- Input: `123456789012`
- Variants: `123456789012`, `0123456789012`, `1234567890123` (with check digit)

---

### 2.3 Data Merging Strategy

**Implementation:** `src/services/productDataMerger.ts`

**Merging Rules:**

1. **Base Product Selection:**
   - Highest-weight source becomes base
   - Other sources enhance base product

2. **Nutrition Data:**
   - **Weighted Average:** All nutrition values averaged by source weight
   - Formula: `value = Σ(value_i × weight_i) / Σ(weight_i)`
   - Normalized to per-100g format

3. **Ingredients:**
   - **Longest/Most Complete:** Uses ingredients list from source with longest text
   - Rationale: Longer list = more complete

4. **Certifications:**
   - **Union:** All certifications from all sources combined
   - Higher-weight sources processed first (priority)

5. **Product Name:**
   - **Best Available:** Uses name from highest-weight source
   - Fallback: First non-placeholder name found

6. **Brand:**
   - **Best Available:** Uses brand from highest-weight source
   - Fallback: First non-empty brand found

7. **Image:**
   - **Best Available:** Prefers non-null image from highest-weight source

8. **Quality/Completion Metrics:**
   - **Weighted Average:** Quality and completion scores averaged by weight

**Example Merge:**
```
Source 1 (OFF, weight 0.40): Nutrition A, Ingredients X
Source 2 (USDA, weight 0.40): Nutrition B, Ingredients Y (longer)
Result: Nutrition = (A×0.4 + B×0.4) / 0.8, Ingredients = Y (longer)
```

---

### 2.4 Missing Data Handling

**Strategy:** Conservative baselines + graceful degradation

**Missing Nutri-Score:**
- **Baseline:** 12/25 (conservative middle score)
- **Rationale:** Don't penalize products without Nutri-Score data
- **Location:** `src/lib/truscoreEngine.ts:154-156`

**Missing Eco-Score:**
- **Baseline:** 12/25 (conservative middle score)
- **Rationale:** Don't penalize products without Eco-Score data
- **Location:** `src/lib/truscoreEngine.ts:254-256`

**Missing Origin Data:**
- **Penalty:** -15 points in Open pillar
- **Rationale:** Transparency requires origin disclosure
- **Location:** `src/lib/truscoreEngine.ts:392-398`

**Missing Ingredients:**
- **Penalty:** Open pillar = 5/25 (severe penalty)
- **Rationale:** No ingredients = very low transparency
- **Location:** `src/lib/truscoreEngine.ts:362-372`

**Missing Product Data:**
- **Fallback:** Web search creates minimal product
- **Guarantee:** App always returns a product (never null)

---

### 2.5 Duplicate Data Resolution

**Problem:** Multiple sources may return same product with different data

**Resolution Strategy:**

1. **Source Weight Priority:**
   - Higher-weight sources take precedence
   - Government databases (0.40) > Open Facts (0.35-0.40) > Fallback (0.20)

2. **Field-Specific Rules:**
   - **Nutrition:** Weighted average (combines all sources)
   - **Ingredients:** Longest list wins (most complete)
   - **Certifications:** Union (all certifications combined)
   - **Product Name:** Highest-weight source wins
   - **Brand:** Highest-weight source wins

3. **Deduplication:**
   - Certifications deduplicated by tag/ID
   - Categories deduplicated (union)

**Example:**
```
OFF says: "Organic, Fair Trade" (weight 0.40)
USDA says: "Organic" (weight 0.40)
Result: "Organic, Fair Trade" (union, no duplicates)
```

---

## Part 3: TruScore Engine Analysis

### 3.1 Engine Architecture

**Location:** `src/lib/truscoreEngine.ts`  
**Version:** v1.4  
**Total Points:** 100 (4 pillars × 25 points each)

**Pillars:**
1. **Body** (25pts) - Nutrition, additives, health
2. **Planet** (25pts) - Sustainability, environment
3. **Care** (25pts) - Ethics, certifications
4. **Open** (25pts) - Transparency, ingredient disclosure

---

### 3.2 Body Pillar Calculation (25pts)

**Base Score:**
- **With Nutri-Score:** Direct conversion (A=25, B=20, C=15, D=10, E=5)
- **Without Nutri-Score:** Baseline 12/25

**Penalties:**

1. **Additives (Weighted, Cap -15):**
   - Safe: -0.5 each
   - Caution: -1.5 each
   - Avoid: -3 each
   - **Country-Specific:** Additional -2 (restricted) or -5 (banned)
   - **Cap:** Maximum -15 total

2. **Risky Tags (-4 each):**
   - Carcinogenic, endocrine disruptor, allergen, irritant
   - EWG high-hazard (from enhancement)

3. **EWG Enhancement (-1 to -5):**
   - High hazard (7-10): -5
   - Moderate (4-6): -3
   - Low (1-3): -1

4. **Irritants (-10):**
   - Paraben, phthalate, sulfate, triclosan, formaldehyde, PEG, silicone, phenoxyethanol

5. **Fragrance (-10):**
   - Parfum, fragrance, aroma

**Bonuses:**

1. **NOVA Group:**
   - NOVA 1 (unprocessed): +3
   - NOVA 2 (minimally processed): +1
   - NOVA 3 (processed): -5
   - NOVA 4 (ultra-processed): -10

**Final:** `body = Math.max(0, Math.min(25, Math.round(body)))`

**Example Calculation:**
```
Base: 20 (Nutri-Score B)
Additives: -6 (2 avoid, 1 caution)
Risky tags: -4 (1 tag)
NOVA: -5 (NOVA 3)
Result: 20 - 6 - 4 - 5 = 5/25
```

---

### 3.3 Planet Pillar Calculation (25pts)

**Base Score:**
- **With Eco-Score:** Direct conversion (A=25, B=20, C=15, D=10, E=5)
- **Without Eco-Score:** Baseline 12/25

**Penalties:**

1. **Palm Oil:**
   - Non-certified: -10
   - Certified sustainable (WWF): -5
   - Palm-oil-free: No penalty

**Bonuses:**

1. **Recyclable Packaging:**
   - All recyclable (local requirements): +5
   - Some recyclable: +2
   - **Geo-Location:** Uses `meetsLocalRecyclingRequirements()` for country-specific accuracy

**Final:** `planet = Math.max(0, Math.min(25, Math.round(planet)))`

**Example Calculation:**
```
Base: 15 (Eco-Score C)
Palm Oil: -10 (non-certified)
Recyclable: +5 (all recyclable)
Result: 15 - 10 + 5 = 10/25
```

---

### 3.4 Ethics Pillar Calculation (25pts)

**Base Score:** 18/25 (absence of known cruelty)

**Bonuses (Stackable, Max +25):**

1. **Fair Trade:** +8
2. **Organic (Regional):** +8
   - USDA Organic, EU Organic, Bio, Ecocert all count
3. **Rainforest Alliance:** +7
4. **MSC/ASC/Dolphin-Safe:** +8
5. **RSPCA:** +6
6. **Vegan/Cruelty-Free:** +10
7. **UTZ:** +7
8. **B-Corp:** +5 (from brand enrichment)
9. **Non-GMO Project:** +3

**Penalties:**

1. **Cruel Parent Company:** -30
   - Uses brand database for detection
   - Can reduce Care to 0 (capped at 0)

**Final:** `care = Math.max(0, Math.min(25, Math.round(care)))`

**Example Calculation:**
```
Base: 18
Fair Trade: +8
Organic: +8
Vegan: +10
Total: 18 + 8 + 8 + 10 = 44 → Capped at 25/25
```

---

### 3.5 Open Pillar Calculation (25pts)

**Base Score:** 25/25 (full transparency assumed)

**Penalties:**

1. **Hidden Terms:**
   - 1-2 terms: -12
   - ≥3 terms: -20
   - Terms: parfum, fragrance, aroma, flavor, natural flavor, proprietary, etc.

2. **No Ingredients:**
   - Open = 5/25 (severe penalty)
   - Also applies to placeholder text

3. **No Origin:**
   - -15 points
   - Checks multiple origin fields (tags, strings, manufacturing places)
   - Validates against placeholder values

**Final:** `open = Math.max(0, Math.min(25, Math.round(open)))`

**Example Calculation:**
```
Base: 25
Hidden Terms: -12 (2 terms found)
No Origin: -15
Result: 25 - 12 - 15 = -2 → Capped at 0/25
```

---

### 3.6 Final TruScore Calculation

**Formula:**
```typescript
truScore = body + planet + care + open
// Each pillar: 0-25 points
// Total: 0-100 points
```

**Metadata Tracking:**
- `hasNutriScore`: Whether Nutri-Score was used (vs baseline)
- `hasEcoScore`: Whether Eco-Score was used (vs baseline)
- `hasOrigin`: Whether origin data was present (vs -15 penalty)

**Location:** `src/lib/truscoreEngine.ts:78-465`

---

## Part 4: Missing Data Handling

### 4.1 Missing Nutri-Score

**Handling:**
```typescript
if (hasNutriScore) {
  body = { a: 25, b: 20, c: 15, d: 10, e: 5 }[grade] || 12;
} else {
  body = 12; // Conservative baseline
}
```

**Rationale:** Don't penalize products without Nutri-Score data  
**Impact:** Products without Nutri-Score start at 12/25 instead of 0

---

### 4.2 Missing Eco-Score

**Handling:**
```typescript
if (hasEcoScore) {
  planet = { a: 25, b: 20, c: 15, d: 10, e: 5 }[grade] || 12;
} else {
  planet = 12; // Conservative baseline
}
```

**Rationale:** Don't penalize products without Eco-Score data  
**Impact:** Products without Eco-Score start at 12/25 instead of 0

---

### 4.3 Missing Origin Data

**Handling:**
```typescript
if (!hasOrigin) {
  open -= 15; // Transparency penalty
}
```

**Rationale:** Origin disclosure is required for transparency  
**Impact:** Products without origin lose 15 points in Open pillar

---

### 4.4 Missing Ingredients

**Handling:**
```typescript
if (!ingredients_text || isPlaceholder(ingredients_text)) {
  open = 5; // Severe penalty
}
```

**Rationale:** No ingredients = very low transparency  
**Impact:** Products without ingredients get 5/25 in Open pillar

---

### 4.5 Missing Product Data (Complete Fallback)

**Handling:**
- Web search creates minimal product
- TruScore may be `null` if insufficient data
- App always returns a product (never null)

**Location:** `src/utils/trustScore.ts:10-39`

---

## Part 5: Duplicate Data Resolution

### 5.1 Source Priority System

**Rule:** Higher-weight sources take precedence

**Priority Order:**
1. Government databases (0.40)
2. Open Facts (0.35-0.40)
3. Regional Store APIs (0.35)
4. Store APIs (0.30)
5. Verified APIs (0.20-0.25)
6. Fallback APIs (0.20)
7. Web Search (0.10)

---

### 5.2 Field-Specific Resolution

**Product Name:**
- Highest-weight source wins
- Fallback: First non-placeholder name

**Brand:**
- Highest-weight source wins
- Fallback: First non-empty brand

**Nutrition:**
- **Weighted Average:** All sources combined
- Formula: `value = Σ(value_i × weight_i) / Σ(weight_i)`

**Ingredients:**
- **Longest List:** Most complete ingredients list wins
- Rationale: Longer = more complete

**Certifications:**
- **Union:** All certifications combined
- Deduplication by tag/ID
- Higher-weight sources processed first

**Image:**
- Highest-weight source with non-null image

**Categories:**
- Most specific (longest) category string

---

### 5.3 Conflict Resolution Example

**Scenario:** OFF and USDA both return same product

```
OFF (weight 0.40):
  - Product Name: "Organic Milk"
  - Nutrition: { fat: 3.5, protein: 3.2 }
  - Ingredients: "Organic milk"
  - Certifications: ["organic"]

USDA (weight 0.40):
  - Product Name: "Organic Whole Milk"
  - Nutrition: { fat: 3.6, protein: 3.3 }
  - Ingredients: "Organic whole milk, vitamin D3"
  - Certifications: ["organic"]

Result:
  - Product Name: "Organic Whole Milk" (USDA, same weight, better name)
  - Nutrition: { fat: 3.55, protein: 3.25 } (weighted average)
  - Ingredients: "Organic whole milk, vitamin D3" (longer/more complete)
  - Certifications: ["organic"] (union, deduplicated)
```

---

## Part 6: Logging System Analysis

### 6.1 Logging Architecture

**Implementation:** `src/utils/logger.ts`

**Log Levels:**
- **DEBUG:** Development only (stripped in production)
- **INFO:** Important events (product scans, database queries)
- **WARN:** Warnings (missing data, fallbacks)
- **ERROR:** Errors (API failures, critical issues)

**Current Level:** Development = DEBUG, Production = WARN

---

### 6.2 Current Logging Coverage

#### **Product Scan Logging:**

```
═══════════════════════════════════════════════════════════════
🔍 PRODUCT SCAN: {barcode}
═══════════════════════════════════════════════════════════════
📋 Barcode Variants: {variants}
🌍 User Country: {country}
───────────────────────────────────────────────────────────────
📊 TIER 1: Open Facts Family (Parallel Query)
───────────────────────────────────────────────────────────────
✅ Open Food Facts: Found product | {completeness metrics}
❌ Open Beauty Facts: Not found
───────────────────────────────────────────────────────────────
📊 TIER 1.5: Country-Specific Sources ({country})
───────────────────────────────────────────────────────────────
✅ USDA FoodData: Found product | {completeness metrics}
🔄 Merging USDA with Tier 1 product...
✅ Merged product: {source} | {completeness metrics}
───────────────────────────────────────────────────────────────
📊 DATABASE MERGER: Merging {N} products
═══════════════════════════════════════════════════════════════
Source 1: {source} (Weight: {weight}%)
  {completeness metrics}
Source 2: {source} (Weight: {weight}%)
  {completeness metrics}
───────────────────────────────────────────────────────────────
🔀 MERGING DECISIONS:
  Base Product: {source} (highest weight)
  Nutrition: Merged from {N} sources (weighted average)
  Ingredients: Used from {source} (longest/most complete)
  Certifications: Merged from {N} sources (union)
───────────────────────────────────────────────────────────────
✅ FINAL MERGED PRODUCT:
  {completeness metrics}
  Source: {source}
  Quality: {quality}
  Completion: {completion}
═══════════════════════════════════════════════════════════════
✨ ENHANCEMENT LAYER: Applying MVP Enhancements
───────────────────────────────────────────────────────────────
📊 Before Enhancement: {completeness metrics}
📊 After Enhancement: {completeness metrics}
✅ MVP enhancements and brand enrichment applied successfully
───────────────────────────────────────────────────────────────
🎯 FINAL PRODUCT DATA (Before Scoring)
───────────────────────────────────────────────────────────────
  {completeness metrics}
  Source: {source}
  Product Name: {name}
  Brand: {brand}
  Has Nutrition: {yes/no}
  Has Ingredients: {yes/no}
  Has Eco-Score: {yes/no}
  Has Palm Oil Analysis: {yes/no}
  Has Certifications: {yes/no}
───────────────────────────────────────────────────────────────
📊 TRUSCORE CALCULATION
───────────────────────────────────────────────────────────────
  TruScore: {score}/100
  Body Pillar: {score}/25
  Planet Pillar: {score}/25
  Ethics Pillar: {score}/25
  Open Pillar: {score}/25
  
  Data Sources Used:
    Nutri-Score: {Yes/No (baseline 12 used)}
    Eco-Score: {Yes/No (baseline 12 used)}
    Origin Data: {Yes/No (-15 penalty applied)}
  
  NOVA Group: {group} ({effect})
  Additives: {count} (weighted penalty applied)
  Palm Oil: {status} ({penalty/bonus})
  Certifications: {count} found ({list})
  Hidden Terms: {count} found ({penalty})
  Recyclable Packaging: {status} ({bonus})
  Cruel Parent: {Detected/Not detected} ({penalty})
═══════════════════════════════════════════════════════════════
✅ PRODUCT SCAN COMPLETE
═══════════════════════════════════════════════════════════════
⚠️ RECALL ALERT: {N} recall(s) found for this product
```

---

### 6.3 Logging Verification Capabilities

**What Can Be Verified:**

1. **Database Queries:**
   - ✅ Which databases were queried
   - ✅ Which databases found products
   - ✅ Which databases failed/errored
   - ✅ Completeness metrics for each source

2. **Data Merging:**
   - ✅ Which sources were merged
   - ✅ Source weights used
   - ✅ Merging decisions (what was used from each source)
   - ✅ Final merged product completeness

3. **TruScore Calculation:**
   - ✅ Final TruScore and breakdown
   - ✅ Which data sources contributed (Nutri-Score, Eco-Score, Origin)
   - ✅ NOVA group and effect
   - ✅ Additive count and penalties
   - ✅ Palm oil status and penalty/bonus
   - ✅ Certifications found
   - ✅ Hidden terms count and penalty
   - ✅ Recyclable packaging status and bonus
   - ✅ Cruel parent detection

4. **Enhancements:**
   - ✅ Before/after enhancement completeness
   - ✅ Brand enrichment applied

5. **Recalls:**
   - ✅ Recall alerts found

**Gaps in Logging:**

1. **Missing:**
   - ⚠️ Individual additive penalties (only total count logged)
   - ⚠️ Country-specific additive penalties (not explicitly logged)
   - ⚠️ EWG hazard score details (not logged)
   - ⚠️ Individual certification bonuses (only count logged)
   - ⚠️ Exact merging calculations (weights, averages)

2. **Could Be Enhanced:**
   - ⚠️ Timing information (how long each database query took)
   - ⚠️ Cache hit/miss information
   - ⚠️ SQLite lookup success/failure

---

## Part 7: Recommendations for World-Leading Status

### 7.1 Database Enhancements

#### **CRITICAL: Expand Country-Specific Regulatory Databases**

**Current:** Basic examples only  
**Recommendation:** Download and integrate full regulatory databases

**Actions:**
1. **FSANZ Additive Database:** Download full database with all approved/restricted additives
2. **Health Canada Additive Database:** Import full CNF additive regulations
3. **FDA GRAS List:** Integrate full GRAS database
4. **EU Food Additive Database:** Download EFSA additive database
5. **Allergen Databases:** Expand country-specific allergen regulations

**Impact:** More accurate country-specific scoring adjustments

---

#### **HIGH PRIORITY: Enhance MVP Databases**

**Current:** Static lists (B-Corp: ~50, Leaping Bunny: ~100, WWF: 10 brands)  
**Recommendation:** Download full databases

**Actions:**
1. **B-Corp Directory:** Download full 2,000+ certified companies database
2. **Leaping Bunny:** Download full 2,000+ certified brands database
3. **WWF Palm Oil Scorecard:** Download full scorecard data

**Impact:** Better coverage for certifications and palm oil sustainability

---

#### **MEDIUM PRIORITY: API Registrations**

**Current:** Placeholder services  
**Recommendation:** Register for APIs when available

**Actions:**
1. **EU RASFF API:** Register for European Commission API access
2. **OpenNutrition API:** Verify API structure and integrate if available
3. **CFIA:** Implement web scraping (with ToS compliance) or wait for API

**Impact:** Enhanced recall coverage and nutrition data

---

### 7.2 Scoring Engine Enhancements

#### **RECOMMENDATION 1: Enhanced Logging for Individual Components**

**Current:** Logs totals (e.g., "Additives: 5 (weighted penalty applied)")  
**Recommendation:** Log individual additive penalties

**Example:**
```
Additives:
  E102 (Tartrazine): -1.5 (caution) + -2 (country-specific restricted) = -3.5
  E621 (MSG): -1.5 (caution) = -1.5
  Total: -5.0 (capped at -15)
```

**Impact:** Better verification and debugging

---

#### **RECOMMENDATION 2: Country-Specific Scoring Adjustments**

**Current:** Basic country-specific additive penalties  
**Recommendation:** Expand to full country-specific scoring

**Enhancements:**
1. Country-specific allergen warnings
2. Country-specific maximum permitted levels
3. Country-specific certification recognition
4. Country-specific recyclability requirements (already implemented)

**Impact:** More accurate scoring for users in different countries

---

#### **RECOMMENDATION 3: Enhanced Missing Data Handling**

**Current:** Conservative baselines (12/25)  
**Recommendation:** Calculate estimated scores from available data

**Enhancements:**
1. **Estimated Nutri-Score:** Calculate from nutrition data if Nutri-Score missing
2. **Estimated Eco-Score:** Calculate from packaging, palm oil, origin if Eco-Score missing
3. **Smart Baselines:** Adjust baselines based on available data quality

**Impact:** More accurate scores even when public scores are missing

---

### 7.3 Data Quality Enhancements

#### **RECOMMENDATION 4: Data Completeness Scoring**

**Current:** Quality and completion metrics  
**Recommendation:** Enhanced completeness tracking

**Enhancements:**
1. Track which fields are from which sources
2. Confidence scores for each field
3. Data freshness indicators
4. Source reliability ratings

**Impact:** Better transparency about data quality

---

#### **RECOMMENDATION 5: Duplicate Detection & Resolution**

**Current:** Basic merging with weights  
**Recommendation:** Enhanced duplicate detection

**Enhancements:**
1. Detect when same product from multiple sources
2. Smart conflict resolution (not just weights)
3. Data freshness consideration (newer data preferred)
4. User feedback integration (which source was correct)

**Impact:** Better data quality through intelligent merging

---

### 7.4 Performance Enhancements

#### **RECOMMENDATION 6: Parallel Query Optimization**

**Current:** Tier 1, Tier 2, Tier 3 are parallel  
**Recommendation:** Optimize query order and timeouts

**Enhancements:**
1. Dynamic timeout adjustment based on network speed
2. Prioritize faster APIs
3. Cancel slow queries if fast ones succeed
4. Batch queries where possible

**Impact:** Faster product lookup times

---

#### **RECOMMENDATION 7: Aggressive Caching**

**Current:** Cache in AsyncStorage and SQLite  
**Recommendation:** Enhanced caching strategy

**Enhancements:**
1. Pre-cache popular products
2. Cache country-specific data more aggressively
3. Cache enhancement results (EWG, WWF, B-Corp)
4. Smart cache invalidation (based on data freshness)

**Impact:** Faster lookups, better offline experience

---

### 7.5 User Experience Enhancements

#### **RECOMMENDATION 8: Data Source Transparency**

**Current:** Source logged but not displayed to user  
**Recommendation:** Show data sources in UI

**Enhancements:**
1. Display which databases contributed data
2. Show data completeness indicators
3. Indicate if scores are estimated vs. from public systems
4. Show data freshness

**Impact:** Increased user trust and transparency

---

#### **RECOMMENDATION 9: Enhanced Recall Alerts**

**Current:** Recalls checked but may not be prominently displayed  
**Recommendation:** Prominent recall alerts

**Enhancements:**
1. Banner alert for active recalls
2. Detailed recall information
3. Multi-agency recall aggregation
4. Real-time recall status

**Impact:** Huge trust differentiator - safety awareness

---

### 7.6 Competitive Advantages to Build

#### **ADVANTAGE 1: Superior Geo-Location Support**

**Current:** ✅ Country-specific databases, country-specific OFF instances  
**Enhancement:** Expand to more countries

**Actions:**
1. Add more country-specific regulatory databases
2. Expand country-specific store APIs
3. Add more country-specific nutrition databases

**Competitive Edge:** No competitor has this level of geo-location support

---

#### **ADVANTAGE 2: Comprehensive Recall System**

**Current:** ✅ FDA, Recalls.gov, EU RASFF, CFIA  
**Enhancement:** Expand coverage

**Actions:**
1. Add more country-specific recall systems
2. Real-time recall status
3. Prominent recall alerts in UI

**Competitive Edge:** Most comprehensive recall coverage in the market

---

#### **ADVANTAGE 3: Multi-Source Data Merger**

**Current:** ✅ Intelligent weighted merging  
**Enhancement:** Enhance merging logic

**Actions:**
1. Data freshness consideration
2. User feedback integration
3. Smart conflict resolution

**Competitive Edge:** Best data quality through intelligent merging

---

#### **ADVANTAGE 4: 4-Pillar Scoring System**

**Current:** ✅ Body, Planet, Care, Open (25pts each)  
**Enhancement:** Enhance each pillar

**Actions:**
1. More comprehensive certifications
2. Enhanced country-specific adjustments
3. Better missing data handling

**Competitive Edge:** Most comprehensive scoring system (vs. single-score competitors)

---

## Part 8: Complete Process Flow Diagram

### 8.1 User Scan → TruScore Display

```
┌─────────────────────────────────────────────────────────────┐
│                    USER SCANS BARCODE                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              BARCODE NORMALIZATION                           │
│  • Normalize to primary format                               │
│  • Generate variants (with/without check digit)              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              TIER 0: SQLITE (OFFLINE-FIRST)                  │
│  • Country-specific lookup                                   │
│  • If found: Return immediately                              │
└──────────────────────┬──────────────────────────────────────┘
                       │ (Not found)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              CACHE CHECK                                     │
│  • AsyncStorage cache                                        │
│  • Premium: Larger cache                                     │
│  • If found: Return cached product                           │
└──────────────────────┬──────────────────────────────────────┘
                       │ (Not found)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│        TIER 1: OPEN FACTS FAMILY (PARALLEL)                  │
│  • OFF, OBF, OPFF, OPF queried simultaneously               │
│  • All barcode variants tried                                │
│  • Results merged if multiple found                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│     TIER 1.5: COUNTRY-SPECIFIC (SEQUENTIAL, CONDITIONAL)     │
│  • Only if user in supported country                         │
│  • NZ: Store APIs, FSANZ                                     │
│  • AU: Retailer APIs, FSANZ                                 │
│  • US: USDA (primary override), Walmart, Recalls.gov         │
│  • CA: Health Canada, CFIA                                  │
│  • GB: UK FSA, Tesco                                         │
│  • EU: EFSA, FoodRepo, RASFF                                 │
│  • Results merged with Tier 1                                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│        TIER 2: OFFICIAL SOURCES (PARALLEL)                   │
│  • GS1 Data Source                                           │
│  • USDA (if not US user)                                     │
│  • Results merged with existing                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│        TIER 3: FALLBACK APIS (PARALLEL)                       │
│  • 13+ fallback APIs queried simultaneously                  │
│  • Results merged with existing                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│        TIER 4: WEB SEARCH (GUARANTEED)                        │
│  • Only if no product found yet                              │
│  • DuckDuckGo Instant Answer                                 │
│  • Creates minimal product result                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              DATA MERGING                                    │
│  • Weighted priority system                                  │
│  • Nutrition: Weighted average                                │
│  • Ingredients: Longest list                                  │
│  • Certifications: Union                                     │
│  • Product Name: Highest-weight source                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              ENHANCEMENT LAYER                                │
│  • MVP Enhancements (EWG, WWF, Leaping Bunny)                │
│  • Brand Enrichment (EAN-Search, OpenCorporates, B-Corp)     │
│  • Palm Oil Analysis extraction                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              RECALL CHECKS (NON-BLOCKING)                    │
│  • FDA Recalls (all users)                                   │
│  • Recalls.gov (US users)                                    │
│  • EU RASFF (EU users)                                       │
│  • CFIA (Canadian users)                                      │
│  • 3-second timeout                                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              CACHING                                         │
│  • Save to AsyncStorage                                      │
│  • Save to SQLite (country-specific)                        │
│  • Premium: Larger cache                                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              CONFIDENCE SCORING                              │
│  • Apply confidence score based on source reliability         │
│  • Quality and completion metrics                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              TRUSCORE CALCULATION                            │
│                                                               │
│  BODY PILLAR (25pts):                                        │
│    • Base: Nutri-Score (A=25, B=20, C=15, D=10, E=5)         │
│            OR baseline 12 if missing                         │
│    • Penalties: Additives (weighted, cap -15), Risky tags    │
│                 (-4 each), EWG (-1 to -5), Irritants (-10),  │
│                 Fragrance (-10)                              │
│    • Bonuses: NOVA 1 (+3), NOVA 2 (+1)                       │
│    • Penalties: NOVA 3 (-5), NOVA 4 (-10)                    │
│                                                               │
│  PLANET PILLAR (25pts):                                      │
│    • Base: Eco-Score (A=25, B=20, C=15, D=10, E=5)           │
│            OR baseline 12 if missing                         │
│    • Penalties: Palm oil (-10 or -5 if certified)           │
│    • Bonuses: Recyclable packaging (+5 all, +2 some)         │
│                                                               │
│  Ethics Pillar (25pts):                                        │
│    • Base: 18 (absence of known cruelty)                      │
│    • Bonuses: Fair Trade (+8), Organic (+8), Rainforest      │
│               (+7), MSC/ASC (+8), RSPCA (+6), Vegan (+10),   │
│               UTZ (+7), B-Corp (+5), Non-GMO (+3)            │
│    • Penalties: Cruel parent (-30)                           │
│                                                               │
│  OPEN PILLAR (25pts):                                        │
│    • Base: 25 (full transparency assumed)                    │
│    • Penalties: Hidden terms (-12 for 1-2, -20 for ≥3),    │
│                 No ingredients (→ 5), No origin (-15)         │
│                                                               │
│  FINAL TRUSCORE:                                             │
│    truScore = body + planet + care + open                     │
│    Range: 0-100 points                                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              LOGGING                                         │
│  • Complete scan log with all details                        │
│  • Database queries, results, merging decisions              │
│  • TruScore calculation breakdown                             │
│  • Data sources used, penalties, bonuses                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              RETURN PRODUCT WITH TRUSCORE                    │
│  • Product data with all fields                              │
│  • TruScore (0-100)                                          │
│  • Breakdown (Body, Planet, Care, Open)                      │
│  • Metadata (hasNutriScore, hasEcoScore, hasOrigin)         │
│  • Recalls (if any)                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Part 9: Summary & Key Insights

### 9.1 Database Architecture Strengths

1. **✅ Comprehensive Coverage:** 40+ databases covering all product types
2. **✅ Intelligent Priority System:** 3-tier architecture with weighted merging
3. **✅ Geo-Location Support:** Country-specific databases and OFF instances
4. **✅ Guaranteed Result:** Web search ensures product is always returned
5. **✅ Offline-First:** SQLite provides offline capability

### 9.2 TruScore Engine Strengths

1. **✅ 4-Pillar System:** More comprehensive than single-score competitors
2. **✅ Robust Missing Data Handling:** Conservative baselines prevent unfair penalties
3. **✅ Country-Specific Adjustments:** Additive penalties based on local regulations
4. **✅ Transparent Scoring:** Based on recognized public systems (Nutri-Score, Eco-Score)
5. **✅ Enhancement Layer:** EWG, WWF, Leaping Bunny enrichments

### 9.3 Data Merging Strengths

1. **✅ Weighted Priority:** Government sources prioritized over fallbacks
2. **✅ Intelligent Field Merging:** Different strategies for different fields
3. **✅ Duplicate Resolution:** Union for certifications, longest for ingredients
4. **✅ Quality Metrics:** Weighted averaging for quality/completion scores

### 9.4 Logging Strengths

1. **✅ Comprehensive Coverage:** Logs all major steps
2. **✅ Detailed Breakdown:** TruScore calculation fully logged
3. **✅ Verification Capable:** Can verify data sources and calculations
4. **✅ Structured Format:** Easy to parse and analyze

### 9.5 Areas for Enhancement

1. **⚠️ Expand Regulatory Databases:** Full country-specific databases needed
2. **⚠️ Enhance MVP Databases:** Full B-Corp, Leaping Bunny, WWF databases
3. **⚠️ Enhanced Logging:** Individual component logging (additives, certifications)
4. **⚠️ API Registrations:** EU RASFF, OpenNutrition verification
5. **⚠️ Performance Optimization:** Query timeouts, parallel optimization

---

## Part 10: Conclusion

### 10.1 Current State Assessment

**Database Coverage:** ⭐⭐⭐⭐ (4/5) - Excellent coverage with room for expansion  
**TruScore Engine:** ⭐⭐⭐⭐⭐ (5/5) - Robust, comprehensive, well-designed  
**Data Merging:** ⭐⭐⭐⭐ (4/5) - Intelligent merging with good conflict resolution  
**Logging:** ⭐⭐⭐⭐ (4/5) - Comprehensive but could be more detailed  
**Geo-Location:** ⭐⭐⭐⭐ (4/5) - Good support, can be expanded

**Overall:** ⭐⭐⭐⭐ (4.2/5) - **World-Class Foundation**

### 10.2 Path to World-Leading Status

**Immediate Actions (Next 1-2 Weeks):**
1. Expand regulatory databases (FSANZ, Health Canada, FDA, EU)
2. Enhance MVP databases (B-Corp, Leaping Bunny, WWF)
3. Enhanced logging for individual components

**Short-Term Actions (Next 1-2 Months):**
4. API registrations (EU RASFF, OpenNutrition)
5. Performance optimizations
6. Enhanced missing data handling (estimated scores)

**Long-Term Actions (Next 3-6 Months):**
7. Expand country-specific support
8. User feedback integration
9. Data freshness tracking
10. Enhanced UI transparency

### 10.3 Competitive Advantages

**Current Advantages:**
- ✅ 4-pillar scoring system (vs. single-score competitors)
- ✅ Country-specific database support
- ✅ Comprehensive recall system
- ✅ Multi-source data merger
- ✅ Offline-first architecture

**Potential Advantages (After Enhancements):**
- 🎯 Most comprehensive regulatory database coverage
- 🎯 Most accurate country-specific scoring
- 🎯 Best data quality through intelligent merging
- 🎯 Most transparent scoring system
- 🎯 Fastest lookup times with aggressive caching

---

**Report Generated:** Comprehensive analysis complete  
**Status:** ✅ Ready for implementation of recommendations

---

## Appendix A: Database Quick Reference

### Free APIs (No Key)
- Open Food Facts family (OFF, OBF, OPFF, OPF)
- FSANZ (local DB)
- Health Canada CNF (local DB)
- FoodRepo
- UPCitemdb, Barcode Spider, Go-UPC, Buycott, Open GTIN, Barcode Monster, EAN-Search, UPC Database
- Web Search

### Free APIs (Key Required)
- USDA FoodData Central
- Tesco Labs API
- Walmart Open API
- EAN-Search Brand API (1,000/day)
- OpenCorporates API (free tier)
- GS1 Data Source (membership)

### Placeholder APIs
- UK FSA
- EFSA
- EU RASFF
- CFIA
- OpenNutrition

---

## Appendix B: TruScore Calculation Quick Reference

**Body Pillar:**
- Base: Nutri-Score (A=25, B=20, C=15, D=10, E=5) OR 12
- Penalties: Additives (weighted, cap -15), Risky tags (-4 each), EWG (-1 to -5), Irritants (-10), Fragrance (-10)
- Bonuses: NOVA 1 (+3), NOVA 2 (+1)
- Penalties: NOVA 3 (-5), NOVA 4 (-10)

**Planet Pillar:**
- Base: Eco-Score (A=25, B=20, C=15, D=10, E=5) OR 12
- Penalties: Palm oil (-10 or -5 if certified)
- Bonuses: Recyclable packaging (+5 all, +2 some)

**Ethics Pillar:**
- Base: 18
- Bonuses: Fair Trade (+8), Organic (+8), Rainforest (+7), MSC/ASC (+8), RSPCA (+6), Vegan (+10), UTZ (+7), B-Corp (+5), Non-GMO (+3)
- Penalties: Cruel parent (-30)

**Open Pillar:**
- Base: 25
- Penalties: Hidden terms (-12 for 1-2, -20 for ≥3), No ingredients (→ 5), No origin (-15)

**Final:** `truScore = body + planet + care + open` (0-100)

---

**End of Report**

