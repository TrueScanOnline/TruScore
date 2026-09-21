# Rveel Dynamic Signals Asset v0.3 — governed pack

**Workbook source:** `Rveel_Dynamic_Signals_Asset_20260819_v0_3_FINAL.xlsx` (founder-approved v0.3 predecessor baseline; not runtime).  
**Repo-native source:** `workstreamC/c-data/dynamic-signals-v0.3/`  
**Historical v0.2:** `workstreamC/c-data/dynamic-signals-v0.2/` — unchanged.  

**Shared Identity dependency (ownership only):** `workstreamA/a-data/wave1-v0.16/` + `workstreamA/a-data/chaining-extensions/v0.3/` — canonical parents, brands, brand aliases, brand/entity hierarchy. **Not** products, product families, or GTIN→brand links.

**Product-scope evaluation (this Workstream):** after ownership resolves, Dynamic Signals compares ordinary scan product fields against `input/signal_target_product_criteria.csv` (linked to `signal_targets`). Food recall batch/date facts remain in `food_recall_*` tables.

## Phase C refresh (2026-09-18)

| Layer | State |
|-------|--------|
| Predecessors (18) | Column-aligned to 30-field workbook semantics; `expires_at` empty; remain `candidate` (superseded, not reactivated) |
| Successors (18) | `signal_id` = predecessor + `-20260918`; same `dedupe_key`; `supersedes_signal_id` set; `expires_at=2026-12-31`; evidence policy `RVEEL-SIGNALS-MVP-2026-09-v0.4` |
| New records (8) | `SIG-SR-AU-005`…`008`, `SIG-SR-NZ-004`…`006`, `SIG-IN-GL-003` with locked package copy |
| Publishable heads | Successors/new records with ≥1 `resolved` target (see `TARGET_RESOLUTION.md`) |

## Row counts (canonical repo CSVs)

| Sheet → file | Count |
|--------------|-------|
| Source_Universe → `input/source_universe.csv` | 14 |
| Reveal_Domains → `input/reveal_domains.csv` | 14 |
| Signals → `input/signals.csv` | 44 (18 pred + 18 succ + 8 new) |
| Signal_Targets → `input/signal_targets.csv` | 62 |
| Signal target product criteria → `input/signal_target_product_criteria.csv` | Workstream C product-scope terms |
| Controlled_Values → `input/controlled_values.csv` | 55 |
| Food recall notices / variants / eligibility / related_gtins | see `input/food_recall_*.csv` |

There is **no** governed v0.3.2 asset; documentation must not reference v0.3.2.

## Architecture boundary

| Layer | Answers |
|-------|---------|
| Shared Identity / Chaining | Whose brand/owner is this? |
| Dynamic Signals (this pack) | Does this approved Signal apply to the scanned product? |

Product-name phrases, pack size, market, optional verified GTIN discriminators, and recall batch/date qualifications are **Signal scope**, not Chaining identities.

## Food Safety News access rule

`SRC-FOOD-SAFETY-NEWS` is an approved Food Safety source. An article from that source is eligible to support a public Signal only where it is publicly accessible without subscription, login or payment at review/publication.

## Food Recall eligibility (Asset-governed only)

| File | Role |
|------|------|
| `input/food_recall_eligibility.csv` | signal_id → recall_notice_id (`reviewed` only) — empty until verified product binding |
| `input/food_recall_notices.csv` | Structured notice criteria (hazard/action/dates/family ref) |
| `input/food_recall_affected_variants.csv` | Exact GTINs + listed batches — empty pending verification |
| `input/food_recall_related_gtins.csv` | Optional related-family GTINs — prefer empty over speculation |

Candidate GTINs `4975186250043` (Red Hat) and `8801047559610` (Dongwon) remain unverified research leads and must not be promoted.

## Schema mapping

| Workbook | Repo |
|----------|------|
| Source_Universe | `input/source_universe.csv` |
| Reveal_Domains | `input/reveal_domains.csv` |
| Signals | `input/signals.csv` |
| Signal_Targets | `input/signal_targets.csv` (includes `product_scope_guard`) |
| Controlled_Values | `input/controlled_values.csv` |

Consumer category labels (controlled values): `safety_regulatory` → **Food Safety**; `in_the_news` → **In the News**. Internal enum names are unchanged.

## Runtime matching key

`market_key + target_type + canonical_target_id + propagation_mode`  
then, when present, `product_scope_guard`.

Unresolved targets keep empty `canonical_target_id` and `resolution_status=needs_review` (fail closed). Cocoa guards remain on SIG-IN-GL-001/GL-002 successor targets; SIG-IN-GL-003 Mondelez EUDR uses `P0009` entity_descendants with **no** cocoa guard. AU/NZ Mon Sire targets stay separate.
