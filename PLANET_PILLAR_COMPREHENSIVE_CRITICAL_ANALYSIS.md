# PLANET Pillar - Comprehensive Critical Analysis

**Date:** January 2025  
**Purpose:** Compare existing implementation with new specification from `PLANET Pillar.xlsx`  
**Status:** Pre-Implementation Analysis

---

## Executive Summary

This document provides a comprehensive analysis of the current PLANET Pillar implementation compared to the new specification. The analysis identifies alignment, mismatches, missing features, data gaps, and implementation recommendations.

**Key Findings:**
- ✅ **Base Score (15):** Fully aligned
- ✅ **Eco-Score mapping:** Fully aligned (A=+10, B=+5, C=0, D=-5, E=-10)
- ⚠️ **Palm Oil penalties:** Partially aligned (needs adjustment for RSPO=0 and brand overlay)
- ⚠️ **Packaging:** Partially aligned (missing eco-cost material penalty)
- ❌ **Non-Animal Farming:** **COMPLETELY MISSING** (new requirement)
- ⚠️ **Eco-Score CSV fallback:** Missing (high carbon CSV lookup)
- ✅ **Minimum floor (0):** Fully aligned

---

## 1. Current Implementation Analysis

### 1.1 Architecture Overview

**File:** `src/lib/truscoreEngine/pillars/planetPillar.ts`

**Current Logic:**
1. **Base Score:** Always starts at 15
2. **Eco-Score Adjustment:** Maps grade to adjustment from base 15
3. **Palm Oil Penalty:** -8 (non-certified) or -5 (certified sustainable)
4. **Recyclable Packaging Bonus:** +5 (all) or +2 (some)
5. **Final Cap:** 0-25

**Integration Points:**
- Called from `src/lib/truscoreEngine/index.ts` (line 104)
- Uses `product.ecoscore_grade` from Open Food Facts
- Uses `product.palm_oil_analysis` (enhanced with WWF data)
- Uses `product.packagings` with `getLocalRecyclabilityStatus()`

**Data Sources:**
- **Eco-Score:** Open Food Facts API (`ecoscore_grade`)
- **Palm Oil:** Open Food Facts + WWF enhancement (`enhancePalmOilWithWWF`)
- **Packaging:** Open Food Facts + local recyclability checker (`packagingRecyclability.ts`)

---

## 2. New Specification Analysis

### 2.1 Specification Breakdown

From `PLANET Pillar.xlsx`:

| Data Element | Current | New Spec | Status |
|-------------|---------|----------|--------|
| **Base Score** | 15 | 15 | ✅ Aligned |
| **Eco-Score Grade** | A=+10, B=+5, C=0, D=-5, E=-10 | A=+10, B=+5, C=0, D=-5, E=-10 | ✅ Aligned |
| **Eco-Score CSV Fallback** | ❌ Missing | High CSV carbon = -5 if OFF missing | ❌ Missing |
| **Palm/Deforestation** | -8 (non-cert) or -5 (cert) | -8 (non-sust), 0 (RSPO cert), -5 (brand/parent low WWF/RSPO overlay) | ⚠️ Partial |
| **Packaging** | +5 (all) or +2 (some) | +5 (all), +2 (some), -5 (high eco-cost material) | ⚠️ Partial |
| **Non-Animal Farming** | ❌ Missing | -5 (high-impact), +3 (low-impact), -3 (brand/parent high-impact overlay) | ❌ Missing |
| **Minimum Floor** | 0 | 0 | ✅ Aligned |

---

## 3. Detailed Comparison

### 3.1 Base Score

**Current Implementation:**
```typescript
let score = 15; // Base score (always 15)
const base = 15;
```

**New Specification:**
- Base Score: 15 (uniform)
- Rationale: "Slightly positive neutral; assumes eco until bad"
- Decision Tree: "1. Always starting point; adjustments added/subtracted"

**Analysis:** ✅ **FULLY ALIGNED**

No changes needed.

---

### 3.2 Eco-Score Grade

**Current Implementation:**
```typescript
const gradeMapping: Record<string, number> = { a: 25, b: 20, c: 15, d: 10, e: 5 };
ecoscoreValue = gradeMapping[es] || 15;
const adjustment = ecoscoreValue - 15; // Adjustment from base 15
```

**Resulting Adjustments:**
- A: +10 (25 - 15)
- B: +5 (20 - 15)
- C: 0 (15 - 15)
- D: -5 (10 - 15)
- E: -10 (5 - 15)

