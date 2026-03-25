# Database Merging Impact on TruScore Calculation

**Date:** January 2026  
**Purpose:** Document how product data merging affects TruScore calculation accuracy and reliability  
**Status:** Active Documentation

---

## Executive Summary

The TruScore engine (`truscoreEngine.ts`) calculates scores based on merged product data from multiple databases. This document explains how the merging process (`productDataMerger.ts`) impacts TruScore accuracy, what data sources are prioritized, and how merged data ensures consistent scoring across different product sources.

**Key Points:**
- ✅ Merged data improves TruScore accuracy by combining best data from multiple sources
- ✅ Weighted priority system ensures government databases (Gold Standard) have highest influence
- ✅ Nutrition data uses weighted averages (weighted by source reliability)
- ✅ Ingredients use longest/most complete version (better for TruScore calculation)
- ✅ Certifications are merged with union (more certifications = higher Ethics Pillar)
- ✅ Labels use highest-weight source (ensures accurate certification detection)

---

## 1. Database Merging Process

### Overview

When a product is found in multiple databases, the `mergeProducts()` function in `productDataMerger.ts` combines them using a weighted priority system. The merged product is then passed to `truscoreEngine.ts` for scoring.

**Merging Strategy:**
1. **Sort by source weight** - Highest priority sources first
2. **Use highest-weight product as base** - Foundation for merged product
3. **Merge specific fields** - Nutrition, ingredients, certifications, labels
4. **Weighted averages** - For numeric data (nutrition values)
5. **Union operations** - For arrays (certifications, labels)

---

## 2. Source Priority Weights

### Gold Standard Databases (Weight: 0.40)

**Highest Priority - Government Databases:**
- `fsanz_au` (0.40) - Food Standards Australia New Zealand (AU)
- `fsanz_nz` (0.40) - Food Standards Australia New Zealand (NZ)
- `usda_fooddata` (0.40) - USDA FoodData Central (US)
- `gs1_datasource` (0.40) - GS1 Data Source (Global)

**Impact on TruScore:**
- These sources have the highest influence on merged nutrition data
- Government databases are considered most accurate for nutritional information
- Used for Nutri-Score calculation (Body pillar)

### High Priority Databases (Weight: 0.35-0.40)

**Open Facts Family:**
- `openfoodfacts` (0.40) - Open Food Facts (Global)
- `openbeautyfacts` (0.35) - Open Beauty Facts (Global)
- `openpetfoodfacts` (0.35) - Open Pet Food Facts (Global)
- `openproductsfacts` (0.35) - Open Products Facts (Global)

**Impact on TruScore:**
- High influence on merged data
- Open Food Facts provides Nutri-Score and Eco-Score (Body and Planet pillars)
- Provides certifications and labels (Ethics Pillar)
- Provides ingredients text (Open pillar)

### Medium Priority (Weight: 0.30)

**Store APIs:**
- `woolworths_au` (0.30), `coles_au` (0.30), `iga_au` (0.30)
- `woolworths_nz` (0.30), `paknsave` (0.30), `newworld` (0.30)

**Impact on TruScore:**
- Moderate influence on merged data
- Store APIs provide accurate product names and sometimes nutrition data
- Less reliable than government databases but still useful

### Low Priority (Weight: 0.10-0.20)

**Fallback Sources:**
- `web_search` (0.10) - Web search fallback (lowest priority)
- `upcitemdb` (0.20), `barcode_spider` (0.20) - Free APIs

**Impact on TruScore:**
- Minimal influence on merged data
- Only used when higher-priority sources don't have the product
- Ensures a product result is always returned (even with minimal data)

---

## 3. Field-Specific Merging Impact on TruScore

### 3.1 Nutrition Data (Body Pillar)

**Merging Method:** Weighted Average

