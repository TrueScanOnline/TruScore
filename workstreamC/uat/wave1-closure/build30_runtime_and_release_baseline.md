# Build 30 — Runtime and release baseline

**Wave 1 Signals Skeleton — closed as proof-of-concept**  
**As-built anchor:** iOS TestFlight Build 30  
**Date:** 2026-08-07  

## Immutable source

| Field | Value |
|-------|--------|
| Source commit SHA | `1c12e339edcaa39572f107a49e906473ba117e38` |
| Immutable commit | https://github.com/TrueScanOnline/TruScore/commit/1c12e339edcaa39572f107a49e906473ba117e38 |
| Tree | https://github.com/TrueScanOnline/TruScore/tree/1c12e339edcaa39572f107a49e906473ba117e38 |
| Release branch | `main` at that tip (no separate Build-30 tag) |
| Marketing version | `10.0.0` |

## iOS TestFlight Build 30

| Field | Value |
|-------|--------|
| EAS build ID | `5997a277-e151-49ed-9954-f3f3aa9c9f8f` |
| Profile | `uat-ios-flag-on` |
| Build number | **30** |
| Link | https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/builds/5997a277-e151-49ed-9954-f3f3aa9c9f8f |
| Env | `EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT=1`, `EXPO_PUBLIC_FOOD_RECALL_CORRECTED_PATH=1` |
| Image | `macos-sequoia-15.6-xcode-26.0` |

## iOS Build 29 (superseded control)

| Field | Value |
|-------|--------|
| EAS build ID | `6a9b3754-b786-481b-8030-57610d284bd4` |
| Profile | `uat-ios-flag-off` |
| Build number | **29** |
| Env | skeleton=`0`, recall corrected path=`0` |
| Status | Finished on EAS; TestFlight upload blocked historically by ASC agreement 403 (see submit logs). Executive risk of incomplete Build 29 cases accepted. |

## Android parity artifact

**No Android build exists at SHA `1c12e33`.**  
Latest listed Android `preview` artifacts on the Expo project are older commits (e.g. versionCode **13**, SHA `70a05ea…`) — **not** Build 30 parity.

| Field | Build 30 Android |
|-------|------------------|
| Version code | **None at Build 30 SHA** |
| OS-specific Signals code | **None** — shared React Native path only |
| Difference | Env/profile gating only (EAS); no iOS/Android producer fork |

## Android NZ-01 / partner artifact (reconcile — do not rebuild)

| Field | Value |
|-------|--------|
| EAS build ID | `113a38a4-a5dd-47c3-ade0-63d8a8813474` |
| Profile | `preview` |
| Version code | **13** |
| Source SHA | `70a05ea889df8ff43b53d7455c11375df89d131d` |
| Exact Build 30 SHA parity? | **No** — earlier functionally equivalent era build only |
| Build 30 Android | **None** |

See also `build30_repository_search_and_callsites.md`.

## Environment flags (Build 30)

| Flag | Value |
|------|--------|
| `EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT` | `1` |
| `EXPO_PUBLIC_FOOD_RECALL_CORRECTED_PATH` | `1` |
| Result `phase6SignalSourceMode` on Build 30 binary | **omitted → defaulted to `transitional` at that SHA** (contamination root; remediated after this baseline) |

## Genuine OS-specific implementation differences

None for Signals/Alerts producers. Shared modules under `src/` + Expo env at build time.
