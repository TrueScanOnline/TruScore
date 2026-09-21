# MVP recall simplification — closure report (22 September 2026)

**Branch:** `refresh/si-v016-ktc-bbfaw-20260918`
**Worktree:** `C:\TrueScan-FoodScanner-wt-si-benchmark-refresh`
**Starting tip:** `0531f30`
**Substantive SHA:** `eb8066a`
**Build:** not cut (explicitly out of scope for this change).

Governing authority: [`docs/uat/FOUNDER_MVP_RECALL_DECISIONS_20260922_SUPERSESSION.md`](../docs/uat/FOUNDER_MVP_RECALL_DECISIONS_20260922_SUPERSESSION.md).

---

## 1. Doctrine implemented

| Rule | Implementation |
|---|---|
| Chaining = brand / parent / aliases / hierarchy only | Unchanged. `resolveReviewedRetailChainUnified` still returns brand/parent only. |
| Product scope = resolved brand/parent + market + ONE of several reviewed `product_name` descriptors (OR) | `signalTargetProductScopeMatches` returns true when any single reviewed descriptor matches. |
| No `scope_group_id`, no `pack_quantity` AND, no batch/date/GTIN display gate | Column and rows removed from the criteria CSV; the evaluator skips any non-`product_name` `match_field`. |
| Safety recall displays on product / product-line match | Safety product and product_family targets now publish through ordinary Asset matching. |
| Affected size / batch / date / retailer are qualification content | Carried by the Signal's `signal_headline` / `signal_summary` / `scope_qualification` editorial fields. |
| Stage 2 retired from the active consumer path | Recall overlay returns `[]`; markings entry removed from the Result screen; `needs_batch_entry` never set. |
| One ordinary Dynamic Signals Safety path | Asset → `ProductScanResult.signals`. |
| No Signal-/brand-specific application logic | Matching is fully data-driven; the existing no-hardcoding boundary test still passes. |

## 2. Code changes

| File | Change |
|---|---|
| `src/dynamicSignals/productScope/signalProductScopeEvaluator.ts` | Rewritten. OR across reviewed descriptors; `scope_group_id`, `pack_quantity`, `gtin`/`barcode` match fields and all quantity context fields dropped. Still fails closed when both `brand_id` and `parent_id` are null, and when a reviewed row carries no brand/parent anchor. |
| `workstreamC/c-data/dynamic-signals-v0.3/input/signal_target_product_criteria.csv` | Rewritten: 56 reviewed `product_name` rows, no `scope_group_id` column, no pack-quantity rows. Vogel's keeps its six MPI product-line phrases without pack-size conjunction; Pams keeps "beef lasagne" (and "sparkling water") without 1.3kg. A malformed empty row present in the previous file is gone. |
| `src/dynamicSignals/asset/v0.2/matchDynamicSignalsAsset.ts` | `requiresFoodRecallMatcherEligibility` is retired (always `false`, marked `@deprecated`); its skip branch is removed from the publish loop; quantity fields removed from `AssetScanIdentity`. |
| `src/dynamicSignals/asset/v0.2/buildAssetGovernedFoodRecallPublicationRecords.ts` | Rewritten to the MVP path: always returns `[]` and logs `mvp_recall: stage2_matcher_retired`. No call to `evaluateStructuredFoodRecallMatch`, no `provisionalCopyForMatchState`, no `batch_check_required` upgrade. `scanIdentitySatisfiesSafetyTargets` retained. |
| `src/dynamicSignals/asset/v0.2/buildDynamicSignalsAssetRuntimePublicationRecords.ts` | Stops passing `foodRecallMarkings` into the overlay; quantity fields removed from the scan identity; comments updated. The `foodRecallMarkings` input is accepted and ignored for call-site compatibility. |
| `src/dynamicSignals/asset/v0.2/evaluateDynamicSignalsAssetProgressive.ts` | Stops forwarding markings; the param remains accepted and unread. |
| `app/result/[barcode].tsx` | `FoodRecallMarkingsEntry`, `foodRecallMarkings` / `foodRecallEditing` state, the batch-entry visibility computation and the "Edit details / Check again" flow are removed. NA-022 clear-on-null behaviour is unchanged. |
| `src/components/FoodRecallMarkingsEntry.tsx` | Retained unrendered, with a `@deprecated` banner pointing at the supersession note. |
| `src/workstreamC/recall/evaluateStructuredFoodRecallMatch.ts` and Stage 2 pack files | Untouched, retained for provenance, unwired from runtime publication. |
| `scripts/_local_ordinary_scan_corpus_reassess.ts` | Updated for simplified criteria (single reviewed descriptor fixture, no scope groups, no quantity fields). |
| `src/dynamicSignals/asset/v0.2/dynamicSignalsAssetRuntimeEmbed.generated.ts` | Regenerated with `DSA_EMBED_GENERATED_AT=2026-09-22T12:00:00.000Z`: signals=44, targets=62, brands=796, criteria=56. |

