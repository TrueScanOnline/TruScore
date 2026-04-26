# Phase 6 Slice 5B — Publication state engine and class gating

## Scope (tight)

- **In:** `DynamicSignalPublicationRecord` with `signal_id`, `dedupe_key`, `signal_publication_state` (Doc 5 literals), `state` (shared identity / quality), **class-specific gating**, **XL-02** (blocked / needs_review vs `publishable`), **staleness** (`valid_until` + `applyStalenessExpiryIfDue` with **injected clock**), **editorial** hooks (`scheduleEditorial`), **mislink** reports (`recordMislinkReport` downgrades `publishable`), **5B `lineage_reference`**: `phase6:pub:signal:{signal_id}` plus optional link to 5A `ingestion_candidate_lineage_ref`. **5B alone** may assign publication fields; **5A** types omit them.
- **Out:** Public UI rendering, `signalRenderMapping` bucket duplication, `buildProductScanResult` integration beyond what tests need, 5A ingestion redesign, identity **heuristics** / best-guess shortcuts.

## Where `signal_id` and `dedupe_key` are created

- `src/dynamicSignals/publish/signalIdentity.ts` — `buildPublicationDedupeKey(ingest)` → `p6|{class}|{gtin}|{market}|{source_system}|{source_record_id}`; `buildSignalId(dedupeKey)` → `p6s-{fnv1a32}` (stable, not the 5A `raw_fingerprint`).
- `materializePublicationFromCandidate` is the only constructor that should attach `signal_id` + `dedupe_key` to a first-class **publication** row from a 5A `IngestedSignalCandidate`.

## Class gating (MVP policy in code)

- **safety_regulatory** — `publishable` only if `resolution_status` is `resolved` or `resolved_with_warning`, not `blocked` / `needs_review` / (ambiguous: held), and `confidence_state` not `rejected`. Ambiguous + safety → initial `held_for_review`.
- **in_the_news** — additionally requires `review_state === 'reviewed'` for `publishable`.
- **my_choices_chain** — requires `MyChoicesChainContext` with `is_chain_linked: true` and a non-`seeded`/`provisional` `review_state` for `publishable` (pack: chain-dependent).

Rationale: rules live in `classGatePolicy.ts` and are re-used by `tryApplyPublicationIntent` for `to_publishable`.

## `blocked` / `needs_review`

- Initial materialization: `blocked` → `suppressed`; `needs_review` → `held_for_review`.
- `tryApplyPublicationIntent(…, { type: 'to_publishable' })` **fails** if `resolution_status` is `blocked` or `needs_review` (and if mislink, staleness, or class gates fail).

## Staleness / expiry

- `valid_until` from `computeValidUntilIso(class, clock)` (MVP: safety 365d, news 7d, my_choices 90d from **materialization** clock).
- `applyStalenessExpiryIfDue(record, clock)` → `expired` when `clock.nowIso() > valid_until` and state is not already `suppressed` (terminal) / already `expired`. **No `Date.now()`** in these paths in tests.

## Editorial

- `scheduleEditorial` sets / raises `editorial` priority, `due_at`, and (unless `expired`) `held_for_review` for the publication record.

## Mislink

- `recordMislinkReport` increments `mislink.open_report_count` and, if the record was `publishable`, forces `held_for_review`. Further `to_publishable` is blocked while `open_report_count > 0`.

## 5A vs 5B

- Tests verify 5A `IngestedSignalCandidate` has no `signal_id` / `dedupe_key` / `signal_publication_state` until `materializePublicationFromCandidate` runs. **5A cannot bypass 5B** to obtain a governed publication row: types + tests.

## Tests

- `src/__tests__/unit/dynamicSignals/publish/publicationStateEngine.test.ts`
- (with) `src/__tests__/unit/dynamicSignals/ingest/candidateIngestion.test.ts` for 5A isolation
