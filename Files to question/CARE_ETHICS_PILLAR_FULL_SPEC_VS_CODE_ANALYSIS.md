# CARE / ETHICS Pillar – Full Specification vs Code Analysis

**Purpose:** Entire review and analysis of the CARE Pillar (Ethics Pillar) against the current app code and against the specification documents, with extensive explanation for each of rows 35–40. CARE and ETHICS refer to the same pillar (name was changed from CARE to ETHICS; code and docs may use either term).

---

## Specification Documents Used

| Document | Location | How used |
|----------|----------|----------|
| **Care_Scoring_Specification_v32** | `Files to question\Care_Scoring_Specification_32_Cursor_Submit 1(Care_Scoring_Specification_v32).csv` | Primary spec. Rows 35–40 define: Base Score, Certifications, Animal Cruelty, Labor Violations, Recalls, Overall Pillar Cap. Content extracted from the RTF-style CSV. |
| **ETHICS Pillar.xlsx** | `Spec documents\ETHICS Pillar.xlsx` (and/or `TruScore logic\ETHICS Pillar.xlsx` per project script) | The .xlsx file is binary and was not read directly. Its content is taken from existing project analyses that were derived from it: **ETHICS_PILLAR_SPEC_ANALYSIS.md**, **CARE_PILLAR_EXCEL_SPEC_ANALYSIS.md**, and **CARE_PILLAR_SPEC_EXTRACTED.json**. Those documents state they were sourced from `TruScore logic/ETHICS Pillar.xlsx`. The Excel spec aligns with the v32 CSV on scoring values and decision trees; where both exist, the CSV v32 is the row-by-row source below. |

**Implementation:** Ethics pillar logic lives in `src/lib/truscoreEngine/pillars/ethicsPillar.ts`. Supporting code: `bbfawService.ts`, `laborViolationsService.ts`, `brandMatchingService.ts`, `brandDatabase.ts`, `brandExtraction.ts`, `productDataMerger.ts` (labels), `productService.ts` (recalls), `bannerAlertsService.ts`, `truscoreEngine/index.ts`, `trustScore.ts`.

---

## 1. How the Ethics Pillar Is Invoked (Data Flow)

1. **Product assembly:**  
   `productService.ts` or `productServiceOptimized.ts` fetches and merges products (including `productDataMerger.mergeProducts()`). The merged product gets `labels_tags` as the **union** of all sources’ `labels_tags` (no cert-specific source priority in merger).  
   **Recalls** are attached in `productService.ts` (lines ~820–912): FDA, USDA FSIS, CPSC (US), RASFF (EU), UK FSA (UK), CFIA (CA), with a 2s timeout; results are written to `product.recalls` with `classification` (Class I/II/III) and `url`.

2. **TruScore calculation:**  
   `calculateTrustScore(product)` in `trustScore.ts` calls `calculateTruScore(product)` in `lib/truscoreEngine/index.ts`.  
   `calculateTruScore` (lines 61–204) calls `calculateEthicsPillar(product)` (line 107) and receives `EthicsPillarResult` (score, base, adjustments, details).

3. **Inputs to Ethics pillar:**  
   The same merged product is passed to `calculateEthicsPillar`. So the pillar sees:
   - **labels_tags:** From merger (union across OFF, gov, etc.).
   - **brands / brand_owner / brands_tags / brand_owner_tags:** From product (and brand extraction from name).
   - **recalls:** From product (already attached by productService with classification and date).

4. **Pillar output:**  
   Score 0–25, adjustments list, and details (certificationBonus, animalCrueltyAdjustment, laborViolationPenalty, recallPenalty, brandOverlayPenalty). The result is used in the overall TruScore breakdown (Body + Planet + Ethics + Open) and in pillar details for UI/logging.

5. **Banner alerts (scoring neutral):**  
   `bannerAlertsService.generateBannerAlerts()` uses the same product and calls `checkLaborViolations` and `checkAnimalCruelty` (and recall data) to show alerts; it does not change the Ethics score.

---

## 2. Row 35 – Base Score

### 2.1 Spec (CSV v32 row 35)

