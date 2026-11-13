# WEB-01 Discovery Gateway V4 — founder visual review

**Status:** Preview READY. **No commit / push / merge / production.**  
**Branch:** `feature/w5-web-product-teaser-v2`

## Live preview

| | |
|---|---|
| **Deployment** | `dpl_12fRyYfksmxZVQzBx1M2umqJUFzW` (`target: preview`) |
| **Cadbury** | https://truscoreapi-58vdq2fdh-leightons-projects-d328c774.vercel.app/barcode/9300617064879 |
| **Unknown** | https://truscoreapi-58vdq2fdh-leightons-projects-d328c774.vercel.app/barcode/0000000000000 |
| **Inspect** | https://vercel.com/leightons-projects-d328c774/truscoreapi/12fRyYfksmxZVQzBx1M2umqJUFzW |

## Phase 1 audit notes
- Native Result refs copied from `docs/uat/w5-ui10/` (A/B/C) + emulator screencap of Expo session.
- Fidelity matrix: `docs/uat/w5-web-01-gateway-v2/v4/VISUAL_FIDELITY_MATRIX.md`
- Fresh Cadbury Result navigation in Expo was not completed this pass; UAT Result screenshots remain the visual source of truth.

## V4 presentation changes (substantial)
- Emerald multi-layer atmosphere + constrained ivory stage (desktop empty-field reduced)
- Hero rebuilt with mint face, proud rim `#074F42`, fold=46 multi-cast peel, contain photo well
- OFF `.full.jpg` preferred when API supplies `.400.jpg` (same asset; fallback to 400)
- Perspectives frame with dual backing sheets + rimmed face (EmeraldScoreFrame language)
- Pillars use app diagonal colour stops, wash, glass veil (no fake score bars), peels
- Glass concentric medallion with lock cue — **no number / band**
- Reveal sweep + medallion pulse + CTA highlight retained; reduced-motion OK
- Copy / coming-soon stores / OFF identity / no-score / no auto deep-link preserved

## Verification
- **29/29** share + identity + buildShareUrl tests  
- Typecheck OK  
- Remote: Cadbury identity + image (`front_en.50.full.jpg`); unknown honest; no score DOM; no Play href; Reveal + reduced-motion OK  

## Evidence
`docs/uat/w5-web-01-gateway-v2/v4/screenshots/` — cadbury 320/390/768/1440; reveal before/during/after; reduced-motion; no-image; unknown 320/390/1440  
Compare: `v4/compare/v32-cadbury-390.png` vs `v4/screenshots/v4-cadbury-390.png`  
App refs: `v4/refs/`

## Residual fidelity gaps
- Expo icon font metrics vs SVG paths  
- Full RN-SVG TileArt crease/cast stack only approximated  
- Live score arc intentionally absent (public safety contract)  
- Platform shadow/elevation divergence  

## STOP
Awaiting founder visual review. Production untouched.
