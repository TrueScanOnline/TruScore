# Database Query Flow - Complete Explanation

## Terminology Clarification

The app uses **BOTH** "Tiers" and "Phases" - they refer to the same concept but at different layers:

- **"TIERS"** = Used in `TruScoreOptimizedDatabase` (internal database organization)
- **"PHASES"** = Used in `productServiceOptimized` (high-level service flow)

**They are the same thing!** Just different naming conventions in different files.

---

## Complete Database Query Flow

### High-Level Flow (productServiceOptimized.ts)

```
User Scans Barcode
    ↓
1. Check Cache/SQLite (instant - <100ms)
    ↓ (if not found)
2. PHASE 1: Fast Sources (<2s)
    - Open Food Facts
    - Open Beauty Facts
    ↓ (if good data found)
3. Display Product Immediately (fast UI)
    ↓ (in background)
4. PHASE 2: Enhancement Sources (background)
    - Calls TruScoreOptimizedDatabase.queryAllDatabases()
    ↓ (in background)
5. PHASE 3: Fallback Sources (background, if needed)
    - Calls TruScoreOptimizedDatabase.queryAllDatabases()
    ↓
6. Merge all results progressively
    ↓
7. Calculate TruScore
    ↓
8. Display on Product Information Page
```

---

## Detailed Database Query Organization (TruScoreOptimizedDatabase)

When `queryAllDatabases()` is called, it organizes databases into **3 TIERS**:

### **TIER 1: Fast Sources (0.5-2s) - Display First**
**Purpose**: Get product data quickly for immediate display

**Databases**:
- Open Food Facts (OFF)
- Open Beauty Facts (OBF)
- Open Pet Food Facts (OPFF)
- Open Products Facts (OPF)

**Query Method**: `queryOpenFactsParallel()`
- All 4 Open Facts databases queried in parallel
- First result triggers progressive display

---

### **TIER 2: Enhancement Sources (2-5s) - Enhance Data**
**Purpose**: Add more complete data from reliable sources

**Sub-groups**:

#### 2a. Local-First (`queryLocalFirstParallel`)
**Country-Specific Databases** (prioritized by user country):
- **NZ Users**: FSANZ (NZFCD), NZ Store APIs
- **AU Users**: FSANZ (AFCD), AU Retailers
- **US Users**: USDA, Health Canada (if applicable)
- **CA Users**: Health Canada
- **GB Users**: UK FSA
- **EU Users**: EFSA

**Name-Based Queries** (if product name discovered):
- FSANZ (requires product name)
- FoodAtlas (requires product name)

#### 2b. Gold Standard (`queryGoldStandardParallel`)
**High-Quality Government Databases**:
- GS1 (if API key configured)
- USDA (US users only)
- Health Canada (CA users only)
- UK FSA (GB users only)
- EFSA (EU users only)

#### 2c. Enhancements (`queryEnhancementsParallel`)
**Nutrition & Enhancement APIs**:
- Edamam (if API key configured)
- Nutritionix (if API key configured)
- Spoonacular (if API key configured)
- FoodRepo (if API key configured)
- Walmart Open API (if API key configured)

---

### **TIER 3: Fallback Sources (2-10s) - Maximum Coverage**
**Purpose**: Fill gaps with additional data sources

**Databases**:
- Datakick
- OpenEAN
- Product Open Data
- UPCitemdb
- EAN-Search
- Barcode Spider
- GoUpc
- Buycott
- OpenGtin
- Barcode Monster
- UPCDatabase
- Barcode Lookup
- EANData
- Best Buy (if API key configured)
- Barcode Lookup Com (if API key configured)
- World Food Database

**Query Method**: `queryFallbacksParallel()`
- All fallback databases queried in parallel
- Circuit breaker prevents querying failing APIs repeatedly

---

## Query Execution Strategy

### **ALL TIERS RUN IN PARALLEL**

The key insight: **All 3 tiers start simultaneously** - there's no sequential waiting!

