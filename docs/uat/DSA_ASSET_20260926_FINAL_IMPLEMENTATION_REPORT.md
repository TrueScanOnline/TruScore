# Dynamic Signals Asset — 26 September 2026 FINAL implementation

**Parent (immutable):** `95c7d16dd46f64714baa4540d859b2d49eab4cda`  
**Branch:** `signals/dsa-asset-20260926-final`  
**Controlling artefact:** `Rveel_Dynamic_Signals_Asset_20260926_FINAL.xlsx`  
**Wave 4:** not merged / not consumed.

## Counts (publishable / active)

| Metric | Value |
|---|---|
| Workbook publishable signals | 26 |
| Publishable targets | 31 |
| Total signals CSV (incl. historical candidates) | 44 |
| Total targets CSV (incl. historical lineage) | 58 |
| Active phrase criteria (workbook-derived) | 32 |
| Active GTIN criteria (workbook-derived) | 23 |
| Unique verified GTINs | **23** |
| Publishable `product_family` / `family_members` | **0** |
| `product_scope_guard` values on publishable | `cocoa_chocolate` only (7 targets) |

### GTIN set

```
4975186250043
8801047559610
9300605162921
9300633636982
9300645014495
9300645020809
9300645020823
9300645022421
9300725012182
9310988016353
9310988019279
9310988019309
9339687138920
9339687265794
9339687306558
9339687306565
9349673005624
9414987012252
9415077134649
9415077182329
9415077370979
9415262047969
9415262050044
```

## Runtime rule implemented

For `product` / `exact_only`: market gate first; then **GTIN exact OR (Chaining brand/parent identity + phrase match)**. Non-matching GTIN does not veto name+identity. Pack/batch/date remain qualification only.

## Mechanical limitation

Workbook Excel date cells must be read with `cellDates: true` and normalised to `YYYY-MM-DD`; otherwise serial numbers break temporal publication windows. Sync script `scripts/sync-dsa-asset-from-workbook-20260926.js` performs that conversion.

## Tests

```bash
npx jest src/__tests__/unit/dynamicSignals/ src/__tests__/unit/identity/chainingArchitectureBoundary.test.ts src/__tests__/unit/services/bannerAlertsService.workstreamCRecall.test.ts --no-coverage
# 14 suites / 125 tests PASS
```

## Regeneration

```bash
DSA_EMBED_GENERATED_AT=2026-09-26T00:00:00.000Z npm run generate:dsa-asset-runtime-embed
# signals=44 targets=58 criteria=69
```

## Wave 4 overlap

No Wave 4 contribution files touched. Surfaces are Dynamic Signals CSVs, product-scope evaluator, DSA embed, and Signals/identity tests only.
