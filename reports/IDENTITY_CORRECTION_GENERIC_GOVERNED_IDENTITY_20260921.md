# Closure Report — Generic Governed Identity Correction for Dynamic Signals

**Date:** 2026-09-21  
**Branch:** `refresh/si-v016-ktc-bbfaw-20260918`  
**Baseline (independent QA tip):** `440d010bc23bdc78dabb513db594f02c0650716e`  
**Correction tip:** `1c11cd0baa24a4dc9e590bdfc7e36b21bfb203b4`  
**Worktree:** `C:\TrueScan-FoodScanner-wt-si-benchmark-refresh`  
**Wave 3:** not integrated  
**UAT build:** not cut  

**Authority:** Founder corrective doctrine — Rveel Chaining/identity is a generic governed resolution system; Dynamic Signals consume resolved identity context; no GTIN catalogue prerequisite; no brand/product/Signal-specific application branches.

---

## 1. Verdict

The production scan path now resolves ordinary product fields through one generic identity resolver (brand/parent chain → product-family aliases → product-identity aliases), then evaluates Signal targets against that context. Product/product-family Signals no longer require pre-enumerated GTIN membership as the bridge.

**Publishable corpus (ordinary scan):** **25 works / 1 held** (of 26 publishable heads).  
Prior tip counts **12/18** and **3/8** are superseded and must not be reused.

Resolver / matcher application code contains **no** product-, brand-, or Signal-id hardcoding.

---

## 2. Generic identity flow implemented

```
barcode/product lookup payload
  → resolveReviewedRetailChainUnified (canonical brands + approved aliases + child-brand hierarchy)
  → brand_id / parent_id
  → resolveReviewedProductFamilyIdsFromScan (GTIN membership ∪ governed family aliases + brand/parent/market anchors)
  → resolveReviewedProductIdentityIdsFromScan (governed product-identity aliases + brand/parent/market anchors)
  → Asset target evaluation (target_type + canonical_target_id + propagation_mode + guards)
  → Safety overlay: Food Recall Matcher eligibility; identity match without pack dates → batch_check_required
```

Failure modes fail closed:

| Condition | Behaviour |
|-----------|-----------|
| No governed brand/alias match | No Signal |
| Brand resolves; family/product alias does not | No product/family Signal |
| Ungoverned product name | No Signal |
| Recall identity match; no pack batch/date evidence | Signal may publish with `batch_check_required` — does **not** claim the physical pack is affected |
| Ambiguous brand alias collision | Chain fails closed (null brand) |

GTIN remains optional exact identifier when a reviewed membership/link exists. It is **not** required to pre-enumerate every sellable SKU.

---

## 3. Schema / code files changed

### Runtime / identity (generic)

| File | Change |
|------|--------|
| `src/identity/chaining/productFamilyMaps.ts` | Family alias maps + `resolveReviewedProductFamilyIdsFromScan` |
| `src/identity/chaining/productIdentityMaps.ts` | **New** product-identity maps + scan resolver |
| `src/dynamicSignals/asset/v0.2/buildDynamicSignalsAssetRuntimePublicationRecords.ts` | Production path runs family + product-identity resolvers; no injected IDs |
| `src/dynamicSignals/asset/v0.2/matchDynamicSignalsAsset.ts` | `exact_only` accepts `product_identity_ids` as well as barcode===canonical |
| `src/dynamicSignals/asset/v0.2/loadDynamicSignalsAssetPack.ts` | Parses family/product-identity alias CSVs into pack |
| `src/dynamicSignals/asset/v0.2/buildAssetGovernedFoodRecallPublicationRecords.ts` | Identity-aware Safety: identity hit → `batch_check_required` when dates/batches absent |
| `src/workstreamC/recall/evaluateStructuredFoodRecallMatch.ts` | Non-empty GTIN-only exact match (no empty-string invent) |
| `app/result/[barcode].tsx` | **NA-022:** clear stale Signal records when `signalsEvalContext` is null |
| `scripts/generate-dynamic-signals-asset-runtime-embed.ts` | Embed includes new alias/identity CSV arrays |
| `src/dynamicSignals/asset/v0.2/dynamicSignalsAssetRuntimeEmbed.generated.ts` | Regenerated |

### Governed assets (generic, reusable)

