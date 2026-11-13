# RVEEL-WEB-01 — Founder review: V3 + identity correction

**Worktree:** `C:\TrueScan-FoodScanner-w5-web-teaser-v2`  
**Branch:** `feature/w5-web-product-teaser-v2`  
**Baseline:** `0ce99696bda120808298ce4cc223191865b821be`  
**Status:** Preview deployed. **No commit / push / merge / production.**

---

## Exact preview URLs

| Role | URL |
|------|-----|
| **Preview home** | https://truscoreapi-k5go75ong-leightons-projects-d328c774.vercel.app/ |
| **Cadbury teaser** | https://truscoreapi-k5go75ong-leightons-projects-d328c774.vercel.app/barcode/9300617064879 |
| **Unknown (zeros)** | https://truscoreapi-k5go75ong-leightons-projects-d328c774.vercel.app/barcode/0000000000000 |
| **OFF exact oddity** | https://truscoreapi-k5go75ong-leightons-projects-d328c774.vercel.app/barcode/9999999999994 |
| Deployment ID | `dpl_FDVLQv9poK3QWJ2qE5KSWLHupSji` |
| Ready / target | **READY** / **preview** (`target: null`) |
| Inspect | https://vercel.com/leightons-projects-d328c774/truscoreapi/FDVLQv9poK3QWJ2qE5KSWLHupSji |

**Production untouched:** alias still `truscoreapi-mucz6k5ld-…` → https://truscoreapi.vercel.app/ (no V3, no `--prod`, no alias change).

---

## Classification

| Package | Class | Scope |
|---------|-------|-------|
| **WEB-01A** public-share identity | **AMBER** (founder-approved, bounded) | `product-preview.ts` + `publicShareIdentity.ts` only for public web preview |
| **WEB-01B** Discovery Gateway V3 | **GREEN** | `shareLandingHtml.ts` / CSS / contract tests / bundle |

App UPCITEMDB (`src/services/upcitemdb.ts`) and app product retrieval **unchanged**.

---

## Files changed

### Package A
- `backend/vercel/lib/publicShareIdentity.ts` *(new)* — OFF code match via `normalizeBarcode`
- `backend/vercel/api/product-preview.ts` — OFF exact-match only; **no UPCITEMDB**; 404 not found vs 502 lookup unavailable
- `src/__tests__/unit/wave5/publicShareIdentity.contract.test.ts` *(new)*

### Package B
- `backend/vercel/lib/shareLandingHtml.ts` — Gateway V3 markup, curiosity copy, download-first CTAs, frost without score DOM
- `backend/vercel/lib/shareLandingHtml.bundle.mjs` — regenerated
- `backend/vercel/public/rveel.css` — emerald Result-inspired canvas, pillar peels, frost sweep, medallion glow
- `src/__tests__/unit/wave5/publicWebShare.contract.test.ts` — V3 copy + no-hidden-score assertion

### Review artefacts
- `docs/uat/w5-web-01-gateway-v2/screenshots/v3-cadbury-390.png`
- `docs/uat/w5-web-01-gateway-v2/screenshots/v3-cadbury-1440.png`
- (plus prior references / unknown capture in temp → copy as needed)

`shareLandingMeta.ts` recall/safety strings **not modified**.

---

## Package A — identity results

| Case | Result |
|------|--------|
| `9300617064879` | API 200 Cadbury Dairy Milk; page shows correct identity |
| `0000000000000` | API **404**; page **“We're still identifying…”**; **no** ORGANIC BLUE CORN TORTILLA CHIPS |
| `9999999999994` | API 200 Light & Free SKYR (OFF exact code match — catalogue oddity, not claimed as verified commercial SKU) |
| OFF miss + UPCITEMDB would have hit | Public share stays barcode-only (UPCITEMDB bypassed) |
| OFF network/HTTP failure | **502** `Product lookup unavailable` (no substitution) |
| UPC-A/EAN-13 equivalence | Covered by `publicShareCodesMatch` + unit tests |
| Cache | Success `max-age=3600`; not-found `max-age=120`; errors `no-store` — URLs are per-barcode |
| App consumers | Unchanged (separate `upcitemdb.ts` / product services) |

---

## Package B — visual results

- Emerald wallpaper closer to RC1 Result (`#27B899` → `#10957E` → `#087565`)
- Product-first hero with dog-ear, larger photo well
- Concealed perspectives card: Body / Planet / Claims / Transparency, peels, chevrons, frost, Reveal lock — **no score digits in DOM**
- Download primary (Play); Open secondary; App Store coming-soon when unset
- No auto deep-link; header Get-app scrolls to `#get-app`
- Motion: frame enter, frost sweep, medallion glow; `prefers-reduced-motion` respected

### App comparison note

Reference screenshot `docs/uat/w5-ui10/A-full-result.png` is **prior UAT Cadbury Result evidence** (matches current emerald tokens in RC1 source). A **live** Cadbury Result capture was not obtained in this turn (emulator Expo Go did not resolve `truescan://`). Do not treat marketing media as a fresh live shot.

---

## Tests

```text
npm run build:share-landing          OK (22.4kb bundle)
Jest: publicShareIdentity + publicWebShare + buildShareUrl
  → 29 passed
npm run typecheck                    OK
eslint on WEB-01 TS files            clean except pre-existing
  import/no-unresolved @vercel/node on api/product-preview.ts
```

Fail-closed score contract tests retained and extended (no hidden score DOM).

---

## Unresolved / limitations

1. Preview App Store remains “coming soon” without `APP_STORE_ID` on the preview runtime.
2. `9999999999994` still surfaces OFF’s SKYR name by exact-match policy (expected).
3. Live native Cadbury Result screenshot not re-captured this session.
4. Repo-wide lint still has baseline failures outside WEB-01.

---

## Declarations

- No scoring / Rateability / Evidence Authority / Dynamic Signals / contribution changes  
- RC1 branch/tag not modified  
- Original and CD-01 worktrees not disturbed  
- **No production deployment, push, merge, or promote**

Awaiting founder visual review.
