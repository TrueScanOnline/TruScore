# IARC Hybrid Implementation Guide

**Purpose:** Step-by-step guide for implementing IARC hybrid system in BODY Pillar  
**Date:** January 2025  
**Status:** Implementation Plan

---

## Overview

This guide explains how to:
1. **Store IARC data** in the additive database (no external API needed)
2. **Query IARC data** from the app's internal database
3. **Implement hybrid approach** (IARC when available, safety rating fallback)
4. **Integrate into BODY Pillar** scoring logic

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Product Scan                              │
│              (has additives_tags array)                       │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              BODY Pillar Calculation                         │
│         (bodyPillar.ts - calculateBodyPillar)                │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       │ For each additive tag
                       ▼
┌─────────────────────────────────────────────────────────────┐
│          getAdditiveInfo(eNumber)                            │
│     Returns: AdditiveInfo with IARC + Safety Rating          │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ├──► Has IARC? ──► Use IARC penalty
                       │                    (Class 1=-10, 2A=-5, 2B=-3)
                       │
                       └──► No IARC? ──► Use Safety Rating penalty
                                          (avoid=-3, caution=-1.5, safe=-0.5)
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│         Calculate Total Penalty (cap at -15)                 │
│         Apply to base score (15)                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Step 1: Update AdditiveInfo Interface

**File:** `src/services/additiveDatabase.ts`

### Current Interface
```typescript
export interface AdditiveInfo {
  name: string;
  category: string;
  description: string;
  safety: 'safe' | 'caution' | 'avoid';
  uses?: string[];
  concerns?: string[];
  alternatives?: string;
}
```

### Updated Interface (Add IARC Field)
```typescript
export interface AdditiveInfo {
  name: string;
  category: string;
  description: string;
  safety: 'safe' | 'caution' | 'avoid';
  iarcGroup?: '1' | '2A' | '2B';  // NEW: IARC classification
  uses?: string[];
  concerns?: string[];
  alternatives?: string;
}
```

**Explanation:**
- `iarcGroup` is **optional** - only present for additives with IARC classifications
- Values: `'1'` (carcinogenic), `'2A'` (probably carcinogenic), `'2B'` (possibly carcinogenic)
- When `iarcGroup` is present, use IARC penalty; when absent, use safety rating

---

## Step 2: Add IARC Data to Database

**File:** `src/services/additiveDatabase.ts`

### Example: Adding IARC Data to Existing Additives

Since IARC doesn't have a structured database, we'll manually add IARC classifications for known carcinogenic additives. Here are examples:

```typescript
export const ADDITIVE_DATABASE: Record<string, AdditiveInfo> = {
  // Example 1: Additive with IARC Group 1 (carcinogenic)
  'e240': { 
    name: 'Formaldehyde', 
    category: 'Preservative', 
    description: 'Highly toxic preservative. Banned in most foods. May cause cancer.', 
    safety: 'avoid', 
    iarcGroup: '1',  // NEW: IARC Group 1
    concerns: ['Toxic', 'Carcinogen', 'Banned in foods'] 
  },
  
  // Example 2: Additive with IARC Group 2A (probably carcinogenic)
  'e249': { 
    name: 'Potassium Nitrite', 
    category: 'Preservative', 
    description: 'Prevents botulism in cured meats. May form carcinogenic nitrosamines when heated.', 
    safety: 'caution', 
    iarcGroup: '2A',  // NEW: IARC Group 2A
    concerns: ['May form nitrosamines (carcinogens)'], 
    uses: ['Cured meats', 'Bacon'] 
  },
  
  'e250': { 
    name: 'Sodium Nitrite', 
    category: 'Preservative', 
    description: 'Prevents botulism in cured meats. May form carcinogenic nitrosamines when heated.', 
    safety: 'caution', 
    iarcGroup: '2A',  // NEW: IARC Group 2A
    concerns: ['May form nitrosamines (carcinogens)'], 
    uses: ['Cured meats', 'Bacon', 'Hot dogs'] 
  },
  
  // Example 3: Additive with IARC Group 2B (possibly carcinogenic)
  'e320': { 
    name: 'BHA (Butylated Hydroxyanisole)', 
    category: 'Antioxidant', 
    description: 'Synthetic antioxidant. May be carcinogenic and cause allergic reactions.', 
    safety: 'caution', 
    iarcGroup: '2B',  // NEW: IARC Group 2B
    concerns: ['Potential carcinogen', 'Allergic reactions'] 
  },
  
  'e321': { 
    name: 'BHT (Butylated Hydroxytoluene)', 
    category: 'Antioxidant', 
    description: 'Synthetic antioxidant. May be carcinogenic and cause allergic reactions.', 
    safety: 'caution', 
    iarcGroup: '2B',  // NEW: IARC Group 2B
    concerns: ['Potential carcinogen', 'Allergic reactions'] 
  },
  
  // Example 4: Additive WITHOUT IARC (uses safety rating)
  'e102': { 
    name: 'Tartrazine', 
    category: 'Color', 
    description: 'Artificial yellow color. May cause allergic reactions.', 
    safety: 'caution', 
    // No iarcGroup - will use safety rating penalty
    concerns: ['Hyperactivity in children', 'Allergic reactions'] 
  },
  
  // ... rest of database
};
```

