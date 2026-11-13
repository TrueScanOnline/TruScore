# SJ-04 — Exact-product Share navigation evidence

**Date:** 12 Nov 2026 (NZ)  
**Worktree:** `C:\TrueScan-FoodScanner-w5-web-teaser-v2`  
**Branch:** `feature/w5-web-product-teaser-v2`  
**Source SHA (HEAD):** `0ce99696bda120808298ce4cc223191865b821be`  
**Working tree:** dirty (Share / linking / Result presentation fix / WEB-01A prep — **not committed**)  
**Release control:** No commit / push / merge / production deploy / DNS / store / production `.well-known` without founder approval.  
**Share journey complete?** **NO** — HTTPS App Links + post-fix contamination retest remain open.

---

## Handover answers (required)

| # | Question | Result |
|---|---|---|
| 1 | Standalone APK starts without Metro? | **PASS** |
| 2 | Cadbury custom-scheme → actual Product Result? | **PASS** |
| 3 | Cold / warm / sequential barcodes? | **PASS / PASS / PASS** |
| 4 | Unknown barcode fails safely? | **PASS** |
| 5 | Previous-product contamination prevented? | **FAIL** pre-fix (offline miss); fix landed locally; **post-fix retest NOT TESTED** (emulator ANR) |
| 6 | Share Product Link preserves exact barcode? | **PASS** (builder + Share Product Link code) |
| 7 | HTTPS App Link tests blocked? | Yes — domain state `1024`, live assetlinks placeholder, Apple Team ID unset |
| 8 | Changes + Wave 5 class? | See §Changes |

---

## Phase 1 — Standalone APK (Metro eliminated)

| Item | Value |
|---|---|
| Approach | `npx expo run:android --variant debug` with `debuggableVariants = []` in `android/app/build.gradle` so debug embeds JS (release assemble previously hit ENOSPC) |
| Package / applicationId | `com.truescan.foodscanner` |
| versionName / versionCode | `10.0.0` / `37` |
| APK (pre-fix proof) | `android/app/build/outputs/apk/debug/app-debug.apk` (~86 MB, mtime 13:13) |
| Embedded bundle | **YES** — `assets/index.android.bundle` (~5.4 MB) |
| Metro on `:8081` during proof | **FREE** |
| Install / launch | **PASS** — after cold SoLoader ANR, “Wait” → onboarding → legal → Scan home |
| Rebuild after Result fix | **BUILD SUCCESSFUL** (~12m53s); APK ~145 MB; reinstalled; post-rebuild emulator became ANR-unstable |

**ANR note (not a routing FAIL):** Cold start ANRs during `SoLoader` / New Architecture init on emulator. Tapping **Wait** allowed JS to run. Traces: `SJ04_ANR_anr_2026-11-12-13-16-10-886.txt`.

Evidence: `SJ04_BOOT_AFTER_WAIT.png`, `SJ04_READY_HOME.png`.

---

## Phase 2 — Custom-scheme Cadbury Result

Command:

```text
adb shell am start -W -a android.intent.action.VIEW -c android.intent.category.BROWSABLE -d "truescan://barcode/9300617064879"
```

| Check | Result | Evidence |
|---|---|---|
| Intent → MainActivity (no forced package) | **PASS** | `Status: ok`; delivered to running instance |
| Loading UI | **PASS** | `SJ04_CADBURY_SCHEME.png` |
| Product Result Cadbury Dairy Milk | **PASS** | `SJ04_CADBURY_RESULT.png` + UI: `CADBURY` / `Dairy Milk Milk Chocolate` / score 23 |
| Log barcode | **PASS** | `ReactNativeJS` `fetch_complete` / `barcode: 9300617064879` |

**Do not count Metro-dependent earlier runs as routing PASS.**

---

## Phase 3 — Integrity matrix

| Test | Case | Result | Evidence |
|---|---|---|---|
| A | Cold start Cadbury | **PASS** | `SJ04_TEST_A_COLD.png` (after long fetch) |
| B | Warm: Nutella → Cadbury | **PASS** | `SJ04_TEST_B_OTHER.png` → `SJ04_TEST_B_WARM_CADBURY.png` |
| C | Sequential: Cadbury → Nutella `3017620422003` | **PASS** | `SJ04_TEST_C_SECOND.png` — FERRERO / Nutella, not Cadbury |
| D | Unknown `0000000000000` | **PASS** | `SJ04_TEST_D_UNKNOWN.png` — Unknown Product + exact barcode |
| E | Retrieval failure / no contamination | **PARTIAL / FAIL** | See below |
| F | Malformed `NOT_A_BARCODE` | **PASS** | `SJ04_TEST_F_BAD.png` — Unknown Product + `Barcode: NOT_A_BARCODE` |
| F′ | Empty `truescan://barcode/` | **PARTIAL** | Did not replace UI with a governed failure; prior product remained (`SJ04_TEST_F_EMPTY.png`). Path may not match `barcode/:barcode`. |

