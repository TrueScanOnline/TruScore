/**
 * Source-quality classes (§3.1). Authority is never inferred from URL/name/string.
 */

import type { Product } from '../../types/product';
import type { SourceQualityClass } from './types';

/**
 * Default product-evidence class for MVP OFF/community and primary User Contribution.
 * Authoritative requires an explicit governed mapping (passed via overrides); never auto-promoted.
 */
export function defaultProductSourceQuality(product: Product): SourceQualityClass {
  const src = (product.source || '').toLowerCase();
  const userFlag = (product as Product & { _user_contributed?: boolean })._user_contributed;
  if (
    src.includes('user') ||
    src.includes('contribution') ||
    src === 'openfoodfacts' ||
    src.startsWith('off') ||
    !!userFlag
  ) {
    return 'community_or_user';
  }
  if (!product.source) {
    return 'other_or_unknown';
  }
  // Known commercial/community APIs remain community_or_user for Confidence uplift purposes.
  return 'community_or_user';
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
  // Structural Moderate from two lanes; never High without both authoritative.
  if (args.structural === 'high') return 'moderate';
  return args.structural;
}
