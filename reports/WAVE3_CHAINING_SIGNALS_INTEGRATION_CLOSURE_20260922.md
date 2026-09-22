# Wave 3 + Chaining / Benchmarks / Signals — integration closure (22 September 2026)

**Integration branch:** `integration/wave3-chaining-signals-uat-20260922`  
**Worktree:** `C:\TrueScan-FoodScanner-wt-si-benchmark-refresh`  
**UAT build:** not cut (explicitly out of scope).

## Assured component baselines (both required in ancestry)

| Component | Assured tip SHA | Role |
|---|---|---|
| Wave 3 corrective | `d6cae8eb76177a6bc02bb399d5b1d4b16f20b2d7` | Independently assured Wave 3 UAT corrective |
| Chaining / Benchmarks / Dynamic Signals | `12e1f22dcd8b180aa594b7ccc06a7bead36c1a53` | Founder-accepted PASS WITH NON-BLOCKING FINDINGS (22 Sep 2026) |

**Remote availability (pre-integration):** after `git fetch origin --prune`, both objects resolved as `commit` on `origin` (`fix/wave3-uat-corrective-20260918` and `refresh/si-v016-ktc-bbfaw-20260918`).

## Merge topology

| Item | SHA |
|---|---|
| Merge-base | `cfe133ce4728a3e2bc5f7787413a76ae0c99f812` |
| Integration merge commit | `44f5d03d75d4c460994e76af3a49f2683a7e23f9` |
| Merge parents | `12e1f22dcd8b180aa594b7ccc06a7bead36c1a53` + `d6cae8eb76177a6bc02bb399d5b1d4b16f20b2d7` |

**Ancestry proof (both component tips are ancestors of integration merge):**

```
git merge-base --is-ancestor d6cae8eb76177a6bc02bb399d5b1d4b16f20b2d7 HEAD  → exit 0
git merge-base --is-ancestor 12e1f22dcd8b180aa594b7ccc06a7bead36c1a53 HEAD  → exit 0
```

History is preserved via `--no-ff` merge (no squash).

## Merge conflicts

Git reported **no textual conflict markers**. Strategy: `ort` auto-merge.

| File | Resolution |
|---|---|
| `app/result/[barcode].tsx` | **Auto-merged.** Retained Wave 3 Result presentation (score highlights, S25/Open/Nutrition/Claims routing from `d6cae8e`) **and** Signals/Chaining MVP path from `12e1f22` (no `FoodRecallMarkingsEntry`, no markings-driven re-eval, `foodRecallMarkings: null`, NA-022 clear-on-null Core Truth authority loss). |
| All other changed paths | Clean fast-forward merge from Wave 3 side only (no overlapping edits with Signals tip). |

No opportunistic refactoring, descriptor changes, or backlog work was performed during integration.

## Files changed by the merge itself (Wave 3 → integration)

From merge commit `44f5d03` (15 files, +1006 / −210):

- `app/result/[barcode].tsx`
- `reports/wave3_uat_corrective/*` (evidence + backlog note)
- `src/__tests__/unit/wave3/uatCorrective.presentation.test.ts`
- `src/__tests__/lib/scoreHighlights/l3ContentAddendum.test.ts`
- `src/__tests__/unit/s25/aboutTheseAdditives.test.ts`
- `src/components/AboutTheseAdditivesCard.tsx`, `AboutTheseAdditivesModal.tsx`
- `src/components/NutritionDetailsModal.tsx`, `NutritionTable.tsx`
- `src/components/ScoreHighlightsGovernedL3Modal.tsx`
- `src/lib/scoreHighlights/l3/content.ts`, `hostPresentation.ts`, `openGovernedCopy.ts`

Signals / Chaining / benchmark CSVs / criteria / embed from `12e1f22` remain unchanged by the merge.

## Integration assurance artefacts (post-merge)

| Artefact | Purpose |
|---|---|
| `src/__tests__/integration/wave3ChainingSignalsIntegratedPath.test.ts` | Combined path: TruScore + Signals attach, AU/NZ recall separation, Stage 2 overlay `[]`, Safety-before-News order, 26/26 corpus gate |
| `reports/MVP_RECALL_SIMPLIFICATION_ORDINARY_SCAN_CORPUS_20260922.json` | Re-run on integration tip (26/26 publishable works) |