## 3. Consumer wording

Publication uses the Signal's own editorial fields, not Stage 2 provisional copy:

- `signal_headline` → `skeleton_card_copy.title_display`
- `signal_summary` → `skeleton_card_copy.body_display`
- `scope_qualification` → `skeleton_card_copy.why_display`

Worked example — **SIG-SR-AU-008 (Mon Sire, AU)**:

> **Recall: Brie Mon Sire 1kg**
> FSANZ recalled Brie Mon Sire 1kg because of possible Listeria monocytogenes contamination.
> Only the 1kg product sold at Foodland Brighton in South Australia with best before 13 October 2026 is affected. Check the date on your pack.

The card asks the consumer to check their pack against the published scope. It does not claim the pack in hand is definitely affected, and it does not claim the product is safe.

## 4. Mon Sire AU (SIG-SR-AU-008 / TGT-130)

Added reviewed descriptor `SPC-0040`: market `AU`, brand `B0798`, parent `P0177`, `product_name phrase_contains "brie"` — the same doctrine as the NZ Mon Sire Brie line (`SPC-0041`, TGT-133). No 1kg, Foodland or best-before requirement. AU and NZ remain market-separated: an AU scan publishes only `SIG-SR-AU-008`, an NZ scan only `SIG-SR-NZ-006`, and a Mon Sire sibling line (e.g. mascarpone) publishes neither.

## 5. Ordinary-scan corpus

Machine-readable output: [`reports/MVP_RECALL_SIMPLIFICATION_ORDINARY_SCAN_CORPUS_20260922.json`](./MVP_RECALL_SIMPLIFICATION_ORDINARY_SCAN_CORPUS_20260922.json)
Clock `2026-09-18T12:00:00.000Z`; 44 Signals assessed.

| Metric | Count |
|---|---|
| Publishable Signals | 26 |
| Publishable and working on ordinary scan | **26** |
| Publishable and held | **0** |
| Total working | 26 |
| Total held | 18 |

**Publishable works (26):** SIG-SR-AU-001-20260918, SIG-SR-AU-002-20260918, SIG-SR-NZ-002-20260918, SIG-SR-AU-003-20260918, SIG-IN-AU-001-20260918, SIG-IN-AU-002-20260918, SIG-IN-AU-003-20260918, SIG-IN-AU-004-20260918, SIG-IN-AU-005-20260918, SIG-IN-GL-001-20260918, SIG-IN-NZ-001-20260918, SIG-IN-NZ-002-20260918, SIG-IN-NZ-003-20260918, SIG-IN-GL-002-20260918, SIG-IN-NZ-004-20260918, SIG-IN-NZ-005-20260918, SIG-SR-NZ-003-20260918, SIG-SR-AU-004-20260918, SIG-SR-AU-005, SIG-SR-AU-006, SIG-SR-AU-007, **SIG-SR-AU-008**, SIG-SR-NZ-004, SIG-SR-NZ-005, SIG-SR-NZ-006, SIG-IN-GL-003.

**SIG-SR-AU-008 now works** on an ordinary AU scan of "Mon Sire Brie" once the Mon Sire brand resolves — the objective of this change.

**Held (18), all with the same reason:** every held Signal is a Phase C **predecessor** in `signal_publication_state=candidate`, superseded by its `-20260918` successor. Each one resolves identity correctly (brand and parent both present in `identity_resolve`) and is blocked only by lifecycle state, which is intended. The held set is: SIG-SR-AU-001, SIG-SR-AU-002, SIG-SR-NZ-002, SIG-SR-AU-003, SIG-IN-AU-001, SIG-IN-AU-002, SIG-IN-AU-003, SIG-IN-AU-004, SIG-IN-AU-005, SIG-IN-GL-001, SIG-IN-NZ-001, SIG-IN-NZ-002, SIG-IN-NZ-003, SIG-IN-GL-002, SIG-IN-NZ-004, SIG-IN-NZ-005, SIG-SR-NZ-003, SIG-SR-AU-004.

