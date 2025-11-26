# TruScore System - Complete Technical Explanation

## Overview

The TruScore system is a **4-pillar scoring methodology** (v1.4) that evaluates products across **Body**, **Planet**, **Care**, and **Open** dimensions. Each pillar contributes **25 points maximum**, for a **total of 100 points**. The system is designed to work with **partial data** from multiple sources and provides **default scores** when information is missing.

---

## 1. DATA SOURCE HIERARCHY & FETCHING STRATEGY

### 1.1 Source Priority Order

The app follows a **strict fallback hierarchy** when fetching product data:

```
Priority 0: SQLite Database (offline-first, country-specific)
Priority 1: AsyncStorage Cache (with premium support)
Priority 2: Open Facts Databases (parallel fetch)
  - Open Food Facts (OFF)
  - Open Beauty Facts (OBF)
  - Open Pet Food Facts (OPFF)
  - Open Products Facts (OPF)
Priority 3: Official Sources (parallel fetch)
  - USDA FoodData Central (US branded foods)
  - GS1 Data Source (official barcode verification)
Priority 4: Country-Specific Sources
  - NZ Store APIs (Woolworths, Pak'nSave, New World)
  - AU Retailer APIs (Woolworths, Coles, IGA)
  - FSANZ Databases (NZ/AU government)
Priority 5: Verified APIs (parallel fetch)
  - Barcode Lookup API
  - Nutritionix API
  - Spoonacular API
  - Edamam API
  - Best Buy API
  - EANData API
  - UPC Database API
  - EAN-Search API
Priority 6: Free APIs (parallel fetch)
  - UPCitemdb
  - Barcode Spider
  - Open GTIN DB
  - Barcode Monster
  - Go UPC
  - Buycott
Priority 7: Web Search Fallback (DuckDuckGo)
  - ALWAYS returns a result (guaranteed)
  - Creates minimal product if nothing found
```

### 1.2 Source Confidence Weights

Each source has a **confidence weight** (0-1) that determines data reliability:

**High Confidence (0.8-1.0):**
- FSANZ AU/NZ: 0.95
- USDA FoodData: 0.90
- GS1 DataSource: 0.90
- Open Food Facts: 0.85

**Medium Confidence (0.5-0.7):**
- Store APIs (Woolworths, Coles, etc.): 0.65-0.70
- Open Beauty/Pet/Products Facts: 0.75
- Verified APIs (Barcode Lookup, Nutritionix): 0.55-0.60

**Low Confidence (0.3-0.5):**
- Free APIs (UPCitemdb, Barcode Spider): 0.40-0.50
- Web Search: 0.30

### 1.3 Product Merging Strategy

When **multiple sources** return data for the same product, the system uses **weighted merging**:

**Location:** `src/services/productDataMerger.ts`

**Merging Rules:**
1. **Base Product**: Highest-weight source becomes the base
2. **Product Name**: Best available (prefer non-generic names)
3. **Brand**: Best available
4. **Image**: Best available (prefer non-null)
5. **Nutrition Data**: **Weighted average** across all sources
6. **Ingredients**: **Longest list** (most complete)
7. **Certifications**: **Union** (all unique certifications)
8. **Categories**: **Most specific** (longest category string)
9. **Quality/Completion**: **Weighted average**

**Example:**
- OFF product (weight 0.85) has Nutri-Score A, basic nutrition
- USDA product (weight 0.90) has detailed nutrition, no Nutri-Score
- **Result**: USDA becomes base, but Nutri-Score from OFF is preserved

---

## 2. TRUSCORE CALCULATION METHODOLOGY

### 2.1 Core Engine

**Location:** `src/lib/truscoreEngine.ts`

The TruScore calculation is **purely client-side**, executes in **<150ms**, and works **offline-first**.

### 2.2 The 4 Pillars

#### **PILLAR 1: BODY (25 points)**
*Measures nutritional quality and safety*

**Base Score:**
- **With Nutri-Score**: Uses official EU Nutri-Score grade
  - A = 25 points
  - B = 20 points
  - C = 15 points
  - D = 10 points
  - E = 5 points
- **Without Nutri-Score**: **Default = 25 points** (neutral baseline)