**How it works:**
```typescript
// Example: Multiple sources have different calorie values
Source A (USDA, weight 0.40): 250 calories
Source B (OFF, weight 0.40): 245 calories
Source C (Store API, weight 0.30): 255 calories

// Weighted average calculation:
calories = (250 × 0.40 + 245 × 0.40 + 255 × 0.30) / (0.40 + 0.40 + 0.30)
calories = (100 + 98 + 76.5) / 1.10
calories = 274.5 / 1.10 ≈ 249.5 calories
```

**Impact on TruScore:**
- ✅ **Accurate:** Weighted averages ensure government databases have more influence
- ✅ **Reliable:** Multiple sources reduce errors from single-source inaccuracies
- ✅ **Body Pillar:** Merged nutrition data used for Nutri-Score calculation
  - If Nutri-Score exists in any source → Used directly (A=25, B=20, C=15, D=10, E=5)
  - If no Nutri-Score → Baseline 12 points (conservative)

**Example:**
- Product found in USDA (has Nutri-Score A) and OFF (has Nutri-Score B)
- Merged product uses Nutri-Score A (from highest-weight source or first found)
- Body pillar = 25 points (from Nutri-Score A)

---

### 3.2 Ingredients Text (Open Pillar)

**Merging Method:** Longest/Most Complete Version

**How it works:**
```typescript
// Example: Multiple sources have different ingredient list lengths
Source A (OFF): "water, sugar, citric acid"
Source B (Store API): "water, sugar, citric acid, natural flavors, preservatives"
Source C (USDA): "water, sugar, citric acid, natural flavors"

// Merged product uses longest:
ingredients_text = "water, sugar, citric acid, natural flavors, preservatives"
```

**Impact on TruScore:**
- ✅ **More Complete:** Longer ingredients list = better for hidden terms detection
- ✅ **Open Pillar:** More complete ingredients = better transparency score
- ✅ **Hidden Terms Detection:** More ingredients = better chance of detecting "parfum", "fragrance", etc.
- ⚠️ **Potential Issue:** Longest list might include ingredients from lower-priority source
  - **Mitigation:** Source weights ensure higher-priority sources are preferred when lengths are similar

**Example:**
- Product found in OFF (short ingredients) and Store API (long ingredients)
- Merged product uses Store API ingredients (longer)
- Open pillar checks for hidden terms in longer list → More accurate transparency score

---

### 3.3 Certifications & Labels (Ethics Pillar)

**Merging Method:** Union (All Unique Certifications)

**How it works:**
```typescript
// Example: Multiple sources have different certifications
Source A (OFF): ["en:organic", "en:fair-trade"]
Source B (Store API): ["en:organic", "en:rainforest-alliance"]
Source C (USDA): ["en:organic"]

// Merged product uses union:
certifications = ["en:organic", "en:fair-trade", "en:rainforest-alliance"]
```

**Impact on TruScore:**
- ✅ **More Complete:** Union ensures all certifications are included
- ✅ **Ethics Pillar:** More certifications = higher Care score
  - Fair-trade: +8 points
  - Organic: +8 points
  - Rainforest Alliance: +7 points
  - Total bonus: +23 points (capped at 25)
- ✅ **Accurate:** All legitimate certifications are counted

**Example:**
- Product found in OFF (has "organic") and Store API (has "fair-trade")
- Merged product has both certifications
- Ethics Pillar: Base 18 + Organic +8 + Fair-trade +8 = 34 → Capped at 25

---

### 3.4 Labels Tags (Ethics Pillar)

**Merging Method:** Highest-Weight Source (Base Product)

**How it works:**
```typescript
// Example: Multiple sources have different labels
Source A (OFF, weight 0.40): ["en:vegan", "en:cruelty-free"]
Source B (Store API, weight 0.30): ["en:organic"]

// Merged product uses base product (highest weight):
labels_tags = ["en:vegan", "en:cruelty-free"]
// Store API labels are checked but base product labels take priority
```

