# Nutrition Information & Scoring - Data Sources

## Overview

The TruScore **Body Pillar** (nutrition scoring) relies on nutrition data from multiple sources, with the **Nutri-Score** (official EU system) being the primary scoring mechanism when available.

---

## 1. NUTRITION DATA SOURCES (Priority Order)

### **Tier 1: Official Government Databases** (Highest Quality)

#### **1.1 USDA FoodData Central** (US Only)
- **Source:** `src/services/usdaFoodData.ts`
- **API:** `https://api.nal.usda.gov/fdc/v1/`
- **Coverage:** US branded foods (official government data)
- **Nutrition Data Provided:**
  - Energy (kcal)
  - Protein
  - Total lipid (fat)
  - Carbohydrates
  - Sugars
  - Fiber
  - Sodium (converted to salt: sodium × 2.54)
- **Nutri-Score:** ❌ Not provided (USDA doesn't calculate Nutri-Score)
- **Quality Score:** 90/100
- **Completion Score:** 85/100
- **Confidence Weight:** 0.90 (high)
- **Note:** Requires API key (`USDA_API_KEY`)

#### **1.2 AFCD (Australian Food Composition Database)**
- **Source:** `src/services/afcdDatabase.ts`
- **Database:** Local SQLite database (offline-first)
- **Coverage:** Australian foods (government database)
- **Nutrition Data Provided:**
  - Energy (kcal, kJ)
  - Protein
  - Fat (total, saturated)
  - Carbohydrates (total, sugars)
  - Dietary fiber
  - Calcium, Iron, Sodium, Vitamin C
  - **Up to 256 nutrients** (from raw_data JSON)
- **Nutri-Score:** ❌ Not provided (AFCD doesn't calculate Nutri-Score)
- **Quality Score:** 85/100
- **Completion Score:** 70/100
- **Confidence Weight:** 0.95 (very high - government data)
- **Note:** Used for product name matching (fuzzy search)

#### **1.3 NZFCD (New Zealand Food Composition Database)**
- **Source:** `src/services/nzfcdDatabase.ts`
- **Database:** Local SQLite database (offline-first)
- **Coverage:** New Zealand foods (government database)
- **Nutrition Data Provided:**
  - Energy (kcal, kJ)
  - Protein
  - Fat (total, saturated)
  - Carbohydrates (total, sugars)
  - Dietary fiber
  - Calcium, Iron, Sodium, Vitamin C
  - **Up to 256 nutrients** (from raw_data JSON)
- **Nutri-Score:** ❌ Not provided (NZFCD doesn't calculate Nutri-Score)
- **Quality Score:** 85/100
- **Completion Score:** 70/100
- **Confidence Weight:** 0.95 (very high - government data)
- **Note:** Used for product name matching (fuzzy search)

---

### **Tier 2: Open Facts Databases** (Community-Driven, High Quality)

#### **2.1 Open Food Facts (OFF)**
- **Source:** `src/services/openFoodFacts.ts`
- **API:** `https://world.openfoodfacts.org/api/v2/product/` (country-specific instances)
- **Coverage:** Global food products (1M+ products)
- **Nutrition Data Provided:**
  - Complete `nutriments` object with all nutrients
  - Energy (kcal, kJ)
  - Macronutrients (protein, fat, carbohydrates, sugars, fiber)
  - Micronutrients (sodium, salt, calcium, iron, vitamins)
  - **Nutri-Score Grade:** ✅ **PROVIDED** (A, B, C, D, E, or unknown)
  - **Nutri-Score Calculation:** Calculated by OFF using official EU algorithm
- **Quality Score:** 85/100
- **Completion Score:** 80/100
- **Confidence Weight:** 0.85 (high)
- **Note:** This is the **PRIMARY source for Nutri-Score** in the app

#### **2.2 Open Beauty Facts (OBF)**
- **Source:** `src/services/openBeautyFacts.ts`
- **API:** `https://world.openbeautyfacts.org/api/v2/product/`
- **Coverage:** Cosmetics and personal care products
- **Nutrition Data Provided:**
  - Limited (cosmetics don't have nutrition facts)
  - May have some ingredient analysis
- **Nutri-Score:** ❌ Not applicable (cosmetics)
- **Quality Score:** 75/100
- **Confidence Weight:** 0.75 (medium-high)

#### **2.3 Open Pet Food Facts (OPFF)**
- **Source:** `src/services/openPetFoodFacts.ts`
- **API:** `https://world.openpetfoodfacts.org/api/v2/product/`
- **Coverage:** Pet food products
- **Nutrition Data Provided:**
  - Complete nutrition data (similar to OFF)
  - Pet-specific nutrients
- **Nutri-Score:** ❌ Not provided (pet food uses different scoring)
- **Quality Score:** 75/100
- **Confidence Weight:** 0.75 (medium-high)

#### **2.4 Open Products Facts (OPF)**
- **Source:** `src/services/openProductsFacts.ts`
- **API:** `https://world.openproductsfacts.org/api/v2/product/`
- **Coverage:** General products (electronics, household, tools)
- **Nutrition Data Provided:**
  - Limited (non-food products)
- **Nutri-Score:** ❌ Not applicable
- **Quality Score:** 75/100
- **Confidence Weight:** 0.75 (medium-high)

---

### **Tier 3: Nutrition-Focused APIs** (Specialized)

#### **3.1 Edamam Food Database**
- **Source:** `src/services/edamamApi.ts`
- **API:** `https://api.edamam.com/api/food-database/v2/parser`
- **Coverage:** 10,000 requests/month limit
- **Nutrition Data Provided:**
  - Energy (kcal) - `ENERC_KCAL`
  - Protein - `PROCNT`
  - Fat - `FAT`
  - Carbohydrates - `CHOCDF`
  - Fiber - `FIBTG`
  - Sugars - `SUGAR`
  - Sodium - `NA` (converted to g)
  - Calcium, Iron, Potassium, Vitamin C
- **Nutri-Score:** ❌ Not provided (Edamam doesn't calculate Nutri-Score)
- **Quality Score:** Calculated dynamically (60-80)
- **Completion Score:** Calculated dynamically (60-80)
- **Confidence Weight:** 0.55 (medium)
- **Note:** Strong nutrition data, but no Nutri-Score

#### **3.2 Nutritionix API**
- **Source:** `src/services/nutritionixApi.ts`
- **API:** `https://api.nutritionix.com/v1_1/item`
- **Coverage:** 100 requests/day limit
- **Nutrition Data Provided:**
  - Energy (kcal) - `nf_calories`
  - Protein - `nf_protein`
  - Fat (total, saturated) - `nf_total_fat`, `nf_saturated_fat`
  - Carbohydrates - `nf_total_carbohydrate`
  - Fiber - `nf_dietary_fiber`
  - Sugars - `nf_sugars`
  - Sodium - `nf_sodium` (converted to g)
  - Calcium, Iron, Potassium, Vitamin C
  - **Per-serving data** (converted to per-100g)
- **Nutri-Score:** ❌ Not provided (Nutritionix doesn't calculate Nutri-Score)
- **Quality Score:** Calculated dynamically (60-80)
- **Completion Score:** Calculated dynamically (60-80)
- **Confidence Weight:** 0.55 (medium)
- **Note:** Nutrition-focused, but no Nutri-Score

#### **3.3 Spoonacular API**
- **Source:** `src/services/spoonacularApi.ts`
- **API:** `https://api.spoonacular.com/food/products/upc/`
- **Coverage:** 150 points/day limit
- **Nutrition Data Provided:**
  - Energy (kcal) - from `nutrition.nutrients` array
  - Protein, Fat, Carbohydrates, Fiber, Sugars, Sodium
  - **Per-serving data** (converted to per-100g)
- **Nutri-Score:** ❌ Not provided (Spoonacular doesn't calculate Nutri-Score)
- **Quality Score:** Calculated dynamically (60-80)
- **Completion Score:** Calculated dynamically (60-80)
- **Confidence Weight:** 0.25 (low-medium)
- **Note:** Food-focused, but no Nutri-Score

---

### **Tier 4: Store APIs** (Country-Specific)

#### **4.1 NZ Store APIs** (Woolworths, Pak'nSave, New World)
- **Source:** `src/services/nzStoreApi.ts`
- **Coverage:** New Zealand retail stores
- **Nutrition Data Provided:**
  - Store-specific nutrition data
  - May include Nutri-Score if available
- **Quality Score:** 70/100
- **Confidence Weight:** 0.30 (medium)

#### **4.2 AU Retailer APIs** (Woolworths, Coles, IGA)
- **Source:** `src/services/auRetailerScraping.ts`
- **Coverage:** Australian retail stores
- **Nutrition Data Provided:**
  - Store-specific nutrition data
  - May include Nutri-Score if available
- **Quality Score:** 70/100
- **Confidence Weight:** 0.30 (medium)

---

### **Tier 5: General Product APIs** (Lower Priority)

#### **5.1 Barcode Lookup API**
- **Source:** `src/services/barcodeLookupApi.ts`
- **Coverage:** 100 requests/day
- **Nutrition Data Provided:**
  - Basic nutrition data (if available)
- **Nutri-Score:** ❌ Not provided
- **Quality Score:** 50-70
- **Confidence Weight:** 0.55 (medium)

#### **5.2 UPC Database API**
- **Source:** `src/services/upcDatabaseApi.ts`
- **Coverage:** 4.3M+ products
- **Nutrition Data Provided:**
  - Basic nutrition data (if available)
- **Nutri-Score:** ❌ Not provided
- **Quality Score:** 50-70
- **Confidence Weight:** 0.20 (low)

#### **5.3 EAN-Search API**
- **Source:** `src/services/eanSearchApi.ts`
- **Coverage:** 1B+ products
- **Nutrition Data Provided:**
  - Basic nutrition data (if available)
- **Nutri-Score:** ❌ Not provided
- **Quality Score:** 50-70
- **Confidence Weight:** 0.20 (low)

---

### **Tier 6: Web Search Fallback** (Last Resort)

#### **6.1 Web Scraping**
- **Source:** `src/services/webScrapingService.ts`, `src/services/webSearchFallback.ts`
- **Coverage:** Any product (DuckDuckGo, Google, etc.)
- **Nutrition Data Provided:**
  - Extracted from web pages using regex patterns
  - Calories, protein, fat, carbohydrates, sugars, sodium
  - **Very unreliable** - may be incomplete or incorrect
- **Nutri-Score:** ❌ Not provided
- **Quality Score:** 30-50
- **Completion Score:** 30-50
- **Confidence Weight:** 0.30 (low)
- **Note:** Only used when all other sources fail

---

## 2. NUTRI-SCORE SOURCES

### **Primary Source: Open Food Facts**

**Nutri-Score is ONLY provided by Open Food Facts** in the app's current implementation.

- **Field:** `product.nutriscore_grade`
- **Values:** `'a' | 'b' | 'c' | 'd' | 'e' | 'unknown'`
- **Calculation:** Done by OFF using the official EU Nutri-Score algorithm
- **Algorithm:** Based on:
  - Negative points: Energy, saturated fat, sugars, sodium
  - Positive points: Fruits/vegetables, fiber, protein
  - Final grade: A (best) to E (worst)

### **Other Sources Do NOT Provide Nutri-Score**

The following sources provide nutrition data but **do NOT calculate or provide Nutri-Score**:
- ❌ USDA FoodData Central
- ❌ AFCD (Australian Food Composition Database)
- ❌ NZFCD (New Zealand Food Composition Database)
- ❌ Edamam API
- ❌ Nutritionix API
- ❌ Spoonacular API
- ❌ All other APIs

### **Fallback Behavior**

When Nutri-Score is **not available**:
- **Body Pillar defaults to 25 points** (neutral baseline)
- Penalties still apply (additives, risky tags, irritants, fragrance, NOVA)
- Final Body score = 25 - penalties (bounded to 0-25)

---

## 3. NUTRITION DATA MERGING

When multiple sources provide nutrition data, the system uses **weighted averaging**:

**Location:** `src/services/productDataMerger.ts`

**Merging Strategy:**
1. **Sort sources by confidence weight** (highest first)
2. **Base product:** Highest-weight source
3. **Nutrition data:** Weighted average across all sources
4. **Nutri-Score:** Taken from highest-weight source that has it (usually OFF)

**Example:**
- OFF (weight 0.85): Nutri-Score B, basic nutrition
- USDA (weight 0.90): Detailed nutrition, no Nutri-Score
- **Result:** USDA base, but Nutri-Score B from OFF is preserved

---

## 4. NUTRITION DATA FORMAT

All nutrition data is normalized to **per-100g format**:

```typescript
interface ProductNutriments {
  'energy-kcal_100g'?: number;
  'energy-kj_100g'?: number;
  'proteins_100g'?: number;
  'fat_100g'?: number;
  'saturated-fat_100g'?: number;
  'carbohydrates_100g'?: number;
  'sugars_100g'?: number;
  'fiber_100g'?: number;
  'salt_100g'?: number;
  'sodium_100g'?: number;
  'calcium_100g'?: number;
  'iron_100g'?: number;
  'vitamin-c_100g'?: number;
  // ... more nutrients
}
```

**Conversion Logic:**
- **Per-serving → Per-100g:** `value_per_100g = (value_per_serving / serving_weight_g) × 100`
- **mg → g:** `value_g = value_mg / 1000`
- **Sodium → Salt:** `salt_g = sodium_g × 2.54`

---

## 5. BODY PILLAR SCORING LOGIC

**Location:** `src/lib/truscoreEngine.ts` (lines 104-169)

### **With Nutri-Score:**
```typescript
if (hasNutriScore) {
  const ns = product.nutriscore_grade?.toLowerCase();
  body = { a: 25, b: 20, c: 15, d: 10, e: 5 }[ns] || 25;
}
```

### **Without Nutri-Score:**
```typescript
body = 25; // Default baseline
// Then apply penalties:
// - Additives (weighted: -0.5 to -3 each, max -15)
// - Risky tags (-4 each)
// - Irritants (-10)
// - Fragrance (-10)
// - NOVA 4 (-10), NOVA 3 (-5)
```

---

## 6. SUMMARY TABLE

| Source | Nutrition Data | Nutri-Score | Quality | Confidence | Notes |
|--------|---------------|-------------|---------|------------|-------|
| **Open Food Facts** | ✅ Complete | ✅ **YES** | 85 | 0.85 | **Primary Nutri-Score source** |
| **USDA FoodData** | ✅ Complete | ❌ No | 90 | 0.90 | Official US data |
| **AFCD** | ✅ Complete (256 nutrients) | ❌ No | 85 | 0.95 | Australian government |
| **NZFCD** | ✅ Complete (256 nutrients) | ❌ No | 85 | 0.95 | NZ government |
| **Edamam** | ✅ Complete | ❌ No | 60-80 | 0.55 | Nutrition-focused API |
| **Nutritionix** | ✅ Complete | ❌ No | 60-80 | 0.55 | Nutrition-focused API |
| **Spoonacular** | ✅ Complete | ❌ No | 60-80 | 0.25 | Food-focused API |
| **Store APIs** | ⚠️ Variable | ⚠️ Maybe | 70 | 0.30 | Country-specific |
| **Web Search** | ⚠️ Incomplete | ❌ No | 30-50 | 0.30 | Last resort |

---

## 7. KEY TAKEAWAYS

1. **Nutri-Score comes ONLY from Open Food Facts** - no other source calculates it
2. **Government databases (USDA, AFCD, NZFCD)** provide high-quality nutrition data but no Nutri-Score
3. **Nutrition APIs (Edamam, Nutritionix, Spoonacular)** provide detailed nutrition but no Nutri-Score
4. **When Nutri-Score is missing**, Body Pillar defaults to 25 points, then applies penalties
5. **Nutrition data is merged** using weighted averaging when multiple sources are available
6. **All nutrition data is normalized** to per-100g format for consistency

---

## 8. FILES REFERENCE

| File | Purpose |
|------|---------|
| `src/services/openFoodFacts.ts` | Primary source for Nutri-Score |
| `src/services/usdaFoodData.ts` | US government nutrition data |
| `src/services/afcdDatabase.ts` | Australian government nutrition data |
| `src/services/nzfcdDatabase.ts` | NZ government nutrition data |
| `src/services/edamamApi.ts` | Edamam nutrition API |
| `src/services/nutritionixApi.ts` | Nutritionix nutrition API |
| `src/services/spoonacularApi.ts` | Spoonacular nutrition API |
| `src/services/productDataMerger.ts` | Nutrition data merging logic |
| `src/lib/truscoreEngine.ts` | Body Pillar scoring (uses Nutri-Score) |