**New Specification:**
- A=+10, B=+5, C=0, D=-5, E=-10 (adj base, direct map)
- **NEW:** High CSV carbon = -5 if OFF missing
- Data Sources: Country/Global OFF + Agribalyse/RIVM/UK Food/Exiobase/Ember/Eaternity CSVs
- Decision Tree: "1. Country OFF > 2. Global OFF; overlay CSV lookups if missing"

**Analysis:** ⚠️ **PARTIALLY ALIGNED**

**Issues:**
1. ✅ Grade mapping is correct
2. ❌ **Missing CSV fallback:** If Eco-Score not available from OFF, should check CSV databases (Exiobase, Agribalyse, etc.) for carbon factors
3. ❌ **Missing CSV integration:** No code to query carbon factor CSVs when `ecoscore_grade` is missing

**Recommendation:**
- Implement CSV carbon factor lookup as fallback
- Priority: Medium (improves coverage but Eco-Score from OFF is primary)

---

### 3.3 Palm Oil / Deforestation

**Current Implementation:**
```typescript
if (containsPalmOil && !isPalmOilFree) {
  if (isCertifiedSustainable) {
    palmOilPenalty = 5;  // Certified sustainable
  } else {
    palmOilPenalty = 8;  // Non-certified
  }
  score -= palmOilPenalty;
}
```

**Current Penalties:**
- Non-certified: -8
- Certified sustainable: -5

**New Specification:**
- Non-sust palm: -8
- Sustainable/cert RSPO: **0** (neutral, not -5)
- Brand/parent low WWF/RSPO: -5 overlay (even on clean products - accountability)
- Decision Tree: "1. Country OFF > 2. Global OFF; deduct if flagged without sustainable tag; neutral 0 if RSPO cert or OFF sustainable tag; overlay WWF/RSPO CSV lookup on brands_tags (parent accountable)"

**Analysis:** ⚠️ **PARTIALLY ALIGNED**

**Issues:**
1. ❌ **RSPO certified should be 0, not -5:** Current code penalizes certified sustainable palm oil with -5, but spec says it should be neutral (0)
2. ⚠️ **Brand/parent overlay missing:** Spec requires -5 penalty for brand/parent with low WWF/RSPO score, even if product itself is clean (accountability)
3. ✅ WWF enhancement exists but doesn't apply brand overlay penalty

**Current WWF Enhancement:**
- File: `src/services/enhancements/wwfPalmOilEnhancement.ts`
- Sets `isCertifiedSustainable = true` for certified brands
- Updates `palmOilAnalysis.score` to -5 for certified
- **Problem:** Should be 0 for certified, not -5

**Recommendation:**
1. **Immediate Fix:** Change certified sustainable penalty from -5 to 0
2. **New Feature:** Implement brand/parent overlay penalty (-5 for low WWF/RSPO brands, even on clean products)
3. Priority: **HIGH** (core logic mismatch)

---

### 3.4 Packaging

**Current Implementation:**
```typescript
if (recyclabilityStatus.isRecyclable) {
  if (recyclabilityStatus.recyclableItems.length === packagings.length) {
    recyclableBonus = 5;  // All recyclable
  } else if (recyclabilityStatus.recyclableItems.length > 0) {
    recyclableBonus = 2;  // Some recyclable
  }
  score += recyclableBonus;
}
```

**Current Bonuses:**
- All recyclable: +5
- Some recyclable: +2

**New Specification:**
- Full recycle (local laws): +5
- Partial: +2
- **NEW:** High eco-cost material: -5
- Data Sources: Country/Global OFF + Idemat/ECR Guides/ReCoRe/Recycling Partnership CSVs
- Decision Tree: "1. Country OFF > 2. Global OFF; bonus if match recycle (local geo CSV lookup on user location); deduct if high Idemat CSV eco-cost"

**Analysis:** ⚠️ **PARTIALLY ALIGNED**

**Issues:**
1. ✅ Recyclable bonuses are correct (+5 all, +2 some)
2. ❌ **Missing eco-cost material penalty:** No code to check Idemat CSV for high eco-cost materials and apply -5 penalty
3. ✅ Local recyclability checking exists (`getLocalRecyclabilityStatus`)

**Recommendation:**
- Implement Idemat CSV lookup for eco-cost materials
- Apply -5 penalty for high eco-cost materials
- Priority: Medium (adds nuance but recyclability bonus is primary)

---

