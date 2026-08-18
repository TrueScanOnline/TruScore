/**
 * Node/tests-only loader — imports `fs`. Do not import from app runtime paths.
 */

import fs from 'fs';
import path from 'path';
import { parseCsv } from '../../../identity/workstreamA/csv';
import {
  buildAssetPackFromCsvRows,
  type AssetPackCsvRows,
} from './loadDynamicSignalsAssetPack';
import type { AssetPackParsed } from './matchDynamicSignalsAsset';

export function loadDynamicSignalsAssetPackFromDisk(roots?: {
  packInputRoot?: string;
  familyExtRoot?: string;
}): AssetPackParsed {
  const repoRoot = path.resolve(__dirname, '..', '..', '..', '..');
  const packRoot =
    roots?.packInputRoot ?? path.join(repoRoot, 'workstreamC', 'c-data', 'dynamic-signals-v0.3', 'input');
  const famRoot =
    roots?.familyExtRoot ??
    path.join(repoRoot, 'workstreamA', 'a-data', 'chaining-extensions', 'v0.2');

  const read = (p: string) => (fs.existsSync(p) ? parseCsv(fs.readFileSync(p, 'utf8')) : []);

  const rows: AssetPackCsvRows = {
    sources: read(path.join(packRoot, 'source_universe.csv')),
    signals: read(path.join(packRoot, 'signals.csv')),
    targets: read(path.join(packRoot, 'signal_targets.csv')),
    productFamilies: read(path.join(famRoot, 'product_families.csv')),
    productFamilyMembership: read(path.join(famRoot, 'product_family_membership.csv')),
    brandChildOfBrand: read(path.join(famRoot, 'brand_child_of_brand.csv')),
    entityChildOfEntity: read(path.join(famRoot, 'entity_child_of_entity.csv')),
    foodRecallEligibility: read(path.join(packRoot, 'food_recall_eligibility.csv')),
    foodRecallNotices: read(path.join(packRoot, 'food_recall_notices.csv')),
    foodRecallAffectedVariants: read(path.join(packRoot, 'food_recall_affected_variants.csv')),
    foodRecallRelatedGtins: read(path.join(packRoot, 'food_recall_related_gtins.csv')),
  };

  return buildAssetPackFromCsvRows(rows);
}
