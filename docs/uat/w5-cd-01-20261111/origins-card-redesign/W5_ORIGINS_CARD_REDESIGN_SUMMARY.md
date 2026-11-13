# Product Origins card — presentation redesign

**STOP for founder visual approval.**  
No commit · no push · no merge · no build · no release.

## Change class

GREEN presentation-only. Governed origins data, contribution modal, EA, scoring, publication, and Share logic unchanged.

## Visual outcome

Each declaration panel now reads:

1. Heading (`Made in` / `Product of` / …)
2. Existing `CountryFlag` lockup (flag immediately beside country)
3. Natural continuation from existing supporting phrases (no invented percentages)

Multiple declarations stay as separate mint panels.

## Files

- `src/origins/productOriginsCard.ts` — `originConsumerContinuationSentence()` (presentation mapping only)
- `src/components/CountryFlag.tsx` — optional `align="start"` for declaration lockups
- `app/result/[barcode].tsx` — card layout / typography / soft mint panels
- `src/__tests__/unit/origins/productOriginsCard.test.ts`

## Verification

| Check | Result |
|---|---|
| `tsc --noEmit` | Pass |
| Origins card unit tests | **12 passed** |
| Android emulator | Cadbury `9300617064879` with existing UAT contributions |

### Screenshots

- `01-product-origins-card.png` — Made in panel (flag + Antarctica + continuation)
- `02-both-declarations.png` — Made in and Product of as distinct panels

### Confirmed on device

1. Flag paired with country via existing `CountryFlag` / `countryFlagEmoji`
2. Continuations: `With more than 78%…` / `With more than 79%…`
3. Percentages/qualifiers preserved from governed supporting phrases
4. Made in and Product of remain separate
5. Header edit / share / info and Limited confidence / Does this look right? retained
