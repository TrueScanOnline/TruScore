# CARE Pillar - Executive Summary
## Quick Reference Guide for Implementation

**Date:** January 2025  
**Status:** Analysis Complete - Ready for Implementation

---

## 🎯 Key Findings

### Overall Alignment: ~60% aligned - **Significant enhancements required**

### Critical Issues (Must Fix)

1. **Labor Violations Detection** ❌ **NOT IMPLEMENTED**
   - **Spec:** Minor=-5, Major=-15, Brand overlay=-3
   - **Current:** Not implemented
   - **Impact:** Major ethical scoring gap

2. **Minor Animal Cruelty Violations** ⚠️ **MISSING**
   - **Spec:** Minor=-5 (in addition to major=-15)
   - **Current:** Only major violations (-15)
   - **Impact:** Missing nuanced scoring

3. **Brand/Parent Overlay** ❌ **NOT IMPLEMENTED**
   - **Spec:** -3 overlay for high-impact brands
   - **Current:** Not implemented
   - **Impact:** Missing brand accountability scoring

4. **Missing Certifications** ⚠️ **PARTIAL**
   - **Spec:** RSPO (+6), Leaping Bunny (+5)
   - **Current:** Not in implementation
   - **Impact:** Incomplete certification coverage

### Aligned Components ✅

- Base score (15) ✅
- Certification values (mostly) ✅
- Certification cap (+15) ✅
- Recalls penalty (-10, 12 months) ✅
- Minimum floor (0) ✅

---

## 📋 Implementation Checklist

### Phase 1: Critical Fixes (MVP) - **HIGH PRIORITY**

- [ ] **Implement Labor Violations Detection**
  - Add: Minor violations (-5) and major violations (-15)
  - Sources: DOL, Buycott, Open Corporates
  - File: `src/lib/truscoreEngine/pillars/carePillar.ts`
  - Complexity: Medium

- [ ] **Add Minor Animal Cruelty Violations**
  - Add: -5 penalty for minor animal cruelty
  - File: `src/lib/truscoreEngine/pillars/carePillar.ts`
  - Complexity: Low

- [ ] **Add Brand/Parent Overlay Penalty**
  - Add: -3 overlay for high-impact brands
  - Contexts: Animal cruelty, labor violations, recalls
  - File: `src/lib/truscoreEngine/pillars/carePillar.ts`
  - Complexity: Low

### Phase 2: Enhancements - **MEDIUM PRIORITY**

- [ ] **Add Missing Certifications**
  - Add: RSPO (+6) and Leaping Bunny (+5)
  - File: `src/lib/truscoreEngine/pillars/carePillar.ts`
  - Complexity: Low

- [ ] **Add Recall History Overlay**
  - Add: -3 overlay for brands with recall history
  - File: `src/lib/truscoreEngine/pillars/carePillar.ts`
  - Complexity: Low

- [ ] **Expand Recall Sources** (Optional)
  - Add: MHLW (Japan), CFS (HK), SFA (SG)
  - Complexity: Medium

### Phase 3: Future Enhancements - **LOW PRIORITY**

- [ ] **News/Sentiment Integration** (Future)
  - Add: X/Reuters news mentions (>10k last 6mo)
  - Complexity: High

---

## 🔍 Code Changes Summary

### Change 1: Labor Violations Detection

**Add:**
```typescript
// Labor violations detection
let laborViolationPenalty = 0;
const hasLaborViolations = checkLaborViolations(product); // New function
if (hasLaborViolations.major) {
  laborViolationPenalty = 15; // -15
} else if (hasLaborViolations.minor) {
  laborViolationPenalty = 5; // -5
}

if (laborViolationPenalty > 0) {
  score -= laborViolationPenalty;
}
```

### Change 2: Minor Animal Cruelty

**Add:**
```typescript
// Animal cruelty (extend existing)
const animalCruelty = checkAnimalCruelty(product); // Extended function
if (animalCruelty.major) {
  cruelParentPenalty = 15; // -15
} else if (animalCruelty.minor) {
  cruelParentPenalty = 5; // -5 (NEW)
}
```

