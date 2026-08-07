# Cursor reply — Wave 1 Signals Skeleton closure clarification (2026-08-07)

**To:** Founders + Claude review  
**From:** Cursor (implementation)  
**Re:** `20260807_Signals_UAT_Skeleton_Build_30_Feedback_and_Cursor_Reply.docx`

## Status

Clarification remediation is implemented and test-backed. **Not** accepted for integration until Claude adversarial review completes. **No** Build 31. **No** Wave 1 closure tag yet (suggested later: `wave1-signals-skeleton-closure-20260807`).

## KitKat / identity (direct answers)

1. **Does remediation keep KitKat brand + Nestlé parent both available?**  
   **Yes.** Chain is `brand_id=B0060` (KitKat) + `parent_id=P0008` (Nestlé S.A.). They do not compete for a single winning brand node. Parent-scoped Signals can still match `P0008`; KitKat-scoped Signals match `B0060` only.

2. **Product text?**  
   Reviewed `product_name` may refine same-entity Nestlé → KitKat. `generic_name` does **not**. Ambiguity fails closed. Kit Kat / KitKat covered via reviewed alias compact forms. No force-hit / synthetic GTIN / A mutation.

3. **Multiple brand pathways?**  
   **Not** supported as concurrent co-brand chains today (single brand_id + parent_id). Recorded for later Chaining Asset recalibration — not expanded here.

## Transitional

Production `buildProductScanResult` has **one** public behaviour: governed publication records only. `phase6SignalSourceMode` **removed**. Stale transitional props cannot restore Limited Product Data / Web Search / preference cards.

## Evidence / Claude package

Under `workstreamC/uat/wave1-closure/` including new `build30_repository_search_and_callsites.md` (Android NZ-01 artifact documented; no rebuild).

Terminology for forward work: **Rveel Dynamic Signals Asset** / **integrated Dynamic Signals build**.
