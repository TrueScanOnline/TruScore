# Dynamic Signals Asset v0.2 — remediation response (assurance disposition)

**Date:** 2026-08-07  
**Base (held):** implementation `52f3283…` / tip `250c53e…`  
**Remediation commit:** 7fbfaceda14f17cb887583267282fa527fb358f9  

**Not done (per instruction):** tag, `EXPO_PUBLIC_DYNAMIC_SIGNALS_ASSET` enablement, Signal promotion, device/TestFlight UAT, synthetic identity enrichment.

## Changed paths

| Path | Change |
|------|--------|
| `src/dynamicSignals/asset/v0.2/matchDynamicSignalsAsset.ts` | Food-recall gate; resolution_status pass-through; brand/entity hierarchy propagation |
| `src/dynamicSignals/asset/v0.2/buildDynamicSignalsAssetRuntimePublicationRecords.ts` | Mutual-exclusion; Food Recall Matcher merge |
| `src/dynamicSignals/asset/v0.2/buildFoodRecallSafetyPublicationRecords.ts` | **New** — Safety via Food Recall Matcher |
| `src/dynamicSignals/asset/v0.2/signalsProducerGuard.ts` | **New** — Skeleton/Asset mutual exclusion |
| `src/dynamicSignals/asset/v0.2/loadDynamicSignalsAssetPack.ts` | Load hierarchy CSVs |
| `src/identity/chaining/brandEntityHierarchyMaps.ts` | **New** |
| `src/identity/chaining/productFamilyMaps.ts` | Family + membership both must be reviewed |
| `src/workstreamC/runtime/workstreamCRuntimePublicationRecords.ts` | Suppress when Asset active |
| `app/result/[barcode].tsx` | Single active producer |
| `workstreamA/a-data/chaining-extensions/v0.1/brand_child_of_brand.csv` | B0241→B0067 |
| `workstreamA/a-data/chaining-extensions/v0.1/entity_child_of_entity.csv` | Header (empty) |
| `workstreamA/a-data/chaining-extensions/v0.1/README.md` | Updated |
| `src/__tests__/unit/dynamicSignals/assetV02Matcher.test.ts` | Extended suite |
| `workstreamC/c-data/dynamic-signals-v0.2/ENRICHMENT_PROPOSAL_20260807.md` | Proposal only |
| `workstreamC/c-data/dynamic-signals-v0.2/TARGET_RESOLUTION.md` | Status note |
| `workstreamC/c-data/dynamic-signals-v0.2/REMEDIATION_RESPONSE_20260807.md` | This file |

## Remediation summary

1. **Safety recalls:** Asset matcher refuses `safety_regulatory` + product/`exact_only` (and product_family Safety) — routes to Food Recall Matcher; Asset runtime merges matcher Safety cards. Chickadees/Allen’s/Pams Lasagne stay non-public (no structured packs).  
2. **resolution_status:** Passes validated target `resolved` / `resolved_with_warning`. Positive publish lifecycle test added.  
3. **brand_descendants:** Reviewed `brand_child_of_brand` (Cadbury Dairy Milk → Cadbury). Dairy Milk-only targets stay narrow.  
4. **entity_descendants:** Reviewed ownership via `parent_id` + optional entity hierarchy CSV (empty). No retailer stocking.  
5. **Mutual exclusion:** Code-level guard; both flags → Asset only; Result never merges both.  
6. **Families:** Matching requires family `reviewed` **and** membership `reviewed`.

## Tests

```powershell
npx jest src/__tests__/unit/dynamicSignals/assetV02Matcher.test.ts src/__tests__/unit/workstreamC --no-coverage
```

**Results:** Asset remediation **15/15**; Workstream C **44/44**; **59/59** combined.

## Target resolution (unchanged identities)

Unresolved rows remain: Chickadees, Hoyt’s, Talley’s, Allen’s/Pams/Anchor exact GTINs, empty family memberships — see `TARGET_RESOLUTION.md` + `ENRICHMENT_PROPOSAL_20260807.md`.
