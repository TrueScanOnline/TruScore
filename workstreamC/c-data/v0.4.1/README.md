# Workstream C recall assets — v0.4.1 (Stage 2 MVP)

**Does not modify** `workstreamC/c-data/v0.4/`.

Runtime source of truth for Stage 2 MVP lives in:

- `src/workstreamC/recall/miloRecallPack.ts`
- `src/workstreamC/recall/evaluateFoodRecallMatch.ts`

## Notices

| Notice | Signal | Activation |
|--------|--------|------------|
| MILO snack bars FSANZ | `SIG_REG_AU_001` | `corrected_matcher_active` when `EXPO_PUBLIC_FOOD_RECALL_CORRECTED_PATH=1`; unavailable (fail-closed) when `=0` |
| Alfamino | `SIG_REG_AU_002` | unavailable for scan alerts |
| Pams sprouts | `SIG_REG_NZ_001` | unavailable for scan alerts |
| Pak’n Save Moorhouse | `SIG_REG_NZ_002` | `held_non_gtin` |

## Variant → batch mapping (manufacturer)

| Pack | Listed batches | Controlled UAT GTIN |
|------|----------------|---------------------|
| Dipped 270g | 5316TD15, 5318TD15, 5321TD15, 5322TD15 | `9300605190270` |
| Dipped 160g | 5316TD15, 5318TD15 | `9300605190160` |
| Dipped 960g | 5317TD15 | `9300605190960` |
| Original 210g | 5323TD15, 5324TD15 | `9300605190210` |

All require August 2026 / end-August 2026 best-before marking.

## GTIN verification status

See `miloRecallPack.ts`. Controlled/synthetic GTINs publish under Skeleton UAT only with provisional metadata + `uat_only_override`. Real candidate `9300605100114` has no pack mapping and cannot confirm. Do not treat any of these as `verified_for_consumer` until founders confirm.
