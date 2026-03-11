# APP Testing (Single Product) – Log Analysis vs Request

**Product:** 7501058649959 — Reduced Cream (Nestlé)  
**TruScore:** 44/100 (Body 5, Planet 18, Ethics 0, Open 21)  
**Logs:** PowerShell/Android, single scan.

---

## 1. Comparison to Your Analysis Request

You asked the logs to explain:

1. **Which database produced a change in score for each Pillar**  
2. **Which database is used in priority**  
3. **How each Pillar is scored**  
4. **Whether each DB was queried by barcode / product match / parent match / brand match**

### 1.1 Which database produced a change in score – **YES**

The `[ANALYSIS_PILLAR]` and `[TRUSCORE_ANALYSIS_JSON]` sections do this per pillar and per adjustment:

| Pillar | Adjustment | Source database | Query type |
|--------|------------|------------------|------------|
| **Body** | Nutri-Score Grade D (-3) | Open Food Facts | product_field |
| **Body** | 2 additive(s) IARC (-1) | Additive DB + Open Food Facts | product_field |
| **Body** | NOVA Group 4 (-6) | Open Food Facts | product_field |
| **Planet** | Eco-Score Grade C (0) | Open Food Facts | product_field |
| **Planet** | All packaging recyclable (+3) | Open Food Facts | product_field |
| **Ethics** | Base score (0) | Internal | product_field |
| **Ethics** | BBFAW Tier 1 (+4) | BBFAW | brand |
| **Ethics** | Major labor violation (-15) | Labor violations DB | brand |
| **Ethics** | Brand/parent overlay recall (-8) | Recalls API | barcode |
| **Open** | Base (0) | Internal | product_field |
| **Open** | Ingredients, nutrition, origin, etc. | Open Food Facts | product_field |
| **Open** | Hidden/opaque parent (-3) | Brand DB | brand |

So: **every score change is attributed to a source DB and a query type.**

One small inaccuracy: the “Brand/parent overlay (recall history)” penalty is attributed to **Recalls API / barcode**. In code it actually comes from the **Brand DB** (recall history for the matched brand), not a product-level recall API. So the overlay is effectively **brand**-driven; the inference could be updated to “Brand DB” + `parent` or `brand` for that line.

### 1.2 Which database is used in priority – **PARTIAL**

- **Fetch trace (what the UI used for the first result):**  
  `1. Open Food Facts (barcode): HIT` → `2. Open Beauty Facts (barcode): MISS`.  
  So for the **displayed** product and TruScore, **only OFF and OBF** appear; priority is OFF then OBF, both by **barcode**.

- **Intended query order** (from `[QUERY_ORDER]`):  
  SQLite 1 → Cache 2 → OFF 3 → OBF 3 → GS1 2 → Spoonacular 2 → Barcode Lookup 3 → FSANZ 2 → Fallbacks 3.  
  So you see **strategy** (who we try and in what phase), but the **trace** only reflects who actually delivered the product for the first paint (OFF).

- **Gap:** FSANZ, Spoonacular, FoodAtlas, nzfcd were queried in the background and used in the **merge** (e.g. nutriments, categories). They do **not** appear in the fetch trace. So “priority” is clear for **product resolution** (OFF first), but the trace does **not** show “DBs that contributed to the merged product after first paint.”

### 1.3 How each Pillar is scored – **YES**

Each pillar logs:

- Base score (15)
- Each adjustment with **description**, **value**, **type** (positive/negative/neutral)
- Final score and sometimes `details` (e.g. nutriscoreGrade, ecoscoreGrade, laborViolationPenalty)

So the logs fully explain **how** each pillar is scored (base + list of adjustments with values).

### 1.4 Barcode vs product match vs parent vs brand – **YES**

- **Fetch trace:** OFF and OBF are explicitly **barcode**.
- **Per-adjustment:** `queryKeyType` is one of:
  - **product_field** – from the product record (OFF) used for scoring
  - **brand** – BBFAW, Labor violations DB, Brand DB (parent/recall)
  - **barcode** – Recalls API (and see note above about overlay)

So you can see which logic was used for each score change (product fields vs brand match vs barcode).

### 1.5 Logs vs analysis (first-paint vs post-merge trace)

