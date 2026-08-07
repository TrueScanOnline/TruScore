/**
 * App/runtime entry for Dynamic Signals Asset v0.2.
 */

import fs from 'fs';
import path from 'path';
import type { Product } from '../../../types/product';
import { parseCsv } from '../../../identity/workstreamA/csv';
import { buildADataMapsFromCsvRecords } from '../../../workstreamC/skeleton/workstreamCPublicationCore';
import { resolveReviewedRetailChainUnified } from '../../../workstreamC/skeleton/resolveWorkstreamCRetailChain';
import {
  buildDynamicSignalsAssetPublicationRecords,
  type AssetPackParsed,
} from './matchDynamicSignalsAsset';
import { isDynamicSignalsAssetRuntimeEnabled, loadDynamicSignalsAssetPackFromDisk } from './loadDynamicSignalsAssetPack';
import { reviewedFamilyIdsForGtin } from '../../../identity/chaining/productFamilyMaps';
import type { DynamicSignalPublicationRecord } from '../../publish/types';

export { isDynamicSignalsAssetRuntimeEnabled };

function loadADataForChain() {
  const repoRoot = path.resolve(__dirname, '..', '..', '..', '..');
  const aRoot = path.join(repoRoot, 'workstreamA', 'a-data', 'wave1-v0.14', 'input');
  const read = (name: string) => parseCsv(fs.readFileSync(path.join(aRoot, name), 'utf8'));
  const brandRows = read('canonical_brands.csv');
  const parentRows = read('canonical_parents.csv');
  const gtinRows = read('gtin_brand_links.csv');
  const aliasRows = read('brand_aliases.csv');
  return {
    aData: buildADataMapsFromCsvRecords(brandRows, parentRows, gtinRows),
    brandRows,
    aliasRows,
  };
}

/**
 * Returns [] when Asset runtime flag is off (unless `pack` is injected for tests).
 * Uses chaining brand/parent without Skeleton Cadbury UAT bridge.
 * Candidate Signals do not become public (builder omits non-publishable).
 */
export function buildDynamicSignalsAssetRuntimePublicationRecords(input: {
  barcode: string;
  productName: string;
  product?: Product | null;
  scanMarketPublic: 'AU' | 'NZ' | 'UNKNOWN';
  logLines?: string[];
  pack?: AssetPackParsed;
  injectedBrandId?: string | null;
  injectedParentId?: string | null;
  productFamilyIds?: string[];
}): DynamicSignalPublicationRecord[] {
  const testingWithPack = input.pack !== undefined;
  if (!testingWithPack && !isDynamicSignalsAssetRuntimeEnabled()) {
    return [];
  }

  const pack = input.pack ?? loadDynamicSignalsAssetPackFromDisk();
  const logs = input.logLines;

  let brand_id: string | null = input.injectedBrandId ?? null;
  let parent_id: string | null = input.injectedParentId ?? null;

  if (input.injectedBrandId === undefined && input.injectedParentId === undefined) {
    const { aData, brandRows, aliasRows } = loadADataForChain();
    const chain = resolveReviewedRetailChainUnified({
      barcode: input.barcode,
      productName: input.productName,
      product: input.product ?? null,
      aData,
      canonicalBrandRows: brandRows,
      brandAliasRows: aliasRows,
      logLines: logs,
      applyCadburyUatBridge: false,
    });
    brand_id = chain?.brand_id ?? null;
    parent_id = chain?.parent_id ?? null;
  }

  const product_family_ids =
    input.productFamilyIds ??
    reviewedFamilyIdsForGtin(pack.familyMaps, input.barcode, input.scanMarketPublic);

  return buildDynamicSignalsAssetPublicationRecords({
    pack,
    identity: {
      barcode: input.barcode,
      brand_id,
      parent_id,
      product_family_ids,
      scanMarketPublic: input.scanMarketPublic,
    },
    logLines: logs,
    includeNonPublishable: false,
  });
}
