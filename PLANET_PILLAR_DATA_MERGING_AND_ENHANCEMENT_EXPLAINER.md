# Planet Pillar: Data Merging & Product Enhancement - Complete Workflow

## Executive Summary

This document provides a comprehensive explanation of the **Data Merging** and **Product Enhancement** workflows in the TrueScan app, specifically as they relate to Planet Pillar scoring. It covers the mechanics of source weights, Eco-Score data merging, palm oil analysis extraction, packaging data merging, and how enhancement databases (CSV databases, packaging data, etc.) contribute to Planet Pillar scoring.

---

## Table of Contents

1. [Data Merging Workflow](#1-data-merging-workflow)
   - [1.1 Source Weights - Determination and Application](#11-source-weights---determination-and-application)
   - [1.2 Eco-Score Data Merging](#12-eco-score-data-merging)
   - [1.3 Palm Oil Analysis Merging](#13-palm-oil-analysis-merging)
   - [1.4 Packaging Data Merging](#14-packaging-data-merging)
2. [Product Enhancement Workflow](#2-product-enhancement-workflow)
   - [2.1 Calculate Eco-Score (if missing)](#21-calculate-eco-score-if-missing)
   - [2.2 Extract Palm Oil Analysis](#22-extract-palm-oil-analysis)
   - [2.3 Calculate Packaging Recyclability](#23-calculate-packaging-recyclability)
   - [2.4 Calculate Farming Impact](#24-calculate-farming-impact)
3. [Enhancement Databases for Planet Pillar Scoring](#3-enhancement-databases-for-planet-pillar-scoring)
   - [3.1 CSV Databases Integration](#31-csv-databases-integration)
   - [3.2 How Enhancement Databases Contribute to Planet Pillar](#32-how-enhancement-databases-contribute-to-planet-pillar)

---

## 1. Data Merging Workflow

### 1.1 Source Weights - Determination and Application

#### Overview
Source weights for Planet Pillar follow the same system as Body Pillar. The weights determine **trust level and priority** when merging Eco-Score data, palm oil analysis, and packaging information.

**Location**: `src/services/productDataMerger.ts` (lines 24-82)

**Weight Categories** (same as Body Pillar):
- **User-Contributed Data**: 1.0 (highest priority)
- **Gold Standard Government Databases**: 0.50
- **Open Food Facts**: 0.45 (primary source for Eco-Score)
- **Commercial APIs**: 0.30-0.35
- **Free/Community APIs**: 0.20-0.25
- **Web Search**: 0.10 (lowest priority)

#### How Source Weights Are Applied to Planet Data

**Step 1: Base Product Selection**
Same combined metric as Body Pillar:
```
Combined Score = (TruScore Completeness × 0.6) + (Source Weight × 0.4)
```

**Planet Pillar Completeness Scoring**:
- **Location**: `src/services/productDataMerger.ts` (lines 129-133)
- Eco-Score: 10 points (if present)
- Palm oil analysis: 5 points (if present)
- Packaging data: 5 points (if present)
- Palm oil tag: 5 points (if present)
- **Total possible**: 25 points for Planet Pillar completeness

**Step 2: Weight Normalization**
Weights are normalized to sum to 1.0 for merging operations.

**Step 3: Priority-Based Merging**
Higher-weight sources' data takes priority when merging Eco-Score, palm oil, and packaging data.

---

### 1.2 Eco-Score Data Merging

#### Overview
Eco-Score data is merged using a **priority-based approach**, where the highest-weight source's Eco-Score is used as the base, with enhancements from other sources.

**Location**: `src/services/productDataMerger.ts` (Eco-Score fields are merged as part of base product selection)

#### Step-by-Step Process

**Step 1: Base Product Selection**
The product with the highest combined score (including Eco-Score completeness) is selected as the base:
```typescript
const baseProduct = sortedProducts[0].product;
mergedProduct.ecoscore_grade = baseProduct.ecoscore_grade;
mergedProduct.ecoscore_score = baseProduct.ecoscore_score;
mergedProduct.ecoscore_data = baseProduct.ecoscore_data;
```

**Step 2: Enhancement from Other Sources**
If base product lacks Eco-Score but other sources have it:
```typescript
if (!mergedProduct.ecoscore_grade) {
  const ecoscoreSource = productsToMerge.find(p => p.ecoscore_grade);
  if (ecoscoreSource) {
    mergedProduct.ecoscore_grade = ecoscoreSource.ecoscore_grade;
    mergedProduct.ecoscore_score = ecoscoreSource.ecoscore_score;
    mergedProduct.ecoscore_data = ecoscoreSource.ecoscore_data;
  }
}
```

**Key Features**:
- **Priority-based**: Highest-weight source's Eco-Score is used
- **No averaging**: Eco-Score is a single value (not averaged)
- **Enhancement**: If base lacks Eco-Score, highest-weight source with Eco-Score is used

**Example**:
- Base Product (OFF, weight 0.45): Eco-Score Grade B
- Enhancement Source (USDA, weight 0.50): No Eco-Score
- **Result**: Eco-Score Grade B from OFF (base product)

**Step 3: Eco-Score CSV Fallback**
If no Eco-Score is available, CSV database provides carbon footprint fallback:
- **Location**: `src/lib/truscoreEngine/pillars/planetPillar.ts` (lines 240-260)
- **High carbon categories**: -5 penalty
- **Used when**: Eco-Score is completely missing

---

### 1.3 Palm Oil Analysis Merging

#### Overview
Palm oil analysis is extracted from ingredients and merged using a **priority-based approach**, where user-contributed data takes absolute priority.

**Location**: `src/services/openFoodFacts.ts` (lines 357-444) and `src/services/productEnhancementService.ts` (lines 63-77)

#### Step-by-Step Process

**Step 1: Extract Palm Oil Analysis**
Palm oil analysis is extracted during product enhancement:
```typescript
export function extractPalmOilAnalysis(product: Product): PalmOilAnalysis {
  // Check OFF data first
  const isPalmOilFree = product.ingredients_analysis?.['en:palm-oil-free'] === true;
  const containsPalmOil = product.ingredients_analysis?.['en:palm-oil'] === true;
  
  // Then check ingredients_text for comprehensive detection
  if (!isPalmOilFree && ingredientsText) {
    // Check for palm oil variations, derivatives, etc.
    // Returns: { containsPalmOil, isPalmOilFree, isCertifiedSustainable, ... }
  }
}
```

**Palm Oil Detection Sources**:
1. **OFF ingredients_analysis**: Official OFF palm oil tags
2. **Ingredients text**: Comprehensive pattern matching for palm oil variations
3. **Labels tags**: RSPO certification detection

**Step 2: User-Contributed Priority**
If user-contributed product has palm oil data, it takes absolute priority:
```typescript
if (userContributedProduct && userContributedProduct.palm_oil_analysis) {
  mergedProduct.palm_oil_analysis = userContributedProduct.palm_oil_analysis;
  // No merging - use exclusively
}
```

**Step 3: Merge from Multiple Sources**
If no user-contributed data, use highest-weight source's palm oil analysis:
```typescript
const palmOilSources = productsToMerge
  .map(p => p.palm_oil_analysis)
  .filter((p): p is PalmOilAnalysis => p !== undefined);

if (palmOilSources.length > 0) {
  // Use highest-weight source's palm oil analysis
  mergedProduct.palm_oil_analysis = palmOilSources[0]; // From base product (highest weight)
}
```

**Key Features**:
- **User-contributed priority**: Package label data is most accurate
- **OFF priority**: Open Food Facts has best palm oil detection
- **Comprehensive detection**: Checks for palm oil variations and derivatives

---

### 1.4 Packaging Data Merging

#### Overview
Packaging data is merged using a **deduplication approach**, where unique packaging items are collected from all sources.

**Location**: `src/services/productDataMerger.ts` (lines 331-353)

#### Step-by-Step Process

**Step 1: Collect All Packaging Data**
```typescript
const allPackagings = productsToMerge
  .map(p => p.packagings)
  .filter((p): p is NonNullable<Product['packagings']> => Array.isArray(p) && p.length > 0);
```

**Step 2: Deduplicate by Material and Shape**
```typescript
if (allPackagings.length > 0) {
  const packagingMap = new Map<string, PackagingItem>();
  
  allPackagings.forEach(packagingArray => {
    packagingArray.forEach(item => {
      const key = `${item.material || 'unknown'}_${item.shape || 'unknown'}`;
      if (!packagingMap.has(key)) {
        packagingMap.set(key, item);
      }
    });
  });
  
  mergedProduct.packagings = Array.from(packagingMap.values());
}
```

**Key Features**:
- **Deduplication**: Same material+shape combinations are merged
- **Union operation**: All unique packaging items are included
- **No weighting**: All packaging items are treated equally

**Example**:
- Source 1 (OFF): [{material: "plastic", shape: "bottle"}, {material: "cardboard", shape: "box"}]
- Source 2 (USDA): [{material: "plastic", shape: "bottle"}, {material: "aluminum", shape: "can"}]
- **Merged result**: [{material: "plastic", shape: "bottle"}, {material: "cardboard", shape: "box"}, {material: "aluminum", shape: "can"}]
  - "plastic bottle" appears once (deduplicated)
  - All unique items included

**Step 3: Packaging Tags Merging**
Packaging tags are merged using union operation (same as labels_tags):
```typescript
const allPackagingTags = productsToMerge
  .map(p => p.packaging_tags)
  .filter((tags): tags is string[] => Array.isArray(tags) && tags.length > 0);

if (allPackagingTags.length > 0) {
  const uniqueTags = new Set<string>();
  allPackagingTags.forEach(tags => {
    tags.forEach(tag => uniqueTags.add(tag));
  });
  mergedProduct.packaging_tags = Array.from(uniqueTags);
}
```

---

## 2. Product Enhancement Workflow

### 2.1 Calculate Eco-Score (if missing)

#### Overview
Eco-Score calculation happens during the product enhancement phase. If a product doesn't have an Eco-Score, the system attempts to enhance it or use CSV fallback.

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

**CSV Fallback**: If Eco-Score is missing, CSV database provides carbon footprint fallback (-5 for high carbon categories).

---

### 2.2 Extract Palm Oil Analysis

#### Overview
Palm oil analysis is extracted from ingredients text and OFF tags during product enhancement.

**Location**: `src/services/openFoodFacts.ts` (lines 357-444) and `src/services/productEnhancementService.ts` (lines 63-77)

#### Step-by-Step Process

**Step 1: Check OFF Data First**
```typescript
const isPalmOilFree = product.ingredients_analysis?.['en:palm-oil-free'] === true;
const containsPalmOil = product.ingredients_analysis?.['en:palm-oil'] === true;
```

**Step 2: Comprehensive Ingredients Text Detection**
If OFF data is incomplete, check ingredients text for palm oil variations:
```typescript
// Direct palm oil names
const palmOilDirectPattern = /\bpalm\s+oil\b/i;
const palmOilVariations = /\b(palmolein|palm\s+fat|palm\s+kernel\s+oil|...)\b/i;

// Chemical derivatives
const palmDerivativesPattern = /\b(palmate|palmitate|palmitic\s+acid|...)\b/i;

// Scientific name
const palmScientificPattern = /\belaeis\s+guineensis\b/i;

// Sodium-based derivatives
const palmSodiumPattern = /\b(sodium\s+lauryl\s+sulfate|...)\b/i;
```

**Step 3: RSPO Certification Check**
```typescript
// Check if RSPO certified via CSV service
const brandName = extractBrandOrParent(product);
const isRSPOCertified = brandName && csvService?.isRSPOCertified(brandName);
```

**Step 4: Return Palm Oil Analysis**
```typescript
return {
  containsPalmOil: boolean,
  isPalmOilFree: boolean,
  isCertifiedSustainable: boolean,
  detectedFromIngredientsText: boolean,
  // ... other fields
};
```

**Palm Oil Analysis Usage in Planet Pillar**:
- **Location**: `src/lib/truscoreEngine/pillars/planetPillar.ts` (lines 270-323)
- **Non-certified palm oil**: -8 penalty
- **RSPO certified**: 0 (neutral)
- **Certified sustainable (non-RSPO)**: -5 penalty
- **Brand overlay**: -4 for low WWF/RSPO commitment

---

### 2.3 Calculate Packaging Recyclability

#### Overview
Packaging recyclability is calculated from packaging data using local recyclability rules.

**Location**: `src/lib/truscoreEngine/pillars/planetPillar.ts` (lines 352-377) and `src/utils/packagingRecyclability.ts`

#### Step-by-Step Process

**Step 1: Get Local Recyclability Status**
```typescript
const recyclabilityStatus = getLocalRecyclabilityStatus(packagings);
```

**Local Recyclability Rules**:
- **Location**: `src/utils/packagingRecyclability.ts`
- **Country-specific**: Different countries have different recyclability rules
- **Material-based**: Checks material type (plastic, glass, metal, etc.)
- **Shape-based**: Some shapes are more recyclable than others

**Step 2: Calculate Recyclable Bonus**
```typescript
if (recyclabilityStatus.isRecyclable) {
  if (recyclabilityStatus.recyclableItems.length === packagings.length) {
    recyclableBonus = 3; // All packaging recyclable = +3
  } else if (recyclabilityStatus.recyclableItems.length > 0) {
    recyclableBonus = 1; // Some packaging recyclable = +1
  }
}
```

**Recyclability Scoring**:
- **All recyclable**: +3 (meets local requirements)
- **Some recyclable**: +1 (partial compliance)
- **None recyclable**: 0 (no bonus)

**Step 3: Packaging Eco-Cost Penalty**
```typescript
if (csvService && packagings.length > 0) {
  for (const packaging of packagings) {
    const material = packaging.material || '';
    if (csvService.isHighEcoCostMaterial(material)) {
      packagingEcoCostPenalty = 5; // -5 for high eco-cost materials
      break;
    }
  }
}
```

**High Eco-Cost Materials** (from CSV database):
- **Location**: `src/services/csvDatabases/csvDatabaseService.ts`
- **Idemat Eco-Cost Database**: Provides eco-cost data for packaging materials
- **Penalty**: -5 for high eco-cost materials

---

### 2.4 Calculate Farming Impact

#### Overview
Farming impact is calculated from crop data extracted from ingredients, using CSV databases (EWG, FAO, USDA) to determine high/low impact crops.

**Location**: `src/lib/truscoreEngine/pillars/planetPillar.ts` (lines 402-479)

#### Step-by-Step Process

**Step 1: Extract Crops from Ingredients**
```typescript
const ingredientsText = (product.ingredients_text || '').toLowerCase();
const crops = extractCropsFromIngredients(ingredientsText);
```

**Crop Extraction**:
- **Location**: `src/lib/truscoreEngine/pillars/planetPillar.ts` (lines 87-138)
- **Known crops**: Rice, wheat, corn, soy, strawberries, apples, almonds, coffee, cocoa, etc.
- **Word boundary matching**: Avoids false matches
- **Normalization**: Converts to singular form for database lookup

**Step 2: Verify Crops in Databases**
```typescript
for (const crop of allCrops) {
  const inFAO = csvService.queryFAOCropData(crop) !== null;
  const inEWG = csvService.queryEWGDirtyDozen(crop) !== null;
  const inUSDA = csvService.queryUSDAPDP(crop) !== null;
  
  if (inFAO || inEWG || inUSDA) {
    verifiedCrops.push(crop);
    if (csvService.hasHighFarmingImpact(crop)) {
      hasHighImpact = true;
      break;
    }
  }
}
```

**Crop Verification Databases**:
- **FAO Crop Data**: Global crop production data
- **EWG Dirty Dozen**: High-pesticide crops
- **USDA PDP**: US pesticide data program

**Step 3: Apply Farming Impact Adjustment**
```typescript
if (verifiedCrops.length > 0) {
  if (hasHighImpact) {
    farmingImpactAdjustment = -5; // High-impact = -5
    // Brand overlay: -3 for parent company high-impact
  } else {
    farmingImpactAdjustment = 3; // Low-impact = +3
  }
}
```

**Farming Impact Scoring**:
- **High-impact**: -5 (high water/carbon/land/pesticide use)
- **Low-impact**: +3 (sustainable farming practices)
- **Brand overlay**: -3 for parent company high-impact (accountability)

**Step 4: Brand Overlay for Parent Company**
```typescript
if (hasHighImpact) {
  const brandName = extractBrandOrParent(product);
  if (brandName) {
    const brandOverlay = -3;
    // Apply brand overlay penalty
  }
}
```

---

## 3. Enhancement Databases for Planet Pillar Scoring

### 3.1 CSV Databases Integration

#### Overview
CSV databases are **local in-memory databases** that provide:
- RSPO certification data (palm oil)
- EWG Dirty Dozen (high-pesticide crops)
- FAO crop data (global crop production)
- USDA PDP (pesticide data)
- Idemat Eco-Cost (packaging materials)
- Agribalyse fallback (category-based carbon data)

**Location**: `src/services/csvDatabases/csvDatabaseService.ts`

#### How CSV Databases Provide Planet Data

**1. RSPO Certification Data**:
- **Coverage**: RSPO-certified brands
- **Format**: Brand name + commitment level (high/medium/low/none)
- **Lookup**: By brand name (fuzzy matching)
- **Usage**: 
  - Palm oil penalty: RSPO certified = 0 (neutral)
  - Brand overlay: Low commitment = -4

**2. EWG Dirty Dozen**:
- **Coverage**: 14 high-pesticide crops
- **Format**: Crop name list
- **Lookup**: By crop name (exact match)
- **Usage**: High-impact farming detection (-5 penalty)

**3. FAO Crop Data**:
- **Coverage**: 27 crops globally
- **Format**: Crop name + production data
- **Lookup**: By crop name (exact match)
- **Usage**: Crop verification for farming impact

**4. USDA PDP (Pesticide Data Program)**:
- **Coverage**: 13 crops in US
- **Format**: Crop name + pesticide residue data
- **Lookup**: By crop name (exact match)
- **Usage**: Crop verification for farming impact

**5. Idemat Eco-Cost**:
- **Coverage**: 18 packaging materials
- **Format**: Material name + eco-cost value
- **Lookup**: By material name (exact match)
- **Usage**: High eco-cost packaging penalty (-5)

**6. Agribalyse Fallback**:
- **Coverage**: 15 food categories
- **Format**: Category name + carbon footprint
- **Lookup**: By category name (fuzzy match)
- **Usage**: Eco-Score CSV fallback (-5 for high carbon)

#### CSV Database Lookup Process

**Step 1: Initialize CSV Service**
```typescript
const csvService = getCSVDatabaseService();
```

**Step 2: Query Specific Database**
```typescript
// RSPO certification
const rspoData = csvService.queryRSPOCertified(brandName);
const isRSPOCertified = csvService.isRSPOCertified(brandName);

// Farming impact
const hasHighImpact = csvService.hasHighFarmingImpact(crop);
const faoCropData = csvService.queryFAOCropData(crop);

// Packaging eco-cost
const isHighEcoCost = csvService.isHighEcoCostMaterial(material);

// Carbon footprint fallback
const hasHighCarbon = csvService.hasHighCarbonFootprint(categoryName);
```

**Step 3: Apply Planet Pillar Adjustments**
Results from CSV databases directly affect Planet Pillar scoring:
- RSPO certification → Palm oil penalty adjustment
- High-impact crops → Farming impact penalty (-5)
- Low-impact crops → Farming impact bonus (+3)
- High eco-cost materials → Packaging penalty (-5)
- High carbon categories → Eco-Score fallback (-5)

---

### 3.2 How Enhancement Databases Contribute to Planet Pillar

#### Overview
Enhancement databases contribute to Planet Pillar through **data merging** and **CSV database lookups** rather than direct scoring. The merged Eco-Score, palm oil, and packaging data, combined with CSV database lookups, enable more accurate Planet Pillar scores.

#### Contribution Mechanisms

**1. Eco-Score Data Merging**

When multiple databases provide Eco-Score data:
- **Priority-based merging** uses highest-weight source's Eco-Score
- **Enhancement**: If base lacks Eco-Score, highest-weight source with Eco-Score is used
- **CSV fallback**: If no Eco-Score, high carbon categories get -5 penalty

**Example**:
- OFF missing Eco-Score
- CSV database detects high carbon category
- **Planet Pillar**: Applies -5 CSV fallback penalty

**2. Palm Oil Analysis Merging**

When multiple databases provide palm oil data:
- **User-contributed priority**: Package label data is most accurate
- **OFF priority**: Open Food Facts has best palm oil detection
- **RSPO lookup**: CSV database provides RSPO certification status
- **Result**: More accurate palm oil detection → Correct penalty application

**Example**:
- OFF detects palm oil
- CSV database confirms RSPO certification
- **Planet Pillar**: Applies 0 penalty (RSPO certified = neutral)

**3. Packaging Data Merging**

When multiple databases provide packaging data:
- **Union merging** collects all unique packaging items
- **Local recyclability**: Calculated from merged packaging data
- **Eco-cost lookup**: CSV database provides eco-cost for materials
- **Result**: More complete packaging data → Accurate recyclability and eco-cost scoring

**Example**:
- OFF provides: [{material: "plastic", shape: "bottle"}]
- USDA provides: [{material: "cardboard", shape: "box"}]
- **Merged**: Both items included
- **Planet Pillar**: Calculates recyclability for all items, applies eco-cost penalties

**4. Farming Impact Calculation**

CSV databases enable farming impact scoring:
- **Crop extraction**: From ingredients text
- **Crop verification**: EWG, FAO, USDA databases verify crops
- **Impact detection**: CSV databases determine high/low impact
- **Result**: Accurate farming impact adjustments

**Example**:
- Ingredients contain "strawberries"
- EWG database confirms "strawberries" in Dirty Dozen
- **Planet Pillar**: Applies -5 high-impact penalty

**5. Data Completeness Scoring**

Products with more complete Planet data score higher in base selection:
- **Eco-Score**: 10 points (if present)
- **Palm oil analysis**: 5 points (if present)
- **Packaging data**: 5 points (if present)
- **Result**: Higher completeness → Better base product selection → More accurate merging

**6. Same Logic for Other Enhancement Databases**

The same merging logic applies to **all enhancement databases**:

**High Priority (0.30-0.50)**:
- **Open Food Facts** (0.45): Primary source for Eco-Score, palm oil, packaging
- **USDA** (0.50): May provide packaging data
- **Health Canada** (0.50): May provide packaging data
- **UK FSA** (0.50): May provide packaging data

**Medium Priority (0.20-0.35)**:
- **Spoonacular** (0.30): May provide packaging data
- **FoodRepo** (0.35): May provide packaging data

**All enhancement databases**:
1. Provide Eco-Score, palm oil, and packaging data that gets merged
2. Contribute to data completeness scoring
3. Improve base product selection
4. Enable more accurate Planet Pillar scores through better data

#### Summary: Enhancement Database Contribution Flow

```
1. Query Enhancement Databases (OFF, USDA, etc.)
   ↓
2. Extract Eco-Score, Palm Oil, Packaging Data
   ↓
3. Merge Eco-Score (Priority-Based)
   - Highest weight source used
   - CSV fallback if missing
   ↓
4. Merge Palm Oil Analysis (Priority-Based)
   - User-contributed priority
   - OFF priority
   - RSPO lookup from CSV
   ↓
5. Merge Packaging Data (Union)
   - All unique items included
   - Local recyclability calculated
   - Eco-cost lookup from CSV
   ↓
6. Extract Crops from Ingredients
   ↓
7. CSV Database Lookups
   - RSPO certification
   - Farming impact (EWG, FAO, USDA)
   - Packaging eco-cost
   - Carbon footprint fallback
   ↓
8. Planet Pillar Scoring
   - Eco-Score adjustments (from merged data)
   - Palm oil penalties (from merged + CSV data)
   - Packaging bonuses/penalties (from merged + CSV data)
   - Farming impact adjustments (from CSV data)
   ↓
9. Result: More accurate Planet Pillar score
```

---

## Conclusion

The Data Merging and Product Enhancement workflows ensure that Planet Pillar scoring benefits from the **best available environmental data** across multiple databases:

1. **Source weights** prioritize trusted sources (Open Food Facts for Eco-Score)
2. **Priority-based merging** ensures highest-quality Eco-Score and palm oil data
3. **Union merging** creates comprehensive packaging lists
4. **CSV databases** provide critical lookups (RSPO, farming impact, eco-cost, carbon fallback)

The result is **more accurate and complete Planet Pillar scores** that reflect:
- Eco-Score from Open Food Facts (or CSV fallback)
- Accurate palm oil detection with RSPO certification
- Complete packaging data with recyclability and eco-cost scoring
- Farming impact based on verified crop data from multiple databases