| Column | Content |
|--------|---------|
| Data Element | Base Score |
| Positive Statement | Slightly positive neutral; assumes ethical till violations |
| Dimensions / Measures | Internal Logic (No external source) |
| What it is & why | Scaled HSUS/RSPCA avg ~50/100 (2025 welfare); optimistic fair to indies |
| Data Point | N/A |
| Scoring Conversion | 15 (uniform) |
| Explanation | Uniform 15 consistency; HSUS defends without negativity; fair to indies avoids X backlash on bias. No data = neutral, prompt user subs for gaps. |
| Decision Tree | 1. Always starting point; adjustments added/subtracted. |

Excel spec (from ETHICS_PILLAR_SPEC_ANALYSIS.md): Same – 15 (uniform), always starting point.

**What this means in practice:** Every product starts with an Ethics score of 15 before any certifications or violations are applied. The spec deliberately avoids a negative default so that “no data” is neutral and small brands are not penalised by default; any deductions come only from identified violations or from brand/parent overlay. The “prompt user subs for gaps” is a product/UX requirement (e.g. invite users to contribute when data is missing), not a scoring rule inside the pillar.

### 2.2 Code Interrogation

- **File:** `src/lib/truscoreEngine/pillars/ethicsPillar.ts`  
- **Lines 69–70:** `let score = 15; const base = 15;`  
- **Lines 107–111:** First adjustment pushed: `description: 'Base score (assumes ethical until violations)'`, `value: 0`, `type: 'neutral'`.  
- All later logic (certs, animal, labor, recalls, overlay) adds or subtracts from `score`; base 15 is never overwritten.

### 2.3 Alignment and Gaps

- **Alignment:** Base score is 15 (uniform) and is the single starting point; wording matches “assumes ethical until violations.”  
- **Gap (non-blocking):** Spec says “No data = neutral, prompt user subs for gaps.” Prompting for user submissions is a UX/contribution flow, not implemented inside the pillar; the pillar does not trigger prompts. No code change required in the pillar.

---

## 3. Row 36 – Certifications

### 3.1 Spec (CSV v32 row 36)

| Column | Content |
|--------|---------|
| Data Element | Certifications |
| Positive Statement | Ethical certifications; fair treatment |
| Dimensions / Measures | Fairtrade Intl, ACO (AU), USDA Organic, EU Organic (EFSA), IFOAM, Rainforest Alliance, UTZ, MSC/ASC, Ocean Wise, Friend of the Sea, RSPCA/Leaping Bunny/B Corp, GlobalG.A.P, Cage-Free, Free-Range, Free-Roaming > labels_tags (stack cap +15) |
| Data Point | labels_tags (array filtered for match) |
| Scoring Conversion | Fairtrade=+8, Organic=+7, Rainforest/UTZ=+6, MSC/ASC=+6, Ocean Wise=+5, Friend of the Sea=+4, RSPCA/Leaping Bunny/B Corp=+5, GlobalG.A.P=+4, Free-Roaming=+5, Free-Range=+3, Cage-Free=+1 (stack cap +15) |
| Explanation | Fuzzy match >80% on labels for variants. Geo certs universal. Tiered animal welfare (Cage-Free +1, Free-Range +3, Free-Roaming +5) and fishing (MSC/ASC +6, Ocean Wise +5, Friend of the Sea +4). |
| Decision Tree | 1. Primary cert orgs > 2. Local govt certs (e.g. ACO AU) > 3. Country OFF > 4. Global OFF; stack cap +15; geo certs universal. User subs if no data. |

**What this means in practice:** Certifications are the main positive lever for the Ethics pillar. The spec lists every certification and its point value; multiple certs stack but the total bonus is capped at +15. Labels are expected from OFF and/or government/primary cert sources; when the same cert appears from more than one source, the decision tree says to prefer primary cert orgs over local govt over OFF. “Geo certs universal” means a certification (e.g. EU Organic) scores the same regardless of where the user scans; there is no geographic discount. Fuzzy match >80% is for matching label variants (e.g. spelling or tag format differences).

### 3.2 Code Interrogation

- **File:** `src/lib/truscoreEngine/pillars/ethicsPillar.ts`  
- **Data source:** `labels = (product.labels_tags || []).map(...).filter(Boolean)` (lines 72–74). Helper `hasLabel(pattern)` does `labels.some(l => l.includes(pattern.toLowerCase()))` (lines 103–105). So certification detection is **substring/includes** on merged `labels_tags`; no separate fuzzy match on label text.  
- **Implemented certifications and points (lines 116–273):**