**Penalties Applied:**
1. **Additives** (weighted by safety):
   - Safe additives: -0.5 each
   - Caution additives: -1.5 each
   - Avoid additives: -3 each
   - **Maximum penalty: -15 points**
   - Uses `src/services/additiveDatabase.ts` for safety ratings

2. **Risky Tags**: -4 points each
   - Detects: carcinogenic, endocrine, palm, allergen, irritant
   - From `ingredients_analysis_tags`

3. **Irritants Block**: -10 points
   - Detects: paraben, phthalate, sulfate, triclosan, formaldehyde, peg, silicone, phenoxyethanol
   - Searches `ingredients_text` with word boundary matching

4. **Fragrance**: -10 points
   - Detects: parfum, fragrance, aroma
   - Searches `ingredients_text`

5. **NOVA Processing Level**:
   - NOVA 4 (ultra-processed): -10 points
   - NOVA 3 (processed): -5 points
   - NOVA 1 (unprocessed): +0 (no bonus, but no penalty)

**Final Body Score:** `Math.max(0, Math.min(25, rounded(body)))`

**Missing Data Handling:**
- No Nutri-Score → Default 25, then apply penalties
- No additives data → No penalty applied
- No ingredients text → Can't detect irritants/fragrance (no penalty)

---

#### **PILLAR 2: PLANET (25 points)**
*Measures environmental impact*

**Base Score:**
- **With Eco-Score**: Uses official French Eco-Score grade
  - A = 25 points
  - B = 20 points
  - C = 15 points
  - D = 10 points
  - E = 5 points
- **Without Eco-Score**: **Default = 25 points** (neutral baseline)

**Penalties Applied:**
1. **Palm Oil**: -10 points
   - Detected from `ingredients_analysis_tags` (OFF tags)
   - OR from `ingredients_text` (fallback detection)
   - Only if NOT marked as "palm-oil-free"
   - Uses enhanced detection (palm oil, palmolein, palm fat, etc.)

**Bonuses Applied:**
1. **Recyclable Packaging**:
   - **All packaging recyclable**: +5 points
   - **Some packaging recyclable**: +2 points
   - Checks `packagings[]` array for recycling status
   - Falls back to `packaging_tags` if packagings array unavailable

**Final Planet Score:** `Math.max(0, Math.min(25, rounded(planet)))`

**Missing Data Handling:**
- No Eco-Score → Default 25, then apply palm oil/recycling adjustments
- No palm oil data → No penalty (assumes no palm oil)
- No packaging data → No bonus (assumes unknown recyclability)

---

#### **PILLAR 3: CARE (25 points)**
*Measures ethical standards and animal welfare*

**Base Score:**
- **Default = 18 points** (absence of known cruelty = baseline)

**Bonuses Applied (Stackable, up to 25):**
1. Fair Trade: +8 points
2. Organic: +8 points
3. Rainforest Alliance: +7 points
4. MSC/ASC/Dolphin-Safe: +8 points
5. RSPCA: +6 points
6. Vegan/Cruelty-Free: +10 points
7. UTZ: +7 points

**Penalties Applied:**
1. **Cruel Parent Company**: -30 points
   - Uses `src/data/brandDatabase.ts` for brand detection
   - Checks if brand matches known cruel parent companies
   - Examples: Unilever, P&G, L'Oréal, Nestlé, Mars, etc.

**Final Care Score:** `Math.max(0, Math.min(25, rounded(care)))`

**Missing Data Handling:**
- No labels/certifications → Base 18 (neutral)
- No brand data → Can't detect cruel parents (no penalty)
- Certifications stack, so multiple certifications can reach 25

---

#### **PILLAR 4: OPEN (25 points)**
*Measures transparency and ingredient disclosure*

**Base Score:**
- **Default = 25 points** (full transparency assumed)

**Penalties Applied:**
1. **Hidden Terms** (generic ingredient descriptors):
   - 1-2 hidden terms: -12 points
   - 3+ hidden terms: -20 points
   - Detects: parfum, fragrance, aroma, flavor, natural flavor, proprietary
   - Searches `ingredients_text` with word boundary matching