### 3.5 Non-Animal Farming ⚠️ **NEW REQUIREMENT**

**Current Implementation:**
❌ **COMPLETELY MISSING**

**New Specification:**
- High-water/carbon/land/crop treatment (pesticides/herbicides residue): -5
- Low-impact: +3
- Brand/parent high-impact: -3 overlay (accountability)
- Data Sources: FAO FAOSTAT + Idemat + EWG Dirty Dozen/USDA PDP CSVs
- Decision Tree: "1. Country OFF > 2. Global OFF; deduct if high FAO/Idemat/EWG/USDA CSV impact on origins_tags; overlay brand/parent if low"
- **Important Note:** "Deduct eco-only (soil/biodiversity loss), not human health (gut/cancer = Body)"

**Analysis:** ❌ **COMPLETELY MISSING**

**Issues:**
1. ❌ **No implementation exists:** This is a completely new feature
2. ❌ **No data sources integrated:** FAO, Idemat, EWG Dirty Dozen, USDA PDP CSVs not queried
3. ❌ **No origins_tags analysis:** No code to check crop origins against farming impact databases
4. ❌ **No brand/parent overlay:** No accountability penalty for high-impact brands

**Data Requirements:**
- **FAO FAOSTAT:** Water usage, carbon footprint, land use by crop/country
- **Idemat:** Environmental impact factors
- **EWG Dirty Dozen:** High pesticide residue crops
- **USDA PDP:** Pesticide Data Program residue data
- **origins_tags:** Product origin data from OFF

**Recommendation:**
- **Priority: HIGH** (new requirement, significant impact on scoring)
- Implement in phases:
  1. **Phase 1:** Basic origins_tags checking against EWG Dirty Dozen (simplest)
  2. **Phase 2:** Add FAO/Idemat/USDA CSV lookups
  3. **Phase 3:** Add brand/parent overlay penalty

---

### 3.6 Minimum Floor

**Current Implementation:**
```typescript
score = Math.max(0, Math.min(25, Math.round(score)));
```

**New Specification:**
- Min 0 (floor after all adjustments)
- Rationale: "Allows wake-up viral on zero scores for bad deducts"

**Analysis:** ✅ **FULLY ALIGNED**

No changes needed.

---

## 4. Data Source Analysis

### 4.1 Current Data Sources

| Data Source | Status | Integration | Notes |
|------------|--------|-------------|-------|
| **Open Food Facts (Eco-Score)** | ✅ Integrated | `product.ecoscore_grade` | Primary source |
| **WWF Palm Oil Scorecard** | ✅ Integrated | `enhancePalmOilWithWWF()` | Hardcoded brand list |
| **Local Recyclability** | ✅ Integrated | `getLocalRecyclabilityStatus()` | Country-specific rules |
| **Agribalyse** | ⚠️ Partial | `ecoscore_data.agribalyse` | Extracted but not used for scoring |

### 4.2 Missing Data Sources (from Spec)

| Data Source | Required For | Status | Priority |
|------------|--------------|--------|----------|
| **Agribalyse CSV** | Eco-Score fallback | ❌ Missing | Medium |
| **RIVM CSV** | Eco-Score fallback | ❌ Missing | Medium |
| **UK Food CSV** | Eco-Score fallback | ❌ Missing | Medium |
| **Exiobase CSV** | Eco-Score fallback | ❌ Missing | Medium |
| **Ember CSV** | Eco-Score fallback | ❌ Missing | Medium |
| **Eaternity CSV** | Eco-Score fallback | ❌ Missing | Medium |
| **RSPO CSV** | Palm oil certification | ❌ Missing | High |
| **Idemat CSV** | Packaging eco-cost | ❌ Missing | Medium |
| **ECR Guides CSV** | Packaging recyclability | ❌ Missing | Low |
| **ReCoRe CSV** | Packaging recyclability | ❌ Missing | Low |
| **Recycling Partnership CSV** | Packaging recyclability | ❌ Missing | Low |
| **FAO FAOSTAT CSV** | Non-Animal Farming | ❌ Missing | High |
| **EWG Dirty Dozen CSV** | Non-Animal Farming | ❌ Missing | High |
| **USDA PDP CSV** | Non-Animal Farming | ❌ Missing | High |

**Analysis:**
- **13 missing data sources** identified
- Most are CSV databases that need to be integrated
- Priority: Focus on high-priority sources first (RSPO, FAO, EWG, USDA)

---

