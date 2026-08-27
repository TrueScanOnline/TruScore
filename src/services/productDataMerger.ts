/**
 * Wave 2: Historical weighted/multi-source product construction is demised.
 * Production scoring uses canonical World OFF only — do not call mergeProducts.
 * Shared utilities that are still needed elsewhere may be re-exported below if required.
 */

import { Product } from '../types/product';
import { logger } from '../utils/logger';

export interface MergeOptions {
  sourceWeights?: Record<string, number>;
  normalizeNutrition?: boolean;
  shouldMergeCertifications?: boolean;
  barcode?: string;
  enableFieldTracking?: boolean;
}

/**
 * @deprecated Wave 2 Core Truth — external-source weighted merger removed from MVP path.
 * Returns the first product unchanged when length === 1; throws if multi-product merge is attempted.
 */
export function mergeProducts(
  products: Product[],
  _options: MergeOptions & { barcode?: string; enableFieldTracking?: boolean } = {}
): Product {
  if (!products || products.length === 0) {
    throw new Error('mergeProducts demised: cannot merge empty product array');
  }
  if (products.length === 1) {
    return products[0];
  }
  logger.error(
    '[productDataMerger] mergeProducts multi-source call blocked (Wave 2 demise of 60/40 weighted merger)'
  );
  throw new Error(
    'mergeProducts demised: multi-source weighted/cross-provider product construction is not permitted on the MVP truth path'
  );
}
