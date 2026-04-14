# Runtime observability plan

**Goal:** Every scan path can answer: *what happened, how fast, why empty, and whether fallbacks/alerts are trustworthy.*

## Existing instrumentation (baseline)

| Mechanism | Location / use |
|-----------|----------------|
| `powershellLogger` / structured logs | `productServiceOptimized`, `manualProductService`, etc. |
| `logPerformanceMetrics` | Optimized fetch timing |
| `SOURCE_TRACE_INFO` / fetch trace | Per-source outcomes in optimized path |
| Client analytics hooks | If present via `src/services/analytics` — align event names with tables below |

## Required events / dimensions

### Per-source latency

- **Fields:** `barcode`, `market`, `source_id`, `phase`, `duration_ms`, `status` (ok | timeout | error | skipped), `http_status` if applicable.
- **Use:** SLA tuning, source deprecation, AU vs NZ comparison.

### Per-scan timing

- **Fields:** `scan_id`, `barcode`, `ttfs_ms`, `ttfvs_ms`, `ttfa_ms`, `terminal_state` (success | partial | error | offline).
- **Use:** Performance budgets [performance-budgets.md](performance-budgets.md).

### Empty-result causes

- **Fields:** `reason_code` (invalid_barcode | not_found | network | rate_limit | auth | region_block | parser_error).
- **Use:** Support triage, data gaps, store listing QA.

### Fallback usage

- **Fields:** `fallback_apis_enabled`, `completeness_before`, `sources_called[]`, `confidence_after`.
- **Use:** Prove fallback policy is not over-triggered.

### Timeout outcomes

- **Fields:** `layer` (source | phase | global), `source_id`, `partial_fields_present[]`.
- **Use:** Correlate with user-reported “wrong score then changed”.

### Alert-generation timing

- **Fields:** `alert_class` (taxonomy), `computed_at` (relative to scan phases), `inputs_hash` (privacy-safe fingerprint of inputs).
- **Use:** Lane 2 governance — alerts must not fire on stale intermediate objects unless spec allows.

### Confidence / coverage outcomes

- **Fields:** `completeness_score`, `confidence`, `coverage_flags[]`, `limited_data_shown` (bool).
- **Use:** Golden UAT diffing [expected-output-contract.md](expected-output-contract.md).

## Dashboards (recommended)

1. **Scan health** — p50/p90 TTFS, TTFA, error rate by market.
2. **Source health** — timeout %, latency by source.
3. **Trust** — % scans with limited-data banner; fallback invocation rate.

## Privacy

- Avoid logging full ingredient text in production analytics; use hashes or lengths.
- Barcode logging: acceptable for internal ops; aggregate for public metrics.

## Implementation priority

1. Unify scan_id across fetch + score + alert pipeline.
2. Emit terminal snapshot once per scan (dedupe).
3. Wire alert timing after Lane 1 rules are frozen for trigger logic.
