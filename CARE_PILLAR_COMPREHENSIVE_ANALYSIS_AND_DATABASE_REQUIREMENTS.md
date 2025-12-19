# CARE Pillar - Comprehensive Analysis & Database Requirements
## Complete Codebase Analysis & Implementation Readiness Assessment

**Date:** January 2025  
**Status:** ✅ Analysis Complete - Ready for Implementation Planning  
**Document Analyzed:** `TruScore logic/CARE Pillar.xlsx`  
**Extracted Spec:** `CARE_PILLAR_SPEC_EXTRACTED.json`

---

## Executive Summary

I've completed a comprehensive analysis of:
1. ✅ **CARE Pillar Excel Specification** - Fully analyzed and understood
2. ✅ **Current CARE Pillar Implementation** - Code reviewed and documented
3. ✅ **TruScore Architecture** - 4-pillar system understood
4. ✅ **Existing Databases & Data Sources** - Catalogued and assessed
5. ✅ **Gap Analysis** - Missing databases and integrations identified

### Key Findings

**Current Implementation Status:** ~75% aligned with Excel specification

**Critical Gaps Identified:**
1. **3-Tier Violation System** - Excel uses Limited/Moderate/Major (-4/-8/-15), current uses Minor/Major (-5/-15)
2. **3-Tier Recall System** - Excel uses FDA Class I/II/III (-15/-8/-4), current uses uniform -10
3. **Recall Time Window** - Excel uses 3 months, current uses 12 months
4. **Mutually Exclusive Logic** - Excel prevents double-penalty, current applies both
5. **Missing Certifications** - Ocean Wise, Friend of the Sea, GlobalG.A.P
6. **Animal Welfare Granularity** - Excel separates Cage-Free/Free-Range/Free-Roaming, current combines them

**Database Access Status:**
- ✅ **Available:** Buycott API, Open Corporates API, Brand Database, Recall APIs (FDA, CFIA, RASFF, etc.)
- ⚠️ **Partially Available:** DOL data (needs integration), Ethical Consumer (needs integration)
- ❌ **Not Available:** BBFAW API (no public API), Walk Free API (no public API, dataset download required), X/Reuters news API (needs integration)

---

## Part 1: Architecture Understanding

### 1.1 TruScore System Architecture

**TruScore v1.4 Structure:**
- **Total Score Range:** 0-100 points
- **Pillar Distribution:** 4 equal pillars, 25 points each
  - **Body Pillar:** Nutrition, additives, processing (NOVA), allergens (2-25, minimum floor of 2)
  - **Planet Pillar:** Environmental impact, palm oil, recyclability (0-25)
  - **Care Pillar:** Ethical certifications, recalls, brand ethics (0-25)
  - **Open Pillar:** Transparency, ingredients disclosure, origin, brand ownership (0-25)

**Calculation Flow:**
```
Product Data → calculateTruScore() → {
  calculateBodyPillar() → 2-25
  calculatePlanetPillar() → 0-25
  calculateCarePillar() → 0-25
  calculateOpenPillar() → 0-25
} → Sum = TruScore (0-100)
```

**Key Files:**
- `src/lib/truscoreEngine/index.ts` - Main orchestrator
- `src/lib/truscoreEngine/pillars/carePillar.ts` - Current CARE Pillar implementation
- `src/utils/trustScore.ts` - Wrapper with caching
- `src/components/TruScore.tsx` - UI display component
- `src/data/brandDatabase.ts` - Brand/parent company database (500+ companies)

### 1.2 Current CARE Pillar Implementation

**File:** `src/lib/truscoreEngine/pillars/carePillar.ts`

**Current Logic:**
1. **Base Score:** 15 (uniform) ✅
2. **Certifications:** Stacked bonuses, cap +15 ✅
   - Fairtrade: +8
   - Organic: +7
   - Rainforest Alliance: +6
   - UTZ: +6
   - MSC/ASC/Dolphin-Safe: +6
   - RSPO: +6
   - RSPCA: +5
   - Leaping Bunny: +5
   - B-Corp: +5
   - Cage-Free/Free-Range: +4 (combined)