- **First paint:** When OFF (or another fast source) returns first, we send `product_ready` with that product. Its `_fetchTrace` is the **progressive** trace (e.g. OFF + OBF). The logged `[TRUSCORE_ANALYSIS_JSON]` and `[ANALYSIS_FETCH_TRACE]` at that moment reflect that trace.
- **Post-merge:** When Phase 2 finishes we merge (e.g. OFF + Spoonacular), set `_fetchTrace = buildFetchTraceForProducts(enhancementProducts)` on the merged product, then call `processProductFast` and send `product_enhanced` / `complete`. The analysis should reflect the **extended** trace (all DBs that contributed to the merged product).
- **Bug (fixed):** On cache hit, we were reusing cached `truScoreResult.analysis`, which was built from the first (progressive) product. So the final logged analysis still showed OFF+OBF instead of OFF+Spoonacular. **Fix:** In `trustScore.ts`, when we have `pillarDetails` we always build analysis from the **current** product, so the fetch trace reflects the product we return (e.g. merged OFF+Spoonacular). Cached score is still reused; only the analysis (and its trace) is rebuilt from the current product.

---

## 2. Are We Making Good, Efficient, and Meaningful Use of the Databases?

### 2.1 What was queried (this scan)

| Source | How queried | Result | Used for |
|--------|-------------|--------|----------|
| SQLite | barcode | MISS | — |
| Cache | barcode | MISS | — |
| Open Food Facts | barcode | **HIT** | Product, Body/Planet/Open scoring, base for merge |
| Open Beauty Facts | barcode | MISS | — |
| FSANZ (NZ) | **product name** (“Reduced Cream”) | **HIT** | Merge: nutriments (Golden Source supplement) |
| Spoonacular | barcode | **HIT** | Merge: nutriments, categories |
| FoodAtlas | **product name** (API) | **HIT** | Merge: nutriments |
| GS1 | barcode | Timeout | — |
| Barcode Lookup | barcode | 403 | — |
| USDA / Health Canada / UK FSA / EFSA | — | **Skipped** (NZ user) | — |
| Brand DB / BBFAW / Labor | **brand** (Nestlé) | Used in Ethics | Ethics pillar only |

### 2.2 Efficiency

- **Good:**  
  - Parallel queries; no blocking on slow ones.  
  - Progressive display: user sees OFF result in ~3.5 s.  
  - Region-based skip of USDA, Health Canada, UK FSA, EFSA for NZ.  
  - First meaningful result (OFF) drives the score; slow/missing APIs don’t delay the UI.

- **Caveat:**  
  The **displayed TruScore and analysis** are computed from the **first-returned product (OFF)**. FSANZ, Spoonacular, FoodAtlas, nzfcd only affect the **merged** product (e.g. nutrition, categories) after background merge. So for “which DB changed the score,” the picture is correct (OFF + brand DBs); for “which DBs contributed to the final merged fields,” the trace is incomplete.

### 2.3 Meaningful use

- **Open Food Facts:** Central. Provides identity, Nutri-Score, Eco-Score, NOVA, additives, ingredients, packaging, origin. Drives Body, Planet, Open and supplies brand for Ethics. **Very meaningful.**

- **Open Beauty Facts:** Queried by barcode, MISS. Low cost, expected for food. **Reasonable.**

- **FSANZ (NZ):** Queried by **product name**; HIT. Used in merge (nutriments – Golden Source supplement). For NZ users this is **meaningful** for data completeness, even though it doesn’t change the **score** on first paint.

- **Spoonacular:** HIT; used in merge (nutriments, categories). In this run it contributed the **category** “non food item” (wrong for cream). So it’s used, but **quality can be poor** when we take “longest” category.

- **FoodAtlas:** HIT with **“peanut butter (creamy)”** for “Reduced Cream” – **wrong product**. Still included in nutriments merge. So here it’s **noise**; there’s no product-name validation before blending.

- **GS1 / Barcode Lookup:** Timeout / 403; no impact this time.

- **Brand DB, BBFAW, Labor violations:** Not product APIs; they’re used when computing Ethics from product brands (Nestlé → labor, BBFAW, recall history). **Meaningful** and correctly reflected in the analysis (brand match).

**Summary:** OFF and brand DBs are used very meaningfully for scoring. FSANZ and Spoonacular add value in merge when data is correct. FoodAtlas (and similar name-based APIs) can blend wrong-product data because there’s no validation.

---

## 3. Which Databases Are “Blended” and How Blending Works in Reality

From `[FINAL_PRODUCT_SOURCES]` and `[FIELD_SOURCE_MAPPING]` and the merger code:

### 3.1 Blended fields (multiple sources)

