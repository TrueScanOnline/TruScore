# TruScore Specification vs Current Code - Comprehensive Analysis

## Executive Summary

**Document Analyzed:** `Tru_Score_Engine_Detailed_Specification_20251129_v2.txt`
**Current Code:** `src/lib/truscoreEngine.ts` (v1.4)

**Critical Findings:**
- ❌ **Base scores are WRONG** - Spec says 15, code uses 12
- ❌ **NOVA penalties are WRONG** - Spec says different values
- ❌ **Additive penalties are WRONG** - Spec uses IARC classes, code uses safety ratings
- ❌ **Palm oil penalty is WRONG** - Spec says -8, code uses -10
- ❌ **Certification bonuses are WRONG** - Spec has different values
- ❌ **Hidden terms penalties are WRONG** - Spec says -10/-20, code uses -12/-20
- ❌ **Origin penalty is WRONG** - Spec says -8, code uses -15
- ⚠️ **Missing features** - Several spec items not implemented

---

## DETAILED PILLAR-BY-PILLAR ANALYSIS

### BODY PILLAR (25pts)

#### 1. Base Score
**Specification:** 15 (uniform, with light geo overrides if local nutrition data >80% complete)
**Current Code:** 12 (line 155)
**Status:** ❌ **WRONG** - Should be 15, not 12
**Impact:** All products without Nutri-Score get 3 points less than specified

#### 2. Nutri-Score Grade
**Specification:** A=25, B=20, C=15, D=10, E=5 (direct map, local override)
**Current Code:** A=25, B=20, C=15, D=10, E=5 (line 149)
**Status:** ✅ **CORRECT**

#### 3. NOVA Group
**Specification:** 
- 1 = +3
- 2 = 0 (no adjustment)
- 3 = -3
- 4 = -8 (cap -10 total)

**Current Code:**
- 1 = +3 ✅
- 2 = +1 ❌ (should be 0)
- 3 = -5 ❌ (should be -3)
- 4 = -10 ❌ (should be -8)

**Status:** ❌ **WRONG** - All values except NOVA 1 are incorrect
**Impact:** NOVA 2 gets bonus it shouldn't, NOVA 3/4 get harsher penalties

#### 4. Additives/Risks
**Specification:**
- IARC Class 1 (local ban) = -10
- IARC Class 2A = -5
- IARC Class 2B = -3
- Cap = -15

**Current Code:**
- Uses safety ratings: avoid=-3, caution=-1.5, safe=-0.5 (line 175-184)
- Cap = -15 ✅

**Status:** ❌ **WRONG** - Should use IARC cancer classification, not safety ratings
**Impact:** Additive penalties don't match specification methodology

#### 5. Allergens/Irritants
**Specification:** High-risk = -5 (cap -10, temp -5 recall)
**Current Code:** 
- Risky tags: -4 each (line 206)
- Irritants block: -10 (line 224)
- Fragrance: -10 (line 229)

**Status:** ⚠️ **PARTIALLY WRONG** - Spec says -5 cap -10, code has different structure
**Impact:** Penalties may be too harsh

#### 6. Pet/Household Specifics
**Specification:** Compliant=+5, non=-5 (cap -10)
**Current Code:** ❌ **NOT IMPLEMENTED**
**Status:** ❌ **MISSING**

---

### PLANET PILLAR (25pts)

#### 1. Base Score
**Specification:** 15 (uniform, geo regs weight 0.5 if mandates)
**Current Code:** 12 (line 256)
**Status:** ❌ **WRONG** - Should be 15, not 12
**Impact:** All products without Eco-Score get 3 points less

#### 2. Eco-Score Grade
**Specification:** A=25, B=20, C=15, D=10, E=5 (direct map)
**Current Code:** A=25, B=20, C=15, D=10, E=5 (line 250)
**Status:** ✅ **CORRECT**

**Note:** Spec mentions LCA blend (0.5 * local + 0.5 * global) if local LCA available
**Current Code:** ❌ **NOT IMPLEMENTED**

#### 3. Palm/Deforestation
**Specification:** Non-sust palm = -8 (cap -10)
**Current Code:** 
- Non-certified: -10 (line 269)
- Certified sustainable: -5 (line 267)

**Status:** ❌ **WRONG** - Should be -8 for non-certified, not -10
**Impact:** Non-certified palm oil gets 2 points more penalty than specified

#### 4. Packaging
**Specification:** Full recycle = +5, partial = +2 (cap +5)
**Current Code:** 
- All recyclable: +5 ✅ (line 291)
- Some recyclable: +2 ✅ (line 293)

**Status:** ✅ **CORRECT**

#### 5. Origins/Supply Chain
**Specification:** Missing/high-risk = -5 (cap -10)
**Current Code:** ❌ **NOT IMPLEMENTED**
**Status:** ❌ **MISSING**

