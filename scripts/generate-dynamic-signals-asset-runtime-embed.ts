/**
 * Generate Metro-safe embedded Dynamic Signals Asset pack + A-data rows.
 * Source pack: workstreamC/c-data/dynamic-signals-v0.3/input
 * Shared Identity: brands / parents / aliases / brand+entity hierarchy only.
 * Product scope: Workstream C signal_target_product_criteria.
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
  const packRoot = path.join(ROOT, 'workstreamC', 'c-data', 'dynamic-signals-v0.3', 'input');
  const famRoot = path.join(ROOT, 'workstreamA', 'a-data', 'chaining-extensions', 'v0.3');
  const aRoot = path.join(ROOT, 'workstreamA', 'a-data', 'wave1-v0.16', 'input');
  const extRoot = famRoot;

  const embed = {
    // Stable stamp for deterministic regeneration proofs (content hash excludes wall-clock noise).
    generatedAt: process.env.DSA_EMBED_GENERATED_AT?.trim() || '2026-09-18T00:00:00.000Z',
    sources: readCsv(path.join(packRoot, 'source_universe.csv')),
    signals: readCsv(path.join(packRoot, 'signals.csv')),
    targets: readCsv(path.join(packRoot, 'signal_targets.csv')),
    signalTargetProductCriteria: readCsv(path.join(packRoot, 'signal_target_product_criteria.csv')),
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
    aliasRows: [
      ...readCsv(path.join(aRoot, 'brand_aliases.csv')),
      ...readCsv(path.join(extRoot, 'brand_aliases_extension.csv')),
    ],
  };

  const body = `/* AUTO-GENERATED — do not edit by hand.
 * Run: npm run generate:dsa-asset-runtime-embed
 * Source: governed Dynamic Signals Asset v0.3 CSVs + Shared Identity (wave1-v0.16 + chaining-extensions/v0.3).
 * Product scope: Workstream C signal_target_product_criteria. GTIN→brand rows are not embedded.
 */
import type { CsvRecord } from '../../../identity/workstreamA/csv';

export type DynamicSignalsAssetRuntimeEmbed = {
  generatedAt: string;
  sources: CsvRecord[];
  signals: CsvRecord[];
  targets: CsvRecord[];
  signalTargetProductCriteria: CsvRecord[];
  brandChildOfBrand: CsvRecord[];
  entityChildOfEntity: CsvRecord[];
  foodRecallEligibility: CsvRecord[];
  foodRecallNotices: CsvRecord[];
  foodRecallAffectedVariants: CsvRecord[];
  foodRecallRelatedGtins: CsvRecord[];
  brandRows: CsvRecord[];
  parentRows: CsvRecord[];
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
    `rows: signals=${embed.signals.length} targets=${embed.targets.length} brands=${embed.brandRows.length} criteria=${embed.signalTargetProductCriteria.length}`
  );
}

main();
