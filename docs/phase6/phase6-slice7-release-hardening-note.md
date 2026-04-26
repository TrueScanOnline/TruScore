# Phase 6 Slice 7 — Release Hardening / Fixtures / Gates

## Document 6 implementation status

- Fixture taxonomy implemented in `src/__tests__/fixtures/phase6/fixtures.ts` across:
  - `identity`
  - `frozen_benchmark` (foundation represented through prior slice tests; this pack includes cross-layer guard assertions)
  - `dynamic_signals`
  - `cross_layer`
- Fixture metadata and discipline:
  - `fixture_pack_version`: `phase6.pack.v1.0.0`
  - `fixture_schema_id`: `phase6.fixture.schema.v1`
  - severity tags: `P0` / `P1`
  - gate tags: `A`..`E`
  - deterministic fixture clock via `clock_iso` + `nowMs` in builder path
- Release comparison / baseline artifacts:
  - baseline: `src/__tests__/fixtures/phase6/baseline/phase6-baseline.v1.json`
  - run summary: `reports/phase6/fixture_run_summary.json`
  - diff output: `reports/phase6/release_comparison_diff.json`

## Gate wiring

- Test harness: `src/__tests__/golden/phase6.releaseHardening.test.ts`
- Stage-aware gate behavior:
  - `merge`: fail on any P0 fixture failure
  - `release_candidate`: fail on any P0 or P1 failure
  - `public_release`: fail on any P0 or P1 failure
- Gate scripts:
  - `npm run test:phase6:gate:merge`
  - `npm run test:phase6:gate:rc`
  - `npm run test:phase6:gate:public`
- Mandatory typecheck gate:
  - `npm run typecheck` (`tsc --noEmit`)

## Transitional seam closure / containment

- Legacy banner/synthetic feeder:
  - bounded by explicit builder option `phase6SignalSourceMode`.
  - `governed_5b_only` excludes legacy/synthetic feeder outputs for release-governed runs.
  - `transitional` retains current feeder behavior for bounded MVP operation.
- Dedupe ownership:
  - remains intentionally in `src/utils/scanResultPresentation.ts` in Slice 7.
  - mapping/precedence/order remain in `src/signals/signalRenderMapping.ts`.
- Runtime attachments remain transitional and contained:
  - `_shared_identity_context`
  - `_frozen_benchmark_attribution`
  - `_dynamic_signal_publication_records`

## MVP decision notes (explicit)

- Record-scoped dedupe is accepted for MVP:
  - `signal_id` = record identity
  - `dedupe_key` = current render/dedupe collision identity
  - not full cross-source event-scoped consolidation in MVP

## Final governance addendum (Phase 6 closure)

### Doc 6 traceability matrix

| Doc 6 expectation | Fixture coverage | Unit-test fallback (when fixture not direct) | Deferred / bounded |
|---|---|---|---|
| Public market contract (`AU+NZ` not leaked) | `p0-identity-au-nz-public-no-leak` | `resolveSharedIdentityContext.test.ts`, `buildProductScanResult.slice6DynamicSignals.test.ts` | None |
| Frozen benchmark eligibility gate behavior | `p0-frozen-eligibility-gate-b` | `materializeFrozenBenchmarkAttribution.test.ts`, `ethicsBenchmarkAdapter.test.ts` | Authoritative production DB gate enforcement remains external to repo |
| Blocked dynamic record never publicly rendered | `p0-dynamic-blocked-never-public` | `publicationStateEngine.test.ts` | None |
| Deterministic render ordering before release compare | `p0-publication-order-deterministic` | `signalRenderMapping.test.ts`, `buildProductScanResult.slice6DynamicSignals.test.ts` | None |
| Governed release mode disables legacy feeders | `p0-release-mode-disables-legacy-feeders` | N/A (fixture is primary proof) | None |
| Transitional feeder mode remains bounded | `p1-transitional-mode-allows-legacy-feeders` | Slice 6 integration tests (indirect) | Bounded MVP seam |
| Gate severity by stage | Harness gate-level logic in `phase6.releaseHardening.test.ts` | N/A | CI/workflow orchestration remains script-driven in repo |
| Baseline + release comparison artifact discipline | `fixture_run_summary.json` + `release_comparison_diff.json` generation in harness | N/A | External artifact retention policy |

### Governed release mode proof

- `phase6SignalSourceMode` is set by fixture/gate input in `src/__tests__/fixtures/phase6/fixtures.ts`.
- Builder default remains `phase6SignalSourceMode = 'transitional'` in `src/services/buildProductScanResult.ts`.
- Release/public governed proof fixture is `p0-release-mode-disables-legacy-feeders`, executed by `src/__tests__/golden/phase6.releaseHardening.test.ts`.
- Operational truth rule: strict 5B-governed public claim assumes runtime release configuration selects `governed_5b_only`.

### Baseline governance rule

- Baseline file: `src/__tests__/fixtures/phase6/baseline/phase6-baseline.v1.json`.
- Baseline updates are allowed only for intentional, spec-aligned behavior changes, not to mask regressions.
- Required approval for baseline bump:
  - Engineering implementation owner approval, and
  - Product/claims owner approval.
- Required baseline-bump review evidence:
  - reason/rationale in PR,
  - fixture pack/schema versions,
  - regenerated `reports/phase6/fixture_run_summary.json`,
  - regenerated `reports/phase6/release_comparison_diff.json`.

