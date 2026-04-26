# Phase 6 Provisional Engineering Skeleton (Docs 2, 2A, 3)

Scope-limited skeleton only. Not a final execution backlog.

Architecture assumptions are fixed for this slice:
- shared identity layer
- separate frozen BBFAW/KTC attribution layers
- no mutation of frozen outputs by dynamic current-state updates
- AU/NZ-first coverage
- benchmark corrections via superseding versions (never history rewrite)

## 1) Proposed Modules / Services / Types / Tables

| Layer | Proposed module(s) | Primary responsibility | Suggested table/type outputs |
|---|---|---|---|
| Shared Identity (Doc 2) | `identity/normalization`, `identity/resolver`, `identity/provenance`, `identity/reviewQueue` | Canonical resolution for product-brand-owner in AU/NZ with confidence/review/ambiguity/provenance. | Tables: `identity_entity`, `identity_brand`, `identity_product`, `identity_alias`, `identity_relationship`, `identity_review_queue`. Type: `SharedIdentityContext`. |
| Coverage & Stewardship (Doc 2A) | `identity/coverageIngest`, `identity/coverageMetrics`, `identity/stewardshipWorkflow` | Shelf-first AU/NZ coverage build, own-label prioritization, and review cadence support. | Tables: `identity_coverage_scorecard`, `identity_seed_source`, `identity_steward_action_log`. |
| Frozen BBFAW (Doc 3) | `benchmark/bbfawSnapshot`, `benchmark/bbfawResolver`, `benchmark/bbfawPublicationGate` | Cycle-versioned frozen benchmark attribution object generation and ethics-use eligibility. | Tables: `benchmark_snapshot`, `bbfaw_seed_map`, `bbfaw_attribution_frozen`, `benchmark_correction_log`. |
| Frozen KTC (Doc 3) | `benchmark/ktcSnapshot`, `benchmark/ktcResolver`, `benchmark/ktcPublicationGate` | Cycle-versioned frozen benchmark attribution object generation and ethics-use eligibility. | Tables: `benchmark_snapshot`, `ktc_seed_map`, `ktc_attribution_frozen`, `benchmark_correction_log`. |
| Cross-layer Safety Guard | `benchmark/freezeGuard`, `benchmark/supersedeVersion`, `benchmark/auditDiff` | Prevent dynamic-state writes to frozen objects and route corrections via superseding versions. | Tables: `frozen_guard_events`, `benchmark_supersede_chain`, `benchmark_version_diff`. |

## 2) Draft Contracts / Objects

### 2.1 SharedIdentityContext (deterministic, one-time per resolution call)

| Field | Type sketch | Notes |
|---|---|---|
| `resolution_key` | `{ gtin, market_key }` | Market key AU/NZ default; AU+NZ only if explicitly valid. |
| `canonical` | `{ product_id, brand_id, current_owner_entity_id? }` | Current owner is present-day context only. |
| `operational_entities` | `{ manufacturer_id?, importer_id?, distributor_id?, licensee_id? }` | Selective, material Safety/Regulatory support only. |
| `quality` | `{ confidence_state, review_state, ambiguity_flags[] }` | Ambiguity is explicit and propagated downstream. |
| `lineage` | `{ source_refs[], alias_hits[], normalizer_version }` | All identity assertions source-traceable. |

### 2.2 FrozenBenchmarkAttributionObject (BBFAW/KTC, per cycle/version)

| Field | Type sketch | Notes |
|---|---|---|
| `snapshot_ref` | `{ benchmark_name, benchmark_cycle, snapshot_version, ownership_cutoff_date }` | Immutable once frozen. |
| `subject_resolution` | `{ canonical_brand_id, benchmark_owner_entity_id, benchmark_owner_legal_name }` | Benchmark owner is cycle-scoped fact. |
| `comparison_context` | `{ current_owner_entity_id?, ownership_divergence_flag }` | Comparison only; does not mutate benchmark owner. |
| `state` | `{ confidence_state, review_state, resolution_status }` | Benchmark-layer states separate from identity-layer states. |
| `eligibility` | `{ publication_eligible_for_ethics, blocker_flags[] }` | Ethics-use eligibility only (not dynamic signal publication). |
| `audit` | `{ lineage_reference, rationale_summary, reviewer_signoff_ref }` | Must support audit and supersede chain. |

