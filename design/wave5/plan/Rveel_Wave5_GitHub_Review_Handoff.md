# Rveel Wave 5 — GitHub review handoff

This note is documentation only. It does not change the tested source.

| Role | SHA |
| --- | --- |
| Baseline B0 | `99102768b61bd6e518bb889e3ab6f01dfc3e1268` |
| Tested candidate | `5b33ab92e0713f136e77b8c290fae735dd4cc721` |
| Return branch | `preserve/pre-wave5-9910276-20261008` at the same B0 SHA |

Repository: https://github.com/TrueScanOnline/TruScore

Branch: `wave5/score-experience-20261008`

Comparison of the tested candidate with B0: https://github.com/TrueScanOnline/TruScore/compare/99102768b61bd6e518bb889e3ab6f01dfc3e1268...5b33ab92e0713f136e77b8c290fae735dd4cc721

No EAS build, store submit, TestFlight upload, OTA publish, backend deploy, or release merge was started for this handoff.

## Implementation scope

Wave 5 presents the existing governed outputs in the Emerald theme. The tested commit on top of `d0b01667d4dbf993d304d2f14d1bc0aa8279e233` is Result presentation only:

- Hero photo and product name use the larger identity tokens, with the name full width under the photo.
- The overall score, including the unrevealed question mark, and the information control beside “Rveel Score” open the existing data-limitations card.
- Emerald confidence labels render with a trailing chevron. Confidence words themselves are unchanged.
- Did You Know uses the platform scrollbar when its text overflows.
- Nutrition & Ingredients keeps the pencil and share controls together inside the card header.
- The English nutrient level badge reads “Mid”. Colour, size, and place are unchanged. “Moderate confidence” is unchanged. French and Spanish level badges are unchanged.
- On the ingredients card, share sits on the Processing Level row and the information icon sits on the NOVA row.
- About these Additives uses the dropper glyph on the card and in its detail header.
- Scan Another Product has a 2px white border on the emerald fill.
- Temporary `[emerald-layout]` and `[result-scroll]` debug logging was removed.
- The share story image passes `imageUrl ?? undefined` so the image source type accepts the value. The image is still mounted only when a URL is present and has not fallen back to the parcel.
- The nutrition source assertion now requires the live `openContribution('nutrition', 'add')` and `openContribution('nutrition', 'change', true)` calls. The one-argument form was already absent at B0.

Surfaces already on the branch before that commit, and included in the tested SHA:

- Result identity, wallpaper, score, findings, nutrition, ingredients, additives, origins, packet claims, disclaimer, and Scan Another Product.
- Result overlays for data limitations, highlights, score information, and share.
- Contribution branches for ingredients, nutrition, origins, and packet claims. Certifications stay inside the existing packet-information grouping.
- Scan, Search, History, Favourites, Settings (`app/profile.tsx`), and the shared tab bar.
- Share capture waits for a rendered image, then uses the parcel if the image fails or times out.

Founder visual acceptance recorded in the Master Plan is only the rendered SCR-RESULT at `d5a7955b60bf64fbd455d332ae640780279127e1`. Later cards, overlays, and contribution screens are implemented for review. They are not recorded as accepted.

## Environment and configuration

Resolved with `app.config.js` after applying each `eas.json` profile, including `extends`. This is not the Metro process environment. `npx expo-doctor` passed 16/16 and did load the local env files; those local files are not what EAS bakes.

Shared resolved identity:

- App name Rveel, slug `truescan-food-scanner`, version `10.0.0`, scheme `truescan`.
- Android package and iOS bundle identifier: `com.truescan.foodscanner`.
- Updates: `enabled: false`, `checkAutomatically: NEVER`, `fallbackToCacheTimeout: 0`.
- No `runtimeVersion`. No EAS Update URL. No update channel.

Backend URL is `extra.EXPO_PUBLIC_BACKEND_URL`, which is `EXPO_PUBLIC_BACKEND_URL` or the app default `https://truscoreapi.vercel.app`. Evidence environment is `EXPO_PUBLIC_EVIDENCE_AUTHORITY_ENV`. The client calls `GET /api/evidence-authority`.