### Research Required: IARC Classifications

**To find IARC classifications for additives:**

1. **Visit IARC Monographs:** https://publications.iarc.who.int/
2. **Search for specific substances** (e.g., "sodium nitrite", "BHA", "formaldehyde")
3. **Check the classification** in the monograph summary
4. **Add to database** with appropriate `iarcGroup` value

**Estimated Work:**
- Research time: 2-3 days for ~20-30 known carcinogenic additives
- Most additives won't have IARC classifications (that's fine - use safety rating)

---

## Step 3: Create IARC Penalty Helper Function

**File:** `src/lib/truscoreEngine/pillars/bodyPillar.ts` (or create separate utility)

### New Function: Calculate Additive Penalty

```typescript
/**
 * Calculate penalty for a single additive using hybrid approach:
 * - If IARC classification exists, use IARC penalty
 * - Otherwise, use safety rating penalty
 * 
 * @param additiveInfo - Additive information from database
 * @param shouldAdjustAdditiveScoring - Whether to adjust for non-food products
 * @returns Penalty value (negative number)
 */
function calculateAdditivePenalty(
  additiveInfo: AdditiveInfo | null,
  shouldAdjustAdditiveScoring: boolean
): number {
  if (!additiveInfo) {
    // Unknown additive - default penalty
    return shouldAdjustAdditiveScoring ? -0.75 : -1.5;
  }
  
  // PRIORITY 1: Use IARC classification if available
  if (additiveInfo.iarcGroup) {
    switch (additiveInfo.iarcGroup) {
      case '1':
        return -10;  // IARC Group 1: Carcinogenic to humans
      case '2A':
        return -5;  // IARC Group 2A: Probably carcinogenic
      case '2B':
        return -3;  // IARC Group 2B: Possibly carcinogenic
      default:
        // Fallback to safety rating if invalid IARC group
        break;
    }
  }
  
  // PRIORITY 2: Use safety rating (fallback when no IARC)
  switch (additiveInfo.safety) {
    case 'avoid':
      return -3;
    case 'caution':
      return -1.5;
    case 'safe':
      return shouldAdjustAdditiveScoring ? 0 : -0.5;
    default:
      return -1.5;  // Unknown safety rating
  }
}
```

**Key Points:**
- **IARC takes priority** - if `iarcGroup` exists, use IARC penalty
- **Safety rating is fallback** - when no IARC, use existing safety rating system
- **Penalties match new spec:**
  - IARC Class 1 = -10
  - IARC Class 2A = -5
  - IARC Class 2B = -3
  - Safety: avoid = -3, caution = -1.5, safe = -0.5

---

## Step 4: Update BODY Pillar Calculation

**File:** `src/lib/truscoreEngine/pillars/bodyPillar.ts`

### Current Code (Lines 110-151)
```typescript
// Additive penalties
let additivePenalty = 0;
const userCountry = getUserCountryCode();
const productCategory = detectProductCategory(product);
const shouldAdjustAdditiveScoring = productCategory !== 'food';

if (product.additives_tags && product.additives_tags.length > 0) {
  for (const tag of product.additives_tags) {
    const eNumMatch = tag.toLowerCase().match(/^en:?(e\d+[a-z]?)$/);
    const eNum = eNumMatch ? eNumMatch[1] : tag.toLowerCase().replace(/^en:/, '');
    
    const additiveInfo = getAdditiveInfo(eNum);
    let basePenalty = 0;
    
    if (additiveInfo) {
      if (additiveInfo.safety === 'avoid') {
        basePenalty = 3;
      } else if (additiveInfo.safety === 'caution') {
        basePenalty = 1.5;
      } else if (additiveInfo.safety === 'safe') {
        basePenalty = shouldAdjustAdditiveScoring ? 0 : 0.5;
      } else {
        basePenalty = 1.5;
      }
    } else {
      basePenalty = shouldAdjustAdditiveScoring ? 0.75 : 1.5;
    }
    
    const countryPenalty = getCountrySpecificAdditivePenalty(eNum, userCountry);
    additivePenalty += basePenalty + countryPenalty;
  }
  
  const cappedPenalty = Math.min(additivePenalty, 15);
  if (cappedPenalty > 0) {
    adjustments.push({
      description: `${product.additives_tags.length} additive(s) (weighted by safety rating)`,
      value: -cappedPenalty,
      type: 'negative',
    });
    score -= cappedPenalty;
  }
}
```

