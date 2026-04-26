# Phase 6 Slice 6 — ProductScanResult.signals integration

## Scope delivered

- `buildProductScanResult` now accepts 5B outputs (`dynamicSignalRecords`) and maps them into `ProductScanResult.signals`.
- Mapping and ordering use only `src/signals/signalRenderMapping.ts` owner functions:
  - `sortPublicationRecordsForRender`
  - `isPublicationRecordPubliclyRenderable`
  - `mapPublicationRecordToSignalCard`
  - existing `mapSignalCardToBucket`
- Public render inclusion is strict: only `signal_publication_state === 'publishable'` enters scan signals.
- No UI entrypoint changes and no parallel public list path added.

## Single-owner anti-drift

- Builder does not apply class gates, staleness, mislink, or editorial logic. Those remain 5B concerns.
- Builder consumes 5B state as-is and only performs owner-module mapping + bucket partition + dedupe.
- Transitional legacy banner path remains active in this slice (`generateBannerAlerts` + synthetic cards),
  but only as an internal feeder into the same `ProductScanResult.signals` builder path. This is treated
  as an approved transitional condition and must be bounded/retired under Slice 7 gate hardening.

## Ordering / dedupe for release comparison

- Deterministic pre-dedupe ordering for publication records is owner-defined:
  1) mapped class order (`A`, `B`, `C`, `D`)
  2) `dedupe_key` lexicographic
  3) `signal_id` lexicographic
- `dedupeSignalCards` then applies existing contract dedupe behavior (by `dedupe_key`, highest severity on collision).
- Dedupe ownership is intentionally retained in `src/utils/scanResultPresentation.ts` through Slice 7.
  Mapping/precedence ownership remains in `signalRenderMapping.ts`; if dedupe centralization is changed,
  it must be done explicitly in one controlled move.

## Contract safety

- Additive only: no `ProductScanResult` shape break.
- `ProductScanResult.market` remains public `AU | NZ | UNKNOWN` only; no `AU+NZ` leakage.

## Transitional wiring

- Optional internal field on `ProductWithTrustScore`:
  - `_dynamic_signal_publication_records?: DynamicSignalPublicationRecord[]`
- Used only as temporary plumbing fallback when `dynamicSignalRecords` option is not passed.

## Tests

- `src/__tests__/unit/services/buildProductScanResult.slice6DynamicSignals.test.ts`
- `src/__tests__/unit/signals/signalRenderMapping.test.ts` (owner mapping and deterministic ordering additions)
