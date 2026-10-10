# Wave 5 Emerald — what is on this branch

Read this before the older screenshots. The rendered Result is rejected. Visual acceptance has not been recorded.

## Git

- Repository: https://github.com/TrueScanOnline/TruScore
- Branch: `wave5/score-experience-20261008`
- Parent commit before this handoff: `f1899c39ab58608a8552ec2d3db58f6ac0b5cb0b`
- This commit publishes the previously uncommitted Emerald Result presentation so it can be reviewed from GitHub.
- Do not treat a passing test as visual acceptance.
- Corrective-package acceptance and BC stay separate from this screen.

## Approved artwork

`design/wave5/A_Emerald_Perspectives.png`

The coloured sheets drawn outside the two phone frames are board decoration. They are not part of the app. The right-hand phone’s all-dash pillars are illustrative. A live mixed NR result must keep independently published pillar values.

## Current rendered screen

These emulator captures are the current uncommitted-then-published build. Pixel 5, 1080×2340, density 440, font scale 1.0, light theme. They are the only “current SCR-RESULT” images.

| File | What it shows |
| --- | --- |
| `design/wave5/APP-emerald-craft-rated-font1.0.png` | Rated Dairy Milk, barcode 9300617064879, from the top of the scroll |
| `design/wave5/APP-emerald-craft-mixed-nr-font1.0.png` | Coca-Cola 9300675001113, overall unrevealed, from the top of the scroll |
| `design/wave5/APP-emerald-craft-compare.png` | Artwork and those two screens at equal width |
| `design/wave5/APP-emerald-craft-curl.png` | Current pillar corner |
| `design/wave5/APP-emerald-craft-ref-curl.png` | Artwork pillar corner |
| `design/wave5/APP-emerald-craft-sheets.png` | Current backing sheets |
| `design/wave5/APP-emerald-craft-ref-sheets.png` | Artwork backing |
| `design/wave5/APP-emerald-craft-medallion.png` | Current score medallion |
| `design/wave5/APP-emerald-craft-ref-medallion.png` | Artwork medallion |

Other PNGs in `design/wave5/` are earlier rejected captures. Do not describe them as the current screen.

## Source that draws this screen

- `src/components/product/emerald/EmeraldScoreComposition.tsx` — tiles, curl, medallion, font-scale layout
- `src/components/product/emerald/EmeraldScoreFrame.tsx` — heading, three backing sheets, white card
- `src/components/result/EmeraldWallpaper.tsx` — wallpaper
- `src/theme/resultPresentation.ts` — colours, type, spacing
- `src/components/product/ProductHeroSection.tsx` — identity card and 72dp photo
- `app/result/[barcode].tsx` — mounts the Result. Layout and styling only. Do not move hooks or change handlers.

`src/components/result/EmeraldScoreBacking.tsx` is not mounted.

At font scale 1.0 the medallion stays centred on the four tiles. At font scale 1.3 or above it moves above the tiles. That rule is intentional.

Wallpaper tokens: light `#27B899`, main `#10957E`, deep `#087565`.

The SVG pillar corner is not a match for the artwork’s pointed page peel. Do not tell Cursor to accept the current crescent as the fold.

## Governance copies

These copies are for review on GitHub. The Desktop originals remain the founder’s copies.

- `design/wave5/plan/Rveel_Wave5_Master_Plan_v1_1.md`
- `design/wave5/plan/Rveel_Wave_5_Architectural_Doctrine_and_Protected_Invariants_v0_3.md`

Presentation may change. Scoring, publication, wording, confidence, contribution eligibility, and Result orchestration may not. UI reads the existing consumption helpers only.
