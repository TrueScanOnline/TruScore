/**
 * One-off: read KTC scoring spec sheet and dump all tabs for inspection.
 * Run: npx ts-node --project scripts/tsconfig.json scripts/readKTCScoringSpec.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

const ROOT = path.join(__dirname, '..');
const SPEC_PATH = path.join(ROOT, 'Database files', 'ETHICS Pillar', 'KTC folder', 'KTC scoring spec sheet (Ours).xlsx');
const OUT_PATH = path.join(ROOT, 'docs', 'KTC_SCORING_SPEC_EXTRACTED.md');

function main(): void {
  if (!fs.existsSync(SPEC_PATH)) {
    console.error('Not found:', SPEC_PATH);
    process.exit(1);
  }
  const workbook = XLSX.readFile(SPEC_PATH, { type: 'file', cellDates: true, cellNF: false });
  const lines: string[] = [
    '# KTC Scoring Spec Sheet – Extracted',
    `**File:** \`${path.basename(SPEC_PATH)}\``,
    `**Read:** ${new Date().toISOString()}`,
    '',
  ];
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { defval: '', header: 1 });
    lines.push(`## Sheet: "${sheetName}"`);
    lines.push('');
    for (const row of rows as any[][]) {
      const line = Array.isArray(row) ? row.map((c) => (c == null ? '' : String(c))).join('\t') : String(row);
      lines.push(line);
    }
    lines.push('');
  }
  const dir = path.dirname(OUT_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(OUT_PATH, lines.join('\n'), 'utf-8');
  console.log('Written:', OUT_PATH);
}

main();