| Spec certification | Spec points | Code check | Code lines |
|-------------------|-------------|------------|------------|
| Fairtrade | +8 | hasLabel('fair-trade') | 116–124 |
| Organic | +7 | organic / usda-organic / eu-organic / bio / ecocert | 126–140 |
| Rainforest Alliance | +6 | hasLabel('rainforest-alliance') | 143–150 |
| UTZ | +6 | hasLabel('utz') | 152–159 |
| MSC/ASC | +6 | labels en:msc, en:asc | 162–169 |
| Ocean Wise | +5 | ocean-wise / oceanwise | 172–180 |
| RSPCA | +5 | hasLabel('rspca') | 182–188 |
| Leaping Bunny | +5 | leaping-bunny / cruelty-free / leaping_bunny | 191–199 |
| B-Corp | +5 | b-corp / bcorp | 202–208 |
| Free-Roaming | +5 | free-roaming / freeroaming | 211–222 |
| Friend of the Sea | +4 | friend-of-the-sea / friendofthesea | 225–233 |
| GlobalG.A.P | +4 | globalgap / global-gap | 236–244 |
| Free-Range | +3 | free-range (excluding free-roaming) | 247–258 |
| Cage-Free | +1 | cage-free (excluding free-range/roaming) | 261–272 |

- **Stack cap:** `cappedCertBonus = Math.min(certificationBonus, 15)` (line 277). Score is then increased by `cappedCertBonus` and capped at 25 (line 287).

**Where labels_tags come from:** `productDataMerger.ts` (lines 290–304): union of all products’ `labels_tags`; no per-label source priority (gov vs OFF). Base product and merge order influence which product contributes most fields, but certification labels are not explicitly prioritised by “Primary cert orgs > Local govt > Country OFF > Global OFF.”

### 3.3 Alignment and Gaps

- **Alignment:** Every listed certification and point value matches the spec. Stack cap +15 and geo-universal application (no geo-filtering of certs) are correct.  
- **Gaps:**  
  1. **Decision tree (source priority):** Spec: “1. Primary cert orgs > 2. Local govt certs > 3. Country OFF > 4. Global OFF.” Code does not enforce this for certifications: merged `labels_tags` are a union. To align, the merger could prefer a label from a higher-priority source when the same certification appears from multiple sources.  
  2. **Fuzzy match >80% on labels:** Spec asks for “Fuzzy match >80% on labels for variants.” Code uses substring/includes only; brand matching uses 0.75 (75%) elsewhere, not 80%. Consider adding optional fuzzy/normalised label matching (e.g. for “usda-organic” vs “organic”) at ≥80% if required.  
  3. **ACO (AU), IFOAM:** Spec names ACO and IFOAM. Code covers “organic” and “ecocert” but does not explicitly check for “ACO” or “IFOAM” tags. If OFF or merger provide such tags, add explicit checks if those certs should receive the Organic +7 or a dedicated value.

---

## 4. Row 37 – Animal Cruelty

### 4.1 Spec (CSV v32 row 37)

| Column | Content |
|--------|---------|
| Data Element | Animal Cruelty |
| Positive Statement | No animal cruelty |
| Dimensions / Measures | Pillar Scoring: BBFAW; Banner Alerts: PETA, Ethical Consumer, HSUS/RSPCA/ASPCA/USDA AWA, ALDF, Compassion in World Farming > Buycott |
| Data Point | brands_tags, parent_tags |
| Scoring Conversion | BBFAW Tier 1 = +4, Tier 2 = +2, Tier 6 = -7, BBFAW E/F Impact Rating = -7, based on last report publication by BBFAW. |
| Explanation | Fuzzy matching >80% for product/brand hits. Parent chaining via fuzzy (>80% on brands_tags) and Oxfam CSVs/Open Corporates API for product > brand > parent (depth 3). NGO/Violations/News → banner alert (scoring neutral), time-bound <12 months. |
| Decision Tree | 1. BBFAW; if not found nil return (only top 150 food companies currently assessed). Violations/News → banner alert (scoring neutral), time-bound <12 months. |