**Impact on TruScore:**
- ✅ **Accurate:** Highest-weight source labels are used (usually most reliable)
- ✅ **Ethics Pillar:** Labels like "vegan" (+10), "cruelty-free" (+10) boost Care score
- ⚠️ **Potential Issue:** Lower-priority source labels might be missed
  - **Mitigation:** Certifications are merged with union (see above), so important certifications aren't lost

**Example:**
- Product found in OFF (has "vegan" label) and Store API (has "organic" label)
- Merged product uses OFF labels (higher weight)
- Ethics Pillar: Base 18 + Vegan +10 = 28 → Capped at 25

---

### 3.5 Eco-Score (Planet Pillar)

**Merging Method:** Highest-Weight Source (Base Product)

**How it works:**
```typescript
// Example: Multiple sources have Eco-Score
Source A (OFF, weight 0.40): Eco-Score A
Source B (Store API, weight 0.30): Eco-Score B

// Merged product uses base product:
ecoscore_grade = "A"
```

**Impact on TruScore:**
- ✅ **Accurate:** Highest-weight source Eco-Score is used (usually Open Food Facts)
- ✅ **Planet Pillar:** Eco-Score directly converts to Planet score
  - A = 25 points
  - B = 20 points
  - C = 15 points
  - D = 10 points
  - E = 5 points
  - Missing = 12 points (baseline)

**Example:**
- Product found in OFF (Eco-Score A) and Store API (Eco-Score B)
- Merged product uses OFF Eco-Score A (higher weight)
- Planet pillar: 25 points (from Eco-Score A)

---

### 3.6 Palm Oil Analysis (Planet Pillar)

**Merging Method:** Highest-Weight Source (Base Product)

**How it works:**
```typescript
// Example: Multiple sources have palm oil data
Source A (OFF, weight 0.40): containsPalmOil: true, isCertifiedSustainable: false
Source B (Store API, weight 0.30): containsPalmOil: true, isCertifiedSustainable: true

// Merged product uses base product:
palm_oil_analysis = { containsPalmOil: true, isCertifiedSustainable: false }
```

**Impact on TruScore:**
- ✅ **Accurate:** Highest-weight source palm oil data is used
- ✅ **Planet Pillar:** Palm oil penalties applied
  - Non-certified palm oil: -10 points
  - Certified sustainable palm oil: -5 points
  - Palm-oil-free: No penalty

**Example:**
- Product found in OFF (non-certified palm oil) and Store API (certified sustainable)
- Merged product uses OFF data (higher weight)
- Planet pillar: Eco-Score 20 - Palm oil 10 = 10 points

---

### 3.7 Packaging Data (Planet Pillar)

**Merging Method:** Highest-Weight Source (Base Product)

**How it works:**
```typescript
// Example: Multiple sources have packaging data
Source A (OFF, weight 0.40): packagings: [{ material: "en:plastic", recycling: "recycle" }]
Source B (Store API, weight 0.30): packagings: [{ material: "en:cardboard", recycling: "recycle" }]

// Merged product uses base product:
packagings = [{ material: "en:plastic", recycling: "recycle" }]
```

**Impact on TruScore:**
- ✅ **Accurate:** Highest-weight source packaging data is used
- ✅ **Planet Pillar:** Recyclable packaging bonuses
  - All packaging recyclable (local requirements): +5 points
  - Some packaging recyclable (local requirements): +2 points
  - Uses `meetsLocalRecyclingRequirements()` for country-specific accuracy

**Example:**
- Product found in OFF (plastic, recyclable in NZ) and Store API (cardboard, recyclable)
- Merged product uses OFF packaging (higher weight)
- Planet pillar: Checks if plastic meets NZ recycling requirements → +5 if yes

---

### 3.8 Origin Data (Open Pillar)

**Merging Method:** Highest-Weight Source (Base Product)

**How it works:**
```typescript
// Example: Multiple sources have origin data
Source A (OFF, weight 0.40): origins_tags: ["en:china"]
Source B (Store API, weight 0.30): manufacturing_places_tags: ["en:china"]

// Merged product uses base product:
origins_tags = ["en:china"]
```

