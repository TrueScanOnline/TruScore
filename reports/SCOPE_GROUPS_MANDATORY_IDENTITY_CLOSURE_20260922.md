# Founder final correction — Signal scope groups + mandatory Chaining identity

**Branch:** `refresh/si-v016-ktc-bbfaw-20260918`  
**Base tip:** `acc039a5d7c28bab4b5e81d0fc029ebbf5dc7c67` (architecture boundary accepted; this tip corrects implementation defects only)  
**Architecture (unchanged):** Shared Identity = parents + brands/child-brands + brand aliases + hierarchy only. Workstream C = product-specific Signal scope.

## Schema / code delta

| Area | Change |
| --- | --- |
| `signal_target_product_criteria.csv` | Added `scope_group_id`. 84 reviewed criteria rows. Conditions within one group are AND; complete alternative groups are OR. |
| `signalProductScopeEvaluator.ts` | AND-within-group / OR-between-groups; mandatory `brand_id`/`parent_id`; `pack_quantity` uses scan `quantity` / `product_quantity` / `product_quantity_unit` (+ product name fallback); skips unanchored reviewed rows; exact/fail-closed. |
| Runtime publication path | Passes quantity fields through `matchDynamicSignalsAsset` / `buildDynamicSignalsAssetRuntimePublicationRecords`. |
| Chaining anchors | Minimal governed brands/parents/aliases for Red Hat (`B0799`/`P0178`), JC Seafood (`B0800`/`P0179`), Dongwon (`B0801`/`P0180`) — no products/GTINs in Chaining. |
| Vogel’s | Six official MPI product+pack scope groups under existing `B0175`/`P0040` (Workstream C only). |
| GTIN scaffold | Removed active `gtin_brand_links.csv` and `gtin_brand_links_extension.csv`. Active `WORKSTREAM_A_FILES` no longer lists GTIN; historical packs may still use `RETIRED_WORKSTREAM_A_FILES.GTIN_BRAND_LINKS`. |
| Embed | Regenerated with `criteria=84`, `brands=796`; no GTIN rows in embed object. |

## Proof — AND within scope / OR between complete alternatives

Unit suite `productScope.andOrGroups.test.ts`:

- Pams `TGT-105__pack`: beef lasagne **and** 1.3kg → match; beef lasagne + wrong size → no match; wrong line + 1.3kg → no match.
- Cage-free eggs: two complete alternative groups both match (OR).
- Wrong brand / wrong market → no match.

Production-path: Pams/Chickadees/Woolworths/Vogel’s pack-size discriminators fire only on complete scope.

## Partial-match negative tests

Covered in `productScope.andOrGroups.test.ts` and `chainingArchitectureBoundary.test.ts`:

| Case | Result |
| --- | --- |
| Correct brand + product line + wrong pack size | no Signal |
| Correct brand + pack size + wrong product line | no Signal |
| Correct product wording + wrong brand | no Signal |
| Correct product/brand + wrong market | no Signal |
| Perfect product wording + `brand_id=null` / `parent_id=null` | no Signal |

## Proof — product-specific Signals require resolved Chaining identity

- Evaluator hard-fails when both `brand_id` and `parent_id` are null.
- Every reviewed criteria row has `required_brand_id` and/or `required_parent_id` (architecture test).
- Unanchored product-name matching alone cannot publish.

## Active Chaining file inventory (no GTIN / product artefacts)

**`workstreamA/a-data/wave1-v0.16/input/`**

- alias_harvest_candidates.csv
- brand_aliases.csv
- canonical_brands.csv
- canonical_parents.csv
- catalogue_audit_observations.csv
- enum_dictionary.csv
- operational_entities.csv
- ownership_change_candidates.csv
- parent_extension_candidates.csv
- source_registry.csv
- stewardship_action_log.csv
- wave1_control_surface.csv

**`workstreamA/a-data/chaining-extensions/v0.3/`**

- brand_aliases_extension.csv
- brand_child_of_brand.csv
- canonical_brands_extension.csv
- canonical_parents_extension.csv
- entity_child_of_entity.csv
- README.md

Absent: `gtin_brand_links*.csv`, `product_*.csv`, product identity maps under chaining.

## Ordinary-scan corpus (production path)

Source: `reports/SCOPE_GROUPS_MANDATORY_IDENTITY_ORDINARY_SCAN_CORPUS_20260922.json`

| Metric | Count |
| --- | --- |
| Total signals | 44 |
| Works ordinary scan | 25 |
| Held (all states) | 19 |
| Publishable works | **25** |
| Publishable held | **1** |

**Publishable hold (exact reason):**

- `SIG-SR-AU-008` — No reviewed Workstream C product-scope criteria for target `TGT-130` (Brie Mon Sire 1kg — Foodland Brighton SA). Ordinary scan cannot establish product scope — fail closed. (Retailer-site specific; brand/parent also unresolved from fixture label.)

Vogel’s (`SIG-SR-NZ-003-20260918`) now **works** via MPI product+pack WSC criteria under governed Vogel’s identity.

## Deterministic regeneration

```
DSA_EMBED_GENERATED_AT=2026-09-22T00:00:00.000Z npm run generate:dsa-asset-runtime-embed
→ rows: signals=44 targets=62 brands=796 criteria=84
```

Re-run produces the same embed content under the fixed timestamp.

## Preserved (unchanged by this correction)

NA-022, Anchor alias correction, benchmarks, Signal commentary, scoring, Wave 3.

## Tip SHA

`0ced973472e7cf5452f7e8adbebb1e64371391e1`
