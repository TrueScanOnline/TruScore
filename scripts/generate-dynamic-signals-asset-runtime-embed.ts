/**
 * Generate Metro-safe embedded Dynamic Signals Asset v0.2 pack + A-data rows.
 * App runtime must not import Node `fs` — EAS Bundle JavaScript fails otherwise.
 *
 * Usage: npx ts-node --project scripts/tsconfig.json scripts/generate-dynamic-signals-asset-runtime-embed.ts
 */

import fs from 'fs';
import path from 'path';
import { parseCsv } from '../src/identity/workstreamA/csv';

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(
  ROOT,
  'src',
  'dynamicSignals',
  'asset',
  'v0.2',
  'dynamicSignalsAssetRuntimeEmbed.generated.ts'
);

function readCsv(filePath: string) {
  if (!fs.existsSync(filePath)) return [];
  return parseCsv(fs.readFileSync(filePath, 'utf8'));
}

function main() {
  const packRoot = path.join(ROOT, 'workstreamC', 'c-data', 'dynamic-signals-v0.2', 'input');
  const famRoot = path.join(ROOT, 'workstreamA', 'a-data', 'chaining-extensions', 'v0.2');
  const aRoot = path.join(ROOT, 'workstreamA', 'a-data', 'wave1-v0.15', 'input');
  const extRoot = famRoot;

  const embed = {
    generatedAt: new Date().toISOString(),
    sources: readCsv(path.join(packRoot, 'source_universe.csv')),
    signals: readCsv(path.join(packRoot, 'signals.csv')),
    targets: readCsv(path.join(packRoot, 'signal_targets.csv')),
    productFamilies: readCsv(path.join(famRoot, 'product_families.csv')),
    productFamilyMembership: readCsv(path.join(famRoot, 'product_family_membership.csv')),
    brandChildOfBrand: readCsv(path.join(famRoot, 'brand_child_of_brand.csv')),
    entityChildOfEntity: readCsv(path.join(famRoot, 'entity_child_of_entity.csv')),
    foodRecallEligibility: readCsv(path.join(packRoot, 'food_recall_eligibility.csv')),
    foodRecallNotices: readCsv(path.join(packRoot, 'food_recall_notices.csv')),
    foodRecallAffectedVariants: readCsv(path.join(packRoot, 'food_recall_affected_variants.csv')),
    foodRecallRelatedGtins: readCsv(path.join(packRoot, 'food_recall_related_gtins.csv')),
    brandRows: [
      ...readCsv(path.join(aRoot, 'canonical_brands.csv')),
      ...readCsv(path.join(extRoot, 'canonical_brands_extension.csv')),
    ],
    parentRows: [
      ...readCsv(path.join(aRoot, 'canonical_parents.csv')),
      ...readCsv(path.join(extRoot, 'canonical_parents_extension.csv')),
    ],
    gtinRows: [
      ...readCsv(path.join(aRoot, 'gtin_brand_links.csv')),
      ...readCsv(path.join(extRoot, 'gtin_brand_links_extension.csv')),
    ],
    aliasRows: [
      ...readCsv(path.join(aRoot, 'brand_aliases.csv')),
      ...readCsv(path.join(extRoot, 'brand_aliases_extension.csv')),
    ],
  };

  const body = `/* AUTO-GENERATED — do not edit by hand.
 * Run: npm run generate:dsa-asset-runtime-embed
 * Source: governed Dynamic Signals Asset v0.2 CSVs + Shared Identity (wave1 + chaining-extensions).
 */
import type { CsvRecord } from '../../../identity/workstreamA/csv';

export type DynamicSignalsAssetRuntimeEmbed = {
  generatedAt: string;
  sources: CsvRecord[];
  signals: CsvRecord[];
  targets: CsvRecord[];
  productFamilies: CsvRecord[];
  productFamilyMembership: CsvRecord[];
  brandChildOfBrand: CsvRecord[];
  entityChildOfEntity: CsvRecord[];
  foodRecallEligibility: CsvRecord[];
  foodRecallNotices: CsvRecord[];
  foodRecallAffectedVariants: CsvRecord[];
  foodRecallRelatedGtins: CsvRecord[];
  brandRows: CsvRecord[];
  parentRows: CsvRecord[];
  gtinRows: CsvRecord[];
  aliasRows: CsvRecord[];
};

export const DYNAMIC_SIGNALS_ASSET_RUNTIME_EMBED: DynamicSignalsAssetRuntimeEmbed = ${JSON.stringify(
    embed,
    null,
    2
  )} as DynamicSignalsAssetRuntimeEmbed;
`;

  fs.writeFileSync(OUT, body, 'utf8');
  console.log(`Wrote ${path.relative(ROOT, OUT)}`);
  console.log(
    `rows: signals=${embed.signals.length} targets=${embed.targets.length} brands=${embed.brandRows.length} gtins=${embed.gtinRows.length}`
  );
}

main();
