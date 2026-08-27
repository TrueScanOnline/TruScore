/**
 * Progressive Product Query Service — Wave 2 stub
 *
 * Multi-provider progressive merge/query is demised. Production product retrieval
 * is cache → World OFF exact-GTIN (see productServiceOptimized). This file remains
 * so imports do not break; it no longer fans out or calls mergeProducts.
 */

import { Product } from '../../types/product';
import { logger } from '../../utils/logger';

export interface ProgressiveQueryOptions {
  onProductUpdate?: (product: Product) => void;
  earlyProductName?: string | null;
}

/**
 * Demised multi-provider progressive query — returns a minimal placeholder only.
 * Do not use for production retrieval; use fetchProductOptimized instead.
 */
export async function queryAllDatabasesProgressive(
  barcode: string,
  _userCountry: string | null,
  _options: ProgressiveQueryOptions = {}
): Promise<Product> {
  logger.debug(
    `[TruScoreOptimizedDatabaseProgressive] multi-provider progressive query demised for ${barcode}`
  );
  return {
    barcode,
    product_name: `Product ${barcode}`,
    source: 'unknown',
  } as Product;
}
