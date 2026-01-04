# Open Pillar: Data Merging & Product Enhancement - Complete Workflow

## Executive Summary

This document provides a comprehensive explanation of the **Data Merging** and **Product Enhancement** workflows in the TrueScan app, specifically as they relate to Open Pillar scoring. It covers the mechanics of source weights, ingredients text merging, origin data merging, brand ownership data merging, and how enhancement databases (brand database, origin extraction, etc.) contribute to Open Pillar scoring.

---

## Table of Contents

1. [Data Merging Workflow](#1-data-merging-workflow)
   - [1.1 Source Weights - Determination and Application](#11-source-weights---determination-and-application)
   - [1.2 Ingredients Text Merging](#12-ingredients-text-merging)
   - [1.3 Origin Data Merging](#13-origin-data-merging)
   - [1.4 Brand Ownership Data Merging](#14-brand-ownership-data-merging)
   - [1.5 Nutrition Data Merging for Transparency](#15-nutrition-data-merging-for-transparency)
2. [Product Enhancement Workflow](#2-product-enhancement-workflow)
   - [2.1 Extract Manufacturing Country](#21-extract-manufacturing-country)
   - [2.2 Brand Ownership Lookup](#22-brand-ownership-lookup)
   - [2.3 Hidden Terms Detection](#23-hidden-terms-detection)
3. [Enhancement Databases for Open Pillar Scoring](#3-enhancement-databases-for-open-pillar-scoring)
   - [3.1 Brand Database Integration](#31-brand-database-integration)
   - [3.2 Origin Extraction Services](#32-origin-extraction-services)
   - [3.3 How Enhancement Databases Contribute to Open Pillar](#33-how-enhancement-databases-contribute-to-open-pillar)

---

## 1. Data Merging Workflow

### 1.1 Source Weights - Determination and Application

#### Overview
Source weights for Open Pillar follow the same system as Body Pillar. The weights determine **trust level and priority** when merging ingredients text, origin data, and brand ownership information.

**Location**: `src/services/productDataMerger.ts` (lines 24-82)

**Weight Categories** (same as Body Pillar):
- **User-Contributed Data**: 1.0 (highest priority)
- **Gold Standard Government Databases**: 0.50
- **Open Food Facts**: 0.45 (primary source for transparency data)
- **Commercial APIs**: 0.30-0.35
- **Free/Community APIs**: 0.20-0.25
- **Web Search**: 0.10 (lowest priority)

#### How Source Weights Are Applied to Open Data

**Step 1: Base Product Selection**
Same combined metric as Body Pillar:
```
Combined Score = (TruScore Completeness × 0.6) + (Source Weight × 0.4)
```

**Open Pillar Completeness Scoring**:
- **Location**: `src/services/productDataMerger.ts` (lines 139-142)
- Ingredients text: 15 points (if present, >10 chars)
- Origins tags: 5 points (if present)
- Manufacturing places tags: 5 points (if present)
- **Total possible**: 25 points for Open Pillar completeness

**Step 2: Weight Normalization**
Weights are normalized to sum to 1.0 for merging operations.

**Step 3: Priority-Based Merging**
Higher-weight sources' data takes priority when merging ingredients, origins, and brand ownership.

---

### 1.2 Ingredients Text Merging

#### Overview
Ingredients text is merged using a **longest/most complete** approach, where the longest ingredients list is used (assuming it's most complete).

**Location**: `src/services/productDataMerger.ts` (lines 252-269)

#### Step-by-Step Process

**Step 1: Collect All Ingredients Text**
```typescript
const ingredientsList = productsToMerge
  .map(p => p.ingredients_text)
  .filter((i): i is string => !!i && i.length > 0);
```

**Step 2: User-Contributed Priority**
If user-contributed product has ingredients, it takes absolute priority:
```typescript
if (userContributedProduct && userContributedProduct.ingredients_text && 
    userContributedProduct.ingredients_text.trim().length > 0) {
  mergedProduct.ingredients_text = userContributedProduct.ingredients_text;
  // Use exclusively - no merging needed
}
```

**Step 3: Longest Ingredients List**
If no user-contributed data, use longest ingredients list:
```typescript
mergedProduct.ingredients_text = ingredientsList.reduce((longest, current) => 
  current.length > longest.length ? current : longest
);
```

**Key Features**:
- **User-contributed priority**: Package label data is most accurate
- **Longest = most complete**: Assumes longer list = more complete disclosure
- **No averaging**: Ingredients text is a single string (not averaged)

**Example**:
- Source 1 (OFF): "sugar, water, salt, natural flavor"
- Source 2 (Spoonacular): "sugar, water, salt"
- **Merged result**: "sugar, water, salt, natural flavor" (longest)

**Step 4: Handling Conflicts**
Conflicts are resolved by **length**: the longest ingredients list is assumed to be most complete.

**Example Conflict Resolution**:
- Source 1 (OFF, weight 0.45): "sugar, water, salt" (15 chars)
- Source 2 (USDA, weight 0.50): "sugar, water" (12 chars)
- **Result**: "sugar, water, salt" from OFF (longest, even though USDA has higher weight)

**Rationale**: For transparency, completeness (length) is more important than source weight.

---

### 1.3 Origin Data Merging

#### Overview
Origin data is merged using a **union operation** to collect all unique origin information from all sources.

**Location**: `src/services/productDataMerger.ts` (lines 355-371, 427-448)

#### Step-by-Step Process

**Step 1: Collect All Origins Tags**
```typescript
const allOriginsTags = productsToMerge
  .map(p => p.origins_tags)
  .filter((tags): tags is string[] => Array.isArray(tags) && tags.length > 0);

if (allOriginsTags.length > 0) {
  const uniqueOrigins = new Set<string>();
  allOriginsTags.forEach(tags => {
    tags.forEach(tag => {
      if (typeof tag === 'string' && tag.trim().length > 0) {
        uniqueOrigins.add(tag.trim());
      }
    });
  });
  mergedProduct.origins_tags = Array.from(uniqueOrigins);
}
```

**Step 2: Collect All Manufacturing Places Tags**
```typescript
const allManufacturingTags = productsToMerge
  .map(p => p.manufacturing_places_tags)
  .filter((tags): tags is string[] => Array.isArray(tags) && tags.length > 0);

if (allManufacturingTags.length > 0) {
  const uniqueManufacturing = new Set<string>();
  allManufacturingTags.forEach(tags => {
    tags.forEach(tag => {
      if (typeof tag === 'string' && tag.trim().length > 0) {
        uniqueManufacturing.add(tag.trim());
      }
    });
  });
  mergedProduct.manufacturing_places_tags = Array.from(uniqueManufacturing);
}
```

**Step 3: Merge Origin Strings (Fallback)**
If tags not available, merge origin strings:
```typescript
const allOriginsStrings = productsToMerge
  .map(p => p.origins)
  .filter((o): o is string => !!o && typeof o === 'string' && o.trim().length > 0);

if (allOriginsStrings.length > 0 && !mergedProduct.origins) {
  // Use longest/most specific origin string
  mergedProduct.origins = allOriginsStrings.reduce((longest, current) => 
    current.length > longest.length ? current : longest
  );
}
```

**Key Features**:
- **Union operation**: All unique origins from all sources are included
- **Tags priority**: Tags are preferred over strings (more structured)
- **Longest string**: If using strings, longest is used (most specific)

**Example**:
- Source 1 (OFF): origins_tags = ["en:china", "en:taiwan"]
- Source 2 (USDA): origins = "China"
- **Merged result**: 
  - origins_tags = ["en:china", "en:taiwan"] (from OFF)
  - origins = "China" (from USDA, fallback)

**Step 4: Open Pillar Usage**
Open Pillar checks for origin in multiple fields:
- **Location**: `src/lib/truscoreEngine/pillars/openPillar.ts` (lines 233-307)
- **No origin**: -4 penalty
- **Complete origin**: +4 bonus (has both tags and string, or multiple tags)
- **Partial origin**: 0 (no adjustment)

---

### 1.4 Brand Ownership Data Merging

#### Overview
Brand ownership (parent company) data is merged using a **priority-based approach**, where the highest-weight source's brand_owner is used.

**Location**: `src/services/productDataMerger.ts` (lines 221-223)

#### Step-by-Step Process

**Step 1: Use Base Product's Brand Owner**
```typescript
mergedProduct.brand_owner = baseProduct.brand_owner || 
  productsToMerge.find(p => p.brand_owner)?.brand_owner;
```

**Key Features**:
- **Priority-based**: Base product's brand_owner is used first
- **Fallback**: If base lacks brand_owner, first available from other sources
- **No merging**: Brand owner is a single value (not merged)

**Step 2: Brand Database Lookup**
If brand_owner is missing, brand database provides parent company:
```typescript
const brandMatch = getBestBrandMatch(product, 0.75);
const brandData = brandMatch?.matchedData;
const parentCompany = brandData?.parentCompany || product.brand_owner;
```

**Step 3: Open Pillar Usage**
Open Pillar checks for brand ownership transparency:
- **Location**: `src/lib/truscoreEngine/pillars/openPillar.ts` (lines 309-351)
- **Hidden/opaque parent**: -3 penalty
- **Disclosed parent**: 0 (no penalty)
- **Found in database**: 0 (no penalty, transparency maintained)

---

### 1.5 Nutrition Data Merging for Transparency

#### Overview
Nutrition data merging (covered in Body Pillar) also contributes to Open Pillar through **nutritional information disclosure scoring**.

**Location**: `src/lib/truscoreEngine/pillars/openPillar.ts` (lines 181-231)

#### Step-by-Step Process

**Step 1: Check for Nutrition Data**
```typescript
const nutrients = product.nutriments || {};
const hasNutrients = Object.keys(nutrients).length > 0;
```

**Step 2: Assess Completeness**
```typescript
const hasPer100g = Object.keys(nutrients).some(key => key.includes('_100g'));
const hasServingSize = !!product.serving_size || !!nutrients.serving_size;
const hasCompleteFormat = hasPer100g && hasServingSize;

const keyNutrients = ['energy', 'fat', 'carbohydrates', 'proteins', 'salt', 'sugars'];
const hasKeyNutrients = keyNutrients.some(nutrient => 
  Object.keys(nutrients).some(key => key.toLowerCase().includes(nutrient))
);
```

**Step 3: Apply Nutritional Information Adjustment**
```typescript
if (!hasNutrients) {
  nutritionalInfoAdjustment = -3; // No nutrition = -3
} else if (hasCompleteFormat && hasKeyNutrients) {
  nutritionalInfoAdjustment = 3; // Complete = +3
} else if (hasKeyNutrients) {
  nutritionalInfoAdjustment = 1; // Partial = +1
}
```

**Nutritional Information Scoring**:
- **Complete**: +3 (has per-100g, serving size, and key nutrients)
- **Partial**: +1 (has key nutrients but incomplete format)
- **None**: -3 (no nutritional information)

**Note**: This uses the **merged nutrition data** from Body Pillar merging process, ensuring consistency across pillars.

---

## 2. Product Enhancement Workflow

### 2.1 Extract Manufacturing Country

#### Overview
Manufacturing country extraction is critical for Open Pillar origin scoring. It extracts country from multiple possible fields.

**Location**: `src/services/openFoodFacts.ts` (lines 208-278) and `src/lib/truscoreEngine/pillars/openPillar.ts` (lines 233-307)

#### Step-by-Step Process

**Step 1: Priority 1 - Manufacturing Places Tags**
```typescript
if (product.manufacturing_places_tags && product.manufacturing_places_tags.length > 0) {
  const country = product.manufacturing_places_tags[0]
    .replace(/^en:/, '')
    .replace(/-/g, ' ')
    .toUpperCase();
  if (country && country.trim()) {
    return country;
  }
}
```

**Step 2: Priority 2 - Manufacturing Places String**
```typescript
if (product.manufacturing_places && typeof product.manufacturing_places === 'string') {
  const places = product.manufacturing_places.split(',');
  const firstPlace = places[0]?.trim();
  if (firstPlace) {
    return firstPlace.toUpperCase();
  }
}
```

**Step 3: Priority 3 - Origins Tags**
```typescript
if (product.origins_tags && product.origins_tags.length > 0) {
  const originTag = product.origins_tags[0];
  const country = originTag.replace(/^en:/, '').replace(/-/g, ' ').toUpperCase();
  if (country && country.trim()) {
    return country;
  }
}
```

**Step 4: Priority 4 - Origins String**
```typescript
if (product.origins && typeof product.origins === 'string') {
  const origins = product.origins.split(',');
  const firstOrigin = origins[0]?.trim();
  if (firstOrigin) {
    const cleaned = firstOrigin
      .replace(/^(product\s+of|made\s+in|origin:|origin\s+of)\s*/i, '')
      .trim();
    if (cleaned) {
      return cleaned.toUpperCase();
    }
  }
}
```

**Step 5: Priority 5 - Text Field Extraction**
```typescript
const labelsText = (product.labels || product.labels_en || product.generic_name || '').toLowerCase();
const originsPattern = /(?:product\s+of|made\s+in|origin:|origin\s+of|manufactured\s+in)\s+([a-z\s]+?)(?:[,;]|\s*$)/i;
const match = labelsText.match(originsPattern);
if (match && match[1]) {
  const extractedCountry = match[1].trim();
  if (extractedCountry && extractedCountry.length > 2) {
    return extractedCountry.toUpperCase();
  }
}
```

**Key Features**:
- **Priority order**: Manufacturing places > Origins > Text extraction
- **Tags preferred**: Structured tags are preferred over strings
- **Text extraction**: Fallback to pattern matching in text fields
- **DO NOT use countries_tags**: This represents where SOLD, not where MANUFACTURED

**Open Pillar Usage**:
- **No origin**: -4 penalty
- **Complete origin**: +4 bonus
- **Partial origin**: 0 (no adjustment)

---

### 2.2 Brand Ownership Lookup

#### Overview
Brand ownership lookup uses fuzzy matching to find parent company information from the brand database.

**Location**: `src/lib/truscoreEngine/pillars/openPillar.ts` (lines 309-351)

#### Step-by-Step Process

**Step 1: Check for Brand Owner Field**
```typescript
const hasBrandOwner = !!(product.brand_owner && 
  !isPlaceholderValue(product.brand_owner));
```

**Placeholder Detection**:
- Values like "unknown", "n/a", "not available", "missing", "not disclosed", "not specified" are treated as missing

**Step 2: Fuzzy Brand Matching**
```typescript
if (!hasBrandOwner) {
  const brandMatch = getBestBrandMatch(product, 0.75);
  const brandData = brandMatch?.matchedData || null;
  const hasParentInDatabase = !!(brandData?.parentCompany || brandMatch?.parentCompany);
}
```

**Step 3: Apply Brand Ownership Penalty**
```typescript
if (!hasParentInDatabase) {
  brandOwnershipPenalty = 3; // Hidden/opaque parent = -3
  adjustments.push({
    description: 'Hidden/opaque parent company',
    value: -brandOwnershipPenalty,
    type: 'negative',
  });
  score -= brandOwnershipPenalty;
} else {
  // Parent found in database - no penalty
  adjustments.push({
    description: 'Parent company identified via brand database',
    value: 0,
    type: 'neutral',
  });
}
```

**Brand Ownership Scoring**:
- **Disclosed**: 0 (no penalty)
- **Found in database**: 0 (no penalty, transparency maintained)
- **Hidden/opaque**: -3 (penalty for lack of transparency)

---

### 2.3 Hidden Terms Detection

#### Overview
Hidden terms detection scans ingredients text for terms that indicate hidden or proprietary ingredients.

**Location**: `src/lib/truscoreEngine/pillars/openPillar.ts` (lines 22-42, 126-179)

#### Step-by-Step Process

**Step 1: Define Hidden Terms List**
```typescript
const HIDDEN_TERMS = [
  'parfum', 'fragrance', 'aroma',
  'flavor', 'flavour',
  'natural flavor', 'natural flavour',
  'artificial flavor', 'artificial flavour',
  'natural flavoring', 'natural flavouring',
  'artificial flavoring', 'artificial flavouring',
  'proprietary', 'proprietary blend',
  'secret formula', 'essence', 'spice', 'extract',
];
```

**Step 2: Count Hidden Terms**
```typescript
const hiddenCount = HIDDEN_TERMS.filter((t) => hasTerm(t)).length;
```

**Word Boundary Matching**:
- Uses regex with word boundaries to avoid false matches
- Example: "flavor" matches "natural flavor" but not "flavoring" (unless "flavoring" is in the list)

**Step 3: NOVA Amplification**
```typescript
let effectiveHiddenCount = hiddenCount;
if (product.nova_group !== undefined && product.nova_group >= 3) {
  effectiveHiddenCount += 1; // NOVA 3-4 adds +1 to hidden count
}
```

**Step 4: Apply Hidden Terms Penalty**
```typescript
if (effectiveHiddenCount >= 3) {
  hiddenTermsPenalty = 11; // -11
} else if (effectiveHiddenCount === 2) {
  hiddenTermsPenalty = 6; // -6
} else if (effectiveHiddenCount === 1) {
  hiddenTermsPenalty = 2; // -2
}
```

**Hidden Terms Scoring**:
- **1 term**: -2
- **2 terms**: -6
- **≥3 terms**: -11
- **NOVA 3-4 amplification**: +1 to count

**Step 5: Zero Hidden Rewards**
```typescript
if (hiddenCount === 0) {
  const nova = product.nova_group;
  if (nova === 1 || nova === 2) {
    sophisticationBonus = 4; // +4 for zero hidden + NOVA 1-2
  } else {
    sophisticationBonus = 2; // +2 for zero hidden but NOVA 3-4
  }
}
```

**Zero Hidden Rewards**:
- **Zero hidden + NOVA 1-2**: +4 (sophistication bonus)
- **Zero hidden + NOVA 3-4**: +2 (transparency bonus)

---

## 3. Enhancement Databases for Open Pillar Scoring

### 3.1 Brand Database Integration

#### Overview
The brand database provides parent company information for brand ownership transparency scoring.

**Location**: `src/data/brandDatabase.ts`

#### How Brand Database Provides Open Data

**1. Parent Company Data**:
- **Format**: Brand name → Parent company name
- **Lookup**: By brand name (fuzzy matching)
- **Usage**: Brand ownership transparency check

**2. Brand Matching**:
- **Fuzzy matching**: Handles brand name variations
- **Confidence scoring**: 75% threshold for matches
- **Match types**: Exact, high confidence, medium confidence

#### Brand Database Lookup Process

**Step 1: Fuzzy Brand Matching**
```typescript
const brandMatch = getBestBrandMatch(product, 0.75);
const brandData = brandMatch?.matchedData;
```

**Step 2: Extract Parent Company**
```typescript
const parentCompany = brandData?.parentCompany || product.brand_owner;
```

**Step 3: Open Pillar Usage**
If parent company is found in database, no penalty is applied (transparency maintained).

---

### 3.2 Origin Extraction Services

#### Overview
Origin extraction services extract manufacturing country from multiple product fields.

**Location**: `src/services/openFoodFacts.ts` (lines 208-278)

#### How Origin Extraction Works

**1. Multiple Field Priority**:
- **Priority 1**: manufacturing_places_tags (most reliable)
- **Priority 2**: manufacturing_places (string)
- **Priority 3**: origins_tags (may contain country codes)
- **Priority 4**: origins (string, may have "Product of X" format)
- **Priority 5**: Text field extraction (pattern matching)

**2. Text Pattern Matching**:
```typescript
const originsPattern = /(?:product\s+of|made\s+in|origin:|origin\s+of|manufactured\s+in)\s+([a-z\s]+?)(?:[,;]|\s*$)/i;
```

**Patterns Detected**:
- "Product of X"
- "Made in X"
- "Origin: X"
- "Manufactured in X"

**3. Open Pillar Usage**:
- **No origin**: -4 penalty
- **Complete origin**: +4 bonus (has both tags and string, or multiple tags)
- **Partial origin**: 0 (no adjustment)

---

### 3.3 How Enhancement Databases Contribute to Open Pillar

#### Overview
Enhancement databases contribute to Open Pillar through **data merging** and **brand database lookups** rather than direct scoring. The merged ingredients, origin, and brand ownership data enables more accurate Open Pillar scores.

#### Contribution Mechanisms

**1. Ingredients Text Merging**

When multiple databases provide ingredients text:
- **Longest list** creates most complete ingredients disclosure
- **User-contributed priority** ensures package label accuracy
- **Result**: More complete ingredients → Better disclosure scoring (+2) and hidden terms detection

**Example**:
- OFF missing or incomplete ingredients
- USDA provides complete ingredients list
- **Merged**: Uses USDA ingredients (longest)
- **Open Pillar**: Detects full disclosure (+2), checks for hidden terms

**2. Origin Data Merging**

When multiple databases provide origin data:
- **Union merging** collects all unique origin information
- **Tags priority** ensures structured data is used
- **Result**: More complete origin data → Better origin scoring

**Example**:
- OFF provides: origins_tags = ["en:china"]
- USDA provides: origins = "China, Taiwan"
- **Merged**: origins_tags = ["en:china"], origins = "China, Taiwan"
- **Open Pillar**: Detects complete origin (+4 bonus)

**3. Brand Ownership Lookup**

Brand database enables:
- **Parent company identification**: When brand_owner is missing
- **Transparency maintenance**: No penalty if found in database
- **Hidden parent detection**: -3 penalty if not found

**4. Nutrition Data for Transparency**

Merged nutrition data (from Body Pillar) contributes to Open Pillar:
- **Complete nutrition**: +3 (has per-100g, serving size, key nutrients)
- **Partial nutrition**: +1 (has key nutrients)
- **No nutrition**: -3

**5. Data Completeness Scoring**

Products with more complete Open data score higher in base selection:
- **Ingredients text**: 15 points (if present, >10 chars)
- **Origins tags**: 5 points (if present)
- **Manufacturing places tags**: 5 points (if present)
- **Result**: Higher completeness → Better base product selection → More accurate merging

**6. Same Logic for Other Enhancement Databases**

The same merging logic applies to **all enhancement databases**:

**High Priority (0.30-0.50)**:
- **Open Food Facts** (0.45): Primary source for ingredients, origins, brand_owner
- **USDA** (0.50): May provide ingredients, origins
- **Health Canada** (0.50): May provide ingredients, origins
- **UK FSA** (0.50): May provide ingredients, origins

**Medium Priority (0.20-0.35)**:
- **Spoonacular** (0.30): May provide ingredients
- **FoodRepo** (0.35): May provide ingredients, origins

**All enhancement databases**:
1. Provide ingredients, origin, and brand ownership data that gets merged
2. Contribute to data completeness scoring
3. Improve base product selection
4. Enable more accurate Open Pillar scores through better transparency data

#### Summary: Enhancement Database Contribution Flow

```
1. Query Enhancement Databases (OFF, USDA, etc.)
   ↓
2. Extract Ingredients, Origins, Brand Ownership Data
   ↓
3. Merge Ingredients Text (Longest/Most Complete)
   - User-contributed priority
   - Longest list used
   ↓
4. Merge Origin Data (Union)
   - All unique origins included
   - Tags preferred over strings
   ↓
5. Merge Brand Ownership (Priority-Based)
   - Base product's brand_owner used
   - Brand database lookup if missing
   ↓
6. Extract Manufacturing Country
   - Multiple field priority
   - Text pattern matching
   ↓
7. Brand Database Lookup
   - Parent company identification
   - Transparency check
   ↓
8. Open Pillar Scoring
   - Ingredients disclosure (+2/-3)
   - Hidden terms penalty (-2/-6/-11)
   - Zero hidden rewards (+4/+2)
   - Origin penalty/bonus (-4/+4)
   - Brand ownership penalty (-3)
   - Nutritional information (+3/+1/-3)
   ↓
9. Result: More accurate Open Pillar score
```

---

## Conclusion

The Data Merging and Product Enhancement workflows ensure that Open Pillar scoring benefits from the **best available transparency data** across multiple databases:

1. **Source weights** prioritize trusted sources (Open Food Facts, government databases)
2. **Longest ingredients** ensures most complete disclosure
3. **Union merging** creates comprehensive origin lists
4. **Brand database lookups** enable parent company identification
5. **Origin extraction** finds manufacturing country from multiple fields

The result is **more accurate and complete Open Pillar scores** that reflect:
- Complete ingredients disclosure (+2) or missing disclosure (-3)
- Hidden terms detection with NOVA amplification (-2/-6/-11)
- Zero hidden rewards for transparent products (+4/+2)
- Origin transparency with complete/partial/no origin scoring (-4/+4/0)
- Brand ownership transparency with hidden parent penalty (-3)
- Nutritional information completeness (+3/+1/-3)

