/**
 * Source-quality classes (§3.1). Authority is never inferred from URL/name/string.
 * Unmapped sources → other_or_unknown (no runtime source-name guessing).
 */

import type { Product } from '../../types/product';
import type { SourceQualityClass } from './types';

/** Explicit governed community/user source keys for MVP — not inferred from substrings. */
const COMMUNITY_OR_USER_SOURCES = new Set([
  'openfoodfacts',
  'user_contributed',
  'manual',
  'manual_entry',
]);

/**
 * Default product-evidence class for MVP.
 * Authoritative requires an explicit governed mapping (passed via overrides); never auto-promoted.
 */
export function defaultProductSourceQuality(product: Product): SourceQualityClass {
  const src = (product.source || '').toLowerCase().trim();
  const userFlag = (product as Product & { _user_contributed?: boolean })._user_contributed;
  if (userFlag) return 'community_or_user';
  if (!src) return 'other_or_unknown';
  if (COMMUNITY_OR_USER_SOURCES.has(src)) return 'community_or_user';
  return 'other_or_unknown';
}

/**
 * Cap structural Confidence by source class for MVP High uplift.
 * OFF/community/User Contribution never produce High unless an explicit authoritative override is set.
 */
export function applyAuthoritativeHighUplift(args: {
  structural: 'limited' | 'moderate' | 'high';
  bothLanesResolved: boolean;
  laneAAuthoritative: boolean;
  laneBAuthoritative: boolean;
}): 'limited' | 'moderate' | 'high' {
  if (!args.bothLanesResolved) {
    return args.structural === 'high' ? 'limited' : args.structural;
  }
  if (args.laneAAuthoritative && args.laneBAuthoritative) {
    return 'high';
  }
  if (args.structural === 'high') return 'moderate';
  return args.structural;
}