3. **Animal Cruelty:** Major=-15, Minor=-5, Brand overlay=-3 ✅
4. **Labor Violations:** Minor=-5, Major=-15, Brand overlay=-3 ✅
5. **Recalls:** -10 (within 12 months) ⚠️
6. **Brand Overlay:** -3 for high-impact brands ✅
7. **Final Cap:** 0-25 ✅

**Supporting Services:**
- `src/services/animalCrueltyService.ts` - Animal cruelty detection
- `src/services/laborViolationsService.ts` - Labor violations detection
- `src/data/brandDatabase.ts` - Brand database with ethical ratings

---

## Part 2: Excel Specification Analysis

### 2.1 Base Score ✅ **FULLY ALIGNED**

| Aspect | Excel Spec | Current Implementation | Status |
|--------|-----------|------------------------|--------|
| **Value** | 15 (uniform) | 15 (uniform) | ✅ **ALIGNED** |
| **Rationale** | "Scaled HSUS/RSPCA avg ~50/100 (2025 welfare); optimistic fair to indies" | Same approach | ✅ |
| **Logic** | Always starting point; adjustments added/subtracted | Same | ✅ |

**No changes needed.**

### 2.2 Certifications ⚠️ **PARTIAL ALIGNMENT - REFINEMENTS NEEDED**

#### Current Implementation:
- Fairtrade: +8 ✅
- Organic: +7 ✅
- Rainforest Alliance: +6 ✅
- UTZ: +6 ✅
- MSC/ASC/Dolphin-Safe: +6 ✅
- RSPO: +6 ✅
- RSPCA: +5 ✅
- Leaping Bunny: +5 ✅
- B-Corp: +5 ✅
- Cage-Free/Free-Range: +4 (combined) ⚠️

#### Excel Specification:
- Fairtrade: +8 ✅
- Organic: +7 ✅
- Rainforest/UTZ: +6 ✅
- MSC/ASC: +6 ✅
- **Ocean Wise: +5** ❌ **MISSING**
- **Friend of the Sea: +4** ❌ **MISSING**
- RSPCA/Leaping Bunny/B Corp: +5 ✅
- **GlobalG.A.P: +4** ❌ **MISSING**
- **Free-Roaming: +5** ❌ **MISSING**
- **Free-Range: +3** (separate from Cage-Free) ⚠️ **DIFFERENT**
- **Cage-Free: +1** (basic no-cages) ⚠️ **DIFFERENT**

#### Gaps Identified:

1. **Missing Certifications:**
   - Ocean Wise (+5) - sustainable wild catch certification
   - Friend of the Sea (+4) - eco-aquaculture certification
   - GlobalG.A.P (+4) - Good Agricultural Practice certification

2. **Animal Welfare Granularity:**
   - Current: Cage-Free/Free-Range combined = +4
   - Excel: Free-Roaming = +5, Free-Range = +3, Cage-Free = +1
   - **Rationale:** More nuanced scoring based on actual welfare standards

3. **Stack Cap:**
   - Both: +15 total ✅

**Recommendation:**
- **Priority: MEDIUM**
- Add missing certifications (Ocean Wise, Friend of the Sea, GlobalG.A.P)
- Separate and refine animal welfare certifications (Free-Roaming, Free-Range, Cage-Free)

### 2.3 Animal Cruelty ⚠️ **PARTIAL ALIGNMENT - TIER REFINEMENT NEEDED**

#### Current Implementation:
- Major: -15
- Minor: -5
- Brand/Parent Overlay: -3 ✅

#### Excel Specification:
- **Limited concerns: -4** (e.g., minor welfare lapses/BBFAW tier 5-6)
- **Moderate concerns: -8** (e.g., overcrowding/poor transport/BBFAW tier 3-4)
- **Major concerns: -15** (e.g., factory farming/slaughter/cruel testing/BBFAW tier 1-2)
- Brand/parent assessed separately with same tiers (-4/-8/-15)
- **Mutually exclusive:** No deduct if product hits

