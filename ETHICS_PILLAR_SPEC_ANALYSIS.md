# ETHICS Pillar Spec Analysis

**Date:** December 23, 2024  
**Source:** `TruScore logic/ETHICS Pillar.xlsx`

---

## 📋 Spec Summary

### 1. **Base Score**
- **Value:** 15 (uniform)
- **Logic:** Always starting point; adjustments added/subtracted
- **Rationale:** Slightly positive neutral; assumes ethical till violations

### 2. **Certifications**
- **Priority Order:**
  1. Primary cert orgs (Fairtrade Intl/USDA/EFSA/IFOAM/GlobalG.A.P/RSPCA/MSC/Ocean Wise/Friend of the Sea)
  2. Local govt certs (e.g., ACO AU)
  3. Country OFF
  4. Global OFF
- **Scoring:**
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
- **Stack Cap:** +15 total
- **Data Source:** `labels_tags` array filtered for match
- **Fuzzy Match:** >80% on labels for variants

### 3. **Animal Cruelty**
- **Priority Order:**
  1. **BBFAW** - if not found, **nil return** (only top 150 food companies currently assessed)
  2. Violations Reports/Allegations from NGO's and Negative news from X/Reuters → **Banner Alert (scoring neutral)**, time-bound <12months
- **Scoring:**
  - BBFAW Tier 1 = +4
  - BBFAW Tier 2 = +2
  - BBFAW Tier 6 = -7
  - BBFAW E/F Impact Rating = -7
- **Data Source:** `brands_tags`, `parent_tags`
- **Fuzzy Match:** >80% for better product/brand hits
- **Parent Chaining:** Via fuzzy matching (>80% on brands_tags) and Oxfam CSVs/Open Corporates API for product > brand > parent (depth 3)
- **CRITICAL:** If BBFAW not found, return nil (no penalty, no adjustment). NGO violations and news are banner alerts only (scoring neutral).

### 4. **Labor Violations**
- **Priority Order:**
  1. DOL/Walk Free/Oxfam/ILO
  2. Buycott/Open Corporates
  3. Country OFF
  4. Global OFF
- **Scoring:**
  - Limited concerns = -4 (e.g., under-pay/over-work)
  - Moderate concerns = -8 (e.g., unsafe conditions)
  - Major = -15 (e.g., child labor/slavery)
- **Brand/Parent Overlay:** Same tiers (-4/-8/-15), mutually exclusive (no deduct if product hits)
- **Data Source:** `brands_tags` (labor filter), violations API
- **Fuzzy Match:** >80% on labels for better product/brand hits
- **Time-bound:** <12months X/Reuters banner for news tie (scoring neutral)

### 5. **Recalls**
- **Priority Order:**
  1. Local govt recalls (FDA/CFIA/FSANZ/EFSA/RASFF)
  2. Country OFF
  3. Global OFF
- **Scoring:**
  - Limited concerns = -4 (Class III/low risk)
  - Moderate = -8 (Class II/med risk)
  - Major = -15 (Class I/high risk)
- **Time-bound:** Within 3 months (universal - recall in one location = global deduct)
- **Data Source:** `recalls API`
- **Banner Alerts:** <3months time-bound for X/Reuters for banner ties only (no scoring)

### 6. **Brand/Parent Overlay**
- **Logic:** Mutually exclusive (no deduct if product hits)
- **Scoring:** Same tiers as product violations (-4/-8/-15)
- **Applied if:** Brand/parent has violations BUT product itself doesn't have the same violation

### 7. **Overall Pillar Cap**
- **Min:** 0 (floor after all adjustments)
- **Max:** 25 (after certifications, before penalties)

---

## 🔧 Required Changes

### **CRITICAL CHANGE: Animal Cruelty**
1. **Remove fallback violation system** - Spec says "if not found nil return"
2. **BBFAW only** - If BBFAW data not found, return nil (no adjustment, no penalty)
3. **NGO violations and news** - Move to banner alerts only (scoring neutral), time-bound <12months

### **Other Changes:**
1. Verify certification values match spec exactly
2. Verify recall classification mapping (Class I/II/III)
3. Ensure brand/parent overlay logic is mutually exclusive
4. Ensure all time-bound filters are correct (3 months for recalls, 12 months for labor/animal cruelty news)

---

## ✅ Implementation Plan

1. Remove `checkAnimalCruelty` fallback from ETHICS pillar
2. Keep only BBFAW tier-based scoring
3. If BBFAW not found, return 0 adjustment (nil)
4. Move NGO violations and news to banner alerts (already implemented)
5. Verify all other scoring matches spec