**Impact on TruScore:**
- ✅ **Accurate:** Highest-weight source origin data is used
- ✅ **Open Pillar:** Origin penalty
  - No origin data: -15 points
  - Origin data exists: No penalty
  - Placeholder values ("unknown", "n/a"): -15 points

**Example:**
- Product found in OFF (has origin: "China") and Store API (no origin)
- Merged product uses OFF origin (higher weight)
- Open pillar: No penalty (origin exists)

---

## 4. Merging Scenarios & TruScore Impact

### Scenario 1: Government Database + Open Food Facts

**Sources:**
- USDA (weight 0.40) - Has Nutri-Score A, nutrition data
- OFF (weight 0.40) - Has Eco-Score B, certifications, ingredients

**Merged Product:**
- Nutrition: Weighted average (USDA + OFF)
- Nutri-Score: A (from USDA or OFF)
- Eco-Score: B (from OFF)
- Certifications: Union of both sources
- Ingredients: Longest list

**TruScore Impact:**
- ✅ **Body Pillar:** 25 points (Nutri-Score A)
- ✅ **Planet Pillar:** 20 points (Eco-Score B)
- ✅ **Ethics Pillar:** Higher (more certifications from union)
- ✅ **Open Pillar:** Better (longer ingredients list)

**Result:** High-quality TruScore with accurate data from both sources

---

### Scenario 2: Open Food Facts + Store API

**Sources:**
- OFF (weight 0.40) - Has Eco-Score C, basic ingredients
- Store API (weight 0.30) - Has detailed ingredients, some certifications

**Merged Product:**
- Nutrition: Weighted average (OFF 0.40, Store 0.30)
- Eco-Score: C (from OFF, higher weight)
- Certifications: Union of both sources
- Ingredients: Store API (longer list)

**TruScore Impact:**
- ✅ **Body Pillar:** 12 points (no Nutri-Score, baseline)
- ✅ **Planet Pillar:** 15 points (Eco-Score C)
- ✅ **Ethics Pillar:** Higher (more certifications from union)
- ✅ **Open Pillar:** Better (longer ingredients list from Store API)

**Result:** Improved TruScore with more complete data from Store API

---

### Scenario 3: Multiple Low-Priority Sources

**Sources:**
- UPCitemdb (weight 0.20) - Basic product name
- Barcode Spider (weight 0.20) - Basic product name, no nutrition
- Web Search (weight 0.10) - Product name, image

**Merged Product:**
- Nutrition: Weighted average (minimal data)
- No Nutri-Score or Eco-Score
- Minimal certifications
- Basic ingredients (if any)

**TruScore Impact:**
- ⚠️ **Body Pillar:** 12 points (baseline, no Nutri-Score)
- ⚠️ **Planet Pillar:** 12 points (baseline, no Eco-Score)
- ⚠️ **Ethics Pillar:** 18 points (base, no certifications)
- ⚠️ **Open Pillar:** 5-10 points (minimal or no ingredients)

**Result:** Low TruScore (48-57/100) due to insufficient data, but product still returns a score

---

## 5. Best Practices for TruScore Accuracy

### 5.1 Prioritize Gold Standard Sources

**Recommendation:**
- Always query government databases (FSANZ, USDA) for users in those countries
- These sources have highest weight (0.40) and most accurate nutrition data

**Impact:**
- ✅ More accurate Body pillar (better Nutri-Score data)
- ✅ More reliable nutrition values for calculations

---

### 5.2 Merge Multiple Sources

**Recommendation:**
- Always merge products from multiple sources when available
- Don't use single source if multiple sources are available

**Impact:**
- ✅ More complete ingredients list (better Open pillar)
- ✅ More certifications (higher Ethics Pillar)
- ✅ More reliable nutrition data (weighted averages)

---

### 5.3 Use Longest Ingredients List

