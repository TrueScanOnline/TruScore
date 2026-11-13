# RVEEL-WEB-01 — V3.1 founder visual polish

**Branch:** `feature/w5-web-product-teaser-v2`  
**Worktree:** `C:\TrueScan-FoodScanner-w5-web-teaser-v2`  
**Status:** Preview deployed. **No commit / push / merge / production.**  
**Classification:** GREEN presentation only (plus previously approved Package A identity gate already in this branch).

---

## Exact preview URLs

| Surface | URL |
|---|---|
| **Preview home** | https://truscoreapi-oxvudwqj4-leightons-projects-d328c774.vercel.app/ |
| **Cadbury (known)** | https://truscoreapi-oxvudwqj4-leightons-projects-d328c774.vercel.app/barcode/9300617064879 |
| **Unknown zeros** | https://truscoreapi-oxvudwqj4-leightons-projects-d328c774.vercel.app/barcode/0000000000000 |
| Inspect | https://vercel.com/leightons-projects-d328c774/truscoreapi/5najqzAuq4Lzbdz7EW6hxR36VGhQ |
| Ready / target | **READY** / **preview** (`target: preview`) |

**Production untouched** — no `--prod`, no alias change.

---

## Change summary (V3.1)

1. **Pillar legibility** — Icons + Body / Planet / Claims / Transparency stay clear; frost applies only to `.pillar-veil` simulated reading area. No real scores or findings in the DOM. Narrow-width tweak so Transparency stays readable at 320px.
2. **Reveal interaction** — `Continue in Rveel` press feedback → brief veil illumination / medallion pulse → smooth scroll + highlight on primary Play CTA. Lock remains decorative (`pointer-events: none`). Reduced-motion respected. No fake product reveal.
3. **Product hero** — `object-fit: contain` framing, dog-ear preserved, desktop balance vs Result card tightened.
4. **Headline** — Principal curiosity line is **“Curious about this product?”**; exact catalogue name stays prominent in the Hero Card.
5. **Download CTA** — Google Play is primary contrast (`btn-download-primary`); honest App Store coming-soon; secondary Open; existing deep-link; no deferred-install promise.
6. **Unknown product** — Barcode-only identity retained; copy states no completed analysis on this page (`sheet-unknown`).

---

## Verification

| Check | Result |
|---|---|
| `npm run build:share-landing` | OK (23.0kb bundle) |
| publicShareIdentity + publicWebShare + buildShareUrl | **29 / 29 passed** |
| `npm run typecheck` | OK |
| Targeted eslint | Pre-existing `import/no-unresolved` `@vercel/node` on `product-preview.ts` only (same as V3 note) |

---

## Evidence screenshots

Folder: `docs/uat/w5-web-01-gateway-v2/screenshots/v31/`

| Case | Widths |
|---|---|
| Known Cadbury | `v31-cadbury-{320,390,768,1440}.png` |
| Unknown barcode | `v31-unknown-{320,390,768,1440}.png` |
| Known without image | `v31-no-image-{390,768,1440}.png` |
| Reveal before / during / after | `v31-reveal-{before,during,after}-390.png` |

---

## STOP

Awaiting founder visual review. No further deploy / commit / promote unless directed.
