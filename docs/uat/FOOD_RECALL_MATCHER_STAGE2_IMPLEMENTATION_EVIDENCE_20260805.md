# Food recall matcher â€” Stage 2 implementation evidence

**Date:** 2026-08-05  
**Status:** Corrective pass after `de44cfe` (Claude-review candidate)  
**Authority:** `Cursor_Followup_Stage2_Recall_Matcher_20260805.txt`  
**Not authorised:** EAS builds 29/30, store submission, tester assignment

## Commits

| Role | SHA |
|------|-----|
| Original Stage 2 implementation | `de44cfeee4bed0de2eae8124ebc5da74c58744d8` |
| Corrective commit (this pass) | `fa2d82f46a7a5d888bdcb4fe60585ae1264f12a2` |

Immutable links (corrective):

- Commit: `https://github.com/TrueScanOnline/TruScore/commit/fa2d82f46a7a5d888bdcb4fe60585ae1264f12a2`
- Tree: `https://github.com/TrueScanOnline/TruScore/tree/fa2d82f46a7a5d888bdcb4fe60585ae1264f12a2`

## Complete file list (corrective delta)

- `eas.json` â€” explicit `EXPO_PUBLIC_FOOD_RECALL_CORRECTED_PATH` on UAT profiles (BN unchanged)
- `app/result/[barcode].tsx` â€” barcode reset of markings/editing; Edit details / Check again
- `src/components/FoodRecallMarkingsEntry.tsx` â€” barcode-keyed field reset; visibility helpers
- `src/workstreamC/recall/miloRecallPack.ts` â€” per-variant batch lists + controlled UAT GTINs
- `src/workstreamC/recall/evaluateFoodRecallMatch.ts` â€” variant-specific conjunction
- `src/workstreamC/recall/mapFoodRecallMatchToPublicationRecord.ts` â€” provisional metadata / uat_only
- `src/workstreamC/recall/pathControl.ts` â€” fail-closed; always suppress all four legacy Safety IDs
- `src/workstreamC/recall/types.ts` â€” `gtin_verification_status` on match result
- `src/workstreamC/runtime/workstreamCRuntimePublicationRecords.ts` â€” fail-closed wiring
- `src/dynamicSignals/publish/types.ts` â€” food_recall verification + uat_only fields
- `src/signals/signalRenderMapping.ts` â€” `food_recall_match_state` on SignalCard
- `src/types/scanOutputContract.ts` â€” `food_recall_match_state`
- `src/__tests__/unit/workstreamC/foodRecallMatcher.stage2.test.ts`
- `workstreamC/c-data/v0.4.1/README.md`
- `docs/uat/FOOD_RECALL_MATCHER_STAGE2_IMPLEMENTATION_EVIDENCE_20260805.md` (this file)

Unchanged by this pass (preserved): Workstream C **v0.4** CSV pack; Workstreams **A** and **B**.

## Variant-to-batch mapping

| Pack | Listed batches | Controlled UAT GTIN | Verification |
|------|----------------|---------------------|--------------|
| Dipped 270g | 5316TD15, 5318TD15, 5321TD15, 5322TD15 | `9300605190270` | `controlled_test_synthetic` |
| Dipped 160g | 5316TD15, 5318TD15 | `9300605190160` | `controlled_test_synthetic` |
| Dipped 960g | 5317TD15 | `9300605190960` | `controlled_test_synthetic` |
| Original 210g | 5323TD15, 5324TD15 | `9300605190210` | `controlled_test_synthetic` |

Best-before: August 2026 / end August 2026 (month/year product marking).

Related advisory (not affected): `9300605199991` â€” `controlled_test_synthetic`.  
Powder control: `9300605003811` â€” out of family â†’ `not_applicable`.  
Real candidate (no pack mapping): `9300605100114` â€” `controlled_test_awaiting_external_verification` â†’ cannot confirm.

No GTIN is `verified_for_consumer`.

## Environment / profile settings