| Profile | Distribution | Native output | Backend | Authority env | Asset | Recall path | Skeleton UAT | Score diagnostics | Store release | Version code / build |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| production | store | Android app bundle, iOS Release | production default | production | 1 | 1 | 0 | 0 | 1 | 13 / 26 |
| preview | store | Android APK, iOS Release | production default | production | 1 | 1 | 0 | 0 | 1 | 13 / 26 |
| preview-apk | internal | Android APK | production default | production | 1 | 1 | 0 | 0 | 1 | 13 / 26 |
| production-apk | internal | Android APK | production default | production | 1 | 1 | 0 | 0 | 1 | 13 / 26 |
| development | internal, dev client | Android APK | production default | uat | 1 | 1 | 0 | 0 | 0 | 13 / 26 |
| uat-dynamic-signals-ios | store, extends preview | iOS Release | `https://truscoreapi-uat.vercel.app` | uat | 1 | 1 | 0 | 1 | 0 | 13 / 60 |
| uat-dynamic-signals-android | internal, extends preview-apk | Android APK | `https://truscoreapi-uat.vercel.app` | uat | 1 | 1 | 0 | 1 | 0 | 34 / 26 |
| uat-ios-flag-off | store, extends preview | iOS Release | production default | production | 1, inherited | 0 | 0 | 0 | 1 | 13 / 29 |
| uat-ios-flag-on | store, extends preview | iOS Release | production default | production | 1, inherited | 0 | 0 | 0 | 1 | 13 / 30 |

Metro / Expo Go uses committed `.env.development` plus `app.config.js` defaults: Asset 1, recall path 1, skeleton UAT 0, score diagnostics default 0, store release default 0, authority env `uat`, backend unset so the production default applies. The private `.env` also points the backend at that same production default. It is gitignored and was not committed.

Live route check, GET only, no credential request:

- `https://truscoreapi-uat.vercel.app/api/evidence-authority` returned 200 and `{"success":true,"authorityEnv":"uat"}`.
- `https://truscoreapi.vercel.app/api/evidence-authority` returned Vercel `NOT_FOUND` (HTTP 404, `X-Vercel-Error: NOT_FOUND`).
- `GET /api/manual-products` on both hosts returned HTTP 400, so both hosts respond. Only the production authority route is missing.

`npx vercel env ls` in `backend/vercel` failed before listing names: project settings could not be retrieved. Deployed secret values were not read. Local private files contain these names and were not committed: `DATABASE_URL`, `POSTGRES_URL`, `BLOB_READ_WRITE_TOKEN`, `PGPASSWORD`, `POSTGRES_PASSWORD`, `VERCEL_OIDC_TOKEN`, `EXPO_PUBLIC_USDA_API_KEY`, `EXPO_PUBLIC_SPOONACULAR_API_KEY`, `EXPO_PUBLIC_BARCODE_LOOKUP_API_KEY`, `EXPO_PUBLIC_QONVERSION_PROJECT_KEY`. Server authority code also reads `RVEEL_EVIDENCE_AUTHORITY_ENV`, `RVEEL_FOUNDER_ADMIN_TOKEN`, `OFF_LIVE_WRITE_TARGET`, `OFF_LIVE_WRITE_USER_ID`, `OFF_LIVE_WRITE_PASSWORD`, and `OFF_LIVE_WRITE_EXECUTE`. Their deployed presence was not verified.

`npm run preflight:mvp-release-asset` passed for the seven MVP profiles. `uat-ios-flag-off` and `uat-ios-flag-on` are outside that set.

## Commands and results

At the tested source, before the documentation commit:

- `npx tsc --noEmit --pretty false` — exit 2. One Wave 5 diagnostic in `ShareProductStoryCard.tsx` (`uri` null) was fixed. A second run still exits 2 with the 24 diagnostics listed below.
- Governed Jest, 17 suites, 97 tests, 7 snapshots — pass. Includes consumption guards, share capture, NA-018 share authority, consumer journeys, contribution closure, integration closure, resume guard, React Native import guard, `common.remove`, search error copy, publication load guard, scan output golden, phase 6 release hardening, Wave 3 UAT narrow correction, nutrition presentation, Dynamic Signals release profiles, and legacy Alerts gate.
- After the share-image type narrowing: share capture, consumption guards, `correctivePackage.c1c4`, and `wave4a5ResultSurface` — 4 suites, 34 tests, pass.
- `npm run preflight:mvp-release-asset` — pass, 7 profiles.
- `npx expo-doctor` — 16/16 pass.
- Authority GET probes — UAT identified as `uat`; production route not deployed.

The phase 6 Jest run rewrites local report timestamps. Those report files were restored to the committed B0 content and are not part of `5b33ab9`.

## Remaining defects

All 24 type diagnostics below are on lines blamed to commits before B0. They are not introduced by `5b33ab9`. Metro and the current EAS profiles do not run `tsc --noEmit`. They do not change the Jest results above. They would block a future policy that requires a clean typecheck before a native build. They do not block GitHub review of this candidate.

