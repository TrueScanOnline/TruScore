# Share Journey — Temporary Vercel Functional Handover

**Date:** 12 Nov 2026 (NZ)  
**Worktree:** `C:\TrueScan-FoodScanner-w5-web-teaser-v2`  
**Branch:** `feature/w5-web-product-teaser-v2`  
**Committed HEAD:** `0ce99696bda120808298ce4cc223191865b821be`  
**Founder scope:** Temporary public share host = **`https://truscoreapi.vercel.app`**. Permanent domain deferred.  
**Release control:** No push / merge / production deploy / DNS / store action without founder authorisation.

---

## Functional readiness statement

**The SHARE journey is NOT functionally ready for production release.**

| Gate | Status |
|---|---|
| A — Share card emits stable Vercel product URL | **PASS** (code + unit tests) |
| B — Verified App/Universal Links on Vercel host | **FAIL / BLOCKED** (associations prepared locally; credentials missing; device unproven) |
| B — Custom-scheme Open in Rveel fallback | **PASS** (landing HTML present; device open **NOT TESTED**) |
| C — Landing identity (Cadbury) | **PASS** on prod Vercel |
| C — Landing identity (unknown / zeros) | **FAIL** on prod (UPCITEMDB); WEB-01A candidate ready, **not deployed** |
| D — Real WhatsApp/SMS/email/device share matrix | **NOT TESTED** |

---

## 1. Share journey architecture (call-path)

```text
Result screen SHARE (app/result/[barcode].tsx)
  → setShareType + ShareModal visible
  → ShareModal
       • copyLinkUrl = buildShareUrl(barcode, { context, source:'copy', utm… })
       • ShareContentBuilder.buildContent → url = buildShareUrl(…)
       • ShareService.share(platform)
            ├ WhatsApp / SMS / … handlers (message includes url)
            ├ native / moreApps Share.share({ message, url })
            ├ story image: shareStoryCardImage + caption with URL;
            │              Clipboard.setStringAsync(url) when image path used
            └ copy link: Clipboard.setStringAsync(copyLinkUrl)
  → HTTPS: https://truscoreapi.vercel.app/barcode/{barcode}?ctx&src&utm_*
       │
       ├ OS verified App/Universal Link (desired)
       │    → React Navigation linking prefixes include vercel hosts
       │    → Main / Scan / Result `barcode/:barcode`
       │    → existing Result screen resolves that barcode
       │
       └ Browser (app absent or unverified)
            → api/barcode/[barcode].ts
            → /api/product-preview?barcode=
            → renderShareLandingHtml
                 • product teaser (no scores)
                 • “Already have Rveel? Open this product” → truescan://barcode/{id}
                 • Android intent:// fallback in page script
                 • store CTAs (prod currently shows Play/App Store chrome;
                   worktree V5 uses coming-soon placeholders — visual freeze on founder-reviewed design)
```

**Deep-link routing notes**

- `app/_layout.tsx`: NavigationContainer `linking` enabled only after onboarding complete.
- Cold start: `Linking.getInitialURL` + RN linking config.
- Warm start: RN linking + `Linking.addEventListener` (attribution via `storeInboundShareAttribution`).
- **Gap:** If onboarding incomplete, inbound barcode is not retained for post-onboarding resume (**NOT TESTED** / known risk).
- Custom scheme `truescan://barcode/{id}` registered independently of HTTPS verification.

---

## 2. Exact Share URL produced by the running app

| Build profile (`eas.json`) | `EXPO_PUBLIC_SHARE_WEB_ORIGIN` |
|---|---|
| production / production-apk / preview / preview-apk | `https://truscoreapi.vercel.app` |
| development / uat-dynamic-signals-* | `https://truscoreapi-uat.vercel.app` |

Worktree default (`src/utils/shareUrl.ts`):

```text
DEFAULT_SHARE_WEB_ORIGIN = https://truscoreapi.vercel.app
```

Example emitted URLs:

```text
https://truscoreapi.vercel.app/barcode/9300617064879
https://truscoreapi.vercel.app/barcode/9300617064879?ctx=truScore&src=whatsapp&utm_source=app&utm_medium=share&utm_campaign=truScore
https://truscoreapi.vercel.app/barcode/0000000000000
```