## Controlling dispositions preserved

### Shared Identity / Chaining

- Parents/entities, brands/child brands, approved aliases, hierarchy only.
- No active `gtin_brand_links*.csv`; architecture tests still assert no product/GTIN artefacts in active packs.

### Dynamic Signals / recalls

- Active authority: `docs/uat/FOUNDER_MVP_RECALL_DECISIONS_20260922_SUPERSESSION.md`
- Trigger: resolved brand/parent + market + governed product-line descriptor.
- Qualifiers (size, batch, date, retailer) are card content only.
- `buildAssetGovernedFoodRecallPublicationRecords` returns `[]` with `mvp_recall: stage2_matcher_retired`.
- No `FoodRecallMarkingsEntry` on Result screen.

### Wave 3

- Full assured corrective presentation/score-highlight behaviour from `d6cae8e` retained (`uatCorrective.presentation.test.ts` passes on integration tip).

### Claude P1 descriptor precision

- **Not changed** during integration (founder non-blocking disposition).

## Active Chaining inventory (unchanged by merge)

**`workstreamA/a-data/wave1-v0.16/input/`** — canonical parents/brands, aliases, entities, stewardship, enum, wave1 control (no GTIN file).

**`workstreamA/a-data/chaining-extensions/v0.3/`** — brand/parent extensions, aliases extension, brand/entity hierarchy CSVs, README (no GTIN extension, no product_* CSVs).

## Ordinary-scan Signal corpus (integration tip)

Re-run: `npx tsx scripts/_local_ordinary_scan_corpus_reassess.ts`

| Metric | Result |
|---|---|
| Publishable total | 26 |
| Publishable works ordinary scan | **26** |
| Publishable held | **0** |
| Predecessor `candidate` held (non-publishable) | 18 (lifecycle only) |

Includes **SIG-SR-AU-008** (Mon Sire AU) without batch/date/pack-size gates.

## Integrated scan-path results (automated)

`wave3ChainingSignalsIntegratedPath.test.ts`:

- TruScore unchanged when Signal records attach.
- AU Mon Sire Brie → `SIG-SR-AU-008` with scope qualification copy; NZ → `SIG-SR-NZ-006`; no AU/NZ cross-publish.
- Stage 2 overlay empty; Result screen has no markings UI.
- Safety ordered before News in flattened cards.
- Corpus JSON asserts 26/26 publishable works.

## Test results

**Focused integration + component suites (55 tests):** all passed — integration path, Wave 3 UAT corrective, production-path Signals, simple product-scope descriptors, chaining architecture boundary, NA-022, result isolation, L3 addendum.

**Full `npx jest`:** **1354 passed, 15 failed**, 108 suites (7 snapshots passed).

**New integration failures:** **none.** The 15 failures match the known baseline on `12e1f22` / pre-integration (integration/productLookup, truscoreEndToEnd, scanningWorkflow, materializeFrozenBenchmarkAttribution, eligibilityBoundary, phaseCRefresh.source, signalsEvalScheduling.identityStale, csvDatabaseService, openFoodFacts.formatCertifications, etc.).

## Deterministic generation

```
DSA_EMBED_GENERATED_AT=2026-09-22T12:00:00.000Z npm run generate:dsa-asset-runtime-embed
→ signals=44 targets=62 brands=796 criteria=56
```

Two consecutive runs produced identical embed SHA256: `588f452c089ecb8e8de04a037bb03ab1e89989eae80d6e7d16bddee22be048f19`. Merge did not require embed content changes; regen verified parity.

## Benchmark / scoring / Wave 3 branch

No benchmark CSV edits, scoring methodology changes, or Wave 3 branch merge performed. No EAS/build profile changes.

## Final integration tip SHA

**`1f57d33c4d4c6cbca46404b09dec73e5dee0f80e`**

Integration merge: `44f5d03d75d4c460994e76af3a49f2683a7e23f9` · assurance commit: `af62a2f06dfb5eded0036e812667f08b51177e34`
