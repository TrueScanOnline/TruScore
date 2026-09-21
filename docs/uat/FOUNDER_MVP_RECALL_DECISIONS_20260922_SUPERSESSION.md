# Founder MVP recall decisions — 22 September 2026 (supersession)

**Status: ACTIVE. This note is the governing recall authority for MVP.**

It supersedes `docs/uat/FOUNDER_MVP_RECALL_DECISIONS_STAGE2_CONTROL_20260805.md` for everything on the
consumer scan path. The 5 August 2026 note is retained as **historical provenance only** — its Stage 2
five-state match control (`confirmed_affected` / `batch_check_required` / `batch_not_listed` /
`related_recall_variant_unconfirmed` / `not_applicable`), its manual batch and best-before entry screen, and
its markings-driven severity are **no longer part of the active product**.

## What triggers a recall card at MVP

A governed Safety & Regulatory Signal displays when, and only when:

1. **Chaining resolves the scanned product's brand/parent.** Chaining remains brand / parent / alias /
   hierarchy only. It carries no product, pack, batch, date or GTIN knowledge. Unresolved identity fails
   closed — no speculative recall.
2. **The scanned product name matches one governed product-line descriptor** for a reviewed Workstream C
   signal target, in the scanned market.

That is the whole trigger. Product scope is expressed as one or more **alternative** reviewed
`product_name` descriptors for the same recalled line (OR across descriptors, e.g. "cage free eggs" /
"cage-free eggs", or the six MPI Vogel's lines). There are no AND scope groups, no `scope_group_id`, and no
`pack_quantity` conjunction.

## What is content, not a trigger

Affected pack size, batch codes, best-before dates, retailer and state are **qualification content on the
card**, carried by the Signal's own founder-approved editorial fields
(`signal_headline` → title, `signal_summary` → body, `scope_qualification` → why/scope line).

Example (SIG-SR-AU-008): the card shows "Recall: Brie Mon Sire 1kg" with "Only the 1kg product sold at
Foodland Brighton in South Australia with best before 13 October 2026 is affected. Check the date on your
pack." The card tells the consumer what to check; it never asserts that the physical pack in their hand is
definitely affected, and never asserts it is safe.

## Explicit decisions

| Decision | Ruling |
|---|---|
| Recall trigger | Governed product / product line after Chaining |
| Pack size, batch, date, retailer | Card qualification content |
| Manual batch / best-before entry | **Removed** from the consumer path (`FoodRecallMarkingsEntry` retained unrendered for provenance) |
| Stage 2 match-state progression | **Retired** from the active publish path |
| `needs_batch_entry` | Always false |
| Universal GTIN requirement for display | **No** — GTIN-level eligibility is not required to show a relevant recall |
| Chaining scope | Brand / parent / aliases / hierarchy only, unchanged |
| Signal-specific application logic | Prohibited — matching stays fully data-driven |

## Runtime shape

One ordinary Dynamic Signals Safety path: Asset → `ProductScanResult.signals`.

- `buildDynamicSignalsAssetPublicationRecords` publishes Safety product/product_family targets like any
  other Signal class; `requiresFoodRecallMatcherEligibility` is retired and always returns `false`.
- `buildAssetGovernedFoodRecallPublicationRecords` returns `[]` and logs
  `mvp_recall: stage2_matcher_retired`, so no overlay can duplicate or downgrade the governed card.
- `evaluateStructuredFoodRecallMatch` and the Stage 2 pack files remain in the repository for provenance
  and are unwired from consumer publication.

## Unchanged

NA-022 stale-Signal clearing on Core Truth authority loss, Anchor alias handling, KTC, BBFAW, commentary,
scoring, Wave 3 and the Claims / Body / Planet / Open / TruScore surfaces are untouched by this note. Dual
UAT (AU TestFlight, NZ Expo Go) flags are unchanged.