### Updated Code (Using Hybrid Approach)
```typescript
// Additive penalties (Hybrid: IARC when available, safety rating fallback)
let additivePenalty = 0;
const userCountry = getUserCountryCode();
const productCategory = detectProductCategory(product);
const shouldAdjustAdditiveScoring = productCategory !== 'food';

// Track IARC vs safety rating usage for adjustment description
let iarcCount = 0;
let safetyRatingCount = 0;

if (product.additives_tags && product.additives_tags.length > 0) {
  for (const tag of product.additives_tags) {
    const eNumMatch = tag.toLowerCase().match(/^en:?(e\d+[a-z]?)$/);
    const eNum = eNumMatch ? eNumMatch[1] : tag.toLowerCase().replace(/^en:/, '');
    
    const additiveInfo = getAdditiveInfo(eNum);
    
    // Use hybrid approach: IARC if available, otherwise safety rating
    const basePenalty = Math.abs(calculateAdditivePenalty(additiveInfo, shouldAdjustAdditiveScoring));
    
    // Track which system was used
    if (additiveInfo?.iarcGroup) {
      iarcCount++;
    } else {
      safetyRatingCount++;
    }
    
    const countryPenalty = getCountrySpecificAdditivePenalty(eNum, userCountry);
    additivePenalty += basePenalty + countryPenalty;
  }
  
  // Cap total penalty at -15 (per new spec)
  const cappedPenalty = Math.min(additivePenalty, 15);
  if (cappedPenalty > 0) {
    // Build description based on which system was used
    let description = '';
    if (iarcCount > 0 && safetyRatingCount > 0) {
      description = `${product.additives_tags.length} additive(s) (${iarcCount} IARC-classified, ${safetyRatingCount} safety-rated)`;
    } else if (iarcCount > 0) {
      description = `${product.additives_tags.length} additive(s) (IARC-classified)`;
    } else {
      description = `${product.additives_tags.length} additive(s) (safety-rated)`;
    }
    
    adjustments.push({
      description,
      value: -cappedPenalty,
      type: 'negative',
    });
    score -= cappedPenalty;
  }
}
```

**Key Changes:**
1. **Uses `calculateAdditivePenalty()` helper** - implements hybrid logic
2. **Tracks IARC vs safety rating usage** - for better adjustment descriptions
3. **Maintains cap of -15** - per new specification
4. **Better descriptions** - shows which system was used

---

## Step 5: Update BodyPillarResult Details

**File:** `src/lib/truscoreEngine/pillars/bodyPillar.ts`

### Update Details Interface

```typescript
export interface BodyPillarResult {
  score: number;
  base: number;
  adjustments: Array<{
    description: string;
    value: number;
    type: 'positive' | 'negative' | 'neutral';
  }>;
  details: {
    hasNutriScore: boolean;
    nutriscoreGrade?: string;
    nutriscoreValue?: number;
    additivePenalty: number;
    iarcPenalty: number;        // NEW: IARC-specific penalty
    safetyRatingPenalty: number; // NEW: Safety rating penalty
    riskyTagsPenalty: number;
    irritantPenalty: number;
    fragrancePenalty: number;
    novaAdjustment: number;
  };
}
```

### Update Calculation to Track Separate Penalties

```typescript
// In calculateBodyPillar function
let iarcPenalty = 0;
let safetyRatingPenalty = 0;

// ... in additive loop ...
const basePenalty = Math.abs(calculateAdditivePenalty(additiveInfo, shouldAdjustAdditiveScoring));

if (additiveInfo?.iarcGroup) {
  iarcPenalty += basePenalty;
} else {
  safetyRatingPenalty += basePenalty;
}

// ... in return statement ...
details: {
  // ... existing fields ...
  additivePenalty: Math.min(additivePenalty, 15),
  iarcPenalty: Math.min(iarcPenalty, 15),
  safetyRatingPenalty: Math.min(safetyRatingPenalty, 15),
  // ... rest of fields ...
}
```

---

## Step 6: Testing

### Test Cases