2. **No Ingredients List**: -20 points (sets score to 5)
   - If `ingredients_text` is empty or < 10 characters
   - OR if it's a placeholder ("product", "item", "n/a", "not available", "unknown", "missing", "no ingredients", "ingredients not listed")

3. **No Origin Information**: -15 points
   - Checks: `origins_tags`, `manufacturing_places_tags`, `origins`, `manufacturing_places`
   - If all are missing OR contain "unknown" → penalty applied

**Final Open Score:** `Math.max(0, Math.min(25, rounded(open)))`

**Missing Data Handling:**
- No ingredients text → Score = 5 (minimum transparency)
- No origin data → -15 penalty (reduced transparency)
- No hidden terms detected → No penalty (assumes transparency)

---

### 2.3 Total TruScore Calculation

```typescript
truscore = body + planet + care + open
// Bounded to 0-100
truscore = Math.max(0, Math.min(100, Math.round(truscore)))
```

**Example Calculation:**
- Body: 20 (Nutri-Score B, some additives)
- Planet: 15 (Eco-Score C, palm oil detected)
- Care: 18 (no certifications, no cruel parent)
- Open: 10 (no origin, some hidden terms)
- **Total: 63/100**

---

## 3. MISSING DATA & DEFAULT SCORES

### 3.1 Default Scores by Pillar

| Pillar | Default Score | When Applied |
|--------|--------------|--------------|
| **Body** | 25 | When Nutri-Score is missing |
| **Planet** | 25 | When Eco-Score is missing |
| **Care** | 18 | Always (baseline for no cruelty) |
| **Open** | 25 | Always (assumes transparency) |

### 3.2 Missing Data Impact

**High-Impact Missing Data:**
- **No Nutri-Score**: Body starts at 25, but penalties still apply
- **No Eco-Score**: Planet starts at 25, but palm oil/recycling still adjust
- **No Ingredients Text**: Open score = 5 (minimum)
- **No Origin**: Open score -15 (significant penalty)

**Low-Impact Missing Data:**
- **No Additives Data**: No penalty (assumes no additives)
- **No Packaging Data**: No bonus (assumes unknown)
- **No Certifications**: Care = 18 (neutral baseline)
- **No Brand Data**: Can't detect cruel parents (no penalty)

### 3.3 Data Completeness Indicators

The system tracks what data is available:

```typescript
{
  hasNutriScore: boolean,  // Nutri-Score grade available?
  hasEcoScore: boolean,    // Eco-Score grade available?
  hasOrigin: boolean,      // Origin/manufacturing data available?
}
```

These are used in the UI to show **transparency warnings** when scores are based on incomplete data.

---

## 4. DATA ENHANCEMENT PIPELINE

### 4.1 Product Enhancement Flow

When a product is fetched, it goes through **multiple enhancement stages**:

```
1. Raw Product Fetch (from API/database)
   ↓
2. Source-Specific Enhancement
   - OFF: extractPalmOilAnalysis(), enhanceEcoScoreData()
   - USDA: Convert nutrition format
   - Store APIs: Normalize data structure
   ↓
3. Central Enhancement (productService.ts)
   - Extract palm oil analysis (if ingredients_text exists)
   - Enhance with NZFCD/AFCD (country-specific nutrition)
   - Format ingredients and certifications
   - Calculate Eco-Score grade (if score exists but grade missing)
   ↓
4. Confidence Scoring
   - Apply confidence score based on source
   - Mark source reliability (high/medium/low)
   ↓
5. Trust Score Calculation
   - Calculate Trust Score (legacy, 0-100)
   - Uses TruScore v1.3 engine
   ↓
6. TruScore Calculation
   - Calculate TruScore (v1.4, 4 pillars)
   - Generate insights (if values preferences enabled)
   ↓
7. Display Preparation
   - Component receives ProductWithTrustScore
   - TruScore component displays breakdown
```

### 4.2 Palm Oil Analysis Enhancement

**Critical Enhancement** that runs on ALL products:

```typescript
// Location: src/services/productService.ts (lines 698-710)

// For SQLite products:
if (hasIngredientsText || hasAnalysisTags || hasAnalysis) {
  sqliteProduct.palm_oil_analysis = extractPalmOilAnalysis(sqliteProduct);
}

// For cached products:
if (hasIngredientsText || hasAnalysisTags || hasAnalysis) {
  cached.palm_oil_analysis = extractPalmOilAnalysis(cached);
}

// For all products (final enhancement):
if (hasIngredientsText || hasAnalysisTags || hasAnalysis) {
  product.palm_oil_analysis = extractPalmOilAnalysis(product);
}
```

**Why This Matters:**
- SQLite doesn't store computed fields
- Cached products might be from before enhancement logic
- Ensures consistency across all data sources

---

## 5. VALUES INSIGHTS GENERATION

### 5.1 Insights vs TruScore

**Important Distinction:**
- **TruScore**: Always calculated, affects the 4 pillars
- **Insights**: Optional, only generated if user has Values preferences enabled
- **Insights do NOT affect TruScore** (per v1.3 spec)

### 5.2 Insights Generation

**Location:** `src/lib/valuesInsights.ts`

**Process:**
1. Check if preferences are enabled for each category
2. Check product data against preference criteria
3. Generate insight if match found
4. Return array of insights (or empty array)

**Example - Palm Oil Insight:**
```typescript
if (preferences.environmentalEnabled && preferences.avoidPalmOil) {
  // Check OFF tags OR ingredients_text
  const hasPalmOil = analysisTags.includes('palm-oil') || 
                     ingredientsText.includes('palm oil');
  
  if (hasPalmOil) {
    insights.push({
      type: 'environmental',
      reason: 'Contains unsustainable palm oil',
      source: 'Ingredients analysis',
      color: '#166534' // Environmental theme color
    });
  }
}
```

---

## 6. DISPLAY LOGIC

### 6.1 TruScore Component

**Location:** `src/components/TruScore.tsx`

**Display Elements:**
1. **Main Score Circle**: Shows total TruScore (0-100)
   - Color: Green (80+), Light Green (60+), Yellow (40+), Red (<40)
2. **Label**: Excellent/Good/Fair/Poor
3. **Pillar Bars**: 4 horizontal bars showing each pillar
   - Width: `(value / 25) * 100%`
   - Color: Green (20+), Light Green (15+), Yellow (10+), Red (<10)
   - Value: Shows `X/25` for each pillar

### 6.2 Result Screen Integration

**Location:** `app/result/[barcode].tsx`

**Flow:**
1. Product fetched via `fetchProduct(barcode)`
2. Product stored in state: `setProduct(product)`
3. `useEffect` triggers TruScore calculation:
   ```typescript
   const score = calculateTruScore(product, valuesPreferences);
   setTruScore(score);
   ```
4. TruScore component renders with breakdown
5. Insights carousel renders if insights exist

### 6.3 Missing Data Indicators

The UI can show warnings when data is incomplete:
- `hasNutriScore: false` → "Nutri-Score not available"
- `hasEcoScore: false` → "Eco-Score not available"
- `hasOrigin: false` → "Origin information not available"

These are stored in `TruScoreResult` and can be displayed in modals or tooltips.

---

## 7. DATABASE INTEGRATION

### 7.1 SQLite Database

**Location:** `src/services/sqliteProductDatabase.ts`

**Stored Fields:**
- Basic product info (name, brand, image)
- Nutrition data (JSON)
- Ingredients text
- Scores (ecoscore_grade, nutriscore_grade)
- Tags (labels, allergens, additives)
- **NOT stored**: Computed fields (palm_oil_analysis, etc.)

**Enhancement Required:**
- SQLite products MUST be enhanced before TruScore calculation
- Palm oil analysis extracted from ingredients_text
- Other computed fields generated on-the-fly

### 7.2 Cache (AsyncStorage)

**Location:** `src/services/cacheService.ts`

**Stored:**
- Complete Product object (JSON serialized)
- Includes all fields (including computed ones if they existed when cached)

**Enhancement:**
- Cached products also enhanced (in case cache is from before enhancement logic)
- Ensures consistency with fresh API products

---

## 8. SCORING EXAMPLES

### Example 1: Complete Data Product

