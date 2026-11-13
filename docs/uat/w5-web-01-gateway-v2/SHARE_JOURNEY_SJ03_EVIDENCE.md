# SJ-03 — Share Journey Evidence (Temporary Vercel)

**Date:** 12 Nov 2026 (NZ)  
**Worktree:** `C:\TrueScan-FoodScanner-w5-web-teaser-v2`  
**Stable Share host:** `https://truscoreapi.vercel.app`  
**Release control:** No commit / push / merge / production deploy / production well-known change / DNS / store action.

---

## Functional readiness

**NOT READY for production.**

Acceptance criteria 1–8 are not all evidenced on devices. Local code progress exists; native routing and verified App/Universal Links remain blocked.

---

## A. Native routing results (Package A)

Target scheme: `truescan://barcode/9300617064879`

| Case | Result | Evidence |
|---|---|---|
| App installed on emulator | **FAIL / blocked** | `adb` shows `emulator-5554`; `pm list packages` has **no** `com.truescan.foodscanner` |
| Custom-scheme open attempt | **FAIL** | `adb shell am start … truescan://barcode/9300617064879` → `Error: Activity not started, unable to resolve Intent` (no package) |
| App closed / background / different product / sequential / unknown | **NOT TESTED** | Requires installed signed/debug build |
| Debug APK build | **FAIL** | `assembleDebug` → JVM crash / **ENOSPC** (disk full during compile). Free space later ≈ **3.2 GB** — insufficient for a reliable RN native rebuild without further cleanup |
| iOS custom-scheme | **NOT TESTED** | No macOS/`xcrun`; EAS CLI broken (`eas-cli` module missing) |

**Mandatory result not demonstrated:** exact Result barcode on a native build.

Code path exists: `linking.ts` prefixes + `barcode/:barcode` → Result; `_layout.tsx` gates linking behind onboarding.

---

## B. Image-sharing / link-sharing results (Package B)

### Finding (confirmed in code)

`shareStoryCardImage` voids the caption; Expo Sharing cannot attach text+image reliably. Prior platform path copied URL to clipboard after image share — **clipboard is sender-side only** and does not prove recipient link delivery.

### Local corrective development (worktree, not released)

| Change | Class |
|---|---|
| Prefer **text+HTTPS** for WhatsApp / SMS / Facebook / X / native / moreApps when a story image exists | GREEN share UX |
| Keep image-only (+ clipboard hint) for Instagram / Snapchat / TikTok | GREEN |
| Add labelled **Share Product Link** (`Share.share` message includes `buildShareUrl` HTTPS) | GREEN |
| Relegate **Copy link** to secondary; honest tip copy | GREEN |
| Update `shareDelivery` unit tests | GREEN |

### Channel verification

| Channel | Result |
|---|---|
| WhatsApp text+URL path (unit) | **PASS** (automation) |
| SMS text+URL path (unit) | **PASS** (automation) |
| Share Product Link UI | **NOT TESTED** on device |
| Copy Link | **NOT TESTED** on device |
| Email | **NOT TESTED** |
| Image-only destinations | Documented as link-not-guaranteed |

Published-score-only share semantics: unchanged (`shareScoreSemantics`).

---

## C. Android / iOS association (Package C)

### Local AMBER native config (worktree)

- `app.config.js`: `applinks:truscoreapi.vercel.app` (+ UAT); custom-scheme separated from HTTPS `autoVerify`
- `AndroidManifest.xml`: HTTPS autoVerify for Vercel hosts only; **omits broken `truescan.app`** to avoid Android ≤11 whole-filter failure
- RN `linking.prefixes` already include Vercel hosts

**Native rebuild after these edits: NOT completed** (disk / ENOSPC).

### Android fingerprint (debug keystore only)

From `android/app/debug.keystore` / `androiddebugkey`:

```text
SHA256: FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C
```

Candidate file (local docs only — **not written to production**):  
`SJ03_ASSETLINKS_CANDIDATE_DEBUG.json`

Play App Signing / EAS production fingerprints: **NOT OBTAINED** (EAS CLI broken; do not guess).

### Live production well-known (unchanged — placeholders)

```text
GET https://truscoreapi.vercel.app/.well-known/assetlinks.json
→ sha256_cert_fingerprints: ["SHA256_FINGERPRINT"]

GET https://truscoreapi.vercel.app/.well-known/apple-app-site-association
→ appID: TEAM_ID.com.truescan.foodscanner
```

Content-Type JSON; HTTPS 200. **Verification status: NOT VERIFIED** (placeholders; no `adb dumpsys package domain-verification` on an installed build).