**What this means in practice:** For **scoring**, the only source is BBFAW (tier-based: +4, +2, -7, E/F=-7). If the company (or its parent, per “parent chaining”) is not in BBFAW, the pillar applies no animal-cruelty adjustment and no penalty (nil return). PETA, HSUS, etc. are for **banner alerts only** and do not change the score. “Parent chaining” means resolving product → brand → parent company (depth 3) and using the **parent** for BBFAW lookup when the BBFAW report lists parent companies; that way subsidiaries of Tier 1 parents get +4. Time-bound <12 months applies to NGO/news used in banners.

### 4.2 Code Interrogation

**Pillar scoring (BBFAW only):**

- **File:** `src/lib/truscoreEngine/pillars/ethicsPillar.ts`  
- **Lines 293–331:** Animal cruelty uses **only** BBFAW. Loop over `allBrands` (from `extractAllBrands(product)`): for each brand, `checkBBFAWTier(brand)`; if tier score ≠ 0, apply it and break. If no BBFAW found, no adjustment and no penalty (nil return). No PETA/HSUS/etc. in the pillar.  
- **Parent:** Parent is computed later (lines 541–542) as `getParentCompanies(product, 0.75)` and `brandData?.parentCompany || product.brand_owner`. Parent is used for **brand overlay** (poor parent BBFAW when product has no animal cruelty), not for the **primary** BBFAW score. So the **primary** animal cruelty score is based on **brand only**; parent is not used for the main +4/+2/-7.

**BBFAW service:**

- **File:** `src/services/bbfawService.ts`  
- **KNOWN_BBFAW_COMPANIES:** Curated list (e.g. Danone, Nestlé, Unilever Tier 1; Mars, General Mills Tier 2; McDonald’s, KFC Tier 3–5; Smithfield, Perdue Tier 6). **Premier Foods PLC is not in the list.**  
- **getBBFAWTierScore:** Tier 1 → +4, Tier 2 → +2, Tier 6 → -7, E/F → -7; Tiers 3–5 → 0 (lines 167–191).  
- **checkBBFAWTier(companyName):** Exact match, then partial, then fuzzy at 0.75 threshold (lines 84–127).

**Brand and parent resolution:**

- **extractAllBrands:** `src/utils/brandExtraction.ts` – from product.brands, brand_owner, brands_tags, brand_owner_tags, and product name extraction.  
- **getParentCompanies:** `src/services/brandMatchingService.ts` (309–323) – from `matchBrands(product, threshold)`; collects `match.parentCompany` from brand database. Parent is only from matched brand data or product.brand_owner, not from a separate “parent_tags” or Oxfam/Open Corporates API in this codebase.

**Banner (scoring neutral):**  
`bannerAlertsService.ts` uses `checkAnimalCruelty(product)` for alerts; time-bound filtering (e.g. 12 months) is applied where timestamps exist. Pillar score is unchanged by banner logic.

### 4.3 Alignment and Gaps

- **Alignment:** BBFAW-only scoring, tier values (+4/+2/-7, E/F=-7), and “if not found nil return” are implemented. NGO/news are banner-only.  
- **Gaps:**  
  1. **Primary score from parent:** Spec: “Parent chaining … product > brand > parent (depth 3) to ensure accountability.” BBFAW report lists **parent companies**. Code uses **brand** for the primary BBFAW score and **parent** only for overlay. So a product whose **parent** is in BBFAW (e.g. Premier Foods PLC, Tier 1) but whose **brand** is not (e.g. The Spice Tailor) does **not** get +4. **Recommendation:** Before or in addition to scoring by brand, resolve parent (getParentCompanies + product.brand_owner); if parent is present, call `checkBBFAWTier(parentCompany)` and use that tier for the **primary** animal cruelty adjustment; if parent has no BBFAW, fall back to brand.  
  2. **BBFAW list:** Add Premier Foods PLC (and any other BBFAW 2024 report parents) to `KNOWN_BBFAW_COMPANIES` and keep list aligned with “last report publication by BBFAW.”  
  3. **Fuzzy >80%:** Spec “Fuzzy matching >80%.” Code uses 0.75 for matchBrands and getParentCompanies. Consider 0.8 for Ethics pillar brand/parent resolution.  
  4. **parent_tags / Oxfam / Open Corporates:** Spec mentions “parent_tags” and “Oxfam CSVs/Open Corporates API” for parent chaining. Code uses brand database `parentCompany` and product.brand_owner only; no Oxfam/Open Corporates integration found. Document or implement if spec requires those sources for parent resolution.

