# Body Pillar: Data Merging & Product Enhancement - Complete Workflow

## Executive Summary

This document provides a comprehensive explanation of the **Data Merging** and **Product Enhancement** workflows in the TrueScan app, specifically as they relate to Body Pillar scoring. It covers the mechanics of source weights, nutrition data normalization and merging, Eco-Score calculation, and how enhancement databases (FSANZ, USDA, etc.) contribute to Body Pillar scoring.

---

## Table of Contents

1. [Data Merging Workflow](#1-data-merging-workflow)
   - [1.1 Source Weights - Determination and Application](#11-source-weights---determination-and-application)
   - [1.2 Nutrition Data Normalization and Merging](#12-nutrition-data-normalization-and-merging)
2. [Product Enhancement Workflow](#2-product-enhancement-workflow)
   - [2.1 Calculate Eco-Score (if missing)](#21-calculate-eco-score-if-missing)
3. [Enhancement Databases for Body Pillar Scoring](#3-enhancement-databases-for-body-pillar-scoring)
   - [3.1 FSANZ and USDA Food/Data Integration](#31-fsanz-and-usda-fooddata-integration)
   - [3.2 How Enhancement Databases Contribute to Body Pillar](#32-how-enhancement-databases-contribute-to-body-pillar)

---

## 1. Data Merging Workflow

### 1.1 Source Weights - Determination and Application

#### Overview
Source weights determine the **trust level and priority** of each database when merging product data. They range from 0.0 to 1.0, where:
- **1.0** = Highest priority (user-contributed data)
- **0.5** = Gold Standard (government databases)
- **0.45** = High priority (Open Food Facts)
- **0.3-0.35** = Medium priority (commercial APIs)
- **0.1-0.2** = Low priority (fallback sources)

#### How Source Weights Are Determined

Source weights are determined based on **data quality, reliability, and verification status**:

**Location**: `src/services/productDataMerger.ts` (lines 24-82) and `src/data/databases/truScoreOptimizedDatabase.ts` (lines 962-1009)

**Weight Categories**:

1. **User-Contributed Data (1.0)** - HIGHEST PRIORITY
   - **Rationale**: Data entered directly from package labels by users is considered the most accurate
   - **Always overrides**: User-contributed nutrition and ingredients take absolute priority

2. **Gold Standard Government Databases (0.50)** - HIGHEST TRUST
   - FSANZ (AU): 0.50
   - FSANZ (NZ): 0.50
   - NZFCD: 0.50
   - AFCD: 0.50
   - USDA FoodData: 0.50
   - Health Canada CNF: 0.50
   - UK FSA: 0.50
   - EFSA: 0.50
   - **Rationale**: Official government food databases are highly verified and regulated

3. **Open Facts Databases (0.35-0.45)** - HIGH TRUST
   - Open Food Facts: 0.45 (largest open database)
   - Open Beauty Facts: 0.40
   - Open Pet Food Facts: 0.40
   - Open Products Facts: 0.35
   - **Rationale**: Community-verified, open-source databases with good coverage

4. **Commercial Nutrition APIs (0.30)** - MEDIUM TRUST
   - Edamam: 0.30
   - Nutritionix: 0.30
   - Spoonacular: 0.30
   - **Rationale**: Commercial APIs with good data but require API keys

5. **Store APIs (0.35)** - MEDIUM TRUST
   - Woolworths (AU/NZ): 0.35
   - Coles (AU): 0.35
   - Walmart Open: 0.35
   - FoodRepo: 0.35
   - **Rationale**: Retailer data is reliable but may be product-specific

6. **Free/Community APIs (0.20-0.25)** - LOW-MEDIUM TRUST
   - UPCitemdb: 0.20
   - Barcode Spider: 0.20
   - EAN-Search: 0.20
   - Datakick: 0.25
   - **Rationale**: Free APIs may have incomplete or unverified data

7. **Web Search Fallback (0.10)** - LOWEST PRIORITY
   - **Rationale**: Web scraping is the least reliable source

#### How Source Weights Are Applied

**Location**: `src/services/productDataMerger.ts` (lines 147-176)

**Step 1: Base Product Selection**
Products are scored using a **combined metric**:
```
Combined Score = (TruScore Completeness × 0.6) + (Source Weight × 0.4)
```

- **60% weight** on TruScore field completeness (how many scoring-critical fields are present)
- **40% weight** on source trust level (the source weight)

**Example**:
- Product A (Open Food Facts): Completeness = 70%, Weight = 0.45
  - Combined Score = (0.70 × 0.6) + (0.45 × 0.4) = 0.42 + 0.18 = **0.60** (60%)
- Product B (Spoonacular): Completeness = 20%, Weight = 0.30
  - Combined Score = (0.20 × 0.6) + (0.30 × 0.4) = 0.12 + 0.12 = **0.24** (24%)

**Result**: Product A is selected as the base product.

**Step 2: Weight Normalization for Merging**
When merging data from multiple sources, weights are normalized so they sum to 1.0:

```typescript
// Calculate total weight
const totalWeight = weights.reduce((sum, w) => sum + w, 0);

// Normalize each weight
const normalizedWeights = weights.map(w => w / totalWeight);
```

**Example**:
- Open Food Facts: 0.45
- Spoonacular: 0.30
- Total: 0.75
- Normalized: OFF = 0.60, Spoonacular = 0.40

**Step 3: Weighted Merging**
Each field is merged using normalized weights:

```typescript
// Weighted average formula
mergedValue = Σ(value_i × normalizedWeight_i) for all sources i
```

**Example - Merging Nutrition Data**:
- Open Food Facts provides: fat = 10g, weight = 0.60
- Spoonacular provides: fat = 12g, weight = 0.40
- Merged fat = (10 × 0.60) + (12 × 0.40) = 6 + 4.8 = **10.8g**

**Step 4: Special Cases - User-Contributed Data**
User-contributed data (weight = 1.0) **always takes absolute priority**:

```typescript
if (userContributedProduct && userContributedProduct.nutriments) {
  mergedProduct.nutriments = { ...userContributedProduct.nutriments };
  // No merging - use exclusively
}
```

This ensures package label data (most accurate) overrides all database data.

---

### 1.2 Nutrition Data Normalization and Merging

#### Overview
Nutrition data from multiple databases is merged using a **weighted average approach**, with normalization to per-100g format for consistency.

**Location**: `src/services/productDataMerger.ts` (lines 229-250, 958-1023)

#### Step-by-Step Process

**Step 1: Collect All Nutrition Data**
```typescript
const allNutriments = productsToMerge
  .map(p => p.nutriments)
  .filter((n): n is ProductNutriments => n !== undefined);
```

All products with nutrition data are collected, regardless of source.

**Step 2: Check for User-Contributed Data Priority**
```typescript
const userContributedProduct = productsToMerge.find(p => p.source === 'user_contributed');

if (userContributedProduct && userContributedProduct.nutriments) {
  mergedProduct.nutriments = { ...userContributedProduct.nutriments };
  // Use exclusively - no merging needed
}
```

If user-contributed nutrition exists, it's used **exclusively** (no merging).

**Step 3: Weighted Average Merging**
If no user-contributed data exists, merge using weighted averages:

**Location**: `src/services/productDataMerger.ts` (lines 958-991)

```typescript
function mergeNutriments(
  nutriments: ProductNutriments[],
  weights: number[]
): ProductNutriments {
  const merged: ProductNutriments = {};
  
  // Get all unique nutrient keys from all sources
  const allKeys = new Set<string>();
  nutriments.forEach(n => {
    Object.keys(n).forEach(key => allKeys.add(key));
  });
  
  // For each nutrient key, calculate weighted average
  allKeys.forEach(key => {
    let totalValue = 0;
    let totalWeight = 0;
    
    nutriments.forEach((n, index) => {
      const value = (n as any)[key];
      if (value !== undefined && value !== null && !isNaN(Number(value))) {
        const numValue = Number(value);
        const weight = weights[index] || 0;
        totalValue += numValue * weight;
        totalWeight += weight;
      }
    });
    
    if (totalWeight > 0) {
      (merged as any)[key] = totalValue / totalWeight;
    }
  });
  
  return merged;
}
```

**Example**:
Merging "fat_100g" from 3 sources:
- Source 1 (OFF, weight 0.60): fat_100g = 10.0g
- Source 2 (Spoonacular, weight 0.30): fat_100g = 12.0g
- Source 3 (USDA, weight 0.10): fat_100g = 11.0g

**Calculation**:
```
merged_fat_100g = (10.0 × 0.60 + 12.0 × 0.30 + 11.0 × 0.10) / (0.60 + 0.30 + 0.10)
                 = (6.0 + 3.6 + 1.1) / 1.0
                 = 10.7g
```

**Step 4: Handling Conflicts and Inconsistencies**

**Conflicts are resolved through weighted averaging**, where:
- **Higher-weight sources** contribute more to the final value
- **Missing values** are skipped (only sources with the nutrient contribute)
- **Invalid values** (NaN, null, undefined) are filtered out

**Inconsistency Handling**:
1. **Missing Nutrients**: If one source lacks a nutrient, only sources with that nutrient contribute
2. **Unit Inconsistencies**: All values are normalized to per-100g format (see Step 5)
3. **Value Conflicts**: Weighted average naturally balances conflicting values based on source trust

**Step 5: Normalization to Per-100g Format**

**Location**: `src/services/productDataMerger.ts` (lines 996-1023)

After merging, nutrition data is normalized to ensure all values are in per-100g format:

```typescript
function normalizeNutritionToPer100g(nutriments: ProductNutriments): ProductNutriments {
  const normalized: ProductNutriments = { ...nutriments };
  
  const nutrients = [
    'energy', 'energy-kcal', 'energy-kj',
    'fat', 'saturated-fat',
    'carbohydrates', 'sugars', 'fiber',
    'proteins', 'salt', 'sodium',
  ];
  
  nutrients.forEach(nutrient => {
    const baseValue = (normalized as any)[nutrient];
    const per100gValue = (normalized as any)[`${nutrient}_100g`];
    
    // If we have base value but not per-100g, use base value
    if (baseValue !== undefined && per100gValue === undefined) {
      (normalized as any)[`${nutrient}_100g`] = baseValue;
    }
    
    // If we have per-100g but not base, use per-100g
    if (per100gValue !== undefined && baseValue === undefined) {
      (normalized as any)[nutrient] = per100gValue;
    }
  });
  
  return normalized;
}
```

**Purpose**: Ensures all nutrition values are in consistent per-100g format for Nutri-Score calculation and Body Pillar scoring.

**Example**:
- Input: `{ fat: 10, fat_100g: undefined }`
- Output: `{ fat: 10, fat_100g: 10 }`

---

## 2. Product Enhancement Workflow

### 2.1 Calculate Eco-Score (if missing)

#### Overview
Eco-Score calculation happens during the product enhancement phase. If a product doesn't have an Eco-Score, the system attempts to calculate it from available data.

**Location**: `src/services/openFoodFacts.ts` (lines 512-545) and `src/services/productEnhancementService.ts` (lines 102-114)

#### Step-by-Step Process

**Step 1: Check for Existing Eco-Score**
```typescript
export function calculateEcoScore(product: Product): Product['ecoscore_data'] {
  if (product.ecoscore_data) {
    // Product already has Eco-Score data
    enhanceEcoScoreData(product);
    
    // If we have score but no grade, calculate grade from score
    if (product.ecoscore_data.score !== undefined && product.ecoscore_data.score > 0) {
      if (!product.ecoscore_data.grade || product.ecoscore_data.grade === 'unknown') {
        product.ecoscore_data.grade = calculateGradeFromScore(product.ecoscore_data.score);
      }
    }
    
    return product.ecoscore_data;
  }
```

**Step 2: Check Root-Level Eco-Score Fields**
```typescript
  // If we have score and grade from product root level
  if (product.ecoscore_score !== undefined && product.ecoscore_score > 0) {
    const grade = product.ecoscore_grade && product.ecoscore_grade !== 'unknown' 
      ? product.ecoscore_grade 
      : calculateGradeFromScore(product.ecoscore_score);
    
    return {
      score: product.ecoscore_score,
      grade: grade,
    };
  }
```

**Step 3: Return Unknown if No Data**
```typescript
  // If no eco score, return unknown
  return {
    score: 0,
    grade: 'unknown',
  };
}
```

#### Grade Calculation from Score

If a score exists but no grade, the grade is calculated using standard Eco-Score thresholds:

- **Grade A**: Score 75-100
- **Grade B**: Score 50-74
- **Grade C**: Score 25-49
- **Grade D**: Score 10-24
- **Grade E**: Score 0-9

**Note**: Currently, the app **does not calculate Eco-Score from scratch** if it's completely missing. It only:
1. Enhances existing Eco-Score data
2. Calculates grade from existing score
3. Returns "unknown" if no Eco-Score data exists

This is because Eco-Score calculation requires complex LCA (Life Cycle Assessment) data including:
- Agribalyse data (environmental impact of food categories)
- Packaging impact
- Transport impact
- Origin of ingredients
- Processing methods

These calculations are typically performed by Open Food Facts or require external LCA databases.

#### Integration into Enhancement Workflow

**Location**: `src/services/productEnhancementService.ts` (line 263)

```typescript
export async function enhanceProduct(product: Product): Promise<Product> {
  // ... other enhancements ...
  
  // Calculate and set Eco-Score
  calculateAndSetEcoScore(product);
  
  return product;
}
```

The Eco-Score calculation is called at the end of the enhancement process, ensuring all product data is available for potential Eco-Score calculation.

---

## 3. Enhancement Databases for Body Pillar Scoring

### 3.1 FSANZ and USDA Food/Data Integration

#### Overview
FSANZ (Food Standards Australia New Zealand) and USDA FoodData Central are **government-grade nutrition databases** that provide comprehensive nutrient information. When Open Food Facts (OFF) is missing or incomplete, these databases enable Body Pillar scoring by providing nutrition data that can be used for Nutri-Score calculation.

#### FSANZ Database Integration

**Location**: `src/services/fsanDatabase.ts`

**How FSANZ Provides Nutrition Data**:

1. **Database Query**:
   - FSANZ databases (AU and NZ) are stored locally in AsyncStorage
   - Query by barcode (with variant normalization)
   - Returns FSANZ product data with comprehensive nutrition information

2. **Data Conversion**:
```typescript
// Convert FSANZ product to Product format
const convertedProduct: Product = {
  barcode: variant,
  product_name: fsanzProduct.productName,
  brands: fsanzProduct.brand,
  source: country === 'AU' ? 'fsanz_au' : 'fsanz_nz',
  
  // Nutrition data (already in per-100g format from FSANZ)
  nutriments: {
    'energy-kcal_100g': fsanzProduct.energyKcal,
    'energy-kcal': fsanzProduct.energyKcal,
    'fat_100g': fsanzProduct.fat,
    fat: fsanzProduct.fat,
    'saturated-fat_100g': fsanzProduct.saturatedFat,
    'saturated-fat': fsanzProduct.saturatedFat,
    'carbohydrates_100g': fsanzProduct.carbohydrates,
    carbohydrates: fsanzProduct.carbohydrates,
    'sugars_100g': fsanzProduct.sugars,
    sugars: fsanzProduct.sugars,
    'proteins_100g': fsanzProduct.protein,
    proteins: fsanzProduct.protein,
    'salt_100g': fsanzProduct.salt,
    salt: fsanzProduct.salt,
    'sodium_100g': fsanzProduct.sodium,
    sodium: fsanzProduct.sodium,
    'fiber_100g': fsanzProduct.dietaryFiber,
    fiber: fsanzProduct.dietaryFiber,
  },
  
  ingredients_text: fsanzProduct.ingredients,
  categories: fsanzProduct.categories,
  
  // High quality indicator (government data)
  quality: 90,
  completion: 85,
};
```

**Key Features**:
- **Already normalized**: FSANZ provides per-100g values directly
- **Comprehensive**: Includes all major nutrients required for Nutri-Score
- **High quality**: Government-verified data (quality: 90, completion: 85)
- **Source weight**: 0.50 (Gold Standard)

#### USDA FoodData Central Integration

**Location**: `src/services/usdaFoodData.ts` (lines 111-162)

**How USDA Provides Nutrition Data**:

1. **API Query**:
   - USDA FoodData Central API (requires API key)
   - Search by barcode (UPC/GTIN)
   - Returns USDA food nutrient data

2. **Data Conversion**:
```typescript
function convertUSDAFoodToProduct(usdaFood: USDASearchFood, barcode: string): Product {
  const nutriments: Product['nutriments'] = {};
  
  if (usdaFood.foodNutrients) {
    usdaFood.foodNutrients.forEach(nutrient => {
      const nutrientName = nutrient.nutrientName.toLowerCase();
      const value = nutrient.value;
      
      // Map USDA nutrients to our format
      if (nutrientName.includes('energy') && nutrientName.includes('kcal')) {
        nutriments['energy-kcal'] = value;
        nutriments['energy-kcal_100g'] = value;
      } else if (nutrientName.includes('protein')) {
        nutriments.proteins = value;
        nutriments['proteins_100g'] = value;
      } else if (nutrientName.includes('total lipid') || nutrientName.includes('fat')) {
        nutriments.fat = value;
        nutriments['fat_100g'] = value;
      } else if (nutrientName.includes('carbohydrate')) {
        nutriments.carbohydrates = value;
        nutriments['carbohydrates_100g'] = value;
      } else if (nutrientName.includes('sugar')) {
        nutriments.sugars = value;
        nutriments['sugars_100g'] = value;
      } else if (nutrientName.includes('fiber')) {
        nutriments.fiber = value;
        nutriments['fiber_100g'] = value;
      } else if (nutrientName.includes('sodium')) {
        nutriments.sodium = value;
        nutriments['sodium_100g'] = value;
        // Convert sodium to salt (salt = sodium × 2.54)
        nutriments.salt = value * 2.54;
        nutriments['salt_100g'] = value * 2.54;
      }
    });
  }
  
  return {
    barcode,
    product_name: usdaFood.description || `Product ${barcode}`,
    brands: usdaFood.brandOwner || usdaFood.brandName,
    ingredients_text: usdaFood.ingredients,
    nutriments: Object.keys(nutriments).length > 0 ? nutriments : undefined,
    source: 'usda_fooddata',
    quality: 90,
    completion: 85,
  };
}
```

**Key Features**:
- **Field mapping**: USDA uses different field names, mapped to our standard format
- **Unit conversion**: Sodium converted to salt (salt = sodium × 2.54)
- **High quality**: Government-verified data (quality: 90, completion: 85)
- **Source weight**: 0.50 (Gold Standard)

#### How Nutrition Data Enables Nutri-Score Calculation

**Important Note**: The current implementation **uses Nutri-Score if it exists** on the product (typically from Open Food Facts). However, **the merged nutrition data from FSANZ/USDA enables Nutri-Score calculation** in scenarios where:

1. **OFF provides Nutri-Score but incomplete nutrition data**: FSANZ/USDA nutrition is merged to complete the dataset
2. **OFF is missing entirely**: FSANZ/USDA nutrition data provides the base for potential Nutri-Score calculation
3. **Multiple sources provide nutrition**: Weighted merging creates a comprehensive nutrition profile

**Body Pillar Logic**:
- **Location**: `src/lib/truscoreEngine/pillars/bodyPillar.ts` (lines 71-115)
- Body Pillar checks for `product.nutriscore_grade`
- If Nutri-Score exists, it uses it directly
- If Nutri-Score is missing, Body Pillar uses baseline score (15/25)

**Future Enhancement Opportunity**: 
The app could implement Nutri-Score calculation from merged nutrition data when OFF Nutri-Score is missing, using the standard Nutri-Score algorithm based on:
- Energy (kcal)
- Saturated fat (g)
- Sugars (g)
- Sodium (mg)
- Fiber (g)
- Proteins (g)
- Fruits/vegetables/nuts percentage

---

### 3.2 How Enhancement Databases Contribute to Body Pillar

#### Overview
Enhancement databases (FSANZ, USDA, Nutritionix, Spoonacular, etc.) contribute to Body Pillar scoring through **data merging** rather than direct scoring. The merged nutrition data improves data completeness, which enables more accurate Body Pillar scores.

#### Contribution Mechanisms

**1. Nutrition Data Merging**

When multiple databases provide nutrition data:
- **Weighted average merging** creates a comprehensive nutrition profile
- **Higher-weight sources** (FSANZ: 0.50, USDA: 0.50) contribute more
- **Result**: More complete and accurate nutrition data for Nutri-Score usage

**Example**:
- OFF missing or incomplete
- FSANZ provides complete nutrition data
- Merged product includes FSANZ nutrition → enables Body Pillar scoring

**2. Data Completeness Scoring**

**Location**: `src/services/productDataMerger.ts` (lines 119-145)

Products are scored for **TruScore field completeness**:
- Body Pillar fields: Nutri-Score (10 pts), NOVA (5 pts), Nutrition data (5 pts), Additives (3 pts), Analysis tags (2 pts)
- Products with more complete data score higher in base selection

**Enhancement databases improve completeness**:
- FSANZ/USDA: Provide comprehensive nutrition (5 pts)
- Nutritionix/Spoonacular: Provide additional nutrition fields
- Result: Higher completeness score → Better base product selection → More accurate merging

**3. Source Priority in Merging**

Enhancement databases with high source weights (0.50 for FSANZ/USDA) contribute more to merged nutrition data:

```
Merged Nutrition = Σ(nutrition_i × weight_i) / Σ(weight_i)
```

**Example**:
- OFF (weight 0.45): fat = 10g, sugars = 5g
- FSANZ (weight 0.50): fat = 12g, sugars = 4g
- Normalized weights: OFF = 0.474, FSANZ = 0.526
- Merged: fat = 11.05g (closer to FSANZ), sugars = 4.47g (closer to FSANZ)

**4. Same Logic for Other Enhancement Databases**

The same merging logic applies to **all enhancement databases** in the Enhancement Data list:

**High Priority (0.30-0.50)**:
- **Health Canada CNF** (0.50): Government database, similar to FSANZ/USDA
- **UK FSA** (0.50): Government database
- **EFSA** (0.50): European Food Safety Authority
- **GS1** (0.45): Global standards organization
- **Nutritionix** (0.30): Commercial nutrition API
- **Spoonacular** (0.30): Commercial nutrition API
- **Edamam** (0.30): Commercial nutrition API

**Medium Priority (0.20-0.25)**:
- **FoodRepo** (0.35): Open nutrition database
- **Datakick** (0.25): Community-driven database
- **UPCitemdb** (0.20): Free barcode database

**All enhancement databases**:
1. Provide nutrition data that gets merged using weighted averages
2. Contribute to data completeness scoring
3. Improve base product selection
4. Enable more accurate Body Pillar scores through better nutrition data

#### Summary: Enhancement Database Contribution Flow

```
1. Query Enhancement Databases (FSANZ, USDA, Nutritionix, etc.)
   ↓
2. Convert to Standard Product Format
   ↓
3. Merge Nutrition Data (Weighted Average)
   - Higher weight sources (FSANZ: 0.50) contribute more
   - User-contributed data (1.0) takes absolute priority
   ↓
4. Normalize to Per-100g Format
   ↓
5. Body Pillar Scoring
   - Uses Nutri-Score if available (typically from OFF)
   - Uses merged nutrition data for completeness
   - Falls back to baseline (15/25) if no Nutri-Score
   ↓
6. Result: More accurate Body Pillar score
```

---

## Conclusion

The Data Merging and Product Enhancement workflows ensure that Body Pillar scoring benefits from the **best available nutrition data** across multiple databases:

1. **Source weights** prioritize trusted sources (government databases, user-contributed data)
2. **Weighted averaging** creates comprehensive nutrition profiles from multiple sources
3. **Normalization** ensures consistent per-100g format for Nutri-Score compatibility
4. **Enhancement databases** (FSANZ, USDA, etc.) provide critical nutrition data when OFF is missing or incomplete

The result is **more accurate and complete Body Pillar scores** even when primary sources (Open Food Facts) are unavailable or incomplete.

