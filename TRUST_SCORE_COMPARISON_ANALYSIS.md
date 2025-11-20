# Trust Score System Comparison Analysis
## Proposed 4-Pillar vs Current 5-Pillar System

**Date:** January 2025  
**Purpose:** Evaluate which Trust Score system best serves user needs, data availability, and implementation feasibility

---

## Executive Summary

**Recommendation: HYBRID APPROACH** - Combine the best elements of both systems:
- Use **Nutri-Score** from OFF (more recognized than custom calculation)
- Keep **5-pillar structure** (more granular, better transparency)
- Add **geopolitical flags** as optional/toggleable feature
- Maintain **Transparency** pillar (critical for data integrity)
- Enhance **Processing** pillar visibility

---

## Detailed Comparison

### 1. BODY (Proposed) vs NUTRITION + PROCESSING (Current)

| Aspect | Proposed "Body" (25%) | Current System | Winner |
|--------|----------------------|----------------|--------|
| **Primary Metric** | Nutri-Score (A=25 → E=0) | Custom nutrition calculation (0-100) | **Proposed** - Nutri-Score is recognized standard |
| **Data Source** | `nutriscore_grade` from OFF | `nutriments`, `nutrient_levels` from OFF | **Proposed** - Simpler, more reliable |
| **Coverage** | 90-95% food products | 90-95% food products | **Tie** |
| **Additives** | High-risk additives (EFSA/EWG flagged) | Additive count (simple) | **Proposed** - More sophisticated |
| **Allergens** | Top 14 + user-custom | Basic allergen tags | **Proposed** - More comprehensive |
| **Processing** | Not included in Body | Separate Processing pillar (15%) | **Current** - Processing deserves separate attention |
| **Irritants/Endocrine Disruptors** | Included for cosmetics | Not explicitly tracked | **Proposed** - Better for cosmetics |

**Analysis:**
- ✅ **Proposed wins** for using Nutri-Score (recognized standard)
- ✅ **Proposed wins** for better additive/allergen handling
- ❌ **Current wins** for separate Processing pillar (NOVA is important)
- ❌ **Current wins** for more granular breakdown

**Recommendation:** Use Nutri-Score for Nutrition, but keep Processing as separate pillar

---

### 2. PLANET (Proposed) vs SUSTAINABILITY (Current)

| Aspect | Proposed "Planet" (25%) | Current System | Winner |
|--------|------------------------|----------------|--------|
| **Primary Metric** | Eco-Score (A=25 → E=0) | Eco-Score (A=100, B=80, C=60, D=40, E=20) | **Tie** - Same data, different scaling |
| **Data Source** | `ecoscore_grade`, `ecoscore_data` | `ecoscore_grade`, `ecoscore_data` | **Tie** |
| **Coverage** | 70-80% food, 30-50% cosmetics | 70-80% food, 30-50% cosmetics | **Tie** |
| **Palm Oil** | Explicit palm-oil risk scoring | Included in sustainability | **Tie** - Both handle it |
| **Packaging** | Recyclability score | Basic recyclable check | **Proposed** - More detailed |
| **Carbon/Water/Biodiversity** | Explicit penalties | Included in Eco-Score | **Tie** - Both use same data |

**Analysis:**
- ✅ **Tie** - Both systems use same Eco-Score data effectively
- ✅ **Proposed** has slightly better packaging scoring
- ✅ **Current** already extracts all LCA data (CO2, water, land use, biodiversity)

**Recommendation:** Keep current Sustainability approach, enhance packaging scoring

---

### 3. CARE (Proposed) vs ETHICS (Current)

| Aspect | Proposed "Care" (25%) | Current System | Winner |
|--------|----------------------|----------------|--------|
| **Primary Focus** | People & animals | Fair trade, animal welfare, labor | **Tie** - Same concepts |
| **Data Source** | `labels_tags` from OFF | `labels_tags` via `formatCertifications()` | **Tie** |
| **Coverage** | 85-90% where labels exist | 85-90% where labels exist | **Tie** |
| **Positive Labels** | Fairtrade, Organic, MSC, etc. | Same certifications | **Tie** |
| **Negative Flags** | Factory farming, child labor risk | Not explicitly tracked | **Proposed** - More comprehensive |
| **Brand Blacklist** | Internal JSON for known bad actors | Not implemented | **Proposed** - Important feature |

