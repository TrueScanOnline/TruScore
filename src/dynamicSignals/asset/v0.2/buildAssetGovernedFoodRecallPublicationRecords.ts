/**
 * Food Recall overlay — retired from the active consumer path (MVP doctrine, 22 Sep 2026).
 *
 * Safety & Regulatory recalls now publish through ordinary Dynamic Signals Asset matching:
 * governed product/product-line scope (brand/parent + market + reviewed product_name
 * descriptor) is the sole display trigger, and the Signal's own editorial copy is the card.
 * Affected pack size, batch codes, best-before dates and retailers are qualification content
 * carried in that editorial copy — never Stage 2 match-state gates.
 *
 * `evaluateStructuredFoodRecallMatch` and the Stage 2 five-state contract remain in the
 * repository for provenance only and are no longer wired to consumer publication.
 */

import type { DynamicSignalPublicationRecord } from '../../publish/types';
import { isFoodRecallCorrectedPathEnabled } from '../../../workstreamC/recall';
import type { AssetPackParsed, AssetScanIdentity } from './matchDynamicSignalsAsset';
import { assetTargetProductScopeMatches } from './matchDynamicSignalsAsset';

function marketAllows(scan: 'AU' | 'NZ' | 'UNKNOWN', linkMarket: string): boolean {
  if (scan === 'UNKNOWN') return false;
  if (linkMarket === 'AU+NZ') return scan === 'AU' || scan === 'NZ';
  return linkMarket === scan;
}

function targetResolutionAllowsMatch(status: string): boolean {
  return status === 'resolved' || status === 'resolved_with_warning';
}

/**
 * True when governed Safety product/product_family targets match via Workstream C
 * product-scope criteria (ordinary scan fields + brand/parent chain).
 *
 * Same rule the Asset matcher applies; retained so callers can reason about Safety
 * product scope without re-deriving it.
 */
export function scanIdentitySatisfiesSafetyTargets(
  pack: AssetPackParsed,
  signalId: string,
  identity: AssetScanIdentity
): boolean {
  for (const tgt of pack.targets) {
    if ((tgt.signal_id ?? '').trim() !== signalId) continue;
    if (!marketAllows(identity.scanMarketPublic, (tgt.market_key ?? '').trim())) continue;
    if (!targetResolutionAllowsMatch((tgt.resolution_status ?? '').trim())) continue;

    const targetType = (tgt.target_type ?? '').trim();
    const mode = (tgt.propagation_mode ?? '').trim();
    if (targetType !== 'product' && targetType !== 'product_family') continue;
    if (targetType === 'product' && mode !== 'exact_only') continue;
    if (targetType === 'product_family' && mode !== 'family_members') continue;

    if (assetTargetProductScopeMatches(pack, tgt, identity)) return true;
  }
  return false;
}

/**
 * Always returns []. Safety publication is owned by `buildDynamicSignalsAssetPublicationRecords`,
 * so this overlay would only duplicate (and previously downgrade) the governed card.
 *
 * `EXPO_PUBLIC_FOOD_RECALL_CORRECTED_PATH` is read only to keep the kill-switch observable
 * in scan logs; it can neither activate nor suppress content on the MVP path.
 */
export function buildAssetGovernedFoodRecallPublicationRecords(input: {
  pack: AssetPackParsed;
  barcode: string;
  scanMarketPublic: 'AU' | 'NZ' | 'UNKNOWN';
  evaluationClockIso?: string;
  logLines?: string[];
  includeNonPublishable?: boolean;
  scanIdentity?: AssetScanIdentity;
}): DynamicSignalPublicationRecord[] {
  input.logLines?.push(
    `food_recall_matcher_kill_switch=${isFoodRecallCorrectedPathEnabled() ? '1' : '0'}`
  );
  input.logLines?.push(
    'mvp_recall: stage2_matcher_retired — Safety publishes via governed Asset product scope'
  );
  return [];
}
