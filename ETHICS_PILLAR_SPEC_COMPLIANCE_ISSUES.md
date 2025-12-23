# ETHICS Pillar Specification Compliance Issues

**Date:** December 23, 2024  
**Based on:** Comparison between `TruScore logic/ETHICS Pillar.xlsx` and current implementation

---

## 🚨 Critical Discrepancies

### 1. **Animal Cruelty Fallback System (NOT in Spec)**

**Specification Says:**
> "1. BBFAW; if not found nil return (only top 150 food companies currently assessed)."

**Current Implementation:**
```typescript
// Line 340-422 in ethicsPillar.ts
// FALLBACK: Use existing violation-based system if BBFAW data not available
if (!bbfawTierApplied) {
  animalCrueltyData = checkAnimalCruelty(product);
  // Applies -4, -8, or -15 penalties based on violation severity
}
```

**Issue:**
- Code applies fallback penalties (-4/-8/-15) when BBFAW data is not found
- Spec explicitly says "if not found nil return" (no score adjustment)
- The fallback Animal Cruelty Service should NOT be used for scoring

**Required Fix:**
- Remove fallback penalty system
- Return nil (no adjustment) if BBFAW not found
- Keep Animal Cruelty Service for banner alerts only (scoring neutral)

---

### 2. **Banner Alert Sources Used for Scoring**

**Specification Says:**
> "Banner Alerts: PETA, Ethical Consumer, HSUS/RSPCA/ASPCA/USDA AWA, ALDF, Compassion in World Farming > Buycott >"
> "Violations Reports/Allegations from NGO's and Negative news from X/Reuters applied as banner alert (scoring neutral)"

**Current Implementation:**
- `checkAnimalCruelty()` may use PETA, HSUS, RSPCA data for scoring
- `checkLaborViolations()` may use Buycott data for scoring
- These should be banner alerts only (scoring neutral)

**Required Fix:**
- Separate banner alert logic from scoring logic
- Ensure PETA, Ethical Consumer, HSUS, RSPCA, ASPCA, ALDF, Compassion in World Farming, Buycott, news sources are for display only
- Do NOT apply penalties based on these sources

---

### 3. **Query Order Not Explicitly Followed**

**Specification Shows Priority Order:**

**Certifications:**
1. Primary cert orgs (Fairtrade Intl, USDA, EFSA, etc.)
2. Local govt certs (ACO AU)
3. Country OFF
4. Global OFF

**Animal Cruelty:**
1. BBFAW (if not found, nil return)

**Labor Violations:**
1. DOL/Walk Free/Oxfam/ILO
2. Buycott/Open Corporates
3. Country OFF
4. Global OFF

**Recalls:**
1. Local govt recalls (FDA/CFIA/FSANZ/EFSA/RASFF)
2. Country OFF
3. Global OFF

**Current Implementation:**
- Primarily queries Open Food Facts `labels_tags` (which may aggregate from multiple sources)
- May not explicitly follow priority order
- Should verify that OFF correctly aggregates from priority sources

**Required Fix:**
- Document actual query order in code
- Verify OFF `labels_tags` correctly aggregates from priority sources
- If not, implement explicit priority-based querying

---

## ✅ Correctly Implemented

1. **BBFAW Primary Check:** Code checks BBFAW first for animal cruelty ✅
2. **BBFAW Tier Scoring:** Correctly applies +4, +2, 0, -7 based on tier ✅
3. **Certification Stacking:** Correctly caps at +15 ✅
4. **Mutually Exclusive Logic:** Brand overlay only if product is ethical but parent has violations ✅
5. **Recall Time Window:** Correctly uses 3 months (not 12) ✅
6. **Recall Classification:** Correctly applies -4, -8, -15 based on Class III/II/I ✅

---

## 📋 Recommended Changes

### Priority 1 (Critical):

1. **Remove Animal Cruelty Fallback Penalty System**
   - File: `src/lib/truscoreEngine/pillars/ethicsPillar.ts`
   - Lines: ~340-422
   - Change: Return nil (no adjustment) if BBFAW not found
   - Keep: Banner alert logic (scoring neutral)

2. **Separate Banner Alerts from Scoring**
   - Ensure PETA, Ethical Consumer, HSUS, RSPCA, ASPCA, ALDF, Compassion in World Farming, Buycott, news sources are for display only
   - Do NOT apply penalties based on these sources

### Priority 2 (Important):

3. **Document Query Order**
   - Add comments explaining priority order
   - Verify OFF `labels_tags` correctly aggregates from priority sources

4. **Test with 20 Barcodes**
   - Verify BBFAW-only scoring (no fallback penalties)
   - Verify banner alerts don't affect scores
   - Verify query order matches specification

---

## 🔍 Code Review Checklist

- [ ] Animal Cruelty: BBFAW only, no fallback penalties
- [ ] Banner Alerts: Scoring neutral (PETA, Ethical Consumer, etc.)
- [ ] Query Order: Matches specification priority
- [ ] Certifications: OFF aggregates from priority sources correctly
- [ ] Labor Violations: Priority order (DOL → Walk Free → Oxfam → ILO → Buycott → OFF)
- [ ] Recalls: Priority order (FDA/CFIA/FSANZ/EFSA/RASFF → Country OFF → Global OFF)
- [ ] Mutually Exclusive Logic: Brand overlay only when appropriate
- [ ] Time Windows: Recalls 3 months, Banner alerts 12 months
