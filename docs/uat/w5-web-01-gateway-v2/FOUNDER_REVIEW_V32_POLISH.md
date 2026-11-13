# WEB-01 V3.2 — founder visual polish (local)

**Branch:** `feature/w5-web-product-teaser-v2`  
**Mode:** Presentation-only. **No commit / push / merge / alias / production deploy.**  
**Local preview:** `http://127.0.0.1:4182/` (fixtures under `docs/uat/w5-web-01-gateway-v2/preview-v32/`)

---

## What changed

1. **Premium veil** — Deeper frost/mist on `.pillar-veil` only; soft sheen for Reveal; no score digits and no score-like bar placeholders (`pillar-veil-mist` replaces `pillar-veil-bars`).
2. **Reveal CTA** — Label **“Reveal what’s inside”** with explicit hint that the page does not uncover findings. Activation: staggered light sweep across four veils + medallion glow → scroll/highlight Google Play. Classes/timers reset for repeat clicks. Reduced-motion skips sweep.
3. **Hero photo** — `object-fit: contain` preserved; soft well framing only.
4. **Icons / dog-ears** — MDI/MCI-aligned SVG paths (apple / leaf / message-text / eye); dog-ear flap + cast from `dogEar.ts` fold=46 geometry.
5. **Unknown copy** — Headline: **“We couldn't identify this product yet.”** Barcode-only fallback + OFF exact-code gate unchanged (no UPCITEMDB on public preview).

---

## Verification

| Check | Result |
|---|---|
| `npm run build:share-landing` | OK (24.6kb) |
| Identity + public web share + buildShareUrl | **29 / 29** |
| `npm run typecheck` | OK |
| Targeted eslint on touched share files | Clean |
| No auto deep-link / no score DOM / no UPCITEMDB in HTML | Pass (`interaction-checks.json`) |
| Reveal: reduced-motion, repeat click, keyboard Enter | Pass |
| Viewports 320 / 390 / 768 / 1440 | Cadbury, unknown, no-image (+ reveal frames) |

---

## Evidence

`docs/uat/w5-web-01-gateway-v2/screenshots/v32/`

- `v32-cadbury-{320,390,768,1440}.png`
- `v32-unknown-{320,390,768,1440}.png`
- `v32-no-image-{390,768,1440}.png`
- `v32-reveal-{before,during,after}-390.png`
- `v32-reveal-reduced-motion-390.png`
- `v32-pillars-detail-390.png`
- `interaction-checks.json`

---

## Reported gaps (do not block presentation)

### Source-image limitation
Cadbury identity uses the **Open Food Facts** catalogue front image (`front_en.50.400.jpg`). It is an authentic pack photo but a **consumer phone capture** (mixed lighting, vertical crop). Web only contains it; no re-crop invention, no alternate image service. Low source fidelity is an OFF asset limit, not a gateway bug.

### Result fidelity reference gap
- App Result renders **MaterialCommunityIcons** via Expo (`apple` / `leaf` / `message-text` / `eye` in `resultPresentation.ts`). This worktree has **no standalone icon PNG/SVG pack** to embed on the web.
- Web uses **inline SVG approximations** of those MDI paths + simplified dog-ear SVG (flap/cast from `dogEar.ts`), not the full RN `TileArt` gradient peel stack.
- Visual refs used: `docs/uat/w5-web-01-gateway-v2/preview/media/app-result-rated.png`, `docs/uat/w5-ui10/C-pillar-dogears.png`, `src/components/product/emerald/dogEar.ts`.

### Governance boundaries held
No scoring, RC1, contribution, publication, or identity-authority changes beyond the already-approved OFF exact-match public gate.

---

## STOP

Awaiting founder visual review on local V3.2 evidence. No further deploy unless directed.
