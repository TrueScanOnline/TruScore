# SJ-03 — Temporary Vercel Share Journey Evidence (updated)

**Date:** 12 Nov 2026 (NZ)  
**Worktree:** `C:\TrueScan-FoodScanner-w5-web-teaser-v2`  
**Stable Share host:** `https://truscoreapi.vercel.app`  
**Native test artefact:** `android/app/build/outputs/apk/debug/app-debug.apk` (debug-signed)  
**Release control:** No commit / push / merge / production deploy / production association-env write / DNS / store without further founder approval.

---

## Functional readiness

**NOT READY.**

| Acceptance criterion | Result |
|---|---|
| 1. Shared URL preserves exact barcode | **PASS** (unit + builder) |
| 2. Recipient receives clickable link | **PARTIAL** — text-first Share Product Link / WhatsApp / SMS paths unit **PASS**; physical channels **NOT TESTED** |
| 3. Vercel page correct/unknown | Cadbury **PASS**; zeros / `0000000000017` **FAIL** on prod |
| 4. Installed app → exact product | **FAIL / incomplete** — custom scheme opens package; Result UI not proven (JS hang) |
| 5. Platform association verified | **FAIL** — domain state `1024`, selection **Disabled**; live assetlinks placeholder |
| 6. Open in Rveel fallback | Landing HTML **PASS**; native follow-through **NOT TESTED** |
| 7. No wrong identity / score leak | Score Cadbury **PASS**; identity zeros **FAIL** |
| 8. Execution evidence | This file + screenshots under `docs/uat/w5-web-01-gateway-v2/SJ03_*` |

---

## A. Native routing results

### Build / install

| Step | Result |
|---|---|
| `assembleDebug` (x86_64) | **PASS** (after disk recovery) |
| Install on `emulator-5554` | **PASS** (`Success`) |
| Package | `com.truescan.foodscanner` |
| APK SHA-256 (apksigner) | `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c` (= debug keystore) |

### Installed intent filters (dumpsys)

- `truescan` / `truescan`+host `barcode` — custom scheme **present**
- `https` + `truscoreapi.vercel.app` / `truscoreapi-uat.vercel.app` + `/barcode` + `AutoVerify=true`
- `truescan.app` **not** in autoVerify filter (deferred in current `app.config.js` / manifest — correct for temporary Vercel phase)

### Custom scheme `truescan://barcode/9300617064879`

| Case | Result | Evidence |
|---|---|---|
| Intent resolves to Rveel | **PASS** | `am start` Success; package launches |
| Cold → Result Cadbury | **FAIL / incomplete** | Screenshots `SJ03_A1_COLD*.png` — splash / “Loading from 10.0.2.2:8081…” / blank; UI dump empty of barcode |
| Background / other product / sequential | **NOT TESTED** | Blocked by JS runtime not reaching Result |
| Unknown / retrieval failure | **NOT TESTED** | Same |
| Never show previous product | **NOT TESTED** | Same |

**Cause of incomplete Result proof:** Debug APK depends on Metro. Bundle eventually completed (`Android Bundled … 2070 modules`) but React host logged soft-exception “context is not ready”; UI never showed Result/onboarding content in captures. Emulator ≠ physical device; Expo Go not used as App Link proof.

---

## B. Image / link sharing

### Implemented (local, uncommitted)

| Item | Class |
|---|---|
| **Share Product Link** → native `Share.share` with HTTPS in message | GREEN |
| WhatsApp / SMS / Facebook / X / native / moreApps → **text+HTTPS** (not image-only) | GREEN |
| Instagram / Snapchat / TikTok → image-first; clipboard is sender-side only | GREEN |
| Honest i18n (no silent clipboard-as-delivery claim) | GREEN |

### Unit

`shareDelivery` + `publicShareIdentity`: **PASS** (10 tests in last run).

### Physical WhatsApp / SMS / email / Copy Link

**NOT TESTED** on device.

---

## C. Association configuration & verification

### Live production well-known (unchanged)

```text
GET https://truscoreapi.vercel.app/.well-known/assetlinks.json
→ sha256_cert_fingerprints: ["SHA256_FINGERPRINT"]   ← PLACEHOLDER

GET …/apple-app-site-association
→ appID: TEAM_ID.com.truescan.foodscanner           ← PLACEHOLDER
```

### Debug candidate (docs only — **not** written to production)

`SJ03_ASSETLINKS_DEBUG_CANDIDATE.json` with fingerprint  
`FA:C6:17:45:…:3B:9C` matching installed debug APK.

### Android domain verification (actual)

```text
pm get-app-links com.truescan.foodscanner
  truscoreapi.vercel.app: 1024
  truscoreapi-uat.vercel.app: 1024
  Selection state: Disabled (both hosts)
```

**Not VERIFIED.** State `1024` + Disabled = OS will not auto-open HTTPS into Rveel.  
HTTPS open while installed went to **Chrome** (blank tab in capture) — consistent with unverified links.

### iOS

Apple Team ID: **NOT OBTAINED** (no guess). Universal Link on device: **NOT TESTED** (Windows host).

### Broken `truescan.app`

Intentionally **excluded** from current autoVerify / associatedDomains in worktree to avoid poisoning verification on older Android. Permanent domain deferred.

---

## D. Identity-hotfix readiness

WEB-01A candidate remains OFF-only + code match; **not deployed**.

| Barcode | Prod `product-preview` (this run) |
|---|---|
| `9300617064879` | **200** Dairy Milk Milk Chocolate |
| `0000000000000` | **200** ORGANIC BLUE CORN TORTILLA CHIPS ← **FAIL** |
| `0000000000017` | **200** DeWitt pond liner ← **FAIL** |
| `3017620422003` | **200** Nutella |

Cadbury landing Open CTA markup previously **PASS**. Scores null on public route (prior samples).

---

## E. Physical-device / channel matrix

| Method / case | Result |
|---|---|
| Android emulator custom scheme opens app | PASS (intent) |
| Android emulator Result barcode proof | FAIL / incomplete |
| Android App Link HTTPS auto-open | FAIL (verification Disabled) |
| Android no-app → Vercel Cadbury | PASS (HTTP; not re-shot this turn) |
| iPhone all rows | **NOT TESTED** |
| WhatsApp / SMS / email / share sheets | **NOT TESTED** |

---

## F. Remaining blockers + smallest next steps

1. **Prove Package A Result UI** on a build that does not hang waiting for Metro (release/preview with embedded bundle, or Expo Dev Client + stable packager), then re-run cold/warm/sequential/unknown.  
2. **Founder supplies** Apple Team ID + Play/debug SHA-256 → approve writing Vercel env for well-known (separate from this STOP) → rebuild → re-check `pm get-app-links` until **verified** / enabled.  
3. **Approve identity-only WEB-01A prod hotfix** (separate decision).  
4. Physical AU/NZ channel matrix.

---

## G. File classification

| File | Class | Status |
|---|---|---|
| `ShareModal.tsx` / `ShareService.ts` / `en.json` / `shareDelivery.test.ts` | GREEN | Local share-link honesty |
| `app.config.js` / `AndroidManifest.xml` | AMBER | Vercel hosts; `truescan.app` deferred from autoVerify |
| `product-preview.ts` / `publicShareIdentity.ts` | AMBER | WEB-01A candidate — not prod |
| Scoring / EA / publication | — | Unchanged |
| Production `.well-known` / DNS | RED if changed now | **Not changed** |

---

## STOP

No production action performed. Share journey remains **not functionally complete**. Awaiting founder / ChatGPT review.
