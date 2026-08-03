# W1 As-Built Walkthrough — Product Identity & Data-Source Retrieval/Merging

**Document type:** Critical Output Integrity as-built demonstration (plain language)  
**Module:** W1 / Critical Output Integrity **#12** — Product identity and data-source retrieval/merging  
**Authority:** MVP Launch Plan v0.4 §4; Cursor acceptance `docs/cursor-acceptance-mvp-v0.4-20260803.md`  
**Depends on:** W0 (`docs/as-built/W0-end-to-end-consumer-journey-20260803.md`)  
**Code baseline:** Behaviour described against the `0e91226` product tree (identity/merge code). Docs-only commits on `main` do not change this behaviour.  
**Status:** As-built facts only. **Not** product acceptance. **Not** authority to change merge rules, A-data, or identity policy.

**Date:** 3 August 2026  
**Author:** Cursor (implementation agent)

---

## 1. Purpose

Module #12 asks: when a user scans a barcode, how does Rveel decide **which product** it is talking about, **which data sources** to trust, and **how fields are combined** before TruScore, Origins, Signals, and sharing?

W1 answers in plain language:

1. How the barcode is normalised.  
2. Which sources are queried, in what order, and what MVP mode turns off.  
3. How conflicting fields are merged.  
4. How “shared identity” and Workstream A/C brand chains work today (two different systems).  
5. How manual / community data overlays the product.  
6. Known identity failure modes already evidenced in code or UAT docs.

---

## 2. One-picture data flow

```
Barcode (camera or keypad)
        ↓
Normalize GTIN variants (EAN-8/12/13/14)
        ↓
Result: manual product on device? ──yes──► use that (skip live APIs)
        │ no
        ↓
Cache / SQLite hit? ──yes──► show fast; optional background refresh
        │ no / miss
        ↓
Phase 1: Open Food Facts (+ beauty OFF only if not food-like)
        ↓
If still weak → parallel multi-DB query groups
   (FSANZ by name, USDA, GS1, FoodAtlas, optional fallbacks…)
        ↓
mergeProducts (weights + field rules)
        ↓
merge user-contributed / Vercel manual fields (race windows)
        ↓
calculateTrustScore + buildProductScanResult
        ├── Phase-6 resolveSharedIdentityContext (synthetic brand: tokens)
        └── Workstream C retail chain (B#### / P####) only if Skeleton UAT flag = 1
```

---

## 3. Barcode normalisation

**File:** `src/utils/barcodeNormalization.ts`  
**Functions:** `normalizeBarcode()`, `getPrimaryBarcode()`

| Input shape | What the code does |
|-------------|-------------------|
| Any string | Strip non-digits; keep cleaned original as a variant |
| EAN-8 (8 digits) | Pad toward EAN-13; also try NZ (`94…`) and AU (`93…`) prefixed forms |
| UPC-A (12 digits) | Add leading zero → 13-digit variant |
| GTIN-14 | Keep; also try 13-digit truncations |
| Shorter than 8 | Pad to 8, then EAN-8 rules |

**Primary barcode for most API calls:** longest variant (usually EAN-13).  
**OFF:** tries variants sequentially (and regional OFF instances).  
**Result screen:** still requires `8–14` digits before load.

**Known test debt (already accepted):** `barcodeNormalization.test.ts` has a pre-existing EAN-8 length failure — not fixed in this walkthrough.

---

## 4. Retrieval orchestration

### 4.1 Entry points

| Layer | File | Role |
|-------|------|------|
| UI | `app/result/[barcode].tsx` → `loadProduct()` | Manual short-circuit, then optimized fetch |
| Optimized service | `src/services/productServiceOptimized.ts` | Cache-first, Phase 1 OFF, progressive paint |
| Multi-DB | `src/data/databases/truScoreOptimizedDatabase.ts` | Parallel source groups + merge |
| Legacy | `src/services/productService.ts` | Older path; Result prefers Optimized |

### 4.2 What runs when