Card label: `truscoreapi.vercel.app/barcode/{barcode}` via `formatShareLinkLabel`.

**No unique Vercel preview deployment URL** is used by `buildShareUrl`.

Barcode preservation: path uses `encodeURIComponent(barcode)`; parsers accept `\d{8,14}` only.

### Package A findings

| Check | Result |
|---|---|
| All ShareContentBuilder contexts call `buildShareUrl(product.barcode, …)` | PASS (code) |
| Copy link uses same builder | PASS |
| Image share attempts caption + clipboard URL | PASS (code); channel delivery **NOT TESTED** |
| Preview deployment URLs in share | PASS (not used) |
| Score share semantics Rated/NR/Checking distinct | PASS (existing unit tests) |

---

## 3. Platform-specific app-link findings (Package B)

### Mismatch (before local correction)

| Layer | Host |
|---|---|
| Share URL / eas bake | `truscoreapi.vercel.app` |
| iOS `associatedDomains` (committed) | `truescan.app` only |
| Android `autoVerify` https (committed) | `truescan.app` only |
| RN `linking.prefixes` | already includes vercel + truescan.app |
| AASA / assetlinks on vercel.app | served, but **placeholder** Team ID / SHA-256 |

Verified HTTPS handoff to the app for shared Vercel URLs **cannot succeed** on committed native config.

### Smallest practical temporary-Vercel solution (prepared locally — not released)

**Class: AMBER** (native association / intent-filter structure)

Local worktree edits (awaiting founder approval to commit/build):

1. `app.config.js` — Associated Domains + Android intentFilters for:
   - `truscoreapi.vercel.app`
   - `truscoreapi-uat.vercel.app`
   - retain `truescan.app` for future migration
2. Split custom-scheme vs HTTPS `autoVerify` filters (avoids mixing schemes in one verified filter).
3. `android/app/src/main/AndroidManifest.xml` — mirror those hosts.

**Still required before verified links work:**

| Credential | Status |
|---|---|
| `APPLE_TEAM_ID` in Vercel env | **NOT SET** — do not guess |
| `ANDROID_SHA256_FINGERPRINT` (Play App Signing + test certs) | **NOT SET** — do not guess |
| New signed iOS/Android builds after association change | **NOT BUILT** |
| Physical UL / App Link proof | **NOT TESTED** |

Until credentials + signed builds exist, **rely on explicit Open in Rveel** (`truescan://barcode/{barcode}`), which the landing page already exposes.

### Navigation behaviour expectations (code-level)

| Scenario | Expected mechanism | Device proof |
|---|---|---|
| App closed + verified https | RN linking → Result | NOT TESTED |
| App background / open | Linking event → Result | NOT TESTED |
| Different product on screen | New barcode param → new Result | NOT TESTED |
| Two sequential shares | Successive navigations | NOT TESTED |
| Unknown barcode | Existing unknown Result UX | NOT TESTED |
| Invalid barcode | Parser rejects non `\d{8,14}` | unit / code only |
| Open in Rveel CTA | Custom scheme | Landing HTML PASS; open **NOT TESTED** |

Scoring / Rateability / Evidence Authority / product-selection rules: **not modified**.

---

## 4. Vercel landing page (Package C)

| Requirement | Prod `truscoreapi.vercel.app` | Notes |
|---|---|---|
| Receives barcode from path | PASS | |
| Cadbury identity | PASS | Dairy Milk / Cadbury / OFF image |
| No unrelated fallback | **FAIL** for zeros / some OFF-miss codes | UPCITEMDB |
| Teaser / no scores | PASS on Cadbury sample | no `/100`, no Rveel Score |
| Open in Rveel | PASS in HTML | `Already have Rveel? Open this product` → `truescan://barcode/…` |
| Store availability | Prod shows Play/App Store chrome | Worktree V5 uses coming-soon; **do not promote visual branch to fix identity** |
| Social OG | Identity title/image; scores null | Zeros OG wrong until identity hotfix |

