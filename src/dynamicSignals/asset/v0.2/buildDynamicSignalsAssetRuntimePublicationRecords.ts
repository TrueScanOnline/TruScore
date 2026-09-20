/**
 * App/runtime entry for Dynamic Signals Asset v0.2.
 * Respects structural mutual exclusion vs Skeleton (Asset is production successor).
 *
 * Dynamic Signals Asset is the sole production Signal-content authority.
 * Food Recall Matcher is eligibility-only and cannot originate public Signals alone.
 *
 * Must not import Node `fs` — Metro/EAS Bundle JavaScript cannot resolve it.
 */

import type { Product } from '../../../types/product';
import { resolveReviewedRetailChainUnified } from '../../../workstreamC/skeleton/resolveWorkstreamCRetailChain';
import type { CocoaChocolateProductScopeEvidence } from './cocoaChocolateProductScopeGuard';
import {
  buildDynamicSignalsAssetPublicationRecords,
  type AssetPackParsed,
  type AssetScanIdentity,
} from './matchDynamicSignalsAsset';
import {
  isDynamicSignalsAssetRuntimeEnabled,
  loadADataForChainFromEmbed,
  loadDynamicSignalsAssetPackFromEmbed,
} from './loadDynamicSignalsAssetPack';
import { resolveReviewedProductFamilyIdsFromScan } from '../../../identity/chaining/productFamilyMaps';
import { resolveReviewedProductIdentityIdsFromScan } from '../../../identity/chaining/productIdentityMaps';
import { brandIsDescendantOf } from '../../../identity/chaining/brandEntityHierarchyMaps';
import { buildAssetGovernedFoodRecallPublicationRecords } from './buildAssetGovernedFoodRecallPublicationRecords';
import { resolveActiveSignalsProducer } from './signalsProducerGuard';
import type { DynamicSignalPublicationRecord } from '../../publish/types';
import type { FoodRecallSubmittedMarkings } from '../../../workstreamC/recall';

export { isDynamicSignalsAssetRuntimeEnabled };

/**
 * Returns [] unless Asset is the active producer (or `pack` injected for tests).
 * Appends Asset-governed Food Recall Matcher Safety records only — never MILO-originated content.
 *
 * Production identity flow:
 *   scan product fields → reviewed brand/parent chain → family/product-identity aliases
 *   → Asset target evaluation (+ Food Recall batch/date overlay for Safety).
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
  /** Test-only override — production must leave undefined so the resolver runs. */
  productFamilyIds?: string[];
  /** Test-only override — production must leave undefined so the resolver runs. */
  productIdentityIds?: string[];
  foodRecallMarkings?: FoodRecallSubmittedMarkings | null;
  evaluationClockIso?: string;
  /** Tests: bypass producer guard */
  forceRun?: boolean;
  includeNonPublishable?: boolean;
}): DynamicSignalPublicationRecord[] {
  const testingOverride = input.pack !== undefined || input.forceRun === true;
  if (!testingOverride) {
    const producer = resolveActiveSignalsProducer(input.logLines);
    if (producer !== 'asset') return [];
  }

  const pack = input.pack ?? loadDynamicSignalsAssetPackFromEmbed();
  const logs = input.logLines;

  let brand_id: string | null = input.injectedBrandId ?? null;
  let parent_id: string | null = input.injectedParentId ?? null;

  if (input.injectedBrandId === undefined && input.injectedParentId === undefined) {
    const { aData, brandRows, aliasRows, brandChildRows } = loadADataForChainFromEmbed();
    const chain = resolveReviewedRetailChainUnified({
      barcode: input.barcode,
      productName: input.productName,
      product: input.product ?? null,
      aData,
      canonicalBrandRows: brandRows,
      brandAliasRows: aliasRows,
      brandChildRows,
      logLines: logs,
      applyCadburyUatBridge: false,
    });
    brand_id = chain?.brand_id ?? null;
    parent_id = chain?.parent_id ?? null;
  }

  const brandIsUnderAnchor = (scanBrandId: string, anchorBrandId: string) =>
    brandIsDescendantOf(pack.brandHierarchy, scanBrandId, anchorBrandId);

  const product_family_ids =
    input.productFamilyIds ??
    resolveReviewedProductFamilyIdsFromScan({
      maps: pack.familyMaps,
      barcode: input.barcode,
      brand_id,
      parent_id,
      productName: input.productName,
      scanMarketPublic: input.scanMarketPublic,
      brandIsUnderAnchor,
    });

  const product_identity_ids =
    input.productIdentityIds ??
    (pack.productIdentityMaps
      ? resolveReviewedProductIdentityIdsFromScan({
          maps: pack.productIdentityMaps,
          brand_id,
          parent_id,
          productName: input.productName,
          scanMarketPublic: input.scanMarketPublic,
          brandIsUnderAnchor,
        })
      : []);

  logs?.push(
    `identity_resolve: brand=${brand_id ?? '(none)'} parent=${parent_id ?? '(none)'} families=${product_family_ids.join('|') || '(none)'} products=${product_identity_ids.join('|') || '(none)'}`
  );

  const productScopeEvidence: CocoaChocolateProductScopeEvidence | null = input.product
    ? {
        product_name: input.product.product_name ?? input.productName,
        generic_name: input.product.generic_name,
        categories: input.product.categories,
        categories_tags: input.product.categories_tags,
        ingredients_text: input.product.ingredients_text,
      }
    : input.productName
      ? { product_name: input.productName }
      : null;

  const evaluationClock = input.evaluationClockIso
    ? { nowIso: () => input.evaluationClockIso as string }
    : undefined;

  const scanIdentity: AssetScanIdentity = {
    barcode: input.barcode,
    brand_id,
    parent_id,
    product_family_ids,
    product_identity_ids,
    scanMarketPublic: input.scanMarketPublic,
    productScopeEvidence,
  };

  const assetRecords = buildDynamicSignalsAssetPublicationRecords({
    pack,
    identity: scanIdentity,
    logLines: logs,
    includeNonPublishable: input.includeNonPublishable ?? false,
    evaluationClock,
  });

  const recallRecords = buildAssetGovernedFoodRecallPublicationRecords({
    pack,
    barcode: input.barcode,
    scanMarketPublic: input.scanMarketPublic,
    foodRecallMarkings: input.foodRecallMarkings,
    evaluationClockIso: input.evaluationClockIso,
    logLines: logs,
    includeNonPublishable: input.includeNonPublishable ?? false,
    scanIdentity,
  });

  // Dedupe by signal_id — Asset-governed recall eligibility wins for Safety notices it owns
  const seen = new Set(recallRecords.map((r) => r.signal_id));
  const merged = [...recallRecords];
  for (const r of assetRecords) {
    if (seen.has(r.signal_id)) continue;
    seen.add(r.signal_id);
    merged.push(r);
  }
  return merged;
}
