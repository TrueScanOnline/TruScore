# Phase 6 Slice 4 — Freeze guards, supersede path, audit diff

## Enforcement scope (MVP, honest)

- The **in-memory** store and guard events (`FrozenAttributionRowStore`, `freezeGuards`, `computeBenchmarkAttributionDiff`) are **Slice 4–era MVP enforcement** for the current code slice: they give **internal correctness**, regression tests, and a clear contract for a later **persistence** implementation. They are **not** a substitute for full authoritative persistence-layer rules (durable tables, RLS, blocking out-of-app writers) and **do not** on their own justify **overstating** production “frozen DB” maturity (see execution pack truthfulness on external claims).
- `intent` / `result` on freeze-guard events use **bounded constants** in `src/benchmark/freezeGuardEventKinds.ts` (`FREEZE_GUARD_INTENT`, `FREEZE_GUARD_RESULT`) to avoid ad-hoc string drift in logs and tests.

## Scope (what Slice 4 does)

- **In-memory store** (`src/benchmark/frozenAttributionRowStore.ts`): registers frozen benchmark rows; **rejects in-place updates** to an **active** (`freeze_status: frozen` and not superseded in store) row; **applies corrections only** via `applySupersedingCorrection`, which requires a **new** composite key (in practice, a new `snapshot_version` on a full replacement `FrozenBenchmarkAttributionObject`).
- **Row key** (`src/benchmark/frozenAttributionRowKey.ts`): deterministic `benchmark|cycle|snapshot_version|canonical_brand_id` — see file comment for why each part exists and the **under-keying** risk if changed casually.
- **Freeze-guard events** append to an in-process ring buffer (`getFreezeGuardEvents` / `resetFreezeGuardEventsForTests`).
- **Audit diff** (`src/benchmark/auditAttributionDiff.ts`): `computeBenchmarkAttributionDiff` is **comparison-oriented** — field-level path changes, keys, `rationale`, `approver_ref`, `diff_id`, `created_at` — not a **payload-heavy** raw record dump. Avoid growing it into a mutable “full snapshot” blob; value is a clear, immutable **comparison** artifact.
- **Bypass / discipline:** Any call path that **bypasses** the store and freeze-guarded write pattern is **architecturally non-compliant** with the frozen-benchmark model even if a given environment does not (yet) **technically** block it. Intentional persistence must re-home those writes behind the same invariants. Production wiring should not assign over live frozen rows in ad hoc state.
- `FREEZE_GUARD_INTENT` and `FREEZE_GUARD_RESULT` are the single bounded sources for `FreezeGuardEvent.intent` and `.result` for observability and test assertions.

## What is blocked

- `FrozenAttributionRowStore#tryInPlaceUpdate` for a key that is already an **active frozen** row. The stored **object reference** is not mutated: the service/dynamic-refresh path cannot replace the row without supersession. Blocked attempts use `FREEZE_GUARD_INTENT.in_place_update` and `FREEZE_GUARD_RESULT.blocked`.
- Same-key `applySupersedingCorrection` fails unless the composite key changes (new `snapshot_version` / row key).

## Supersede path

- `applySupersedingCorrection(previous, replacement, …)` with a **new** `frozenAttributionRowKey`; the old key is marked `isSuperseded: true` in the store. `computeBenchmarkAttributionDiff` + guard log.

## Out of scope (explicit)

- Dynamic Signals **publication** behavior, product **UI** explanation, expanded **identity coverage** stewardship; **no rewrite** of Slice 3 `ethics_scoring_eligible` / zero movement rules.

## Tests

- `src/__tests__/unit/benchmark/freezeGuardsAndStore.test.ts`
