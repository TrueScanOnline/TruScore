# ETHICS Pillar Database Query Order and Data Conversion

**Date:** December 23, 2024  
**Based on:** `TruScore logic/ETHICS Pillar.xlsx` specification

---

## 📋 Executive Summary

This document explains **HOW** the ETHICS Pillar queries databases, the **ORDER** of queries, and how different data/certifications are converted into scores according to the actual specification.

**Key Finding:** The specification shows a **priority-based query system** where Open Food Facts (OFF) is typically a **fallback source** (3rd or 4th priority), not the primary source as previously described.

---

## 🔄 Database Query Order by Data Element

### 1. **Certifications** (Positive Adjustments: +1 to +8, cap +15)

**Query Order (Priority):**
1. **Primary Certification Organizations** (e.g., Fairtrade Intl, USDA, EFSA, IFOAM, GlobalG.A.P, RSPCA, MSC, Ocean Wise, Friend of the Sea)
2. **Local Government Certifications** (e.g., ACO Australia)
3. **Country-Specific Open Food Facts** (e.g., `au.openfoodfacts.org` for Australia)
4. **Global Open Food Facts** (`world.openfoodfacts.org`)

**Current Implementation:**
- ✅ Queries Open Food Facts `labels_tags` array (which aggregates certifications from multiple sources)
- ✅ Filters `labels_tags` for certification matches
- ✅ Uses fuzzy matching >80% for variant detection

**Data Conversion:**
- **Fairtrade** (`en:fair-trade`) → **+8**
- **Organic** (`en:organic`, `en:usda-organic`, `en:eu-organic`, `en:bio`, `en:ecocert`) → **+7**
- **Rainforest Alliance** (`en:rainforest-alliance`) → **+6**
- **UTZ** (`en:utz`) → **+6**
- **MSC/ASC** (`en:msc`, `en:asc`, `en:dolphin-safe`) → **+6**
- **RSPO** (`en:rspo`, `en:roundtable-on-sustainable-palm-oil`) → **+6**
- **Ocean Wise** (`en:ocean-wise`, `en:oceanwise`) → **+5**
- **RSPCA** (`en:rspca`) → **+5**
- **Leaping Bunny** (`en:leaping-bunny`, `en:cruelty-free`) → **+5**
- **B-Corp** (`en:b-corp`, `en:bcorp`) → **+5**
- **Free-Roaming** (`en:free-roaming`, `en:freeroaming`) → **+5**
- **Friend of the Sea** (`en:friend-of-the-sea`, `en:friendofthesea`) → **+4**
- **GlobalG.A.P** (`en:globalgap`, `en:global-gap`) → **+4**
- **Free-Range** (`en:free-range`, not free-roaming) → **+3**
- **Cage-Free** (`en:cage-free`, not free-range or free-roaming) → **+1**

**Stack Cap:** Maximum **+15 total** (even if multiple certifications exceed this)

**Geographic Certifications:** Universal application (e.g., EU Organic cert on EU product scanned in AU scores full points)

---

### 2. **Animal Cruelty** (Adjustments: +4 to -7)

**Query Order (Priority):**
1. **BBFAW (Business Benchmark on Farm Animal Welfare)** - Primary source
   - If BBFAW data found → Apply tier-based scoring
   - If BBFAW **not found** → **Return nil (no score adjustment)** ⚠️

**Current Implementation Issue:**
- ❌ Code has a **fallback Animal Cruelty Service** that applies penalties (-4/-8/-15) when BBFAW is not available
- ✅ **Spec says:** "if not found nil return (only top 150 food companies currently assessed)"
- ⚠️ **Discrepancy:** The fallback violation-based system is NOT in the spec

**BBFAW Data Conversion:**
- **Tier 1** (Leadership) → **+4**
- **Tier 2** (Management) → **+2**
- **Tier 3-5** → **0** (no adjustment)
- **Tier 6** (No disclosure) → **-7**
- **E/F Impact Rating** → **-7**

**Banner Alerts (Scoring Neutral):**
- PETA, Ethical Consumer, HSUS/RSPCA/ASPCA/USDA AWA, ALDF, Compassion in World Farming, Buycott
- These are for **BANNER ALERTS ONLY** (e.g., "Recent cruelty buzz—check sources")
- **Do NOT affect scoring** (scoring neutral)
- Time-bound <12 months
- Applied as informational alerts, not score penalties

**Parent Chaining:**
- Fuzzy matching >80% on `brands_tags`
- Oxfam CSVs/Open Corporates API for product → brand → parent (depth 3)
- Local database store for Parent → Brand → Product mapping

---

### 3. **Labor Violations** (Penalties: -4 to -15)

**Query Order (Priority):**
1. **DOL (US Department of Labor) List of Goods** (US child/forced labor)
2. **Walk Free Global Slavery Index**
3. **Oxfam Behind the Brands**
4. **ILO Labor Standards**
5. **Buycott/Open Corporates** (secondary)
6. **Country-Specific Open Food Facts** (tertiary)
7. **Global Open Food Facts** (fallback)

**Current Implementation:**
- ✅ Queries Brand Database (which includes DOL/Walk Free data)
- ✅ Queries Buycott API (if configured)
- ✅ Queries Open Corporates (if configured)
- ⚠️ May not follow exact priority order

**Data Conversion:**
- **Limited concerns** (under-pay/over-work/min breaks/unpaid overtime/Walk Free low-risk) → **-4**
- **Moderate concerns** (unsafe conditions/Walk Free medium-risk) → **-8**
- **Major concerns** (child labor/slavery/Walk Free high-risk) → **-15**

