# Share Journey — Correction Evidence Package V2

**Date:** 12 Nov 2026 (NZ)  
**Branch / worktree:** `feature/w5-web-product-teaser-v2` @ `C:\TrueScan-FoodScanner-w5-web-teaser-v2`  
**HEAD (committed):** `0ce99696bda120808298ce4cc223191865b821be`  
**Production alias:** `https://truscoreapi.vercel.app` → current Ready prod deploy `truscoreapi-mucz6k5ld-…`  
**Governance:** No commit / push / merge / DNS / TLS / prod promote / store action without founder approval.  
**Visual design:** FROZEN — identity correction must not be shipped by promoting the full visual preview.

---

## 1. Root cause — incorrect production product identity

### Exact source

Production `GET /api/product-preview` (**committed** `backend/vercel/api/product-preview.ts` at HEAD) does:

1. Open Food Facts v2 lookup.
2. **If OFF miss → fall through to UPCITEMDB trial**  
   `https://api.upcitemdb.com/prod/trial/lookup?upc={barcode}`
3. Accept `items[0].title` / `brand` / `images[0]` with **no code-equivalence check**.

For `0000000000000`:

| Step | Result |
|---|---|
| OFF | `status=0` (no product) |
| UPCITEMDB | `ORGANIC BLUE CORN TORTILLA CHIPS`, image `http://www.aveda.co.uk/.../000000000000_FRONT.jpg` |
| Prod preview | **200** with that identity (`trust_score: null`) |
| Share HTML | Renders as a “known” product |

**This is not caching of an old OFF hit.** Live UPCITEMDB still returns the same junk title. Prod mirrors it.

### Why production accepted it

The committed public route **intentionally** treated UPCITEMDB as a second identity source. There is no public-share authority gate requiring OFF `product.code` ↔ requested barcode match. Scores were already nulled (`publicPreviewContract`); identity was not fail-closed.

### Affects other barcodes (not zeros-only)

Live cohort (12 Nov 2026):

| Barcode | OFF | UPCITEMDB | **Prod preview** | Verdict |
|---|---|---|---|---|
| `9300617064879` Cadbury | Dairy Milk | (empty) | Cadbury / OFF image | PASS |
| `3017620422003` Nutella | Nutella | (empty) | Nutella | PASS |
| `9400547009879` Wattie's | Tomatoes Mexican Style | 429 | Wattie's / OFF | PASS |
| `9999999999994` | Light & Free SKYR… | **Joolz stroller** (different) | SKYR (OFF wins) | PASS path; catalogue oddity |
| `0000000000000` | miss | **Tortilla chips** | **Tortilla chips** | **FAIL** |
| `0000000000017` | miss | **DeWitt pond liner** | **Pond liner** | **FAIL** — proves not zeros-special |
| `12345678` | “Ror” (OFF hit) | 400 | “Ror” | OFF catalogue quality |
| `0049000056541` | 404/miss | 429 | 404 | PASS fail-closed when UPC also fails |

**Conclusion:** Any OFF-miss barcode that UPCITEMDB still “hits” can publish a wrong public identity. Special-casing zeros would leave `0000000000017` and similar codes broken.

### Does WEB-01A genuinely correct it?

**Yes — for the public preview path.**

Worktree + prior previews (`truscoreapi-k5go75ong-…`, `truscoreapi-oxvudwqj4-…`):

| Barcode | Preview product-preview |
|---|---|
| `0000000000000` | **404** |
| `0000000000017` | **404** |
| `9300617064879` | **200** Cadbury |

Mechanism (AMBER WEB-01A, already founder-bounded):

- Remove UPCITEMDB from **public** `product-preview` only.
- Require `publicShareCodesMatch(requested, OFF code)` using existing `normalizeBarcode` equivalence.
- 404 → landing unknown; 502 on OFF network/HTTP failure (distinct from not found).
- App `src/services/upcitemdb.ts` **unchanged**.

Unit tests (this session): **29/29 PASS**  
`publicShareIdentity.contract.test.ts`, `publicWebShare.contract.test.ts`, `buildShareUrl.test.ts`.

---

## 2. Production vs preview / worktree code differences

| Area | Production (HEAD / live alias) | Worktree WEB-01A (uncommitted) |
|---|---|---|
| OFF lookup | Yes | Yes |
| OFF code match gate | **No** | **Yes** (`publicShareIdentity.ts`) |
| UPCITEMDB fallback | **Yes** | **Removed on this route** |
| Scores on public route | Always null | Always null |
| Zeros / `0000000000017` | Wrong product 200 | 404 unknown |
| Visual landing HTML/CSS | Older prod surface | Also has frozen V5 visuals in worktree — **do not use visual promote as the identity vehicle** |

Identity-only diff vs HEAD saved at:  
`docs/uat/w5-web-01-gateway-v2/IDENTITY_FIX_DIFF_VS_HEAD.patch.txt`

---

## 3. Proposed minimal production correction

### Classification