No publishable Signal is held for want of pack size, batch code, best-before date or GTIN.

## 6. Tests

`npx jest` (full suite): **1336 passed, 15 failed, 1351 total** across 106 suites.

All 15 failures are **pre-existing on the starting tip `0531f30`** and unrelated to this change. Verified by stashing the working tree and re-running the same suite: the baseline produced the identical set of failing suites (16 failures, the extra one being the new, not-yet-supported `productScope.simpleDescriptors` test running against the old evaluator).

Pre-existing failing suites: `e2e/truscoreEndToEnd`, `integration/productLookup`, `integration/scanningWorkflow`, `unit/benchmark/materializeFrozenBenchmarkAttribution`, `unit/contributions/eligibilityBoundary`, `unit/dynamicSignals/phaseCRefresh.source`, `unit/dynamicSignals/signalsEvalScheduling.identityStale`, `unit/services/csvDatabaseService`, `unit/services/openFoodFacts.formatCertifications`.

### Test changes

| Suite | Change |
|---|---|
| `productScope.andOrGroups.test.ts` | Deleted. |
| `productScope.simpleDescriptors.test.ts` | New. OR alternatives; product line matches at any pack size; sibling, wrong brand and wrong market negatives; null Chaining identity fails closed; non-`product_name` rows ignored; unanchored reviewed rows fail closed. |
| `productionPath.identitySignals.test.ts` | Chickadees fires with no batch markings and no `needs_batch_entry`, and still fires with no pack size in the name. Vogel's fires with and without the 750g pack size. Mon Sire AU now asserts `SIG-SR-AU-008` publishes with Foodland qualification copy and does not cross-publish to NZ. New assertion that the Result screen contains no `FoodRecallMarkingsEntry` and no `food_recall_needs_batch_entry`. |
| `assetV02Matcher.test.ts` | Stage 2 match-state progression tests replaced with the MVP path: product-line match → one Safety card with Signal editorial copy; no markings needed; `needs_batch_entry` falsy and `match_state` undefined; absence of batch/date/pack size does not suppress; sibling and wrong-market negatives; overlay returns `[]` and logs `mvp_recall: stage2_matcher_retired`; Asset-disabled and MILO negatives retained. |
| `assetV03Pack.test.ts` | `requiresFoodRecallMatcherEligibility` now asserted `false` for the Vogel's and Mr Chen's Safety targets. |
| `phaseE.refresh20260918.test.ts` | Mon Sire market separation test updated to assert each market publishes its own recall and neither crosses; the unresolved-target test now asserts null identity fails closed while reviewed identity publishes. |
| `chainingArchitectureBoundary.test.ts` | New assertion that the criteria header has no `scope_group_id` and every row is `match_field=product_name`. Existing brand/parent-anchor and null-identity tests kept. |
| NA-022 tests (`na022.staleSignalsClear.test.ts`) | Unchanged and passing. |
| `foodRecallMatcher.stage2.test.ts` | Unchanged and passing — the historical matcher still behaves as documented; it is simply no longer wired to publication. |

## 7. Preserved

NA-022, Anchor alias handling, KTC, BBFAW, commentary, scoring, Wave 3 and Claims / Body / Planet / Open / TruScore are untouched. `npx tsc --noEmit` reports only the two pre-existing errors in `src/identity/workstreamA/loader.ts` and `src/nutrition/governedNutrientAssessment.ts`. ESLint on every changed source file: 0 errors.

## 8. Platforms / dual UAT

No change to `.env.development`, `app.config.js` defaults or EAS profiles. `EXPO_PUBLIC_DYNAMIC_SIGNALS_ASSET=1` and `EXPO_PUBLIC_FOOD_RECALL_CORRECTED_PATH=1` remain committed for NZ Expo Go, and the store/UAT profiles still bake the Asset flag for AU TestFlight. All changes are JS/TS and run in Expo Go — no custom dev client or native module is introduced. The removal of the markings entry screen removes UI only; nothing platform-specific was added.

`EXPO_PUBLIC_FOOD_RECALL_CORRECTED_PATH` is now read solely to keep the kill-switch value visible in scan logs. It can neither activate nor suppress recall content on the MVP path.

## 9. Commit and tip

| | SHA |
|---|---|
| Starting tip | `0531f30` |
| Substantive commit (all code, data, tests, docs) | `eb8066a` |
| Branch tip | `eb8066a` plus this SHA stamp commit |

The stamp commit contains only this section of this report, so `eb8066a` is the SHA to review for the change itself.
