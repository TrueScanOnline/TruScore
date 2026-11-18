# Contribution restore — acceptance evidence package (2026-11-18)

**STOP for independent acceptance review.**  
Engineering package only. `publicReleaseStatus: BLOCKED`.

## Reconciled identifiers

| Role | Value |
|------|-------|
| Pre-containment baseline | `567a8ab1915db96ecec4a7ff3bfff3a249163da8` |
| Containment | `956886b7eb60f87de75c82082f0e43ee8a4efbb9` |
| **Restore implementation** | **`b752fdf567a9ff7e36e6b24f1d5e45d1bb35fd23`** |
| Docs stamp tip | `8c320723c972d204b0a595a3aa698d3679ba62db` |
| Acceptance package tip (this doc) | `83970a6c750c9621c9ef72754297737d61f425ae` |
| Branch tip at STOP | `83970a6c750c9621c9ef72754297737d61f425ae` on `build/w5-founders-native-20261114` |
| Deployed UAT backend | `dpl_CnW7TWKFNyyaVUfD43VnAR3y72yK` → `https://truscoreapi-uat.vercel.app` |
| Policy version (dormant) | `mvp_preselected_only_v1_20261118` |

Commit `b752fdf` is the restoration implementation. Tip `8c32072` only stamps that SHA in docs. No artifacts committed. Unrelated FAIL-gate edit to `MVP_PRESELECTED_ONLY_ACCEPTANCE_RESPONSE_20261117.md` left **uncommitted**. Stashes untouched.

## 1. Commit / push

- Dedicated restore commit pushed to `origin/build/w5-founders-native-20261114`.
- Excluded: `artifacts/**`, prior FAIL acceptance-response working edit.

## 2. Environment / missing-variable proof

See also `MVP_CONTRIBUTION_FUNCTIONALITY_RESTORE_20261118.md` § Environment.

| Case | Guided | Preselected containment |
|------|--------|-------------------------|
| Client env **missing** PRESELECTED | n/a | **Inactive** (`=== '1'` only) |
| Client env **missing** GUIDED | `app.config.js` → **`0`** | — |
| Server env **missing** `RVEEL_MVP_PRESELECTED_ONLY` | — | **Inactive** |
| `.env.development` | `1` | `0` |
| `uat-founders-android` / `uat-founders-ios` | `1` | `0` |
| `production` / `preview` / other EAS | `0` | missing (= inactive) |
| Live UAT probes after restore deploy | — | No policy 403; normal 400/401 |

## 3. Android contribution journeys (Expo Go / Pixel_5)

Local artifacts (untracked): `artifacts/mvp-contribution-restore-20261118/`.

| Journey | Result | Evidence |
|---------|--------|----------|
| Result load GTIN `9414732208565` | PASS — Score 60 Good | `02_result_after_restore.png` |
| Product Origins Add CTA | PASS — **Add product origins** visible | `03_scroll_contrib.png`, `10_origins_area.png` |
| Origins guided modal | PASS — Camera / Gallery / Enter origin statement | `11_origins_open.png` |
| Packet Claims choice sheet | PASS — Add claim/cert + **Confirm absence with a pack photo** | `13_packet_choice.png` |
| FM-03 photo entry | PASS — Packet information modal: Camera / Gallery / Type + absence confirm copy | `14_fm03_photo.png` |
| FM-03R “There are no claims…” | N/A on this **Rated** Claims fixture (eligibility unchanged) | Expected |
| Change / Remove | **Not exercised** — fixture has empty Origins/Packet (no admitted rows to change/remove). Wiring restored via guided entitlement; requires a product with prevailing contribution. | — |
| Live EA admission + reassessment | **OUTSTANDING** — UI paths open; completing capture→credential→admit would mutate UAT evidence and was not executed in this package. | Server accept path proven only as non-policy 400/401 |

## 4. iOS

**OUTSTANDING** — Windows host; no Xcode/`xcrun`/TestFlight device attached. AU TestFlight path required for positive/negative iOS UI.

## 5. Invariant regression (scoring / NR / Checking / settlement)

| Suite | Result |
|-------|--------|
| `governedOutcomeOracle.section10_2` | **PASS** (NR/Checking/contribution settlement locks) |
| Policy + feature-gate + FM-03/FM-03R + productInformationMenu + voluntaryContributionOffer | **PASS** (60 tests in combined run) |
| Scoring methodology / EA withdrawal code | **Unchanged** by restore diff (policy activation semantics + entitlement/UI only) |

## 6. Still unavailable (founder-approved gaps vs never-approved)

| Item | Status | Reason |
|------|--------|--------|
| Store/public guided entitlement | Unavailable | Fail-closed until separate shipping approval |
| OFF public network write | Unavailable | Kill-switch; not reactivated |
| Catalogue-only cert/country without free text/photo | Unavailable | Never shipped as approved standalone path |
| Server Claims-NR gate for FM-03R | Deferred | Never implemented; AMBER/RED |
| Live EA admit + reassessment proof on device | Outstanding | Not run this package |
| iOS device matrix | Outstanding | No iOS tooling on this host |
| Change/Remove on Barker fixture | N/A this fixture | Empty origins/claims |

## 7. Release

**BLOCKED.** Do not interpret this package as independent acceptance or public-release clearance.
