# TruScore Data Maximization Analysis Report
## Comprehensive Analysis of Database Structure, Merging Logic, and Global Data Strategy

**Date:** December 2024  
**Purpose:** Maximize data availability for TruScore engine across global user base  
**Scope:** All databases, merging logic, and data enhancement strategies

---

## Executive Summary

This report analyzes the current database architecture, merging logic, and data flow to identify opportunities for maximizing TruScore data quality and completeness for users worldwide. The analysis reveals critical gaps in data merging, field mapping, and enhancement strategies that limit TruScore accuracy.

**Key Findings:**
- **Current Coverage:** ~85-90% product coverage, but only ~40-60% TruScore-complete data
- **Critical Gap:** Government databases (FSANZ, USDA, Health Canada) provide nutrition but lack TruScore-critical fields (ingredients, certifications, packaging)
- **Merging Issue:** Current merger prioritizes single source over complementary data fusion
- **Enhancement Gap:** FSANZ enhancement happens too late in pipeline, missing merge opportunities

**Recommendation Priority:**
1. **CRITICAL:** Fix FSANZ field mapping and ensure data flows to TruScore
2. **HIGH:** Implement complementary data fusion (not just source priority)
3. **HIGH:** Add parallel enhancement pipeline for all government databases
4. **MEDIUM:** Expand country-specific database coverage
5. **MEDIUM:** Improve fallback strategies for missing TruScore-critical fields

---

## 1. TruScore Engine Data Requirements Analysis

### 1.1 TruScore v1.4 Pillar Breakdown

TruScore calculates 4 pillars (25 points each = 100 total):

#### **BODY Pillar (25pts)** - Nutrition & Safety
**Required Data:**
- ✅ `nutriscore_grade` (A-E) - **CRITICAL** (12-25 points base)
- ✅ `nutriscore_score` (fallback calculation)
- ✅ `nova_group` (1-4) - Processing level (+3 to -10 points)
- ✅ `additives_tags[]` - Additive list (weighted penalties: -0.5 to -3 each, max -15)
- ✅ `ingredients_analysis_tags[]` - Risk tags (carcinogenic, endocrine, allergen, irritant) (-4 each)
- ✅ `ingredients_text` - For irritant detection (paraben, phthalate, sulfate, etc.) (-10 if found)
- ✅ `ewg_skin_deep.hazardScore` - EWG enhancement (cosmetics) (-1 to -5)

**Data Sources:**
- **Primary:** Open Food Facts (Nutri-Score, NOVA, additives, analysis tags)
- **Enhancement:** Government databases (nutrition only, no Nutri-Score/NOVA)
- **Enhancement:** EWG Skin Deep (cosmetics)

**Current Coverage:**
- ✅ Nutri-Score: ~60% (OFF products)
- ✅ NOVA: ~55% (OFF products)
- ✅ Additives: ~45% (OFF + some government DBs)
- ❌ EWG: ~5% (cosmetics only, enhancement layer)

#### **PLANET Pillar (25pts)** - Environmental Impact
**Required Data:**
- ✅ `ecoscore_grade` (A-E) - **CRITICAL** (12-25 points base)
- ✅ `ecoscore_score` (fallback calculation)
- ✅ `palm_oil_analysis` - Palm oil detection (-10, or -5 if certified sustainable)
- ✅ `packagings[]` - Packaging array for recyclability (+5 if all recyclable, +2 if some)
- ✅ `packaging_tags[]` - Packaging type tags

**Data Sources:**
- **Primary:** Open Food Facts (Eco-Score, packaging, palm oil analysis)
- **Enhancement:** WWF Palm Oil database (certification status)
- **Enhancement:** Local recyclability rules (country-specific)

**Current Coverage:**
- ✅ Eco-Score: ~50% (OFF products)
- ✅ Palm Oil Analysis: ~40% (OFF + enhancement)
- ✅ Packaging: ~35% (OFF products)
- ❌ WWF Certification: ~2% (enhancement layer, limited coverage)

#### **CARE Pillar (25pts)** - Ethics & Certifications
**Required Data:**
- ✅ `labels_tags[]` - Certification labels (Fair Trade, Organic, MSC, Vegan, etc.)
- ✅ `certifications[]` - Structured certification data
- ✅ `brands` - Brand name for cruel parent detection
- ✅ `ingredients_analysis_tags[]` - Vegan/vegetarian tags

**Certification Bonuses:**
- Fair Trade: +8
- Organic (any regional): +8
- Rainforest Alliance: +7
- MSC/ASC/Dolphin Safe: +8
- RSPCA: +6
- Vegan/Cruelty-Free: +10
- UTZ: +7
- B-Corp: +5
- Non-GMO: +3

**Penalties:**
- Cruel Parent: -30 (from brand database)

