# W9 As-Built Walkthrough — Scan-Result Assembly

**Document type:** Critical Output Integrity as-built demonstration (plain language)  
**Module:** W9 / Critical Output Integrity **#14** — Scan-result assembly  
**Authority:** MVP Launch Plan v0.4; Cursor acceptance `docs/cursor-acceptance-mvp-v0.4-20260803.md` (W9 evidence line)
**Document-control addendum:** 4 August 2026 (authority & alignment for Claude review) — see end of this note.

**Depends on:** W0–W8 (this is the **composition** module — how prior modules meet on one Result screen)  
**Code baseline:** Live `app/result/[barcode].tsx` + `buildProductScanResult` → presentation  
**Status:** As-built facts only. Demonstrates the acceptance evidence path. **Not** launch certification of Confidence / Origins / Signals ops / Verification Specs.

**Date:** 3 August 2026  
**Author:** Cursor (implementation agent)

---

## 1. Purpose & controlling reminder

Acceptance defines W9 evidence as one chain:

> **`buildProductScanResult` → presentation → `app/result/[barcode].tsx`**

This walkthrough shows that chain **as coded**, plus the surrounding fetch → merge → score → confidence → CoM → insights → share/contribute composition that founders experience as “the Result.”

**Controlling reminder:**

| Layer | Status |
|-------|--------|
| Live Result screen | `app/result/[barcode].tsx` (wired in nav stacks) |
| Refactored modular Result | `app/result/[barcode].refactored.tsx` — **not** wired |
| Builder → banner presentation → UI | **Live** |
| Progressive fetch / merge / score before paint | **Live** (optimized product service) |
| Confidence Spec / Origins Spec / Verification Spec / Signals ops | **Not** accepted via this assembly demo |

W9 answers: **how is one consumer Result assembled today?**

---

## 2. One-picture view (as-built)

```
Route: Result { barcode }
        ↓
loadProduct
  validate 8–14 digits
  optional manual short-circuit
  fetchProductOptimized (+ progress phases)
      → cache / OFF / DBs
      → mergeUserContributedData          (W1)
      → applyConfidenceScore              (W3 field on Product)
      → calculateTrustScore / TruScore    (W2)
        ↓ (progressive onProgress may paint early)
Product on Result
        │
        ├── useMemo: Workstream C pubs → buildProductScanResult → BannerAlertsCard  (W6)
        ├── useEffect: copy trust_score → TruScore UI; generateInsights if prefs     (W6 #10)
        ├── useEffect: getManufacturingCountry overlay                              (W4)
        ├── render: ConfidenceBadge + generateProductFlags                          (W3/W5)
        ├── cards: nutrition / CoM / eco / packaging / …                            (W0)
        └── CTAs: ShareModal / ManualProduct / Camera / CoM modal                   (W7/W8)
```

**Acceptance spine (must stay clear):**

```
buildProductScanResult
        ↓
buildBannerAlertsDataFromScanResult  (scanResultPresentation)
        ↓
BannerAlertsCard on app/result/[barcode].tsx
```

---

## 3. Primary screen

| Item | Fact |
|------|------|
| **Live** | `app/result/[barcode].tsx` — Scan / Search / History / Favourites / Alerts stacks via `src/navigation/AppTabs.tsx` |
| **Unused refactor** | `app/result/[barcode].refactored.tsx` — modular cards + `useProductData`; **not** in navigation |
| **Route params** | `{ barcode: string }` only |
| **Wrapper** | Default export in `ErrorBoundary` (`feature="ResultScreen"`) |
| **Loading (no product yet)** | Full-screen spinner + phase copy: `initializing` / `fast_sources` / `enhancement` / `fallbacks` |
| **Progressive paint** | `onProgress` can set `product` and clear spinner before fetch finishes |
| **Pull-to-refresh** | `RefreshControl` → reload path |

---

## 4. Data assembly pipeline

### 4.1 Fetch path (before / while Result paints)

