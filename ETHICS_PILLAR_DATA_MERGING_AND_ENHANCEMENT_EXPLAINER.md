# Ethics Pillar: Data Merging & Product Enhancement - Complete Workflow

## Executive Summary

This document provides a comprehensive explanation of the **Data Merging** and **Product Enhancement** workflows in the TrueScan app, specifically as they relate to Ethics Pillar scoring. It covers the mechanics of source weights, certification data merging, brand data enhancement, and how enhancement databases (brand database, recall services, etc.) contribute to Ethics Pillar scoring.

---

## Table of Contents

1. [Data Merging Workflow](#1-data-merging-workflow)
   - [1.1 Source Weights - Determination and Application](#11-source-weights---determination-and-application)
   - [1.2 Certification Data Merging](#12-certification-data-merging)
   - [1.3 Labels Tags Merging](#13-labels-tags-merging)
2. [Product Enhancement Workflow](#2-product-enhancement-workflow)
   - [2.1 Brand Matching and Extraction](#21-brand-matching-and-extraction)
   - [2.2 BBFAW Tier Lookup](#22-bbfaw-tier-lookup)
   - [2.3 Labor Violations Lookup](#23-labor-violations-lookup)
   - [2.4 Recall Data Integration](#24-recall-data-integration)
3. [Enhancement Databases for Ethics Pillar Scoring](#3-enhancement-databases-for-ethics-pillar-scoring)
   - [3.1 Brand Database Integration](#31-brand-database-integration)
   - [3.2 Recall Services Integration](#32-recall-services-integration)
   - [3.3 How Enhancement Databases Contribute to Ethics Pillar](#33-how-enhancement-databases-contribute-to-ethics-pillar)

---

## 1. Data Merging Workflow

### 1.1 Source Weights - Determination and Application

#### Overview
Source weights for Ethics Pillar follow the same system as Body Pillar. The weights determine **trust level and priority** when merging certification data, labels, and brand information.

**Location**: `src/services/productDataMerger.ts` (lines 24-82)

**Weight Categories** (same as Body Pillar):
- **User-Contributed Data**: 1.0 (highest priority)
- **Gold Standard Government Databases**: 0.50
- **Open Food Facts**: 0.45
- **Commercial APIs**: 0.30-0.35
- **Free/Community APIs**: 0.20-0.25
- **Web Search**: 0.10 (lowest priority)

#### How Source Weights Are Applied to Ethics Data

**Step 1: Base Product Selection**
Same combined metric as Body Pillar:
```
Combined Score = (TruScore Completeness × 0.6) + (Source Weight × 0.4)
```

**Ethics Pillar Completeness Scoring**:
- **Location**: `src/services/productDataMerger.ts` (lines 135-137)
- Labels/certifications: 15 points (if present)
- Certifications array: 10 points (if present)
- **Total possible**: 25 points for Ethics Pillar completeness

**Step 2: Weight Normalization**
Weights are normalized to sum to 1.0 for merging operations.

**Step 3: Priority-Based Merging**
Higher-weight sources' data takes priority when merging certifications and labels.

---

### 1.2 Certification Data Merging

#### Overview
Certifications are merged using a **union with priority** approach, where higher-weight sources' certifications are added first.

**Location**: `src/services/productDataMerger.ts` (lines 271-278, 1029-1050)

#### Step-by-Step Process

**Step 1: Collect All Certifications**
```typescript
const allCertifications = productsToMerge
  .map(p => p.certifications)
  .filter((c): c is Certification[] => Array.isArray(c) && c.length > 0);
```

All products with certification arrays are collected.

**Step 2: Union with Priority Merging**
```typescript
function mergeCertificationsList(
  certifications: Certification[][],
  weights: number[]
): Certification[] {
  const certificationMap = new Map<string, Certification>();
  
  // Process certifications in order of weight (highest first)
  certifications.forEach((certs, index) => {
    const weight = weights[index] || 0;
    
    certs.forEach(cert => {
      const key = cert.tag || cert.id || cert.name || '';
      
      // Only add if not already present (higher weight sources processed first)
      if (key && !certificationMap.has(key)) {
        certificationMap.set(key, cert);
      }
    });
  });
  
  return Array.from(certificationMap.values());
}
```

**Key Features**:
- **Union operation**: All unique certifications from all sources are included
- **Priority-based**: Higher-weight sources' certifications are processed first
- **Deduplication**: Certifications are deduplicated by tag/id/name
- **No conflicts**: If the same certification appears in multiple sources, the first one (from highest-weight source) is kept

**Example**:
- Source 1 (OFF, weight 0.45): [Fairtrade, Organic]
- Source 2 (Spoonacular, weight 0.30): [Organic, Rainforest Alliance]
- Normalized weights: OFF = 0.60, Spoonacular = 0.40
- **Merged result**: [Fairtrade, Organic, Rainforest Alliance]
  - Fairtrade from OFF (processed first)
  - Organic from OFF (processed first, Spoonacular's Organic skipped)
  - Rainforest Alliance from Spoonacular (added)

**Step 3: Handling Conflicts**
Conflicts are resolved by **priority**: the certification from the highest-weight source is kept.

**Example Conflict Resolution**:
- Source 1 (OFF, weight 0.45): Organic certification with tag "en:organic"
- Source 2 (USDA, weight 0.50): Organic certification with tag "usda-organic"
- **Result**: Both are kept (different tags = different certifications)
- If same tag: OFF's certification is kept (processed first due to weight order)

---

### 1.3 Labels Tags Merging

#### Overview
Labels tags (which include certification labels) are merged using a **union operation** to collect all unique labels from all sources.

**Location**: `src/services/productDataMerger.ts` (lines 295-311)

#### Step-by-Step Process

**Step 1: Collect All Labels Tags**
```typescript
const allLabelsTags = productsToMerge
  .map(p => p.labels_tags)
  .filter((tags): tags is string[] => Array.isArray(tags) && tags.length > 0);
```

**Step 2: Union Merging**
```typescript
if (allLabelsTags.length > 0) {
  const uniqueLabels = new Set<string>();
  allLabelsTags.forEach(tags => {
    tags.forEach(tag => {
      if (typeof tag === 'string' && tag.trim().length > 0) {
        uniqueLabels.add(tag.trim());
      }
    });
  });
  mergedProduct.labels_tags = Array.from(uniqueLabels);
}
```

**Key Features**:
- **Union operation**: All unique labels from all sources are included
- **No weighting**: Labels are simply collected (no priority-based selection)
- **Deduplication**: Duplicate labels are automatically removed via Set
- **Case-insensitive**: Labels are trimmed but case is preserved

**Example**:
- Source 1 (OFF): ["en:organic", "en:fair-trade", "en:vegan"]
- Source 2 (USDA): ["en:organic", "en:usda-organic"]
- **Merged result**: ["en:organic", "en:fair-trade", "en:vegan", "en:usda-organic"]
  - All unique labels included
  - "en:organic" appears once (deduplicated)

**Step 3: Ethics Pillar Usage**
Ethics Pillar uses `labels_tags` to detect certifications:
- **Location**: `src/lib/truscoreEngine/pillars/ethicsPillar.ts` (lines 73-273)
- Checks for: Fairtrade, Organic, Rainforest Alliance, UTZ, MSC/ASC, Ocean Wise, RSPCA, Leaping Bunny, B-Corp, Free-Roaming, Free-Range, Cage-Free, etc.
- **Certification bonuses stack** up to +15 total

---

## 2. Product Enhancement Workflow

### 2.1 Brand Matching and Extraction

#### Overview
Brand matching is critical for Ethics Pillar because it enables:
- BBFAW tier lookup (animal cruelty scoring)
- Labor violations lookup
- Brand overlay penalties
- Parent company identification

**Location**: `src/lib/truscoreEngine/pillars/ethicsPillar.ts` (lines 77-101)

#### Step-by-Step Process

**Step 1: Extract All Possible Brands**
```typescript
const allBrands = extractAllBrands(product);
const primaryBrand = allBrands.length > 0 ? allBrands[0] : null;
```

**Brand Extraction Sources** (in priority order):
1. `product.brands` field (comma-separated, first brand used)
2. `product.brand_owner` field
3. `product.brands_tags` array (OFF-specific)
4. Extracted from `product.product_name` (aggressive extraction)

**Step 2: Fuzzy Brand Matching**
```typescript
const brandMatches = matchBrands(product, 0.75); // 75% threshold
const bestBrandMatch = brandMatches.length > 0 ? brandMatches[0] : null;
```

**Fuzzy Matching Features**:
- **Confidence threshold**: 75% (balanced accuracy vs coverage)
- **Handles variations**: "Coca-Cola" matches "Coca Cola", "coca cola", etc.
- **Returns best match**: Highest confidence match is used
- **Match types**: Exact, high confidence, medium confidence

**Step 3: Brand Data Lookup**
```typescript
const brandData = bestBrandMatch?.matchedData || null;
const matchedBrand = bestBrandMatch?.brand || primaryBrand || '';
```

**Brand Database Contains**:
- BBFAW tier data
- Labor violation history
- Recall history
- Parent company information
- Certification data

---

### 2.2 BBFAW Tier Lookup

#### Overview
BBFAW (Business Benchmark on Farm Animal Welfare) tier data is the **ONLY source** for animal cruelty scoring in Ethics Pillar (per spec).

**Location**: `src/lib/truscoreEngine/pillars/ethicsPillar.ts` (lines 293-341)

#### Step-by-Step Process

**Step 1: Check All Extracted Brands**
```typescript
for (const brand of allBrands) {
  const bbfawData = checkBBFAWTier(brand);
  if (bbfawData) {
    const tierScore = getBBFAWTierScore(bbfawData.tier);
    // Apply adjustment
    break; // Use first BBFAW match found
  }
}
```

**BBFAW Tier Scoring**:
- **Tier 1**: +4 (excellent animal welfare)
- **Tier 2**: +2 (good animal welfare)
- **Tier 3-5**: 0 (no adjustment)
- **Tier 6**: -7 (poor animal welfare)
- **Tier E/F**: -7 (poor animal welfare)

**Step 2: Spec Compliance - No Fallback**
**CRITICAL**: Per spec, if BBFAW data is not found, **no adjustment is applied** (nil return):
```typescript
if (!bbfawTierApplied) {
  logger.debug('[EthicsPillar] BBFAW data not found - returning nil (no adjustment, no penalty) per spec');
  // No adjustment applied - spec says "if not found nil return"
}
```

**Rationale**: BBFAW only assesses top 150 food companies. For companies not assessed, we don't assume good or bad - we return nil (neutral).

**Step 3: Brand Overlay for Parent Company**
If product brand doesn't have BBFAW data, check parent company:
```typescript
if (parentCompany && !productHasAnimalCruelty) {
  const parentBBFAW = checkBBFAWTier(parentCompany);
  if (parentBBFAW && parentBBFAW.tierScore < 0) {
    // Apply brand overlay penalty
  }
}
```

**Brand Overlay Penalties** (mutually exclusive):
- **Limited**: -4
- **Moderate**: -8
- **Major**: -15

---

### 2.3 Labor Violations Lookup

#### Overview
Labor violations are checked against multiple databases (DOL, Walk Free, Oxfam, ILO) and applied using a 3-tier system.

**Location**: `src/lib/truscoreEngine/pillars/ethicsPillar.ts` (lines 343-432)

#### Step-by-Step Process

**Step 1: Check Primary Brand**
```typescript
let laborViolationData = checkLaborViolations(product);
```

**Labor Violation Sources**:
- **DOL (Department of Labor)**: US labor violation database
- **Walk Free Foundation**: Modern slavery index
- **Oxfam**: Labor rights reports
- **ILO (International Labor Organization)**: Global labor standards

**Step 2: Check All Brands if Primary Doesn't Match**
```typescript
if (!laborViolationData.hasViolations && allBrands.length > 1) {
  for (let i = 1; i < allBrands.length; i++) {
    const testBrand = allBrands[i];
    const testProduct: Product = { ...product, brands: testBrand };
    const testData = checkLaborViolations(testProduct);
    if (testData.hasViolations) {
      laborViolationData = testData;
      break;
    }
  }
}
```

**Step 3: Apply 3-Tier Penalty System**
```typescript
if (laborViolationData.violationType === 'major') {
  laborViolationPenalty = 15; // -15
} else if (laborViolationData.violationType === 'moderate') {
  laborViolationPenalty = 8; // -8
} else if (laborViolationData.violationType === 'limited') {
  laborViolationPenalty = 4; // -4
}
```

**3-Tier System**:
- **Limited**: -4 (under-pay, over-work, min breaks, unpaid overtime, Walk Free low-risk)
- **Moderate**: -8 (unsafe conditions, Walk Free medium-risk)
- **Major**: -15 (child labor, slavery, Walk Free high-risk)

**Step 4: Mutually Exclusive Logic**
If product has certifications (indicating ethical product) and violation is from parent company, use brand overlay instead of direct penalty:
```typescript
const isParentLevelLaborViolation = laborViolationData.violations.some(v => 
  v.includes('parent') || 
  (hasProductCertifications && product.brand_owner && 
   v.toLowerCase().includes(product.brand_owner.toLowerCase()))
);

if (laborViolationData.hasViolations && !(hasProductCertifications && isParentLevelLaborViolation)) {
  // Apply direct penalty
} else {
  // Use brand overlay instead
}
```

---

### 2.4 Recall Data Integration

#### Overview
Recall data is fetched **before** TruScore calculation and integrated into the product. Ethics Pillar checks for active recalls within the last 3 months.

**Location**: `src/lib/truscoreEngine/pillars/ethicsPillar.ts` (lines 434-529)

#### Step-by-Step Process

**Step 1: Check for Active Recalls**
```typescript
if (product.recalls && Array.isArray(product.recalls) && product.recalls.length > 0) {
  const now = Date.now();
  const threeMonthsAgo = now - (3 * 30 * 24 * 60 * 60 * 1000);
  
  const recentRecalls = product.recalls.filter(recall => {
    if (!recall.isActive) return false;
    const recallDate = new Date(recall.recallDate).getTime();
    return recallDate >= threeMonthsAgo;
  });
}
```

**Recall Sources**:
- **FDA Food Recalls**: US food safety recalls
- **CFIA Recalls**: Canadian food recalls
- **UK FSA Recalls**: UK food safety recalls
- **RASFF Alerts**: European food safety alerts
- **Comprehensive US Recalls**: Multi-agency US recalls

**Step 2: Determine Highest Severity**
```typescript
let highestPriority = 0; // 0=Unknown, 1=Class III, 2=Class II, 3=Class I
let highestSeverity: 'Class I' | 'Class II' | 'Class III' | 'Unknown' = 'Unknown';

for (const recall of recentRecalls) {
  const classification = recall.classification || 'Unknown';
  let priority = 0;
  if (classification === 'Class I') priority = 3;
  else if (classification === 'Class II') priority = 2;
  else if (classification === 'Class III') priority = 1;
  
  if (priority > highestPriority) {
    highestPriority = priority;
    highestSeverity = classification;
  }
}
```

**Step 3: Apply 3-Tier Penalty**
```typescript
if (highestSeverity === 'Class I') {
  recallPenalty = 15; // -15
} else if (highestSeverity === 'Class II') {
  recallPenalty = 8; // -8
} else if (highestSeverity === 'Class III') {
  recallPenalty = 4; // -4
}
```

**3-Tier System**:
- **Class I**: -15 (serious health hazard, death possible)
- **Class II**: -8 (temporary health hazard, reversible)
- **Class III**: -4 (violation unlikely to cause health problems)

**Step 4: Universal Application**
Recalls are **universal** (apply regardless of country) and **time-bound** (only within last 3 months).

---

## 3. Enhancement Databases for Ethics Pillar Scoring

### 3.1 Brand Database Integration

#### Overview
The brand database is a **local in-memory database** that contains:
- BBFAW tier data (top 150 food companies)
- Labor violation history
- Recall history
- Parent company relationships
- Certification data

**Location**: `src/data/brandDatabase.ts`

#### How Brand Database Provides Ethics Data

**1. BBFAW Tier Data**:
- **Coverage**: Top 150 food companies globally
- **Format**: Tier number (1-6, E, F)
- **Lookup**: By brand name (fuzzy matching)
- **Usage**: Direct tier-based adjustment (+4 to -7)

**2. Labor Violation Data**:
- **Sources**: DOL, Walk Free, Oxfam, ILO
- **Format**: Violation type (limited/moderate/major) + sources
- **Lookup**: By brand name (fuzzy matching)
- **Usage**: 3-tier penalty system (-4/-8/-15)

**3. Recall History**:
- **Format**: Boolean flag (has recall history)
- **Lookup**: By brand name
- **Usage**: Brand overlay penalty (moderate severity, -8)

**4. Parent Company Data**:
- **Format**: Parent company name
- **Lookup**: By brand name
- **Usage**: Brand overlay penalties when parent has violations but product doesn't

#### Brand Database Lookup Process

**Step 1: Fuzzy Brand Matching**
```typescript
const brandMatches = matchBrands(product, 0.75);
const bestBrandMatch = brandMatches[0];
const brandData = bestBrandMatch?.matchedData;
```

**Step 2: Extract Parent Companies**
```typescript
const parentCompanies = getParentCompanies(product, 0.75);
const parentCompany = parentCompanies[0] || brandData?.parentCompany || product.brand_owner;
```

**Step 3: Lookup Ethics Data**
- Check BBFAW tier for brand and parent
- Check labor violations for brand and parent
- Check recall history for brand and parent

---

### 3.2 Recall Services Integration

#### Overview
Recall services fetch active recalls from multiple government agencies and integrate them into the product before TruScore calculation.

**Location**: `src/services/productService.ts` (recall fetching happens before TruScore calculation)

#### Recall Service Sources

**1. FDA Food Recalls** (`src/services/fdaRecallService.ts`):
- **Coverage**: US food products
- **API**: FDA Food Recall API
- **Classification**: Class I, II, III
- **Format**: Unified recall format

**2. CFIA Recalls** (`src/services/cfiaRecallService.ts`):
- **Coverage**: Canadian food products
- **API**: CFIA Recall API
- **Classification**: Class I, II, III
- **Format**: Unified recall format

**3. UK FSA Recalls** (`src/services/ukFsaRecallService.ts`):
- **Coverage**: UK food products
- **API**: UK FSA Recall API
- **Classification**: Class I, II, III
- **Format**: Unified recall format

**4. RASFF Alerts** (`src/services/rasffService.ts`):
- **Coverage**: European food products
- **API**: RASFF Alert System
- **Classification**: Alert, Information, Border Rejection
- **Format**: Unified recall format

**5. Comprehensive US Recalls** (`src/services/recallsGovService.ts`):
- **Coverage**: Multi-agency US recalls (FDA, USDA, CPSC)
- **API**: Recalls.gov API
- **Classification**: Various (mapped to Class I/II/III)
- **Format**: Unified recall format

#### Recall Integration Process

**Step 1: Fetch Recalls (Before TruScore Calculation)**
```typescript
// In productService.ts - recalls are fetched before TruScore
const recalls = await checkComprehensiveUSRecalls(barcode, productName, brand);
product.recalls = recalls;
```

**Step 2: Unified Recall Format**
All recalls are converted to a unified format:
```typescript
interface UnifiedRecall {
  recallDate: string;
  classification: 'Class I' | 'Class II' | 'Class III' | 'Unknown';
  isActive: boolean;
  reason: string;
  source: string; // 'FDA', 'CFIA', 'UK FSA', 'RASFF', etc.
}
```

**Step 3: Ethics Pillar Processing**
Ethics Pillar filters for active recalls within last 3 months and applies penalties based on highest severity.

---

### 3.3 How Enhancement Databases Contribute to Ethics Pillar

#### Overview
Enhancement databases contribute to Ethics Pillar through **data merging** and **brand database lookups** rather than direct scoring. The merged certification data and brand lookups enable more accurate Ethics Pillar scores.

#### Contribution Mechanisms

**1. Certification Data Merging**

When multiple databases provide certification data:
- **Union merging** collects all unique certifications
- **Higher-weight sources** contribute more certifications
- **Result**: More complete certification list → Higher certification bonus (up to +15)

**Example**:
- OFF provides: Fairtrade, Organic
- USDA provides: USDA Organic
- **Merged**: Fairtrade, Organic, USDA Organic
- **Ethics Pillar**: Detects all 3 → Certification bonus = +8 (Fairtrade) + +7 (Organic) = +15 (capped)

**2. Brand Database Lookups**

Brand database enables:
- **BBFAW tier scoring**: Animal cruelty adjustments (+4 to -7)
- **Labor violation penalties**: 3-tier system (-4/-8/-15)
- **Brand overlay penalties**: Accountability for parent company violations (-4/-8/-15)
- **Recall penalties**: 3-tier system (-4/-8/-15)

**3. Data Completeness Scoring**

Products with more complete Ethics data score higher in base selection:
- **Labels/certifications**: 15 points (if present)
- **Certifications array**: 10 points (if present)
- **Result**: Higher completeness → Better base product selection → More accurate merging

**4. Source Priority in Merging**

Enhancement databases with high source weights (0.50 for government databases) contribute more to merged certification data:

**Example**:
- OFF (weight 0.45): [Fairtrade, Organic]
- USDA (weight 0.50): [USDA Organic, Rainforest Alliance]
- Normalized weights: OFF = 0.474, USDA = 0.526
- **Merged**: [Fairtrade, Organic, USDA Organic, Rainforest Alliance]
  - All certifications included (union)
  - USDA certifications processed first (higher weight)

**5. Same Logic for Other Enhancement Databases**

The same merging logic applies to **all enhancement databases**:

**High Priority (0.30-0.50)**:
- **Open Food Facts** (0.45): Primary source for certifications (labels_tags)
- **USDA** (0.50): May provide certification data
- **Health Canada** (0.50): May provide certification data
- **UK FSA** (0.50): May provide certification data

**Medium Priority (0.20-0.35)**:
- **Spoonacular** (0.30): May provide certification data
- **FoodRepo** (0.35): May provide certification data

**All enhancement databases**:
1. Provide certification data that gets merged using union operation
2. Contribute to data completeness scoring
3. Improve base product selection
4. Enable more accurate Ethics Pillar scores through better certification data

#### Summary: Enhancement Database Contribution Flow

```
1. Query Enhancement Databases (OFF, USDA, etc.)
   ↓
2. Extract Certifications and Labels
   ↓
3. Merge Certifications (Union with Priority)
   - Higher weight sources processed first
   - All unique certifications included
   ↓
4. Merge Labels Tags (Union)
   - All unique labels included
   ↓
5. Brand Database Lookup
   - BBFAW tier data
   - Labor violation data
   - Recall history
   - Parent company data
   ↓
6. Ethics Pillar Scoring
   - Certification bonuses (from merged labels_tags)
   - BBFAW adjustments (from brand database)
   - Labor violation penalties (from brand database)
   - Recall penalties (from recall services)
   - Brand overlay penalties (from brand database)
   ↓
7. Result: More accurate Ethics Pillar score
```

---

## Conclusion

The Data Merging and Product Enhancement workflows ensure that Ethics Pillar scoring benefits from the **best available certification and brand data** across multiple databases:

1. **Source weights** prioritize trusted sources (government databases, Open Food Facts)
2. **Union merging** creates comprehensive certification lists from multiple sources
3. **Brand database lookups** enable BBFAW tier scoring, labor violation penalties, and brand overlay penalties
4. **Recall services** provide active recall data for penalty application

The result is **more accurate and complete Ethics Pillar scores** that reflect:
- All certifications from all sources (up to +15 bonus)
- BBFAW tier-based animal cruelty scoring (only for top 150 companies)
- Labor violation penalties from multiple sources (3-tier system)
- Active recall penalties (3-tier system, 3-month window)
- Brand overlay penalties for parent company violations (mutually exclusive)