| Change | Class | Notes |
|---|---|---|
| Remove UPCITEMDB from public `product-preview`; add OFF code-match gate | **AMBER** | WEB-01A already founder-approved as bounded public-share identity |
| App identity / scoring / publication / upcitemdb service | **RED if touched** | **Out of scope — do not touch** |
| Full visual preview promote to fix identity | **Rejected by founder** | Correct identity without promoting the whole visual preview |

### Smallest safe ship set (identity-only)

1. `backend/vercel/api/product-preview.ts`
2. `backend/vercel/lib/publicShareIdentity.ts` (**new**)
3. `src/__tests__/unit/wave5/publicShareIdentity.contract.test.ts` (**new**)

Do **not** include in this identity promote: `shareLandingHtml.ts`, `rveel.css`, fonts, or other V5 visual deltas unless separately approved.

### Rollback

1. In Vercel project `truscoreapi`, **Promote** previous Ready production deployment (currently `truscoreapi-mucz6k5ld-…` is the live one — after a new promote, roll back to that URL/SHA).
2. Or redeploy the last known-good production git SHA that still contains UPCITEMDB (accepting re-break of identity).
3. Smoke: Cadbury 200; zeros must return to prior behaviour if rolled back (document that).

### Post-promote regression checklist (HTTP — not device)

| Case | Expected |
|---|---|
| Cadbury `9300617064879` | 200, Cadbury, OFF image host |
| Nutella `3017620422003` | 200 |
| Zeros `0000000000000` | **404** → unknown landing |
| `0000000000017` | **404** |
| `9999999999994` | 200 OFF exact (SKYR catalogue row) |
| Malformed / non-digit | 400 at landing layer as today |
| Score fields | remain null; no score HTML |

**Status:** Proposal ready. **NOT DEPLOYED.**

---

## 4. Domain repair plan (Option A — `truescan.app`)

### Observed control plane

| Fact | Evidence |
|---|---|
| DNS A | `truescan.app` → `52.223.37.4` |
| www | same A |
| NS | `ns1dhl/ns2fkr/ns3qtx/ns4bfy.name.com` (name.com) |
| PTR | `*.awsglobalaccelerator.com` |
| TLS | Handshake presents **`CN=*.iot.ap-northeast-1.amazonaws.com`** (wrong host) → client trust failure |
| HTTP :80 | Timeout from this environment |
| MX | No usable MX answer (SOA-only) — **no evidence of active email on this apex from DNS** |
| Vercel custom domains | **0** domains under account; `truescan.app` **not** attached to `truscoreapi` |
| Vercel projects | `truscoreapi` / `truscoreapi-uat` healthy on `*.vercel.app` |

### Why HTTPS fails

DNS points at an **AWS Global Accelerator** endpoint that serves an **unrelated AWS IoT regional wildcard certificate**, not a `truescan.app` cert and not Vercel. Browsers correctly reject the name mismatch / trust path.

### Ownership / long-term use

- Registrar/DNS UX is **name.com** nameservers — founder must confirm account ownership and that Rveel intends this apex long-term (preferred Option A).
- This agent **did not** change DNS, TLS, or project domains.

### Required corrections (founder-operated)

1. Confirm name.com (or current registrar) login owns `truescan.app`.
2. Decide: retire the AWS Global Accelerator target (whatever legacy IoT/service it was).
3. In Vercel → project **`truscoreapi`** → Add domain `truescan.app` (+ `www` if desired).
4. Replace DNS with **exact records Vercel shows** (typically A/ALIAS/CNAME to Vercel). Remove or stop the Accelerator target.
5. Wait for Vercel-issued certificate for `truescan.app`.
6. Verify:
   - `https://truescan.app/barcode/9300617064879` → approved landing
   - `https://truescan.app/.well-known/apple-app-site-association`
   - `https://truescan.app/.well-known/assetlinks.json`
7. Only then switch share origin (below).

### Email / other services risk

- No MX found in this probe → low email risk **if** that remains true in the registrar panel.
- Founder should still screenshot DNS (A/AAAA/CNAME/MX/TXT/CAA) before edit.
- Any TXT (SPF/DKIM) or third-party CNAMEs must be preserved intentionally.

---

## 5. Corrected canonical Share URL configuration

### Discrepancy explained

| Era | Source | Emitted URL host |
|---|---|---|
| Before `0ce9969` (11 Nov 2026) | `buildShareUrl` hardcoded | `https://truescan.app/barcode/…` |
| Commit `0ce9969` + current HEAD | `DEFAULT_SHARE_WEB_ORIGIN` + `eas.json` `EXPO_PUBLIC_SHARE_WEB_ORIGIN` | **`https://truscoreapi.vercel.app/barcode/…`** |
| Native associations (unchanged) | `app.config.js` | **`applinks:truescan.app` / intent host `truescan.app` only** |

So: **current app builds share Vercel**; **OS association still expects `truescan.app`**. That mismatch is why App/Universal Links cannot work even when the landing page works on Vercel.

