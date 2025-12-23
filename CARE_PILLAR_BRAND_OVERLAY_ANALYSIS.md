# Care Pillar Brand Overlay Penalty Analysis

**Date:** December 21, 2024  
**Issue Reported:** Brand overlay penalty using legacy -3 instead of tiered -4/-8/-15 per spec

---

## 🔍 Issue Summary

**User Statement:**
> "Having read the test report there is a scoring error in applying the brand/parent company overlay. The deducted score is -3 (that was our legacy scoring). The spec for Animal Cruelty and Labor Violations stipulates; "brand/parent assessed separately with same (scoring) tiers (-4/-8/-15), mutually exclusive (i.e. no deduct if the product directly hits)."

**Impact:**
- Ben & Jerry's scores 25/25 on Care despite parent company (Unilever) being implicated in poor handling of violence against Kenyan tea workers
- Should receive a tiered penalty (-4/-8/-15) based on severity, not flat -3

---

## 📋 Current Implementation Analysis

### Current Code (`src/lib/truscoreEngine/pillars/carePillar.ts`)

**Line 636:**
```typescript
// Excel spec: Brand overlay uses same tiers as product violations (-4/-8/-15)
// For simplicity, we use -3 as a general overlay (can be enhanced to use tiers)
brandOverlayPenalty = 3;
```

**Issue:** Hardcoded `-3` instead of tiered penalties.

### Product Violation Tiers (Working Correctly)

**Lines 325-361 (Animal Cruelty):**
- Limited = -4
- Moderate = -8  
- Major = -15

**Lines 410-436 (Labor Violations):**
- Limited = -4
- Moderate = -8
- Major = -15

**Lines 497-526 (Recalls):**
- Class III = -4
- Class II = -8
- Class I = -15

✅ **Product violations use correct 3-tier system**

### Brand Overlay Logic (Incorrect)

**Lines 632-648:**
```typescript
if (hasHighImpactAnimal || hasHighImpactLabor || hasBrandRecallHistory) {
  // Excel spec: Brand overlay uses same tiers as product violations (-4/-8/-15)
  // For simplicity, we use -3 as a general overlay (can be enhanced to use tiers)
  brandOverlayPenalty = 3;  // ❌ WRONG - should be tiered
  // ...
}
```

❌ **Brand overlay uses flat -3 instead of tiered -4/-8/-15**

---

## 📖 Spec Requirements

### From `CARE_PILLAR_SPEC_EXTRACTED.json`:

**Line 32 (Animal Cruelty):**
> "Major=-15 (e.g., factory farming/slaughter/cruelty/news tie), minor=-5; **brand/parent high-impact=-3 overlay**."

**Line 43 (Labor Violations):**
> "Minor=-5 (e.g., under-pay/over-work/min breaks/unpaid overtime/anti-competitive/predatory/bullying/news tie), major=-15 (e.g., child labor/slavery); **brand/parent high-impact=-3 overlay**."

⚠️ **Note:** The JSON spec shows `-3`, but the user states the spec says `-4/-8/-15` (same tiers).

### From Documentation (`CARE_PILLAR_EXCEL_ANALYSIS.md`):

**Line 238:**
> "**Logic:** 'Brand/parent assessed separately with same tiers (-4/-8/-15), mutually exclusive (no deduct if product hits)'"

✅ **User is correct - spec requires tiered penalties (-4/-8/-15)**

---

## 🎯 The Problem

### Ben & Jerry's Example:

