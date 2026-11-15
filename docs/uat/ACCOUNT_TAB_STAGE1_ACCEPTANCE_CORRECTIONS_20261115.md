# Account Stage 1 — Acceptance corrections

**Date:** 15 November 2026  
**Prior Stage 1 tip:** `d2df412d1277ff490a43080fc04e7fefe89e8029`  
**Branch:** `build/w5-founders-native-20261114`

## Classification

| Change | Class | Notes |
|---|---|---|
| Clear-failure propagation | GREEN | Local store/cache durability only |
| Legal open-when-ready helper | GREEN | Fail-closed unless `legalDestinations.*.ready === true` |
| DeveloperSettings store-release gate | GREEN containment | Uses existing `isStoreReleaseRuntime()`; founder/UAT non-store builds keep access |
| Methodology content | Audit only | No substantive rewrite without founder approval |

Protected scoring, publication, Evidence Authority, FM-01/02/03R, and Premium gates unchanged.

## 1. Local data-clear failure reporting

- `clearHistory` / `clearFavorites` now restore prior in-memory state and **throw** if AsyncStorage deletion fails or is not verified empty.
- `clearCache` now **throws** on AsyncStorage or FileSystem failure (no silent swallow).
- `PrivacyDataScreen` already surfaced catch → error alert; success only after awaited clear completes.
- History / Favourites screens also catch and show `account.clearFailed`.
- Credentials and unrelated keys remain untouched (isolation + failure tests).

## 2. Future-ready legal navigation

- `openLegalDestination()` opens `Linking.openURL` only when `isLegalDestinationReady(key)`.
- Current privacy/terms remain `ready: false` (fail-closed).
- Ready-path covered by unit test with mocked readiness — production readiness flags were **not** flipped.

## 3. Methodology / source-licence audit (founder approval needed)

Account Legal panels currently reuse existing Result/settings i18n. **No silent rewrite performed.**

| Surface | Source keys | Finding |
|---|---|---|
| RVEEL Score Methodology | `infoModal.trustScore.description`, `.note` | Still anchors **v1.4** via `RVEEL_SCORE_METHODOLOGY_VERSION` / note string; includes **“100% transparent”** marketing phrasing |
| Data Sources & Licences | `settings.openSourceMessage`, `infoModal.trustScore.dataSourceNote` | Lists OFF / UPCitemdb / Barcode Spider / FDA; **does not** state ODbL / CC BY-SA attribution obligations called out in `docs/legal/MVP_COUNSEL_READY_PACK.md` |
| Limitations | `result.legalDisclaimerModalP1–P3`, `result.legalDataLimitationsModalP1` | Consistent with Result disclaimer surfaces |

**Requires founder / counsel approval before changing Account or Result copy:**  
whether Account should continue to show v1.4 / “100%” / “all … verifiable” language, and what exact OFF licence attribution text to ship.

## 4. DeveloperSettings consumer deep-link containment

**Finding:** Ordinary deep link `…/developer-settings` previously resolved in all builds, including production-class store releases (`EXPO_PUBLIC_STORE_RELEASE=1`).

**Correction (smallest existing guard):**

- `isDeveloperSettingsRouteEnabled()` → `!isStoreReleaseRuntime()`
- Linking omits `DeveloperSettings` on store release
- Root stack omits the modal on store release
- Methodology fail-closed redirect uses DeveloperSettings only when enabled; otherwise `Main`

Founder/UAT/dev (non-store) access preserved.

## 5. Outstanding external blockers (unchanged)

| Function | Required configuration |
|---|---|
| Contact / Report a problem | Set valid `EXPO_PUBLIC_SUPPORT_EMAIL` in EAS / `.env` so `productIdentity.supportEmail` is non-empty |
| Privacy Policy / How RVEEL uses your data | Publish approved content at `https://truescan.app/privacy`, then set `legalDestinations.privacy.ready = true` after verification |
| Terms of Use | Publish approved content at `https://truescan.app/terms`, then set `legalDestinations.terms.ready = true` after verification |

Do not invent email addresses or legal HTML.

## Tests

- `npx tsc --noEmit` — PASS
- Account + developerTools + methodology containment Jest — PASS

## Emulator

Pixel_5 left on Account Home dark mode for founder review after reload.
