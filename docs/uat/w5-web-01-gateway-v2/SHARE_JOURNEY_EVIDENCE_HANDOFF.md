# Rveel Share Journey — Evidence Handoff (STOP for founder review)

**Date:** 11 Nov 2026 (NZ)  
**Worktree:** `C:\TrueScan-FoodScanner-w5-web-teaser-v2`  
**Doctrine:** `design/wave5/plan/Rveel_Wave_5_Architectural_Doctrine_and_Protected_Invariants_v0_3.md`  
**Visual design:** FROZEN (no redesign in this package)  
**Release control:** No commit / push / merge / production promote / domain migration / store release without founder approval.

---

## Executive verdict

The share **code path exists** and the **approved landing page works on Vercel** for known Cadbury.  
The **real end-to-end journey is not launch-ready** because of three launch blockers:

1. **Canonical domain mismatch (FOUNDER DECISION REQUIRED — AMBER/RED ops).**  
   App shares go to `https://truscoreapi.vercel.app/barcode/{barcode}`.  
   OS Universal Links / App Links are only associated with `truescan.app`.  
   `https://truescan.app` currently **fails TLS** from this environment.

2. **Production public identity still wrong for all-zero fixture (CRITICAL).**  
   Live production `truscoreapi.vercel.app` returns **ORGANIC BLUE CORN TORTILLA CHIPS** for `0000000000000` (non-OFF image).  
   Latest worktree / preview with WEB-01A correctly returns **404 / unknown**.  
   Production alias has **not** been promoted to that fix.

3. **Physical-device Universal/App Link proof: NOT TESTED in this session.**  
   Expo Go cannot prove this. Signed iOS/Android builds on physical devices are required.

**Completion criteria not met:** “A real share from the app, when opened by a second person’s phone, reaches the exact barcode…” has **not** been demonstrated on physical devices in this package.

---

## Phase 1 — Journey map (as implemented)

```text
Result SHARE control
  → ShareModal (shareType)
  → ShareContentBuilder.buildContent
  → buildShareUrl(barcode)  [src/utils/shareUrl.ts]
  → native share sheet / WhatsApp / SMS / copy / image card
       │
       ▼
  HTTPS URL (current default):
  https://truscoreapi.vercel.app/barcode/{barcode}?ctx=&src=&utm_*
       │
       ├─ If OS verified App/Universal Link matches host ──► native app
       │     React Navigation linking → Main/Scan/Result
       │     resolve exact barcode in existing Result screen
       │
       └─ Else browser ──► backend/vercel/api/barcode/[barcode].ts
             → /api/product-preview (OFF-only in worktree)
             → renderShareLandingHtml (no scores)
```

| Component | File(s) | Status |
|---|---|---|
| SHARE UI on Result | `app/result/[barcode].tsx` | Works (code) |
| Share modal / delivery | `src/components/ShareModal.tsx`, `src/features/sharing/**` | Works (code / unit tests) |
| URL builder | `src/utils/shareUrl.ts` → default `truscoreapi.vercel.app` | Works; **domain interim** |
| Score share semantics | `src/utils/shareScoreSemantics.ts` | Works (Rated / NR / Checking distinct) |
| RN linking prefixes | `src/utils/linking.ts` | Includes truescan.app **and** vercel hosts |
| iOS associatedDomains | `app.config.js` | **`applinks:truescan.app` only** |
| Android intentFilters | `app.config.js` + `android/.../AndroidManifest.xml` | **`https://truescan.app/barcode` only** |
| AASA / assetlinks | `backend/vercel/api/well-known-deep-links.ts` via vercel rewrites | Served on Vercel; **placeholders** `TEAM_ID` / `SHA256_FINGERPRINT` on live prod |
| Web landing | `backend/vercel/api/barcode/[barcode].ts`, `shareLandingHtml.ts` | Cadbury OK on prod; zeros **wrong on prod** |
| Public identity gate | `publicShareIdentity.ts` + `product-preview.ts` (WEB-01A) | Correct in **worktree/preview**; **not** on prod alias |

