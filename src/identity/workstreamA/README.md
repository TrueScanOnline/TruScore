# Workstream A Scaffolding (A5 v0.3)

This module implements Workstream A scaffolding only:

- CSV-first pack loading (`input/*.csv`)
- A3-aligned enum/schema validation
- Cross-file integrity checks
- Deterministic catalogue-audit normalization and exact matching
- Generated reports (`validation_report.json`, `load_failure_report.json`, `coverage_scorecard.json`, `identity_gap_report.json`, `catalogue_coverage_report.csv`)

## Out of Scope by Design

- No canonical row population or inference
- No candidate auto-promotion
- No benchmark/frozen benchmark logic
- No Signals polling/publication logic

## Smoke Command

Run:

`npm run workstreamA:smoke`

This generates a template-mode pack at `workstreamA/a-data/smoke-pack-v0` and writes scaffold outputs under its `output/` folder.
