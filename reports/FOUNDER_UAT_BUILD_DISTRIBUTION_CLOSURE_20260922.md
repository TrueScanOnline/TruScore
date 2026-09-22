# Founder UAT build & distribution closure — 22 September 2026

**Branch:** `integration/wave3-chaining-signals-uat-20260922`  
**Accepted application source:** `72cc331a249dea102b88b543a3cd8bc379afcb8d`  
**Packaging tip (both platforms):** `ffbff3b95ee077b392e0899b4f41e1eb1a0e0757`  
**Public release:** not cut (TestFlight UAT + internal Android APK only).

## 1. Source confirmation

| Check | Result |
|---|---|
| Remote object `72cc331…` | Present on `origin` |
| Branch tip before packaging | `72cc331…` |
| Packaging descendant | `ffbff3b…` is a direct ancestor of `72cc331…` |
| Diff vs accepted source | **Only** `eas.json`, `.easignore`, `android/app/build.gradle` (packaging metadata) |

## 2. Identifiers (from live EAS history)

| Platform | Last finished | Selected next |
|---|---|---|
| iOS | BN **43** (`dd0fef28…`, 14 Sep 2026) | **BN 44** |
| Android | VC **19** (`04cff3f4…`, 14 Sep 2026) | **VC 20** |

Checked-in `eas.json` had stale BN 42 / VC 19; live sequence controlled.

## 3. Packaging commits (no application/runtime changes)

1. `1df612e` — bump `RVEEL_IOS_BUILD_NUMBER=44`, `RVEEL_ANDROID_VERSION_CODE=20` in UAT profiles  
2. `ffbff3b` — allowlist required runtime JSON in `.easignore` (S25 assets, BBFAW 2025, Claims register) so Metro can bundle; sync native `android/app/build.gradle` `versionCode` **20**

First EAS attempt on `1df612e` failed Bundle JavaScript because `.easignore` omitted JSON that the accepted app statically imports. Fix was packaging-only allowlist restoration (same class of prior “easignore fix” mechanics). Application source unchanged.

## 4. Resolved UAT configuration

| Profile | Distribution | Key env |
|---|---|---|
| `uat-dynamic-signals-ios` | store → TestFlight | `DYNAMIC_SIGNALS_ASSET=1`, `FOOD_RECALL_CORRECTED_PATH=1` (kill-switch log only; Stage 2 matcher retired), `WORKSTREAMC_SKELETON_UAT=0`, `SCORE_DIAGNOSTICS=1`, `STORE_RELEASE=0`, BN **44** |
| `uat-dynamic-signals-android` | internal APK | same Signals/UAT flags; VC **20** |

No retired recall pathway, obsolete Signal pathway, or skeleton UAT path was re-enabled.

## 5. Pre-build smoke (on packaging tip)

Passed: integrated Wave 3 + Chaining/Signals path; Dynamic Signals production path; Chaining architecture boundary; NA-022; Wave 3 corrective presentation; embed regen parity (`signals=44 targets=62 brands=796 criteria=56`). No new failures introduced by packaging.

## 6. Builds

| | iOS | Android |
|---|---|---|
| EAS build ID | `397ac1c5-b6bd-474c-a3bc-e9a97f410dcd` | `feb383af-b3a3-4dc5-be83-ab5b97d4a242` |
| Profile | `uat-dynamic-signals-ios` | `uat-dynamic-signals-android` |
| Identifier | app `10.0.0` / **BN 44** | app `10.0.0` / **VC 20** |
| Packaging SHA | `ffbff3b…` | `ffbff3b…` |
| Source SHA | `72cc331…` (app) | `72cc331…` (app) |
| Status | **FINISHED** | **FINISHED** |
| Completed | 2026-09-22T02:18:58Z | 2026-09-22T02:29:17Z |
| Artefact | [IPA](https://expo.dev/artifacts/eas/e6ptbKl7n5PR-BXFNGRv0lEkgaB94wvHtLV4rAMx_EM.ipa) | [APK](https://expo.dev/artifacts/eas/c7fwu3AhR_JK4m9bIcErOVcJyEUxxYkvvTaR3b23BVk.apk) |
| Logs | [iOS build](https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/builds/397ac1c5-b6bd-474c-a3bc-e9a97f410dcd) | [Android build](https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/builds/feb383af-b3a3-4dc5-be83-ab5b97d4a242) |

Failed earlier pair (diagnosed, superseded — do not use): iOS `d712de2b…`, Android `736fd374…` on tip `1df612e` (missing JSON allowlist).

## 7. Distribution

### iOS / TestFlight (AU)

- Submit ID: `49a20893-1101-4bba-8b77-07132bae02da`  
- Submit profile: `preview` (ASC App ID `6755704230`)  
- [Submission details](https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/submissions/49a20893-1101-4bba-8b77-07132bae02da)  
- Install: TestFlight → **TrueScan 10.0.0 (44)** — https://appstoreconnect.apple.com/apps/6755704230/testflight/ios  
- Processing may take several minutes after upload before the build is selectable for the founder/tester cohort.

### Android / internal UAT

- Internal APK (not Play public): https://expo.dev/artifacts/eas/c7fwu3AhR_JK4m9bIcErOVcJyEUxxYkvvTaR3b23BVk.apk  
- Build page: https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/builds/feb383af-b3a3-4dc5-be83-ab5b97d4a242  
- Device install: direct APK side-load / EAS install link for the internal distribution cohort. **No Google Play public release.**

## 8. Source parity

Both platform builds use packaging tip `ffbff3b…`, whose only deltas from accepted `72cc331…` are the three packaging files listed above. Application/runtime behaviour of the accepted integration tip is preserved.

## 9. Founder-facing UAT release notes

**TrueScan founder UAT — Wave 3 + Chaining / Signals integration**  
App version **10.0.0** · iOS TestFlight **build 44** · Android **versionCode 20**

Ready for physical-device validation:

- **Wave 3 presentation** — Score Highlights, Nutrition Details, Claims routing, and S25 “About these additives” corrective behaviour.
- **Ownership / Chaining** — brand, child-brand and parent resolution with approved aliases; unknown brands fail closed.
- **Benchmarks** — refreshed KTC and BBFAW assets behind Ethics scoring.
- **Dynamic Signals** — current publishable Safety and News Signals from ordinary product scans.
- **Recalls** — product-line relevance after brand resolution; affected size / batch / date / retailer shown as card guidance (check your pack). No manual batch/date entry.
- **Stale Signals** — prior Signal cards clear when product identity authority is lost (NA-022).

AU: install TestFlight **10.0.0 (44)**. Android UAT: install the internal **VC 20** APK. NZ Expo Go Metro path remains available for ongoing Signals checks where used.

## 10. Stop point

Both founder-UAT builds are available. No App Store public release, no Play public release, no Chaining/Signals/scoring/recall application changes after acceptance.