---

## Phase 2 — Canonical URL decision / status

### Intended (founder brief)
`https://truescan.app/barcode/9300617064879`

### Observed in code + live network

| Check | Result | Evidence |
|---|---|---|
| `buildShareUrl` default | `https://truscoreapi.vercel.app/barcode/{id}` | `shareUrl.ts` L11–L63; `eas.json` bakes same |
| `truescan.app` HTTPS | **TLS failure** | Probe 11 Nov 2026: trust relationship could not be established |
| `truscoreapi.vercel.app/barcode/9300617064879` | **200**, Cadbury Dairy Milk | Live HTML title + product-preview JSON |
| Vercel preview URLs in shares | **Not** used by builder | Correct; previews are deploy artefacts only |

**Rules compliance of builder (when host is correct):**

- Exact barcode in path — YES  
- Query params optional (`ctx`, `src`, utm) — do not change barcode — YES  
- No personal data in URL — YES  
- No Vercel preview URLs in share builder — YES  
- Does **not** freeze score in URL — YES  

### FOUNDER DECISION REQUIRED (do not silently change)

**Option A — Make `truescan.app` real**  
Fix TLS/DNS, point domain at the approved Vercel project, serve AASA + assetlinks with real Team ID + SHA-256 fingerprints, keep associatedDomains as today, switch `EXPO_PUBLIC_SHARE_WEB_ORIGIN` to `https://truescan.app`.

**Option B — Temporary verified host = Vercel**  
Add `truscoreapi.vercel.app` (and UAT if needed) to iOS associatedDomains + Android intentFilters + AASA/assetlinks host, keep share origin on Vercel until `truescan.app` is healthy. **This is AMBER (native association / ops) — needs founder approval.**

**This agent did not change the canonical domain.**

---

## Phases 3–4 — Installed app vs not installed

### iOS Universal Links

| Item | Status |
|---|---|
| Bundle ID | `com.truescan.foodscanner` (config) |
| Associated Domains | `applinks:truescan.app` only |
| AASA on vercel.app | 200 JSON but `appID: TEAM_ID.com.truescan.foodscanner` (**placeholder**) |
| AASA on truescan.app | **Unreachable (TLS)** |
| Cold/warm physical device | **NOT TESTED** |

### Android App Links

| Item | Status |
|---|---|
| Package | `com.truescan.foodscanner` |
| Intent filter host | `truescan.app` only (`autoVerify: true`) |
| assetlinks on vercel.app | 200 but fingerprint `SHA256_FINGERPRINT` (**placeholder**) |
| assetlinks on truescan.app | **Unreachable (TLS)** |
| Combined custom-scheme + https in one intent-filter | Present — review risk of unexpected matches |
| Physical device verification | **NOT TESTED** |

### Web when app does not open

| Case | Prod `truscoreapi.vercel.app` | Latest preview (WEB-01A) |
|---|---|---|
| Cadbury `9300617064879` | Correct Cadbury identity; **no score leak** in HTML sample | Same family (approved visual on preview) |
| Zeros `0000000000000` | **WRONG product** (tortilla chips + non-OFF image) | **Unknown** (“Shared product”) — correct fail-closed |
| Deep link mention | `truescan://barcode/...` present; no auto-launch required by design | Same |
| Store CTAs | Coming-soon placeholders | Same |

**Note:** Production alias identity bug for zeros is consistent with a **pre–WEB-01A** path (UPCITEMDB-style image host). Worktree explicitly forbids UPCITEMDB on the public route. Promoting that code is a **founder-approved production action**, not done here.

---

## Phase 5 — Web vs app identity consistency

| Barcode | Web (prod) | Web (latest preview) | OFF | App (this session) |
|---|---|---|---|---|
| `9300617064879` | Cadbury Dairy Milk Milk Chocolate | Expected Cadbury | Match expected | **NOT TESTED on device** |
| `0000000000000` | **WRONG chips identity** | Unknown / 404 preview | OFF `status=0` | **NOT TESTED on device** |
| `9999999999994` | OFF product returned (code match) | — | Has OFF record | **NOT TESTED** |

