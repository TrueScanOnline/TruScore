# Build 30 — As-built Signals/Alerts inventory

**Baseline SHA:** [`1c12e339edcaa39572f107a49e906473ba117e38`](https://github.com/TrueScanOnline/TruScore/commit/1c12e339edcaa39572f107a49e906473ba117e38)  
**Companion:** `build30_signal_producer_matrix.csv`, `build30_runtime_and_release_baseline.md`, `build30_subject_scope_and_product_family_assessment.md`

## Public pipeline (Build 30)

```
app/result/[barcode].tsx
  → buildWorkstreamCRuntimePublicationRecords(...)
  → buildProductScanResult(...)   // default phase6SignalSourceMode = 'transitional' AT THIS SHA
  → buildBannerAlertsDataFromScanResult / flattenSignalsOrdered / dedupe / non-A cap
  → BannerAlertsCard              // public Signals/Alerts surface
```

Immutable file links (Build 30 tip):

- https://github.com/TrueScanOnline/TruScore/blob/1c12e339edcaa39572f107a49e906473ba117e38/app/result/%5Bbarcode%5D.tsx
- https://github.com/TrueScanOnline/TruScore/blob/1c12e339edcaa39572f107a49e906473ba117e38/src/services/buildProductScanResult.ts
- https://github.com/TrueScanOnline/TruScore/blob/1c12e339edcaa39572f107a49e906473ba117e38/src/services/bannerAlertsService.ts
- https://github.com/TrueScanOnline/TruScore/blob/1c12e339edcaa39572f107a49e906473ba117e38/src/utils/scanResultPresentation.ts
- https://github.com/TrueScanOnline/TruScore/blob/1c12e339edcaa39572f107a49e906473ba117e38/src/components/BannerAlertsCard.tsx
- https://github.com/TrueScanOnline/TruScore/blob/1c12e339edcaa39572f107a49e906473ba117e38/src/signals/signalRenderMapping.ts
- https://github.com/TrueScanOnline/TruScore/blob/1c12e339edcaa39572f107a49e906473ba117e38/src/workstreamC/runtime/workstreamCRuntimePublicationRecords.ts
- https://github.com/TrueScanOnline/TruScore/blob/1c12e339edcaa39572f107a49e906473ba117e38/src/workstreamC/skeleton/resolveWorkstreamCRetailChain.ts
- https://github.com/TrueScanOnline/TruScore/blob/1c12e339edcaa39572f107a49e906473ba117e38/src/workstreamC/skeleton/workstreamCPublicationCore.ts
- https://github.com/TrueScanOnline/TruScore/blob/1c12e339edcaa39572f107a49e906473ba117e38/src/workstreamC/recall/evaluateFoodRecallMatch.ts

## Displayed count

| Layer | Behaviour | File |
|-------|-----------|------|
| Contract buckets | Uncapped A/B/C/D lengths | `buildProductScanResult.ts` |
| **UI count** | Flatten → dedupe → **non-A cap 4** → `alertCount` | `scanResultPresentation.ts` |
| Header | Shows `(N)` when `alertCount > 1` | `BannerAlertsCard.tsx` |

At Build 30, synthetic B + preference C **did** contribute to the displayed count whenever transitional mode ran.

## Producer inventory (summary)

See CSV for full matrix. Material public producers at Build 30:

| Producer | Public at Build 30? | Disposition |
|----------|---------------------|-------------|
| Limited Product Data (synthetic B) | **Yes** (transitional default) | **Remove** from public Signals; keep coverage flags internal |
| Web Search Source (synthetic B) | **Yes** | **Remove** from public Signals; keep coverage flag |
| Preference banners (Class C ×6) | **Yes** | **Remove** from public Signals |
| Workstream C In the News (governed) | Yes when UAT flag on | **Retain** |
| Stage 2 MILO food-recall matcher | Yes when corrected path on + eligible GTIN | **Retain** governed |
| Legacy SIG_REG_* subject-links | Suppressed | Internal / suppressed |
| Legacy `product.recalls` → banners | Off product-result path | Do not restore |
| Ethics BBFAW/KTC banners | No call sites | Not public Signals |
| RecalsCard / RecallAlertModal | Not mounted on live Result | Not public Signals |

## Architectural finding (confirmed)

`Limited Product Data` and `Web Search Source` are created in `syntheticTransparencyCards` (`buildProductScanResult.ts`) and merged into the same Signal buckets as governed records under **`transitional`**. They are uncertainty/completeness/provenance commentary — **not** governed external events — and must not remain in the public Signals module.

## KitKat AU-02 (diagnosis at Build 30)

Expected: `SIG_NEWS_GLOBAL_001` via **SL009** / subject **B0060**.  
Defect: OFF often sets `brands=Nestlé` only → chain **B0066**; alias `kitkat` length 6 failed the ≥8 blob gate; `pickLongestCanonicalBrand` preferred umbrella when both present.  
Legitimate fix (post-baseline remediation): exact reviewed alias/canonical token match on `product_name` + prefer name-token hits over brands-only umbrella — **no** Nestlé-parent SL, force-hit, or A-data mutation.

## Safety on-device

No positive Safety & Recalls result on-device in Wave 1 UAT (accepted residual). Assurance remains deterministic automated Stage 2 tests + Claude review until a catalogue-resolvable recall exists.