#### Key Differences:

1. **3-Tier System vs 2-Tier:**
   - Excel: Limited (-4), Moderate (-8), Major (-15)
   - Current: Minor (-5), Major (-15)
   - **Impact:** More nuanced scoring, better reflects severity

2. **BBFAW Tier System:**
   - Excel uses Business Benchmark on Farm Animal Welfare (BBFAW) tiers
   - Tier 1-2 = Major, Tier 3-4 = Moderate, Tier 5-6 = Limited
   - **Current:** No BBFAW tier integration

3. **Mutually Exclusive Logic:**
   - Excel: "Brand/parent assessed separately with same tiers (-4/-8/-15), mutually exclusive (no deduct if product hits)"
   - **Current:** Applies both product and brand penalties
   - **Impact:** Prevents double-penalty

4. **Sources:**
   - Excel: PETA, Ethical Consumer, HSUS/RSPCA/ASPCA, Compassion in World Farming > Buycott > Country/Global OFF
   - Current: Uses brand database and animal cruelty service
   - **Status:** Mostly aligned, but Excel adds Ethical Consumer and ASPCA

**Recommendation:**
- **Priority: HIGH**
- Implement 3-tier system (Limited/Moderate/Major)
- Integrate BBFAW tier system if data available (see database requirements)
- Implement mutually exclusive logic (no double-penalty)
- Add Ethical Consumer and ASPCA as sources

### 2.4 Labor Violations ⚠️ **PARTIAL ALIGNMENT - TIER REFINEMENT NEEDED**

#### Current Implementation:
- Major: -15
- Minor: -5
- Brand/Parent Overlay: -3 ✅

#### Excel Specification:
- **Limited concerns: -4** (e.g., under-pay/over-work)
- **Moderate concerns: -8** (e.g., unsafe conditions)
- **Major: -15** (e.g., child labor/slavery)
- Brand/parent assessed separately with same tiers (-4/-8/-15)
- **Mutually exclusive:** No deduct if product hits

#### Key Differences:

1. **3-Tier System vs 2-Tier:**
   - Excel: Limited (-4), Moderate (-8), Major (-15)
   - Current: Minor (-5), Major (-15)
   - **Impact:** More nuanced scoring

2. **Severity Classification:**
   - Excel: Uses Walk Free Global Slavery Index and DOL classifications
   - High-risk = Major, Medium = Moderate, Low = Limited
   - **Current:** Uses brand database classifications

3. **Mutually Exclusive Logic:**
   - Excel: "Brand/parent assessed separately with same tiers (-4/-8/-15), mutually exclusive (no deduct if product hits)"
   - **Current:** Applies both product and brand penalties
   - **Impact:** Prevents double-penalty

4. **Sources:**
   - Excel: DOL List of Goods (US child/forced labor), Walk Free Global Slavery Index, Oxfam Behind the Brands, ILO Labor Standards > Buycott/Open Corporates > Country/Global OFF
   - Current: Uses brand database and labor violations service
   - **Status:** Mostly aligned, but Excel adds Walk Free and ILO

**Recommendation:**
- **Priority: HIGH**
- Implement 3-tier system (Limited/Moderate/Major)
- Integrate Walk Free Global Slavery Index and DOL classifications
- Implement mutually exclusive logic (no double-penalty)
- Add Walk Free and ILO as sources

### 2.5 Recalls ⚠️ **SIGNIFICANT DIFFERENCES - MAJOR REFINEMENT NEEDED**

#### Current Implementation:
- Penalty: -10 (uniform, within last 12 months)
- Universal: Yes ✅
- Sources: FDA, CFIA, FSANZ, RASFF, EFSA ✅

