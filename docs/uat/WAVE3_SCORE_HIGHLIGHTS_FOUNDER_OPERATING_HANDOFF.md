# Wave 3 Score Highlights — Founder operating handoff (S28)

**Status:** Founder UAT **candidate** builds produced and distributed. Pre-UAT implementation/assurance gate closed (Claude PASS). **Not** founder-accepted UAT.

**Branch:** `wave3/score-highlights-s12-20260902`  
**Independently assured application-code baseline:** `04e661b046d6e60e76e26fbc38f11f933a3aa5d3`  
**iOS release-packaging tip (BN metadata only):** `c963e780a0ab109ab70396cfb6f3e25fde4f0c2c`  
**L3 addendum:** `Rveel_Wave3_Score_Highlights_L3_Content_Closure_Addendum_20260903_v1_0`

`git diff 04e661b..c963e78` is exactly one line: `RVEEL_IOS_BUILD_NUMBER` `39` → `40` in `eas.json` profile `uat-dynamic-signals-ios`.

## Candidate builds (this UAT cut)

| Platform | EAS profile | Build ID | Version | Git on binary | Distribution status |
|----------|-------------|----------|---------|---------------|---------------------|
| iOS | `uat-dynamic-signals-ios` | `ade65a19-9ad5-4fa4-9b9d-0e5d77e4ba0c` | app `10.0.0` / **BN 40** | `c963e78…` (app code = `04e661b…`) | EAS **FINISHED**; uploaded to App Store Connect; **TestFlight processing** |
| Android | `uat-dynamic-signals-android` | `c24a4c4a-a5dd-4ba2-9ba8-960c0d1f9b0c` | app `10.0.0` / **versionCode 18** | `04e661b…` | EAS **FINISHED**; internal APK ready |

Superseded iOS IPA (BN 39, ASC duplicate — do not use for TestFlight): `82480c2a-6513-4fcf-89ef-863db5119fe1`.

### Install / distribution routes (actual)

#### iOS / TestFlight (AU)

1. EAS build: https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/builds/ade65a19-9ad5-4fa4-9b9d-0e5d77e4ba0c  
2. IPA: https://expo.dev/artifacts/eas/U_3DX559MbT9QaKmOubGOwkDbekpjpTJ_rF4XJNOkow.ipa  
3. Submitted via `eas submit --platform ios --id ade65a19-9ad5-4fa4-9b9d-0e5d77e4ba0c --profile preview` (ASC app id `6755704230`).  
4. Submission: https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/submissions/a9216747-f170-4b1d-96e0-40007cbfe3fa — **uploaded successfully**; Apple processing (~5–10 min typical).  
5. Install route: TestFlight → app **10.0.0 (40)** — https://appstoreconnect.apple.com/apps/6755704230/testflight/ios  
6. Confirm on-device build **40** (not older BN 39 from `f5b3be0…` or the blocked `82480c2a…` IPA).

#### Android (NZ / internal)

1. EAS build: https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/builds/c24a4c4a-a5dd-4ba2-9ba8-960c0d1f9b0c  
2. APK: https://expo.dev/artifacts/eas/RKvkb97F5MgWewtOFC-b2r_oUaP2UPvzWxkJ0v3m234.apk  
3. Confirm **10.0.0 (18)** and SHA lineage `04e661b…`.

## EAS profiles used (exact)

| Profile | Extends | Key env |
|---------|---------|---------|
| `uat-dynamic-signals-ios` | `preview` + `distribution: store` | `EXPO_PUBLIC_SCORE_DIAGNOSTICS=1`, `EXPO_PUBLIC_STORE_RELEASE=0`, Dynamic Signals Asset on, WorkstreamC skeleton off, `RVEEL_IOS_BUILD_NUMBER=40` |
| `uat-dynamic-signals-android` | `preview-apk` + internal APK | same diagnostics/Signals flags; `RVEEL_ANDROID_VERSION_CODE=18` |

Store/production profiles remain **not** entitled: `EXPO_PUBLIC_SCORE_DIAGNOSTICS=0`, `EXPO_PUBLIC_STORE_RELEASE=1`.

**Do not** put `EXPO_PUBLIC_SCORE_DIAGNOSTICS=1` in committed `.env.development`.

## Score diagnostics Off / On (governed)

1. Install an **entitled** UAT build (profiles above).  
2. Settings → **Score diagnostics**.  
3. **Off** (default): near-consumer Result (no “How was this scored?”).  
4. **On**: S28 ledger entry. Toggle local; no rebuild.

## Consumer-parity checks (founder)

- Entitled UAT + diagnostics **Off**: no S28 entry.  
- “What we found” single neutral list.  
- L2 → L3 opens governed in-app destinations.

## Known non-blocking UAT / watch items (carry; do not fix during UAT)

1. **iPhone L3 transition:** first-tap after Score Highlights dismiss — record flicker/miss only.  
2. **Open Origins destination-state seam** (`origins_tags` vs CoM `manufacturing_places`) → Wave 4.  
3. Weak L3 host-presentation regression coverage.  
4. Three inherited baseline test failures; ~twelve inherited TypeScript errors; S27 static red/green residue.

## Build warnings / deviations

- Prior BN 39 IPA could not upload to ASC (`EAS_UPLOAD_TO_ASC_VERSION_DUPLICATE`); resolved by metadata-only BN **40** packaging tip `c963e78`.  
- EAS note: `cli.appVersionSource` unset (future requirement).  
- iOS secrets via EAS production environment; UAT profile `env` still sets SCORE_DIAGNOSTICS / STORE_RELEASE as governed.  
- Android: native `android/` package precedence.  
- Archive ~171 MB.

## P1-1 L3 closure — completion declaration (unchanged)

Closed under Addendum v1.0. Legacy `ProcessingLevelModal` / `EcoScoreInfoModal` / `PackagingInfoModal` are **not** Score Highlights L3 destinations.

## Cost

Ordinary EAS build/submit minutes only.
