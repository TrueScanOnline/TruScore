# Phase 6 Slice 3 Frozen Benchmark Machinery Note

Slice 3 introduces frozen benchmark machinery and ethics adapter behavior.

## Delivered in Slice 3

- Benchmark snapshot selection (`BBFAW`, `KTC`) via `snapshotSelect` (static in-code list). The registry is a **bounded MVP mechanism**: sufficient for this slice, not the final governance/persistence/approval model for production cycles.
- `FrozenBenchmarkAttributionObject` materialization with:
  - benchmark owner vs current owner separation
  - ownership divergence flag
  - deterministic `ethics_scoring_eligible` from a **bounded, enum-backed** set of `resolution_status` values (`src/benchmark/ethicsScoringEligibility.ts`), not a loose "resolved" phrase in ad hoc code
- Ethics adapter path that uses frozen benchmark context and applies deterministic **zero benchmark movement** for all ineligible cases (no per-benchmark nuance unless explicitly approved later).

## `_frozen_benchmark_attribution` (transitional)

Mirrors the Slice 1 stance on `_shared_identity_context`: using an internal attachment is acceptable for this stage. It is **temporary runtime plumbing** — not the target authoritative persistence model — to be replaced or formalized once Slice 4+ persistence architecture lands. Documented on `ProductWithTrustScore` in `src/types/product.ts`.

## Benchmark owner precedence (locked)

When materializing, benchmark owner is resolved as:

1. **Explicit** `phase6_benchmark_owner_entity_id` on the product, when set — **takes precedence**.
2. **Otherwise** the pre/post **ownership cutoff** rule applies (see `resolveBenchmarkOwner` in `src/benchmark/materializeFrozenBenchmarkAttribution.ts`).

## Boundaries preserved

- Slice 4 provides freeze guards, supersede correction path, and audit/diff; Slice 3 does not implement in-place write blocking.
- No Dynamic Signals publication logic in this slice.
- No product UI explanation work in this slice.