1. **Manual product** for barcode on device → use it; **do not** call live APIs.  
2. Else **cache / SQLite** → immediate return if hit; optional background OFF refresh.  
3. Else **Phase 1:** Open Food Facts on primary barcode; Open Beauty Facts only if OFF missing or not food-like.  
4. If Phase 1 “good enough”: paint UI, score, continue **background** multi-DB enhancement.  
5. If Phase 1 weak/empty: fuller `queryAllDatabases` path.

### 4.3 Parallel query groups (inside `truScoreOptimizedDatabase`)

All groups are started together (`Promise.allSettled`):

| Group | Typical sources |
|-------|-----------------|
| Open Facts | OFF (+ OBF/OPFF/OPF unless food-like OFF already seeded) |
| Local-first | **FSANZ by product name** (AU/NZ) — **not barcode**; USDA (US); other country DBs; FoodAtlas by name; **retailers only if `MVP_MODE` is false** |
| Gold | GS1 (short ~2s race) |
| Enhancements | Commercial nutrition APIs only if env-enabled and nutrition completeness low; Walmart/FoodRepo only if `!MVP_MODE` |
| Fallbacks | Many free barcode APIs (short ~5s race); circuit-breaker aware |

**FSANZ fact:** AFCD/NZFCD enrichment is **name-based**. Wrong or vague product names can attach the wrong nutrition composition even when the barcode→OFF identity is correct.

### 4.4 `MVP_MODE = true` (current)

**File:** `src/data/databases/truScoreOptimizedDatabase.ts`

| Disabled | Still active |
|----------|--------------|
| NZ store APIs | Open Food Facts family |
| AU retailer scrapers | FSANZ-by-name, USDA, FoodAtlas, GS1 |
| Walmart / FoodRepo enrichment | Fallback barcode APIs (subject to env/timeouts) |
| | Commercial nutrition (separate env flag, off by default) |

Code for disabled sources is **retained** for post-MVP reconnection (v0.4 post-MVP backlog).

### 4.5 Progressive UI

Result shows a spinner with phase messages (`fast_sources`, `product_ready`, `product_enhanced`, `complete`, etc.). First usable product clears the spinner; later merges can refine the same screen (`product_refined` / enhanced callbacks).

### 4.6 Timeouts / cache (as coded)

| Mechanism | Approx. behaviour |
|-----------|-------------------|
| In-memory query cache | ~10 minutes, capped size |
| Overall “give up” | No single hard overall timeout in orchestrator comments |
| GS1 race | ~2s |
| Fallback race | ~5s |
| User-merge first paint | ~450ms race before first score |
| User-merge full | up to ~14.5s race before scoring with overlays |

---

## 5. How fields are merged when sources conflict

**File:** `src/services/productDataMerger.ts` → `mergeProducts()`

### 5.1 Base product choice

- Each source gets a score from **field completeness** and **source weight**.  
- **`user_contributed` always ranks first** as base when present.  
- Otherwise roughly **60% completeness + 40% weight**.

### 5.2 Default source weights (illustrative)

| Tier | Examples | Weight (approx.) |
|------|----------|------------------|
| Highest | User contributed | 1.0 |
| High | FSANZ / USDA / other government | ~0.50 |
| Mid-high | GS1, Open Food Facts | ~0.45 |
| Mid | Other Open Facts families, stores | ~0.30–0.40 |
| Low | Free barcode APIs | ~0.20 |
| Lowest | Web search | ~0.10 |

### 5.3 Field rules (as coded)

| Field | Winner rule |
|-------|-------------|
| Product name | Base, else first non-empty |
| Brands | **Union** of brand fields/tags (generics dropped) |
| Nutrition | “Golden source”: OFF first → fill from government if **name similarity ≥ 0.35** → commercial APIs with same guard → then **user nutriments overlay** |
| Ingredients | User ingredients **replace** if present; else **longest** text |
| Categories | Prefer valid OFF, else government, else longest |
| Allergen / additive / origin / label **tags** | Union |
| Certifications | Union (higher-weight order first) |
| Images / packaging string / serving / quantity | Base else first available |