**Analysis:**
- ✅ **Tie** for positive certifications (both use same data)
- ✅ **Proposed wins** for negative flags and brand blacklist
- ✅ **Proposed** has better terminology ("Care" is warmer than "Ethics")

**Recommendation:** Adopt "Care" terminology, add negative flags and brand blacklist

---

### 4. VALUES (Proposed) vs NOT IN CURRENT SYSTEM

| Aspect | Proposed "Values" (25%) | Current System | Winner |
|--------|------------------------|----------------|--------|
| **Geopolitical Flags** | BDS, Russia/Ukraine, Uyghur forced labor | Not implemented | **Proposed** - New feature |
| **Data Source** | Internal JSON/DB (~1,000 brands) | N/A | **Proposed** |
| **Coverage** | 100% for top 5,000 brands | 0% | **Proposed** |
| **User Toggle** | Toggleable modules | N/A | **Proposed** - Smart UX |
| **Virality Potential** | High (controversial = shareable) | Low | **Proposed** |
| **Risk** | High (could alienate users) | None | **Current** - Lower risk |

**Analysis:**
- ✅ **Proposed** adds significant new functionality
- ⚠️ **High risk** - Geopolitical content is controversial
- ✅ **User toggle** mitigates risk
- ✅ **High virality** potential (users share values-based content)

**Recommendation:** Implement as **OPTIONAL** feature with clear user controls

---

### 5. TRANSPARENCY (Current Only)

| Aspect | Current "Transparency" (15%) | Proposed System | Winner |
|--------|---------------------------|-----------------|--------|
| **Purpose** | Data completeness scoring | Not included | **Current** - Critical for integrity |
| **Measures** | Product name, brand, image, ingredients, nutrition, origin, certifications | N/A | **Current** |
| **Value** | Prevents showing scores with insufficient data | N/A | **Current** - Essential |

**Analysis:**
- ✅ **Current system wins** - Transparency is critical for data integrity
- ✅ **Prevents misinformation** - Only shows scores when data is sufficient
- ❌ **Proposed system** doesn't account for data quality

**Recommendation:** **KEEP Transparency pillar** - It's essential for trust

---

## Data Source Comparison

### Open Food Facts Coverage

| Data Field | Proposed System | Current System | Availability |
|------------|----------------|----------------|--------------|
| Nutri-Score | ✅ Uses `nutriscore_grade` | ❌ Custom calculation | 90-95% food |
| Eco-Score | ✅ Uses `ecoscore_grade` | ✅ Uses `ecoscore_grade` | 70-80% food |
| Additives | ✅ High-risk flagged | ⚠️ Simple count | 90%+ food |
| Allergens | ✅ Top 14 + custom | ✅ Basic tags | 90%+ food |
| Certifications | ✅ `labels_tags` | ✅ `labels_tags` | 85-90% |
| Palm Oil | ✅ Explicit analysis | ✅ Included | 95%+ |
| Packaging | ✅ Recyclability score | ⚠️ Basic check | 80-90% |
| NOVA | ❌ Not separate | ✅ Separate pillar | 70-80% food |

**Analysis:** Both systems use same data sources, but proposed has better utilization of Nutri-Score and more sophisticated additive/allergen handling.

---

## Implementation Complexity

### Proposed 4-Pillar System
- **Complexity:** Medium-High
- **New Features:**
  - Nutri-Score integration (easy - OFF has it)
  - High-risk additive database (medium - need EFSA/EWG data)
  - Brand blacklist (medium - need to maintain JSON)
  - Geopolitical flags (high - controversial, needs careful UX)
  - User toggle system (medium - new settings UI)

### Current 5-Pillar System
- **Complexity:** Medium
- **Already Implemented:**
  - ✅ Eco-Score integration
  - ✅ Certification parsing
  - ✅ Palm oil analysis
  - ✅ Packaging data
  - ✅ NOVA classification
  - ✅ Transparency scoring

**Analysis:** Current system is already implemented. Proposed adds significant new features but also adds complexity and risk.

---

## User Experience Comparison

### Proposed 4-Pillar System
**Pros:**
- ✅ Simpler (4 vs 5 pillars)
- ✅ "Body" is more intuitive than "Nutrition"
- ✅ "Care" is warmer than "Ethics"
- ✅ "Values" enables personalization
- ✅ Nutri-Score is recognized standard