| File | Change |
|------|--------|
| `workstreamA/.../v0.3/product_family_aliases.csv` | **New** — reviewed phrase aliases for product families |
| `workstreamA/.../v0.3/product_identities.csv` | **New** — reviewed product identities (PI_*) |
| `workstreamA/.../v0.3/product_identity_aliases.csv` | **New** — reviewed product-name aliases |
| `workstreamA/.../v0.3/product_families.csv` | Reviewed family anchors (Coles B0200, Austral, Mon Sire, etc.) |
| `workstreamA/.../v0.3/canonical_brands_extension.csv` | Mon Sire / related additive brands |
| `workstreamA/.../v0.3/canonical_parents_extension.csv` | Matching parents |
| `workstreamA/.../v0.3/brand_aliases_extension.csv` | Chickadees / Mon Sire display forms |
| `workstreamA/.../wave1-v0.16/input/brand_aliases.csv` | **A0053 narrowed:** bare `Anchor` no longer aliases to B0332 (collided with retail B0139) |
| `workstreamC/.../signal_targets.csv` | Exact-product targets bound to `PI_*` where governed |
| `workstreamC/.../signals.csv` / `food_recall_eligibility.csv` | Eligibility for Safety identity path (12 Safety rows) |

### Assurance

| File | Role |
|------|------|
| `src/__tests__/unit/dynamicSignals/productionPath.identitySignals.test.ts` | Production-path proofs (no injected family/product IDs) |
| `src/__tests__/unit/dynamicSignals/na022.staleSignalsClear.test.ts` | NA-022 clear-on-null + Result source contract |
| `src/__tests__/unit/dynamicSignals/phaseE.refresh20260918.test.ts` | Expectations updated for resolved PI_* |
| `src/__tests__/unit/dynamicSignals/assetV03Pack.test.ts` | Chen chilli oil target now `PI_*` resolved |
| `reports/IDENTITY_CORRECTION_ORDINARY_SCAN_CORPUS_20260921.json` | Full corpus ordinary-scan reassessment |
| `scripts/_local_ordinary_scan_corpus_reassess.ts` | Reproducible corpus runner |

**Not changed:** TruScore / Claims / Body / Planet / Open / scoring methodology / consumer UI chrome / Wave 3 / ownership research breadth / GTIN catalogue.

---

## 4. No product-/brand-/Signal-specific matcher logic

Static scan of identity resolver + Asset runtime entry + matcher:

- No `if (brand == …)` / `signal_id === 'SIG-…'` branches
- No Leggo / Chickadees / Hoyt / Pams / Vogel string literals in those modules
- Targets and aliases live only in governed CSV / embed rows
- Current Signal set is regression fixtures only

Production-path test also asserts the same markers are absent from resolver sources.

---

## 5. Production-path test evidence

Suite: `productionPath.identitySignals.test.ts` (+ NA-022, phaseE, assetV03, NA-019/020) — **48/48 PASS**.

Unrelated fixtures exercised through **ordinary** product name + brands + market (no injected `product_family_id` / `product_identity_id`):

| Fixture | Proves |
|---------|--------|
| Leggo's Tomato Paste vs Leggo's sauce | Family alias + sibling fail-closed |
| Hoyt's turmeric vs paprika | Family alias specificity |
| Cadbury chocolate → SIG-IN-GL-003; Mars does not | Entity descendants, one resolver |
| Chickadees 190g → Safety + `batch_check_required` | Product identity without GTIN; recall pack-check |
| Woolworths Multi Grain 500g vs Woolworths milk | Product identity scope, not entity-wide |
| AU Mon Sire 1kg vs NZ Mon Sire Brie | Market-separated identity |
| Unknown brand/product | Fail closed |

---

## 6. Ordinary-scan corpus reassessment (full founder-approved set)

Clock: `2026-09-18T12:00:00.000Z`  
Artefact: `reports/IDENTITY_CORRECTION_ORDINARY_SCAN_CORPUS_20260921.json`

### Publishable heads (public path)

| Metric | Count |
|--------|------:|
| Publishable Signals | 26 |
| **Works from ordinary scan** | **25** |
| **Held** | **1** |

**Works (25):**  
`SIG-SR-AU-001-20260918`, `SIG-SR-AU-002-20260918`, `SIG-SR-NZ-002-20260918`, `SIG-SR-AU-003-20260918`, `SIG-IN-AU-001-20260918`, `SIG-IN-AU-002-20260918`, `SIG-IN-AU-003-20260918`, `SIG-IN-AU-004-20260918`, `SIG-IN-AU-005-20260918`, `SIG-IN-GL-001-20260918`, `SIG-IN-NZ-001-20260918`, `SIG-IN-NZ-002-20260918`, `SIG-IN-NZ-003-20260918`, `SIG-IN-GL-002-20260918`, `SIG-IN-NZ-004-20260918`, `SIG-IN-NZ-005-20260918`, `SIG-SR-AU-004-20260918`, `SIG-SR-AU-005`, `SIG-SR-AU-006`, `SIG-SR-AU-007`, `SIG-SR-AU-008`, `SIG-SR-NZ-004`, `SIG-SR-NZ-005`, `SIG-SR-NZ-006`, `SIG-IN-GL-003`