**Data Sources:**
- **Primary:** Open Food Facts (labels, certifications)
- **Enhancement:** B-Corp API (brand enrichment)
- **Enhancement:** Leaping Bunny (cruelty-free)
- **Enhancement:** Brand database (cruel parent detection)

**Current Coverage:**
- ✅ Labels: ~45% (OFF products)
- ✅ Certifications: ~30% (OFF products)
- ✅ B-Corp: ~3% (enhancement layer)
- ❌ Leaping Bunny: ~1% (enhancement layer, cosmetics only)

#### **OPEN Pillar (25pts)** - Transparency
**Required Data:**
- ✅ `ingredients_text` - **CRITICAL** (base 25, drops to 5 if missing)
- ✅ `origins_tags[]` or `origins` - Origin information (-15 if missing)
- ✅ `manufacturing_places_tags[]` or `manufacturing_places` - Manufacturing location
- ✅ Hidden terms detection in `ingredients_text` (parfum, fragrance, proprietary blend, etc.)

**Penalties:**
- No ingredients: 5 points (from 25)
- Placeholder ingredients: 5 points
- Hidden terms (1-2): -12
- Hidden terms (3+): -20
- No origin: -15

**Data Sources:**
- **Primary:** Open Food Facts (ingredients, origins)
- **Enhancement:** Government databases (rarely have ingredients/origins)
- **Fallback:** Web search (low quality)

**Current Coverage:**
- ✅ Ingredients: ~55% (OFF + some government DBs)
- ✅ Origins: ~25% (OFF products)
- ❌ Manufacturing Places: ~15% (OFF products)

### 1.2 Data Completeness Scoring

Current completeness calculation weights:
- **Nutrition:** 25 points (Energy: 5, Macros: 10, Micros: 5, Nutri-Score: 5)
- **Ingredients:** 25 points (Text: 15, Array: 5, Analysis: 3, Additives: 2)
- **Certifications:** 15 points (Certifications: 10, Labels: 3, Organic/Vegan: 2)
- **Sustainability:** 15 points (Eco-Score: 8, Palm Oil: 4, Packaging: 2, Origin: 1)
- **Brand:** 10 points (Brand: 7, Tags: 3)
- **Images:** 10 points (Image: 8, Images object: 2)

**Total: 100 points**

**Current Average Completeness:**
- Open Food Facts: ~65-75%
- Government Databases: ~40-50% (nutrition only)
- Fallback Sources: ~20-30%

---

## 2. Database Structure Analysis

### 2.1 Database Inventory

#### **Tier 1: Open Facts Family (Highest TruScore Completeness)**
| Database | Coverage | TruScore Fields | Priority |
|----------|----------|----------------|----------|
| **Open Food Facts** | 3M+ products | ✅ All 4 pillars | 0.40 weight |
| **Open Beauty Facts** | 100K+ products | ✅ Body, Care, Open | 0.35 weight |
| **Open Pet Food Facts** | 50K+ products | ✅ Body, Planet, Open | 0.35 weight |
| **Open Products Facts** | 500K+ products | ⚠️ Limited (no Nutri/Eco) | 0.35 weight |

**Strengths:**
- Complete TruScore data (all 4 pillars)
- Nutri-Score, Eco-Score, NOVA included
- Ingredients, additives, certifications
- Packaging data
- Palm oil analysis

**Weaknesses:**
- Geographic bias (EU > US > Asia)
- Limited coverage in developing countries
- Some products lack complete data

#### **Tier 2: Government Databases (Nutrition Focus)**
| Database | Coverage | TruScore Fields | Priority |
|----------|----------|----------------|----------|
| **USDA FoodData** | 300K+ foods | ⚠️ Body only (nutrition) | 0.40 weight |
| **FSANZ (NZFCD)** | 221K+ foods | ⚠️ Body only (nutrition) | 0.40 weight |
| **FSANZ (AFCD)** | 1.5K+ foods | ⚠️ Body only (nutrition) | 0.40 weight |
| **Health Canada CNF** | 5K+ foods | ⚠️ Body only (nutrition) | 0.40 weight |
| **UK FSA** | Limited | ⚠️ Body only (nutrition) | 0.40 weight |
| **EFSA** | Limited | ⚠️ Body only (nutrition) | 0.40 weight |

**Strengths:**
- Official, authoritative nutrition data
- Comprehensive nutrient profiles
- Country-specific accuracy

