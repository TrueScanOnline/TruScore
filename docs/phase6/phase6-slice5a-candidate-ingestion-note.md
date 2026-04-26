# Phase 6 Slice 5A — Source and candidate ingestion

## Scope (tight)

- **In:** Source → typed **`IngestedSignalCandidate`**, stable **`source_record_id`** (via `source_system` + `source_record_id`), **lineage** (`lineage_reference` + `source_refs`), **idempotent** upsert on `idempotency_key`, **injected clock** for tests (`IngestionClock`, fixed / stepping).
- **Out:** **`signal_publication_state` FSM**, editorial gating, class **precedence / suppression**, public-signal **rendering**, **UI**. Those are **Slice 5B+**.

`ingestSourceRecord` does **not** set `SignalPublicationState`, `dedupe_key` as on the final record, or `signal_id` — 5B owns lifecycle and publication fields. **5A cannot “publish”** a signal: `IngestedSignalCandidate` has no `signal_publication_state` field; nothing in this slice advances to `publishable`.

## 1) Ingestion lifecycle vocabulary (bounded, non-publication)

Only `INGESTION_CANDIDATE_LIFECYCLE` in `ingestionCandidateLifecycle.ts`: **`received`**, **`normalized`**, **`rejected_malformed`**. This is **ingestion lifecycle only** — **not** `SignalPublicationState`, **not** a proxy publication FSM, and must not be extended with `candidate` / `held_for_review` / `publishable` from Doc 5.

## 2) Idempotency key (collision boundary)

`source_system|source_record_id|signal_class` is for **ingestion** deduplication: one **candidate** row per upstream source record + class. It does **not** define final **public** dedupe semantics. **`dedupe_key`** and **`signal_id`** for the dynamic signal **record** are created in **Slice 5B** (`buildPublicationDedupeKey` / `buildSignalId`).

## 3) `raw_fingerprint` (candidate-level only)

`content_summary.raw_fingerprint` is for **5A** change detection on re-ingest. It is **not** the final signal identity, not `dedupe_key`, and not publication identity.

## 4) Lineage reference (deterministic)

`phase6:ingest:candidate:${idempotency_key}` is fixed. **Boring, deterministic, not free-form** user narrative.

## 5) Clock injection

Time-sensitive **ingestion** code uses the passed `IngestionClock` (see `ingestionClock.ts` and `ingestFromSourceRecord`). **Staleness / expiry** for the **publication** record is **5B** (`validityPolicy` + `applyStalenessExpiryIfDue`, also clock-injected).

## Record shape (summary)

| Area | Fields |
|------|--------|
| Identity | `candidate_id` (= `idempotency_key` for this slice), `idempotency_key` = `source_system\|source_record_id\|signal_class` |
| Source | `source_system`, `source_record_id` |
| Lineage | `lineage.lineage_reference` (stable), `lineage.source_refs` (ingestion-run tags) |
| Class / resolution | `signal_class` (`NormativeSignalClass`), `resolution_key.gtin`, `market_key` |
| Ingestion only | `ingestion.candidate_lifecycle` (`INGESTION_CANDIDATE_LIFECYCLE` — not publication state), `first_ingested_at`, `last_ingested_at`, `ingestion_run_id` |
| Payload | `content_summary` (title, href, `raw_fingerprint` for change detection) |

## Idempotency and updates

- Same `idempotency_key` → **update** in store: `last_ingested_at` and `ingestion_run_id` refresh; `first_ingested_at` preserved.
- **Content change** (fingerprint) is reported as `content_changed` on success; `source_refs` accrues a new `ingest_run:…` tag when the run id is new.

## Modules

- `src/dynamicSignals/ingest/*` — see `index.ts` for exports.

## Tests

- `src/__tests__/unit/dynamicSignals/ingest/candidateIngestion.test.ts`