---

## 5. Row 38 – Labor Violations / Human Exploitation

### 5.1 Spec (CSV v32 row 38)

| Column | Content |
|--------|---------|
| Data Element | Labor Violations/Human Exploitation |
| Positive Statement | No labor violations/exploitation |
| Dimensions / Measures | DOL List of Goods (US child/forced labor), Walk Free Global Slavery Index, Oxfam Behind the Brands, ILO Labor Standards > Buycott/Open Corporates > Country/Global OFF |
| Data Point | brands_tags (labor filter), violations API |
| Scoring Conversion | Limited=-4 (e.g. under-pay/over-work), moderate=-8 (e.g. unsafe conditions), major=-15 (e.g. child labor/slavery); brand/parent assessed separately with same tiers (-4/-8/-15), mutually exclusive (no deduct if product hits). |
| Explanation | Severity from Walk Free/DOL. Time-bound <12 months for X/Reuters banner. |
| Decision Tree | 1. DOL/Walk Free/Oxfam/ILO > 2. Buycott/Open Corporates > 3. Country OFF > 4. Global OFF; deduct if labor match (fuzzy >80%); time-bound <12 months. |

**What this means in practice:** Labor violations reduce the Ethics score in three tiers: limited (-4), moderate (-8), major (-15). The spec requires that **brand** and **parent** be assessed separately with the same tiers and that we do not double-count: if the product itself already gets a labor penalty, we do not also apply a brand-overlay penalty for the same issue (“no deduct if product hits”). Severity should be driven by authoritative sources (DOL, Walk Free, Oxfam, ILO) with Buycott/OFF as fallback. Alerts should be time-bound (e.g. &lt;12 months) and, for defensibility, should cite the specific violation report (ideally with hyperlink).

### 5.2 Code Interrogation

**Ethics pillar:**

- **File:** `src/lib/truscoreEngine/pillars/ethicsPillar.ts`  
- **Lines 344–431:** `laborViolationData = checkLaborViolations(product)`. If multiple brands, each is tried (lines 348–365). Penalties: major → 15, moderate → 8, limited → 4 (lines 401–423).  
- **Mutually exclusive / parent-level:** Lines 385–392: if the product has certifications and the violation is deemed parent-level (violation text matches parent/brand_owner and primary brand ≠ brand_owner), the **direct** labor penalty is skipped and the issue is handled via **brand overlay** (lines 426–427). So “brand/parent assessed separately” and “no deduct if product hits” (when product is ethical and violation is parent-level) are respected.

**Labor violations service:**

- **File:** `src/services/laborViolationsService.ts`  
- Uses brand database (laborPractices), known violation lists (MAJOR/MODERATE/LIMITED), DOL (`dolEnforcementService`), ILO (`iloStatisticsService`), Walk Free (`walkFreeService`), Buycott. Returns `LaborViolationData`: hasViolations, violationType (limited/moderate/major), violations[], sources[]. **No per-violation URL or report ID** is returned; DOL may have a `url` field but it is not passed through to the pillar or banner.  
- **Brand matching:** Uses `matchBrands(product, 0.75)` (75%, not 80%).  
- **Time-bound:** Banner filters by 12 months where `laborViolationData.timestamp` is set; the labor service does not consistently set timestamp from DOL/violation dates.

**Banner:**  
`bannerAlertsService.ts`: labor alerts get a **generic** actionUrl (e.g. DOL youth labor page, Walk Free, Oxfam, ILO, Buycott) based on `sources`, not the specific violation report link.

### 5.3 Alignment and Gaps

