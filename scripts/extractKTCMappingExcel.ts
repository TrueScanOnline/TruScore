/**
 * Extract and analyze the KTC (KnowTheChain) Parent & Brand Alias Mapping workbook
 * Source: Database files/ETHICS Pillar/KTC folder/KTC_2026_Parent_Brand_Alias_Mapping.xlsx
 *
 * Tabs (expected, but we log actual):
 * - KTC_Parents (or Parent_Entities)
 * - KTC_Brand_Alias_Map (or Brand_Alias_Map)
 *
 * Outputs (source of truth for ETHICS KTC scoring):
 * - Database files/ETHICS Pillar/KTC folder/ktcParents.json
 * - Database files/ETHICS Pillar/KTC folder/ktcBrandAliasMap.json
 *
 * Run: yarn extract-ktc-mapping
 * Then: yarn sync-ethics-data to copy JSON into src/data/ethics for the app bundle.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

const ROOT = path.join(__dirname, '..');
const KTC_DIR = path.join(ROOT, 'Database files', 'ETHICS Pillar', 'KTC folder');
const EXCEL_PATH = path.join(KTC_DIR, 'KTC_2026_Parent_Brand_Alias_Mapping.xlsx');

const PARENTS_JSON = path.join(KTC_DIR, 'ktcParents.json');
const ALIAS_MAP_JSON = path.join(KTC_DIR, 'ktcBrandAliasMap.json');

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function main(): void {
  console.log('Reading KTC Mapping Excel:', EXCEL_PATH);
  if (!fs.existsSync(EXCEL_PATH)) {
    console.error('File not found:', EXCEL_PATH);
    process.exit(1);
  }

  ensureDir(KTC_DIR);

  const workbook = XLSX.readFile(EXCEL_PATH, {
    type: 'file',
    cellDates: true,
    cellNF: false,
  });

  const sheetNames = workbook.SheetNames;
  console.log('\nSheet names:', sheetNames);

  // Parent entities sheet
  const parentsSheet =
    workbook.Sheets['KTC_Parents'] ??
    workbook.Sheets['Parent_Entities'] ??
    workbook.Sheets['Parents'];
  let parentsCount = 0;
  let parentsColumns: string[] = [];
  if (parentsSheet) {
    const parents = XLSX.utils.sheet_to_json<any[]>(parentsSheet, { defval: '' });
    parentsCount = parents.length;
    if (parents.length > 0) {
      parentsColumns = Object.keys(parents[0] as object);
      console.log('\n--- KTC Parents ---');
      console.log(`Rows: ${parents.length}`);
      console.log('Columns:', parentsColumns);
      console.log('Sample (first 5 rows):', JSON.stringify(parents.slice(0, 5), null, 2));
    }
    fs.writeFileSync(PARENTS_JSON, JSON.stringify(parents, null, 2), 'utf-8');
    console.log('Written parents JSON to:', PARENTS_JSON);
  } else {
    console.warn('KTC parents sheet not found (expected KTC_Parents / Parent_Entities / Parents)');
  }

  // Brand alias map sheet
  const aliasSheet =
    workbook.Sheets['KTC_Brand_Alias_Map'] ??
    workbook.Sheets['Brand_Alias_Map'] ??
    workbook.Sheets['Brand_Mapping'];
  let aliasCount = 0;
  let aliasColumns: string[] = [];
  if (aliasSheet) {
    const aliasMap = XLSX.utils.sheet_to_json<any[]>(aliasSheet, { defval: '' });
    aliasCount = aliasMap.length;
    if (aliasMap.length > 0) {
      aliasColumns = Object.keys(aliasMap[0] as object);
      console.log('\n--- KTC Brand Alias Map ---');
      console.log(`Rows: ${aliasMap.length}`);
      console.log('Columns:', aliasColumns);
      console.log('Sample (first 10 rows):', JSON.stringify(aliasMap.slice(0, 10), null, 2));
    }
    fs.writeFileSync(ALIAS_MAP_JSON, JSON.stringify(aliasMap, null, 2), 'utf-8');
    console.log('Written brand alias JSON to:', ALIAS_MAP_JSON);
  } else {
    console.warn(
      'KTC brand alias sheet not found (expected KTC_Brand_Alias_Map / Brand_Alias_Map / Brand_Mapping)'
    );
  }

  // Optional: dump any ReadMe / notes sheet to markdown for human inspection
  const readmeSheet = workbook.Sheets['ReadMe'] ?? workbook.Sheets['README'] ?? workbook.Sheets['Notes'];
  if (readmeSheet) {
    const readmeRows = XLSX.utils.sheet_to_json<any[]>(readmeSheet, { defval: '', header: 1 });
    const readmeText = (readmeRows as any[][])
      .map((row) => (Array.isArray(row) ? row.join('\t') : String(row)))
      .join('\n');
    const readmeOut = path.join(KTC_DIR, 'KTC_mapping_readme.txt');
    fs.writeFileSync(readmeOut, readmeText, 'utf-8');
    console.log('\n--- ReadMe / Notes ---');
    console.log(readmeText.slice(0, 1500));
    console.log('\nReadMe exported to:', readmeOut);
  }

  // Summary report (for Cursor / human review)
  const reportPath = path.join(ROOT, 'docs', 'KTC_MAPPING_EXCEL_ANALYSIS.md');
  const report = `
# KTC 2026 Parent & Brand Alias Mapping – Analysis
**Source:** \`Database files/ETHICS Pillar/KTC folder/KTC_2026_Parent_Brand_Alias_Mapping.xlsx\`
**Extracted:** ${new Date().toISOString()}

## Tabs Found (actual workbook)
| Tab | Rows | Notes |
|-----|------|-------|
| KTC_Parents/Parent_Entities | ${parentsCount} | Columns: ${parentsColumns.join(', ')} |
| KTC_Brand_Alias_Map/Brand_Alias_Map | ${aliasCount} | Columns: ${aliasColumns.join(', ')} |

## JSON outputs (source of truth)
- \`Database files/ETHICS Pillar/KTC folder/ktcParents.json\`
- \`Database files/ETHICS Pillar/KTC folder/ktcBrandAliasMap.json\`

Run \`yarn sync-ethics-data\` to copy these to \`src/data/ethics/\` for app bundle.
`;
  ensureDir(path.dirname(reportPath));
  fs.writeFileSync(reportPath, report, 'utf-8');
  console.log('\nReport written to:', reportPath);
}

main();

