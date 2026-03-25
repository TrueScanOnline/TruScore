# Barcode Data Flow v1.0
**Complete Information Flow from Barcode Scan to Product Information Display**

**Version:** 1.0  
**Date:** December 3, 2024  
**Status:** Complete Documentation  
**Author:** TrueScan Development Team

---

## 📖 Document Purpose

This document explains in simple terms the entire flow of information from when a user scans a barcode at the store through to the Product Information Page displaying all cards and modals. It covers:

- How the app queries databases
- The order and priority of queries
- How data is merged from multiple sources
- How each card receives its data
- How TruScore is calculated (all 4 pillars)
- How missing information is handled
- How score highlights are generated
- How allergens and additives are displayed

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Step-by-Step Flow](#step-by-step-flow)
3. [Database Access](#database-access)
4. [Query Order and Priority](#query-order-and-priority)
5. [Data Merging and Weighting](#data-merging-and-weighting)
6. [Product Information Page Cards](#product-information-page-cards)
7. [TruScore Calculation](#truscore-calculation)
8. [Missing Information Handling](#missing-information-handling)
9. [Score Highlights Logic](#score-highlights-logic)
10. [Allergens & Additives Logic](#allergens--additives-logic)

---

## 🎯 Overview

This document explains the complete flow of information from when a user scans a barcode at the store through to the Product Information Page displaying all cards and modals. It covers:

- **Complete flow:** From barcode scan to Product Information Page
- **All databases:** 30+ databases with query methods
- **Query order:** Step-by-step query logic and priority
- **Data merging:** How data from multiple sources is combined
- **Weighting system:** How source weights are applied
- **Card data:** How each card receives its specific data
- **TruScore calculation:** All 4 pillars explained in detail
- **Missing data handling:** How the app handles incomplete information
- **Score highlights:** How green/red flags are generated
- **Allergens & Additives:** How items are determined and displayed

---

## 📱 Step-by-Step Flow

### Step 1: User Scans Barcode

**Location:** `app/index.tsx` (Scan Screen)

**What Happens:**
1. User opens the app and points camera at product barcode
2. Camera captures barcode using `expo-camera`
3. Barcode is normalized (converted to standard format: EAN-13, EAN-8, UPC-A, etc.)
4. Multiple barcode variants are generated (e.g., EAN-8 → EAN-13)
5. Primary barcode is selected (longest valid format)

**Barcode Normalization:**
- EAN-8 (8 digits) → Converted to EAN-13
- UPC-A (12 digits) → Converted to EAN-13
- EAN-13 (13 digits) → Used as-is
- Invalid formats → Rejected

**Example:**
- Scanned: `1234567` (EAN-8)
- Normalized: `0001234567` (EAN-13)
- Variants: `['0001234567', '1234567']`
- Primary: `0001234567`

---

### Step 2: Initial Product Lookup

**Location:** `src/services/productService.ts` → `fetchProduct()`

**Query Order (Priority):**

1. **SQLite Database** (Offline-First, Country-Specific)
   - **Speed:** Instant (local database)
   - **Coverage:** Country-specific products only
   - **Purpose:** Fast offline access for common products
   - **Location:** `src/services/sqliteProductDatabase.ts`
   - **Result:** If found, product is returned immediately (no further queries)

2. **Cache** (Premium/Free)
   - **Speed:** Very fast (in-memory/AsyncStorage)
   - **Coverage:** Previously queried products
   - **Purpose:** Avoid redundant API calls
   - **Location:** `src/services/cacheService.ts`
   - **Result:** If found and not low-quality, product is returned

3. **User-Contributed Products** (Global Community)
   - **Speed:** Fast (Vercel backend)
   - **Coverage:** Products submitted by users worldwide
   - **Purpose:** Prioritize community data
   - **Location:** `src/services/userContributedProductsService.ts`
   - **Sources:**
     - Local manual products (AsyncStorage)
     - Vercel backend (`/api/manual-products`)
   - **Result:** If found, product is returned

4. **Early Product Name Discovery** (NEW)
   - **Speed:** Fast (parallel quick queries)
   - **Purpose:** Get product name early to enable name-based queries
   - **Location:** `src/services/productNameDiscovery.ts`
   - **Sources (in parallel):**
     - SQLite (if not already checked)
     - Cache (if not already checked)
     - UPCitemdb (2s timeout)
     - Barcode Spider (2s timeout)
   - **Result:** Product name (if found) enables FSANZ and FoodAtlas queries

---

### Step 3: Comprehensive Database Query

**Location:** `src/data/databases/truScoreOptimizedDatabase.ts` → `queryAllDatabases()`

**This is the core of the app - queries ALL databases in parallel phases:**

#### Phase 0: Local-First Queries (Geo-Located Priority)

**Purpose:** Prioritize local government databases and store APIs for better geo-location support

**Databases Queried (in parallel):**

**Local Government Databases:**
- **FSANZ (NZ/AU)** - By product name (if available early)
  - NZFCD (New Zealand Food Composition Database)
  - AFCD (Australian Food Composition Database)
  - **Query Method:** Product name matching with variations
  - **Weight:** 0.50 (highest priority)
  
- **USDA (US)** - By barcode
  - FoodData Central (official US branded foods)
  - **Weight:** 0.50
  
- **Health Canada (CA)** - By barcode
  - Canadian Nutrient File
  - **Weight:** 0.50
  
- **UK FSA (GB)** - By barcode
  - UK Food Standards Agency database
  - **Weight:** 0.50
  
- **EFSA (EU)** - By barcode
  - European Food Safety Authority database
  - **Weight:** 0.50

**Local Store APIs:**
- **NZ Stores** (Woolworths NZ, Pak'nSave, New World)
  - **Weight:** 0.35
  
- **AU Retailers** (Woolworths AU, Coles, IGA)
  - **Weight:** 0.35
  
- **Tesco (GB)** - Tesco Labs API
  - **Weight:** 0.35
  
- **Walmart (US)** - Walmart Open API
  - **Weight:** 0.35
  
- **FoodRepo (US)** - FoodRepo API
  - **Weight:** 0.35

**Early Name-Based Queries:**
- **FoodAtlas** - By product name (if available early)
  - Global nutrition database (server-side API)
  - **Weight:** 0.35

---

#### Phase 1: Gold Standard + Open Facts (Parallel)

**Purpose:** Query official and community databases

**Gold Standard Databases (in parallel):**
- **GS1 Data Source** - Official barcode verification
  - **Weight:** 0.45
  - **Requires:** API key (optional)

**Open Facts Databases (ALL queried in parallel):**
- **Open Food Facts** - Food and drinks (2M+ products)
  - **Weight:** 0.45
  - **Coverage:** Global, community-driven
  
- **Open Beauty Facts** - Cosmetics and personal care
  - **Weight:** 0.40
  
- **Open Pet Food Facts** - Pet food specifically
  - **Weight:** 0.40
  
- **Open Products Facts** - General products (electronics, household, tools)
  - **Weight:** 0.35

---

#### Phase 2: Nutrition APIs + Additional Enhancements (Parallel)

**Purpose:** Enhance nutrition data and fill gaps

**Nutrition APIs (in parallel):**
- **Edamam** - Food database (10K requests/month)
  - **Weight:** 0.30
  
- **Nutritionix** - Nutrition-focused (100/day)
  - **Weight:** 0.30
  
- **Spoonacular** - Food-focused (150 points/day)
  - **Weight:** 0.30

**Additional Enhancements:**
- **FooDB** - Nutrition enhancement (free, no API key)
  - **Weight:** 0.30

**Product Name Extraction:**
- Product names are extracted from enhancement results
- Used for later name-based queries (FSANZ, FoodAtlas)

---

#### Phase 3: Fallbacks (Conditional)

**Purpose:** Fill data gaps or find products when previous phases fail

**When Executed:**
- If no products found in previous phases
- OR if existing products have incomplete data (missing nutrition, ingredients, or name)

**Fallback Databases (in parallel):**
- **Datakick** - Community-driven (free, no API key)
  - **Weight:** 0.25
  
- **UPCitemdb** - Alcohol, household, electronics (free tier)
  - **Weight:** 0.20
  
- **EAN-Search** - 1B+ products (free tier)
  - **Weight:** 0.20
  
- **Barcode Spider** - General products (free)
  - **Weight:** 0.20
  
- **GoUPC** - Verified API
  - **Weight:** 0.20
  
- **Buycott** - Verified API
  - **Weight:** 0.20
  
- **Open GTIN** - Free API
  - **Weight:** 0.20
  
- **Barcode Monster** - Free API
  - **Weight:** 0.20
  
- **UPC Database** - 4.3M+ products (free tier: 100/day)
  - **Weight:** 0.20
  
- **Barcode Lookup** - Additional source (free tier: 100/day)
  - **Weight:** 0.20
  
- **EANData** - Basic validation (free tier: 100/day)
  - **Weight:** 0.20
  
- **Best Buy** - Electronics focus (free tier: 5K/day)
  - **Weight:** 0.20

**Note:** Web search is handled separately in `productService.ts` as absolute last resort (only if all other sources fail).

---

#### Phase 4: Product Name Queries (CRITICAL for FSANZ)

**Location:** `truScoreOptimizedDatabase.ts` → `queryByNameForTruScore()`

**When Executed:**
- ALWAYS executed after product is found (or if we have a product name)
- This is how we access FSANZ databases (they don't have barcodes)

**Databases Queried (in parallel):**

**FSANZ (NZ/AU) - By Product Name:**
- **NZFCD** - New Zealand Food Composition Database
  - Queries both NZ and AU databases for maximum coverage
  - Uses product name variations for better matching
  - **Weight:** 0.50
  
- **AFCD** - Australian Food Composition Database
  - Queries both AU and NZ databases for maximum coverage
  - **Weight:** 0.50

**Local SQLite Enhancements:**
- **NZFCD Enhancement** (NZ users)
  - **Weight:** 0.50
  
- **AFCD Enhancement** (AU users)
  - **Weight:** 0.50

**Global Nutrition Enhancements:**
- **FooDB** - Nutrition enhancement
  - **Weight:** 0.30
  
- **FoodAtlas** - By product name (server-side API)
  - **Weight:** 0.35

**Result:** Additional products/enhancements merged into main product

---

### Step 4: Data Merging

**Location:** `src/services/productDataMerger.ts` → `mergeProducts()`

**Purpose:** Combine data from multiple databases into a single, best-quality product

**Merging Strategy:**

1. **Score Each Product:**
   - **TruScore Completeness (60%):** How many TruScore-critical fields are present
   - **Source Weight (40%):** Database trustworthiness
   - **Combined Score:** `(completeness / 100) * 0.6 + sourceWeight * 0.4`

2. **Select Base Product:**
   - Product with highest combined score becomes base
   - All other products are merged into this base

3. **Merge Fields (Weighted Priority):**

**Product Name:**
- Use best available (longest, most specific)

**Brand:**
- Use best available

**Image:**
- Use first non-null image URL found

**Nutrition Data:**
- **Weighted average** of all sources
- Formula: `(value1 * weight1 + value2 * weight2 + ...) / (weight1 + weight2 + ...)`
- Normalized to per-100g format

**Ingredients:**
- Use **longest** ingredients list (most complete)

**Certifications:**
- **Union** of all certifications (no duplicates)
- Higher-weight sources take priority

**Labels Tags:**
- **Union** of all labels (Ethics Pillar - certifications)

**Ingredients Analysis Tags:**
- **Union** of all analysis tags (Body/Planet pillars - risk tags)

**Packagings:**
- **Union** of all packaging items (Planet pillar - recyclability)
- Deduplicated by material + shape + recycling status

**Origins Tags:**
- **Union** of all origins (Open pillar - transparency)

**Manufacturing Places Tags:**
- **Union** of all manufacturing places (Open pillar - transparency)

**Additives Tags:**
- **Union** of all additives (Body pillar - additive penalties)

**Allergens Tags:**
- **Union** of all allergens (safety information)

**Source Weights (Priority Order):**

| Database | Weight | Priority |
|----------|-------|----------|
| FSANZ (NZ/AU) | 0.50 | Highest |
| USDA | 0.50 | Highest |
| Health Canada | 0.50 | Highest |
| UK FSA | 0.50 | Highest |
| EFSA | 0.50 | Highest |
| GS1 | 0.45 | High |
| Open Food Facts | 0.45 | High |
| Open Beauty Facts | 0.40 | High |
| Open Pet Food Facts | 0.40 | High |
| Store APIs | 0.35 | Medium |
| Nutrition APIs | 0.30 | Medium |
| Fallback APIs | 0.20 | Low |
| Web Search | 0.10 | Lowest |

---

### Step 5: Product Enhancement

**Location:** `src/services/productService.ts` → After merging

**Enhancements Applied:**

1. **Palm Oil Analysis**
   - Extracted from ingredients text
   - Checks for palm oil and variations
   - Determines sustainability status
   - **Location:** `src/services/openFoodFacts.ts` → `extractPalmOilAnalysis()`

2. **Confidence Score**
   - Calculated based on data completeness
   - **Location:** `src/utils/confidenceScoring.ts`

3. **Data Completeness**
   - Calculated for logging and quality metrics
   - **Location:** `src/utils/dataCompleteness.ts`

---

### Step 6: TruScore Calculation

**Location:** `src/lib/truscoreEngine.ts` → `calculateTruScore()`

**Purpose:** Calculate 0-100 TruScore based on 4 pillars (25 points each)

**Input:** Merged product with all data from all databases

**Output:** `TruScoreResult` with:
- `truscore`: 0-100 overall score
- `breakdown`: { Body, Planet, Care, Open } (each 0-25)
- `hasNutriScore`: Boolean
- `hasEcoScore`: Boolean
- `hasOrigin`: Boolean
- `insights`: Array of insights (if user preferences provided)

---

### Step 7: Navigation to Result Screen

**Location:** `app/index.tsx` → After product fetch

**What Happens:**
1. Product data is passed to Result Screen
2. Navigation: `navigation.navigate('Result', { barcode })`
3. Result Screen loads: `app/result/[barcode].tsx`

---

### Step 8: Result Screen Display

**Location:** `app/result/[barcode].tsx`

**What Happens:**
1. Product data is received from navigation params
2. TruScore is calculated (if not already calculated)
3. All cards are rendered based on available data
4. Each card receives specific data fields from the merged product

---

## 🗄️ Database Access

### Complete Database List

The app has access to **30+ databases** organized by priority:

#### Tier 1: Gold Standard (Government Databases)
- **FSANZ (NZ/AU)** - Food Standards Australia New Zealand
  - NZFCD (New Zealand Food Composition Database)
  - AFCD (Australian Food Composition Database)
  - **Query Method:** Product name (not barcode)
  - **Weight:** 0.50
  
- **USDA FoodData Central (US)**
  - Official US branded foods database
  - **Query Method:** Barcode
  - **Weight:** 0.50
  - **Requires:** API key (optional)
  
- **Health Canada CNF (CA)**
  - Canadian Nutrient File
  - **Query Method:** Barcode
  - **Weight:** 0.50
  
- **UK FSA (GB)**
  - UK Food Standards Agency
  - **Query Method:** Barcode
  - **Weight:** 0.50
  
- **EFSA (EU)**
  - European Food Safety Authority
  - **Query Method:** Barcode
  - **Weight:** 0.50
  
- **GS1 Data Source (Global)**
  - Official barcode verification
  - **Query Method:** Barcode
  - **Weight:** 0.45
  - **Requires:** API key (optional)

#### Tier 2: Open Facts (Community Databases)
- **Open Food Facts** - Food and drinks (2M+ products)
  - **Query Method:** Barcode
  - **Weight:** 0.45
  
- **Open Beauty Facts** - Cosmetics and personal care
  - **Query Method:** Barcode
  - **Weight:** 0.40
  
- **Open Pet Food Facts** - Pet food specifically
  - **Query Method:** Barcode
  - **Weight:** 0.40
  
- **Open Products Facts** - General products (electronics, household, tools)
  - **Query Method:** Barcode
  - **Weight:** 0.35

#### Tier 3: Store APIs (Regional)
- **NZ Stores:** Woolworths NZ, Pak'nSave, New World
  - **Query Method:** Barcode
  - **Weight:** 0.35
  
- **AU Retailers:** Woolworths AU, Coles, IGA
  - **Query Method:** Barcode
  - **Weight:** 0.35
  
- **Tesco (GB)** - Tesco Labs API
  - **Query Method:** Barcode
  - **Weight:** 0.35
  
- **Walmart (US)** - Walmart Open API
  - **Query Method:** Barcode
  - **Weight:** 0.35
  
- **FoodRepo (US)** - FoodRepo API
  - **Query Method:** Barcode
  - **Weight:** 0.35

#### Tier 4: Nutrition APIs (Global)
- **Edamam** - Food database (10K requests/month)
  - **Query Method:** Barcode
  - **Weight:** 0.30
  - **Requires:** API key (optional)
  
- **Nutritionix** - Nutrition-focused (100/day)
  - **Query Method:** Barcode
  - **Weight:** 0.30
  - **Requires:** API key (optional)
  
- **Spoonacular** - Food-focused (150 points/day)
  - **Query Method:** Barcode
  - **Weight:** 0.30
  - **Requires:** API key (optional)

#### Tier 5: Name-Based Queries (Global)
- **FoodAtlas** - Server-side nutrition API (free, open source)
  - **Query Method:** Product name
  - **Weight:** 0.35
  
- **FooDB** - Nutrition enhancement (free, no API key)
  - **Query Method:** Product name
  - **Weight:** 0.30

#### Tier 6: Fallback APIs (Global)
- **Datakick** - Community-driven (free, no API key)
  - **Query Method:** Barcode
  - **Weight:** 0.25
  
- **UPCitemdb** - Alcohol, household, electronics (free tier)
  - **Query Method:** Barcode
  - **Weight:** 0.20
  
- **EAN-Search** - 1B+ products (free tier)
  - **Query Method:** Barcode
  - **Weight:** 0.20
  - **Requires:** API key (optional)
  
- **Barcode Spider** - General products (free)
  - **Query Method:** Barcode
  - **Weight:** 0.20
  
- **GoUPC** - Verified API
  - **Query Method:** Barcode
  - **Weight:** 0.20
  
- **Buycott** - Verified API
  - **Query Method:** Barcode
  - **Weight:** 0.20
  
- **Open GTIN** - Free API
  - **Query Method:** Barcode
  - **Weight:** 0.20
  
- **Barcode Monster** - Free API
  - **Query Method:** Barcode
  - **Weight:** 0.20
  
- **UPC Database** - 4.3M+ products (free tier: 100/day)
  - **Query Method:** Barcode
  - **Weight:** 0.20
  - **Requires:** API key (optional)
  
- **Barcode Lookup** - Additional source (free tier: 100/day)
  - **Query Method:** Barcode
  - **Weight:** 0.20
  - **Requires:** API key (optional)
  
- **EANData** - Basic validation (free tier: 100/day)
  - **Query Method:** Barcode
  - **Weight:** 0.20
  - **Requires:** API key (optional)
  
- **Best Buy** - Electronics focus (free tier: 5K/day)
  - **Query Method:** Barcode
  - **Weight:** 0.20
  - **Requires:** API key (optional)

#### Tier 7: Last Resort
- **Web Search** - DuckDuckGo Instant Answer API + Web Scraping
  - **Query Method:** Barcode + Product name (if available)
  - **Weight:** 0.10
  - **Purpose:** Ensures we ALWAYS return something (never null)

---

## 🔄 Query Order and Priority

### Overall Query Flow

```
1. SQLite (instant, offline-first)
   ↓ (if not found)
2. Cache (very fast, previously queried)
   ↓ (if not found or low-quality)
3. User-Contributed Products (community data)
   ↓ (if not found)
4. Early Product Name Discovery (parallel quick queries)
   ↓
5. Phase 0: Local-First Queries (parallel)
   ├─ Local Government DBs (FSANZ, USDA, Health Canada, UK FSA, EFSA)
   ├─ Local Store APIs (NZ, AU, GB, US stores)
   └─ Early Name-Based Queries (FoodAtlas)
   ↓
6. Phase 1: Gold Standard + Open Facts (parallel)
   ├─ GS1 Data Source
   └─ Open Facts (OFF, OBF, OPFF, OPF)
   ↓
7. Phase 2: Nutrition APIs + Enhancements (parallel)
   ├─ Edamam, Nutritionix, Spoonacular
   └─ FooDB
   ↓
8. Phase 3: Fallbacks (if no results OR incomplete data)
   └─ All fallback APIs (Datakick, UPCitemdb, EAN-Search, etc.)
   ↓
9. Phase 4: Product Name Queries (ALWAYS, if product name available)
   ├─ FSANZ (by name with variations)
   ├─ FoodAtlas (by name)
   └─ Local SQLite enhancements (NZFCD, AFCD)
   ↓
10. Web Search (absolute last resort, only if all above fail)
```

### Priority Logic

**Geo-Location Priority:**
- User's country is detected via `getUserCountryCode()`
- Local government databases queried FIRST for that country
- Local store APIs queried FIRST for that country
- Example: NZ user → FSANZ NZ, NZ stores queried before global databases

**Data Quality Priority:**
- Government databases (highest trust) → Weight 0.50
- Open Facts (community-verified) → Weight 0.35-0.45
- Store APIs (retailer data) → Weight 0.35
- Nutrition APIs (specialized) → Weight 0.30
- Fallback APIs (general) → Weight 0.20
- Web Search (last resort) → Weight 0.10

**Completeness Priority:**
- Products with more TruScore-critical fields prioritized
- 60% weight on TruScore completeness
- 40% weight on source trustworthiness

---

## 🔀 Data Merging and Weighting

### Merging Process

**Location:** `src/services/productDataMerger.ts`

**Step 1: Score Each Product**

For each product from different databases:
1. Calculate **TruScore Completeness** (0-100):
   - Body Pillar fields: Nutri-Score (10pts), NOVA (5pts), Nutrition (5pts), Additives (3pts), Analysis tags (2pts)
   - Planet Pillar fields: Eco-Score (10pts), Palm oil (5pts), Packaging (5pts), Palm oil tag (5pts)
   - Ethics Pillar fields: Labels/certifications (15pts), Certifications array (10pts)
   - Open Pillar fields: Ingredients text (15pts), Origins (5pts), Manufacturing (5pts)

2. Get **Source Weight** (0-1):
   - From `DEFAULT_SOURCE_WEIGHTS` table
   - Government DBs: 0.50
   - Open Facts: 0.35-0.45
   - Store APIs: 0.35
   - Nutrition APIs: 0.30
   - Fallback APIs: 0.20
   - Web Search: 0.10

3. Calculate **Combined Score**:
   ```
   combinedScore = (completeness / 100) * 0.6 + sourceWeight * 0.4
   ```

**Step 2: Select Base Product**

- Product with highest combined score becomes base
- All other products merged into this base

**Step 3: Merge Fields**

**Simple Fields (Best Available):**
- Product name: Longest/most specific
- Brand: Best available
- Image: First non-null URL

**Complex Fields (Weighted/Union):**

**Nutrition (Weighted Average):**
```
mergedNutrient = (value1 * weight1 + value2 * weight2 + ...) / (weight1 + weight2 + ...)
```

**Ingredients (Longest):**
- Use longest ingredients list (most complete)

**Tags (Union):**
- Labels tags: Union (no duplicates)
- Ingredients analysis tags: Union
- Additives tags: Union
- Allergens tags: Union
- Origins tags: Union
- Manufacturing places tags: Union

**Packagings (Union with Deduplication):**
- Deduplicated by: `material_shape_recycling`
- No duplicate packaging items

**Certifications (Union with Priority):**
- Higher-weight sources processed first
- No duplicate certifications

---

## 📊 Product Information Page Cards

**Location:** `app/result/[barcode].tsx`

Each card receives specific data from the merged product:

### 1. Hero Section (Product Image & Name)

**Data Source:**
- `product.image_url` or `product.image_front_url` or `product.image_front_small_url`
- `product.product_name` or `product.product_name_en`
- `product.brands`

**Display Logic:**
- Shows product image (if available)
- Shows product name (if available)
- Shows brand (if available)
- Falls back to "Unknown Product" if no name

---

### 2. TruScore Card

**Data Source:**
- `product.trust_score` (0-100)
- `product.trust_score_breakdown` ({ Body, Planet, Care, Open })
- `product._truscore_metadata` ({ hasNutriScore, hasEcoScore, hasOrigin })

**Display Logic:**
- Shows main score (0-100) in colored circle
- Shows 4 pillar bars (Body, Planet, Care, Open) with values out of 25
- Color coding:
  - 80-100: Green (Excellent)
  - 60-79: Light green (Good)
  - 40-59: Yellow (Fair)
  - 0-39: Red (Poor)

**Component:** `src/components/TruScore.tsx`

---

### 3. Score Highlights (Inside TruScore Card)

**Data Source:**
- `generateProductFlags(product)` → Returns array of flags

**Display Logic:**
- **Green Flags (Positive):**
  - Excellent Eco-Score (A or B)
  - Excellent Nutri-Score (A or B)
  - Palm Oil Free
  - Recyclable Packaging
  - Low Carbon Footprint
  - Ethical Certifications
  - Fair Trade Certified
  - Organic Certified
  - Vegan/Vegetarian Product
  - High Body Safety Score (≥20)
  - Unprocessed/Minimally Processed (NOVA 1)
  - No Additives

- **Red Flags (Negative):**
  - Poor Eco-Score (D or E)
  - Poor Nutri-Score (E)
  - Contains Non-Sustainable Palm Oil
  - High Carbon Footprint
  - Low Body Safety Score (≤10)
  - High Sugar Content
  - High Salt Content
  - High Saturated Fat
  - Contains High-Risk Additives
  - Contains Allergens
  - Ultra-Processed Food (NOVA 4)
  - Many Additives (>5)
  - Product Recall

**Component:** `src/utils/productFlags.ts` → `generateProductFlags()`

**Filtering:**
- Override rules applied to filter inaccurate highlights
- **Location:** `src/config/scoreHighlightOverrides.ts`

---

### 4. Food Recall Alert Card

**Data Source:**
- `product.recalls` (array of recall objects)

**Display Logic:**
- Only shows if `product.recalls.length > 0`
- Shows recall count
- Red border/background
- Tap to open modal with details

**Data Sources:**
- FDA Recalls API (`checkFDARecalls()`)
- Comprehensive US Recalls (`checkComprehensiveUSRecalls()`)
- RASFF Alerts (`checkRASFFAlerts()`)
- CFIA Recalls (`checkCFIARecalls()`)

---

### 5. Country of Manufacture Card

**Data Source:**
- `product.origins_tags` or `product.origins`
- `product.manufacturing_places_tags` or `product.manufacturing_places`
- User-submitted country (from Vercel backend)

**Display Logic:**
- Shows country flag and name (if available)
- Shows "Not Disclosed" if missing
- Allows user to contribute country
- Red border if not disclosed

**Component:** `src/components/ManufacturingCountryModal.tsx`

---

### 6. Sustainability (Eco-Score) Card

**Data Source:**
- `product.ecoscore_grade` (A-E)
- `product.ecoscore_score` (0-100)
- `calculateEcoScore(product)` (calculated if missing)

**Display Logic:**
- Only shows if Eco-Score data available
- Shows grade (A-E) with color coding
- Shows score (0-100)
- Border color matches grade:
  - A: Green
  - B: Light green
  - C: Yellow
  - D: Orange
  - E: Red

**Component:** `src/components/EcoScore.tsx`

---

### 7. Palm Oil Card

**Data Source:**
- `product.palm_oil_analysis` (object with status)
- Extracted from `product.ingredients_text` if missing

**Display Logic:**
- **Green Flag:** Palm Oil Free
- **Red Flag:** Non-Sustainable Palm Oil
- **Orange Flag:** Contains Palm Oil (status unknown)
- **Green Flag (Unknown):** Palm Oil Status Unknown

**Component:** Uses `getPalmOilStatus()` from `src/utils/palmOilUtils.ts`

---

### 8. Packaging Sustainability Card

**Data Source:**
- `product.packaging_data.items` (array of packaging items)
- `product.packagings` (array, converted to packaging_data)

**Display Logic:**
- Shows recyclability status
- Shows reusable/biodegradable badges
- Shows recyclability score (0-100)
- Border color:
  - Green: Meets local recycling requirements
  - Red: Does not meet local recycling requirements

**Component:** `src/utils/packagingRecyclability.ts` → `meetsLocalRecyclingRequirements()`

---

### 9. Ethics / Certifications Card

**Data Source:**
- `product.certifications` (array of certification objects)
- `product.labels_tags` (array of label tags)

**Display Logic:**
- Only shows if `product.certifications.length > 0`
- Displays certification badges
- Each badge shows certification name and icon

**Component:** `src/components/CertBadge.tsx`

---

### 10. Price Information Card

**Data Source:**
- `UniversalPricingCard` component queries:
  - Local store APIs (NZ, AU, GB, US)
  - User-submitted prices (from Vercel backend)
  - Historical price data

**Display Logic:**
- Shows prices from multiple retailers
- Shows user-submitted prices
- Shows price history (if available)
- Currency conversion based on user location

**Component:** `src/components/UniversalPricingCard.tsx`

---

### 11. Nutrition Facts Card

**Data Source:**
- `product.nutriments` (object with nutrition values)
- `product.nutrient_levels` (object with high/medium/low flags)
- `product.serving_size` (serving size information)

**Display Logic:**
- Shows nutrition table with all nutrients
- Highlights high/medium/low levels
- Shows per-100g values
- Shows per-serving values (if serving_size available)

**Component:** `src/components/NutritionTable.tsx`

---

### 12. Ingredients Card

**Data Source:**
- `product.ingredients_text` (string)

**Display Logic:**
- Shows full ingredients list
- Filters out barcode patterns
- Shows NOVA processing level badge (if available)
- Tap to open Processing Level modal

**NOVA Display:**
- NOVA 1-2: Green (Unprocessed/Minimally Processed)
- NOVA 3: Orange (Processed)
- NOVA 4: Red (Ultra-Processed)

---

### 13. Processing Level Card

**Data Source:**
- `product.nova_group` (1-4)

**Display Logic:**
- Shows NOVA group with description
- Color coding:
  - NOVA 1: Green (Unprocessed)
  - NOVA 2: Light green (Minimally Processed)
  - NOVA 3: Orange (Processed)
  - NOVA 4: Red (Ultra-Processed)

**Component:** `src/components/ProcessingLevelModal.tsx`

---

### 14. Allergens & Additives Card

**Data Source:**
- `product.allergens_tags` (array)
- `product.additives_tags` (array)

**Display Logic:**
- Shows allergens list (if any)
- Shows additives list with safety ratings
- Each additive shows:
  - E-number
  - Name
  - Safety rating (Safe/Caution/Avoid)
  - Description
  - Color coding:
    - Safe: Green
    - Caution: Orange
    - Avoid: Red

**Component:** `src/components/AllergensAdditivesModal.tsx`

**Additive Safety Logic:**
- Queries `additiveDatabase.ts` for each E-number
- Returns safety rating and description
- If not in database, shows "No information available"

---

### 15. Insights Carousel

**Data Source:**
- `generateInsights(product, preferences)` from `src/lib/valuesInsights.ts`
- User values preferences (from `useValuesStore`)

**Display Logic:**
- Only shows if user has enabled values preferences
- Shows insights based on:
  - Environmental preferences
  - Palm oil avoidance
  - Cruelty-free preferences
  - Geopolitical preferences (BDS, etc.)

**Component:** `src/components/InsightsCarousel.tsx`

---

## 🎯 TruScore Calculation

**Location:** `src/lib/truscoreEngine.ts` → `calculateTruScore()`

**Version:** v1.4 (4 equal pillars, 25 points each = 100 total)

### Overall Formula

```
TruScore = Body + Planet + Care + Open
Each pillar: 0-25 points
Total: 0-100 points
```

### Pillar 1: Body (25 points)

**Purpose:** Nutritional quality and body safety

**Base Score:**
- **If Nutri-Score exists:**
  - A = 25 points
  - B = 20 points
  - C = 15 points
  - D = 10 points
  - E = 5 points
- **If no Nutri-Score:**
  - Baseline = 15 points (optimistic buffer)

**Penalties:**

1. **Additives (Weighted by Safety):**
   - Safe additives: -0.5 each
   - Caution additives: -1.5 each
   - Avoid additives: -3 each
   - **Plus country-specific penalties** for restricted/banned additives
   - **Cap:** -15 total

2. **Risky Tags:**
   - Carcinogenic, endocrine, allergen, irritant, EWG high-hazard: -4 each
   - **No cap** (can go below 0, then clamped to 0)

3. **EWG Skin Deep (Cosmetics):**
   - High hazard (7-10): -5
   - Moderate (4-6): -3
   - Low (1-3): -1

4. **Irritant Block:**
   - Contains irritants (paraben, phthalate, sulfate, etc.): -10

5. **Fragrance:**
   - Contains parfum/fragrance/aroma: -10

6. **NOVA Processing Level:**
   - NOVA 1 (Unprocessed): +3 bonus
   - NOVA 2 (Minimally processed): 0 (no adjustment)
   - NOVA 3 (Processed): -3
   - NOVA 4 (Ultra-processed): -8
   - **Cap:** -10 total for NOVA

**Final Body Score:**
```
body = baseScore - additivePenalty - riskyPenalties - irritantPenalty - fragrancePenalty + novaAdjustment
body = Math.max(0, Math.min(25, Math.round(body)))
```

**Missing Information Handling:**
- No Nutri-Score → Uses baseline 15 (optimistic)
- No additives data → No penalty
- No NOVA data → No adjustment
- No ingredients → No penalties (but may affect other pillars)

---

### Pillar 2: Planet (25 points)

**Purpose:** Environmental impact and sustainability

**Base Score:**
- **If Eco-Score exists:**
  - A = 25 points
  - B = 20 points
  - C = 15 points
  - D = 10 points
  - E = 5 points
- **If no Eco-Score:**
  - Baseline = 15 points (optimistic buffer)

**Penalties:**

1. **Palm Oil:**
   - Non-certified palm oil: -8
   - Certified sustainable palm oil: -5 (reduced penalty)
   - **Cap:** -10 total

2. **Bonuses:**

   **Recyclable Packaging:**
   - All packaging recyclable (local laws): +5
   - Some packaging recyclable (local laws): +2
   - **Logic:** Uses `getLocalRecyclabilityStatus()` for country-specific accuracy

**Final Planet Score:**
```
planet = baseScore - palmOilPenalty + recyclabilityBonus
planet = Math.max(0, Math.min(25, Math.round(planet)))
```

**Missing Information Handling:**
- No Eco-Score → Uses baseline 15 (optimistic)
- No palm oil data → No penalty
- No packaging data → No bonus

---

### Pillar 3: Care (25 points)

**Purpose:** Ethical standards and certifications

**Base Score:**
- Baseline = 15 points (assumes ethical until violations)

**Bonuses (Stack with +15 cap):**

1. **Fair Trade:** +8
2. **Organic:** +7
3. **Rainforest Alliance:** +6
4. **UTZ:** +6
5. **MSC/ASC/Dolphin-Safe:** +6
6. **RSPCA:** +5
7. **B-Corp:** +5
8. **Cage-Free/Free-Range:** +4

**Total Certification Bonus:**
```
certificationBonus = sum of all applicable bonuses
certificationBonus = Math.min(certificationBonus, 15) // Cap at +15
care = 15 + certificationBonus
```

**Penalties:**

1. **Cruel Parent:**
   - Major violation: -15
   - **Cap:** -20 total

2. **Recalls:**
   - Active recall within last 12 months: -10

**Final Care Score:**
```
care = 15 + certificationBonus - cruelParentPenalty - recallPenalty
care = Math.max(0, Math.min(25, Math.round(care)))
```

**Missing Information Handling:**
- No certifications → No bonus (stays at 15)
- No brand data → No cruel parent check
- No recall data → No penalty

---

### Pillar 4: Open (25 points)

**Purpose:** Transparency and ingredient disclosure

**Base Score:**
- Baseline = 15 points (assumes transparent until hidden)

**Ingredients Disclosure Score:**

**Tiered System:**
- **Full disclosure (≥100 chars):** 15 points (replaces base)
- **>80% (≥80 chars):** 10 points (replaces base)
- **50-80% (≥50 chars):** 5 points (replaces base)
- **None/Minimal (<50 chars):** -5 penalty (applied to base)
- **Placeholder text:** -5 penalty (same as none)

**Penalties:**

1. **Hidden Terms:**
   - 1-2 hidden terms: -10
   - ≥3 hidden terms: -20
   - **Cap:** -20 total
   - **Hidden terms:** parfum, fragrance, aroma, flavor, natural flavor, proprietary blend

2. **No Origin:**
   - No origin data: -8
   - Placeholder origin: -8

**Final Open Score:**
```
if (ingredientsScore >= 0) {
  open = ingredientsScore; // Replace base
} else {
  open = 15 + ingredientsScore; // Apply penalty to base
}
open = open - hiddenTermsPenalty - originPenalty
open = Math.max(0, Math.min(25, Math.round(open)))
```

**Missing Information Handling:**
- No ingredients text → -5 penalty (score = 10)
- No origin data → -8 penalty
- No hidden terms → No penalty

---

### Final TruScore Calculation

```
truscore = body + planet + care + open
truscore = Math.max(0, Math.min(100, Math.round(truscore)))
```

**Result:**
- `truscore`: 0-100 overall score
- `breakdown`: { Body: 0-25, Planet: 0-25, Care: 0-25, Open: 0-25 }
- `hasNutriScore`: Boolean (used for metadata)
- `hasEcoScore`: Boolean (used for metadata)
- `hasOrigin`: Boolean (used for metadata)

---

## ⚠️ Missing Information Handling

### TruScore Calculation with Missing Data

**Strategy:** Optimistic baseline + penalties only for known issues

**Body Pillar:**
- No Nutri-Score → Baseline 15 (assumes good nutrition)
- No additives → No penalty (assumes no additives)
- No NOVA → No adjustment (assumes minimally processed)

**Planet Pillar:**
- No Eco-Score → Baseline 15 (assumes low environmental impact)
- No palm oil data → No penalty (assumes no palm oil)
- No packaging → No bonus (assumes not recyclable)

**Ethics Pillar:**
- No certifications → Baseline 15 (assumes ethical)
- No brand data → No cruel parent check (assumes ethical brand)
- No recall data → No penalty (assumes no recalls)

**Open Pillar:**
- No ingredients → -5 penalty (score = 10, not 0)
- No origin → -8 penalty
- No hidden terms → No penalty (assumes transparent)

**Result:** Products with missing data still get a TruScore, but it may be lower due to transparency penalties.

---

## 🎨 Score Highlights Logic

**Location:** `src/utils/productFlags.ts` → `generateProductFlags()`

**Purpose:** Generate green (positive) and red (negative) flags for display in TruScore card

### Flag Generation Process

**Step 1: Generate All Flags**

Calls multiple generator functions:
1. `generateSustainabilityFlags()` - Eco-Score, palm oil, packaging, carbon
2. `generateEthicsFlags()` - Certifications, Fair Trade, Organic, Vegan/Vegetarian
3. `generateNutritionFlags()` - Nutri-Score, body safety, sugar/salt/fat, additives, allergens
4. `generateProcessingFlags()` - NOVA classification, additive count
5. `generateGeopoliticsFlags()` - Placeholder (requires external data)
6. `generateBoycottFlags()` - Placeholder (requires external data)
7. `generateNewsFlags()` - Recalls

**Step 2: Filter Flags**

- Applies override rules to filter inaccurate highlights
- **Location:** `src/config/scoreHighlightOverrides.ts`

**Step 3: Separate by Type**

- **Green Flags:** `flags.filter(f => f.type === 'green')`
- **Red Flags:** `flags.filter(f => f.type === 'red')`

**Step 4: Display**

- Shows green flags first (positive points)
- Shows red flags second (negative points)
- Each flag shows:
  - Icon (checkmark for green, alert for red)
  - Title
  - Description

### Green Flags (Positive)

**Sustainability:**
- Excellent Eco-Score (A or B)
- Palm Oil Free
- Recyclable Packaging
- Low Carbon Footprint (<2 CO2e/kg)

**Ethics:**
- Ethical Certifications
- Fair Trade Certified
- Organic Certified
- Vegan Product
- Vegetarian Product

**Nutrition:**
- Excellent Nutri-Score (A or B)
- High Body Safety Score (≥20)
- No Additives

**Processing:**
- Unprocessed or Minimally Processed (NOVA 1)

### Red Flags (Negative)

**Sustainability:**
- Poor Eco-Score (D or E)
- Contains Non-Sustainable Palm Oil
- Contains Palm Oil (status unknown)
- High Carbon Footprint (>5 CO2e/kg)

**Nutrition:**
- Poor Nutri-Score (E)
- Low Body Safety Score (≤10)
- High Sugar Content
- High Salt Content
- High Saturated Fat
- Contains High-Risk Additives
- Contains Allergens

**Processing:**
- Ultra-Processed Food (NOVA 4)
- Many Additives (>5)

**News:**
- Product Recall

---

## 🚨 Allergens & Additives Logic

**Location:** `src/components/AllergensAdditivesModal.tsx`

### Allergens Display

**Data Source:**
- `product.allergens_tags` (array of allergen tags)

**Display Logic:**
1. Extract allergen names from tags:
   - Format: `en:allergen-name` → `Allergen Name`
   - Remove `en:` prefix
   - Replace hyphens with spaces
   - Capitalize first letter

2. Display each allergen:
   - Red warning icon
   - Allergen name
   - Grouped in red container

**Example:**
- Tag: `en:milk` → Display: "Milk"
- Tag: `en:gluten` → Display: "Gluten"

---

### Additives Display

**Data Source:**
- `product.additives_tags` (array of additive tags)

**Display Logic:**

**Step 1: Extract E-Numbers**
1. For each tag in `additives_tags`:
   - Remove `en:` prefix if present
   - Extract E-number pattern: `e\d+[a-z]?`
   - Examples: `en:e412` → `e412`, `e102` → `e102`

**Step 2: Query Additive Database**
- For each E-number, query `additiveDatabase.ts`
- Returns: `AdditiveInfo` with:
  - `name`: Additive name
  - `safety`: 'safe' | 'caution' | 'avoid'
  - `description`: Detailed description
  - `uses`: Common uses

**Step 3: Display with Safety Rating**

**If Additive Found in Database:**
- Shows E-number (e.g., "E412")
- Shows additive name
- Shows safety rating with color:
  - **Safe:** Green (#16a085)
  - **Caution:** Orange (#ffa500)
  - **Avoid:** Red (#ff6b6b)
- Shows description
- Shows common uses

**If Additive NOT in Database:**
- Shows E-number (e.g., "E412")
- Shows "No information available"
- Shows note: "This additive code is not yet in our database. We're continuously updating our information."

**Safety Color Logic:**
```typescript
getSafetyColor(safety: string) {
  switch (safety) {
    case 'safe': return '#16a085'; // Green
    case 'caution': return '#ffa500'; // Orange
    case 'avoid': return '#ff6b6b'; // Red
    default: return textSecondary; // Gray
  }
}
```

**Safety Icon Logic:**
```typescript
getSafetyIcon(safety: string) {
  switch (safety) {
    case 'safe': return 'checkmark-circle';
    case 'caution': return 'warning';
    case 'avoid': return 'close-circle';
    default: return 'help-circle';
  }
}
```

**Additive Database:**
- **Location:** `src/services/additiveDatabase.ts`
- Contains 1000+ additives with safety ratings
- Continuously updated

---

## 🎨 Card Conditional Display Logic

**Location:** `app/result/[barcode].tsx`

Each card is conditionally displayed based on available data:

### Cards Always Displayed:
- **Hero Section** - Always shown (even if "Unknown Product")
- **TruScore Card** - Always shown (shows "Insufficient Data" if no TruScore)

### Cards Conditionally Displayed:

1. **Food Recall Alert Card**
   - **Condition:** `product.recalls && product.recalls.length > 0`
   - **Display:** Red banner with recall count

2. **Country of Manufacture Card**
   - **Condition:** Always shown
   - **Display:** Shows country if available, or "Not Disclosed" message

3. **Sustainability (Eco-Score) Card**
   - **Condition:** `calculatedEcoScore && calculatedEcoScore.score !== undefined && calculatedEcoScore.score > 0`
   - **Display:** Only if Eco-Score data exists

4. **Palm Oil Card**
   - **Condition:** Always shown (if product exists)
   - **Display:** Shows status (Free, Contains, Unknown, Non-Sustainable)

5. **Packaging Sustainability Card**
   - **Condition:** `product.packaging_data && product.packaging_data.items.length > 0`
   - **Display:** Only if packaging data exists

6. **Certifications Card**
   - **Condition:** `product.certifications && product.certifications.length > 0`
   - **Display:** Only if certifications exist

7. **Price Information Card**
   - **Condition:** Always shown
   - **Display:** Queries live data from store APIs

8. **Nutrition Facts Card**
   - **Condition:** Always shown
   - **Display:** Shows nutrition table (may be empty if no data)

9. **Ingredients Card**
   - **Condition:** `product.ingredients_text && ingredientsText.length >= 3` (after filtering barcodes)
   - **Display:** Only if valid ingredients text exists

10. **Processing Level (NOVA)**
    - **Condition:** `product.nova_group` exists
    - **Display:** Shown inside Ingredients card as badge

11. **Allergens & Additives Card**
    - **Condition:** `(product.allergens_tags && product.allergens_tags.length > 0) || (product.additives_tags && product.additives_tags.length > 0)`
    - **Display:** Only if allergens or additives exist

12. **Insights Carousel**
    - **Condition:** `insights && insights.length > 0` (user preferences enabled)
    - **Display:** Only if insights generated

---

## 📊 Complete Data Flow Summary

### Visual Flow Diagram

```
[User Scans Barcode]
        ↓
[1. SQLite Check] → Found? → Return (instant)
        ↓ Not Found
[2. Cache Check] → Found? → Return (fast)
        ↓ Not Found
[3. User-Contributed Check] → Found? → Return
        ↓ Not Found
[4. Early Name Discovery] → Get Product Name
        ↓
[5. Phase 0: Local-First] → Query in Parallel
   ├─ FSANZ (by name)
   ├─ USDA/Health Canada/UK FSA/EFSA
   ├─ Local Store APIs
   └─ FoodAtlas (by name)
        ↓
[6. Phase 1: Gold Standard + Open Facts] → Query in Parallel
   ├─ GS1
   ├─ Open Food Facts
   ├─ Open Beauty Facts
   ├─ Open Pet Food Facts
   └─ Open Products Facts
        ↓
[7. Phase 2: Nutrition APIs] → Query in Parallel
   ├─ Edamam
   ├─ Nutritionix
   ├─ Spoonacular
   └─ FooDB
        ↓
[8. Phase 3: Fallbacks] → Query in Parallel (if needed)
   └─ All fallback APIs
        ↓
[9. Merge All Products] → Weighted Merging
   ├─ Score by TruScore Completeness (60%)
   ├─ Score by Source Weight (40%)
   ├─ Select Base Product
   └─ Merge Fields (weighted/union)
        ↓
[10. Product Name Queries] → Query in Parallel (if name available)
   ├─ FSANZ (by name with variations)
   ├─ FoodAtlas (by name)
   └─ Local SQLite enhancements
        ↓
[11. Merge Name Query Results] → Enhance Base Product
        ↓
[12. Web Search] → Last Resort (if all fail)
        ↓
[13. Calculate TruScore] → 4 Pillars × 25pts
   ├─ Body Pillar
   ├─ Planet Pillar
   ├─ Ethics Pillar
   └─ Open Pillar
        ↓
[14. Generate Flags] → Score Highlights
   ├─ Green Flags (positive)
   └─ Red Flags (negative)
        ↓
[15. Display Product Information Page]
   ├─ Hero Section
   ├─ TruScore Card
   ├─ Score Highlights
   ├─ Recall Alert (if any)
   ├─ Country of Manufacture
   ├─ Sustainability Card
   ├─ Palm Oil Card
   ├─ Packaging Card
   ├─ Certifications Card
   ├─ Price Card
   ├─ Nutrition Card
   ├─ Ingredients Card
   ├─ Processing Card
   ├─ Allergens & Additives Card
   └─ Insights Carousel
```

---

## 🔍 Database Query Details

### How Each Database is Queried

#### FSANZ (NZ/AU)

**Query Method:** Product name (NOT barcode - FSANZ doesn't have barcodes)

**Process:**
1. Get product name from early discovery or merged product
2. Generate name variations:
   - Original name
   - Normalized name (remove sizes, weights, brands)
   - Keyword variations (first 2-3 words)
3. Query each variation against FSANZ API
4. Match found → Convert to Product format
5. **Weight:** 0.50 (highest priority)

**Location:** `src/services/fsanzQueryService.ts`

---

#### Open Food Facts

**Query Method:** Barcode

**Process:**
1. Query: `https://world.openfoodfacts.org/api/v0/product/{barcode}.json`
2. Parse response
3. Extract nutrition, ingredients, certifications, etc.
4. **Weight:** 0.45

**Location:** `src/services/openFoodFacts.ts`

---

#### USDA FoodData Central

**Query Method:** Barcode

**Process:**
1. Query: `https://api.nal.usda.gov/fdc/v1/foods/search?query={barcode}`
2. Requires API key
3. Parse response
4. **Weight:** 0.50

**Location:** `src/services/usdaFoodData.ts`

---

#### Store APIs (NZ, AU, GB, US)

**Query Method:** Barcode

**Process:**
1. Scrape retailer websites using Playwright
2. Extract product name, price, nutrition
3. Convert to Product format
4. **Weight:** 0.35

**Location:** 
- NZ: `src/services/nzStoreApi.ts`
- AU: `src/services/auRetailerScraping.ts`
- GB: `src/services/tescoLabsApi.ts`
- US: `src/services/walmartOpenApi.ts`, `src/services/foodRepoApi.ts`

---

#### Nutrition APIs (Edamam, Nutritionix, Spoonacular)

**Query Method:** Barcode

**Process:**
1. Query respective API endpoints
2. Extract nutrition data
3. Enhance existing product with nutrition
4. **Weight:** 0.30

**Location:**
- `src/services/edamamApi.ts`
- `src/services/nutritionixApi.ts`
- `src/services/spoonacularApi.ts`

---

#### Web Search (Last Resort)

**Query Method:** Barcode + Product Name (if available)

**Process:**
1. Try DuckDuckGo Instant Answer API
2. If no result, scrape e-commerce sites:
   - Amazon, eBay, Walmart, Target, etc.
3. Extract product information
4. Create minimal product
5. **Weight:** 0.10 (lowest)

**Location:** `src/services/webSearchFallback.ts`, `src/services/webScrapingService.ts`

---

## 🎯 Card Data Mapping

### How Each Card Gets Its Data

| Card | Data Fields | Source |
|------|-------------|--------|
| **Hero Section** | `image_url`, `product_name`, `brands` | Merged product |
| **TruScore Card** | `trust_score`, `trust_score_breakdown` | Calculated from merged product |
| **Score Highlights** | `generateProductFlags(product)` | Derived from merged product |
| **Recall Alert** | `product.recalls[]` | FDA/RASFF/CFIA APIs |
| **Country of Manufacture** | `origins_tags`, `manufacturing_places_tags` | Merged product + User submissions |
| **Sustainability** | `ecoscore_grade`, `ecoscore_score` | Merged product |
| **Palm Oil** | `palm_oil_analysis` | Extracted from ingredients |
| **Packaging** | `packaging_data.items[]` | Merged product |
| **Certifications** | `certifications[]`, `labels_tags[]` | Merged product |
| **Price** | Queries store APIs + user prices | Live queries + Vercel backend |
| **Nutrition** | `nutriments{}`, `nutrient_levels{}` | Merged product |
| **Ingredients** | `ingredients_text` | Merged product |
| **Processing** | `nova_group` | Merged product |
| **Allergens** | `allergens_tags[]` | Merged product |
| **Additives** | `additives_tags[]` + `additiveDatabase.ts` | Merged product + Database lookup |
| **Insights** | `generateInsights(product, preferences)` | Derived from product + user preferences |

---

## 🔍 Detailed Database Query Methods

### How Each Database is Queried

#### FSANZ (NZ/AU) - Name-Based Query

**Why Name-Based:** FSANZ databases don't have barcodes - they're nutrition databases organized by product name

**Query Process:**
1. **Get Product Name:**
   - From early discovery (SQLite, Cache, quick APIs)
   - OR from merged product results

2. **Generate Name Variations:**
   - Original name: "Coca-Cola 330ml"
   - Normalized: "Coca-Cola" (removes sizes/weights)
   - Keywords: "Coca-Cola" (first 2-3 words)

3. **Query Each Variation:**
   - Try: "Coca-Cola 330ml"
   - Try: "Coca-Cola"
   - Continue until match found or all variations tried

4. **Match Found:**
   - Convert FSANZ response to Product format
   - Extract nutrition data (per 100g)
   - **Weight:** 0.50 (highest priority)

**Location:** `src/services/fsanzQueryService.ts`

---

#### Open Food Facts - Barcode Query

**Query Process:**
1. Query: `https://world.openfoodfacts.org/api/v0/product/{barcode}.json`
2. Parse JSON response
3. Extract:
   - Product name, brand, categories
   - Nutrition data (per 100g)
   - Ingredients text
   - Certifications (labels_tags)
   - Eco-Score, Nutri-Score, NOVA group
   - Origins, manufacturing places
   - Additives, allergens
   - Images

4. **Weight:** 0.45

**Location:** `src/services/openFoodFacts.ts`

---

#### Store APIs - Web Scraping

**Query Process:**
1. Use Playwright to scrape retailer websites
2. Search by barcode
3. Extract:
   - Product name
   - Price
   - Basic nutrition (if available)
4. Convert to Product format
5. **Weight:** 0.35

**Location:**
- NZ: `src/services/nzStoreApi.ts` (uses Vercel backend)
- AU: `src/services/auRetailerScraping.ts`
- GB: `src/services/tescoLabsApi.ts`
- US: `src/services/walmartOpenApi.ts`, `src/services/foodRepoApi.ts`

---

#### Nutrition APIs - Barcode Query

**Query Process:**
1. Query respective API endpoints with barcode
2. Extract nutrition data (per 100g)
3. Enhance existing product (fill gaps)
4. **Weight:** 0.30

**Location:**
- `src/services/edamamApi.ts`
- `src/services/nutritionixApi.ts`
- `src/services/spoonacularApi.ts`

---

#### Web Search - Last Resort

**Query Process:**
1. **Try DuckDuckGo Instant Answer API:**
   - Query: "UPC {barcode}" or "{productName} {barcode}"
   - Extract product info from instant answer

2. **If no instant answer, scrape e-commerce sites:**
   - Amazon: `https://www.amazon.com/s?k={barcode}`
   - eBay: `https://www.ebay.com/sch/i.html?_nkw={barcode}`
   - Walmart: `https://www.walmart.com/search?q={barcode}`
   - Target: `https://www.target.com/s?searchTerm={barcode}`
   - Extract: Product name, price, basic info

3. **Create minimal product:**
   - Product name: "Product {barcode}" or scraped name
   - Basic structure for display

4. **Weight:** 0.10 (lowest - only used if all else fails)

**Location:** `src/services/webSearchFallback.ts`, `src/services/webScrapingService.ts`

---

## 📝 Version History

**v1.0** (December 3, 2024)
- Initial comprehensive documentation
- Complete flow from barcode scan to display
- All 30+ databases documented with query methods
- TruScore calculation detailed (all 4 pillars)
- Card data mapping explained
- Missing information handling documented
- Score highlights logic explained
- Allergens & Additives logic explained

---

## ✅ Summary

This document explains the complete information flow from barcode scan to Product Information Page display. Key points:

1. **Query Order:** SQLite → Cache → User-Contributed → Early Name Discovery → Phase 0 (Local-First) → Phase 1 (Gold Standard + Open Facts) → Phase 2 (Nutrition APIs) → Phase 3 (Fallbacks) → Phase 4 (Name Queries) → Web Search

2. **Priority:** Geo-location first (local databases), then data quality (government > community > stores > fallbacks)

3. **Merging:** Weighted by TruScore completeness (60%) + source trustworthiness (40%)

4. **TruScore:** 4 pillars × 25pts = 100pts, with optimistic baselines and penalties for known issues

5. **Missing Data:** Handled with optimistic baselines and transparency penalties

6. **Cards:** Each card receives specific data fields from the merged product

---

**Document Version:** 1.0  
**Last Updated:** December 3, 2024  
**Status:** Complete
