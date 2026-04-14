# Golden regression / UAT overview (Rveel)

## Purpose

Provide a **named**, versioned baseline so score, signal, confidence, and coverage behavior cannot regress silently across releases.

## Components

| Artifact | Role |
|----------|------|
| [golden-barcode-pack-au.csv](golden-barcode-pack-au.csv) | AU core regression set |
| [golden-barcode-pack-nz.csv](golden-barcode-pack-nz.csv) | NZ core regression set |
| [golden-edge-cases.md](golden-edge-cases.md) | Edge taxonomy + seed barcodes |
| [expected-output-contract.md](expected-output-contract.md) | Schema for frozen expected rows |
| `scripts/golden/` | Optional local runners |
| `npm run test:golden` | Jest contract snapshots only (`scanOutputContract.golden.test.ts`, 7 cases) |
| `npm run test:phase5b` | Golden + `deriveScanTerminalState` + `scanResultPresentation` unit tests (16 total) |

## Workflow (high level)

1. **Baseline capture** — Run app or API harness against golden packs; export actuals to `fixtures/golden/actuals-YYYYMMDD.json` (path TBD when automation lands).
2. **Review** — Product + eng approve snapshot as **last accepted baseline**.
3. **CI / pre-release** — Compare new run to baseline; diff must be triaged.
4. **Promotion** — Merge intentional changes + update baseline in same PR.

## Lane coordination

Golden expectations depend on Lane 1 docs ([source-priority-and-fallback-rules.md](source-priority-and-fallback-rules.md), [scan-output-contract.md](scan-output-contract.md)). Alert-class expectations depend on Lane 2 taxonomy — stub `alert_classes[]` until triggers are final.

## Related

- [update-review-triggers.md](update-review-triggers.md)