### Proposed consistent end-state (after Option A DNS/TLS)

| Layer | Value |
|---|---|
| Canonical public URL | `https://truescan.app/barcode/{barcode}` |
| `DEFAULT_SHARE_WEB_ORIGIN` | `https://truescan.app` |
| `eas.json` production / preview store profiles | `EXPO_PUBLIC_SHARE_WEB_ORIGIN=https://truescan.app` |
| UAT profiles | Keep `truscoreapi-uat.vercel.app` **or** a dedicated UAT host — founder choice |
| `associatedDomains` | `applinks:truescan.app` (already) |
| Android intentFilters | `https://truescan.app/barcode` (already) |
| AASA / assetlinks | Served from **`truescan.app`** via same Vercel project |
| Optional interim | Until DNS fixed, keep Vercel shares but **do not claim** UL/App Links work |

**Do not** put Vercel preview deployment URLs into `buildShareUrl`.

---

## 6. Native app-link verification evidence

### Config audit

| Item | Value | Status |
|---|---|---|
| iOS bundle ID | `com.truescan.foodscanner` | Present in `app.config.js` |
| Android package | `com.truescan.foodscanner` | Present |
| Associated Domains | `applinks:truescan.app` | Present; host unreachable for UL |
| Android autoVerify https | host `truescan.app` | Present; host unreachable |
| AASA on vercel.app | 200 | **`appID: TEAM_ID.com.truescan.foodscanner`** placeholder |
| assetlinks on vercel.app | 200 | **`SHA256_FINGERPRINT`** placeholder |
| Vercel env `APPLE_TEAM_ID` | **Not set** (env ls: DB/Blob only) | BLOCKED |
| Vercel env `ANDROID_SHA256_FINGERPRINT` | **Not set** | BLOCKED |

### Verified IDs policy

**No guessed Team ID or signing fingerprints.** Founder / Apple Developer / Play Console / EAS credentials must supply:

1. Apple Team ID (10-character).
2. Android SHA-256 for **Play App Signing** cert **and** any upload/debug certs that must open links in test.

Then set:

```text
vercel env add APPLE_TEAM_ID production
vercel env add ANDROID_SHA256_FINGERPRINT production
# optionally Preview/Development
```

Re-fetch well-known files on **`truescan.app`** after domain attach; confirm `Content-Type: application/json`, HTTPS, no auth redirect.

### Physical / signed-build UL–App Link tests

| Case | Result |
|---|---|
| Signed iOS physical Universal Link | **NOT TESTED** |
| Signed Android physical App Link | **NOT TESTED** |
| Android emulator `emulator-5554` present | Device listed; **not** used as App Link proof (unsigned/Expo Go insufficient per brief) |
| iOS tooling on this Windows host | **Unavailable** (`xcrun` absent) |

---

## 7. Physical-device / channel matrix (Priority 4)

| ID | Case | Result |
|---|---|---|
| D1 | Android — app installed | **NOT TESTED** |
| D2 | Android — app absent → web | **NOT TESTED** |
| D3 | iPhone — app installed | **NOT TESTED** |
| D4 | iPhone — app absent → web | **NOT TESTED** |
| D5 | Cold start | **NOT TESTED** |
| D6 | Already running | **NOT TESTED** |
| D7 | WhatsApp / SMS / email / copy | **NOT TESTED** |
| D8 | Known + unknown barcodes | HTTP identity: Cadbury PASS / zeros FAIL on **prod**; zeros PASS on WEB-01A **preview** |
| D9 | Consecutive different products | **NOT TESTED** |
| D10 | In-app browser / no handoff + Open in Rveel fallback | **NOT TESTED** |

**Automation-only (labelled):** unit tests PASS; live HTTP cohort as §1; WEB-01A preview 404 for zeros PASS.

---

## 8. Outstanding launch blockers

| # | Blocker | Owner action |
|---|---|---|
| 1 | Prod UPCITEMDB wrong identity | Approve **identity-only** promote of WEB-01A files; do **not** use full visual preview promote as the fix |
| 2 | `truescan.app` DNS → AWS Accelerator + wrong TLS cert | Founder DNS/TLS repair (Option A); attach domain to `truscoreapi` |
| 3 | Share origin still Vercel while associations are `truescan.app` | Switch `EXPO_PUBLIC_SHARE_WEB_ORIGIN` / default **after** domain healthy; rebuild app |
| 4 | AASA / assetlinks placeholders; env vars unset | Supply real Team ID + SHA-256 fingerprints |
| 5 | Physical-device share journey undemonstrated | Authorise signed TestFlight + release-equivalent Android device campaign |

---

## STOP

No production deploy, DNS/TLS change, commit, push, merge, or store release performed.  
Awaiting founder / ChatGPT approval to:

1. Ship **identity-only** production correction, and/or  
2. Execute Option A domain attachment, and/or  
3. Inject verified association credentials and run physical-device matrix.
