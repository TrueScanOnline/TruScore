# Phase 5B — deferred edge cases & observability notes

## Still deferred (explicit)

| Topic | Reason |
|-------|--------|
| **Full Signals tab / IA redesign** | Out of scope for 5B; contract-first. |
| **Premium insight (class D) content** | No subscriber-only signal layer in UI yet. |
| **Per-recall dedupe inside class A** | Multiple distinct recalls still produce one consolidated banner today; finer `recall_id` dedupe when data model exposes stable ids. |
| **Staleness / cache-age in terminal_state** | `partial` is phase/score-based only; TTL-based “stale” is a future tranche. |
| **Analytics vendor / warehouse schema** | `SCAN_OBS` remains console + `powershellLogger` buffer; no Firebase/Segment schema locked yet. |

## Observability (Phase 5B)

- Payloads include `schema_version: 1` (see `SCAN_OBS_SCHEMA_VERSION` in `src/services/scanObservability.ts`).
- Correlation: `scan_id` + `barcode` + `terminal_state` on `score_ready` / `signals_built`.
- **Deferred:** sampling rate, PII redaction policy beyond “no ingredient blobs”, dashboard wiring.

## Golden harness

- Jest snapshots strip heavy `product` blobs; they are **not** a substitute for full AU/NZ CSV-driven API harness (still deferred).
- `deriveTerminal: false` in tests that assert stable `terminal_state` independent of fetch phase choreography.
