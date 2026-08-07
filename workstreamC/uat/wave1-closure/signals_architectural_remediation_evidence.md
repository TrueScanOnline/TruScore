# Signals architectural remediation evidence (Wave 1 closure — 2026-08-07 clarification)

**Instructions:**  
- `20260806_Signals_UAT_Skeleton_Build_30_Feedback_and_Cursor_Instruction`  
- `20260807_Signals_UAT_Skeleton_Build_30_Feedback_and_Cursor_Reply`  

**Build 30 baseline:** `1c12e339edcaa39572f107a49e906473ba117e38`  
**Prior remediation:** `f5927ed935fbd31a275d34e9de99b48a652890b8`  
**Clarification code commit:** `a92be423535c8137bc56b3455e0ed45a7e74c95f`  
**Package tip (this evidence):** `0e8e5fc4aa333f1fd5b8e88760d0a9202aa2cb6d`

## Terminology

Forward references use:

- **Rveel Dynamic Signals Asset**
- **founder-approved Rveel Dynamic Signals Asset**
- **integrated Dynamic Signals build**

Do **not** use Launch Corpus / Signals Corpus / full-corpus Signals build for forward work. Asset authorship remains in the separate founder-controlled thread.

## Implementation summary (clarification)

1. **MVP identity chain** — Product text may **refine** a same-entity brand (Nestlé → KitKat **B0060**) while retaining governed **parent** Nestlé S.A. (**P0008**). Brand and parent coexist; they do not compete as a single winning node. Signal eligibility is evaluated only at each Signal’s approved subject scope.
2. **Product text rules** — Reviewed `product_name` alias/canonical refine only. **`generic_name` cannot establish/override brand.** Multiword Kit Kat / KitKat via reviewed alias compact forms. Cross-parent ambiguity **fails closed**. Evidence logged on `chain_resolve:`.
3. **Dedupe** — Same `signal_id` reachable via brand + parent links publishes **once** (`dedupe_key` = signal + barcode).
4. **Production transitional removed** — `phase6SignalSourceMode` deleted. Builder emits **governed publication records only**. No production caller/flag/env restores Limited Product Data / Web Search Source / preference cards. Stale option props are ignored.
5. **Safety** — Remains exact-product / Stage 2 MILO path; no brand/parent recall over-fire. No synthetic on-device recall for Wave 1.
6. **Multiple brand pathways** — Current resolver returns **one** `brand_id` + `parent_id`. Explicit multi-path co-branding is **not** implemented; recorded for later **Chaining Asset recalibration** (do not expand ontology here).
7. **product_family** — Read-only assessment retained; no implementation under this instruction.
8. **No** Build 31, skeleton UAT cycle, A/B mutation, TruScore change, or Dynamic Signals Asset authorship.

## Confirmations vs founders’ KitKat root cause

| Required outcome | Status |
|------------------|--------|
| Recognise KitKat from product record (reviewed alias on title) | Yes — B0060 |
| Retain KitKat → Nestlé chain (brand + parent both available) | Yes — `brand_id=B0060`, `parent_id=P0008` |
| Evaluate Signal eligibility at approved scope only | Yes — `linkMatchesChain` |
| Not “KitKat wins vs Nestlé” single identity | Yes — levels coexist; parent-scoped Signals can still match P0008 |
| No KitKat force-hit / synthetic GTIN / Nestlé-parent-wide pack mutation | Confirmed |

## Tests

```powershell
cd C:\TrueScan-FoodScanner
npx jest src/__tests__/unit/workstreamC --no-coverage
npx jest src/__tests__/golden/scanOutputContract.golden.test.ts src/__tests__/golden/phase6.releaseHardening.test.ts --no-coverage
```

Includes: KitKat / Kit Kat; generic_name non-override; fail-closed ambiguity; sibling Nestlé no KitKat Signal; parent-scoped qualify; brand+parent dedupe; Stage 2 recall; transitional escape-hatch negative.

## Evidence pack for Claude

1. `build30_runtime_and_release_baseline.md`
2. `build30_as_built_signals_alerts_inventory.md`
3. `build30_signal_producer_matrix.csv`
4. `build30_subject_scope_and_product_family_assessment.md`
5. `build30_repository_search_and_callsites.md` ← **new**
6. This file + git diff vs Build 30 baseline
7. Tests/commands above

## Claude review standard (non-negotiable)

Adversarial architecture / code-quality / assurance review. Classify: blocker | material non-blocking | architectural weakness | inadequate test | confirmed safeguard | acceptance condition.

**Do not create tag `wave1-signals-skeleton-closure-20260807` until accepted Claude blockers are resolved.**

## Pending for integrated Dynamic Signals build (presentation)

- Public labels Safety & Recalls / In the News  
- Remove legacy universal ALERT heading and universal red  
- Severity-appropriate treatment per governed record  
- Founder-approved headline / Reveal Domain schema  
- Umbrella heading still under consideration (“Beyond the label” candidate only)