### iOS

| Item | Status |
|---|---|
| Bundle ID | `com.truescan.foodscanner` (config) |
| Apple Team ID | **NOT OBTAINED** — no guess; Vercel env unset |
| Entitlements on signed build | **NOT TESTED** |
| Universal Link recognition | **NOT TESTED** |

### Fallback

Landing HTML includes `Already have Rveel? Open this product` → `truescan://barcode/{id}` — **PASS** (HTTP). Device open **NOT TESTED**.

---

## D. Identity-hotfix readiness (Package D)

| Item | Status |
|---|---|
| Prod UPCITEMDB defect still live | **FAIL** on prod (`0000000000000` → tortilla chips; `0000000000017` → pond liner — prior cohort) |
| WEB-01A worktree candidate | Ready: OFF-only + code match; unit tests PASS |
| Visual WEB-01 promote as identity fix | **Forbidden** — not done |
| Production promote | **Not authorised** — not done |
| Cadbury prod landing | **PASS** identity; no score leak in HTML sample |

---

## E. Physical-device test matrix (Package E)

| ID | Method | Barcode | Installed? | Destination | Final barcode / identity | Result |
|---|---|---|---|---|---|---|
| A1 | Custom scheme | 9300617064879 | No app on emulator | — | — | **FAIL** (no package) |
| A2–A6 | Scheme matrix | various | — | — | — | **NOT TESTED** |
| B1 | WhatsApp | — | — | — | — | **NOT TESTED** (unit PASS path) |
| B2 | SMS | — | — | — | — | **NOT TESTED** (unit PASS path) |
| B3 | Email | — | — | — | — | **NOT TESTED** |
| B4 | Copy Link | — | — | — | — | **NOT TESTED** |
| B5 | Share Product Link | — | — | — | — | **NOT TESTED** |
| C1 | HTTPS App Link Android | — | — | — | — | **NOT TESTED** / blocked |
| C2 | HTTPS Universal Link iOS | — | — | — | — | **NOT TESTED** / blocked |
| C3 | No app → Cadbury web | N/A | No | Vercel landing | Cadbury | **PASS** (HTTP) |
| C4 | No app → zeros web | N/A | No | Vercel landing | Wrong product | **FAIL** |
| C5 | Open in Rveel CTA | Cadbury | — | custom scheme | — | HTML **PASS**; open **NOT TESTED** |

---

## F. Remaining blockers + smallest recommended corrections

1. **Free disk (≥15–20 GB)** and rebuild/install a debug or EAS preview APK; re-run Package A scheme matrix.  
2. Founder supplies **Apple Team ID** + **Play/EAS SHA-256**; set Vercel env; update live assetlinks/AASA (**separate approval** — not done).  
3. After rebuild with local AMBER association config, run `adb dumpsys package d` / iOS Associated Domains diagnostics — record VERIFIED only from OS.  
4. Authorise **identity-only** WEB-01A production hotfix (separate decision).  
5. Repair/reinstall **EAS CLI**; run physical Package E on Android + iPhone.  

Smallest path to a demonstrable interim journey: (1) installable Android debug build + custom-scheme PASS, (2) Share Product Link / WhatsApp text URL PASS on device, (3) web Cadbury PASS + zeros fixed via identity hotfix, (4) App Links after credentials.

---

## G. File-by-file GREEN / AMBER / RED

| File | Class | Notes |
|---|---|---|
| `src/utils/shareUrl.ts` | GREEN | Already Vercel stable host |
| `src/features/sharing/services/ShareService.ts` | GREEN | Text-first vs image-first |
| `src/components/ShareModal.tsx` | GREEN | Share Product Link |
| `src/i18n/locales/en.json` | GREEN | Honest copy |
| `src/__tests__/unit/features/sharing/shareDelivery.test.ts` | GREEN | Matches new behaviour |
| `src/utils/linking.ts` | GREEN | Comment clarity |
| `app.config.js` | **AMBER** | Temporary Vercel Associated Domains / intentFilters |
| `android/app/src/main/AndroidManifest.xml` | **AMBER** | Same; omit broken host from autoVerify |
| `backend/vercel/api/product-preview.ts` + `publicShareIdentity.ts` | **AMBER** | WEB-01A candidate — not promoted |
| Scoring / Evidence Authority / publication | — | **Unchanged** |
| Production `.well-known` / DNS / store | RED if changed now | **Not changed** |

---

## STOP

Awaiting founder / ChatGPT review before any production action, credential injection into live well-known files, commit, or store release.