**Current Behavior:**
1. Base: 15
2. Certifications: +15 (Fairtrade + Organic) = 30, capped to 25
3. Brand Overlay: -3 (Unilever parent labor violations)
4. **Final: 25 - 3 = 22/25** (but user reports seeing 25/25, suggesting -3 isn't being applied or is too small)

**Expected Behavior (Per Spec):**
1. Base: 15
2. Certifications: +15 = 30, capped to 25
3. Brand Overlay: -15 (Unilever parent **major** labor violations - violence against Kenyan tea workers)
4. **Final: 25 - 15 = 10/25**

**Impact:** Score difference of **12 points** (22 vs 10) or **15 points** if currently showing 25/25.

---

## 🔧 Required Fix

### 1. Determine Severity for Brand Overlay

Need to check the severity of parent company violations:

**For Animal Cruelty:**
- Use `checkAnimalCruelty()` to get `violationType` ('limited' | 'moderate' | 'major')
- Apply corresponding tier: Limited=-4, Moderate=-8, Major=-15

**For Labor Violations:**
- Use `checkLaborViolations()` to get `violationType` ('limited' | 'moderate' | 'major')
- Apply corresponding tier: Limited=-4, Moderate=-8, Major=-15

**For Recalls:**
- Use recall classification: Class III=-4, Class II=-8, Class I=-15

### 2. Apply Highest Severity

If parent has multiple violations, apply the **highest severity** penalty (not cumulative).

### 3. Mutually Exclusive Logic

✅ **Already implemented correctly:**
- Lines 574-606: Only applies brand overlay if product doesn't have the violation
- Lines 586-590: Handles ethical products with parent violations

---

## 📊 Code Changes Required

### Current Code (Line 632-648):
```typescript
if (hasHighImpactAnimal || hasHighImpactLabor || hasBrandRecallHistory) {
  brandOverlayPenalty = 3;  // ❌ Flat -3
  // ...
}
```

### Required Code:
```typescript
if (hasHighImpactAnimal || hasHighImpactLabor || hasBrandRecallHistory) {
  // Determine severity tier for brand overlay
  let overlaySeverity: 'limited' | 'moderate' | 'major' = 'limited';
  
  // Check animal cruelty severity
  if (hasHighImpactAnimal) {
    const animalData = checkAnimalCruelty({ ...product, brands: parentCompany });
    if (animalData.violationType === 'major') overlaySeverity = 'major';
    else if (animalData.violationType === 'moderate' && overlaySeverity !== 'major') overlaySeverity = 'moderate';
  }
  
  // Check labor violations severity
  if (hasHighImpactLabor) {
    const laborData = checkLaborViolations({ ...product, brands: parentCompany });
    if (laborData.violationType === 'major') overlaySeverity = 'major';
    else if (laborData.violationType === 'moderate' && overlaySeverity !== 'major') overlaySeverity = 'moderate';
  }
  
  // Check recall severity
  if (hasBrandRecallHistory) {
    // Get highest recall severity from brand database
    // Class I = major, Class II = moderate, Class III = limited
  }
  
  // Apply tiered penalty
  if (overlaySeverity === 'major') brandOverlayPenalty = 15;
  else if (overlaySeverity === 'moderate') brandOverlayPenalty = 8;
  else brandOverlayPenalty = 4;
  
  // ...
}
```

---

## ✅ Verification

### Test Cases:

1. **Ben & Jerry's (Unilever Parent - Major Labor Violations)**
   - Expected: -15 brand overlay
   - Current: -3 brand overlay
   - **Fix Required:** ✅

2. **Product with Moderate Parent Violations**
   - Expected: -8 brand overlay
   - Current: -3 brand overlay
   - **Fix Required:** ✅

3. **Product with Limited Parent Violations**
   - Expected: -4 brand overlay
   - Current: -3 brand overlay
   - **Fix Required:** ✅

---

## 📝 Conclusion

**User is correct:** The spec requires tiered brand overlay penalties (-4/-8/-15), not flat -3.

**Current Implementation:**
- ❌ Uses legacy -3 for all brand overlays
- ✅ Mutually exclusive logic is correct
- ✅ Product violation tiers are correct

**Required Fix:**
- ✅ Implement tiered brand overlay penalties
- ✅ Determine severity from parent company violations
- ✅ Apply highest severity penalty if multiple violations

**Impact:**
- Ben & Jerry's should score 10/25 (not 22/25 or 25/25)
- More accurate accountability for parent company violations
- Aligns with spec requirements

---

## 🚀 Next Steps

1. **Review this analysis** - Confirm understanding before code changes
2. **Implement tiered penalties** - Replace flat -3 with -4/-8/-15 based on severity
3. **Test with Ben & Jerry's** - Verify score changes from 25/25 to 10/25
4. **Update documentation** - Reflect correct tiered system

---

**Status:** ⚠️ **Issue Confirmed - Fix Required**