```
Time 0ms:  All queries fire at once
    ├─ TIER 1: OFF, OBF, OPFF, OPF
    ├─ TIER 2: Local, Gold Standard, Enhancements
    └─ TIER 3: All fallback databases

Time 500ms: First TIER 1 result arrives → Display immediately
Time 2000ms: More TIER 1 results → Merge progressively
Time 3000ms: TIER 2 results start arriving → Merge progressively
Time 5000ms: TIER 3 results start arriving → Merge progressively
Time 8000ms: All queries complete → Final merged product
```

### Progressive Merging

As each tier completes:
1. Results are merged with existing product
2. `onProductUpdate` callback is called
3. UI updates progressively (if callback provided)
4. Product information page receives updates

---

## Source Weighting System

Each database has a **weight** that determines its priority during merging:

### Weight Values (from `getTruScoreSourceWeights()`)

**Highest Weight (0.50-0.45)**:
- `openfoodfacts`: 0.50 (highest - most reliable)
- `usda`: 0.45 (US government - very reliable)
- `health_canada`: 0.45 (CA government - very reliable)
- `uk_fsa`: 0.45 (GB government - very reliable)
- `efsa`: 0.45 (EU government - very reliable)
- `fsanz`: 0.45 (AU/NZ government - very reliable)

**High Weight (0.40-0.35)**:
- `gs1`: 0.40 (official barcode registry)
- `openbeautyfacts`: 0.40
- `openpetfoodfacts`: 0.40
- `spoonacular`: 0.35
- `nutritionix`: 0.35
- `edamam`: 0.35

**Medium Weight (0.30-0.25)**:
- `foodrepo`: 0.30
- `walmart`: 0.30
- `datakick`: 0.30
- `barcode_lookup`: 0.25
- `barcode_lookup_com`: 0.25
- `upcitemdb`: 0.25
- `ean_search`: 0.25

**Lower Weight (0.20-0.10)**:
- `openean`: 0.20
- `product_open_data`: 0.20
- `barcode_spider`: 0.20
- `goupc`: 0.20
- `buycott`: 0.20
- `opengtin`: 0.20
- `barcode_monster`: 0.20
- `upc_database`: 0.20
- `eandata`: 0.20
- `best_buy`: 0.20
- `web_search`: 0.10 (lowest - last resort)

### How Weights Are Used

During merging (`mergeProducts()`):
1. **Base Product Selection**: Product with highest combined score (TruScore completeness + source weight) is selected as base
2. **Field Merging**: 
   - Nutrition: Weighted average from all sources
   - Ingredients: Longest/most complete version
   - Certifications: Merged from all sources
   - Images: Best quality image
   - Categories: Most specific categories
3. **Source Priority**: Higher weight sources override lower weight sources for conflicting data

---

## Data Merging Process

### Merge Strategy (`mergeProducts()`)

1. **Select Base Product**:
   - Calculate "TruScore Completeness" for each product
   - Calculate "Combined Score" = (TruScore Completeness × 0.6) + (Source Weight × 0.4)
   - Select product with highest combined score as base

2. **Merge Fields**:
   - **Nutrition**: Weighted average (by source weight)
   - **Ingredients**: Longest text (most complete)
   - **Certifications**: Union of all certifications
   - **Images**: Best quality (highest resolution)
   - **Categories**: Most specific (longest category path)
   - **Brands**: Merged from all sources
   - **Labels**: Merged from all sources

3. **Normalization**:
   - Nutrition values normalized to per-100g
   - Units standardized
   - Text fields cleaned and normalized

---

## TruScore Calculation Flow

### How Product Information Page Receives Data

```
1. productServiceOptimized.fetchProductOptimized()
    ↓
2. Queries databases (Phase 1, 2, 3)
    ↓
3. Merges all results progressively
    ↓
4. Calls processProductFast()
    ↓
5. Calls calculateTrustScore() from utils/trustScore.ts
    ↓
6. calculateTrustScore() calls truscoreEngine/index.ts
    ↓
7. truscoreEngine calculates 4 pillars:
    - Body Pillar (bodyPillar.ts)
    - Planet Pillar (planetPillar.ts)
    - Ethics Pillar (ethicsPillar.ts)
    - Open Pillar (openPillar.ts)
    ↓
8. Returns ProductWithTrustScore with:
    - trust_score: number (0-100)
    - trust_score_breakdown: { Body, Planet, Ethics, Open }
    ↓
9. Product Information Page receives ProductWithTrustScore
    ↓
10. Displays:
    - TruScore (0-100)
    - Pillar scores (0-25 each)
    - All product cards (Nutrition, Ingredients, Certifications, etc.)
```

