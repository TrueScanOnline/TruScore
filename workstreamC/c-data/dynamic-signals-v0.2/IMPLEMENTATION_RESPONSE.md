# Rveel Dynamic Signals Asset v0.2 — Cursor implementation response

**Date:** 2026-08-07  
**Status:** Implementation + automated verification complete. **No** TestFlight / device UAT under this instruction.

## Anchors

| Item | Value |
|------|--------|
| Base commit used | `2d5e6e2361525c98ba299647756160b06e3f9239` |
| Resulting commit SHA | *(filled after commit)* |
| Proposed tag | `dynamic-signals-asset-v0.2-impl-20260807` |
| Skeleton closure (preserved) | `wave1-signals-skeleton-uat-remediation-closure-20260807` |

Wave 1 overall remains **active**. Skeleton UAT & Remediation remains **CLOSED / ACCEPTED**.

## Repo paths (new / changed)

### Governed data
- `workstreamC/c-data/dynamic-signals-v0.2/` — pack README, workbook copy, `TARGET_RESOLUTION.md`
- `workstreamC/c-data/dynamic-signals-v0.2/input/` — `source_universe.csv`, `reveal_domains.csv`, `signals.csv`, `signal_targets.csv`, `controlled_values.csv`
- `workstreamA/a-data/chaining-extensions/v0.1/` — `product_families.csv`, `product_family_membership.csv` (empty membership), README

### Code
- `src/dynamicSignals/asset/v0.2/matchDynamicSignalsAsset.ts`
- `src/dynamicSignals/asset/v0.2/loadDynamicSignalsAssetPack.ts`
- `src/dynamicSignals/asset/v0.2/buildDynamicSignalsAssetRuntimePublicationRecords.ts`
- `src/identity/chaining/productFamilyMaps.ts`
- `src/identity/types.ts` — optional `canonical.product_family_ids`
- `src/identity/resolveSharedIdentityContext.ts` — accepts `productFamilyIds`
- `src/workstreamC/skeleton/resolveWorkstreamCRetailChain.ts` — Finding B GTIN supplementary; `applyCadburyUatBridge` opt-out for Asset path
- `app/result/[barcode].tsx` — merges Asset records when `EXPO_PUBLIC_DYNAMIC_SIGNALS_ASSET=1`
- `src/__tests__/unit/dynamicSignals/assetV02Matcher.test.ts`

Skeleton `workstreamC/c-data/v0.4/` **unchanged** (historical proof).

## Workbook → repo schema mapping

| Workbook sheet | Repo file | Rows |
|----------------|-----------|------|
| Source_Universe | `input/source_universe.csv` | **13** |
| Reveal_Domains | `input/reveal_domains.csv` | **14** |
| Signals | `input/signals.csv` | **16** |
| Signal_Targets | `input/signal_targets.csv` | **25** |
| Controlled_Values | `input/controlled_values.csv` | **54** |

All Signal `signal_publication_state` values remain **`candidate`** (not promoted).

## Product-family + SharedIdentityContext

- Additive Chaining tables under `chaining-extensions/v0.1` (does **not** rewrite wave1-v0.14 brand/parent/gtin CSVs).
- Six family IDs created for resolvable family targets; **membership empty** pending founder-reviewed GTINs.
- `SharedIdentityContext.canonical.product_family_ids?: string[]` additive field.

## Runtime matching

`market_key + target_type + canonical_target_id + propagation_mode` only.  
`target_label` / `scope_review_summary` are review aids only.  
No free-text / keyword / article-text production matching.  
Skeleton Cadbury UAT bridge **disabled** on Asset path (`applyCadburyUatBridge: false`).

Env gate: `EXPO_PUBLIC_DYNAMIC_SIGNALS_ASSET=1` (default off — no device build).

## Cadbury / Ritz before → after

| | Skeleton UAT | Asset v0.2 production matcher |
|--|--------------|-------------------------------|
| Cadbury chocolate NGO | UAT bridge B0067→B0241 + chocolate heuristic for SL008/SL011 | **brand_descendants** on `B0067` (Cadbury) or `B0241` (Dairy Milk) — no bridge |
| Ritz | Same parent P0009 but different brand → no match | Same — `B0069` ≠ `B0067`/`B0241` → no match |

## Unresolved targets (founder disposition)

See `TARGET_RESOLUTION.md`. Material gaps: **Chickadees**, **Hoyt's**, **Talley's**, and all exact-product / family membership **GTINs**.

## Finding B (carried into this implementation)

When product identity fails, a **reviewed** GTIN link may supply supplementary chain evidence before unresolved. Does not create a GTIN programme or weaken conflict fail-closed.

## Finding C

Still deferred housekeeping: unmounted `app/result/[barcode].refactored.tsx` — not changed here.

## Automated tests

```powershell
cd C:\TrueScan-FoodScanner
npx jest src/__tests__/unit/dynamicSignals/assetV02Matcher.test.ts --no-coverage
npx jest src/__tests__/unit/workstreamC --no-coverage
```

**Results:** Asset matcher **12/12 PASS**; Workstream C **44/44 PASS**.

## Diff confirmation

- Workstream A wave1-v0.14 governed identity CSVs: **not mutated** (additive chaining-extensions only).
- Workstream B frozen benchmark outputs: **not touched**.
- TruScore pillars/methodology: **not mutated** (test asserts scores unchanged).

## Material issues requiring founder disposition

1. Supply reviewed GTINs / brands for unresolved targets (Chickadees, Hoyt's, Talley's, exact packs).  
2. Approve reviewed `product_family_membership` rows before family Signals can match in production.  
3. Confirm whether Cadbury chocolate (`B0067`) should also include sibling Cadbury sub-brands via a future reviewed brand-hierarchy table (MVP is exact `brand_id` only).  
4. When to enable `EXPO_PUBLIC_DYNAMIC_SIGNALS_ASSET` and promote selected candidates to `publishable` (separate governance decision).
