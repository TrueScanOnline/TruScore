# CARE Pillar Excel Spec Analysis

**Date:** December 21, 2024  
**Source:** `TruScore logic/CARE Pillar.xlsx`

---

## 📊 Excel Specification Summary

### 1. Base Score
- **Value:** 15 (uniform)
- **Logic:** Always starting point; adjustments added/subtracted
- **Status:** ✅ Already correct

### 2. Certifications
- **Stack Cap:** +15 total
- **Values:**
  - Fairtrade = +8
  - Organic = +7
  - Rainforest/UTZ = +6
  - MSC/ASC = +6 (sustainable fishing)
  - Ocean Wise = +5 (sustainable wild catch)
  - Friend of the Sea = +4 (eco-aquaculture)
  - RSPCA/Leaping Bunny/B Corp = +5
  - GlobalG.A.P = +4
  - Free-Roaming = +5
  - Free-Range = +3
  - Cage-Free = +1
- **Status:** ✅ Already correct

### 3. Animal Cruelty ⚠️ **MAJOR CHANGE**
- **Source:** BBFAW (Business Benchmark on Farm Animal Welfare)
- **New Scoring System:**
  - **BBFAW Tier 1 = +4** (positive bonus)
  - **BBFAW Tier 2 = +2** (positive bonus)
  - **BBFAW Tier 6 = -7** (negative penalty)
  - **BBFAW E/F Impact Rating = -7** (negative penalty)
- **Note:** This is a REWARD/PENALTY system, not just penalties
- **Current System:** All negative penalties (-4/-8/-15 based on severity)
- **Status:** ❌ **NEEDS UPDATE**

### 4. Labor Violations
- **3-Tier System:**
  - Limited concerns = -4 (e.g., under-pay/over-work)
  - Moderate concerns = -8 (e.g., unsafe conditions)
  - Major = -15 (e.g., child labor/slavery)
- **Brand/Parent Overlay:** Same tiers (-4/-8/-15), mutually exclusive
- **Status:** ✅ Already correct

### 5. Recalls
- **3-Tier System:**
  - Limited concerns = -4 (Class III/low risk)
  - Major = -15 (Class I/high risk)
  - Moderate = -8 (Class II/med risk)
- **Time Window:** 3 months
- **Status:** ✅ Already correct

### 6. Overall Pillar Cap
- **Min:** 0 (floor after all adjustments)
- **Status:** ✅ Already correct

---

## 🔧 Required Changes

### Change 1: BBFAW Tier-Based Scoring for Animal Cruelty

**Current Implementation:**
- Uses BBFAW tiers to determine violation severity (limited/moderate/major)
- All penalties are negative (-4/-8/-15)

**New Implementation Required:**
- BBFAW Tier 1 → +4 (positive bonus)
- BBFAW Tier 2 → +2 (positive bonus)
- BBFAW Tier 6 → -7 (negative penalty)
- BBFAW E/F Impact Rating → -7 (negative penalty)
- Tiers 3, 4, 5 → Need to determine (not specified in Excel)

**Implementation Steps:**
1. Update `bbfawService.ts` to return tier-based scores (+4, +2, -7, etc.)
2. Update `carePillar.ts` to apply BBFAW tier-based scoring (positive/negative)
3. Keep existing violation-based system as fallback when BBFAW data not available

---

## 📝 Notes

### BBFAW Tier System Clarification Needed

The Excel spec shows:
- Tier 1 = +4 (positive)
- Tier 2 = +2 (positive)
- Tier 6 = -7 (negative)

**Question:** What about Tiers 3, 4, 5?

**Possible Interpretation:**
- Tier 1 = Best (Leadership) → +4
- Tier 2 = Good (Management) → +2
- Tier 3 = Fair (Governance) → 0 (no change)
- Tier 4 = Poor (Performance) → -4 (or similar)
- Tier 5 = Very Poor (Disclosure) → -6 (or similar)
- Tier 6 = Worst (No Disclosure) → -7
- E/F Impact Rating = Worst → -7

**Action:** Implement Tier 1 (+4), Tier 2 (+2), Tier 6 (-7), E/F (-7), and use 0 for Tiers 3-5 if not specified.

---

## ✅ Implementation Plan

1. ✅ Analyze Excel spec
2. ⏳ Update BBFAW service to return tier-based scores
3. ⏳ Update Care Pillar animal cruelty logic
4. ⏳ Test with BBFAW tier data
5. ⏳ Verify all other elements match spec
