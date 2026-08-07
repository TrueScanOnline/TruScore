/**
 * Runtime loader for Dynamic Signals Asset v0.2 (Node/tests + optional app wiring).
 */

import fs from 'fs';
import path from 'path';
import { parseCsv } from '../../../identity/workstreamA/csv';
import {
  buildProductFamilyMapsFromCsvRecords,
  type ProductFamilyMaps,
} from '../../../identity/chaining/productFamilyMaps';
import {
  buildBrandHierarchyMapsFromCsvRecords,
  buildEntityHierarchyMapsFromCsvRecords,
} from '../../../identity/chaining/brandEntityHierarchyMaps';
import type { AssetPackParsed } from './matchDynamicSignalsAsset';

export function isDynamicSignalsAssetRuntimeEnabled(): boolean {
  return process.env.EXPO_PUBLIC_DYNAMIC_SIGNALS_ASSET === '1';
}

export function loadDynamicSignalsAssetPackFromDisk(roots?: {
  packInputRoot?: string;
  familyExtRoot?: string;
}): AssetPackParsed {
  const repoRoot = path.resolve(__dirname, '..', '..', '..', '..');
  const packRoot =
    roots?.packInputRoot ?? path.join(repoRoot, 'workstreamC', 'c-data', 'dynamic-signals-v0.2', 'input');
  const famRoot =
    roots?.familyExtRoot ??
    path.join(repoRoot, 'workstreamA', 'a-data', 'chaining-extensions', 'v0.1');

  const read = (p: string) => (fs.existsSync(p) ? parseCsv(fs.readFileSync(p, 'utf8')) : []);

  const familyMaps: ProductFamilyMaps = buildProductFamilyMapsFromCsvRecords(
    read(path.join(famRoot, 'product_families.csv')),
    read(path.join(famRoot, 'product_family_membership.csv'))
  );

  return {
    sources: read(path.join(packRoot, 'source_universe.csv')),
    signals: read(path.join(packRoot, 'signals.csv')),
    targets: read(path.join(packRoot, 'signal_targets.csv')),
    familyMaps,
    brandHierarchy: buildBrandHierarchyMapsFromCsvRecords(
      read(path.join(famRoot, 'brand_child_of_brand.csv'))
    ),
    entityHierarchy: buildEntityHierarchyMapsFromCsvRecords(
      read(path.join(famRoot, 'entity_child_of_entity.csv'))
    ),
  };
}
