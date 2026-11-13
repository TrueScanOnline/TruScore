# SJ-07 — Temporary Vercel HTTPS Share verification

**Date:** 2026-11-12  
**Branch:** `feature/w5-web-product-teaser-v2`  
**HEAD (committed):** `0ce99696bda120808298ce4cc223191865b821be`  
**Working tree:** dirty (SJ-06 AMBER + SJ-07 safety/harness isolation — **not committed**)  
**Test APK:** `android/app/build/outputs/apk/debug/app-debug.apk`  
**Build command:** `gradlew :app:assembleDebug "-Ptruescan.standaloneDebugEmbed=true"`  
**Package:** `com.truescan.foodscanner`  
**Installed signing SHA-256 (apksigner + `pm get-app-links`):**  
`FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C`  
(= Android Debug keystore; digest `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`)

**STOP — no commit / push / merge / production deploy / DNS / store action without founder authorisation.**

---

## 1. SJ-06 remaining checks — PASS

| Check | Result | Evidence |
| --- | --- | --- |
| Source diff reviewed | PASS | Uncommitted: `app/result/[barcode].tsx`, `src/utils/resultProductLoadGuard.ts`, `src/utils/linking.ts` |
| Generation guards on async product-load paths | PASS | `loadProduct` / `handleRefresh` capture `loadGen`; late `setError`/`setLoading`/`setLoadingPhase` gated by `isCurrentLoad()`; `acceptProductUpdate(..., { loadGeneration })` for fetch paths; EA path remains generation-agnostic |
| Late errors cannot replace newer product | PASS | Unit E4-B + catch blocks check `isCurrentLoad()` before applying error/loading |
| A → B → A controlled completion order | PASS | Unit `E4-C` in `resultProductLoadGuard.test.ts` (15/15 PASS) |
| E3 network recovery | PASS | Cadbury → offline → `9999999999999` → wifi on → UI **MARCATEST / Salatgurke**, not Cadbury (`SJ07_E3_RECOVERY3.png`) |
| Extra path segments rejected (not silent Cadbury) | PASS | `normalizeBarcodeDeepLinkPath` returns `barcode/` for extras; device `truescan://barcode/9300617064879/extra/junk` → **Invalid link** / Barcode (missing) (`SJ07_EXTRA_WARM.png`); log `Invalid barcode: ''` |
| Empty barcode = invalid/missing, not verified unknown | PASS | `loadingPhase: 'invalid_input'` UI; device empty link → **Invalid link** (`SJ07_EMPTY_WARM.png`); log `Invalid barcode: ''` |
| Canonical barcode / identity contracts preserved | PASS | Still `/^\d{8,14}$/` + `getPrimaryBarcode`; no new scoring / product-resolution rules |

---

## 2. Test harness isolated from production — PASS

| Risk | Control |
| --- | --- |
| Metro forced off in all builds | **Fixed.** `getUseDeveloperSupport()` = `BuildConfig.DEBUG && !BuildConfig.STANDALONE_DEBUG_EMBED` |
| JS embed always on for debug | **Fixed.** `debuggableVariants = []` only when `-Ptruescan.standaloneDebugEmbed=true` |
| Flag baked into this test APK | `BuildConfig.STANDALONE_DEBUG_EMBED = true` (generated source) |
| Default / release | Property defaults **false**; release has `DEBUG=false` → never Metro; never requires the test flag |
| Dev server address in release | Not introduced; no Metro host embedded by this change |
| Store/EAS | Must **not** pass `-Ptruescan.standaloneDebugEmbed=true` |

**Safeguard doc:** this section + comments in `android/app/build.gradle` and `MainApplication.kt`.

---

## 3. Android App Link association readiness

| Item | Status |
| --- | --- |
| Manifest `autoVerify=true` | Present for `truscoreapi.vercel.app` + UAT, `pathPrefix=/barcode` |
| Live `GET /.well-known/assetlinks.json` | HTTP 200, `Content-Type: application/json`, **no redirect** |
| Live fingerprint | **PLACEHOLDER** `"SHA256_FINGERPRINT"` — cannot verify |
| Candidate (debug only, NOT published) | `SJ03_ASSETLINKS_DEBUG_CANDIDATE.json` with installed debug SHA-256 |
| Recommendation | Prefer a **controlled test host** for debug cert; if production Vercel host must be used, founder must explicitly approve publishing the debug fingerprint (narrow association-file / Vercel env change only) |
| Do not silently publish debug signing | **Observed** — no deploy performed |

---

## 4. Exact signing fingerprint and how verified

1. `apksigner verify --print-certs` on built `app-debug.apk` → SHA-256 digest `fac61745…3b9c`  
2. `adb shell pm get-app-links com.truescan.foodscanner` → Signatures `[FA:C6:17:45:…:3B:9C]`  
3. Matches Android debug keystore (CN=Android Debug)

**Not** an EAS/Play App Signing cert. Play/production fingerprint still required for consumer App Links.

