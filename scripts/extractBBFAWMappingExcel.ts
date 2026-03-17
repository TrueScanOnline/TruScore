/**
 * Extract and analyze the BBFAW Parent Mapping Excel workbook
 * Source: Database files/ETHICS Pillar/BBFAW folder/BBFAW_2024_Supermarket_Parent_Brand_Mapping_20260311.xlsx
 *
 * Tabs: BBFAW_Parents | Brand_Mapping | Brand_Aliases
 * Output: JSON files for app integration
 */

import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

const ROOT = path.join(__dirname, '..');
const EXCEL_PATH = path.join(
  ROOT,
  'Database files',
  'ETHICS Pillar',
  'BBFAW folder',
  'BBFAW_2024_Supermarket_Parent_Brand_Mapping_20260311.xlsx'
);
/** Primary output: Database files/ETHICS Pillar/BBFAW folder (source of truth). Run sync-ethics-data to copy to src. */
const OUT_DIR = path.join(ROOT, 'Database files', 'ETHICS Pillar', 'BBFAW folder');

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function main(): void {
  console.log('Reading BBFAW Mapping Excel:', EXCEL_PATH);
  if (!fs.existsSync(EXCEL_PATH)) {
    console.error('File not found:', EXCEL_PATH);
    process.exit(1);
  }

  const workbook = XLSX.readFile(EXCEL_PATH, {
    type: 'file',
    cellDates: true,
    cellNF: false,
  });

  const sheetNames = workbook.SheetNames;
  console.log('\nSheet names:', sheetNames);

  ensureDir(OUT_DIR);

  // Tab 1: Parent_Entities (= BBFAW_Parents per user spec)
  const parentsSheet = workbook.Sheets['Parent_Entities'] ?? workbook.Sheets['BBFAW_Parents'];
  let parentsCount = 0;
  if (parentsSheet) {
    const parents = XLSX.utils.sheet_to_json<any[]>(parentsSheet, { defval: '' });
    parentsCount = parents.length;
    console.log('\n--- Parent_Entities (BBFAW_Parents) ---');
    console.log(`Rows: ${parents.length}`);
    if (parents.length > 0) {
      console.log('Columns:', Object.keys(parents[0] as object));
      console.log('Sample (first 3 rows):', JSON.stringify(parents.slice(0, 3), null, 2));
    }
    fs.writeFileSync(
      path.join(OUT_DIR, 'bbfawParents.json'),
      JSON.stringify(parents, null, 2),
      'utf-8'
    );
  } else {
    console.log('Parent_Entities sheet not found');
  }

  // Tab 2: Brand_Alias_Map (canonical brand → parent, and/or alias → canonical)
  const aliasMapSheet = workbook.Sheets['Brand_Alias_Map'] ?? workbook.Sheets['Brand_Mapping'];
  let aliasMapCount = 0;
  let aliasMapColumns: string[] = [];
  if (aliasMapSheet) {
    const aliasMap = XLSX.utils.sheet_to_json<any[]>(aliasMapSheet, { defval: '' });
    aliasMapCount = aliasMap.length;
    if (aliasMap.length > 0) {
      aliasMapColumns = Object.keys(aliasMap[0] as object);
      console.log('\n--- Brand_Alias_Map ---');
      console.log(`Rows: ${aliasMap.length}`);
      console.log('Columns:', aliasMapColumns);
      console.log('Sample (first 10 rows):', JSON.stringify(aliasMap.slice(0, 10), null, 2));
    }
    fs.writeFileSync(
      path.join(OUT_DIR, 'brandAliasMap.json'),
      JSON.stringify(aliasMap, null, 2),
      'utf-8'
    );
  } else {
    console.log('Brand_Alias_Map sheet not found');
  }

  // Tab 3: ReadMe (instructions)
  const readmeSheet = workbook.Sheets['ReadMe'];
  let readmeText = '';
  if (readmeSheet) {
    const readme = XLSX.utils.sheet_to_json<any[]>(readmeSheet, { defval: '', header: 1 });
    readmeText = (readme as any[][]).map((row) => (Array.isArray(row) ? row.join('\t') : String(row))).join('\n');
    console.log('\n--- ReadMe ---');
    console.log(readmeText.slice(0, 1500));
    fs.writeFileSync(path.join(OUT_DIR, 'readme.txt'), readmeText, 'utf-8');
  }

  // Summary report
  const reportPath = path.join(ROOT, 'docs', 'BBFAW_MAPPING_EXCEL_ANALYSIS.md');
  const report = `
# BBFAW Parent Mapping Excel Analysis
**Source:** \`Database files/ETHICS Pillar/BBFAW folder/BBFAW_2024_Supermarket_Parent_Brand_Mapping_20260311.xlsx\`
**Extracted:** ${new Date().toISOString()}

## Tabs Found (actual workbook)
| Tab | Rows | Purpose |
|-----|------|---------|
| Parent_Entities | ${parentsCount} | Parent companies from BBFAW universe |
| Brand_Alias_Map | ${aliasMapCount} | Columns: ${aliasMapColumns.join(', ')} |
| ReadMe | - | Instructions |

**Note:** User spec referred to BBFAW_Parents, Brand_Mapping, Brand_Aliases. The workbook uses Parent_Entities and Brand_Alias_Map. Structure will be reconciled during implementation.

## Resolution Pipeline (per spec)
1. Barcode scan → product lookup (Open Food Facts)
2. Extract brand string (\`brand_owner\` or \`brands\`)
3. Normalize brand (lowercase, &→and, remove punctuation, collapse whitespace)
4. Match against Brand_Aliases → return canonical_brand
5. Look up canonical_brand in Brand_Mapping → return parent_company
6. Pass parent_company to BBFAW scoring engine (bbfaw2024Canonical.json)

## JSON outputs (source of truth)
- \`Database files/ETHICS Pillar/BBFAW folder/bbfawParents.json\`
- \`Database files/ETHICS Pillar/BBFAW folder/brandAliasMap.json\`

Run \`yarn sync-ethics-data\` to copy these to \`src/data/ethics/\` for app bundle.
`;
  ensureDir(path.dirname(reportPath));
  fs.writeFileSync(reportPath, report, 'utf-8');
  console.log('\nReport written to:', reportPath);
}

main();
