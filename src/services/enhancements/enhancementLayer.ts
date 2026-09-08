/**
 * MVP Enhancement Layer — RETIRED from live product-truth pipeline (Review 1 Pass 2 / NA-004).
 *
 * EWG / WWF / Leaping Bunny runtime mutation of authoritative product fields is no longer applied.
 * Modules remain in-tree for possible post-MVP reconsideration; they must not be re-wired without
 * separate founder governance.
 */

import { Product } from '../../types/product';
import { logger } from '../../utils/logger';

/**
 * @deprecated NA-004 — no-op. Does not mutate labels_tags / ingredients_analysis_tags / etc.
 */
export async function applyMVPEnhancements(
  product: Product,
  _userCountry?: string
): Promise<Product> {
  logger.debug('[EnhancementLayer] Retired — skipping non-governed MVP enhancements');
  return product;
}

/**
 * @deprecated NA-004 — always false.
 */
export function hasEnhancements(_product: Product): boolean {
  return false;
}

/**
 * @deprecated NA-004 — empty status.
 */
export function getEnhancementSummary(_product: Product): {
  ewg: boolean;
  wwf: boolean;
  leapingBunny: boolean;
} {
  return { ewg: false, wwf: false, leapingBunny: false };
}
