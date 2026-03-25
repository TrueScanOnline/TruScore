# TruScore Code Analysis Framework

## Current Implementation Analysis

Based on the code in `src/lib/truscoreEngine.ts`, here's what I can analyze:

### Current TruScore v1.4 Implementation

#### Structure
- **4 Pillars**: Body, Planet, Care, Open (25 points each = 100 total)
- **Version**: v1.4 (as of Nov 2025)
- **Performance**: <150ms execution, offline-first

#### Body Pillar (25pts) - Current Implementation

**Base Score:**
- Nutri-Score A = 25, B = 20, C = 15, D = 10, E = 5
- No Nutri-Score = baseline 12

**Penalties:**
- Additives: Weighted by safety (safe: -0.5, caution: -1.5, avoid: -3, cap -15)
- Country-specific additive penalties (restricted/banned)
- Risky tags: -4 each (carcinogenic, endocrine, allergen, irritant, ewg-high-hazard)
- EWG Skin Deep: High hazard (7-10) = -5, Moderate (4-6) = -3, Low (1-3) = -1
- Irritants block: -10 (paraben, phthalate, sulfate, triclosan, formaldehyde, peg, silicone, phenoxyethanol)
- Fragrance: -10 (parfum, fragrance, aroma)

**Bonuses:**
- NOVA 1 (unprocessed): +3
- NOVA 2 (minimally processed): +1

**Penalties:**
- NOVA 3 (processed): -5
- NOVA 4 (ultra-processed): -10

#### Planet Pillar (25pts) - Current Implementation

**Base Score:**
- Eco-Score A = 25, B = 20, C = 15, D = 10, E = 5
- No Eco-Score = baseline 12

**Penalties:**
- Palm oil (non-certified): -10
- Palm oil (certified sustainable): -5

**Bonuses:**
- All packaging recyclable (local laws): +5
- Some packaging recyclable (local laws): +2

#### Ethics Pillar (25pts) - Current Implementation

**Base Score:**
- 18 (absence of known cruelty)

**Bonuses:**
- Fair-trade: +8
- Organic (regional): +8
- Rainforest Alliance: +7
- MSC/ASC/Dolphin-safe: +8
- RSPCA: +6
- Vegan/Cruelty-free: +10
- UTZ: +7
- B-Corp: +5
- Non-GMO Project: +3

**Penalties:**
- Cruel parent: -30

#### Open Pillar (25pts) - Current Implementation

**Base Score:**
- 25 (full transparency assumed)

**Penalties:**
- Hidden terms (1-2): -12
- Hidden terms (≥3): -20
- No ingredients: -20 (sets to 5)
- Placeholder ingredients: -20 (sets to 5)
- No origin: -15
- Placeholder origin: -15

---

## Analysis Framework for PDF Comparison

### Questions to Answer from PDFs:

1. **Body Pillar:**
   - [ ] Are the Nutri-Score conversions correct? (A=25, B=20, C=15, D=10, E=5)
   - [ ] Is baseline 12 correct when no Nutri-Score?
   - [ ] Are additive penalties correct? (safe: -0.5, caution: -1.5, avoid: -3)
   - [ ] Is the -15 cap on additive penalties correct?
   - [ ] Are risky tag penalties correct? (-4 each)
   - [ ] Are NOVA bonuses/penalties correct? (1=+3, 2=+1, 3=-5, 4=-10)
   - [ ] Are irritant and fragrance penalties correct? (-10 each)

2. **Planet Pillar:**
   - [ ] Are Eco-Score conversions correct? (A=25, B=20, C=15, D=10, E=5)
   - [ ] Is baseline 12 correct when no Eco-Score?
   - [ ] Are palm oil penalties correct? (non-certified: -10, certified: -5)
   - [ ] Are recyclability bonuses correct? (all: +5, some: +2)

3. **Ethics Pillar:**
   - [ ] Is base score 18 correct?
   - [ ] Are certification bonuses correct?
     - Fair-trade: +8?
     - Organic: +8?
     - Rainforest Alliance: +7?
     - MSC/ASC/Dolphin-safe: +8?
     - RSPCA: +6?
     - Vegan/Cruelty-free: +10?
     - UTZ: +7?
     - B-Corp: +5?
     - Non-GMO: +3?
   - [ ] Is cruel parent penalty -30 correct?

4. **Open Pillar:**
   - [ ] Is base score 25 correct?
   - [ ] Are hidden term penalties correct? (1-2: -12, ≥3: -20)
   - [ ] Is no ingredients penalty correct? (-20, sets to 5)
   - [ ] Is no origin penalty correct? (-15)

5. **General:**
   - [ ] Are there any missing scoring factors?
   - [ ] Are there any incorrect calculations?
   - [ ] Are there any methodology changes needed?
   - [ ] Are there any new data sources to integrate?

---

## Next Steps

1. **Extract PDF Content:**
   - Open both PDFs
   - Copy key sections (especially scoring formulas, penalties, bonuses)
   - Paste into this document or provide separately

2. **Compare Section by Section:**
   - Body Pillar specifications vs. implementation
   - Planet Pillar specifications vs. implementation
   - Ethics Pillar specifications vs. implementation
   - Open Pillar specifications vs. implementation

3. **Create Gap Analysis:**
   - What's missing in current code?
   - What's incorrect in current code?
   - What needs to be updated?

4. **Implementation Plan:**
   - Prioritize fixes
   - Update code
   - Test changes

---

## Current Code Location

- **Main Engine**: `src/lib/truscoreEngine.ts`
- **Wrapper**: `src/utils/trustScore.ts`
- **UI Component**: `src/components/TruScore.tsx`
- **Info Modal**: `src/components/TrustScoreInfoModal.tsx`

---

**Please provide the PDF content or key sections, and I'll create a detailed comparison analysis.**
