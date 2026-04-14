# Data ops — recall matching rules

## Source hierarchy

1. **National authority feed** for product market (AU vs NZ — correct jurisdiction).
2. **Aggregator** only if authority unreachable — label as secondary in UI.
3. **Manual curation** for edge cases — highest human review.

## Matching precedence

1. **GTIN / barcode exact** on recall record → strongest match; P0 surface.
2. **Batch + lot** if present on product and recall.
3. **Brand + product name fuzzy** → **uncertain** — Class A with “verify” copy, not definitive “your batch recalled.”
4. **Brand-only** → **suppress** definitive alert; show optional “check official list” link (jurisdiction).

## Geography

- Match recall **jurisdiction** to product **sold_in** or user market; never show AU-only recall to NZ user without explicit cross-border applicability on record.

## Uncertainty

- Emit `match_confidence`: exact | batch | fuzzy | none.
- UI maps to [alerts-v2-taxonomy.md](alerts-v2-taxonomy.md) Class A variants.

## Recency / expiry

- **Active** by authority dates only.
- **Withdrawn** recall → remove P0 within SLA (e.g. 24h after authority update).

## Suppression

- Suppress duplicate P0 for same `recall_id` + `gtin`.
- Suppress if product is **delisted** and recall explicitly excludes remaining stock (rare — manual).