### 2.3 BenchmarkSnapshot

`benchmark_name`, `benchmark_cycle`, `assessment_window`, `ownership_cutoff_date`, `report_release_date`, `methodology_ref`, `seed_ref`, `freeze_status`, `freeze_date`, `review_signoff_reference`.

## 3) Recommended Implementation & Migration Order

| Stage | Goal | Deliverable |
|---|---|---|
| S1 | Contract-first skeleton | Add types and empty service interfaces for `SharedIdentityContext`, `BenchmarkSnapshot`, `FrozenBenchmarkAttributionObject`. |
| S2 | Identity normalization unification | Single normalization function + resolver pipeline + provenance capture + ambiguity emission. |
| S3 | Coverage ingestion baseline (2A) | Seed loaders, AU/NZ shelf-first scorecard hooks, own-label review queues. |
| S4 | Frozen snapshot machinery (Doc 3) | Snapshot table, freeze workflow, read-only resolver for BBFAW/KTC attribution object materialization. |
| S5 | Freeze guardrails | Write guard and tests proving dynamic updates cannot change frozen outputs. |
| S6 | Superseding correction path | Supersede-only correction flow with archived original versions and audit diff. |
| S7 | Ethics integration adapter | Scoring consumes deterministic frozen object only (no ad hoc owner re-derivation). |

## 4) Must-Not-Break Invariants

- Frozen benchmark outputs are immutable after freeze; only superseding versions allowed.
- Current owner and benchmark owner are separate fields and never collapsed.
- Dynamic current-state ingestion/moderation cannot mutate frozen BBFAW/KTC outputs.
- Ambiguity is explicit and blocks/downgrades benchmark attribution instead of guesswork.
- AU/NZ market scoping is explicit; AU+NZ cannot be a convenience bucket.
- Every attribution object includes lineage, review state, and rationale/audit references.

## 5) Acceptance Tests For This Slice (Draft)

| Test ID | Scenario | Expected |
|---|---|---|
| T1 | Simple match: current owner equals benchmark owner | Eligible frozen attribution object produced; divergence false. |
| T2 | Acquisition after cutoff date | Current owner changes; benchmark owner remains frozen; divergence true. |
| T3 | Acquisition before cutoff date | Benchmark owner resolves to new owner for that cycle. |
| T4 | Alias added in Shared Identity after freeze | Lookup completeness can improve; existing frozen object unchanged. |
| T5 | Dynamic signals update event | No mutation in frozen attribution tables; guard events log no unauthorized writes. |
| T6 | Ambiguous brand-owner mapping | Resolution blocked/suppressed with explicit blocker flag. |
| T7 | Superseding correction after proven mapping error | New version created, old remains queryable, audit diff recorded. |
| T8 | AU/NZ split ownership | Market-specific attribution resolves without collapsing into AU+NZ. |

## 6) Open Dependencies (Docs 4, 5, 6)

| Dependency | Needed from doc | Why it blocks finalization |
|---|---|---|
| Doc 4: Dynamic signals gating matrix | Exact class behavior for identity/benchmark ambiguity (block/suppress/downgrade/hold). | Needed to finalize downstream interpretation of ambiguity/blocker fields. |
| Doc 5: Field-level annex | DDL, enums, transitions, and machine-readable state definitions. | Needed to lock table schemas, states, and migration scripts. |
| Doc 6: Golden/UAT pack | Canonical fixtures and expected outputs across versions/cycles. | Needed for release gates and regression confidence. |

## 7) Unresolved Decisions (Must Stay Open)

- Final enum sets and thresholds: `confidence_state` / `review_state` / `resolution_status` / `freeze_status`.
- Exact supersede governance policy: who can approve, severity levels, and correction reason taxonomy.
- Scoring fallback policy when `publication_eligible_for_ethics` is false (neutral vs no movement + penalties).
- UI explanation policy for current-owner vs benchmark-owner divergence language.
- Coverage denominator definition for the "80% AU/NZ shelf relevance" target.
- Final source tier trust weights and conflict-resolution precedence.