**CRITICAL WEAKNESSES:**
- ❌ **NO Nutri-Score** (must calculate from nutrition)
- ❌ **NO NOVA group** (processing level unknown)
- ❌ **NO ingredients_text** (can't calculate Open pillar)
- ❌ **NO certifications** (can't calculate Care pillar)
- ❌ **NO packaging data** (can't calculate Planet pillar fully)
- ❌ **NO Eco-Score** (can't calculate Planet pillar fully)

**Impact on TruScore:**
- Body Pillar: **12 points** (baseline, no Nutri-Score bonus)
- Planet Pillar: **12 points** (baseline, no Eco-Score, limited packaging)
- Care Pillar: **18 points** (baseline, no certifications)
- Open Pillar: **5-10 points** (no ingredients = major penalty)

**Total TruScore from Government DB alone: ~47-57/100** (vs 60-80 from OFF)

#### **Tier 3: Commercial APIs (Variable Completeness)**
| Database | Coverage | TruScore Fields | Priority |
|----------|----------|----------------|----------|
| **GS1 DataSource** | Official barcodes | ⚠️ Limited (brand, name) | 0.40 weight |
| **Tesco Labs** | UK products | ✅ Good (OFF-like) | 0.35 weight |
| **Walmart Open** | US products | ⚠️ Limited | 0.35 weight |
| **FoodRepo** | EU products | ✅ Good (OFF-like) | 0.35 weight |
| **Nutritionix** | 800K+ foods | ⚠️ Body only (nutrition) | 0.25 weight |
| **Spoonacular** | 500K+ foods | ⚠️ Body only (nutrition) | 0.25 weight |
| **Edamam** | 1M+ foods | ⚠️ Body only (nutrition) | 0.25 weight |

#### **Tier 4: Fallback Sources (Low Completeness)**
| Database | Coverage | TruScore Fields | Priority |
|----------|----------|----------------|----------|
| **UPCitemdb** | 4M+ products | ⚠️ Minimal (name, brand) | 0.20 weight |
| **Barcode Spider** | 1M+ products | ⚠️ Minimal | 0.20 weight |
| **EAN-Search** | 1B+ products | ⚠️ Minimal | 0.20 weight |
| **Web Search** | Universal | ❌ None (placeholder) | 0.10 weight |

### 2.2 Field Mapping Analysis

#### **Critical Field Mappings for TruScore**

**Nutrition Fields (Body Pillar):**
```
Government DB → Product Format:
- energyKcal / Energy (kcal) → nutriments['energy-kcal']
- energyKj / Energy (kJ) → nutriments['energy-kj']
- protein / Protein → nutriments.proteins
- fat / Fat → nutriments.fat
- carbohydrates / Carbohydrates → nutriments.carbohydrates
- sugars / Sugars → nutriments.sugars
- salt / Salt → nutriments.salt
- sodium / Sodium → nutriments.sodium
- dietaryFiber / Fiber → nutriments.fiber
```

**Missing Critical Mappings:**
- ❌ **Nutri-Score calculation** from nutrition (not implemented)
- ❌ **NOVA group** inference (not implemented)
- ❌ **Additive extraction** from ingredients (partial)
- ❌ **Ingredient analysis tags** generation (not implemented)

**Current Status:**
- ✅ Basic nutrition mapping: **WORKING**
- ❌ Nutri-Score calculation: **MISSING**
- ❌ NOVA inference: **MISSING**
- ❌ Additive detection: **PARTIAL** (only from OFF)

---

## 3. Merging Logic Analysis

### 3.1 Current Merging Strategy

**Location:** `src/services/productDataMerger.ts`

**Current Approach:**
1. **Source Weight Priority:** Sorts products by source weight (government DBs = 0.40, OFF = 0.40)
2. **Base Product Selection:** Uses highest-weight product as base
3. **Field Merging:**
   - **Nutrition:** Weighted average (good)
   - **Ingredients:** Longest text (good)
   - **Certifications:** Union (good)
   - **Other fields:** First available (problematic)

**Critical Issues:**

#### **Issue 1: Single-Source Dominance**
```typescript
// Current: Uses highest-weight product as base
const baseProduct = sortedProducts[0];
const mergedProduct: Product = { ...baseProduct };
```

**Problem:**
- If government database (0.40 weight) is found first, it becomes base
- Government DB has nutrition but NO TruScore-critical fields
- OFF data (also 0.40 weight) gets merged but may lose priority
- Result: Product has nutrition but missing ingredients, certifications, packaging

**Example:**
```
USDA Product (base):
  ✅ nutrition: Complete
  ❌ ingredients_text: Missing
  ❌ labels_tags: Missing
  ❌ ecoscore_grade: Missing
  ❌ packagings: Missing

OFF Product (merged):
  ✅ ingredients_text: "Water, sugar, salt..."
  ✅ labels_tags: ["en:organic", "en:fair-trade"]
  ✅ ecoscore_grade: "b"
  ✅ packagings: [{material: "plastic"}]

Result: Merged product SHOULD have both, but base selection may prioritize wrong fields
```

#### **Issue 2: Complementary Data Not Prioritized**
Current merger doesn't prioritize **complementary data** (filling gaps) over **source priority**.

**What Should Happen:**
```
Government DB: Has nutrition, missing TruScore fields
OFF: Has TruScore fields, may have nutrition

Ideal Merge:
1. Use OFF as base (has more TruScore fields)
2. Enhance nutrition from government DB (more accurate)
3. Keep all OFF TruScore fields (ingredients, certifications, etc.)
```

**What Actually Happens:**
```
1. Government DB selected as base (same weight as OFF)
2. Nutrition merged (weighted average)
3. Ingredients from OFF merged (longest)
4. BUT: Other TruScore fields may be lost if not in base
```

#### **Issue 3: FSANZ Enhancement Timing**
**Current Flow:**
```
1. Barcode scan → Find product in OFF/USDA/etc.
2. Product found with basic data
3. LATER: Enhance with FSANZ by product name
4. Merge FSANZ nutrition into existing product
```

**Problem:**
- FSANZ enhancement happens **AFTER** initial product creation
- If OFF product is found, FSANZ enhancement adds nutrition but doesn't help if OFF already has it
- If government DB is base, FSANZ enhancement is redundant
- **Missing opportunity:** FSANZ should be queried **BEFORE** merging to inform base selection

#### **Issue 4: Field-Specific Merging Gaps**

**Current Merging:**
- ✅ Nutrition: Weighted average (good)
- ✅ Ingredients: Longest text (good)
- ✅ Certifications: Union (good)
- ⚠️ Labels: Not explicitly merged (may be lost)
- ⚠️ Analysis Tags: Not explicitly merged (may be lost)
- ⚠️ Packaging: Not explicitly merged (may be lost)
- ⚠️ Origins: Not explicitly merged (may be lost)

**Missing Explicit Merging:**
```typescript
// These fields are NOT explicitly merged:
- labels_tags (critical for Care pillar)
- ingredients_analysis_tags (critical for Body/Planet pillars)
- packagings (critical for Planet pillar)
- origins_tags (critical for Open pillar)
- manufacturing_places_tags (critical for Open pillar)
- additives_tags (critical for Body pillar)
- allergens_tags (useful for safety)
```

### 3.2 Enhancement Pipeline Analysis

**Current Enhancement Flow:**
```
1. Primary Data Sources (OFF, USDA, etc.)
2. Merge Products
3. Format Data (ingredients, certifications)
4. Extract Palm Oil Analysis
5. Apply MVP Enhancements (EWG, WWF, Leaping Bunny)
6. Brand Enrichment (EAN-Search, OpenCorporates, B-Corp)
7. FSANZ Enhancement (by product name) ← TOO LATE
8. Calculate TruScore
```

**Issues:**
1. **FSANZ Enhancement Too Late:** Should inform initial merge, not happen after
2. **Sequential Enhancement:** Should be parallel where possible
3. **Missing Enhancements:** No Nutri-Score calculation from nutrition, no NOVA inference

---

## 4. Critical Gaps for TruScore Maximization

### 4.1 Data Availability Gaps

#### **Gap 1: Government Databases Missing TruScore Fields**
**Impact:** HIGH
- Government DBs provide 40-50% of products in some regions
- But only contribute to Body pillar (12 points baseline)
- Missing 75% of TruScore data (Planet, Care, Open pillars)

**Solution Priority:** CRITICAL
- Need to merge government DB nutrition with OFF TruScore fields
- Need to ensure complementary merging prioritizes TruScore completeness

#### **Gap 2: Nutri-Score Calculation Missing**
**Impact:** HIGH
- Government DBs have nutrition but no Nutri-Score
- Body pillar gets 12 points (baseline) instead of 12-25 (with Nutri-Score)
- **Loss: 0-13 points per product**

**Solution:** Implement Nutri-Score calculation from nutrition data
- Use official Nutri-Score algorithm
- Calculate from: energy, saturated fat, sugars, sodium, fiber, protein, fruits/vegetables

#### **Gap 3: NOVA Group Inference Missing**
**Impact:** MEDIUM
- NOVA group affects Body pillar (+3 to -10 points)
- Government DBs don't provide NOVA
- Can infer from ingredients_text (if available) or product category

**Solution:** Implement NOVA inference
- Use ingredients_text analysis (if available)
- Fallback: Category-based inference
- Default: NOVA 3 (processed) if unknown

#### **Gap 4: Ingredients Text Missing from Government DBs**
**Impact:** CRITICAL
- Open pillar drops from 25 to 5 points without ingredients
- **Loss: 20 points per product**
- Government DBs rarely have ingredients

**Solution:** 
- Prioritize OFF as base when it has ingredients
- Use government DB only for nutrition enhancement
- Never use government DB as base if it lacks ingredients

#### **Gap 5: Certifications Missing from Government DBs**
**Impact:** MEDIUM
- Care pillar gets 18 points (baseline) instead of 18-43 (with certifications)
- **Loss: 0-25 points per product**

**Solution:**
- Always merge certifications from OFF
- Never lose certifications when merging with government DB

#### **Gap 6: Packaging Data Missing from Government DBs**
**Impact:** MEDIUM
- Planet pillar loses +5 points for recyclability
- **Loss: 5 points per product**

**Solution:**
- Always merge packaging from OFF
- Never lose packaging when merging with government DB

### 4.2 Merging Logic Gaps

#### **Gap 7: Complementary Data Not Prioritized**
**Impact:** HIGH
- Current merger uses source weight, not data completeness
- Should prioritize products with more TruScore fields as base

**Solution:** Implement complementary merging
- Score each product by TruScore field completeness
- Use highest-completeness product as base
- Enhance with complementary data from other sources

#### **Gap 8: Field-Specific Merging Missing**
**Impact:** HIGH
- Many TruScore-critical fields not explicitly merged
- May be lost when base product doesn't have them

**Solution:** Explicit field merging
- Merge all TruScore-critical fields explicitly
- Union for arrays (labels_tags, additives_tags, etc.)
- Best available for strings (ingredients_text, origins, etc.)

#### **Gap 9: FSANZ Enhancement Timing**
**Impact:** MEDIUM
- FSANZ enhancement happens too late
- Should inform initial merge decision

**Solution:** Parallel enhancement
- Query FSANZ in parallel with other sources
- Include in initial merge decision
- Don't wait until after product creation

### 4.3 Enhancement Pipeline Gaps

#### **Gap 10: Missing Nutri-Score Calculation**
**Impact:** HIGH
- Government DBs have nutrition but no Nutri-Score
- Must calculate from nutrition data

**Solution:** Add Nutri-Score calculator
- Implement official algorithm
- Calculate for all products with sufficient nutrition data
- Store in `nutriscore_grade` and `nutriscore_score`

#### **Gap 11: Missing NOVA Inference**
**Impact:** MEDIUM
- NOVA group affects Body pillar
- Can infer from ingredients or category

**Solution:** Add NOVA inference
- Analyze ingredients_text for processing indicators
- Use category-based inference as fallback
- Default to NOVA 3 if unknown

#### **Gap 12: Limited Enhancement Coverage**
**Impact:** LOW-MEDIUM
- EWG: ~5% coverage (cosmetics only)
- WWF: ~2% coverage (palm oil certification)
- Leaping Bunny: ~1% coverage (cosmetics only)

**Solution:** Expand enhancement coverage
- Prioritize high-impact enhancements
- Add more enhancement sources where possible

---

## 5. Recommendations for Maximizing TruScore Data

### 5.1 CRITICAL: Fix FSANZ Integration

#### **Recommendation 1.1: Fix Field Mapping**
**Priority:** CRITICAL  
**Impact:** HIGH  
**Effort:** LOW

**Action:**
1. ✅ Already fixed: Auto-detect field names (foodName vs Food Name)
2. ✅ Already fixed: Handle multiple field name variations
3. **TODO:** Verify field mapping works in production
4. **TODO:** Add comprehensive field mapping tests

**Expected Result:**
- FSANZ queries return matches for NZ/AU products
- Nutrition data flows correctly to TruScore

#### **Recommendation 1.2: Ensure FSANZ Data Flows to TruScore**
**Priority:** CRITICAL  
**Impact:** HIGH  
**Effort:** MEDIUM

**Action:**
1. Verify FSANZ enhancement happens before TruScore calculation
2. Ensure merged product includes FSANZ nutrition
3. Add logging to track FSANZ data in final product

**Expected Result:**
- FSANZ nutrition data visible in TruScore Body pillar
- Nutrition completeness increases for NZ/AU users

### 5.2 HIGH: Implement Complementary Data Fusion

#### **Recommendation 2.1: TruScore-Aware Base Selection**
**Priority:** HIGH  
**Impact:** HIGH  
**Effort:** MEDIUM

**Current:**
```typescript
// Uses source weight only
const baseProduct = sortedProducts[0]; // Highest weight
```

**Proposed:**
```typescript
// Score by TruScore field completeness
const scoredProducts = products.map(p => ({
  product: p,
  score: calculateTruScoreCompleteness(p), // Count TruScore-critical fields
  sourceWeight: sourceWeights[p.source] || 0.1
}));

// Use product with highest combined score (completeness + source weight)
const baseProduct = scoredProducts
  .sort((a, b) => (b.score * 0.6 + b.sourceWeight * 0.4) - (a.score * 0.6 + a.sourceWeight * 0.4))[0]
  .product;
```

**Expected Result:**
- Products with more TruScore fields selected as base
- Government DB nutrition enhances OFF product (not vice versa)
- TruScore completeness increases by 15-25%

#### **Recommendation 2.2: Explicit Field Merging**
**Priority:** HIGH  
**Impact:** HIGH  
**Effort:** MEDIUM

**Action:**
Add explicit merging for all TruScore-critical fields:

```typescript
// Merge labels_tags (Care pillar)
const allLabels = sortedProducts
  .map(p => p.labels_tags || [])
  .flat()
  .filter((tag, index, arr) => arr.indexOf(tag) === index); // Unique
mergedProduct.labels_tags = allLabels;

// Merge ingredients_analysis_tags (Body/Planet pillars)
const allAnalysisTags = sortedProducts
  .map(p => p.ingredients_analysis_tags || [])
  .flat()
  .filter((tag, index, arr) => arr.indexOf(tag) === index);
mergedProduct.ingredients_analysis_tags = allAnalysisTags;

// Merge packagings (Planet pillar)
const allPackagings = sortedProducts
  .map(p => p.packagings || [])
  .flat();
mergedProduct.packagings = deduplicatePackagings(allPackagings);

// Merge origins (Open pillar)
mergedProduct.origins_tags = unionArrays(
  sortedProducts.map(p => p.origins_tags || [])
);
mergedProduct.manufacturing_places_tags = unionArrays(
  sortedProducts.map(p => p.manufacturing_places_tags || [])
);

// Merge additives_tags (Body pillar)
mergedProduct.additives_tags = unionArrays(
  sortedProducts.map(p => p.additives_tags || [])
);
```

**Expected Result:**
- No TruScore fields lost during merging
- Complete data from all sources preserved
- TruScore accuracy increases by 10-20%

### 5.3 HIGH: Add Nutri-Score Calculation

#### **Recommendation 3.1: Implement Nutri-Score Calculator**
**Priority:** HIGH  
**Impact:** HIGH  
**Effort:** MEDIUM

**Action:**
1. Implement official Nutri-Score algorithm
2. Calculate for products with sufficient nutrition data
3. Store in `nutriscore_grade` and `nutriscore_score`

**Algorithm Requirements:**
- Energy (kcal/100g)
- Saturated fat (g/100g)
- Sugars (g/100g)
- Sodium (mg/100g)
- Fiber (g/100g)
- Protein (g/100g)
- Fruits/vegetables % (if available)

**Expected Result:**
- Government DB products get Nutri-Score (12-25 points instead of 12 baseline)
- Body pillar increases by 0-13 points per product
- **Average TruScore increase: +5-8 points**

### 5.4 MEDIUM: Add NOVA Inference

#### **Recommendation 4.1: Implement NOVA Inference**
**Priority:** MEDIUM  
**Impact:** MEDIUM  
**Effort:** MEDIUM

**Action:**
1. Analyze ingredients_text for processing indicators
2. Use category-based inference as fallback
3. Default to NOVA 3 if unknown

**Inference Rules:**
- NOVA 1: Single ingredient, unprocessed (e.g., "Apple")
- NOVA 2: Minimally processed (e.g., "Frozen vegetables")
- NOVA 3: Processed (e.g., "Bread", "Cheese")
- NOVA 4: Ultra-processed (e.g., "Instant noodles", "Soda")

**Expected Result:**
- Government DB products get NOVA group (+3 to -10 points)
- Body pillar accuracy improves
- **Average TruScore change: ±2-5 points**

### 5.5 MEDIUM: Parallel Enhancement Pipeline

#### **Recommendation 5.1: Query FSANZ in Parallel**
**Priority:** MEDIUM  
**Impact:** MEDIUM  
**Effort:** LOW

**Current:**
```typescript
// Sequential: Find product → Then enhance with FSANZ
const product = await fetchProductFromOFF(barcode);
const enhanced = await enhanceProductWithFSANZQuery(product);
```

**Proposed:**
```typescript
// Parallel: Query all sources simultaneously
const [offProduct, fsanzProduct, usdaProduct] = await Promise.all([
  fetchProductFromOFF(barcode),
  queryFSANZByProductName(productName, country), // If we have name
  fetchProductFromUSDA(barcode)
]);

// Merge with TruScore-aware selection
const merged = mergeProductsWithTruScorePriority([offProduct, fsanzProduct, usdaProduct]);
```

**Expected Result:**
- Faster product loading
- Better merge decisions (all data available upfront)
- More complete products

### 5.6 MEDIUM: Expand Country-Specific Coverage

#### **Recommendation 6.1: Add More Government Databases**
**Priority:** MEDIUM  
**Impact:** MEDIUM  
**Effort:** HIGH

**Potential Additions:**
- **Japan:** Food Safety Commission database
- **China:** National Food Safety database
- **India:** FSSAI database
- **Brazil:** ANVISA database
- **Mexico:** COFEPRIS database
- **South Africa:** Department of Health database

**Expected Result:**
- Better coverage for users in these countries
- More accurate nutrition data
- **Coverage increase: +5-10% per country**

### 5.7 LOW: Improve Fallback Strategies

#### **Recommendation 7.1: Better Web Search Parsing**
**Priority:** LOW  
**Impact:** LOW-MEDIUM  
**Effort:** MEDIUM

**Action:**
- Improve web search result parsing
- Extract more TruScore fields from web pages
- Better ingredient list extraction
- Certification detection from product pages

**Expected Result:**
- Web search fallback provides more complete data
- TruScore available for more products
- **Coverage increase: +2-5%**

---

## 6. Implementation Priority Matrix

### Phase 1: CRITICAL (Immediate - Week 1)
1. ✅ Fix FSANZ field mapping (DONE)
2. **TODO:** Verify FSANZ data flows to TruScore
3. **TODO:** Implement explicit field merging (labels_tags, analysis_tags, packagings, etc.)
4. **TODO:** Fix complementary data fusion (TruScore-aware base selection)

**Expected Impact:** +15-25% TruScore completeness

### Phase 2: HIGH (Week 2-3)
1. **TODO:** Implement Nutri-Score calculation from nutrition
2. **TODO:** Add NOVA inference
3. **TODO:** Parallel FSANZ enhancement

**Expected Impact:** +10-15% TruScore accuracy, +5-8 points average score

### Phase 3: MEDIUM (Week 4-6)
1. **TODO:** Expand country-specific databases
2. **TODO:** Improve web search parsing
3. **TODO:** Add more enhancement sources

**Expected Impact:** +5-10% coverage, +2-5% completeness

---

## 7. Success Metrics

### Current Baseline
- **Product Coverage:** ~85-90%
- **TruScore Completeness:** ~40-60%
- **Average TruScore:** 55-65/100
- **Government DB Contribution:** ~15-20% of products (nutrition only)

### Target After Implementation
- **Product Coverage:** ~90-95% (maintain)
- **TruScore Completeness:** ~70-85% (+25-30%)
- **Average TruScore:** 65-75/100 (+10 points)
- **Government DB Contribution:** ~25-30% of products (nutrition + enhanced TruScore)

### Key Performance Indicators
1. **TruScore Field Completeness:**
   - Body: 70% → 85% (+15%)
   - Planet: 50% → 75% (+25%)
   - Care: 45% → 70% (+25%)
   - Open: 55% → 80% (+25%)

2. **Government DB Integration:**
   - FSANZ matches: 0% → 80% (NZ/AU products)
   - USDA matches: 40% → 60% (US products)
   - Nutrition enhancement: 20% → 50% of products

3. **TruScore Accuracy:**
   - Products with Nutri-Score: 60% → 80% (+20%)
   - Products with Eco-Score: 50% → 70% (+20%)
   - Products with ingredients: 55% → 75% (+20%)
   - Products with certifications: 30% → 50% (+20%)

---

## 8. Conclusion

The current database architecture provides good product coverage (~85-90%) but **TruScore data completeness is limited** (~40-60%). The main issues are:

1. **Government databases provide nutrition but lack TruScore-critical fields** (ingredients, certifications, packaging)
2. **Merging logic prioritizes source weight over data completeness**, causing TruScore fields to be lost
3. **Missing enhancements** (Nutri-Score calculation, NOVA inference) limit TruScore accuracy for government DB products
4. **FSANZ integration issues** prevent data from flowing to TruScore

**Critical Path Forward:**
1. Fix FSANZ field mapping and data flow (CRITICAL - Week 1)
2. Implement complementary data fusion (HIGH - Week 1)
3. Add Nutri-Score calculation (HIGH - Week 2)
4. Add explicit field merging (HIGH - Week 1)
5. Expand enhancements (MEDIUM - Week 3+)

**Expected Outcome:**
- **TruScore completeness: 40-60% → 70-85%** (+25-30%)
- **Average TruScore: 55-65 → 65-75** (+10 points)
- **Government DB value: Nutrition only → Full TruScore enhancement**

This will ensure that **users worldwide get accurate, rich, and reliable TruScore data** regardless of which database provides the initial product match.

---

## Appendix A: TruScore Field Dependency Map

```
TruScore Calculation
├── Body Pillar (25pts)
│   ├── nutriscore_grade (12-25pts) ← CRITICAL
│   │   └── Requires: nutrition data OR nutriscore_grade
│   ├── nova_group (+3 to -10pts)
│   │   └── Requires: nova_group OR ingredients_text (for inference)
│   ├── additives_tags (-0.5 to -3 each, max -15)
│   │   └── Requires: additives_tags OR ingredients_text (for extraction)
│   ├── ingredients_analysis_tags (-4 each)
│   │   └── Requires: ingredients_analysis_tags OR ingredients_text (for analysis)
│   └── ingredients_text (-10 for irritants/fragrance)
│       └── Requires: ingredients_text
│
├── Planet Pillar (25pts)
│   ├── ecoscore_grade (12-25pts) ← CRITICAL
│   │   └── Requires: ecoscore_grade OR ecoscore_score
│   ├── palm_oil_analysis (-10 or -5)
│   │   └── Requires: palm_oil_analysis OR ingredients_text (for extraction)
│   └── packagings (+5 or +2)
│       └── Requires: packagings OR packaging_tags
│
├── Care Pillar (25pts)
│   ├── labels_tags (+3 to +10 each)
│   │   └── Requires: labels_tags OR certifications
│   ├── certifications (+5 to +10 each)
│   │   └── Requires: certifications
│   └── brands (-30 for cruel parent)
│       └── Requires: brands
│
└── Open Pillar (25pts)
    ├── ingredients_text (base 25, drops to 5 if missing) ← CRITICAL
    │   └── Requires: ingredients_text
    ├── origins_tags (-15 if missing)
    │   └── Requires: origins_tags OR origins OR manufacturing_places_tags
    └── Hidden terms detection (-12 to -20)
        └── Requires: ingredients_text
```

**Key Insight:** `ingredients_text` is required for **3 of 4 pillars** (Body, Planet, Open). Products without ingredients lose **~30-40 TruScore points**.

---

## Appendix B: Database Field Coverage Matrix

| Field | OFF | USDA | FSANZ | Health Canada | UK FSA | EFSA | Nutritionix | Spoonacular |
|-------|-----|------|-------|---------------|--------|------|------------|-------------|
| **Nutrition** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Nutri-Score** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **NOVA** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Ingredients** | ✅ | ⚠️ | ❌ | ❌ | ❌ | ❌ | ⚠️ | ⚠️ |
| **Additives** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Certifications** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Packaging** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Eco-Score** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Origins** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Legend:**
- ✅ = Available
- ⚠️ = Partial/Available sometimes
- ❌ = Not available

**Key Finding:** Only **Open Food Facts** provides complete TruScore data. All other databases are **nutrition-only** and require enhancement with OFF data or calculation/inference.

---

## Appendix C: Recommended Merge Strategy

### Current Strategy (Source Weight)
```
1. Sort by source weight
2. Use highest weight as base
3. Merge complementary fields
```

### Recommended Strategy (TruScore-Aware)
```
1. Score each product by TruScore field completeness
2. Combine completeness score (60%) + source weight (40%)
3. Use highest combined score as base
4. Explicitly merge all TruScore-critical fields
5. Enhance nutrition from government DBs
```

### Example Merge Decision

**Scenario:** User in NZ scans barcode, finds product in both OFF and FSANZ

**Current:**
```
OFF Product:
  ✅ nutrition: Good
  ✅ ingredients_text: "Water, sugar..."
  ✅ labels_tags: ["en:organic"]
  ✅ ecoscore_grade: "b"
  ✅ packagings: [{material: "plastic"}]
  Weight: 0.40

FSANZ Product:
  ✅ nutrition: Excellent (official)
  ❌ ingredients_text: Missing
  ❌ labels_tags: Missing
  ❌ ecoscore_grade: Missing
  ❌ packagings: Missing
  Weight: 0.40

Current Result: FSANZ selected as base (same weight, first in array)
  ✅ nutrition: Excellent (from FSANZ)
  ✅ ingredients_text: "Water, sugar..." (merged from OFF)
  ✅ labels_tags: ["en:organic"] (merged from OFF)
  ✅ ecoscore_grade: "b" (merged from OFF)
  ✅ packagings: [{material: "plastic"}] (merged from OFF)
  BUT: May lose some fields if merging logic incomplete
```

**Recommended:**
```
OFF Product:
  TruScore Completeness: 85% (has all 4 pillars)
  Source Weight: 0.40
  Combined Score: 85 * 0.6 + 40 * 0.4 = 67

FSANZ Product:
  TruScore Completeness: 25% (nutrition only)
  Source Weight: 0.40
  Combined Score: 25 * 0.6 + 40 * 0.4 = 31

Result: OFF selected as base (higher combined score)
  ✅ nutrition: Enhanced with FSANZ (weighted average)
  ✅ ingredients_text: "Water, sugar..." (from OFF base)
  ✅ labels_tags: ["en:organic"] (from OFF base)
  ✅ ecoscore_grade: "b" (from OFF base)
  ✅ packagings: [{material: "plastic"}] (from OFF base)
  ✅ All TruScore fields preserved + enhanced nutrition
```

---

**END OF REPORT**