---

## 5. Actual domain verification state — NOT verified

```
truscoreapi.vercel.app: 1024
truscoreapi-uat.vercel.app: 1024
```

`cmd package resolve-activity` for the Cadbury HTTPS URL → `ResolverActivity` (not verified default to Rveel).

Step 4 “prove verified” **blocked** until founder-approved live association file with real fingerprint(s).

---

## 6. Exact-product HTTPS navigation — NOT PASS (blocked)

| Scenario | Result |
| --- | --- |
| Custom scheme Cadbury `truescan://barcode/9300617064879` | **PASS** — Dairy Milk Milk Chocolate (`SJ07_CADBURY_LONG.png`) |
| HTTPS without forcing package | Opens **chooser / Chrome**, not verified App Link → **FAIL vs SJ-07 goal** (expected until association fixed) |
| Forced-package HTTPS | Not used (forbidden success simulation) |

---

## 7. Browser fallback

| Case | Result |
| --- | --- |
| Cadbury HTTPS HTML (curl) | **PASS** — title `Dairy Milk Milk Chocolate · Rveel`; teaser + Open-in-app copy |
| App installed + unverified domain | Browser/chooser path (Chrome observed earlier; resolve → ResolverActivity) |
| Unknown `0000000000017` API | **FAIL (known P0)** — `product-preview` returns unrelated DeWitt / UPCITEMDB identity |
| Zeros / unknown must not show unrelated product in browser | **FAIL on production** until WEB-01A |

---

## 8. Real share-message delivery — NOT TESTED

Emulator packages: Chrome, Messages (service); **no WhatsApp**.  
Recipient WhatsApp / SMS / Email delivery **not executed**.  
Share URL construction remains `https://truscoreapi.vercel.app/barcode/{barcode}` (`DEFAULT_SHARE_WEB_ORIGIN`).  
Clipboard-only copy is **not** treated as recipient proof.

---

## 9. iOS status — NOT TESTED

- Live AASA: `appID` = `TEAM_ID.com.truescan.foodscanner` (**placeholder**)  
- `APPLE_TEAM_ID` not fabricated  
- No signed iOS device build exercised in this SJ  
- Android success does **not** establish iOS success

---

## 10. Production identity hotfix (WEB-01A) readiness

| Item | Status |
| --- | --- |
| Isolated candidate | `backend/vercel/lib/publicShareIdentity.ts` + `product-preview.ts` (worktree) |
| Unit contracts | `publicShareIdentity.contract.test.ts` **PASS** (6) |
| Production alias | Still serves UPCITEMDB-style wrong identity for zeros |
| Visual-preview branch | **Not promoted** |
| Deploy | Requires **separate founder production authorisation**; must not couple to App Link association publish |

---

## 11. Outstanding founder authorisations

1. **Commit** SJ-06/SJ-07 local changes (Result guards, linking reject-extras, invalid_input UI, harness opt-in).  
2. **Publish** real `ANDROID_SHA256_FINGERPRINT` (debug and/or Play) to Vercel env / association file — prefer test host for debug; approve if using `truscoreapi.vercel.app`.  
3. **Supply** real `APPLE_TEAM_ID` for AASA (iOS separate).  
4. **Authorise** isolated WEB-01A production hotfix (identity-only) — do not deploy App Links merely while unsafe identity remains.  
5. After association publish: reset domain verification, re-run Steps 4–6 on device, then real share destinations.

---

## Artefacts

| File | Role |
| --- | --- |
| `SJ07_CADBURY_LONG.png` | Custom-scheme Cadbury Result |
| `SJ07_E3_RECOVERY3.png` | E3 non-Cadbury recovery |
| `SJ07_EMPTY_WARM.png` / `SJ07_EXTRA_WARM.png` | Invalid link UI |
| `SJ07_HTTPS_TOP_ACTIVITY.txt` | HTTPS → Chrome (unverified) |
| `SJ03_ASSETLINKS_DEBUG_CANDIDATE.json` | Debug association candidate (unpublished) |
| `SJ07_GRADLE_BUILD.txt` | Standalone embed rebuild log |

---

## Handover verdict (concise)

1. SJ-06 remaining checks: **PASS**  
2. Test harness isolated from production: **PASS**  
3. Android App Link association readiness: **READY TO PUBLISH (candidate only)** — live file still placeholder  
4. Fingerprint: **FA:C6:17:45:…:3B:9C** via apksigner + `pm get-app-links`  
5. Domain verification: **1024** (not verified)  
6. Exact-product HTTPS → app: **NOT PASS** (blocked on verification)  
7. Browser Cadbury landing HTML: **PASS**; unknown identity on prod: **FAIL (P0)**  
8. Real share delivery: **NOT TESTED**  
9. iOS: **NOT TESTED**  
10. WEB-01A readiness: **READY (undeployed)**  
11. Authorisations: see §11  

**STOP FOR FOUNDER REVIEW.**
