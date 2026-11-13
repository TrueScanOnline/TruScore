# W5-CARD-ART — founder visual handoff

**STOP for founder / ChatGPT visual approval**  
NO COMMIT / PUSH / MERGE / PR / EAS / OTA / RELEASE

## Baseline

- Branch: `experiment/w5-contribution-delight-20261111`
- HEAD at start: `b239f7e9…` (+ local Product Origins V2 + card-art)
- Checkpoints preserved: RC1 `rveel-w5-rc1-20261111`, W5-CD-01 `w5-cd-01-founder-approved-20261111`, approved Product Origins design
- Classification: **GREEN** presentation-only

## Inventory

See `CARD_INVENTORY.md` (from live Result code, not docs-only).

## Graphical treatments (summary)

| Motif | Used on | Intent |
|-------|---------|--------|
| `heroGlow` | Product Hero | Soft illumination; dog-ear untouched |
| `scoreAura` | Emerald Score frame | Quiet radial rings; score/pillars dominate |
| `discovery` | What we noticed | Corner dots/arcs |
| `nutrition` | Nutrition table | Fine right-side lines only |
| `ingredients` | Ingredients section | Flow curves, low intensity |
| `molecular` | About these Additives | Nodes + links (no hazard symbols) |
| `paper` | Packet Claims | Layered label geometry |
| *(none)* | **Product Origins** | **Unchanged benchmark** |

Reusable module: `src/components/result/ResultCardArt.tsx`  
`pointerEvents="none"` — decoration does not intercept taps.

## Screenshots

| File | Content |
|------|---------|
| `shots/01-hero-score.png` | Score + pillars + highlights |
| `shots/02-mid-highlights-nutrition.png` | Mid-page nutrition/highlights region |
| `shots/03-additives-origins.png` | Ingredients, Additives (molecular), Origins |
| `shots/04-origins-packet.png` | Origins / Packet Claims region |
| `05-contact-sheet.png` | Contact sheet |

Emulator left on Product Display for inspection.

## Files changed (card-art)

- `src/components/result/ResultCardArt.tsx` **(new)**
- `src/components/AboutTheseAdditivesCard.tsx`
- `src/components/product/emerald/EmeraldScoreFrame.tsx`
- `src/components/product/ProductHeroSection.tsx`
- `src/components/NutritionTable.tsx`
- `app/result/[barcode].tsx` (hosts discovery / paper / ingredients art only)

**Not modified:** Product Origins declaration panel implementation (benchmark).

## Validation

- `npx tsc --noEmit` — pass
- Origins regression tests — 11/11 pass
- Android Expo Go visual capture — done (Cadbury Dairy Milk)

## Outstanding limitations

1. Banner alerts / S26 / disclaimer left undecorated (meaning/legal density).
2. MVP-gated Pricing / Allergens / Palm oil card not in live Result surface.
3. Decoration are intentionally ~20–35% of Origins prominence; further polish can raise/lower intensity per card after founder feedback.
4. Hero top-of-page crop in shot 01 is score-forward (scroll position); full hero+score together can be re-shot on request.
