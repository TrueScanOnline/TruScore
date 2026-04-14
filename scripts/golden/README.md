# Golden pack helpers

Phase 4 introduces **documentation-first** golden regression. This folder holds **small, reviewable** utilities.

## Files

- `summarize-golden-packs.mjs` — reads `docs/phase4/golden-barcode-pack-*.csv` and prints counts (no network).

## Usage

From repo root:

```bash
node scripts/golden/summarize-golden-packs.mjs
```

## Jest golden baselines (Phase 5)

Deterministic tests live in `src/__tests__/golden/scanOutputContract.golden.test.ts` with snapshots under `src/__tests__/golden/__snapshots__/`. Run:

```bash
npm run test:golden
npm run test:phase5b
```

Uses frozen `nowMs` for recall windows and in-memory products (no network).

Future: Detox / API harness with frozen clocks — **deferred** beyond Jest.
