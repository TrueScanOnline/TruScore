# WEB-01 V5 Score Mystery — Founder visual review

**Status:** Stop for founder / ChatGPT visual acceptance. Preview only. No commit / push / merge / production / alias.

## Preview URLs

- Cadbury: https://truscoreapi-f9nr6eofn-leightons-projects-d328c774.vercel.app/barcode/9300617064879
- Unknown: https://truscoreapi-f9nr6eofn-leightons-projects-d328c774.vercel.app/barcode/0000000000000
- Deployment: `dpl_G2GByUnNy2Jq1k413w3RtLFQxcx9`

## What this pass delivers

Public share landing rebuilt as a **Score Mystery Experience** that mirrors the native Emerald Result anatomy while concealing readings:

1. **Four pillars** — Emerald gradients from `resultPresentation.ts`, genuine MaterialCommunityIcons font glyphs (`apple` / `leaf` / `message-text` / `eye`), fold=46 peels, app-like icon-top / name+reading-bottom layout, chevrons beside the reading row.
2. **Frosted mystery** — two layers: blurred non-numeric mass + frosted glass (no “IN RVEEL” label strip; no digits/`/25`/bands).
3. **3D `?` medallion** — pearl/glass disc with rim, socket, press + curiosity motion (not a padlock).
4. **Reveal sequence** — press → light → veil shimmer → app availability (honest; no score unlock).
5. **Unknown** — muted veil (`is-unknown`); no implication that verified findings await.

## Visual cycles

| Cycle | Finding | Fix |
|---|---|---|
| 1 | Wrong MCI glyphs (bad CSS codepoints); frost looked like labelled blanks; layout was icon-row not app anatomy | Direct glyphmap codepoints + MCI font; app pillar copy layout; remove IN RVEEL hint |
| 2 | Reading frost too thin; inner corners collided with medallion | Taller frost; tile padding for disc socket; richer glass |

## Evidence

| Item | Path |
|---|---|
| App vs web | `v5/compare/app-vs-web-app.png` · `v5/compare/app-vs-web-web-390.png` |
| Cadbury 390 / 1440 | `v5/screenshots/v5-cadbury-{390,1440}.png` |
| Unknown / no-image | `v5/screenshots/v5-unknown-390.png`, `v5-no-image-390.png` |
| Reveal before/during/after | `v5/screenshots/v5-reveal-{before,during,after}-390.png` |
| Reduced motion | `v5/screenshots/v5-reveal-reduced-390.png` |
| Verify | `v5/screenshots/verify.json` |

## Tests

- `publicWebShare.contract.test.ts` — pass
- `publicShareIdentity.contract.test.ts` — pass

## Remaining fidelity limits

- Title remains “Rveel perspectives” (public contract forbids the string “Rveel Score”).
- Medallion has no score arc (intentional mystery, not NR/`—`).
- Native stacked glass sheets are suggested, not pixel-identical.
- MCI TTF is the Expo vendor font; web anti-aliasing may differ slightly from Android.
