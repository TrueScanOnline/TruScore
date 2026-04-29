import fs from 'fs';
import path from 'path';
import { runWorkstreamAScaffold, writeTemplatePack } from '../src/identity/workstreamA';

const packRoot = path.resolve(process.cwd(), 'workstreamA', 'a-data', 'smoke-pack-v0');

if (fs.existsSync(packRoot)) {
  fs.rmSync(packRoot, { recursive: true, force: true });
}

writeTemplatePack(packRoot);
const result = runWorkstreamAScaffold(packRoot, {
  mode: 'template',
  launchUsefulnessNote: 'Smoke test template-mode run.',
  topGapNotes: ['Template mode does not contain populated rows.'],
});

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