**Product:** Organic Fair Trade Coffee
- **Source:** Open Food Facts
- **Nutri-Score:** A
- **Eco-Score:** B
- **Ingredients:** "Organic coffee beans (100%)"
- **Certifications:** Organic, Fair Trade
- **Origin:** Colombia
- **Packaging:** Fully recyclable
- **Additives:** None
- **Brand:** Small independent brand (not cruel parent)

**Calculation:**
- **Body:** 25 (Nutri-Score A) - 0 (no additives) = **25**
- **Planet:** 20 (Eco-Score B) + 5 (recyclable) = **25**
- **Care:** 18 (base) + 8 (organic) + 8 (fair trade) = **34** → capped at **25**
- **Open:** 25 (base) - 0 (no hidden terms, has origin) = **25**

**Total TruScore: 100/100**

---

### Example 2: Partial Data Product

**Product:** Generic Snack Bar
- **Source:** Web Search (low confidence)
- **Nutri-Score:** Missing
- **Eco-Score:** Missing
- **Ingredients:** "Sugar, palm oil, flour, natural flavors"
- **Certifications:** None
- **Origin:** Missing
- **Packaging:** Unknown
- **Additives:** Unknown
- **Brand:** Unknown

**Calculation:**
- **Body:** 25 (default, no Nutri-Score) - 0 (no additive data) - 0 (no risky tags detected) - 0 (no irritants detected) - 0 (no fragrance detected) = **25**
- **Planet:** 25 (default, no Eco-Score) - 10 (palm oil detected in ingredients) + 0 (no packaging data) = **15**
- **Care:** 18 (base, no certifications, no brand data) = **18**
- **Open:** 25 (base) - 12 (1 hidden term: "natural flavors") - 15 (no origin) = **-2** → **0** (bounded)

**Total TruScore: 58/100**

---

### Example 3: Missing Critical Data

**Product:** Unknown Product
- **Source:** Web Search (minimal data)
- **Nutri-Score:** Missing
- **Eco-Score:** Missing
- **Ingredients:** Missing
- **Certifications:** None
- **Origin:** Missing
- **Packaging:** Missing
- **Additives:** Missing
- **Brand:** Missing

**Calculation:**
- **Body:** 25 (default) - 0 (no data to penalize) = **25**
- **Planet:** 25 (default) - 0 (no palm oil detected, no data) = **25**
- **Care:** 18 (base) = **18**
- **Open:** 5 (no ingredients text) - 15 (no origin) = **-10** → **0** (bounded)

**Total TruScore: 68/100**

**Note:** This seems high, but it's because:
- Body/Planet default to 25 (neutral)
- Care defaults to 18 (neutral)
- Only Open is penalized heavily (5 for no ingredients, but bounded to 0)

---

## 9. KEY DESIGN DECISIONS

### 9.1 Why Default Scores Are High

**Philosophy:** "Innocent until proven guilty"
- Missing data doesn't automatically mean bad product
- Penalties only applied when negative indicators are found
- Defaults are neutral/positive to avoid false negatives

### 9.2 Why Pillars Are Equal Weight

**Philosophy:** All dimensions matter equally
- Body, Planet, Care, and Open are equally important
- No pillar dominates the score
- Each pillar can contribute 0-25 points

### 9.3 Why Some Data Sources Are Weighted

**Philosophy:** Trust but verify
- Government sources (USDA, FSANZ) are most trusted
- Community sources (OFF) are highly trusted
- Free APIs are less trusted but still useful
- Web search is least trusted but ensures coverage

### 9.4 Why Merging Uses Weighted Averages

**Philosophy:** Best data wins, but combine when beneficial
- Nutrition data: Weighted average (combines accuracy)
- Ingredients: Longest list (most complete)
- Certifications: Union (all unique certs)
- Quality: Weighted average (reflects overall confidence)

---

## 10. EDGE CASES & SPECIAL HANDLING

### 10.1 Products with No Data

**Handling:**
- Web search fallback ALWAYS returns a product
- Minimal product: `{ barcode, product_name: "Product {barcode}" }`
- TruScore calculated with all defaults
- Result: Typically 68/100 (high defaults, Open penalized)

