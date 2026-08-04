# Workstream C recall assets — v0.4.1 (Stage 2 MVP)

**Does not modify** `workstreamC/c-data/v0.4/`.

Runtime source of truth for Stage 2 MVP lives in:

- `src/workstreamC/recall/miloRecallPack.ts`
- `src/workstreamC/recall/evaluateFoodRecallMatch.ts`

## Notices

| Notice | Signal | Activation |
|--------|--------|------------|
| MILO snack bars FSANZ | `SIG_REG_AU_001` | `corrected_matcher_active` |
| Alfamino | `SIG_REG_AU_002` | unavailable for scan alerts |
| Pams sprouts | `SIG_REG_NZ_001` | unavailable for scan alerts |
| Pak’n Save Moorhouse | `SIG_REG_NZ_002` | `held_non_gtin` |

## GTIN verification status

See `miloRecallPack.ts` comments. Controlled test GTINs must not be treated as `verified_for_consumer` until founders confirm pack mapping.