#### Excel Specification:
- **Limited concerns: -4** (Class III/low risk)
- **Moderate concerns: -8** (Class II/med risk)
- **Major: -15** (Class I/high risk)
- **Time window: 3 months** (vs current 12 months)
- Universal: Yes ✅
- Sources: FDA, CFIA, FSANZ, EFSA/RASFF ✅

#### Key Differences:

1. **3-Tier System vs Uniform:**
   - Excel: Class I = -15, Class II = -8, Class III = -4
   - Current: All recalls = -10
   - **Impact:** More accurate scoring based on severity

2. **Time Window:**
   - Excel: 3 months (vs current 12 months)
   - **Rationale:** "Time-bound <3months for X/Reuters for banner ties only (no scoring)"
   - **Impact:** Shorter window, more recent focus

3. **FDA Class System:**
   - Excel uses FDA recall classification (Class I/II/III)
   - Class I = High risk (major health hazard)
   - Class II = Medium risk (temporary health hazard)
   - Class III = Low risk (unlikely to cause adverse health consequences)
   - **Current:** No severity classification

4. **News/Sentiment:**
   - Excel: "Semantic/news carved to banners only (e.g., 'Potential Recall Buzz—Verify Sources' for shares; >0.3 threshold triggers, no score hit to mitigate fake news, keep time-bound <3months)"
   - **Current:** Not implemented
   - **Impact:** News mentions don't affect score, only shown as banner alerts

**Recommendation:**
- **Priority: CRITICAL**
- Implement 3-tier recall system based on FDA Class (I/II/III)
- Change time window from 12 months to 3 months
- Integrate FDA Class data from recall APIs
- Add news/sentiment banner alerts (no score impact)

### 2.6 Brand/Parent Overlay ⚠️ **LOGIC DIFFERENCE**

#### Current Implementation:
- Penalty: -3 for high-impact brands
- Applied when: Animal cruelty, labor violations, or recall history
- **Logic:** Applies in addition to product penalties

#### Excel Specification:
- Penalty: -3 for high-impact brands (same tiers: -4/-8/-15)
- **Logic:** "Brand/parent assessed separately with same tiers (-4/-8/-15), mutually exclusive (no deduct if product hits)"
- **Impact:** Prevents double-penalty

#### Key Difference:

**Mutually Exclusive Logic:**
- Excel: If product has violation, don't also apply brand overlay
- Current: Applies both product penalty and brand overlay
- **Impact:** Current may double-penalize

**Recommendation:**
- **Priority: MEDIUM**
- Implement mutually exclusive logic
- Only apply brand overlay if product itself doesn't have the violation

---

## Part 3: Existing Databases & Data Sources

### 3.1 Currently Available Databases

#### ✅ **Certifications**
- **Open Food Facts (OFF)** - `labels_tags` array
  - Source: `src/services/openFoodFacts.ts`
  - Status: ✅ Fully integrated
  - Coverage: Global, country-specific, and local certifications
  - Data: Fairtrade, Organic, MSC, ASC, RSPO, RSPCA, Leaping Bunny, B-Corp, etc.

#### ✅ **Brand/Parent Company Data**
- **Brand Database** - `src/data/brandDatabase.ts`
  - Status: ✅ Fully integrated
  - Coverage: 500+ companies with parent-subsidiary relationships
  - Data: Ethical ratings, animal testing status, labor practices, recall history
- **Open Corporates API** - `src/services/openCorporatesApi.ts`
  - Status: ✅ Integrated (requires API key)
  - Coverage: Company relationships, parent-subsidiary data
  - Data: Company structure, incorporation details

#### ✅ **Animal Cruelty Data**
- **Brand Database** - Animal testing field
  - Status: ✅ Fully integrated
  - Coverage: 500+ companies
  - Data: Known animal testing companies, ethical ratings
- **Animal Cruelty Service** - `src/services/animalCrueltyService.ts`
  - Status: ✅ Fully integrated
  - Coverage: Known violation lists, brand database lookups
  - Data: Major/minor violations, brand-specific data