| File | Diagnostic | Behaviour | Predates B0 | Impact | Disposition |
| --- | --- | --- | --- | --- | --- |
| `app/result/[barcode].tsx` 397, 584, 602 | TS2304 `TruScoreResult` is not in scope | Type annotation on existing score state | Lines blamed 22 Nov 2025 and 9 Dec 2025 | Type-only. Erased before runtime | Leave. Does not block review |
| `app/result/[barcode].tsx` 2540, 2543, 2547 | TS18047 `snapshot` possibly null | Snapshot timestamp latch | Blamed 3 Oct 2026, `035abffe`, before B0 | Type-only unless that path is reached with a null snapshot | Leave. Does not block review |
| `src/components/PacketContributionModal.tsx` 397, 405, 1032–1034, 1132–1134 | Preview and `EvidenceSurfaceImage` are not the same type | Photo preview fields used by the contribution modal | Blamed 5 Oct 2026, `83fc9208`, before B0 | Type-only if the runtime objects already carry those fields | Leave for a typed contribution pass. Does not block review |
| `src/contribution/governedDisplayProjection.ts` 325, 343 and `src/contribution/resultContributionActions.ts` 42 | `_publication` is not declared on `Product` | Contribution actions read the publication object | Blamed 3 Oct 2026 and 29 Sep 2026 | Type-only if the runtime product carries `_publication` | Leave. Does not block review |
| `src/contributions/lifecycle.ts` 69, 156, 201 and `src/contributions/submitGovernedEvidence.ts` 117 | `packet_claims` is outside the narrower domain union | Governed evidence domain | Blamed 13 Aug 2026 and 12 Aug 2026 | Type-only | Leave. Does not block review |
| `src/evidenceAuthority/device.ts` 204 | `derivedAssetId` missing on one `SupportCoverage` member | Support-asset lookup | Blamed 28 Sep 2026 | Type-only | Leave. Does not block review |
| `src/identity/workstreamA/loader.ts` 77 | `gtin_brand_links.csv` is not a `WorkstreamAFileName` index | Workstream A CSV load | Blamed 22 Sep 2026 | Type-only | Leave. Does not block review |
| `src/nutrition/governedNutrientAssessment.ts` 203 | Compare with `'unknown'` cannot overlap `'food' \| 'drink'` | Dead comparison in nutrient class handling | Blamed 12 Sep 2026 | No runtime branch if the type is already exhaustive | Leave. Does not block review |

## Unverified and deferred

- Production evidence authority is not deployed at the URL store and preview profiles use.
- The `development` EAS profile expects UAT evidence from the production backend URL.
- Expo Go has the same URL and authority-env mismatch through committed defaults.
- Vercel secret names could not be listed.
- Result acknowledgement after admitted evidence was not exercised. No evidence was submitted.
- The Did You Know scrollbar was not seen on a product that had a Did You Know card.
- Certifications and Packaging suites were not run. The Result surface contract still asserts that Eco-Score, Packaging & Recycling, and Carbon Footprint are not rendered, and that Palm Oil, Pricing, and legacy Allergens stay off.
- Search placeholder truncation, favourite rows without a publication object, share-sheet clipping, and platform alert styling remain deferred presentation notes.

## Corrective package and BC

C-1 to C-4 tests passed at the tested SHA. That is regression evidence, not founder acceptance.

Corrective-package acceptance is open. BC is not recorded. Do not treat `d5a7955b60bf64fbd455d332ae640780279127e1` or `5b33ab92e0713f136e77b8c290fae735dd4cc721` as BC. The return branch was not moved.

## Certifications and Packaging

Excluded from this candidate. They continue in parallel and are not reported as passed. Packet certifications remain inside the existing packet-information group.

## Questions for review

1. Can store and preview profiles be built later while `https://truscoreapi.vercel.app/api/evidence-authority` is `NOT_FOUND`, given they expect `authorityEnv: production`?
2. Should the `development` profile keep expecting `uat` while its backend URL stays on the production default?
3. Are `uat-ios-flag-off` and `uat-ios-flag-on` still intended, with the recall path forced off?
4. Is EAS Update remaining disabled, with no runtime version and no update URL, the intended release posture?
5. Is a clean `tsc --noEmit` a gate for a later build, or do the pre-B0 diagnostics stay outside this review?
6. Please confirm corrective-package acceptance and BC stay open, and that Certifications and Packaging stay excluded.