| Field | Merge method in code | Sources this scan | How it works in reality |
|-------|----------------------|-------------------|--------------------------|
| **nutriments** | **Golden Source** (not simple average) | OFF, nzfcd, foodatlas, spoonacular (+ duplicate OFF) | Start with **OFF** (or base product if no OFF). Then **supplement**: add any nutrient **key** that is still missing from **government** sources (e.g. nzfcd), then from **commercial** (e.g. spoonacular, foodatlas). No numeric weighted average of values; it’s OFF base + fill gaps. Logs say “weighted_average” for display. |
| **product_name** | single | openfoodfacts | Base product wins; not blended. |
| **ingredients_text** | **longest** | openfoodfacts (67 chars) | The **longest** ingredients string among all products wins. OFF had 67 chars so OFF won. |
| **categories** | **longest** | spoonacular won (“most specific” = longest path) | **Longest** category string wins. Here Spoonacular gave “non food item” (13 chars) vs OFF “UHT Creams” (11 chars), so **wrong** category won. No semantic check. |
| **brands** | union | openfoodfacts ×2 | Union of all brands from sources. |
| **origins_tags** | union | openfoodfacts ×2 | Union of origin tags. |
| **image_url** | best_quality | openfoodfacts | Single “best quality” image. |
| **nutriscore_grade / ecoscore_grade** | single | openfoodfacts | From base product; not blended. |

### 3.2 Blending logic in reality (short)

- **Base product:** Chosen by **TruScore completeness + source weight** (e.g. OPEN 57% combined). That product’s source is the “primary” for single-source fields and the **base** for nutrition.
- **Nutrition:** **Golden Source** in code: OFF (or base) as full set, then **government** sources fill **missing keys**, then **commercial** APIs fill remaining gaps. So it’s **hierarchical supplement**, not a weighted average of numbers. Field-level logging still labels this as “weighted_average” for simplicity.
- **Ingredients:** **Longest** string wins. Good when one source has a fuller list; no check for same product.
- **Categories:** **Longest** string wins. Can select a **worse** category (e.g. “non food item”) if it’s longer.
- **Names:** Base product name is used; other sources’ names are not blended into the displayed name (but nzfcd/foodatlas/spoonacular can have different names for the same barcode, and those products still contribute nutriments).

### 3.3 Risks

- **No product-name or category validation:** FoodAtlas “peanut butter (creamy)” and Spoonacular “non food item” are merged in. Name matching (e.g. FSANZ “Cracker, wheat... Reduced Fat” for “Reduced Cream”) is fuzzy; we still use their nutrition in the Golden Source supplement. So blending is **aggressive** and can include **wrong-product** data.
- **Categories:** “Longest = most specific” is wrong when the longest is generic or wrong (e.g. “non food item”). Consider **semantic** or **source-priority** rules for categories.

---

## 4. Summary Table: Request vs Logs

| Request | Logs deliver? | Note |
|--------|----------------|------|
| Which DB produced a change in score per pillar? | Yes | ANALYSIS_PILLAR / TRUSCORE_ANALYSIS_JSON with source + queryType per adjustment. |
| Which DB is used in priority? | Partial | Trace shows OFF → OBF for **product fetch**; merge contributors (FSANZ, Spoonacular, etc.) not in trace. |
| How each pillar is scored? | Yes | Base 15 + list of adjustments with description and value. |
| Barcode vs product vs parent vs brand? | Yes | queryKeyType per adjustment; fetch trace shows barcode for OFF/OBF. |
| Good/efficient use of DBs? | Mostly | OFF + brand DBs are used well; region skip is efficient; some APIs (FoodAtlas) add noise. |
| Which DBs are blended and how? | Partially | Final product sources + field mapping show who contributed; code uses Golden Source for nutrition (supplement), longest for ingredients/categories, union for brands/origins. |

---

## 5. Recommendations (optional)

1. **Fetch trace:** Extend the trace when the merged product is applied (or in a separate “merge trace”) so it lists **all** DBs that contributed to the final product (e.g. OFF, nzfcd, spoonacular, foodatlas) and how (barcode / product_name / brand). That would fully match “which database is used in priority” including post-merge.
2. **Ethics overlay attribution:** Map “Brand/parent overlay (recall history...)” to **Brand DB** + `brand` (or `parent`) instead of Recalls API + barcode, so the analysis matches implementation.
3. **Blending robustness:** Add optional checks before merging: e.g. exclude or downweight nutrition from sources whose product name is too different from the base product; or prefer OFF (or government) for **categories** instead of “longest” when OFF has a valid category.

This analysis is based on the single-product logs you provided and the current merger/analysis code paths.