#### ✅ **Labor Violations Data**
- **Brand Database** - Labor practices field
  - Status: ✅ Fully integrated
  - Coverage: 500+ companies
  - Data: Labor practice ratings (excellent/good/fair/poor)
- **Labor Violations Service** - `src/services/laborViolationsService.ts`
  - Status: ✅ Fully integrated
  - Coverage: Known violation lists, brand database lookups
  - Data: Major/minor violations, brand-specific data
- **Buycott API** - `src/services/buycottApi.ts`
  - Status: ✅ Integrated (free tier available)
  - Coverage: Ethical product data
  - Data: Product ethical information, brand data
- **Open Corporates API** - `src/services/openCorporatesApi.ts`
  - Status: ✅ Integrated (requires API key)
  - Coverage: Company data
  - Data: Company structure, relationships

#### ✅ **Recalls Data**
- **FDA Recall API** - `src/services/fdaRecallService.ts`
  - Status: ✅ Fully integrated (FREE, no key required)
  - Coverage: US food recalls
  - Data: Recall details, dates, reasons, distribution
  - **Note:** ⚠️ Does NOT currently provide FDA Class (I/II/III) - needs enhancement
- **Comprehensive US Recalls** - `src/services/recallsGovService.ts`
  - Status: ✅ Fully integrated
  - Coverage: US recalls (broader than FDA)
  - Data: Recall details, dates, reasons
- **RASFF Alerts (EU)** - `src/services/rasffService.ts`
  - Status: ✅ Fully integrated
  - Coverage: EU food safety alerts
  - Data: Alert details, dates, reasons
- **CFIA Recalls (Canada)** - `src/services/cfiaRecallService.ts`
  - Status: ✅ Fully integrated
  - Coverage: Canadian food recalls
  - Data: Recall details, dates, reasons
- **FSANZ Database** - `src/services/fsanDatabase.ts`
  - Status: ✅ Fully integrated
  - Coverage: Australia/New Zealand food recalls
  - Data: Recall details, dates, reasons
- **UK FSA Database** - `src/services/ukFsaDatabase.ts`
  - Status: ✅ Fully integrated
  - Coverage: UK food recalls
  - Data: Recall details, dates, reasons
- **EFSA Database** - `src/services/efsaDatabase.ts`
  - Status: ✅ Fully integrated
  - Coverage: EU food safety data
  - Data: Safety assessments, alerts

### 3.2 Partially Available Databases

#### ⚠️ **DOL (US Department of Labor) Data**
- **Status:** ⚠️ Not currently integrated
- **Source:** DOL List of Goods Produced by Child Labor or Forced Labor
- **URL:** https://www.dol.gov/agencies/ilab/reports/child-labor/list-of-goods
- **Data Format:** PDF/Excel reports (annual updates)
- **Integration Required:**
  - Download and parse annual reports
  - Create lookup service
  - Map to brand/product data
- **Priority:** HIGH (for labor violations 3-tier system)

#### ⚠️ **Ethical Consumer Data**
- **Status:** ⚠️ Not currently integrated
- **Source:** Ethical Consumer magazine/website
- **URL:** https://www.ethicalconsumer.org/
- **Data Format:** Website scraping or subscription API (if available)
- **Integration Required:**
  - Check for API availability
  - If no API, web scraping (with permission)
  - Map to brand/product data
- **Priority:** MEDIUM (for animal cruelty sources)

#### ⚠️ **ASPCA Data**
- **Status:** ⚠️ Not currently integrated
- **Source:** ASPCA (American Society for the Prevention of Cruelty to Animals)
- **URL:** https://www.aspca.org/
- **Data Format:** Website/publications
- **Integration Required:**
  - Check for API availability
  - If no API, web scraping (with permission)
  - Map to brand/product data
- **Priority:** MEDIUM (for animal cruelty sources)

### 3.3 Not Available (Requires Manual Integration)

