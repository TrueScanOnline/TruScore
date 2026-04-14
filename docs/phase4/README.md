# Phase 4 — Trust Runtime + Alerts v2 + Data Operations + Golden Regression + Engine Stabilization

This folder is the **bounded execution package** for Rveel after Phases 1–3. It does **not** replace the master roadmap; it makes the next tranche of work **explicit, testable, and governable**.

## Two-lane operating model

| Lane | Workstreams | Purpose |
|------|-------------|---------|
| **Lane 1 — Foundation** | A, C, D, E | Runtime, data ops, golden baselines, output/confidence rules |
| **Lane 2 — Alerts design** | B | Taxonomy, IA, hierarchy, entitlements, claim-class mapping |

**Sequencing rule:** Lane 2 may advance in **design/spec** while Lane 1 is documented. **Do not** treat broad new **alert trigger** behavior as release-final until Lane 1 rules (source order, timeouts, fallbacks, confidence) are explicit enough to justify alert truthfulness.

## Deliverables index

### A — Runtime / fetch
- [runtime-fetch-graph.md](runtime-fetch-graph.md)
- [performance-budgets.md](performance-budgets.md)
- [source-priority-and-fallback-rules.md](source-priority-and-fallback-rules.md)
- [runtime-observability-plan.md](runtime-observability-plan.md)

### B — Alerts v2
- [alerts-v2-current-state-map.md](alerts-v2-current-state-map.md)
- [alerts-v2-taxonomy.md](alerts-v2-taxonomy.md)
- [alerts-v2-priority-and-suppression-rules.md](alerts-v2-priority-and-suppression-rules.md)
- [alerts-v2-information-architecture.md](alerts-v2-information-architecture.md)
- [alerts-v2-entitlement-matrix.md](alerts-v2-entitlement-matrix.md)
- [alerts-v2-claim-governance-map.md](alerts-v2-claim-governance-map.md)

### C — Data operations
- [data-ops-canonical-mapping-workflow.md](data-ops-canonical-mapping-workflow.md)
- [data-ops-certification-verification.md](data-ops-certification-verification.md)
- [data-ops-recall-matching-rules.md](data-ops-recall-matching-rules.md)
- [data-ops-moderation-states.md](data-ops-moderation-states.md)
- [data-ops-minimum-admin-contract.md](data-ops-minimum-admin-contract.md)

### D — Golden regression / UAT
- [golden-uat-overview.md](golden-uat-overview.md)
- [golden-barcode-pack-au.csv](golden-barcode-pack-au.csv)
- [golden-barcode-pack-nz.csv](golden-barcode-pack-nz.csv)
- [golden-edge-cases.md](golden-edge-cases.md)
- [expected-output-contract.md](expected-output-contract.md)
- Starter: `scripts/golden/README.md`

### E — Scoring engine / output
- [confidence-and-coverage-rules.md](confidence-and-coverage-rules.md)
- [scan-output-contract.md](scan-output-contract.md)
- [engine-output-drift-review.md](engine-output-drift-review.md)
- [update-review-triggers.md](update-review-triggers.md)

## Out of scope (Phase 4)

Paywall redesign, growth experiments, broad UI polish, repo-wide lint campaigns, full admin product build, bundle/deep-link migrations, store asset production (track on Phase 1 release checklist).
