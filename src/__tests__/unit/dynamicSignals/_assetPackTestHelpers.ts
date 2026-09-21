/**
 * Helper: load Asset pack from disk CSVs using Workstream C product-scope criteria
 * + Shared Identity brand/entity hierarchy only.
 */
import fs from 'fs';
import path from 'path';
import { parseCsv, type CsvRecord } from '../../../identity/workstreamA/csv';
import { buildAssetPackFromCsvRows } from '../../../dynamicSignals/asset/v0.2/loadDynamicSignalsAssetPack';
import type { AssetPackParsed } from '../../../dynamicSignals/asset/v0.2/matchDynamicSignalsAsset';
import { buildSignalProductScopeMapsFromCsvRecords } from '../../../dynamicSignals/productScope/signalProductScopeEvaluator';

export function readCsvFile(p: string): CsvRecord[] {
  return fs.existsSync(p) ? parseCsv(fs.readFileSync(p, 'utf8')) : [];
}

export function loadAssetPackFromRoots(opts: {
  packRoot: string;
  famRoot: string;
  /** Override criteria rows (e.g. empty / seeded for negative proofs). */
  signalTargetProductCriteria?: CsvRecord[];
}): AssetPackParsed {
  const { packRoot, famRoot } = opts;
  return buildAssetPackFromCsvRows({
    sources: readCsvFile(path.join(packRoot, 'source_universe.csv')),
    signals: readCsvFile(path.join(packRoot, 'signals.csv')),
    targets: readCsvFile(path.join(packRoot, 'signal_targets.csv')),
    signalTargetProductCriteria:
      opts.signalTargetProductCriteria ??
      readCsvFile(path.join(packRoot, 'signal_target_product_criteria.csv')),
    brandChildOfBrand: readCsvFile(path.join(famRoot, 'brand_child_of_brand.csv')),
    entityChildOfEntity: readCsvFile(path.join(famRoot, 'entity_child_of_entity.csv')),
    foodRecallEligibility: readCsvFile(path.join(packRoot, 'food_recall_eligibility.csv')),
    foodRecallNotices: readCsvFile(path.join(packRoot, 'food_recall_notices.csv')),
    foodRecallAffectedVariants: readCsvFile(path.join(packRoot, 'food_recall_affected_variants.csv')),
    foodRecallRelatedGtins: readCsvFile(path.join(packRoot, 'food_recall_related_gtins.csv')),
  });
}

/** Replace product-scope maps on an existing pack (test fixture overlay). */
export function withProductScopeCriteria(
  pack: AssetPackParsed,
  criteria: CsvRecord[]
): AssetPackParsed {
  return {
    ...pack,
    productScopeMaps: buildSignalProductScopeMapsFromCsvRecords(criteria),
  };
}