| Profile | BN | `EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT` | `EXPO_PUBLIC_FOOD_RECALL_CORRECTED_PATH` |
|---------|----|----------------------------------------|------------------------------------------|
| `uat-ios-flag-off` | 29 | `0` | `0` |
| `uat-ios-flag-on` | 30 | `1` | `1` |

Runtime: corrected path enabled only when `EXPO_PUBLIC_FOOD_RECALL_CORRECTED_PATH === '1'` (fail-closed default).  
All four legacy Safety IDs (`SIG_REG_AU_001`, `SIG_REG_AU_002`, `SIG_REG_NZ_001`, `SIG_REG_NZ_002`) are always suppressed from subject-link publication.

## Match states (unchanged set)

`confirmed_affected` | `batch_check_required` | `batch_not_listed` | `related_recall_variant_unconfirmed` | `not_applicable`

Stable card key: `p6|food_recall|RN_FSANZ_MILO_SNACK_BARS_2026_02|{gtin}` (no `match_state`).

## Publication metadata (controlled / synthetic)

- `state`: `confidence_state=low`, `review_state=provisional`, `resolution_status=resolved_with_warning`
- `food_recall.uat_only_override=true`
- Skeleton UAT visibility only (`WORKSTREAMC_SKELETON_UAT=1`); cannot enter production profiles lacking that flag
- Only future `verified_for_consumer` GTINs may use `confirmed` / `reviewed` / `resolved`

## Expected versus actual tests

Command: `npx jest src/__tests__/unit/workstreamC/foodRecallMatcher.stage2.test.ts` and `npm run test:workstreamC`

| Test | Expected | Actual |
|------|----------|--------|
| variant-specific dipped 270g batches | all listed â†’ `confirmed_affected` | PASS |
| wrong-pack batch rejection | other packâ€™s batch â†’ `batch_not_listed` | PASS |
| missing/partial/malformed | `batch_check_required` never `batch_not_listed` | PASS |
| complete non-match | `batch_not_listed` | PASS |
| related advisory | `related_recall_variant_unconfirmed` | PASS |
| same-GTIN relatedâ†’affected | same dedupe_key; state upgrades | PASS |
| powder / unverified candidate | `not_applicable` | PASS |
| no duplicate card | one key across states | PASS |
| corrected on | one food_recall AU_001; legacy suppressed | PASS |
| corrected off | **no** MILO Safety card; legacy still suppressed | PASS |
| Pakâ€™n Save / Pams / Alfamino | no broad Safety | PASS |
| Safety before News (both present) | class A before B | PASS |
| TruScore unchanged | trust + pillars identical | PASS |
| provisional metadata | uat_only + provisional state | PASS |
| form reset / edit helpers | barcode clear; edit after terminal | PASS |

## Proof â€” legacy broad cannot reappear when corrected path is off

- `suppressedLegacySafetySignalIds()` always includes `SIG_REG_AU_001` â€¦ `SIG_REG_NZ_002`
- With `EXPO_PUBLIC_FOOD_RECALL_CORRECTED_PATH=0`, matcher returns `not_applicable` / no publication record
- Test asserts zero `SIG_REG_AU_001` records and log still contains `legacy_safety_suppressed: SIG_REG_AU_001`

## Proof â€” UI reset / re-entry

- Result screen: `useEffect` on `barcode` clears `foodRecallMarkings` and `foodRecallEditing`
- `FoodRecallMarkingsEntry` receives `key={barcode}` and `barcode` prop; internal fields reset on barcode change
- After `confirmed_affected` or `batch_not_listed`, â€œEdit details / Check againâ€ sets `foodRecallEditing` so the form reopens without rescanning

## Known data gaps

- No externally verified consumer GTINs / pack-size mapping for real retail barcodes
- `9300605100114` remains unmapped
- Alfamino / Pams / Pakâ€™n Save still lack exact-product rules (correctly unavailable / held)
- Provisional consumer copy awaits founder/legal approval before launch

## Confirmations

- Workstream C **v0.4** unchanged; Workstreams **A** and **B** unchanged
- **No** EAS build, store submission, or tester assignment occurred in this pass
- Builds 29/30 remain unauthorised pending review
