# Wave 5 Emerald — what is on this branch

The rendered SCR-RESULT is the founder-accepted visual reference. Corrective-package acceptance and BC are still open. Passing tests are not that acceptance.

## Git

- Repository: https://github.com/TrueScanOnline/TruScore
- Branch: `wave5/score-experience-20261008`
- Accepted SCR-RESULT evidence is the layout captures below.
- Do not treat a passing test as corrective-package acceptance or as BC.

## Approved artwork

`design/wave5/A_Emerald_Perspectives.png`

The coloured sheets drawn outside the two phone frames are board decoration. They are not part of the app. The right-hand phone’s all-dash pillars are illustrative. A live mixed NR result must keep independently published pillar values.

## Accepted rendered screen

Pixel 5 emulator, 1080×2340, density 440, light theme. These captures are the accepted SCR-RESULT reference.

| File | What it shows |
| --- | --- |
| `design/wave5/APP-emerald-layout-rated-font1.0.png` | SCR-RESULT / CARD-SCORE / entry History / Rated / Android / light / standard text. Dairy Milk 9300617064879 |
| `design/wave5/APP-emerald-layout-mixed-nr-font1.0.png` | SCR-RESULT / CARD-SCORE / entry History / Overall NR / Android / light / standard text. Coca-Cola 9300675001113 |
| `design/wave5/APP-emerald-layout-rated-font1.3.png` | Same Rated product, enlarged text, medallion stacked above the tiles |
| `design/wave5/APP-emerald-layout-rated-font1.3-end.png` | End of the scroll; Disclaimer clears the tab bar |
| `design/wave5/APP-emerald-layout-compare.png` | Artwork left phone and the ordinary-text Rated screen at equal width |

`APP-emerald-correction-*` is the previous candidate. `APP-emerald-craft-*` is the earlier rejected build. Do not describe those files as the accepted screen.

Geometry lives in `resultPresentation.emerald`. The medallion uses `colors.trust`. The wallpaper uses `#27B899 / #10957E / #087565`. Pillar identity colours stay separate from score-band colours.

## Source that draws this screen

- `src/components/product/emerald/EmeraldScoreComposition.tsx` — tiles, curl, medallion, font-scale layout
- `src/components/product/emerald/EmeraldScoreFrame.tsx` — raised tab and top glass sheets
- `src/components/result/EmeraldWallpaper.tsx` — wallpaper
- `src/theme/resultPresentation.ts` — colours, type, spacing
- `src/components/product/ProductHeroSection.tsx` — identity card and 72dp photo
- `app/result/[barcode].tsx` — mounts the Result. Layout and styling only. Do not move hooks or change handlers.

`src/components/result/EmeraldScoreBacking.tsx` is not mounted.

At font scale 1.0 the medallion stays centred on the four tiles. At font scale 1.3 or above it moves above the tiles.

## Governance copies

- `design/wave5/plan/Rveel_Wave5_Master_Plan_v1_1.md`
- `design/wave5/plan/Rveel_Wave_5_Architectural_Doctrine_and_Protected_Invariants_v0_3.md`

Presentation may change. Scoring, publication, wording, confidence, contribution eligibility, and Result orchestration may not. UI reads the existing consumption helpers only.
