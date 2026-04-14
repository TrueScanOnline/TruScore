# Golden edge cases (starter list)

Populate expected rows in `fixtures/golden/` as automation matures. Barcode suggestions reference repo seeds where applicable.

## Benchmark-only mapping

- Products known to exist in **reference DB only** — use internal test GTINs when available.
- **Goal:** prove mapping layer without live retailer dependency.

## KTC-only / thin identity

- Barcodes that return **identity only** from open data with no nutrition.
- **Goal:** completeness + limited-data flags.

## Certification edge

- Products with **expired** cert on record.
- Products with **conflicting** cert across sources.

## Recall edge

- **Exact GTIN** recall.
- **Fuzzy brand** recall (must not show definitive P0).
- **Jurisdiction mismatch** (should not surface wrong region).

## Alert-class edge

- Preference hit **without** ingredient list (suppress ingredient-derived preference signals).
- P0 + P2 same screen (priority / styling).

## Confidence / coverage

- Fallback-only path (`EXPO_PUBLIC_ENABLE_FALLBACK_APIS` on, forced low completeness).
- High-confidence merge from multiple agreeing sources.

## Limited data

- Forced timeout mid-phase — expect `limited_data` + partial scores per contract.

## Premium visibility

- Free user: P3 hidden or teaser only.
- Subscriber: P3 visible with badge.

## Short / malformed barcode (negative)

- `94137051`, `949313111` from NZ seed file — use in **negative** harness only (invalid or EAN-8 handling).

## Next steps

- Link each row to `golden_case_id` in [expected-output-contract.md](expected-output-contract.md).
- Add `scripts/barcodes_au_80.txt` remainder for expanded AU soak (non-golden).