**Policy:** Do not “pick the prettier source.” Public web must stay OFF-exact (WEB-01A). App may use additional sources — conflicts must be reported, not papered over in the web UI.

---

## Phase 6 — Share card / message / metadata

| Check | Status | Evidence |
|---|---|---|
| All caption URLs via `buildShareUrl` | YES (code) | `ShareContentBuilder.ts` |
| Clickable HTTPS link in captions | YES (code) | Same |
| Rated / NR / Checking copy distinct | YES (unit tests + code) | `shareScoreSemantics.ts`, Wave 5 tests |
| Public landing remains non-scoring | YES on Cadbury sample | Live HTML: no `/100`, no Rveel Score band |
| OG / social unfurl accuracy | Partial — Cadbury OK; **zeros OG would be wrong on prod** | Live zeros title wrong |
| Image-only share without URL | Risk if a channel strips caption — **NOT channel-tested** | — |

---

## Phase 7 — Mandatory test matrix

Legend: **PASS** / **FAIL** / **NOT TESTED** / **BLOCKED**

### Automation / live HTTP (this session)

| ID | Case | Result | Evidence |
|---|---|---|---|
| W1 | Cadbury landing prod | PASS | 200, Cadbury title, no score leak |
| W2 | Zeros landing prod | **FAIL** | Wrong product title/image |
| W3 | Zeros landing latest preview | PASS | Unknown / Shared product |
| W4 | AASA on vercel | BLOCKED | Placeholder TEAM_ID |
| W5 | assetlinks on vercel | BLOCKED | Placeholder fingerprint |
| W6 | truescan.app any path | **FAIL** | TLS |
| W7 | OFF zeros | PASS (not found) | `status=0` |
| U1 | Unit: publicWebShare / identity / share URL | PASS | Jest suites in repo |

### Physical devices (required by brief)

| ID | Case | Result |
|---|---|---|
| D1 | iPhone — app installed, cold | **NOT TESTED** |
| D2 | iPhone — app installed, warm | **NOT TESTED** |
| D3 | iPhone — app not installed → web | **NOT TESTED** |
| D4 | Android — app installed, cold | **NOT TESTED** |
| D5 | Android — app installed, warm | **NOT TESTED** |
| D6 | Android — app not installed → web | **NOT TESTED** |
| D7 | In-app browser / no handoff + Open in Rveel | **NOT TESTED** |
| D8 | Onboarding interrupt + resume | **NOT TESTED** |
| D9 | Repeated taps same product | **NOT TESTED** |
| D10 | Two successive different products | **NOT TESTED** |
| C1–C5 | WhatsApp / SMS / iMessage / email / copy | **NOT TESTED** |

**Label:** All device/channel rows above are **NOT TESTED** in this session. Do not treat unit tests or Vercel previews as device proof.

---

## Phase 8 — Legal / publication-risk audit (recommendations only)

| # | Finding | Severity | Doctrine class | Recommendation |
|---|---|---|---|---|
| 1 | Prod zeros barcode shows unrelated branded product/image | **CRITICAL** | Identity / fail-closed | Promote WEB-01A public preview path to production **after founder approval**; re-test zeros |
| 2 | Share host ≠ App Link host; truescan.app TLS down | **CRITICAL** | Ops / deep link | Founder chooses Option A or B above |
| 3 | AASA/assetlinks placeholders on live host | **HIGH** | Deep link verification | Set `APPLE_TEAM_ID` + real SHA-256 fingerprint(s) for distribution certs |
| 4 | NR/Checking share copy vs landing non-score | OK in code | INV fail-closed | Keep; verify on device copy paths |
| 5 | Score in app share card vs public web | By design | Publication | Keep public web non-scoring; do not leak scores in OG |
| 6 | Custom scheme + https in one Android intent-filter | Medium | Native config | Review for unintended matches (AMBER if changing) |
| 7 | Deferred deep link after install | Not implemented | Product | Do not promise; separate design |
| 8 | Share-event telemetry logs barcode/platform | Low | Privacy | Confirm disclosure; no PII in URL today |
| 9 | Stale prod vs preview identity | High | Ops | Align production alias with approved WEB-01A SHA |
| 10 | Sponsorship / independence | None found in share path | — | No change |