**Mutually Exclusive Logic:**
- Brand/parent assessed separately with same tiers (-4/-8/-15)
- **Mutually exclusive** (no deduct if product directly hits)
- If product has certifications (indicating ethical product), parent violations use brand overlay instead of direct penalty

**Banner Alerts (Scoring Neutral):**
- Negative news from X/Reuters as banner alert (scoring neutral)
- "Labor concerns in news—verify" to sidestep rumors
- Time-bound <12 months
- **Do NOT affect scoring**

**Fuzzy Matching:** >80% on `brands_tags` for better product/brand hits

---

### 4. **Recalls** (Penalties: -4 to -15)

**Query Order (Priority):**
1. **Local Government Recalls:**
   - **FDA** (US recalls)
   - **CFIA** (Canada)
   - **FSANZ** (Australia/New Zealand)
   - **EFSA/RASFF** (EU)
2. **Country-Specific Open Food Facts**
3. **Global Open Food Facts**

**Current Implementation:**
- ✅ Queries FDA Recall Service
- ✅ Queries Comprehensive US Recalls (recalls.gov)
- ✅ Queries RASFF Alerts (EU)
- ✅ Queries CFIA Recalls (Canada)
- ✅ Stores results in `product.recalls` array (queried BEFORE TruScore calculation)

**Data Conversion:**
- **Class III** (low risk) → **-4**
- **Class II** (med risk) → **-8**
- **Class I** (high risk) → **-15**

**Time Window:** Only active recalls within **3 months** (not 12 months)

**Universal Penalties:** Recall in one location = global deduct (poor care distrib-wide)

**Banner Alerts (Scoring Neutral):**
- Semantic/news carved to banners only (e.g., "Potential Recall Buzz—Verify Sources")
- >0.3 threshold triggers, **no score hit** to mitigate fake news
- Time-bound <3 months
- **Do NOT affect scoring**

---

## 🔍 Current Implementation vs. Specification

### ✅ Correctly Implemented:

1. **Certifications:** Queries `labels_tags` from OFF (which aggregates from multiple sources)
2. **BBFAW Primary:** Checks BBFAW first for animal cruelty
3. **Labor Violations:** Queries multiple sources (DOL, Walk Free, etc.)
4. **Recalls:** Queries multiple government sources
5. **Mutually Exclusive Logic:** Brand overlay only if product is ethical but parent has violations

### ⚠️ Discrepancies:

1. **Animal Cruelty Fallback:**
   - **Spec says:** "if not found nil return" (no score adjustment)
   - **Code does:** Falls back to violation-based system (-4/-8/-15)
   - **Action Required:** Remove fallback penalty system, return nil if BBFAW not found

2. **Query Order:**
   - **Spec shows:** Priority-based (Primary orgs → Local govt → Country OFF → Global OFF)
   - **Code does:** Primarily queries OFF `labels_tags` (which may aggregate from multiple sources)
   - **Action Required:** Verify that OFF `labels_tags` correctly aggregates from priority sources

3. **Banner Alerts:**
   - **Spec says:** PETA, Ethical Consumer, etc. are for banner alerts only (scoring neutral)
   - **Code may:** Use these for scoring (needs verification)
   - **Action Required:** Ensure banner alert sources don't affect scoring

---

## 📊 Data Flow Diagram

```
Product Scan (Barcode)
  ↓
1. Extract Brands (from product.brands, product.brand_owner, product.product_name)
  ↓
2. CERTIFICATIONS:
   Primary Cert Orgs → Local Govt Certs → Country OFF → Global OFF
   ↓
   Filter labels_tags array
   ↓
   Convert to scores (+1 to +8, cap +15)
   ↓
3. ANIMAL CRUELTY:
   Check BBFAW (brand name → tier lookup)
   ↓
   If found: Apply tier score (+4, +2, 0, -7)
   If NOT found: Return nil (NO score adjustment) ⚠️
   ↓
   Banner alerts (PETA, etc.) → Display only, NO scoring
   ↓
4. LABOR VIOLATIONS:
   DOL → Walk Free → Oxfam → ILO → Buycott → Open Corporates → Country OFF → Global OFF
   ↓
   Convert to penalties (-4, -8, -15)
   ↓
   Check mutually exclusive logic (product vs. parent)
   ↓
5. RECALLS:
   FDA/CFIA/FSANZ/EFSA/RASFF → Country OFF → Global OFF
   ↓
   Filter active recalls within 3 months
   ↓
   Convert to penalties (-4, -8, -15)
   ↓
6. BRAND/PARENT OVERLAY:
   Check if product is ethical (has certifications) but parent has violations
   ↓
   Apply tiered overlay penalty (-4, -8, -15) if mutually exclusive conditions met
   ↓
7. FINAL SCORE:
   Base (15) + Certifications + Animal Cruelty + Labor + Recalls + Overlay
   ↓
   Cap at 0-25
```

---

## 🎯 Key Takeaways

1. **Open Food Facts is NOT the primary source** for most data types—it's typically 3rd or 4th priority
2. **BBFAW is the ONLY source for animal cruelty scoring**—if not found, return nil (no fallback penalties)
3. **Banner alerts are scoring neutral**—PETA, Ethical Consumer, news sources don't affect scores
4. **Query order matters**—primary sources should be checked first, with OFF as fallback
5. **Mutually exclusive logic**—brand overlay only applies if product is ethical but parent has violations

---

## 📝 Action Items

1. **Remove Animal Cruelty fallback penalty system** (return nil if BBFAW not found)
2. **Verify query order** matches specification priority
3. **Ensure banner alerts don't affect scoring** (PETA, Ethical Consumer, news sources)
4. **Document actual data sources** used in current implementation
5. **Test with 20 barcodes** to verify query order and data conversion accuracy