## 5. Architecture Considerations

### 5.1 Current Architecture

**Strengths:**
- ✅ Modular pillar system (easy to modify)
- ✅ Clear separation of concerns
- ✅ Good integration with product data model
- ✅ WWF enhancement already exists

**Weaknesses:**
- ❌ No CSV database integration layer
- ❌ No brand/parent overlay system
- ❌ Limited fallback mechanisms
- ❌ No origins_tags analysis

### 5.2 Required Architecture Changes

**1. CSV Database Integration Layer**
- Create a new service: `src/services/csvDatabases/`
- Implement CSV loaders for each database
- Create lookup functions (e.g., `lookupCarbonFactor()`, `lookupFarmingImpact()`)

**2. Brand/Parent Overlay System**
- Extract brand/parent from `product.brands_tags` or `product.brand_owner`
- Create overlay penalty system (applies even to clean products)
- Integrate with WWF/RSPO scorecards

**3. Origins Analysis System**
- Parse `product.origins_tags` for crop/country information
- Match against farming impact databases
- Apply penalties based on high-impact origins

**4. Enhanced Fallback System**
- If Eco-Score missing from OFF, try CSV carbon factor lookup
- If palm oil cert missing, try RSPO CSV lookup
- If packaging data incomplete, try Idemat CSV lookup

---

## 6. Implementation Complexity Assessment

### 6.1 Low Complexity (Quick Wins)

1. **Fix RSPO certified penalty (0 instead of -5)**
   - **Effort:** 1-2 hours
   - **Files:** `planetPillar.ts`, `wwfPalmOilEnhancement.ts`
   - **Risk:** Low

2. **Add minimum floor documentation**
   - **Effort:** 30 minutes
   - **Files:** Comments/documentation
   - **Risk:** None

### 6.2 Medium Complexity

1. **Implement packaging eco-cost penalty**
   - **Effort:** 4-8 hours
   - **Files:** New CSV loader, `planetPillar.ts`
   - **Risk:** Medium (requires Idemat CSV integration)

2. **Implement Eco-Score CSV fallback**
   - **Effort:** 6-12 hours
   - **Files:** New CSV loader, `planetPillar.ts`
   - **Risk:** Medium (requires multiple CSV sources)

3. **Implement brand/parent overlay for palm oil**
   - **Effort:** 4-6 hours
   - **Files:** `planetPillar.ts`, `wwfPalmOilEnhancement.ts`
   - **Risk:** Medium (requires brand extraction logic)

### 6.3 High Complexity (Major Features)

1. **Implement Non-Animal Farming factor**
   - **Effort:** 20-40 hours
   - **Files:** New CSV loaders, new analysis service, `planetPillar.ts`
   - **Risk:** High (completely new feature, multiple data sources)

2. **Implement comprehensive CSV database layer**
   - **Effort:** 16-24 hours
   - **Files:** New service layer, multiple CSV loaders
   - **Risk:** Medium (infrastructure work)

---

## 7. Critical Questions for Stakeholders

### 7.1 Before Implementation

#### 1. Non-Animal Farming Factor

- **Q:** Is this a priority feature for MVP?
- **Q:** Do we have access to FAO/Idemat/EWG/USDA CSV data, or do we need to research/manually add?
- **Q:** Should this be MVP or future enhancement?
- **Recommendation:** Phase 2 feature (significant complexity, but important for completeness)

#### 2. CSV Database Integration

- **Q:** Should we implement all CSV sources at once, or prioritize specific ones?
- **Q:** Do we have the CSV files, or do we need to source them?
- **Q:** What is the timeline for CSV database enhancement?
- **Recommendation:** Phased approach - start with high-priority sources (RSPO, EWG Dirty Dozen, FAO)

#### 3. Brand/Parent Overlay

- **Q:** Should brand/parent accountability penalties apply even to clean products?
- **Q:** How do we extract brand/parent from product data reliably?
- **Q:** Should this be MVP or future enhancement?
- **Recommendation:** MVP feature (adds accountability, moderate complexity)

#### 4. RSPO Certified Penalty

- **Q:** Should RSPO certified palm oil be neutral (0) or still penalized (-5)?
- **Q:** Spec says 0, but current code uses -5. Which is correct?
- **Recommendation:** **IMMEDIATE FIX** - Change to 0 per spec (easy fix, clear rationale)

#### 5. Packaging Eco-Cost