- **Alignment:** Tier values (-4/-8/-15) and mutually exclusive / brand overlay behaviour match the spec.  
- **Gaps:**  
  1. **Specific violation report URL:** When a violation comes from DOL (or any source with a URL), that URL should be stored in the violation payload and shown as the alert’s actionUrl (or in the message).  
  2. **Time-bound <12 months:** Ensure violation dates are parsed and set so the 12-month filter is applied correctly.  
  3. **Fuzzy >80%:** Consider 0.8 threshold for labor brand/parent matching.  
  4. **Source priority:** Document or enforce order DOL/Walk Free/Oxfam/ILO > Buycott > OFF when aggregating severity.

---

## 6. Row 39 – Recalls

### 6.1 Spec (CSV v32 row 39)

| Column | Content |
|--------|---------|
| Data Element | Recalls |
| Positive Statement | No safety recalls |
| Dimensions / Measures | FDA (US), CFIA (CA), FSANZ (AU/NZ), EFSA/RASFF (EU) > Country/Global OFF |
| Data Point | recalls API |
| Scoring Conversion | Limited=-4 (Class III/low risk), major=-15 (Class I/high risk), moderate=-8 (Class II/med risk). |
| Explanation | Universal penalties; recall in one location = global deduct. Time-bound <3 months; X/Reuters banner only (no scoring). |
| Decision Tree | 1. Local govt recalls (FDA/CFIA/FSANZ/EFSA/RASFF); deduct if flag within 3 months (universal); 2. Country OFF 3. Global OFF; <3 months; user subs if no data. |

**What this means in practice:** Only recalls within the **last 3 months** affect the score. Severity is by FDA-style class: Class I (high risk) = -15, Class II (medium) = -8, Class III (low) = -4. “Universal” means a recall in any one jurisdiction is applied globally (no geo-scoping). Data should come from government recall APIs (FDA, CFIA, FSANZ, EFSA/RASFF) first; OFF and user subs are fallback. X/Reuters “recall buzz” is banner-only (no score impact). CPSC is for consumer products, not food, so for a food-only MVP it should not drive Ethics recall scoring.

### 6.2 Code Interrogation

**Ethics pillar:**

- **File:** `src/lib/truscoreEngine/pillars/ethicsPillar.ts`  
- **Lines 434–528:** Uses `product.recalls`. Recent recalls: `recallDate >= threeMonthsAgo` (3 × 30 days) (lines 450–456). Highest severity among recent: Class I → -15, Class II → -8, Class III → -4; Unknown → -8 (lines 462–516). Single penalty applied (highest severity). Score is reduced once; “universal” (no geo-scoping).  

**Where recalls come from:**

- **File:** `src/services/productService.ts` (lines ~820–912). Recalls are fetched in parallel: FDA (by barcode), then US: `checkComprehensiveUSRecalls` (FDA + USDA FSIS + CPSC) and `checkCPSCRecalls` again; EU: RASFF; UK: UK FSA; CA: CFIA. Results are merged, 2s timeout, and attached to `product.recalls` with classification (Class I/II/III) and url. So **CPSC** (consumer products) is included for US; **FSANZ** is not in this list (no explicit FSANZ recall API in the recall pipeline). UK FSA is included; spec v32 CSV lists FDA/CFIA/FSANZ/EFSA/RASFF (no UK FSA, no CPSC).

### 6.3 Alignment and Gaps

- **Alignment:** 3-month window, Class I/II/III penalties (-15/-8/-4), and universal application match the spec.  
- **Gaps:**  
  1. **CPSC:** Spec is food recalls; CPSC is consumer products. Recommend removing CPSC from the food-recall path for MVP (or gating behind a non-food feature).  
  2. **FSANZ:** Spec lists FSANZ for AU/NZ. Code does not show an FSANZ recall source in the recall pipeline. Add FSANZ (or equivalent AU/NZ gov) recall source if required.  
  3. **UK FSA:** Implemented but not listed in CSV v32; retain if product is intended for UK.

---

## 7. Row 40 – Overall Pillar Cap

### 7.1 Spec (CSV v32 row 40)

| Column | Content |
|--------|---------|
| Data Element | Overall Pillar Cap |
| Positive Statement | N/A |
| Dimensions / Measures | Internal Logic (No external source) |
| Scoring Conversion | Min 0 (floor after all adjustments) |
| Explanation | Caps final Care score at min 0; zero “unethical” callout on junk—viral boycott rage. |
| Decision Tree | 1. Applied after all adjustments; overrides if <0. |

