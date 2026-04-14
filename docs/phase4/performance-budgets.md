# Performance budgets (Rveel scan runtime)

**Status:** Targets for product and QA; implementation may iterate. Budgets are **non-functional requirements** for trust: missed budgets force “limited data” / confidence downgrades per [confidence-and-coverage-rules.md](confidence-and-coverage-rules.md).

## Definitions

| Term | Meaning |
|------|---------|
| **Time to first product shell (TTFS)** | From scan submit to first non-skeleton product UI (name or placeholder + market context). |
| **Time to first visible score (TTFVS)** | First render of a numeric trust score (may be provisional). |
| **Time to full analysis (TTFA)** | All enabled phases complete OR terminal timeout with explicit terminal state. |

## Target budgets (mobile, 4G median)

| Metric | Target (p50) | Stretch (p90) | Hard cap (must not exceed without terminal state) |
|--------|--------------|---------------|-----------------------------------------------------|
| TTFS | ≤ 400 ms | ≤ 900 ms | 3 s |
| TTFVS | ≤ 800 ms | ≤ 1.5 s | 4 s |
| TTFA | ≤ 3 s | ≤ 6 s | 12 s total scan budget |

**Wi‑Fi** may be ~30% faster; **offline** uses cache/SQLite only — TTFA = instant if hit, else user messaging.

## Timeout thresholds

| Layer | Purpose | Default guidance |
|-------|---------|------------------|
| Per-source | Isolate slow APIs | 2–5 s per source (tune by source SLA) |
| Phase | Bound Phase 1 vs 2/3 | Align with `PHASE_TIMEOUT_MS` in code |
| Global scan | Avoid infinite spinner | ≤ hard cap row above |

When a phase times out, emit observability (see [runtime-observability-plan.md](runtime-observability-plan.md)) and set **partial** or **limited-data** flags on the output contract.

## Stale-data thresholds

| Store | Suggested staleness |
|-------|---------------------|
| Memory cache | Minutes (see `productCacheService` TTL) |
| SQLite row | Hours to days — product-type dependent |
| “Fresh enough for score” | If age &gt; threshold, show score with **data freshness** disclosure or refetch in background |

Exact TTLs should be documented in code comments and mirrored here when changed.

## Fallback thresholds

- Fallback APIs run only when **feature flag on** AND **completeness &lt; 70%** (current code rule).
- Budget: fallbacks must not add more than **+2 s** to p90 TTFA without explicit “still loading” UX.

## Review cadence

Revisit this file when:

- New markets or sources ship.
- Alert latency SLOs are added.
- User research shows perceived slowness at lower measured times (UX copy / skeleton tuning).