#### 6. Pet/Household Specifics
**Specification:** Recyclable = +3, non = -3 (cap -5)
**Current Code:** ❌ **NOT IMPLEMENTED**
**Status:** ❌ **MISSING**

---

### Ethics Pillar (25pts)

#### 1. Base Score
**Specification:** 15 (uniform, geo regs weight 0.5 if mandates)
**Current Code:** 18 (line 301)
**Status:** ❌ **WRONG** - Should be 15, not 18
**Impact:** All products get 3 points more than specified

#### 2. Certifications
**Specification:**
- Fairtrade = +8
- Organic = +7
- Rainforest/UTZ = +6
- MSC/ASC = +6
- RSPCA/Leaping Bunny/B Corp = +5
- Cage-Free/Free-Range = +4
- Stack cap = +15

**Current Code:**
- Fair-trade = +8 ✅ (line 304)
- Organic = +8 ❌ (should be +7, line 316)
- Rainforest Alliance = +7 ❌ (should be +6, line 319)
- MSC/ASC/Dolphin-safe = +8 ❌ (should be +6, line 320)
- RSPCA = +6 ❌ (should be +5, line 323)
- Vegan/Cruelty-free = +10 ❌ (not in spec, line 324)
- UTZ = +7 ❌ (should be +6, line 327)
- B-Corp = +5 ✅ (line 331)
- Non-GMO = +3 ❌ (not in spec, line 340)
- Stack cap = ❌ **NOT IMPLEMENTED** (should cap at +15 total)

**Status:** ❌ **MOSTLY WRONG** - Multiple certification bonuses are incorrect, no stack cap
**Impact:** Products with multiple certifications can exceed intended maximum bonus

#### 3. Violations/Cruelty
**Specification:** Minor = -5, major = -15 (cap -20)
**Current Code:** Cruel parent = -30 (line 345)
**Status:** ❌ **WRONG** - Should be -15 for major, cap -20, not -30
**Impact:** Cruel parent penalty is too harsh (10 points more than spec)

#### 4. Recalls
**Specification:** -10 (temp if within last 12mo)
**Current Code:** ❌ **NOT IMPLEMENTED** (recalls are fetched but not used in scoring)
**Status:** ❌ **MISSING**

#### 5. Sentiment/Negative News
**Specification:** Active scandal = -5 to -10 (temp, cap -10, expires 6mo)
**Current Code:** ❌ **NOT IMPLEMENTED**
**Status:** ❌ **MISSING**

#### 6. Pet Specifics
**Specification:** Compliant = +5, violation = -5 (cap -10)
**Current Code:** ❌ **NOT IMPLEMENTED**
**Status:** ❌ **MISSING**

---

### OPEN PILLAR (25pts)

#### 1. Base Score
**Specification:** 15 (uniform, geo regs weight 0.5 if mandates)
**Current Code:** 25 (line 351)
**Status:** ❌ **WRONG** - Should be 15, not 25
**Impact:** All products start with 10 points more than specified

#### 2. Ingredients Disclosure
**Specification:**
- Full = 15
- Partial >80% = 10
- Partial 50-80% = 5
- None = -5

**Current Code:**
- No ingredients: sets to 5 ✅ (line 363)
- Placeholder: sets to 5 ✅ (line 370)
- Otherwise: uses base 25 and applies penalties

**Status:** ⚠️ **PARTIALLY WRONG** - Code doesn't implement the tiered scoring system
**Impact:** Ingredients disclosure scoring doesn't match specification

#### 3. Hidden Terms
**Specification:** 1-2 = -10, >=3 = -20 (cap -20)
**Current Code:** 1-2 = -12, >=3 = -20 (line 354-359)
**Status:** ❌ **WRONG** - 1-2 should be -10, not -12
**Impact:** Products with 1-2 hidden terms get 2 points more penalty

#### 4. Origins
**Specification:** 
- No origin = -8
- Complete via GS1 = +5 bonus

**Current Code:** 
- No origin = -15 ❌ (line 393)
- GS1 bonus = ❌ **NOT IMPLEMENTED**

**Status:** ❌ **WRONG** - Should be -8, not -15
**Impact:** Missing origin gets 7 points more penalty than specified

---

## SUMMARY OF ISSUES

### Critical Errors (Must Fix)
1. ❌ **Base scores wrong** - All pillars should start at 15, not 12/18/25
2. ❌ **NOVA penalties wrong** - 2 should be 0, 3 should be -3, 4 should be -8
3. ❌ **Additive system wrong** - Should use IARC classes, not safety ratings
4. ❌ **Palm oil penalty wrong** - Should be -8, not -10
5. ❌ **Certification bonuses wrong** - Multiple incorrect values, missing stack cap
6. ❌ **Cruel parent penalty wrong** - Should be -15 (cap -20), not -30
7. ❌ **Hidden terms penalty wrong** - 1-2 should be -10, not -12
8. ❌ **Origin penalty wrong** - Should be -8, not -15