**Test Case 1: Additive with IARC Group 1**
```typescript
// Product with E240 (Formaldehyde - IARC Group 1)
const product = {
  additives_tags: ['en:e240'],
  // ... other fields
};

// Expected:
// - IARC penalty: -10
// - Total additive penalty: -10 (capped at -15)
// - Description: "1 additive(s) (IARC-classified)"
```

**Test Case 2: Additive with IARC Group 2A**
```typescript
// Product with E250 (Sodium Nitrite - IARC Group 2A)
const product = {
  additives_tags: ['en:e250'],
  // ... other fields
};

// Expected:
// - IARC penalty: -5
// - Total additive penalty: -5
// - Description: "1 additive(s) (IARC-classified)"
```

**Test Case 3: Additive without IARC (uses safety rating)**
```typescript
// Product with E102 (Tartrazine - no IARC, safety: caution)
const product = {
  additives_tags: ['en:e102'],
  // ... other fields
};

// Expected:
// - Safety rating penalty: -1.5
// - Total additive penalty: -1.5
// - Description: "1 additive(s) (safety-rated)"
```

**Test Case 4: Mixed (IARC + Safety Rating)**
```typescript
// Product with E240 (IARC Group 1) and E102 (safety: caution)
const product = {
  additives_tags: ['en:e240', 'en:e102'],
  // ... other fields
};

// Expected:
// - IARC penalty: -10 (from E240)
// - Safety rating penalty: -1.5 (from E102)
// - Total additive penalty: -11.5 (capped at -15)
// - Description: "2 additive(s) (1 IARC-classified, 1 safety-rated)"
```

**Test Case 5: Multiple IARC additives (cap test)**
```typescript
// Product with 3 IARC Group 1 additives
const product = {
  additives_tags: ['en:e240', 'en:e240', 'en:e240'], // Hypothetical
  // ... other fields
};

// Expected:
// - IARC penalty: -30 (3 × -10)
// - Total additive penalty: -15 (capped)
// - Description: "3 additive(s) (IARC-classified)"
```

---

## Step 7: Implementation Checklist

### Phase 1: Database Updates
- [ ] Update `AdditiveInfo` interface to include `iarcGroup?: '1' | '2A' | '2B'`
- [ ] Research IARC classifications for known carcinogenic additives
- [ ] Add IARC data to ~20-30 known carcinogenic additives in database
- [ ] Verify database structure is correct

### Phase 2: Helper Function
- [ ] Create `calculateAdditivePenalty()` function
- [ ] Test function with IARC data
- [ ] Test function with safety rating fallback
- [ ] Test function with unknown additives

### Phase 3: BODY Pillar Integration
- [ ] Update `calculateBodyPillar()` to use hybrid approach
- [ ] Update penalty calculation loop
- [ ] Update adjustment descriptions
- [ ] Update `BodyPillarResult.details` interface
- [ ] Track separate IARC and safety rating penalties

### Phase 4: Testing
- [ ] Unit tests for `calculateAdditivePenalty()`
- [ ] Integration tests for BODY Pillar with IARC additives
- [ ] Integration tests for BODY Pillar with safety-rated additives
- [ ] Integration tests for mixed scenarios
- [ ] Test cap functionality (-15 maximum)
- [ ] Test with real product barcodes

### Phase 5: Documentation
- [ ] Update code comments
- [ ] Update BODY Pillar documentation
- [ ] Document IARC data sources
- [ ] Create guide for adding new IARC data

---

## Example: Complete Implementation

### File: `src/lib/truscoreEngine/pillars/bodyPillar.ts`

