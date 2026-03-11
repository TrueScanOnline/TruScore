# Ethics Pillar: Scoring, Data Sources, and Banner Alerts

> **Current (rebuilt):** Ethics uses **BBFAW 2024 only**. Direct link from `brand_owner`/`brands` to BBFAW company names (exact match). No fuzzy logic, labor, recalls, or certifications.

This document explains how the **Ethics pillar** score is calculated, which data sources feed it, why we often cannot provide a single direct hyperlink to “the report that changed the score,” and how Banner Alerts and reference links work.

---

## 1. How the Ethics pillar score is built

- **Base score:** 15/25 (same for every product).
- **Adjustments** are applied in order; the total is then clamped between 0 and 25.

For your example product (Nestlé Reduced Cream, barcode 7501058649959), the logs show:

| # | Description | Value | Type |
|---|-------------|--------|------|
| 1 | Base score (assumes ethical until violations) | 0 | neutral |
| 2 | BBFAW Tier 1 (excellent animal welfare) | +4 | positive |
| 3 | Major labor violation (child labor/slavery/Walk Free high-risk) | -15 | negative |
| 4 | Brand/parent overlay (recall history (moderate)) | -8 | negative |

**Result:** 15 + 0 + 4 − 15 − 8 = **0/25** (capped at 0).

So the **Ethics pillar does not “query databases” over the network at scan time.** It uses:

1. **Product fields** (e.g. `brands`, `labels_tags`, `recalls`) that were already loaded when the product was fetched (from Open Food Facts, Spoonacular, etc.).
2. **In-app, brand-based lookups** that match the product’s brand(s) against:
   - **BBFAW** (tier list in code)
   - **Labor violations** (brand DB + known lists)
   - **Brand DB** (recall history, etc.)

Those lookups are **synchronous and in-memory** (no HTTP call when the Ethics pillar runs). The “database” names in the logs (BBFAW, Labor violations DB, Brand DB) are **labels for these in-app sources**, not separate APIs that return a document URL.

---

## 2. Where each Ethics adjustment comes from

| Adjustment type | Source (in-app) | What we have | Single report URL? |
|-----------------|------------------|--------------|--------------------|
| Base score | Internal | Logic only | No (N/A). |
| BBFAW Tier 1/2/6 | **BBFAW** | Tier list in `bbfawService` (company name → tier). Data is derived from BBFAW’s published benchmark. | No. BBFAW publishes reports by company; we don’t store or resolve a per-brand report URL. We can link to the **BBFAW site** as a reference. |
| Labor violation (-4 / -8 / -15) | **Labor violations DB** | Brand DB `laborPractices` and/or curated lists (e.g. DOL, Walk Free). | Only when we have a specific report (e.g. DOL list of goods or report URL). For **brand_database only** we have no single report; we link to **DOL List of Goods** (or similar) and state that in the banner. |
| Product recall | **Recalls API** (product-level) | Product’s `recalls[]` from our recall pipeline. | Yes when `recall.url` is present; otherwise we use FDA/USDA/CFIA/RASFF index. |
| Brand/parent overlay (recall history) | **Brand DB** | `recallHistory` flag for the matched brand. | No. We link to **FDA Recalls search** (or equivalent) and say the score uses our brand database. |

So:

- **“Database query” in the logs** = which **in-app source** (BBFAW, Labor violations DB, Brand DB, etc.) was used to decide the adjustment. It does **not** mean an HTTP request that returns a URL.
- **“We can’t provide the data source”** in the sense of “one hyperlink to the exact document that caused this line” is because:
  - Ethics uses **brand-level** data (BBFAW tier, labor lists, brand recall history).
  - That data is either **curated in our app** (brand DB, known lists) or **derived from public benchmarks** (BBFAW) without storing per-brand report URLs.
  - So we provide the **best available reference link** (BBFAW, DOL, FDA, etc.) and **disclose** when there is no direct link to a single finding (e.g. “our brand database,” “Tap to open the official reference”).

---

## 3. Banner Alerts and links (ID 17)

- Every **negative** Ethics factor that affects the score is also reflected in a **Banner Alert** (when applicable: time-bound, severity, etc.).
- Each banner:
  - Explains **what** information was used (e.g. “brand database: Nestlé flagged for major labor concerns”).
  - Uses a **hyperlink**:
    - To the **actual report** when we have it (e.g. product recall URL, DOL report).
    - Otherwise to the **best available official reference** (DOL List of Goods, BBFAW, FDA Recalls) and the message states that we do not have a direct link to a single finding.

So the “source” the user can click is:

- **Labor:** DOL List of Goods (or specific DOL/Walk Free report when we have it); message discloses “our brand database” when the only source is brand_database.
- **Animal welfare:** BBFAW (or other org) as reference; we don’t show an animal welfare banner when the brand has BBFAW Tier 1/2 (Ethics shows +4/+2), to avoid contradicting the score.
- **Recalls:** Specific `recall.url` when available; otherwise FDA/USDA/CFIA/RASFF index.
- **Brand recall overlay:** FDA Recalls search; message explains brand database.

Details: `docs/LABOR_ALERTS_ID17_VERIFICATION.md` and the top comment in `src/services/bannerAlertsService.ts`.

---

## 4. Why no banner appeared in your latest run

In your latest logs:

- First, the product was loaded from **Open Food Facts** (brands: Nestlé, nestle, Reduced). Ethics was calculated from that (BBFAW +4, labor -15, brand overlay -8). A **labor** banner would normally be generated for that product state.
- Later, **background merge** completed with only **Spoonacular** (no OFF). The merged product then had brands like `["Reduced"]` only, so **no brand matched** Nestlé. So:
  - `[LaborViolations] No brand matches found`
  - `[AnimalCruelty] No brand matches found`
- Banners are generated from the **current** product. After the merge, the product no longer had a matched brand for labor/animal, so **no labor or animal welfare banner** was shown.

So the Ethics **score** you saw (0/25 with +4, -15, -8) was from the **first** product state (OFF with Nestlé). The **banners** were evaluated again later on the **merged** product (Spoonacular with “Reduced” only), so no Ethics-related banner appeared. This is a known quirk when the “winning” merge drops the brand that had the violations.

---

## 5. Summary

| Question | Answer |
|----------|--------|
| Does the Ethics pillar “query databases” at scan time? | It uses **in-app lookups** (BBFAW tier, labor lists, brand DB) keyed by the **product’s brand**. The product itself comes from whatever DB was used to fetch it (OFF, Spoonacular, etc.). |
| Where do “BBFAW”, “Labor violations DB”, “Brand DB” come from? | They are **internal sources** (code + bundled/curated data), not HTTP APIs that return a URL. |
| Why can’t we always embed the exact source link for each Ethics line? | Because the adjustment is from **brand-level** data (tiers, lists, flags). We don’t have a single document URL per brand; we provide the **best available reference** (BBFAW, DOL, FDA) and disclose when there’s no direct link. |
| How do users get a link when Ethics is negative? | Via **Banner Alerts**: each negative Ethics factor has a banner with an explanation and a link (actual report when available, otherwise official reference + disclosure). |
| Why did the banner not show this time? | After merge, the product’s brand set no longer matched Nestlé, so labor/animal checks found no violations and no Ethics banner was generated. |

If you want the **score breakdown UI** to show a clickable “reference” link for each Ethics line (e.g. BBFAW → bbfaw.com, Labor → DOL List of Goods), we can add an optional `referenceUrl` to the analysis and display it next to the source name. The doc above still holds: that link would be the **best available reference**, not necessarily “the exact report that caused this line” when the source is brand DB or BBFAW tier list.