### Residual publishable hold (1)

| Signal | Missing governed element (not “no GTIN”) |
|--------|------------------------------------------|
| `SIG-SR-NZ-003-20260918` (Vogel's MPI metal) | Brand/parent **do** resolve (`B0175`/`P0040`). Family `PF_VOGELS_MPI_METAL_20260811` has **no reviewed product-family aliases** naming the exact MPI product lines. Ordinary scan product names therefore cannot join the family without inventing identity. Hold is intentional fail-closed until exact MPI product-line alias terms are stewarded. |

### Non-publishable / predecessor rows (18)

Remaining corpus rows are predecessor/`candidate` (or otherwise non-public) heads. They are **not** counted as ordinary-scan failures of the identity capability; public successors supersede them. Full per-row detail is in the JSON artefact.

### Schema note (Anchor alias)

Bare alias `A0053: Anchor → B0332 (Anchor Food Professionals)` collided with canonical retail `B0139: Anchor` and caused chain fail-closed. Narrowed to distinctive `Anchor Food Professionals` so ordinary `brands=Anchor` resolves to B0139. This is a generic alias-collision correction, not a Signal-specific rule.

---

## 7. NA-022

**Defect:** After Core Truth authority loss, `signalsEvalContext` became null but prior `dynamicSignalRecords` could remain on screen.

**Fix (smallest):** In `app/result/[barcode].tsx` Signals `useEffect`, when `!ctx`, clear `setDynamicSignalRecords([])`, reset ready outcome and eval key, return.

**Tests:** `na022.staleSignalsClear.test.ts` — behavioural clear-on-null + source contract assert (`NA-022`, `setDynamicSignalRecords([])`).

No Signals state-management redesign.

---

## 8. Deterministic regeneration

```
DSA_EMBED_GENERATED_AT=2026-09-21T00:00:00.000Z
npm run generate:dsa-asset-runtime-embed
```

| Proof | Value |
|-------|-------|
| Embed SHA256 (run 1 = run 2) | `CEECD89731F185C04EB598446C22BE9146FE6D2310E2ED069B9425FD21918C65` |
| Deterministic | **true** |

---

## 9. Downloadable artefacts

### Report

- Browse: `https://github.com/TrueScanOnline/TruScore/blob/2ef949d04f734baacaeb5b08eaa8f6cc64f26ea8/reports/IDENTITY_CORRECTION_GENERIC_GOVERNED_IDENTITY_20260921.md`
- Local: [file:///C:/TrueScan-FoodScanner-wt-si-benchmark-refresh/reports/IDENTITY_CORRECTION_GENERIC_GOVERNED_IDENTITY_20260921.md](file:///C:/TrueScan-FoodScanner-wt-si-benchmark-refresh/reports/IDENTITY_CORRECTION_GENERIC_GOVERNED_IDENTITY_20260921.md)

### Corpus JSON

- Browse: `https://github.com/TrueScanOnline/TruScore/blob/1c11cd0baa24a4dc9e590bdfc7e36b21bfb203b4/reports/IDENTITY_CORRECTION_ORDINARY_SCAN_CORPUS_20260921.json`
- Local: [file:///C:/TrueScan-FoodScanner-wt-si-benchmark-refresh/reports/IDENTITY_CORRECTION_ORDINARY_SCAN_CORPUS_20260921.json](file:///C:/TrueScan-FoodScanner-wt-si-benchmark-refresh/reports/IDENTITY_CORRECTION_ORDINARY_SCAN_CORPUS_20260921.json)

### Correction tip

- Browse: `https://github.com/TrueScanOnline/TruScore/commit/1c11cd0baa24a4dc9e590bdfc7e36b21bfb203b4`

### Baseline QA tip

- `https://github.com/TrueScanOnline/TruScore/commit/440d010bc23bdc78dabb513db594f02c0650716e`

---

## 10. Scope confirmation

| Item | Status |
|------|--------|
| Chaining / KTC 2026 / BBFAW 2025 / lineage / 8 new Signals / commentary | Preserved |
| Scoring / Claims / Body / Planet / Open / TruScore / consumer UI | Unchanged |
| Wave 3 | Not integrated |
| Build | Not cut |
| Broad GTIN catalogue | Not created |
| Architectural contradiction | **None** — canonical/alias doctrine implemented generically |
