# Build 30 / Wave 1 closure — Repository search and call sites

**Date:** 2026-08-07  
**Instruction:** `20260807_Signals_UAT_Skeleton_Build_30_Feedback_and_Cursor_Reply`  
**Build 30 baseline SHA:** `1c12e339edcaa39572f107a49e906473ba117e38`  
**Purpose:** Evidence of completeness for Claude adversarial review (not narrative).

## 1. `buildProductScanResult` call sites

| Location | Role |
|----------|------|
| `app/result/[barcode].tsx` | **Sole production caller** |
| `src/services/buildProductScanResult.ts` | Definition |
| `src/__tests__/golden/scanOutputContract.golden.test.ts` | Golden / architecture |
| `src/__tests__/golden/phase6.releaseHardening.test.ts` | Phase 6 fixture gate |
| `src/__tests__/unit/workstreamC/*.test.ts` | Workstream C runtime / recall |
| `src/__tests__/unit/services/buildProductScanResult.*.test.ts` | Slice 6 / mapping owner |

**Search:** `rg -n "buildProductScanResult\(" --glob "*.{ts,tsx}" -g "!node_modules"`

## 2. Signal source mode choosers

| Status | Evidence |
|--------|----------|
| Production option `phase6SignalSourceMode` | **Removed** from `BuildProductScanResultOptions` |
| Live Result | No longer passes any source mode |
| Residual string in tests | Golden test deliberately spreads `{ phase6SignalSourceMode: 'transitional' }` as unknown props and asserts **zero** legacy cards |

**Search:** `rg -n "phase6SignalSourceMode" --glob "*.{ts,tsx}"` → only the intentional architecture negative test.

## 3. Producer / legacy feeder search

Commands:

```text
rg -n "syntheticTransparency|limited_data|web_search_source|generateBannerAlerts" --glob "*.{ts,tsx}" -g "!node_modules"
rg -n "BannerAlertsCard|RecallsCard|RecallAlertModal" --glob "*.{ts,tsx}" -g "!node_modules"
```

| Producer | Live path? | Notes |
|----------|------------|-------|
| Governed `dynamicSignalRecords` → publication cards | Yes | Only public Signals source in `buildProductScanResult` |
| Limited Product Data / Web Search Source synthetic cards | **No** | Functions deleted from builder; i18n keys may remain unused |
| Preference banners via `generateBannerAlerts` | **No** on Result | Service retained; **not imported** by `buildProductScanResult`; unit tests only |
| `BannerAlertsCard` | Yes | Renders `ProductScanResult` presentation only (`app/result/[barcode].tsx`) |
| `RecallsCard` / `RecallAlertModal` | **Not** on live Result | Only `app/result/[barcode].refactored.tsx` (not the mounted screen) |

## 4. Renderers and copy

| Surface | Path |
|---------|------|
| Public Signals list | `src/components/BannerAlertsCard.tsx` |
| Flatten / dedupe / non-A cap | `src/utils/scanResultPresentation.ts` |
| Publication → SignalCard | `src/signals/signalRenderMapping.ts` |
| Food-recall batch UI | Result screen + Stage 2 markings (governed Class A only) |

Umbrella heading: **not** hardcoded replacement. Pending for integrated Dynamic Signals build: class labels **Safety & Recalls** / **In the News**; remove universal **ALERT** / universal red; founder-approved headline schema. Candidate umbrella: “Beyond the label” (unauthorised).

## 5. Unreachable-producer proofs

| Claim | Proof |
|-------|-------|
| No transitional mode in production API | Option deleted; golden escape-hatch test |
| No synthetic cards in buckets | Builder merges publication cards only |
| Preferences cannot become public Signals | `userPreferences` unused for Signals assembly; golden preference test |
| Coverage flags internal | `low_completeness` / `web_search_fallback` remain on `coverage.flags` only |

## 6. iOS / Android contract differences

None in Signals producers (shared React Native). Env flags set at EAS profile time only.

## 7. Android NZ-01 artifact actually tested

Do **not** rebuild Android / reopen NZ-01.

| Field | Value |
|-------|--------|
| Case context | NZ partner on-device UAT (Countdown / NZ Signals path; D02-class) |
| EAS build ID | `113a38a4-a5dd-47c3-ade0-63d8a8813474` |
| Profile | `preview` |
| Version | `10.0.0` |
| Android `versionCode` | **13** |
| Source SHA | `70a05ea889df8ff43b53d7455c11375df89d131d` |
| Env / flags | Preview profile of that era — **not** Build 30 `uat-ios-flag-on` twin |
| Exact-SHA vs Build 30? | **No** — functionally earlier; **not** Build 30 parity |
| Build 30 Android | **None** at SHA `1c12e33` |

iOS Build 30 remains the immutable Wave 1 skeleton anchor (`5997a277-e151-49ed-9954-f3f3aa9c9f8f`, BN 30, SHA `1c12e33`).
