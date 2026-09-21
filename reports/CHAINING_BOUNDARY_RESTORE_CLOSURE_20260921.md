# Closure Report — Chaining Boundary Restore + Workstream C Product Scope

**Date:** 2026-09-21  
**Branch:** `refresh/si-v016-ktc-bbfaw-20260918`  
**Baseline tip:** `e32626f73ac02302302080e78f1b397f0c998358`  
**Correction tip:** _(filled after commit)_  
**Wave 3:** not merged  
**UAT build:** not cut  

**Authority:** Founder architecture correction — Shared Identity / Chaining owns durable corporate and brand identity only; product-level Signal matching belongs entirely in Dynamic Signals (Workstream C).

---

## 1. Verdict

The Chaining / Shared Identity boundary is restored. Active v0.16 / v0.3 no longer govern products, product families, product aliases, or GTIN→brand ownership links.

**Acceptance test:** a normal product scan resolves brand/owner through parent/brand/brand-alias Chaining only, then Dynamic Signals decides from Workstream C governed product-scope criteria whether a Signal applies.

**Publishable ordinary-scan corpus:** **25 works / 1 held** (of 26 publishable heads).  
Sole hold: `SIG-SR-NZ-003-20260918` (Vogel’s) — brand resolves; no reviewed product-scope criteria for exact MPI product lines (intentional fail closed).

---

## 2. Intended production flow (implemented)

```
barcode scan
  → normal product-data retrieval
  → brand / manufacturer fields
  → Shared Identity: canonical brands + approved brand aliases + child-brand / parent hierarchy
  → canonical ownership chain (brand_id / parent_id)
  → Dynamic Signals: brand/entity targets + Workstream C product-scope criteria + food-recall overlay
  → Signal card or fail closed
```

| Layer | Answers |
|-------|---------|
| Shared Identity / Chaining | Whose brand is this? |
| Dynamic Signals | Does this approved Signal apply to this scanned product? |

---

## 3. Removed from active Shared Identity / Chaining

### Data deleted from `workstreamA/a-data/chaining-extensions/v0.3/`

- `product_families.csv`
- `product_family_aliases.csv`
- `product_family_membership.csv`
- `product_identities.csv`
- `product_identity_aliases.csv`

### Runtime / maps deleted

- `src/identity/chaining/productFamilyMaps.ts`
- `src/identity/chaining/productIdentityMaps.ts`

### GTIN-link scaffold retired

- `workstreamA/a-data/wave1-v0.16/input/gtin_brand_links.csv` — header-only (provisional rows removed)
- `gtin_brand_links_extension.csv` — remains empty header
- Embed generator embeds `gtinRows: []`
- `loadADataForChainFromEmbed` passes empty gtin rows
- `resolveWorkstreamCRetailChain` no longer calls `tryReviewedGtinChain`
- Architecture regression: `chainingArchitectureBoundary.test.ts` + assetV02 “Finding B retired”

Historical `v0.15` / `v0.2` / earlier snapshots are **untouched**.

### Shared Identity API cleanup

- Removed `product_family_ids` from `SharedIdentityContext` / `resolveSharedIdentityContext`

### Preserved brand-identity corrections

- Anchor bare-alias narrowing (`A0053` → distinctive Food Professionals form) retained
- Phase A/B parent/brand additions and hierarchy retained
- KTC 2026 / BBFAW 2025 / scoring / Claims / UI / Wave 3 untouched

---

## 4. Active Chaining inventory (v0.16 + v0.3)

| Artefact | Role |
|----------|------|
| `canonical_brands.csv` + `canonical_brands_extension.csv` | Canonical brands |
| `canonical_parents.csv` + `canonical_parents_extension.csv` | Canonical parents/entities |
| `brand_aliases.csv` + `brand_aliases_extension.csv` | Approved brand aliases |
| `brand_child_of_brand.csv` | Child-brand hierarchy |
| `entity_child_of_entity.csv` | Entity hierarchy |

README statements updated in `wave1-v0.16/README.md` and `chaining-extensions/v0.3/README.md`.

---

## 5. Workstream C product-scope evaluator

**Module:** `src/dynamicSignals/productScope/signalProductScopeEvaluator.ts`

**Schema:** `workstreamC/c-data/dynamic-signals-v0.3/input/signal_target_product_criteria.csv`

| Column | Purpose |
|--------|---------|
| `criterion_id` | Stable criterion id |
| `signal_target_id` | Links to `signal_targets` |
| `market_key` | AU / NZ / AU+NZ |
| `required_brand_id` / `required_parent_id` | Optional ownership anchors (references into SI) |
| `match_field` | `product_name` \| `gtin` |
| `match_mode` | `phrase_contains` \| `exact_normalized` |
| `match_value` / `match_value_normalized` | Exact governed scope terms |
| `review_state` / provenance | Fail closed unless `reviewed` |