### TruScore Calculation Details

**Location**: `src/lib/truscoreEngine/index.ts`

**Process**:
1. **Body Pillar** (0-25 points):
   - Nutri-Score grade (from OFF)
   - Additives (IARC risk assessment)
   - Risky tags
   - Universal irritants
   - NOVA group
   - EWG rating (household products)

2. **Planet Pillar** (0-25 points):
   - Eco-Score grade (from OFF)
   - Palm oil presence
   - Recyclable packaging
   - Packaging eco-cost
   - Non-animal farming impact

3. **Ethics Pillar** (0-25 points):
   - Certifications (Fairtrade, Organic, etc.)
   - BBFAW animal cruelty tiers
   - Labor violations
   - Product/brand recall history

4. **Open Pillar** (0-25 points):
   - Ingredients disclosure
   - Hidden terms (fragrance, flavor, proprietary blends)
   - Origin transparency
   - Brand ownership transparency

**Final TruScore** = Body + Planet + Ethics + Open (0-100)

---

## Product Information Page Data Flow

### Cards and Their Data Sources

1. **TruScore Card**:
   - Data: `product.trust_score` and `product.trust_score_breakdown`
   - Source: Calculated by `truscoreEngine` from merged product data

2. **Nutrition Card**:
   - Data: `product.nutriments` (merged from all sources)
   - Source: Weighted average from all databases with nutrition data

3. **Ingredients Card**:
   - Data: `product.ingredients_text` (longest/most complete)
   - Source: Best source (usually OFF or government database)

4. **Certifications Card**:
   - Data: `product.labels_tags` (merged from all sources)
   - Source: Union of all databases

5. **Eco-Score Card**:
   - Data: `product.ecoscore_grade` and `product.ecoscore_score`
   - Source: Primarily from OFF (highest weight)

6. **Nutri-Score Card**:
   - Data: `product.nutriscore_grade` and `product.nutriscore_score`
   - Source: Primarily from OFF (highest weight)

7. **Additives Card**:
   - Data: `product.additives_tags` (analyzed for IARC risks)
   - Source: Merged from all sources

8. **Origin Card**:
   - Data: `product.origins_tags` or `product.manufacturing_places_tags`
   - Source: Merged from all sources (OFF, government databases)

---

## Summary

### Query Organization:
- **3 TIERS** (in TruScoreOptimizedDatabase) = **3 PHASES** (in productServiceOptimized)
- All tiers/phases run **in parallel** (not sequential)
- Results merge **progressively** as they arrive

### Source Priority:
- **Highest**: Open Food Facts (0.50), Government databases (0.45)
- **High**: GS1 (0.40), Nutrition APIs (0.35)
- **Medium**: Barcode lookup APIs (0.25-0.30)
- **Low**: Fallback APIs (0.20), Web search (0.10)

### Merging:
- Base product = highest combined score (TruScore completeness + source weight)
- Fields merged using weighted averages or best available data
- Progressive updates sent to UI as data arrives

### TruScore:
- Calculated from merged product data
- 4 pillars (Body, Planet, Ethics, Open) = 0-100 total
- Each pillar uses specific data fields from merged product

---

## Key Files

- **Database Query**: `src/data/databases/truScoreOptimizedDatabase.ts`
- **Service Flow**: `src/services/productServiceOptimized.ts`
- **Merging Logic**: `src/services/productDataMerger.ts`
- **TruScore Calculation**: `src/lib/truscoreEngine/index.ts`
- **Source Weights**: `src/data/databases/truScoreOptimizedDatabase.ts` (getTruScoreSourceWeights method)
