import type { Product } from '../../types/product';
import type { SharedIdentityContext } from '../types';
import type {
  IdentityCoverageScorecard,
  IdentityReviewQueueItem,
  IdentitySeedSourceRecord,
  IdentityStewardActionLogEntry,
} from './types';

const OWN_LABEL_KEYWORDS = [
  'woolworths',
  'coles',
  'countdown',
  'new world',
  'paknsave',
  'iga',
  'aldi',
] as const;

/**
 * Slice 2 helper only: bounded own-label prioritization heuristic.
 * This is not a definitive ownership-truth source.
 */

const seedRecords: IdentitySeedSourceRecord[] = [];
const stewardshipLog: IdentityStewardActionLogEntry[] = [];

export function recordIdentitySeedSource(record: IdentitySeedSourceRecord): void {
  seedRecords.push(record);
}

export function listIdentitySeedSources(): IdentitySeedSourceRecord[] {
  return [...seedRecords];
}

export function logIdentityStewardAction(entry: IdentityStewardActionLogEntry): void {
  stewardshipLog.push(entry);
}

export function listIdentityStewardActions(): IdentityStewardActionLogEntry[] {
  return [...stewardshipLog];
}

export function isOwnLabelPriorityProduct(product: Product): boolean {
  const candidates = [product.brand_owner, product.brands, product.product_name]
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    .map((v) => v.toLowerCase());
  return candidates.some((s) => OWN_LABEL_KEYWORDS.some((kw) => s.includes(kw)));
}

export function buildIdentityCoverageScorecard(input: {
  contexts: SharedIdentityContext[];
  ownLabelProducts?: Product[];
  generatedAt?: string;
}): IdentityCoverageScorecard {
  const { contexts, ownLabelProducts = [], generatedAt = new Date().toISOString() } = input;
  const by_market: IdentityCoverageScorecard['by_market'] = { AU: 0, NZ: 0, 'AU+NZ': 0 };
  let ambiguity_count = 0;
  let reviewed_count = 0;

  for (const c of contexts) {
    by_market[c.resolution_key.market_key] += 1;
    if (c.quality.ambiguity_flags.length > 0) ambiguity_count += 1;
    if (c.quality.review_state === 'reviewed') reviewed_count += 1;
  }

  const own_label_priority_count = ownLabelProducts.filter(isOwnLabelPriorityProduct).length;

  // Support metric only. This is not yet the authoritative denominator/proof
  // for the 80% AU/NZ shelf relevance target.
  return {
    generated_at: generatedAt,
    total_contexts: contexts.length,
    by_market,
    ambiguity_count,
    reviewed_count,
    own_label_priority_count,
  };
}

export function buildIdentityReviewQueue(input: {
  contexts: SharedIdentityContext[];
  nowIso?: string;
}): IdentityReviewQueueItem[] {
  const now = input.nowIso ?? new Date().toISOString();
  return input.contexts
    .filter((c) => c.quality.ambiguity_flags.length > 0 || c.quality.resolution_status !== 'resolved')
    .map((c) => {
      const hasMissingBrand = c.quality.ambiguity_flags.includes('missing_brand_candidate');
      const hasMultipleBrands = c.quality.ambiguity_flags.includes('multiple_brand_candidates');
      const reason: IdentityReviewQueueItem['reason'] = hasMissingBrand
        ? 'missing_brand_candidate'
        : hasMultipleBrands
          ? 'multiple_brand_candidates'
          : 'resolution_not_resolved';
      return {
        id: `rq:${c.resolution_key.gtin}:${c.resolution_key.market_key}`,
        gtin: c.resolution_key.gtin,
        market_key: c.resolution_key.market_key,
        reason,
        priority: hasMissingBrand ? 'high' : 'medium',
        created_at: now,
      };
    });
}