**Behaviour:** deterministic normalisation + exact phrase/exact comparison; OR across criteria for a target; AND with brand/parent/market anchors; no brand/product/`signal_id` hardcoding.

Product / product_family targets rebinding: `canonical_target_id` now equals `signal_target_id` (scope keyed in C), not `PI_*` / `PF_*` SI identities.

Food recalls: product identification via same product-scope criteria; missing batch/date → `batch_check_required` (check-pack); optional verified GTIN remains in `food_recall_*` evidence only.

---

## 6. Ordinary-scan corpus

Artefact: `reports/CHAINING_BOUNDARY_ORDINARY_SCAN_CORPUS_20260921.json`

| Metric | Count |
|--------|------:|
| Publishable heads | 26 |
| Works from ordinary scan | **25** |
| Held | **1** |

**Held:** `SIG-SR-NZ-003-20260918` — Vogel’s brand/parent resolve; TGT-125 has no reviewed product-scope criteria naming exact MPI product lines. Not “missing GTIN”.

Predecessors remain non-public (`candidate`) and are not counted as ordinary-scan capability failures.

---

## 7. Assurance

| Suite | Result |
|-------|--------|
| Production-path (brand-only + WSC scope) | PASS |
| Chaining architecture boundary | PASS |
| NA-022 stale Signal clear | PASS |
| phaseE / assetV03 / assetV02 / NA-019/020 / retail chain | PASS (100 tests in combined run) |

Deterministic embed regen (`DSA_EMBED_GENERATED_AT=2026-09-21T12:00:00.000Z`):

`SHA256=75209C8E2DC89F05F238C2F556795C3B6F79002066F78640F1615FA307EAA812` (run1 = run2).

---

## 8. Changed files (from baseline tip)

Primary deltas (representative):

- Removed SI product_* CSVs + productFamilyMaps / productIdentityMaps
- Added `signal_target_product_criteria.csv` + product-scope evaluator
- Rewired Asset pack loader / matcher / runtime / food-recall overlay / embed generator
- Retired GTIN chain fallback + emptied active `gtin_brand_links.csv`
- Updated READMEs (Chaining + DSA)
- Tests: production-path, architecture boundary, assetV02 Finding B retired
- Corpus + this closure report

Supersedes prior identity-correction report framing product families as Chaining.

---

## 9. Scope confirmation

| Item | Status |
|------|--------|
| Benchmarks KTC/BBFAW | Unchanged |
| Scoring / Claims / Body / Planet / Open / TruScore | Unchanged |
| Wave 3 | Not merged |
| Consumer UI | Unchanged |
| NA-022 | Preserved |
| Anchor alias governance | Preserved |
| Build | Not cut |

---

## 10. Downloadable artefacts

### This report

- Browse: `https://github.com/TrueScanOnline/TruScore/blob/refresh/si-v016-ktc-bbfaw-20260918/reports/CHAINING_BOUNDARY_RESTORE_CLOSURE_20260921.md`
- Raw: `https://github.com/TrueScanOnline/TruScore/raw/refresh/si-v016-ktc-bbfaw-20260918/reports/CHAINING_BOUNDARY_RESTORE_CLOSURE_20260921.md`
- Local: [file:///C:/TrueScan-FoodScanner-wt-si-benchmark-refresh/reports/CHAINING_BOUNDARY_RESTORE_CLOSURE_20260921.md](file:///C:/TrueScan-FoodScanner-wt-si-benchmark-refresh/reports/CHAINING_BOUNDARY_RESTORE_CLOSURE_20260921.md)

### Corpus JSON

- Browse: `https://github.com/TrueScanOnline/TruScore/blob/refresh/si-v016-ktc-bbfaw-20260918/reports/CHAINING_BOUNDARY_ORDINARY_SCAN_CORPUS_20260921.json`
- Raw: `https://github.com/TrueScanOnline/TruScore/raw/refresh/si-v016-ktc-bbfaw-20260918/reports/CHAINING_BOUNDARY_ORDINARY_SCAN_CORPUS_20260921.json`
- Local: [file:///C:/TrueScan-FoodScanner-wt-si-benchmark-refresh/reports/CHAINING_BOUNDARY_ORDINARY_SCAN_CORPUS_20260921.json](file:///C:/TrueScan-FoodScanner-wt-si-benchmark-refresh/reports/CHAINING_BOUNDARY_ORDINARY_SCAN_CORPUS_20260921.json)