### Test E detail

| Subcase | Result | Notes |
|---|---|---|
| E1 Offline after Cadbury → Nutella (cached) | **PASS** (no Cadbury contamination) | Showed Nutella from cache — `SJ04_TEST_E_OFFLINE.png` |
| E2 Offline Cadbury → uncached `9999999999999` | **FAIL** | Cadbury Result remained — `SJ04_TEST_E2_OFFLINE_MISS.png`. Failure class **6 / stale presentation**: navigation barcode changed; product state not cleared; `retrieval_error` kept prior product visible. |

---

## Phase 4 — Routing diagnosis + fix

**Diagnosis:** Android dispatched URL; RN linking updated Result `barcode` params; fetch failed offline; **UI still bound to previous `product`**.

**Fix (local, uncommitted):** In `app/result/[barcode].tsx` barcode-change effect, clear presentation state:

- `setProduct(null)` / `setProgressiveProduct(null)` / `setTruScore(null)`
- `setError(null)` / `setLoading(true)` / `setLoadingPhase('initializing')`

Same-barcode settled preserve (`resultPublicationLoadGuard`) intentionally unchanged.

**Wave 5 class:** **GREEN** (Result presentation / navigation state only; no scoring, publication, Evidence Authority, or identity-rule change).

**Post-fix device proof:** **NOT TESTED** — after rebuild/reinstall, emulator ANR / launcher capture / intent timeout blocked a clean E2 re-run (`SJ04_FIX_CADBURY.png` = home settings; splash hang on recover). Fix is in source + embedded in rebuilt APK; founder should treat contamination as **open until re-proven**.

---

## Phase 5 — Share Product Link

| Item | Result |
|---|---|
| Origin | `https://truscoreapi.vercel.app` (`DEFAULT_SHARE_WEB_ORIGIN`) |
| URL shape | `https://truscoreapi.vercel.app/barcode/{barcode}` |
| Share Product Link | `ShareModal.handleShareProductLink` → native `Share.share` with HTTPS in message (not clipboard-as-delivery) |
| Card label barcode | `formatShareLinkLabel(barcode)` same barcode |
| Unit | `buildShareUrl` base URL **PASS**; one query-param `startsWith` assertion **FAIL** (likely param ordering / env); `shareDelivery` **PASS** |
| Physical WhatsApp/SMS | **NOT TESTED** |

---

## Phase 6 — HTTPS App Link readiness (separate facts)

| Fact | Status |
|---|---|
| Native custom-scheme routing | **PASS** (this SJ) |
| Android domain verification | **FAIL / blocked** — `pm get-app-links`: `truscoreapi.vercel.app: 1024`, `truscoreapi-uat.vercel.app: 1024` (**1024 ≠ verified**) |
| Debug signing SHA-256 | `FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C` |
| Live Digital Asset Links | Placeholder / not matching production promotion — candidate only (`SJ03_ASSETLINKS_DEBUG_CANDIDATE.json`) |
| iOS Universal Links | **NOT TESTED** — Apple Team ID unset; no signed iOS build in this SJ |
| Real share-app delivery of HTTPS | **NOT TESTED** |

**Do not promote production `.well-known` without separate founder approval.**

---

## Phase 7 — WEB-01A identity hotfix (isolated)

| Item | Status |
|---|---|
| Package | Local only: `backend/vercel/lib/publicShareIdentity.ts` + `product-preview.ts` OFF-only / match guards |
| Deploy | **NOT DONE** — awaits founder approval |
| Unrelated native/web redesign | Not mixed into a deploy package |

---

## Changes made this SJ (classification)

| Change | Doctrine |
|---|---|
| `android/app/build.gradle` — `debuggableVariants = []` (local embedded-JS test APK) | **GREEN** local test tooling (do not ship as production policy without review) |
| `app/result/[barcode].tsx` — clear product on barcode change | **GREEN** presentation / anti-contamination |
| Prior uncommitted Share Product Link / ShareService text-first / `linking` Vercel hosts / manifest autoVerify hosts | **GREEN** (Share UX + association *prep*); production `.well-known` still **RED** without approval |
| WEB-01A `publicShareIdentity` / preview OFF-only | Isolated corrective package — **deploy RED** until founder approval |

---

## Screenshot index (key)

- `SJ04_BOOT_AFTER_WAIT.png` — standalone onboarding without Metro  
- `SJ04_CADBURY_RESULT.png` — Cadbury Product Result via `truescan://barcode/9300617064879`  
- `SJ04_TEST_A_COLD.png` / `SJ04_TEST_B_*.png` / `SJ04_TEST_C_SECOND.png` / `SJ04_TEST_D_UNKNOWN.png`  
- `SJ04_TEST_E2_OFFLINE_MISS.png` — contamination FAIL before fix  
- `SJ04_TEST_F_BAD.png` — malformed safe unknown  

---

## STOP

Awaiting founder / ChatGPT review. No commit, push, merge, production deployment, DNS, or store action performed.
