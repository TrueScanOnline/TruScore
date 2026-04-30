/**
 * One-off: run Workstream A A5 scaffold validation for a pack root (input/ + output/).
 * Usage: npx ts-node --project scripts/tsconfig.json scripts/workstreamA-validate-pack.ts <packRoot> [template|populated]
 */
import path from 'path';
import { runWorkstreamAScaffold } from '../src/identity/workstreamA/scaffoldRunner';

const packRoot = path.resolve(process.argv[2] ?? 'workstreamA/a-data/wave1-v0.11');
const mode = (process.argv[3] as 'template' | 'populated') === 'template' ? 'template' : 'populated';

const result = runWorkstreamAScaffold(packRoot, {
  mode,
  launchUsefulnessNote: 'Founder A-Data Wave 1 v0.11 — validation run (diagnostics only).',
  topGapNotes: [
    'gtin_brand_links.csv and operational_entities.csv: only scaffold header placeholders were supplied (not present in v0.11 handoff list).',
    'enum_dictionary.csv: code-parity file from template pack (A5) — founder pack used separate alias_enums etc.',
    'Founder CSV column naming may differ from A3/A5 required columns; see validation_report.json.',
  ],
});

// eslint-disable-next-line no-console
console.log(
  JSON.stringify(
    {
      ok: result.ok,
      outputRoot: result.outputRoot,
      validationReportPath: result.validationReportPath,
      loadFailureReportPath: result.loadFailureReportPath,
      coverageScorecardPath: result.coverageScorecardPath,
      identityGapReportPath: result.identityGapReportPath,
      catalogueCoverageReportPath: result.catalogueCoverageReportPath,
      candidateQueueSummary: result.candidateQueueSummary,
    },
    null,
    2
  )
);

// Non-zero exit indicates validation findings (diagnostic); outputs are always written.
process.exit(0);
