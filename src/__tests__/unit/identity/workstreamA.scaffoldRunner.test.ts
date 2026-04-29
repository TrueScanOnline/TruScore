import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  WORKSTREAM_A_FILES,
  buildTemplateCsvMap,
  matchCatalogueBrandCandidate,
  parseCsv,
  runWorkstreamAScaffold,
  toCsv,
} from '../../../identity/workstreamA';

function writePack(packRoot: string, csvByFile: Record<string, string>) {
  const inputRoot = path.join(packRoot, 'input');
  fs.mkdirSync(inputRoot, { recursive: true });
  for (const [fileName, csvText] of Object.entries(csvByFile)) {
    fs.writeFileSync(path.join(inputRoot, fileName), csvText, 'utf8');
  }
}

describe('Workstream A scaffold runner', () => {
  it('runs template-mode scaffold and emits reports', () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'workstreamA-scaffold-'));
    writePack(tempRoot, buildTemplateCsvMap());
    const result = runWorkstreamAScaffold(tempRoot, { mode: 'template' });
    expect(result.ok).toBe(true);
    expect(fs.existsSync(result.validationReportPath)).toBe(true);
    expect(fs.existsSync(result.loadFailureReportPath)).toBe(true);
    expect(fs.existsSync(result.coverageScorecardPath)).toBe(true);
    expect(fs.existsSync(result.identityGapReportPath)).toBe(true);
  });

  it('matches catalogue candidates with deterministic exact-normalized logic', () => {
    const matched = matchCatalogueBrandCandidate(
      'Kit-Kat',
      [
        {
          brand_id: 'brand:kitkat',
          canonical_brand_name: 'KitKat',
          display_brand_name: 'Kit Kat',
          parent_id: 'parent:nestle',
        },
      ],
      []
    );
    expect(matched.match_status).toBe('matched_canonical_brand');
    expect(matched.matched_brand_id).toBe('brand:kitkat');
  });

  it('keeps enum_dictionary drift visible in populated mode', () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'workstreamA-scaffold-drift-'));
    const templateMap = buildTemplateCsvMap();
    const badEnumRows = parseCsv(templateMap[WORKSTREAM_A_FILES.ENUM_DICTIONARY]).filter(
      (row) => !(row.enum_name === 'review_state' && row.enum_value === 'reviewed')
    );
    templateMap[WORKSTREAM_A_FILES.ENUM_DICTIONARY] = toCsv(
      ['enum_name', 'enum_value'],
      badEnumRows
    );
    writePack(tempRoot, templateMap);
    const result = runWorkstreamAScaffold(tempRoot, { mode: 'populated' });
    expect(result.ok).toBe(false);
    const report = JSON.parse(fs.readFileSync(result.validationReportPath, 'utf8'));
    const issueTexts = report.validation.issues.map((i: { message: string }) => i.message).join(' ');
    expect(issueTexts).toContain('enum dictionary row');
  });
});