**Recommendation:**
- Merging uses longest ingredients list (most complete)
- This improves hidden terms detection (Open pillar)

**Impact:**
- ✅ Better transparency score (more ingredients = better detection)
- ✅ More accurate hidden terms penalties

---

### 5.4 Union Certifications

**Recommendation:**
- Merging uses union of all certifications (all unique certifications)
- This ensures no certifications are lost

**Impact:**
- ✅ Higher Ethics Pillar (more certifications = more bonuses)
- ✅ More accurate ethical score

---

## 6. Potential Issues & Mitigations

### Issue 1: Weighted Nutrition Averages Create Artificial Values

**Problem:**
- Weighted averages might create nutrition values that don't exist in any single source
- Example: 249.5 calories (average of 250, 245, 255)

**Mitigation:**
- ✅ This is acceptable - averages reduce errors from single-source inaccuracies
- ✅ Government databases (highest weight) have more influence
- ✅ Multiple sources provide better accuracy than single source

**Impact on TruScore:**
- ✅ Minimal - Nutri-Score is used directly if available (not calculated from nutrition)
- ✅ If no Nutri-Score, baseline 12 is used (conservative)

---

### Issue 2: Longest Ingredients List Might Include Lower-Priority Source

**Problem:**
- Longest ingredients list might come from lower-priority source
- Example: Store API (0.30) has longer list than OFF (0.40)

**Mitigation:**
- ✅ Source weights ensure higher-priority sources are preferred when lengths are similar
- ✅ Longer list is usually more complete (better for TruScore)
- ✅ Hidden terms detection benefits from more complete list

**Impact on TruScore:**
- ✅ Positive - More complete ingredients = better Open pillar score
- ✅ Better hidden terms detection

---

### Issue 3: Labels Use Base Product (Might Miss Lower-Priority Labels)

**Problem:**
- Labels use highest-weight source (base product)
- Lower-priority source labels might be missed

**Mitigation:**
- ✅ Certifications are merged with union (important certifications aren't lost)
- ✅ Labels are less critical than certifications for Ethics Pillar
- ✅ Highest-weight source is usually most reliable

**Impact on TruScore:**
- ⚠️ Minor - Some labels might be missed, but certifications are preserved
- ✅ Ethics Pillar still benefits from certification union

---

## 7. Summary

### Key Takeaways

1. **Merged data improves TruScore accuracy**
   - Combines best data from multiple sources
   - Weighted averages ensure government databases have more influence
   - Union operations ensure no certifications are lost

2. **Source weights matter**
   - Government databases (0.40) have highest influence
   - Open Facts (0.35-0.40) provide high-quality data
   - Store APIs (0.30) provide moderate influence
   - Fallback sources (0.10-0.20) have minimal influence

3. **Field-specific merging strategies**
   - Nutrition: Weighted averages (more accurate)
   - Ingredients: Longest list (more complete)
   - Certifications: Union (all certifications)
   - Labels: Highest-weight source (most reliable)

4. **TruScore benefits from merging**
   - Body pillar: Better nutrition data → More accurate Nutri-Score
   - Planet pillar: Better Eco-Score and packaging data
   - Ethics Pillar: More certifications → Higher score
   - Open pillar: Longer ingredients → Better transparency score

5. **Potential issues are mitigated**
   - Weighted averages are acceptable (reduce errors)
   - Longest ingredients list is beneficial (more complete)
   - Certification union ensures nothing is lost

---

## 8. Conclusion

The database merging process significantly improves TruScore accuracy by:
- ✅ Combining best data from multiple sources
- ✅ Prioritizing government databases (Gold Standard)
- ✅ Using weighted averages for nutrition (more accurate)
- ✅ Using longest ingredients list (more complete)
- ✅ Using union for certifications (all certifications counted)

**Result:** More accurate, reliable, and consistent TruScore across different product sources.

---

**Document Version:** 1.0  
**Last Updated:** January 2026  
**Status:** Active Documentation