- **Q:** Is Idemat CSV data available?
- **Q:** Should this be MVP or future enhancement?
- **Recommendation:** Phase 2 feature (adds nuance, but recyclability bonus is primary)

---

## 8. Risk Assessment

### 8.1 Implementation Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| **CSV data availability** | High | Verify data sources before implementation |
| **Performance impact** | Medium | Implement caching for CSV lookups |
| **Data accuracy** | Medium | Validate CSV data against known sources |
| **Brand extraction accuracy** | Medium | Use multiple extraction methods, fallback to manual |
| **Origins parsing complexity** | High | Start with simple pattern matching, enhance iteratively |

### 8.2 Data Quality Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Missing CSV data** | High | Implement graceful fallbacks |
| **Outdated CSV data** | Medium | Document data freshness, plan update mechanism |
| **Inconsistent data formats** | Medium | Normalize data during CSV loading |

---

## 9. Recommendations

### 9.1 Immediate Actions (Phase 1)

1. ✅ **Fix RSPO certified penalty:** Change from -5 to 0
   - **Effort:** 1-2 hours
   - **Priority:** HIGH
   - **Risk:** Low

2. ✅ **Add brand/parent overlay for palm oil:** -5 penalty for low WWF/RSPO brands
   - **Effort:** 4-6 hours
   - **Priority:** HIGH
   - **Risk:** Medium

### 9.2 Short-Term Enhancements (Phase 2)

1. ⚠️ **Implement Eco-Score CSV fallback:** High carbon CSV = -5 if OFF missing
   - **Effort:** 6-12 hours
   - **Priority:** MEDIUM
   - **Risk:** Medium

2. ⚠️ **Implement packaging eco-cost penalty:** -5 for high eco-cost materials
   - **Effort:** 4-8 hours
   - **Priority:** MEDIUM
   - **Risk:** Medium

### 9.3 Medium-Term Features (Phase 3)

1. ❌ **Implement Non-Animal Farming factor:** Complete new feature
   - **Effort:** 20-40 hours
   - **Priority:** HIGH (new requirement)
   - **Risk:** High

2. ⚠️ **Implement comprehensive CSV database layer:** Infrastructure work
   - **Effort:** 16-24 hours
   - **Priority:** MEDIUM
   - **Risk:** Medium

### 9.4 Long-Term Enhancements (Phase 4)

1. ⚠️ **Expand CSV data sources:** Add remaining CSV databases
   - **Effort:** Variable
   - **Priority:** LOW
   - **Risk:** Low

---

## 10. Summary

### 10.1 Alignment Status

| Component | Status | Action Required |
|-----------|--------|-----------------|
| Base Score (15) | ✅ Aligned | None |
| Eco-Score mapping | ✅ Aligned | None |
| Eco-Score CSV fallback | ❌ Missing | Implement |
| Palm Oil (non-certified) | ✅ Aligned | None |
| Palm Oil (RSPO certified) | ❌ Mismatch | Fix (0 instead of -5) |
| Palm Oil (brand overlay) | ❌ Missing | Implement |
| Packaging (recyclable) | ✅ Aligned | None |
| Packaging (eco-cost) | ❌ Missing | Implement |
| Non-Animal Farming | ❌ Missing | **NEW FEATURE** |
| Minimum floor (0) | ✅ Aligned | None |

### 10.2 Critical Issues

1. **RSPO certified penalty mismatch:** Should be 0, not -5
2. **Non-Animal Farming completely missing:** New requirement, high complexity
3. **Brand/parent overlay missing:** Accountability feature
4. **CSV fallback systems missing:** Multiple data sources not integrated

### 10.3 Implementation Priority

**Phase 1 (Immediate):**
- Fix RSPO certified penalty (0 instead of -5)
- Implement brand/parent overlay for palm oil

**Phase 2 (Short-term):**
- Implement Eco-Score CSV fallback
- Implement packaging eco-cost penalty

**Phase 3 (Medium-term):**
- Implement Non-Animal Farming factor (complete new feature)

**Phase 4 (Long-term):**
- Expand CSV data sources
- Enhance origins parsing

---

## 11. Next Steps

1. **Review this analysis** with stakeholders
2. **Answer critical questions** (Section 7)
3. **Prioritize implementation phases** based on business needs
4. **Source CSV data files** for required databases
5. **Create detailed implementation plan** for each phase
6. **Begin Phase 1 implementation** (quick wins)

---

**Document Status:** ✅ Complete - Ready for stakeholder review

**Last Updated:** January 2025