```
barcode
  → loadProduct()
      → /^\d{8,14}$/
      → getManualProduct(barcode)          // short-circuit if local manual
      → fetchProductOptimized(..., onProgress)
           cache / SQLite / OFF / other DBs (phased)
           → mergeUserContributedData      // W1
           → applyConfidenceScore          // W3 on Product
           → calculateTrustScore → calculateTruScore  // W2
      [on failure] fetchProductWithFallback / errorHandlingService
```

**Primary files:**  
`app/result/[barcode].tsx` (`loadProduct`) · `src/services/productServiceOptimized.ts` · `src/services/productCacheService.ts` · `src/utils/confidenceScoring.ts` · `src/utils/trustScore.ts` · `src/lib/truscoreEngine/`

**Merge timing (as-built):** first-paint race ~450ms then score; longer merge race continues and may emit `product_refined`. Constants live in `userContributedProductsService`.

**Phases reported to UI:** `fast_sources` → `enhancement` → `fallbacks` → `product_ready` / `product_refined` / `product_enhanced` / `complete` / `not_found`

### 4.2 Result-side assembly (after Product exists) — largely parallel

| Step | When | Role |
|------|------|------|
| TruScore UI state | `useEffect` on `product` | Copies `product.trust_score` / breakdown; **does not recalculate** if missing → `truScore = null` |
| Insights | Same effect, if Alerts toggles on | `generateInsights` → carousel (W6 #10) |
| CoM overlay | Separate `useEffect` | `getManufacturingCountry` / community stats — **not** in TruScore math (W4) |
| Manual flag | Separate `useEffect` | `isManualProduct` |
| Signals + contract | `useMemo` | C pubs → `buildProductScanResult` → banner data (W6 #7) |
| Score highlights | Render-time | `generateProductFlags` inside TruScore card (W5) |

**Signals attach is client-side on Result**, not inside `fetchProductOptimized`:

```
product + alerts prefs
  → resolveSharedIdentityContext (market)
  → buildWorkstreamCRuntimePublicationRecords
        // [] if EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT ≠ '1'
  → buildProductScanResult({ … })
        // phase6SignalSourceMode defaults to transitional on Result
  → buildBannerAlertsDataFromScanResult → BannerAlertsCard
```

**Builder also sets:** `terminal_state` (`deriveScanTerminalState`), contract `confidence`, `coverage`, partitioned `signals`, `scores` from product — detail in W3 / W6 as-builts.

---

## 5. Vertical composition (live Result, top → bottom)

Matches W0 §3.4 and current JSX:

1. `ProductDisclaimerCard`  
2. `ProductHeroSection` (image / name / brand / take photo)  
3. **`BannerAlertsCard`** — only if `bannerAlerts.hasAlerts`  
4. **Partial-analysis banner** — if `scanResult.terminal_state === 'partial'`  
5. **TruScore card** (or insufficient-data card) containing:  
   - TruScore + pillar bars  
   - “How was this scored?”  
   - **`ConfidenceBadge`** (if `product.confidence !== undefined`)  
   - **Score highlights** green/red (`generateProductFlags`)  
6. **Alerts preference Insights** carousel — if prefs on + insights  
7. **Nutrition** (`NutritionTable` + add/edit CTA)  
8. **Country of Manufacture** (present / “not disclosed” contribute card)  
9. **Eco-Score** — if `shouldShowEcoScoreCard`  
10. **`PalmOilCard`** — mounted but **`PALM_OIL_PRODUCT_CARD_VISIBLE = false`** → renders `null` (palm may still affect score/flags)  
11. **Packaging** — if `shouldShowPackagingCard`  
12. **Carbon footprint** — if `shouldShowCarbonFootprintCard`  
13. **Certifications** — always (empty CTA if none)  
14. **`UniversalPricingCard`**  
15. **Ingredients** (+ NOVA / processing when `nova_group`) or empty CTA  
16. **Allergens & Additives** (in `PremiumGate`) when tags exist — **still live in UI**  
17. **`AdditivesRiskCard`** — null if no MVP/EWG risks  
18. **`ProductDataLimitationsCard`**  
19. **Scan Another Product** footer  

Share icons on TruScore, nutrition, CoM, insights, eco, ingredients, allergens, etc. → `ShareModal` (W8).

**Visibility helpers:** `src/utils/productInfoCardVisibility.ts`

---

## 6. Conditional visibility (as coded)

| Surface | Show when | Hide when |
|---------|-----------|-----------|
| Banner Signals | `hasAlerts` from scan result | No signals after builder/presentation |
| Workstream C governed cards | `EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT=1` **and** reviewed chain | Flag off → empty dynamic C records |
| Partial banner | `terminal_state === 'partial'` | Other terminal states |
| TruScore card | `product.trust_score` + breakdown present | Else insufficient-data card |
| Confidence badge | `product.confidence !== undefined` | Missing confidence field |
| Score highlights | ≥1 green/red flag | Both empty → section omitted |
| Insights | Alerts geo/ethical/env enabled **and** insights length > 0 | Else omitted |
| Eco / Packaging / Carbon | Helper predicates (OFF-backed data) | No meaningful display data |
| Palm product card | Never (constant false) | Always hidden in product card |
| CoM card | Always (found vs contribute) | — |
| Nutrition / certs / ingredients | Always (empty CTAs) | Ingredients can null if text is barcode-only |
| Allergens section | Tags present | No tags |
| Additives risk | MVP/EWG risk matches | `!hasRisks` → null |
| Unknown Product page | `error` **or** `!product` **or** thin/minimal heuristics | Usable product with name or real data |

Skeleton UAT ≠ MVP Signals ops (W0 / W6). Transitional `phase6SignalSourceMode` can still allow legacy/synthetic banners alongside C path.

---

## 7. State / services from Result

| Concern | Mechanism |
|---------|-----------|
| Product load | Local `loadProduct` + `fetchProductOptimized` / fallback |
| Cache / merge | Via optimized + `productCacheService` |
| Network | `useNetworkStatus` → offline into fetch + builder |
| Premium | `useSubscriptionStore` |
| Alerts prefs | `useAlertsStore` → insights + builder preferences |
| History / favourites | `useScanStore.addScan`, `useFavoritesStore` |
| Scan contract | `useMemo` → `buildProductScanResult` |
| CoM | `manufacturingCountryService` + `extractManufacturingCountry` |
| Manual / photo | `manualProductService`, `uploadProductPhoto`, `cacheProduct` |
| Obs | `logScanObs` / `generateScanId` |
| Refactored-only | `useProductData` in unused `.refactored.tsx` |

---

## 8. Error / empty / unknown paths

| Path | Behaviour |
|------|-----------|
| Invalid barcode | `error` + `not_found` → Unknown UI |
| Null / miss | Unknown Product: Add Product Information, View OFF website, Scan Another |
| Thin / placeholder name | Heuristics → Unknown |
| Fetch throw | Fallback service; may still Unknown |
| Offline | Terminal may be `offline`; offline-first incomplete (W0) |
| Null TruScore with usable product | Insufficient-data card; other cards still mount |
| Partial analysis | Banner while incomplete / partial terminal |

Unknown CTAs are skippable (W0 §3.6 / W7).

---

## 9. Cross-module wiring (W0–W8 → Result)

| Module | Critical # | Lands on Result as |
|--------|------------|-------------------|
| **W0** | Journey | Screen shell, unknown / share / contribute exits |
| **W1** | #12 Identity & merge | Pre-Result fetch/merge; identity into builder market/context |
| **W2** | #1–5 Pillars | `trust_score` / TruScore card / analysis modal |
| **W3** | #8 Confidence | `applyConfidenceScore` on Product; `ConfidenceBadge`; builder `confidence` (**demo only — not accepted Spec**) |
| **W4** | #6 Origins/CoM | CoM card + `manufacturingCountryService` |
| **W5** | #9 Highlights | Green/red under TruScore |
| **W6** | #7 + #10 | `BannerAlertsCard` + preference Insights (≠ Signal-card summariser) |
| **W7** | #13 Contribute | Unknown CTAs, photo, CoM, manual edit |
| **W8** | #11 Sharing | Per-card share → `ShareModal` / deep links |

This module (**#14**) is the **assembly** of the above — not a new scoring or Signals Spec.

---

## 10. Tests (assembly-adjacent)

| File | Covers |
|------|--------|
| `src/__tests__/unit/services/buildProductScanResult.mappingOwner.test.ts` | Builder mapping owner |
| `src/__tests__/unit/services/buildProductScanResult.slice6DynamicSignals.test.ts` | Dynamic publication → signals |
| `src/__tests__/golden/scanOutputContract.golden.test.ts` | Scan contract golden |
| `src/__tests__/golden/phase6.releaseHardening.test.ts` | `phase6SignalSourceMode` |
| `src/__tests__/unit/utils/scanResultPresentation.test.ts` | Banner presentation / dedupe |
| `src/__tests__/unit/workstreamC/workstreamCRuntimePublicationRecords.test.ts` | Runtime C → builder |
| `src/__tests__/unit/workstreamC/skeletonPublicationRecords.test.ts` | Skeleton → builder |

**Not found:** dedicated Jest mount of `app/result/[barcode].tsx`. Pillar/merge tests live under W1–W2 suites separately.

---

## 11. Gaps vs acceptance W9 (quoted; not Spec)

Acceptance **only** defines W9 evidence as:

> **W9** | #14 Scan-result assembly | `buildProductScanResult` → presentation → `app/result/[barcode].tsx`

**As-built vs that one-liner:**

| Expectation | Status |
|-------------|--------|
| That chain exists and is live on Result | **Yes** |
| Progressive fetch → merge → score → confidence before / during paint | **Yes** (surrounding assembly) |
| Extra W9 Spec criteria beyond that evidence path | **None listed** in acceptance |
| Confidence / Origins / Verification / Signals ops accepted because Result composes them | **No** — composition ≠ Spec acceptance (see acceptance §4 Confidence row) |

**Related as-built facts (not new Spec):** allergens UI still live; palm product card hidden; Skeleton UAT flag required for C Signals; paywall UI reachable elsewhere in shell (W0).

---

## 12. Key file index

```
app/result/[barcode].tsx                          # LIVE
app/result/[barcode].refactored.tsx               # unused
src/navigation/AppTabs.tsx
src/services/productServiceOptimized.ts
src/services/productCacheService.ts
src/services/buildProductScanResult.ts
src/utils/scanResultPresentation.ts
src/utils/confidenceScoring.ts
src/utils/productFlags.ts
src/utils/productInfoCardVisibility.ts
src/utils/deriveScanTerminalState.ts
src/workstreamC/runtime/workstreamCRuntimePublicationRecords.ts
src/components/BannerAlertsCard.tsx
src/components/ConfidenceBadge.tsx
src/components/InsightsCarousel.tsx
src/components/ShareModal.tsx
src/lib/truscoreEngine/
src/lib/alertsInsights.ts
docs/as-built/W0-end-to-end-consumer-journey-20260803.md
docs/as-built/W1-identity-and-data-merge-20260803.md
docs/as-built/W2-truscore-four-pillars-20260803.md
docs/as-built/W3-confidence-and-missing-data-20260803.md
docs/as-built/W4-product-origins-com-20260803.md
docs/as-built/W5-score-highlights-20260803.md
docs/as-built/W6-chaining-signals-and-commentary-20260803.md
docs/as-built/W7-community-contribution-and-verification-20260803.md
docs/as-built/W8-sharing-20260803.md
docs/cursor-acceptance-mvp-v0.4-20260803.md
```

---

## 13. Bottom line for founders / Claude

**What exists:** One live Result screen that progressively loads a Product (merge + TruScore + confidence fields), then in parallel attaches the scan contract / banner Signals, CoM overlay, preference Insights, highlights, and share/contribute CTAs in a fixed top-to-bottom card stack.

**Acceptance evidence path:** `buildProductScanResult` → `scanResultPresentation` → `BannerAlertsCard` on `app/result/[barcode].tsx` is **live**.

**What assembly does not decide:** Whether Confidence, Origins, Signals ops, or Community Verification are MVP-ready — those remain Spec / ops work. W9 only shows **how today’s pieces are wired together**.

---

## Document-control addendum — Authority & alignment (4 August 2026)

**Addendum type:** Document-control and review preparation for Claude (not a re-implementation).  
**Scope of change:** Authority citation, terminology position, alignment assessment, effect on original findings, outstanding authority.  
**Original technical evidence:** Remains the body of this note unless expressly revised below.  
**Implementation authority:** None — this addendum does **not** authorise code changes, inferred requirements, or redesign.

**Controlling scope document (shared):**  
*Rveel MVP Launch Plan and Scope Baseline* (**v0.4**, **3 August 2026**) — external file `Rveel_MVP_Launch_Plan_and_Scope_Baseline_20260803_v0_4.docx` (Desktop; not stored in this repo). Also referred to by founders as the MVP Scope Document v0.4.

**Companion founder/ChatGPT instruction:**  
*Rveel Response to Cursor Review and Submission of MVP Scope v0.4* (**3 August 2026**) — `Rveel_Response_to_Cursor_and_v0_4_Submission_20260803.docx`.

**In-repo acceptance mirror:** `docs/cursor-acceptance-mvp-v0.4-20260803.md` (**3 August 2026**).

**Status vocabulary:** Use **Post-MVP** for capability expressly excluded from the current MVP plan in v0.4 §3.3 / §13 (do not use alternate labels such as “deferred cosmetic” for those items).


### A. Controlling specification / instruction for this workstream

| Field | Value |
|-------|-------|
| **Controlling scope outcome** | *MVP Launch Plan and Scope Baseline* v0.4 §4 Critical Output **#14** (faithfully carry scores, confidence, Highlights, Signals, Origins and sources into consistent consumer output); §3.1 Consumer UI; §4 Cross-cutting UI requirement |
| **Engineering contract** | `ProductScanResult` / `buildProductScanResult` (Phase 4/6 scan contract) — engineering, not substitute for product Specs |
| **Instruction** | Cursor acceptance W9 evidence line |

### B. Inferred during development (not expressly specified)

| Behaviour | Classification |
|-----------|----------------|
| Card order / visibility helpers | Historical UX composition — UI Acceptance Plan will govern polish |
| Allergens section still assembled on Result | **Post-MVP** capability still composed into MVP Result — isolation gap (W0) |
| Palm product card hidden constant | Implementation park — confirm vs Planet/Highlights intent |

### C. Terminology and version position

| Legacy / alternate | Current | Naming only or functional? |
|--------------------|---------|----------------------------|
| TrustScoreInfoModal / TruScore naming | TruScore | Naming |
| Banner alerts vs Signals | Signals (#7) | Prefer Signals language in founder reporting |

### D. Current alignment assessment

**Partially aligned** — acceptance spine `buildProductScanResult` → presentation → Result is live.

**Not aligned** with #14 “faithfully carry … confidence … Origins and sources” as a complete consumer honesty outcome (confidence/Origins Specs pending; share stripping is W8).

**Post-MVP isolation gap:** Allergens still in assembly.

### E. Effect on original W9 findings

| Original finding | Effect |
|------------------|--------|
| Pipeline + card stack inventory | **Remain valid** |
| Composition ≠ Spec acceptance | **Reinforced** |
| Allergens live on Result | **Revised:** treat as **Post-MVP isolation** issue |

### F. Outstanding authority required

| Need | Owner |
|------|--------|
| **Follow-on specifications** — Confidence, Origins, Verification (feed assembly honesty) | Founders + ChatGPT |
| **UI and Content Acceptance Plan** | Founders + ChatGPT |
| **Approved implementation** — allergen/paywall isolation | Founder auth → Cursor |
| **Claude technical review** — after Specs where material | Claude |

*End of document-control addendum for this workstream. No implementation changes were authorised or made.*