**Important:** The 0.35 name-similarity guard reduces wrong nutrition merges; it does **not** fully prevent wrong-product identity if OFF itself returns the wrong product for a barcode.

---

## 6. Identity: two systems (do not conflate)

v0.4 and UAT discussions often say “identity.” In code there are **two** mechanisms.

### 6.1 Phase 6 Slice 1 — `resolveSharedIdentityContext`

**File:** `src/identity/resolveSharedIdentityContext.ts`  
**Called from:** `buildProductScanResult` (and Result for market display)

| Item | As-built |
|------|----------|
| IDs | Synthetic tokens like `gtin:…`, `brand:cadbury`, `owner:…` — **not** Workstream A `B0241` / `P0009` |
| Inputs | GTIN, brands / brand_owner, market hints, manufacturing places |
| Ambiguity | Flags `missing_brand_candidate`, `multiple_brand_candidates`; status may be `ambiguous`; confidence lowered |
| Fail-closed? | **Soft:** still returns a context (including `brand:unknown`); scan result is **still built** |
| Public market | Never exposes internal `AU+NZ` on `ProductScanResult.market` (maps to safe public values) |

Workstream A CSV loaders under `src/identity/workstreamA/` support **pack validation/scaffold**; they are **not** this Slice 1 resolver.

### 6.2 Reviewed retail chain — Workstream C (Skeleton UAT)

**Files:**  
`src/workstreamC/runtime/workstreamCRuntimePublicationRecords.ts`  
`src/workstreamC/skeleton/resolveWorkstreamCRetailChain.ts`  
Bundled pack: `src/workstreamC/runtime/workstreamCRuntimePack.generated.ts`

| Item | As-built |
|------|----------|
| Gate | Only when `EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT === '1'` at **build time** |
| IDs | Reviewed **B#### / P####** from A-data pack |
| Inputs | Real `Product` brands/name/categories (app does **not** use injected chains) |
| Fail-closed? | **Hard for Signals:** no reviewed match → **no** C Signal cards |
| Cadbury bridge | B0067 + Mondelez P0009 + chocolate/cocoa/confectionery context → B0241 for NGO links; **Skeleton-UAT-only**; biscuits without cocoa cues fail closed |

### 6.3 Layered Signals language (unchanged)

Engine + Skeleton proof ≠ MVP Signals operations. W1 only explains how identity feeds those layers.

---

## 7. Manual / community overlays before scoring

| Mechanism | Effect on merged product / score |
|-----------|----------------------------------|
| **Manual product** saved for barcode | Short-circuits fetch; stamped `user_contributed` |
| **`mergeUserContributedData`** (`productCacheService.ts`) | Overlays Vercel/local manual fields before TruScore; first paint may race (~450ms) so early score can omit slow overlays until refine |
| **Manufacturing country service** | Drives **CoM UI** (verified/disputed/counts). Does **not** automatically rewrite `product.manufacturing_places` for scoring unless also present via OFF or manual-product fields |

This is why Community Verification and Origins need **follow-on specs** (v0.4 §12) before Cursor expands behaviour: today’s overlay rules are implementation history, not founder-accepted product law.

---

## 8. Known failure modes (evidenced)

| Failure mode | What happens today | Evidence |
|--------------|--------------------|----------|
| Empty OFF / no sources | Unknown Product UI (W0); other DBs may still run in background | Result + Optimized service |
| Wrong OFF product for barcode | Downstream score/identity follow that product | Inherent to barcode→OFF |
| FSANZ name mismatch | Wrong nutrition enrichment possible | FSANZ is name-based |
| Brand list ambiguous | Phase-6 flags ambiguity; C retail chain may fail closed | `resolveSharedIdentityContext` tests; C resolver |
| **Nestlé vs Milo (D08)** | OFF `brands: Nestlé` → chain Nestlé not Milo → no Milo Safety Signal | UAT handoff docs — classify as product-data variation |
| Cadbury without cocoa context | No B0241 bridge → no dual NGO Signals | C resolver + assumptions §8 |
| Ethics brand drop after merge | Later merge can leave weak brand strings → ethics match lost | Ethics pillar docs |
| Cache-first stale | Instant cache return; fuller merge may lag | Optimized service |
| User-merge race | First TruScore may miss slow manual fields | 450ms / 14.5s races |
| Retailers off in MVP | No store scrape enrichment | `MVP_MODE` |