No new moderation/scoring authorities proposed in the web UI.

---

## Phase 9 — Corrected architecture (target, not implemented without approval)

```text
ONE canonical HTTPS origin (founder-chosen: truescan.app OR interim vercel)
  /barcode/{exact-gtin}
  ├── OS App/Universal Link (verified) → existing Result screen
  └── Else → approved landing (OFF-exact identity, no scores)
AASA + assetlinks on THAT same origin with real credentials
Share builder ALWAYS emits that origin (never preview URLs)
```

### Files that would change under an approved fix (not applied)

| Change | Files | Class |
|---|---|---|
| Domain Option A | DNS/TLS + `EXPO_PUBLIC_SHARE_WEB_ORIGIN` + eas.json | Ops + GREEN config once domain healthy |
| Domain Option B | `app.config.js`, AndroidManifest, AASA host, eas | **AMBER** |
| Prod identity fix | Promote existing WEB-01A `product-preview.ts` | Ops promote (already in worktree) |
| Real AASA/assetlinks secrets | Vercel env | Ops |

### Exact files inspected (no release commits)

`app/result/[barcode].tsx`, `src/features/sharing/**`, `src/utils/shareUrl.ts`, `src/utils/shareScoreSemantics.ts`, `src/utils/linking.ts`, `app.config.js`, `app/_layout.tsx`, `eas.json`, `backend/vercel/api/barcode/[barcode].ts`, `product-preview.ts`, `well-known-deep-links.ts`, `shareLandingHtml.ts`, `publicShareIdentity.ts`, `vercel.json`, Wave 5 share/identity contract tests.

---

## Unresolved launch blockers (founder action)

1. **Choose and heal the canonical share domain** (A or B).  
2. **Approve production promote** of WEB-01A public identity (zeros fail-closed).  
3. **Supply real Apple Team ID + Android signing SHA-256 fingerprints** for well-known files.  
4. **Authorise physical-device test campaign** with signed builds (AU TestFlight + NZ release-equivalent Android), then re-run Phase 7 matrix.

---

## Appendix — Live probe captures (11 Nov 2026)

```text
PROD Cadbury HTML
  GET https://truscoreapi.vercel.app/barcode/9300617064879
  → 200 title=Dairy Milk Milk Chocolate · Rveel ; SCORE_LEAK=no

PROD zeros HTML + API (CRITICAL FAIL)
  GET https://truscoreapi.vercel.app/barcode/0000000000000
  → 200 title=ORGANIC BLUE CORN TORTILLA CHIPS · Rveel
  GET https://truscoreapi.vercel.app/api/product-preview?barcode=0000000000000
  → 200 {
      "barcode":"0000000000000",
      "product_name":"ORGANIC BLUE CORN TORTILLA CHIPS",
      "brands":"N/A",
      "image_url":"http://www.aveda.co.uk/media/images/products/600x600/000000000000_FRONT.jpg",
      "trust_score":null,
      "trust_score_breakdown":null
    }

AASA (vercel)
  appID=TEAM_ID.com.truescan.foodscanner   ← placeholder

assetlinks (vercel)
  sha256_cert_fingerprints=["SHA256_FINGERPRINT"]   ← placeholder

truescan.app
  TLS trust relationship could not be established

Share builder default
  DEFAULT_SHARE_WEB_ORIGIN=https://truscoreapi.vercel.app

OS association config
  associatedDomains / intentFilters host = truescan.app only
```

Preview with WEB-01A (worktree deploy family): zeros → unknown / fail-closed (contrast to prod above).

---

## STOP

No commit, push, merge, production deployment, domain migration, or store release performed.  
Awaiting founder / ChatGPT review of this evidence package before any release action.