### Missing Features
1. ❌ Pet/Household specifics (all pillars)
2. ❌ Recalls scoring (Ethics Pillar)
3. ❌ Sentiment/Negative news (Ethics Pillar)
4. ❌ Origins/Supply chain scoring (Planet pillar)
5. ❌ LCA blend for Eco-Score (Planet pillar)
6. ❌ GS1 origin bonus (Open pillar)
7. ❌ Stack cap for certifications (Ethics Pillar)
8. ❌ Tiered ingredients disclosure scoring (Open pillar)

### Correct Implementations
1. ✅ Nutri-Score conversions (A=25, B=20, C=15, D=10, E=5)
2. ✅ Eco-Score conversions (A=25, B=20, C=15, D=10, E=5)
3. ✅ Packaging recyclability bonuses (+5 all, +2 some)
4. ✅ NOVA 1 bonus (+3)
5. ✅ Fair-trade bonus (+8)
6. ✅ B-Corp bonus (+5)

---

## PRIORITY FIX LIST

### Phase 1: Critical Base Score Fixes (HIGH PRIORITY)
1. Change Body base from 12 → 15
2. Change Planet base from 12 → 15
3. Change Care base from 18 → 15
4. Change Open base from 25 → 15

### Phase 2: Penalty/Bonus Corrections (HIGH PRIORITY)
1. Fix NOVA: 2=0, 3=-3, 4=-8
2. Fix palm oil: -8 (not -10)
3. Fix hidden terms: 1-2=-10 (not -12)
4. Fix origin: -8 (not -15)
5. Fix cruel parent: -15 cap -20 (not -30)

### Phase 3: Certification System Fix (MEDIUM PRIORITY)
1. Fix Organic: +7 (not +8)
2. Fix Rainforest/UTZ: +6 (not +7)
3. Fix MSC/ASC: +6 (not +8)
4. Fix RSPCA: +5 (not +6)
5. Remove Vegan/Cruelty-free +10 (not in spec)
6. Remove Non-GMO +3 (not in spec)
7. Add stack cap +15 for all certifications

### Phase 4: Additive System Overhaul (MEDIUM PRIORITY)
1. Replace safety rating system with IARC classification
2. Implement IARC Class 1 = -10, 2A = -5, 2B = -3
3. Keep cap at -15

### Phase 5: Missing Features (LOW PRIORITY - Future)
1. Pet/Household specifics
2. Recalls scoring
3. Sentiment/Negative news
4. Origins/Supply chain scoring
5. LCA blend
6. GS1 bonus
7. Tiered ingredients disclosure

---

## IMPACT ASSESSMENT

### Score Impact of Current Errors

**Products without Nutri-Score/Eco-Score:**
- Body: -3 points (12 vs 15)
- Planet: -3 points (12 vs 15)
- **Total impact: -6 points**

**Products with NOVA 2:**
- Body: +1 point (should be 0)
- **Impact: +1 point (incorrect bonus)**

**Products with NOVA 3:**
- Body: -2 points (should be -3, getting -5)
- **Impact: +2 points (less penalty than should be, but code is harsher)**

**Products with NOVA 4:**
- Body: -2 points (should be -8, getting -10)
- **Impact: +2 points (less penalty than should be, but code is harsher)**

**Products with non-certified palm oil:**
- Planet: -2 points (should be -8, getting -10)
- **Impact: -2 points (too harsh)**

**Products with cruel parent:**
- Care: -15 points (should be -15 cap -20, getting -30)
- **Impact: -10 points (too harsh)**

**Products with 1-2 hidden terms:**
- Open: -2 points (should be -10, getting -12)
- **Impact: -2 points (too harsh)**

**Products without origin:**
- Open: -7 points (should be -8, getting -15)
- **Impact: -7 points (too harsh)**

**Products with multiple certifications:**
- Care: Can exceed +15 cap (no limit in code)
- **Impact: Potentially +5 to +10 points over spec**

---

## RECOMMENDATIONS

1. **Immediate Fixes (Week 1):**
   - Fix all base scores (15 for all pillars)
   - Fix NOVA penalties
   - Fix palm oil penalty
   - Fix hidden terms penalty
   - Fix origin penalty
   - Fix cruel parent penalty

2. **Short-term Fixes (Week 2-3):**
   - Fix certification bonuses
   - Add certification stack cap
   - Overhaul additive system to IARC

3. **Long-term Enhancements (Month 2+):**
   - Implement missing features
   - Add pet/household support
   - Add recalls scoring
   - Add sentiment analysis

---

**END OF ANALYSIS**
