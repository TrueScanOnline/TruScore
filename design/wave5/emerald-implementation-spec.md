# A · Emerald Perspectives — Result implementation specification

Founder-approved appearance for SCR-RESULT. Source artwork: `CONCEPT-A-Emerald-Perspectives.png`. This file records the implementation specification. It is not another concept board.

Baseline: `f1899c39ab58608a8552ec2d3db58f6ac0b5cb0b` on `wave5/score-experience-20261008`.

Visual approval does not close corrective-package acceptance and does not record BC.

The artwork sets appearance. Governed contracts set content and behaviour. Do not change scoring, publication, contribution eligibility, copy, handlers, or Result orchestration. Do not edit `truScorePresentation.ts` to restyle. Do not substitute the artwork’s photograph for the product image. Preserve every promoted finding, including those below the concept viewport.

The sheets outside the phone frames are board decoration and are not part of the app.

Classification: GREEN presentation. Shared components take an optional Result appearance so overlays and other hosts keep their existing treatment. `styles.card` is not globally replaced.

## Theme

Centralise values in `src/theme/resultPresentation.ts` under `emerald`.

| Role | Light |
| --- | --- |
| Wallpaper | `#087A60` → `#075C4B` → `#043C34` |
| Card | `#FFFFFF` |
| Main text | `#101C36` |
| Secondary text | `#536477` |
| Card border | `#E1ECE8` |
| Action | `#087B68` |
| Neutral question mark | `#59616B` |
| Medallion face | `#FFFFFF` → `#EDF0F2` |
| Data teaser | `#FFFFFF` → `#F0FAF6` |
| Data teaser border | `#C9E7DF` |
| Chevron circle | `#D7F6EC` |

| Pillar | Gradient | Icon | Symbol |
| --- | --- | --- | --- |
| Body | `#FFF3F2` → `#FFD8D5` | `#E95855` | Apple |
| Planet | `#EFFDF5` → `#C3F2E0` | `#008873` | Leaf |
| Claims (Ethics) | `#F7F0FF` → `#DECAFA` | `#8851D8` | Speech |
| Transparency (Open) | `#EFF9FF` → `#C3E8FA` | `#157AC5` | Eye |

Pillar colours are identity, not score bands. Score bands stay on `colors.trust`.

Dark mode keeps the emerald wallpaper. Cards `#182E29`, text `#F0F7F4`, secondary `#BECEC7`, border `#36574B`. Pillar tiles start from the existing dark pillar colours. Do not put `#101C36` on dark surfaces.

Existing dependencies only: `react-native-svg`, `expo-linear-gradient`, Expo vector icons. Live text and controls, not a flattened image.

## Geometry

Use runtime size and safe-area insets. The reference emulator is 1080×2340 at 440 dpi, about 393×851 logical units. A resized concept export is not a React Native unit grid.

- Page inset 16. Card gap 12. Scroll top padding 12 below the safe area.
- Card radius 20. Inner padding 12.
- Product card padding 10, minimum height 84. Photo 64×64, radius 12, contain.
- Name 16/21 weight 700. Brand 13/18. The card grows for long names, capture, badges, and retry.
- Favourite and share move into an optional actions slot. Each hit target is 44×44. Result owns the handlers.
- Share with a score uses `resolveScoreCardShareType(truScore, { publicationSettled })`. Share without a score uses `handleShare('productInfo')`.
- Photo capture, retry, lightbox, and timing callbacks stay.

## Wallpaper

A noninteractive layer behind the loaded Result scroll. The scroll fill is transparent so gutters show the wallpaper. Full-height gradient plus the three specified SVG contours (upper ribbon, shadow, lower contour) in viewBox `0 0 393 851`. `pointerEvents="none"`. Excluded from accessibility. System-bar icons stay readable.

## Score

One centred “Rveel Score” heading from the existing public name, with the existing info control (minimum header height 44, title 20/26). Info still opens the existing explanation.

Layered backing shapes sit behind the white card, reserving 12 above the foreground. They may peek up to 10 above and 4 around the upper corners, inside the page bounds. Suggested paths use viewBox `0 0 400 120`. Pale jade, mint, and lavender, with a thin translucent white edge. No tap and no score meaning.

## Pillars and medallion

Emerald layout is opt-in on `TruScore` (`layout="emerald"`).

Normal geometry:

```
gridWidth = cardWidth - 24
gap = 10
tileWidth = (gridWidth - gap) / 2
tileHeight = 136
gridHeight = 282
discSize = 128
```

Body upper left, Planet upper right, Claims lower left, Transparency lower right. Radius 22. Icon 30. Title 14/19. Value 20/24. Chevron 16 only when `onPillarPress` exists. Text sits toward the outside edge. Fold is 30×30, decorative, clipped, path `M0 0H30V30C21 22 8 26 5 12Z`. Folds do not mean a contribution is required. Planet does not gain a contribution route.

The centre disc is a noninteractive sibling above the tiles and blocks taps on the covered area. Tile hit targets do not extend under the disc. Decorative children are not accessibility controls. The score or status remains readable.

Medallion diameter 128, inner face 108. Rated shows the published score, `/100`, the existing band label, and an arc of radius 54, stroke 7, from 12 o’clock, in the existing band colour. Published zero is `0/100` with no filled arc. Long band labels move below the disc. NR uses the neutral question-mark vector and the governed title and explanation, with no number, band, or arc. Checking keeps the em dash and its own title and explanation. Unavailable stays the current distinct presentation. Mixed NR keeps each published pillar value.

Reflow when font scale is at least 1.3 or the inner grid is under 320: medallion above a two-column auto-height grid. Under 280, one column. Reflow tiles minimum height 112. Do not shrink “Transparency”.

## Confidence, teaser, findings

Confidence keeps eligibility, wording, and the S26 press. Result hit height is at least 44.

Incomplete Product Data keeps its modal opener, text, and eligibility. The teaser loses the red frame: radius 18, padding 12, pale mint border, document icon on a 44 plate, title 15/20, body 13/18, 32 chevron circle. It is not a direct contribution action.

What we found is a white card, padding 12, heading 18/24, row text 15/21, icon 22, chevron 18, row minimum height 48. Stories, order, and destinations stay. The emerald treatment is opt-in because the list is shared with overlays.

Alerts, partial banners, diagnostics, lower cards, and the Disclaimer after Scan Another stay. No new hiding rule during Checking. The Disclaimer remains clear of the tabs.

## Verification

Consumption guards, Result surface tests, and published-state checks. Emulator: Rated and mixed NR at font scale 1.0, one large-text capture, one dark-mode capture, and the bottom of the scroll.
