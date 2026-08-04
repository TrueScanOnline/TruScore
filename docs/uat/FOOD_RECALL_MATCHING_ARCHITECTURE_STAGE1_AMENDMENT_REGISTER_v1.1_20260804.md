# Stage 1 Design — Amendment Register (v1.0 → v1.1)

**Date:** 4 August 2026  
**From:** `FOOD_RECALL_MATCHING_ARCHITECTURE_STAGE1_DESIGN_20260804.md` (v1.0)  
**To:** `FOOD_RECALL_MATCHING_ARCHITECTURE_STAGE1_DESIGN_v1.1_20260804.md` (v1.1 candidate)  
**Nature:** Design-only revisions. No Stage 2 code, commit, build, submit, or tester action.

| # | Founder point | How resolved in v1.1 |
|---|---------------|----------------------|
| **1** | Stable card identity; state transitions without duplicates | `dedupe_key = p6\|food_recall\|{recall_notice_id}\|{scanned_gtin}` — **excludes** `match_state`. Re-evaluation updates the same card from `batch_check_required` → `confirmed_affected` / `batch_not_listed`. Documented transition diagram (§4). |
| **2** | Explicit batch/date rule semantics | Introduced **`recall_rule_group`** with `requirement_mode` (`batch_only` / `date_only` / `batch_and_date`). All required conditions must match **within one group**; no cross-group mix. Defined outcomes for missing / partial / malformed / complete nonmatch / complete match; partial & malformed **must not** yield `batch_not_listed` (§5). |
| **3** | Governed product-family membership | Public membership **only** via explicit reviewed **GTIN** (or later founder-approved governed product identifier) in `recall_family_membership`. Brand/parent/pack-size/name/category **forbidden**. Missing/unverified → `not_applicable`, **no** related-family advisory (§7). |
| **4** | Atomic per-notice migration | Replaced broad SL001–SL004 disable with per-notice `activation_status` (`legacy_active` → `ready_pending_cutover` → `active_new_path` / `held_non_gtin` / `retired`). Dual-publish forbidden; premature disable forbidden; rollback returns **one** path (§8). |
| **5** | State-driven severity | Generic `severity_tier` / urgency / tone table keyed by **`match_state` only** — not all states equal; **no** Signal-ID branching (§9). |
| **6** | Date granularity | Added `official_date_text`, `date_precision` (incl. `end_of_month`), normalized inclusive bounds, `comparison_rule`; worked example for **BEST BEFORE END AUG 2026** (§10). |
| **7** | Non-GTIN recall scope | Stage 2 **limited to verified scannable GTINs**. Pak’n Save Moorhouse-class → `held_non_gtin` fail-closed; retailer-SKU/store/location model = **separate founder decision** (§11). |
| **8** | Relational integrity / validation | Notice is **sole owner** of `signal_id`; children join by `recall_notice_id` only. Validation gates for orphans, duplicates, unknown Signals, bad review status, incomplete rules, malformed dates, unsafe activation (§12). |
| **9** | Test additions | Added A1–A10: card replacement; same-rule conjunction; partial; malformed; missing family membership; end-of-month precision; atomic cutover; rollback; multi-notice; non-GTIN hold (§16). |

### Unchanged from v1.0 (still in force)

- Five match states and consumer meaning intent  
- Public path only via `ProductScanResult.signals`  
- No brand/parent/fuzzy public recall publish  
- v0.4 immutable; A/B untouched  
- Injected clock for tests; no 3-month expiry policy in Stage 2  
- `family_match_tokens` remains rejected  

### Confirmations

| Item | |
|------|--|
| Stage 2 implementation | **None** |
| Git commit | **None** |
| EAS build / store submit / testers | **None** |
| Controlling candidate | **v1.1** |

*End of amendment register.*
