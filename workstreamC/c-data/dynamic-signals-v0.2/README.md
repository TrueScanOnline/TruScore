# Rveel Dynamic Signals Asset v0.2 — governed pack

**Workbook source:** `Rveel_Dynamic_Signals_Asset_20260807_v0_2.xlsx` (founder-review input; not runtime).  
**Authorisation:** Cursor Implementation Authorisation for Asset v0.2.  
**Baseline:** Wave 1 Signals Skeleton UAT & Remediation CLOSED/ACCEPTED (`wave1-signals-skeleton-uat-remediation-closure-20260807`).

## Row counts (canonical repo CSVs)

| Sheet → file | Count |
|--------------|-------|
| Source_Universe → `input/source_universe.csv` | 13 |
| Reveal_Domains → `input/reveal_domains.csv` | 14 |
| Signals → `input/signals.csv` | 16 |
| Signal_Targets → `input/signal_targets.csv` | 25 |
| Controlled_Values → `input/controlled_values.csv` | 54 |

All Signal `signal_publication_state` values remain **`candidate`** except the four founder-authorised UAT Signals promoted to **`publishable`**: `SIG-SR-AU-003`, `SIG-IN-GL-001`, `SIG-IN-GL-002`, `SIG-IN-NZ-005`. See `UAT_MATRIX_PRODUCTION_ASSET_20260808.md`.

## Food Recall eligibility (Asset-governed only)

| File | Role |
|------|------|
| `input/food_recall_eligibility.csv` | signal_id → recall_notice_id (`reviewed` only) |
| `input/food_recall_notices.csv` | Structured notice criteria (date month/year, hazard text for matcher) |
| `input/food_recall_affected_variants.csv` | Exact GTINs + listed batches |
| `input/food_recall_related_gtins.csv` | Optional related-family GTINs |

Production rows are empty until a Safety Signal is onboarded with verified structured data. Historical MILO Stage 2 pack is **not** production Asset content.

**Authority:** Dynamic Signals Asset is the sole production Signal-content authority. `EXPO_PUBLIC_FOOD_RECALL_CORRECTED_PATH` is a matcher kill-switch only.

## Schema mapping

| Workbook | Repo |
|----------|------|
| Source_Universe | `input/source_universe.csv` |
| Reveal_Domains | `input/reveal_domains.csv` |
| Signals | `input/signals.csv` |
| Signal_Targets | `input/signal_targets.csv` (+ `resolution_note`; human `target_label` / `scope_review_summary` retained as review aids only — **not** used in matching) |
| Controlled_Values | `input/controlled_values.csv` |

Product families live in Chaining: `workstreamA/a-data/chaining-extensions/v0.1/`.

## Runtime matching key

`market_key + target_type + canonical_target_id + propagation_mode`

Unresolved targets keep empty `canonical_target_id` and `resolution_status=needs_review` (fail closed).
