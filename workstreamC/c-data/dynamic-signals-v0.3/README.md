# Rveel Dynamic Signals Asset v0.3 — governed pack

**Workbook source:** `Rveel_Dynamic_Signals_Asset_20260819_v0_3_FINAL.xlsx` (founder-approved v0.3 data state; not runtime).  
**Repo-native source:** `workstreamC/c-data/dynamic-signals-v0.3/`  
**Historical v0.2:** `workstreamC/c-data/dynamic-signals-v0.2/` — unchanged.  
**Accepted Chaining:** `workstreamA/a-data/wave1-v0.15/` + `workstreamA/a-data/chaining-extensions/v0.2/` — unchanged.

## Row counts (canonical repo CSVs)

| Sheet → file | Count |
|--------------|-------|
| Source_Universe → `input/source_universe.csv` | 14 |
| Reveal_Domains → `input/reveal_domains.csv` | 14 |
| Signals → `input/signals.csv` | 18 |
| Signal_Targets → `input/signal_targets.csv` | 27 |
| Controlled_Values → `input/controlled_values.csv` | 55 |

All Signal `signal_publication_state` values remain **`candidate`**, matching the approved workbook. Public display still requires a later founder publication promotion; the matcher fail-closes candidates.

## Food Safety News access rule

`SRC-FOOD-SAFETY-NEWS` is an approved Food Safety source. An article from that source is eligible to support a public Signal only where it is publicly accessible without subscription, login or payment at review/publication.

This is a source-governance requirement only. No automated paywall detector, scraper or monitoring service is implemented. Adding this source does not itself create a Signal.

## Food Recall eligibility (Asset-governed only)

| File | Role |
|------|------|
| `input/food_recall_eligibility.csv` | signal_id → recall_notice_id (`reviewed` only) |
| `input/food_recall_notices.csv` | Structured notice criteria |
| `input/food_recall_affected_variants.csv` | Exact GTINs + listed batches |
| `input/food_recall_related_gtins.csv` | Optional related-family GTINs |

Production rows remain empty. The two new Food Safety Signals (`SIG-SR-NZ-003`, `SIG-SR-AU-004`) stay product/date-scoped and cannot become generic Asset publishes. No GTINs were invented.

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

Unresolved targets keep empty `canonical_target_id` and `resolution_status=needs_review` (fail closed).
