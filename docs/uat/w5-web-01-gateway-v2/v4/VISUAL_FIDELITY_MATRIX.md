# WEB-01 V4 — Visual fidelity matrix

**Branch:** `feature/w5-web-product-teaser-v2`  
**App refs:** `docs/uat/w5-ui10/A-full-result.png`, `B-hero-dogear.png`, `C-pillar-dogears.png` (+ emulator screencap of Expo session)  
**V3.2 compare:** live `truscoreapi-hzq7zyhi6-…/barcode/9300617064879` and `screenshots/final-two/`

| Surface | Native app (Emerald) | V3.2 web | V4 target |
|---|---|---|---|
| Wallpaper | Multi-stop emerald `#27B899`→`#10957E`→`#087565` + soft ribbons | Flat/near-flat emerald wash | Layered emerald atmosphere + restrained ivory stage |
| Product hero | Mint face `#F7FCFA`→`#DDF3EC`, proud rim `#074F42` 4px, radius 22, photo contain 144×170 | White card, thin dog-ear, weaker rim/depth | App-token mint face, proud rim, multi-cast fold=46 peel, stronger photo well |
| Dog-ear | RN-SVG flap/cast/crease from `dogEar.ts` fold=46 | Simplified single flap SVG | Same path strings + cast layers; crease approximated |
| Score frame | Backing sheets `#E6E0D4` / `#9FCBBC`, face mint stack, rim 5px | Single white card | Dual backing sheets + face gradient + rim |
| Pillars | Diagonal 3-stop gradients, MCI glyphs 34, tile r=22, h=138, gap=10 | Soft pastels + mist bars | App colour stops, identity row + glass veil (no score bars), peels |
| Medallion | Concentric white disc + live score arc | Flat lock circle | Glass concentric disc + discovery lock cue — **no number** |
| Typography | Brand 11/700 tracking 1.4; name 28/700; pillar 14/700 | Generic web weights | Closer optical sizes/weights; Inter/system stack only if brand font unavailable |
| Desktop | Phone-first scroll | Large empty emerald flanks | Constrained stage, tighter two-column optical balance |

## Cannot claim exact fidelity
- Expo MaterialCommunityIcons / Ionicons font metrics  
- Full RN-SVG TileArt clip + multi-offset cast stack  
- Live score arc / band colour (forbidden on public gateway)  
- Platform shadow / elevation divergence  

## Source image note
Cadbury uses OFF catalogue front for barcode `9300617064879`. V4 may prefer `.full.jpg` when the API supplies a `.400.jpg` of the **same** OFF asset. No fabricated packaging.