**What this means in practice:** After every other element (base, certifications, animal cruelty, labor, recalls, brand overlay) has been applied, the final Ethics score is forced to be at least 0 and at most 25. So even if the sum of deductions would go below zero, the displayed score is 0 (“zero unethical callout”), and the pillar never shows a negative value.

### 7.2 Code Interrogation

- **File:** `src/lib/truscoreEngine/pillars/ethicsPillar.ts`  
- **Line 731:** `score = Math.max(0, Math.min(25, Math.round(score)));`  
- Applied after all adjustments (base, certs, animal, labor, recalls, brand overlay). Floor 0 and cap 25.

### 7.3 Alignment and Gaps

- **Alignment:** Full. Floor 0 is applied last; cap 25 is enforced.

---

## 8. Brand/Parent Overlay (Implicit in Spec)

Spec (CSV and Excel) states that brand/parent are assessed separately with the same tiers (-4/-8/-15) and mutually exclusive (no deduct if product hits). This is implemented in ethicsPillar.ts (lines 531–719): overlay is applied only when the product does **not** have the violation (animal cruelty, labor, or recalls) but the brand/parent does; severity is limited/moderate/major → -4/-8/-15. Parent is resolved via getParentCompanies and brand_owner and used for overlay checks (BBFAW, labor, recall history). Alignment: **Yes.**

---

## 9. Summary Table (Rows 35–40)

| Row | Data Element   | Spec summary | Code alignment | Gaps / actions |
|-----|----------------|--------------|---------------|----------------|
| 35  | Base Score     | 15 uniform; starting point | Yes | Optional: “prompt user subs” in UX, not in pillar. |
| 36  | Certifications | Listed certs and points; stack cap +15; source order 1–4 | Values and cap match | Cert source priority in merger; fuzzy >80% on labels; ACO/IFOAM if needed. |
| 37  | Animal Cruelty | BBFAW only; Tier 1/2/6 and E/F; parent chaining; nil if not found | BBFAW and tiers match; overlay uses parent | **Primary score from parent when available;** add Premier Foods to BBFAW; fuzzy 80%; Oxfam/Open Corporates if required. |
| 38  | Labor          | Limited/Moderate/Major = -4/-8/-15; brand/parent separate; <12 mo | Tiers and mutual exclusivity match | Violation URL in alerts; 12-month timestamps; fuzzy 80%; source priority. |
| 39  | Recalls        | 3 months; Class I/II/III = -15/-8/-4; FDA/CFIA/FSANZ/EFSA/RASFF | Window and tiers match | Remove CPSC from food path; add FSANZ recall for AU/NZ if required. |
| 40  | Overall Cap    | Min 0 after all adjustments | Floor 0 and cap 25 applied | None. |

---

## 10. Files Referenced (Code)

| File | Role |
|------|------|
| `src/lib/truscoreEngine/pillars/ethicsPillar.ts` | CARE/ETHICS pillar scoring (base, certs, animal, labor, recalls, overlay, cap). |
| `src/lib/truscoreEngine/index.ts` | Calls calculateEthicsPillar; builds TruScore breakdown. |
| `src/utils/trustScore.ts` | calculateTrustScore → calculateTruScore. |
| `src/services/bbfawService.ts` | BBFAW tier lookup and tier-based score. |
| `src/services/laborViolationsService.ts` | Labor violation detection and severity. |
| `src/services/brandMatchingService.ts` | matchBrands, getParentCompanies (threshold 0.75). |
| `src/data/brandDatabase.ts` | Brand data and parentCompany. |
| `src/utils/brandExtraction.ts` | extractAllBrands from product. |
| `src/services/productDataMerger.ts` | Merges labels_tags (union). |
| `src/services/productService.ts` | Attaches product.recalls (FDA, FSIS, CPSC, RASFF, UK FSA, CFIA). |
| `src/services/bannerAlertsService.ts` | Banner alerts (scoring neutral) for labor, animal, recalls. |

---

*Document generated from Care_Scoring_Specification_v32 (CSV rows 35–40), ETHICS Pillar spec (via existing project analyses), and full codebase review. CARE and ETHICS refer to the same pillar.*