### 10.2 Conflicting Data from Multiple Sources

**Handling:**
- Highest-weight source becomes base
- Other sources fill gaps
- Nutrition: Weighted average (smooths conflicts)
- Certifications: Union (includes all)

### 10.3 Cached vs Fresh Data

**Handling:**
- Cached products enhanced on load
- Fresh products enhanced after fetch
- Both go through same enhancement pipeline
- Ensures consistency

### 10.4 Offline Mode

**Handling:**
- SQLite checked first (offline-first)
- If found, enhanced and returned
- If not found and offline, returns null
- Premium users have larger cache (better offline coverage)

---

## 11. PERFORMANCE CONSIDERATIONS

### 11.1 Calculation Speed

- **Target:** <150ms execution time
- **Achieved:** Pure JavaScript, no async operations in calculation
- **Optimization:** Pre-computed databases (additives, brands) loaded once

### 11.2 Data Fetching

- **Parallel fetching:** Multiple APIs called simultaneously
- **Early returns:** First successful fetch stops further attempts (for some tiers)
- **Caching:** Products cached to avoid repeated API calls

### 11.3 Memory Usage

- **Additive database:** ~1500 entries, loaded once
- **Brand database:** ~500 entries, loaded once
- **Product data:** Single product in memory at a time

---

## 12. SUMMARY: HOW IT ALL WORKS TOGETHER

### Step-by-Step Flow:

1. **User scans barcode** → `9300657003425`

2. **Product Fetching:**
   - Check SQLite → Not found
   - Check cache → Not found
   - Try OFF → Found product
   - Enhance with palm oil analysis, Eco-Score data
   - Apply confidence score (0.85 for OFF)

3. **Product Enhancement:**
   - Extract palm oil from ingredients_text
   - Format ingredients and certifications
   - Calculate missing Eco-Score grade if needed

4. **TruScore Calculation:**
   - **Body:** Check Nutri-Score → B = 20, check additives → -3, check risky tags → -4, check irritants → 0, check fragrance → 0, check NOVA → 0
     - **Result: 13/25**
   - **Planet:** Check Eco-Score → C = 15, check palm oil → -10, check recycling → +2
     - **Result: 7/25** (bounded to 0, so **0/25**)
   - **Care:** Base 18, check certifications → 0, check cruel parent → 0
     - **Result: 18/25**
   - **Open:** Base 25, check hidden terms → -12, check ingredients → OK, check origin → -15
     - **Result: -2** → **0/25** (bounded)

5. **Total:** 13 + 0 + 18 + 0 = **31/100**

6. **Insights Generation:**
   - Check values preferences → Environmental enabled, avoid palm oil
   - Check product → Contains palm oil
   - Generate insight: "Contains unsustainable palm oil"

7. **Display:**
   - TruScore component shows 31 with breakdown
   - Insights carousel shows palm oil insight
   - User sees complete picture

---

## 13. KEY FILES REFERENCE

| File | Purpose |
|------|---------|
| `src/lib/truscoreEngine.ts` | Core TruScore calculation (v1.4) |
| `src/services/productService.ts` | Product fetching orchestration |
| `src/services/productDataMerger.ts` | Multi-source product merging |
| `src/utils/confidenceScoring.ts` | Source confidence weights |
| `src/services/additiveDatabase.ts` | Additive safety ratings |
| `src/data/brandDatabase.ts` | Brand/cruel parent detection |
| `src/components/TruScore.tsx` | TruScore display component |
| `app/result/[barcode].tsx` | Result screen integration |
| `src/lib/valuesInsights.ts` | Values insights generation |

---

## 14. CONCLUSION

The TruScore system is designed to:
- ✅ Work with **partial data** from multiple sources
- ✅ Provide **fair defaults** when data is missing
- ✅ **Never penalize** for missing data (only for detected negatives)
- ✅ **Combine data** intelligently from multiple sources
- ✅ **Calculate quickly** (<150ms, offline-first)
- ✅ **Display transparently** with pillar breakdown

The system prioritizes **data availability** over **perfect accuracy**, ensuring users always get a score even with incomplete information, while clearly indicating when data is missing.