---

## 9. What founders should take from W1

| Takeaway | Implication |
|----------|-------------|
| Merge + retrieval are **substantially built** | Matches “Built but unverified” for core scan/retrieval — needs real-product UAT + Claude data-path review |
| Two identity systems | Do not expect Phase-6 `brand:…` tokens to equal A-data `B####` without the C retail resolver |
| Fail-closed is **strong for Skeleton Signals**, **soft for scan assembly** | Ambiguous brands still get a TruScore; they may get **no** C Signals |
| CoM UI ≠ scored manufacturing field automatically | Origins product rules still need the Product Origins Spec |
| Milo/Nestlé class of issues | Will recur until contribution/verification or OFF data quality improves — not fixed by Skeleton engine alone |

**Founder/ChatGPT actions (optional after reading):**

1. Confirm W1 matches observed device behaviour on known UAT GTINs (Cadbury, Ritz, Countdown, Milo).  
2. Confirm whether Claude’s first targeted question should be the Body/Planet **data→score** integrity question listed in the v0.4 acceptance doc.  
3. Do **not** ask Cursor to rewrite merge weights or A-data from this note alone.

---

## 10. Code map (evidence anchors)

| Concern | Path |
|---------|------|
| Normalize | `src/utils/barcodeNormalization.ts` |
| Optimized fetch | `src/services/productServiceOptimized.ts` |
| Parallel DB + MVP_MODE | `src/data/databases/truScoreOptimizedDatabase.ts` |
| Merge | `src/services/productDataMerger.ts` |
| User overlay | `src/services/productCacheService.ts` |
| Manual products | `src/services/manualProductService.ts` |
| CoM contributions | `src/services/manufacturingCountryService.ts` |
| Scan assembly | `src/services/buildProductScanResult.ts` |
| Phase-6 identity | `src/identity/resolveSharedIdentityContext.ts` |
| C retail chain + Cadbury bridge | `src/workstreamC/skeleton/resolveWorkstreamCRetailChain.ts` |
| C runtime gate | `src/workstreamC/runtime/workstreamCRuntimePublicationRecords.ts` |
| Result wiring | `app/result/[barcode].tsx` |
| OFF variants | `src/services/openFoodFacts.ts` |

**Automated tests touching this module (non-exhaustive):**  
`src/__tests__/unit/identity/resolveSharedIdentityContext.test.ts`,  
`src/__tests__/unit/services/productDataMerger` (if present),  
`src/__tests__/unit/workstreamC/resolveWorkstreamCRetailChain.test.ts`,  
`src/data/databases/__tests__/truScoreOptimizedDatabase.test.ts`,  
Phase 6 golden gate (uses identity resolution).

---

## 11. Suggested Claude questions (from this module only)

1. Given OFF + FSANZ name-based merge and the 0.35 nutrition similarity guard, where can conflicting or missing fields still produce **over-confident** Body/Planet scores?  
2. Is soft ambiguity handling in `resolveSharedIdentityContext` (still build scan result) vs hard fail-closed in C retail chain an acceptable split for MVP, or a integrity gap?  
3. Does cache-first + user-merge race create user-visible score flicker or wrong-first-paint risk that should be P1?

---

## 12. Next walkthrough

| ID | Focus |
|----|--------|
| **W2** | Body, Planet, Ethics, Open, Overall TruScore (modules #1–5) — map code to approved scoring specs; representative outcomes |

---

*End of W1. No implementation changes were made for this demonstration.*
