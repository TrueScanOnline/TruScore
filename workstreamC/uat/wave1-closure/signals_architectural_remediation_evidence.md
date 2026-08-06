# Signals architectural remediation evidence (Wave 1 closure)

**Instruction:** `20260806_Signals_UAT_Skeleton_Build_30_Feedback_and_Cursor_Instruction`  
**Build 30 baseline:** `1c12e339edcaa39572f107a49e906473ba117e38`  
**Remediation commit:** `f5927ed935fbd31a275d34e9de99b48a652890b8`  
**Tip (evidence SHA fill):** `fdd6048ff056c5bc752fbd8d748163302f313f40`

## Implementation summary

1. **Governed-only public Signals** — `buildProductScanResult` default `phase6SignalSourceMode` changed from `transitional` to `governed_5b_only`. Omission cannot restore legacy/synthetic cards. Live Result screen passes `governed_5b_only` explicitly.
2. **Non-governed producers unreachable** — Limited Product Data, Web Search Source, and preference Class C banners only emit when `phase6SignalSourceMode: 'transitional'` (controlled tests). Coverage flags remain internal.
3. **KitKat AU-02** — reviewed alias/canonical exact token match on `product_name`/`generic_name`; prefer name-token hits over brands-only umbrella so Nestle-only OFF brands + KitKat title resolve to **B0060** then `SIG_NEWS_GLOBAL_001`. Preserves Cadbury dual-positive, Ritz/Philadelphia/Coca-Cola negatives. No A-data mutation, Nestle-parent SL, force-hit, or synthetic GTIN.
4. **Safety assurance** — retained Stage 2 deterministic MILO/path-control tests; no manufactured on-device recall.
5. **No** Launch Corpus / Workstream A/B / TruScore changes. No Build 31 skeleton cycle.

## Changed-file manifest

| File | Change |
|------|--------|
| `src/services/buildProductScanResult.ts` | Default governed_5b_only |
| `app/result/[barcode].tsx` | Explicit governed_5b_only |
| `src/workstreamC/skeleton/resolveWorkstreamCRetailChain.ts` | KitKat/name-token identity preference |
| `src/__tests__/unit/workstreamC/resolveWorkstreamCRetailChain.test.ts` | KitKat + Nestle-only controls |
| `src/__tests__/unit/workstreamC/workstreamCRuntimePublicationRecords.test.ts` | KitKat publication |
| `src/__tests__/golden/scanOutputContract.golden.test.ts` | Governed-default expectations |
| `src/__tests__/golden/__snapshots__/scanOutputContract.golden.test.ts.snap` | Updated |
| `workstreamC/uat/wave1-closure/*` | Disclosure + this evidence |

## Producer dispositions (final)

See `build30_signal_producer_matrix.csv` — all synthetic/preference public producers removed from default path; governed Workstream C + Stage 2 MILO retained.

## Tests and commands

```powershell
cd C:\TrueScan-FoodScanner
npm run test:workstreamC -- --no-coverage
npx jest src/__tests__/golden/scanOutputContract.golden.test.ts src/__tests__/golden/phase6.releaseHardening.test.ts --no-coverage
```

**Results (this pass):** workstreamC **38/38 PASS**; golden + phase6 hardening **9/9 PASS**.

## Confirmations

| Claim | Status |
|-------|--------|
| Displayed count governed-record-only on public Result | Yes (default + explicit mode) |
| Limited Product Data / Web Search Source not public by default | Yes |
| Preference banners not public by default | Yes |
| KitKat Nestle-only brands to GLOBAL_001 | Yes |
| Cadbury dual / Ritz / Philadelphia negatives preserved | Yes |
| Closed A/B assets unchanged | Yes |
| TruScore scoring unchanged | Yes |
| Android/iOS producer fork | None (shared RN) |
| No Build 31 / no Launch Corpus duplication | Confirmed |

## Unresolved risks / limitations

- No Android parity binary at Build 30 SHA.
- No on-device positive Safety & Recalls until catalogue-resolvable recall + verified GTIN.
- TestFlight submit still requires signed ASC agreements (prior 403).
- Umbrella public Signals heading still under founder consideration — not hardcoded.
- product_family assessment is read-only; not implemented.
- Next step for Claude: review this package; then integrate founder Launch Corpus (separate thread).

## Claude package contents

1. Build 30 baseline — `build30_runtime_and_release_baseline.md`  
2. As-built inventory — `build30_as_built_signals_alerts_inventory.md`  
3. Producer matrix — `build30_signal_producer_matrix.csv`  
4. Subject scope + product_family assessment — `build30_subject_scope_and_product_family_assessment.md`  
5. This remediation evidence + git diff vs `1c12e33`  
6. Tests/commands above  

## Immutable links

- Remediation: https://github.com/TrueScanOnline/TruScore/commit/f5927ed935fbd31a275d34e9de99b48a652890b8  
- Tip: https://github.com/TrueScanOnline/TruScore/commit/fdd6048ff056c5bc752fbd8d748163302f313f40  
- Closure folder: https://github.com/TrueScanOnline/TruScore/tree/fdd6048ff056c5bc752fbd8d748163302f313f40/workstreamC/uat/wave1-closure  
- Diff vs Build 30: https://github.com/TrueScanOnline/TruScore/compare/1c12e339edcaa39572f107a49e906473ba117e38...f5927ed935fbd31a275d34e9de99b48a652890b8  
