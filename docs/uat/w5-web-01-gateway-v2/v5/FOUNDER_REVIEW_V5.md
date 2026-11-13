# WEB-01 V5 — Founder visual review

**Status:** Stop for founder visual acceptance. Preview-only. No commit / push / merge / production / alias change.

## What materially changed from V4

V4 was still an app-card grid with tinted rectangles, MCI-style icons, repeated folds, and a dominant padlock medallion on empty emerald chrome.

V5 is an image-led **Product Discovery Experience**:

1. **Product theatre** — authentic OFF Cadbury front image (`front_en.50.400.jpg`, as-served; not upscaled). Lit stage, pedestal shadow, mint rim + single hero fold. Photo-first on mobile; side-by-side on desktop.
2. **Four illustrated perspectives** — bespoke SVG scenes (Body / Planet / Claims / Transparency), not coloured rectangles or emoji. Soft curiosity veil only; no scores or fabricated findings.
3. **Discovery aperture** — layered glass lens + Discover caption replaces the padlock treatment. Reveal brightens the lens and lifts veils; does not imply a score unlock.
4. **Composition** — ivory content slab over emerald atmosphere; large unused green fields and repeated decorative folds removed.
5. **Discover interaction** — coordinated veil lift, staggered perspective wake, aperture pulse, then scroll/highlight of app availability. Reduced-motion supported.

## Visual review cycles

| Cycle | Critique | Change |
|---|---|---|
| 1 | Veils too opaque; product not commanding enough; padlock gone but aperture still flat | Photo-first theatre; richer SVGs; glass iris aperture |
| 2 | Illustrations still washed out; aperture caption placement; desktop needs clearer emerald frame | Lower veil opacity; reveal illumination; pedestal; caption + lens scale |

## Evidence

| Item | Path |
|---|---|
| Design system | `docs/uat/w5-web-01-gateway-v2/v5/V5_DESIGN_SYSTEM.md` |
| App Result SOT | `v5/refs/app-full-result.png`, `v5/compare/app-full-result.png` |
| V4 vs V5 390 | `v5/compare/v4-cadbury-390.png` vs `v5/compare/v5-cadbury-390.png` |
| Cadbury 390 / 1440 | `v5/screenshots/v5-cadbury-{390,1440}.png` |
| Unknown / no-image | `v5/screenshots/v5-unknown-390.png`, `v5-no-image-390.png` |
| Reveal sequence | `v5/screenshots/v5-reveal-{before,during,after}-390.png` |
| Reduced motion | `v5/screenshots/v5-reveal-reduced-390.png` |
| DOM verify | `v5/screenshots/verify.json` |

## Invariants preserved

- No scores / bands / arcs in public DOM
- OFF exact-code identity only; no public UPCITEMDB fallback
- No automatic deep-link
- Both stores coming soon when listings unverified (preview fixtures)
- RC1 / native app untouched

## Tests

- `publicWebShare.contract.test.ts` — pass
- `publicShareIdentity.contract.test.ts` — pass

## Preview (only — not production)

- **URL:** https://truscoreapi-ksrmouzga-leightons-projects-d328c774.vercel.app/barcode/9300617064879
- **Deployment:** `dpl_BsY7jtE2iPEokaCn7k5ztJbhjih3`
- **Inspect:** https://vercel.com/leightons-projects-d328c774/truscoreapi/BsY7jtE2iPEokaCn7k5ztJbhjih3

Unknown fixture path: `/barcode/0000000000000` on the same host.