#### ❌ **BBFAW (Business Benchmark on Farm Animal Welfare)**
- **Status:** ❌ No public API available
- **Source:** Business Benchmark on Farm Animal Welfare
- **URL:** https://www.bbfaw.com/
- **Data Format:** Annual reports (PDF/Excel), website data
- **Integration Options:**
  1. **Manual Download:** Download annual benchmark reports
  2. **Web Scraping:** Scrape website data (with permission)
  3. **Contact BBFAW:** Request data access or partnership
  4. **Email:** secretariat@bbfaw.com
- **Priority:** MEDIUM (for animal cruelty 3-tier system)
- **Note:** BBFAW provides tier classifications (1-6) that map to Limited/Moderate/Major violations

#### ❌ **Walk Free Global Slavery Index**
- **Status:** ❌ No public API available
- **Source:** Walk Free Foundation
- **URL:** https://www.walkfree.org/projects/the-global-slavery-index/
- **Data Format:** Dataset downloads (CSV/Excel), annual reports
- **Integration Options:**
  1. **Dataset Download:** Request access to GSI 2023 dataset
  2. **Data Use License:** Review and agree to Global Slavery Index Data Use Licence
  3. **Manual Processing:** Download and process dataset according to requirements
  4. **Contact Walk Free:** Request integration support
- **Priority:** HIGH (for labor violations 3-tier system)
- **Note:** Walk Free provides country-level and company-level modern slavery data

#### ❌ **X/Reuters News API**
- **Status:** ❌ Not currently integrated
- **Source:** X (Twitter) API, Reuters API
- **Integration Options:**
  1. **X API:** Requires API key, rate limits apply
  2. **Reuters API:** May require subscription/license
  3. **News Aggregation Services:** Consider using news aggregation APIs (NewsAPI, etc.)
- **Priority:** LOW (for news/sentiment banner alerts, no score impact)
- **Note:** Excel spec indicates news mentions should NOT affect score, only shown as banner alerts

#### ❌ **ILO Labor Standards Data**
- **Status:** ❌ Not currently integrated
- **Source:** International Labour Organization (ILO)
- **URL:** https://www.ilo.org/
- **Data Format:** Reports, databases, API (if available)
- **Integration Options:**
  1. **Check ILO API:** Investigate if ILO provides public API
  2. **Manual Download:** Download relevant reports/databases
  3. **Contact ILO:** Request data access
- **Priority:** MEDIUM (for labor violations sources)

#### ❌ **Oxfam Behind the Brands**
- **Status:** ❌ Not currently integrated
- **Source:** Oxfam (campaign ended, but data may be archived)
- **URL:** https://www.behindthebrands.org/ (may be archived)
- **Data Format:** Website data (may be archived)
- **Integration Options:**
  1. **Archive Access:** Check if data is archived
  2. **Contact Oxfam:** Request archived data
- **Priority:** LOW (campaign ended, may not have current data)

---

## Part 4: Database Requirements Summary

### 4.1 Critical Requirements (Must Have for Excel Spec Compliance)

| Database | Status | Priority | Integration Complexity | Notes |
|----------|--------|----------|----------------------|-------|
| **FDA Class Data** | ⚠️ Partial | **CRITICAL** | Low | Enhance existing FDA API integration to extract Class I/II/III |
| **DOL Data** | ❌ Missing | **HIGH** | Medium | Download and parse annual reports |
| **Walk Free GSI** | ❌ Missing | **HIGH** | Medium | Download dataset, process according to license |

### 4.2 Important Requirements (Should Have for Complete Implementation)

| Database | Status | Priority | Integration Complexity | Notes |
|----------|--------|----------|----------------------|-------|
| **BBFAW Data** | ❌ Missing | **MEDIUM** | Medium | Manual download or web scraping |
| **Ethical Consumer** | ❌ Missing | **MEDIUM** | Medium | Check for API, otherwise web scraping |
| **ASPCA Data** | ❌ Missing | **MEDIUM** | Low | Check for API, otherwise web scraping |
| **ILO Data** | ❌ Missing | **MEDIUM** | Medium | Check for API availability |