### Isolated identity hotfix readiness (WEB-01A)

| Item | Status |
|---|---|
| Root cause | OFF miss → UPCITEMDB junk (also `0000000000017` → pond liner) |
| Candidate files | `product-preview.ts` + `publicShareIdentity.ts` + contract test |
| Preview proof | Prior WEB-01A previews return **404** for zeros / `0000000000017` |
| Unit tests | PASS |
| Doctrine | **AMBER** (public identity authority) — previously bounded |
| Deploy | **NOT AUTHORISED — not deployed** |
| Visual branch promote | **Forbidden** as the identity vehicle |

Diff artefact: `IDENTITY_FIX_DIFF_VS_HEAD.patch.txt`

---

## 5. Real-world sharing tests (Package D)

| Channel / case | Result | Evidence |
|---|---|---|
| WhatsApp | **NOT TESTED** | — |
| SMS | **NOT TESTED** | — |
| Email | **NOT TESTED** | — |
| Copy Link | **NOT TESTED** on device (code PATH PASS) | ShareModal → Clipboard |
| Android native share sheet | **NOT TESTED** | — |
| iOS native share sheet | **NOT TESTED** | — |
| Android App Link https Vercel | **NOT TESTED** / blocked | credentials + rebuild |
| iOS Universal Link https Vercel | **NOT TESTED** / blocked | credentials + rebuild |
| Recipient no app → Cadbury landing | **PASS** (HTTP) | live prod HTML |
| Recipient no app → zeros landing | **FAIL** | wrong product on prod |
| Emulator present | `emulator-5554` | not used as App Link proof |

Automation-only (labelled): `buildShareUrl` + WEB-01A + publicWebShare unit suites PASS.

---

## 6. Future domain migration note (Package E)

Current product URLs are path-stable:

```text
https://{host}/barcode/{barcode}
```

When a permanent Rveel domain is ready, support the same `/barcode/{barcode}` path and 301/alias from the temporary Vercel host (or dual-host associations). Query params (`ctx`, `src`, utm) are attribution-only and must not change product selection.

**No DNS, domain attachment, or permanent hosting work in this package.**

---

## 7. Explicit change list (Wave 5 classification)

| Change | Location | Class | Status |
|---|---|---|---|
| Temporary share origin already `truscoreapi.vercel.app` | `shareUrl.ts`, `eas.json` | GREEN (ops alignment) | In HEAD |
| Add Vercel hosts to Associated Domains / intentFilters; split scheme filters | `app.config.js`, `AndroidManifest.xml` | **AMBER** | **Local worktree only** — awaiting approval |
| WEB-01A remove public UPCITEMDB + OFF code match | `product-preview.ts`, `publicShareIdentity.ts` | **AMBER** | Worktree candidate — **no prod deploy** |
| Visual landing / CSS V5 deltas | `shareLandingHtml.ts`, `rveel.css`, fonts | GREEN visual (frozen) | Worktree; **not** identity hotfix vehicle |
| Scoring / publication / Evidence Authority | — | — | **Unchanged** |
| Permanent domain / DNS | — | RED ops if done now | **Deferred — not done** |

---

## 8. Remaining functional gaps

1. Production public identity still wrong for OFF-miss barcodes (UPCITEMDB).  
2. Verified App/Universal Links for Vercel host need: founder-approved native config commit → real Team ID + SHA-256 in Vercel env → signed rebuilds → physical tests.  
3. Onboarding may drop pending deep-link barcode (resume gap).  
4. Full channel matrix unrun.  
5. Image-only shares on platforms that strip captions may lose the link (clipboard best-effort only) — channel **NOT TESTED**.

---

## STOP

Awaiting founder / ChatGPT approval for:

1. Commit + EAS rebuild with temporary-Vercel association config (AMBER).  
2. Supply/inject verified `APPLE_TEAM_ID` + `ANDROID_SHA256_FINGERPRINT`.  
3. Isolated identity-only production hotfix (WEB-01A) — separate authorisation.  
4. Physical-device Package D campaign.

No push, merge, production deployment, DNS change, or store action performed.
