# Product Origins Feature Card V2 — visual handoff

**Status:** STOP for founder / ChatGPT visual review  
**Scope:** Presentation only (no EA / scoring / contribution / share / confidence logic changes)  
**Git:** NO COMMIT / PUSH / MERGE / BUILD / RELEASE

## Evidence files

| File | Purpose |
|------|---------|
| `01-android-final.png` | Full Android emulator screenshot |
| `01-android-final-card.png` | Cropped Product Origins card |
| `02-approved-reference.jpg` | Approved Concept V2 reference |
| `03-side-by-side.png` | Impl vs reference (same width) |
| `04-overlay-50.png` | 50% overlay comparison |
| `00-poor-before.png` | Rejected prior implementation |
| `iter1`–`iter4` assets | Intermediate QA iterations |

## Stage 1 — major gaps vs rejected “Poor result”

1. Flat mint fill → needed layered mint→turquoise→emerald gradient  
2. Tiny flat arrow tag → needed dimensional emerald→turquoise ribbon (~50% width)  
3. Two faint circles → needed large globe meridians/latitudes + dotted orbit  
4. Single corner blob → needed flowing lower-right emerald/turquoise/white curves  
5. Weak depth → needed light border, inner highlight, soft elevation  

## Corrections applied (iterations 1–5)

1. **Ribbon:** SVG path with chevron tip, deep→bright horizontal gradient, tip accent, top highlight, shadow; width ~52% of panel  
2. **Panel fill:** Multi-stop SVG linear + radial mint/aqua/emerald + top-left luminosity  
3. **Globe:** Large upper-right watermark with meridians, latitudes, dotted orbital  
4. **Lower-right:** Layered wave fills + white/turquoise hairline strokes (behind content)  
5. **Depth:** ~22dp radius, light border, inner highlight ring, soft shell shadow  
6. **Typography:** Larger country lockup; percentage emphasis preserved via existing splitter  

## Files changed

- `src/components/ProductOriginsDeclarationPanel.tsx` — rebuilt panel + ribbon  
- `src/components/ProductOriginsPanelDecoration.tsx` — **new** decoration-only SVG layer  
- `src/components/CountryFlag.tsx` — hero size/weight (presentation)  
- `src/origins/productOriginsCard.ts` — `splitOriginContinuationForEmphasis` (unchanged wording)  
- `app/result/[barcode].tsx` — mounts declaration panel (content props unchanged)  

## Tests

- `npx tsc --noEmit` — pass  
- Origins unit tests — 11/11 pass  

## Remaining visual limitations (honest)

Compared with the marketing-style Concept PNG, RN/SVG still cannot fully match:

1. **Ribbon “fold” luminosity** — tip is brighter but not identical to the reference’s glass/fold highlight  
2. **Mesh-like background richness** — concept uses painterly multi-zone colour; we approximate with linear/radial stops  
3. **Hairline wave finesse** — vector strokes are close but less organic than the concept illustration  
4. **Exact iconography** — Ionicons factory/box vs concept line icons  

Further pixel-matching would likely need a designer-authored decoration asset (no product text) rather than more CSS/SVG approximation.

## Acceptance checklist (agent view)

- [x] Ribbon closer to reference (gradient + chevron + shadow)  
- [x] Layered gradients visible  
- [x] Globe grid recognisable + dotted orbit  
- [x] Lower-right curved highlights present  
- [x] Borders/shadows add depth  
- [x] Flag + country from existing governed display  
- [x] Wording unchanged (78%/79% Antarctica example)  
- [x] Both declarations render  
- [x] Dynamic height / no fixed content clip  
- [x] No functionality changes  
- [x] TypeScript + regression tests pass  
- [ ] **Founder final visual approval** — pending  