### Change 3: Brand/Parent Overlay

**Add:**
```typescript
// Brand/parent overlay (-3 for high-impact brands)
const brandOverlay = checkBrandOverlay(product, {
  animalCruelty: hasAnimalCruelty,
  laborViolations: hasLaborViolations,
  recallHistory: hasRecallHistory,
});

if (brandOverlay > 0) {
  score -= 3; // -3 overlay
}
```

### Change 4: Missing Certifications

**Add:**
```typescript
// RSPO certification
if (hasLabel('rspo') || hasLabel('roundtable-on-sustainable-palm-oil')) {
  certificationBonus += 6;
}

// Leaping Bunny certification
if (hasLabel('leaping-bunny') || hasLabel('cruelty-free')) {
  certificationBonus += 5;
}
```

---

## 📊 Impact Analysis

### Score Changes Expected

**Products with labor violations:**
- **Current:** No penalty
- **New:** -5 (minor) or -15 (major)
- **Impact:** Significant score decrease for unethical products

**Products with minor animal cruelty:**
- **Current:** No penalty (only major)
- **New:** -5 penalty
- **Impact:** More nuanced scoring

**Products from high-impact brands:**
- **Current:** No overlay penalty
- **New:** -3 overlay
- **Impact:** Brand accountability scoring

---

## ⚠️ Questions for Stakeholders

Before implementation, clarify:

1. **Labor Violations Data Sources:** Which sources should we prioritize?
   - **Options:** DOL, Buycott, Open Corporates
   - **Recommendation:** Start with Buycott (already have API)

2. **Animal Cruelty Minor Violations:** How to distinguish minor vs. major?
   - **Recommendation:** Use PETA/HSUS/RSPCA scorecards

3. **Brand Overlay Logic:** How to determine "high-impact" brands?
   - **Recommendation:** Use brand database ethical ratings

4. **News/Sentiment Integration:** Is this a priority for MVP?
   - **Recommendation:** Phase 2/3 (complex, requires external APIs)

---

## 📁 Files to Modify

**Primary File:**
- `src/lib/truscoreEngine/pillars/carePillar.ts`

**Supporting Files:**
- `src/data/brandDatabase.ts` (for brand overlay logic)
- `src/services/buycottApi.ts` (for labor violations)
- `src/services/openCorporatesApi.ts` (for labor violations)
- `src/__tests__/unit/lib/pillars/carePillar.test.ts` (for tests)

---

## ✅ Testing Requirements

### Unit Tests
- [ ] Labor violations detection (minor and major)
- [ ] Minor animal cruelty violations
- [ ] Brand/parent overlay penalty
- [ ] RSPO and Leaping Bunny certifications
- [ ] Recall history overlay
- [ ] Score capping (0-25)

### Integration Tests
- [ ] Full CARE Pillar calculation with all factors
- [ ] Edge cases (missing data, multiple violations)
- [ ] Real-world products
- [ ] Old vs. new scoring comparison

---

## 🎯 Success Criteria

**Phase 1 Complete When:**
- ✅ Labor violations detection implemented
- ✅ Minor animal cruelty violations added
- ✅ Brand/parent overlay implemented
- ✅ All unit tests passing

**Phase 2 Complete When:**
- ✅ RSPO and Leaping Bunny certifications added
- ✅ Recall history overlay implemented
- ✅ Additional recall sources (if prioritized)

**Phase 3 Complete When:**
- ✅ News/sentiment integration (if prioritized)

---

## 📚 Reference Documents

- **Full Analysis:** `CARE_PILLAR_COMPREHENSIVE_ANALYSIS_REPORT.md`
- **Specification:** `TruScore logic/CARE Pillar.xlsx`
- **Extracted Spec:** `CARE_PILLAR_SPEC_EXTRACTED.json`

---

**Status:** ✅ Ready for Implementation  
**Next Step:** Stakeholder review and approval of Phase 1 changes