```typescript
import { Product } from '../../../types/product';
import { getAdditiveInfo, AdditiveInfo } from '../../../services/additiveDatabase';
import { getUserCountryCode } from '../../../utils/countryDetection';
import { getCountrySpecificAdditivePenalty } from '../../../services/countrySpecificRegulations';
import { detectProductCategory } from '../productCategoryDetection';
import { logger } from '../../../utils/logger';

// ... existing code ...

/**
 * Calculate penalty for a single additive using hybrid approach
 */
function calculateAdditivePenalty(
  additiveInfo: AdditiveInfo | null,
  shouldAdjustAdditiveScoring: boolean
): number {
  if (!additiveInfo) {
    return shouldAdjustAdditiveScoring ? -0.75 : -1.5;
  }
  
  // PRIORITY 1: Use IARC classification if available
  if (additiveInfo.iarcGroup) {
    switch (additiveInfo.iarcGroup) {
      case '1':
        return -10;
      case '2A':
        return -5;
      case '2B':
        return -3;
      default:
        break;
    }
  }
  
  // PRIORITY 2: Use safety rating (fallback when no IARC)
  switch (additiveInfo.safety) {
    case 'avoid':
      return -3;
    case 'caution':
      return -1.5;
    case 'safe':
      return shouldAdjustAdditiveScoring ? 0 : -0.5;
    default:
      return -1.5;
  }
}

export function calculateBodyPillar(product: Product): BodyPillarResult {
  // ... existing base score and Nutri-Score code ...
  
  // Additive penalties (Hybrid: IARC when available, safety rating fallback)
  let additivePenalty = 0;
  let iarcPenalty = 0;
  let safetyRatingPenalty = 0;
  const userCountry = getUserCountryCode();
  const productCategory = detectProductCategory(product);
  const shouldAdjustAdditiveScoring = productCategory !== 'food';
  
  let iarcCount = 0;
  let safetyRatingCount = 0;

  if (product.additives_tags && product.additives_tags.length > 0) {
    for (const tag of product.additives_tags) {
      const eNumMatch = tag.toLowerCase().match(/^en:?(e\d+[a-z]?)$/);
      const eNum = eNumMatch ? eNumMatch[1] : tag.toLowerCase().replace(/^en:/, '');
      
      const additiveInfo = getAdditiveInfo(eNum);
      const penalty = calculateAdditivePenalty(additiveInfo, shouldAdjustAdditiveScoring);
      const basePenalty = Math.abs(penalty);
      
      // Track which system was used
      if (additiveInfo?.iarcGroup) {
        iarcCount++;
        iarcPenalty += basePenalty;
      } else {
        safetyRatingCount++;
        safetyRatingPenalty += basePenalty;
      }
      
      const countryPenalty = getCountrySpecificAdditivePenalty(eNum, userCountry);
      additivePenalty += basePenalty + countryPenalty;
    }
    
    const cappedPenalty = Math.min(additivePenalty, 15);
    if (cappedPenalty > 0) {
      let description = '';
      if (iarcCount > 0 && safetyRatingCount > 0) {
        description = `${product.additives_tags.length} additive(s) (${iarcCount} IARC-classified, ${safetyRatingCount} safety-rated)`;
      } else if (iarcCount > 0) {
        description = `${product.additives_tags.length} additive(s) (IARC-classified)`;
      } else {
        description = `${product.additives_tags.length} additive(s) (safety-rated)`;
      }
      
      adjustments.push({
        description,
        value: -cappedPenalty,
        type: 'negative',
      });
      score -= cappedPenalty;
    }
  }
  
  // ... rest of existing code (risky tags, irritants, NOVA, etc.) ...
  
  return {
    score,
    base,
    adjustments,
    details: {
      hasNutriScore,
      nutriscoreGrade: product.nutriscore_grade,
      nutriscoreValue,
      additivePenalty: Math.min(additivePenalty, 15),
      iarcPenalty: Math.min(iarcPenalty, 15),
      safetyRatingPenalty: Math.min(safetyRatingPenalty, 15),
      riskyTagsPenalty,
      irritantPenalty,
      fragrancePenalty,
      novaAdjustment,
    },
  };
}
```

---

## Summary

### How IARC Data is Queried
- **No external API** - IARC data is stored in the app's internal `ADDITIVE_DATABASE`
- **Query method:** `getAdditiveInfo(eNumber)` returns `AdditiveInfo` with optional `iarcGroup` field
- **Data source:** Manually researched and added to database (2-3 days work)

### How Hybrid Approach Works
1. **Check for IARC:** If `additiveInfo.iarcGroup` exists, use IARC penalty
2. **Fallback to Safety Rating:** If no IARC, use existing `safety` field
3. **Priority:** IARC always takes precedence when available

### How It's Integrated into BODY Pillar
1. **Helper function:** `calculateAdditivePenalty()` implements hybrid logic
2. **Main calculation:** Loops through additives, uses helper for each
3. **Tracking:** Separately tracks IARC vs safety rating penalties
4. **Cap:** Total penalty capped at -15 (per new spec)
5. **Descriptions:** Shows which system was used in adjustment descriptions

### Benefits
- ✅ **Backward compatible** - existing safety rating system still works
- ✅ **Gradual enhancement** - can add IARC data incrementally
- ✅ **No breaking changes** - products without IARC data still score correctly
- ✅ **Matches new spec** - uses IARC when available, as specified
- ✅ **Transparent** - shows which system was used in descriptions

---

**Next Steps:**
1. Research and add IARC data for ~20-30 known carcinogenic additives
2. Implement helper function
3. Update BODY Pillar calculation
4. Test with real products
5. Document IARC data sources for future additions