**Cons:**
- ❌ No Transparency pillar (users don't know data quality)
- ❌ Processing merged into Nutrition (less granular)
- ❌ Geopolitical content is risky
- ❌ Requires user to configure toggles

### Current 5-Pillar System
**Pros:**
- ✅ More granular (5 dimensions)
- ✅ Transparency shows data quality
- ✅ Processing is separate (important for health)
- ✅ No controversial content
- ✅ Already implemented and tested

**Cons:**
- ❌ "Ethics" is less warm than "Care"
- ❌ Custom nutrition calculation vs Nutri-Score
- ❌ No geopolitical flags (missed virality opportunity)
- ❌ No negative brand flags

---

## Recommended Hybrid Approach

### Optimal 5-Pillar System

1. **Body Safety (25%)** - Rename from "Nutrition"
   - Use **Nutri-Score** (A=25 → E=0) from OFF
   - High-risk additives (EFSA/EWG flagged)
   - Top 14 allergens + user-custom
   - Irritants/endocrine disruptors (cosmetics)

2. **Planet (25%)** - Rename from "Sustainability"
   - Eco-Score (A=25 → E=0)
   - Palm oil risk
   - Packaging recyclability score
   - Carbon/water/biodiversity (already extracted)

3. **Care (25%)** - Rename from "Ethics"
   - Positive certifications (Fairtrade, Organic, MSC, etc.)
   - Negative flags (factory farming, child labor risk)
   - Brand blacklist (known bad actors)
   - Animal welfare

4. **Processing (15%)** - Keep separate
   - NOVA classification (1-4)
   - Additive count
   - Ingredient list length
   - Processing level indicators

5. **Transparency (10%)** - Reduce weight slightly
   - Data completeness
   - Origin information
   - Ingredient list availability
   - Certification data

### Optional Feature: Values Module
- **Geopolitical flags** (BDS, Russia/Ukraine, Uyghur forced labor)
- **User-toggleable** (off by default, opt-in)
- **Separate from Trust Score** (shown as additional info, not in calculation)
- **High virality** without alienating users

---

## Implementation Roadmap

### Phase 1: Quick Wins (Week 1)
1. ✅ Switch to Nutri-Score for Nutrition/Body pillar
2. ✅ Rename "Ethics" → "Care"
3. ✅ Rename "Sustainability" → "Planet"
4. ✅ Enhance packaging recyclability scoring
5. ✅ Add high-risk additive detection

### Phase 2: Enhancements (Week 2-3)
1. ⚠️ Add brand blacklist (internal JSON)
2. ⚠️ Add negative flags (factory farming, child labor)
3. ⚠️ Improve allergen handling (top 14 + custom)
4. ⚠️ Add irritants/endocrine disruptors for cosmetics

### Phase 3: Optional Features (Week 4+)
1. 🔄 Geopolitical flags module (user-toggleable)
2. 🔄 User customization (allergen preferences, value filters)
3. 🔄 Enhanced negative flag database

---

## Risk Assessment

| Feature | Risk Level | Mitigation |
|---------|-----------|------------|
| Nutri-Score adoption | Low | OFF provides it, well-tested |
| Brand blacklist | Medium | Need to maintain, legal considerations |
| Negative flags | Medium | Need reliable data sources |
| Geopolitical flags | **High** | User toggle, opt-in, clear disclaimers |
| Terminology changes | Low | Just UI text changes |

---

## Final Recommendation

**HYBRID APPROACH:**
1. **Adopt Nutri-Score** (better than custom calculation)
2. **Keep 5-pillar structure** (more granular, includes Transparency)
3. **Rename pillars** (Body, Planet, Care, Processing, Transparency)
4. **Add negative flags** (factory farming, child labor)
5. **Add brand blacklist** (known bad actors)
6. **Add Values as optional module** (geopolitical flags, user-toggleable, separate from Trust Score)

**Why This Works:**
- ✅ Best of both systems
- ✅ Maintains data integrity (Transparency pillar)
- ✅ Uses recognized standards (Nutri-Score, Eco-Score)
- ✅ Adds virality without alienating users (optional Values)
- ✅ More granular than 4-pillar (better user understanding)
- ✅ Lower risk than full 4-pillar adoption

**Next Steps:**
1. Implement Phase 1 (quick wins)
2. Test with users
3. Iterate based on feedback
4. Add optional features gradually

