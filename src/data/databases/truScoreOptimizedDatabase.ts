// TruScore-Optimized Database Service
// Wave 2: multi-provider fan-out demised. Production path is cache → World OFF (productServiceOptimized).
// This class remains as a minimal compatibility surface for legacy imports/tests.

import { Product } from '../../types/product';
import { logger } from '../../utils/logger';

export type QueryAllDatabasesOptions = {
  /** Phase-1 hits (e.g. Open Food Facts) — avoids duplicate identical API calls in this session. */
  seedProducts?: Product[] | null;
};

export class TruScoreOptimizedDatabase {
  /**
   * Query all databases — demised stub.
   * Production product retrieval: cache → World OFF exact-GTIN (see productServiceOptimized).
   */
  async queryAllDatabases(
    barcode: string,
    _userCountry: string | null,
    _earlyProductName?: string | null,
    _onProductUpdate?: (product: Product, source: string) => void,
    _options?: QueryAllDatabasesOptions
  ): Promise<Product[]> {
    logger.debug(
      `[TruScoreOptimizedDatabase] multi-provider queryAllDatabases demised — returning [] for ${barcode}`
    );
    return [];
  }

  /**
   * Source weights retained for compatibility/tests (historical mergeProducts weight map).
   */
  getTruScoreSourceWeights(): Record<string, number> {
    return {
      'fsanz_au': 0.50,
      'fsanz_nz': 0.50,
      'nzfcd': 0.50,
      'afcd': 0.50,
      'usda_fooddata': 0.50,
      'health_canada_cnf': 0.50,
      'uk_fsa': 0.50,
      'efsa': 0.50,
      'gs1_datasource': 0.45,
      'openfoodfacts': 0.45,
      'openbeautyfacts': 0.40,
      'openpetfoodfacts': 0.40,
      'openproductsfacts': 0.35,
      'woolworths_au': 0.35,
      'coles_au': 0.35,
      'woolworths_nz': 0.35,
      'paknsave': 0.35,
      'newworld': 0.35,
      'tesco_labs': 0.35,
      'walmart_open': 0.35,
      'foodrepo': 0.35,
      'edamam': 0.30,
      'nutritionix': 0.30,
      'spoonacular': 0.30,
      'datakick': 0.25,
      'openean': 0.22,
      'product_open_data': 0.25,
      'upcitemdb': 0.20,
      'ean_search': 0.20,
      'barcode_spider': 0.20,
      'foodb': 0.30,
      'foodatlas': 0.35,
      'world_food_db': 0.30,
      'barcode_lookup_com': 0.25,
      'web_search': 0.10,
    };
  }
}