### 4.3 Nice to Have (Future Enhancements)

| Database | Status | Priority | Integration Complexity | Notes |
|----------|--------|----------|----------------------|-------|
| **X/Reuters News** | ❌ Missing | **LOW** | High | For banner alerts only (no score impact) |
| **Oxfam Behind the Brands** | ❌ Missing | **LOW** | Low | Campaign ended, may be archived |

---

## Part 5: Implementation Recommendations

### Phase 1: Critical Fixes (HIGH PRIORITY) - Excel Spec Compliance

#### 1. Implement 3-Tier Recall System
- **Add:** FDA Class (I/II/III) detection
- **Update:** Penalties: Class I = -15, Class II = -8, Class III = -4
- **Change:** Time window from 12 months to 3 months
- **Files:** `src/lib/truscoreEngine/pillars/carePillar.ts`, `src/services/fdaRecallService.ts`
- **Database:** Enhance FDA API integration to extract Class data
- **Complexity:** Low-Medium

#### 2. Implement Mutually Exclusive Logic
- **Add:** Only apply brand overlay if product doesn't have violation
- **Files:** `src/lib/truscoreEngine/pillars/carePillar.ts`
- **Complexity:** Low

#### 3. Integrate DOL Data
- **Add:** DOL List of Goods integration
- **Files:** New service file `src/services/dolLaborDataService.ts`
- **Database:** Download and parse DOL annual reports
- **Complexity:** Medium

#### 4. Integrate Walk Free GSI Data
- **Add:** Walk Free Global Slavery Index integration
- **Files:** New service file `src/services/walkFreeService.ts`
- **Database:** Download and process GSI dataset
- **Complexity:** Medium

### Phase 2: Tier System Refinements (MEDIUM PRIORITY)

#### 5. Implement 3-Tier Animal Cruelty System
- **Update:** Limited = -4, Moderate = -8, Major = -15
- **Add:** BBFAW tier integration (if data available)
- **Files:** `src/services/animalCrueltyService.ts`, `carePillar.ts`
- **Database:** BBFAW data (manual download or web scraping)
- **Complexity:** Medium

#### 6. Implement 3-Tier Labor Violations System
- **Update:** Limited = -4, Moderate = -8, Major = -15
- **Files:** `src/services/laborViolationsService.ts`, `carePillar.ts`
- **Complexity:** Low-Medium

### Phase 3: Certification Enhancements (MEDIUM PRIORITY)

#### 7. Add Missing Certifications
- **Add:** Ocean Wise (+5), Friend of the Sea (+4), GlobalG.A.P (+4)
- **Files:** `carePillar.ts`
- **Complexity:** Low

#### 8. Refine Animal Welfare Certifications
- **Separate:** Cage-Free (+1), Free-Range (+3), Free-Roaming (+5)
- **Files:** `carePillar.ts`
- **Complexity:** Low

### Phase 4: Additional Data Sources (LOW PRIORITY)

#### 9. Integrate Ethical Consumer Data
- **Files:** New service file `src/services/ethicalConsumerService.ts`
- **Complexity:** Medium

#### 10. Integrate ASPCA Data
- **Files:** New service file `src/services/aspcaService.ts`
- **Complexity:** Low-Medium

#### 11. News/Sentiment Banner Alerts
- **Add:** Banner alerts for news mentions (no score impact)
- **Files:** New service, UI components
- **Complexity:** High

---

## Part 6: Questions for Clarification

Before implementing changes, I need clarification on:

### 1. **Violation Tier System**
   - **Question:** Should we implement 3-tier system (Limited/Moderate/Major) or keep 2-tier (Minor/Major)?
   - **Excel:** 3-tier with -4/-8/-15
   - **Current:** 2-tier with -5/-15
   - **Impact:** More nuanced scoring, but requires more data sources

### 2. **Mutually Exclusive Logic**
   - **Question:** Should brand/parent overlay be mutually exclusive with product penalties?
   - **Excel:** "No deduct if product hits"
   - **Current:** Applies both
   - **Impact:** Prevents double-penalty, but may reduce accountability

### 3. **Recall Time Window**
   - **Question:** Should we change from 12 months to 3 months?
   - **Excel:** 3 months
   - **Current:** 12 months
   - **Impact:** Shorter window, more recent focus, but may miss important recalls

### 4. **Recall Severity Classification**
   - **Question:** Do we have access to FDA Class (I/II/III) data from our recall APIs?
   - **Excel:** Uses FDA Class system
   - **Current:** Uniform -10
   - **Impact:** More accurate scoring, but requires API enhancement
   - **Note:** Need to check if FDA API provides Class data

### 5. **BBFAW Tier Integration**
   - **Question:** Should we integrate BBFAW tier system for animal cruelty classification?
   - **Excel:** Uses BBFAW tiers
   - **Current:** Not integrated
   - **Impact:** More defensible scoring, but requires manual data integration
   - **Note:** No public API available, requires manual download

### 6. **News/Sentiment Integration**
   - **Question:** Should we implement news/sentiment banner alerts (no score impact)?
   - **Excel:** "Semantic/news carved to banners only... no score hit to mitigate fake news"
   - **Current:** Not implemented
   - **Impact:** User awareness without score manipulation
   - **Note:** Complex to implement, requires external APIs

### 7. **Animal Welfare Granularity**
   - **Question:** Should we separate Cage-Free (+1), Free-Range (+3), and Free-Roaming (+5)?
   - **Current:** Combined Cage-Free/Free-Range = +4
   - **Excel:** More granular scoring
   - **Impact:** More accurate ethical scoring, but requires better label detection

---

## Part 7: Next Steps

### Immediate Actions (Before Implementation)

1. **Review Excel Specification**
   - ✅ Completed - Full analysis done
   - ✅ Extracted to JSON format

2. **Clarify Questions**
   - ⏳ Pending - Need stakeholder input on questions above

3. **Prioritize Implementation Phases**
   - ⏳ Pending - Based on stakeholder feedback

4. **Obtain Database Access**
   - ⏳ Pending - DOL data, Walk Free GSI, BBFAW data
   - ⏳ Pending - Check FDA API for Class data

### Implementation Phases

**Phase 1 (Critical):** Excel spec compliance
- 3-tier recall system
- Mutually exclusive logic
- DOL and Walk Free integration

**Phase 2 (Important):** Tier system refinements
- 3-tier animal cruelty
- 3-tier labor violations

**Phase 3 (Enhancements):** Certification improvements
- Missing certifications
- Animal welfare granularity

**Phase 4 (Future):** Additional data sources
- Ethical Consumer, ASPCA
- News/sentiment alerts

---

## Summary

### Current State
- ✅ **Well-structured codebase** with modular pillar system
- ✅ **Comprehensive existing databases** (brand database, recall APIs, etc.)
- ✅ **Good foundation** for CARE Pillar implementation
- ⚠️ **~75% aligned** with Excel specification

### Required Changes
1. **Critical:** 3-tier recall system, mutually exclusive logic, DOL/Walk Free integration
2. **Important:** 3-tier violation systems, missing certifications
3. **Enhancements:** Animal welfare granularity, additional data sources

### Database Access Status
- ✅ **Available:** Buycott, Open Corporates, Brand Database, Recall APIs
- ⚠️ **Partially Available:** DOL (needs integration), Ethical Consumer (needs integration)
- ❌ **Not Available:** BBFAW API (manual download), Walk Free API (dataset download), X/Reuters (needs integration)

### Ready for Implementation
- ✅ **Code analysis complete**
- ✅ **Specification understood**
- ✅ **Gaps identified**
- ⏳ **Awaiting stakeholder clarification** on questions above
- ⏳ **Awaiting database access** for DOL, Walk Free, BBFAW

---

**Document Version:** 1.0  
**Last Updated:** January 2025  
**Status:** ✅ Ready for Stakeholder Review & Implementation Planning

