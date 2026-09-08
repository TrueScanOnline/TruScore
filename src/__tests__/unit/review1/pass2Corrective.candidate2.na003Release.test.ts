/**
 * Pass 2 Candidate 2 — NA-003 object-release + Result defence predicates.
 * Complements sustained-scan Optimized path coverage.
 */

import {
  CORE_TRUTH_PRODUCT_CACHE_AUTHORITY,
  hasCoreTruthAuthority,
  stampCoreTruthAuthority,
} from '../../../config/coreTruthProductCacheAuthority';
import { createMinimalProduct } from '../../../services/errorHandlingService';
import {
  processCachedProduct,
  processSQLiteProduct,
} from '../../../services/productCacheService';
import { applyGovernedProductTransforms } from '../../../services/productEnhancementService';
import type { Product } from '../../../types/product';
import { getPrimaryBarcode } from '../../../utils/barcodeNormalization';

jest.mock('../../../services/userContributedProductsService', () => ({
  mergeUserContributedData: jest.fn(async (p: Product) => p),
  getUserContributedProduct: jest.fn(async () => null),
  USER_CONTRIBUTED_MERGE_RACE_MS: 50,
}));

jest.mock('../../../services/sqliteProductDatabase', () => ({
  saveProductToSQLite: jest.fn(async () => true),
  lookupProductInSQLite: jest.fn(async () => null),
}));

jest.mock('../../../utils/countryDetection', () => ({
  getUserCountryCode: jest.fn(() => 'NZ'),
}));

/**
 * Mirrors app/result/[barcode].tsx authoritativeProductForScan (Candidate 2 defence-in-depth).
 */
function authoritativeProductForScan(
  product: Product | null | undefined,
  routeBarcode: string
): Product | null {
  if (!product) return null;
  if (getPrimaryBarcode(product.barcode) !== getPrimaryBarcode(routeBarcode)) return null;
  if (!hasCoreTruthAuthority(product)) return null;
  return product;
}

describe('Pass 2 Candidate 2 — NA-003 object release / Result defence', () => {
  it('createMinimalProduct returns null (no interpretive fallback Product)', () => {
    expect(createMinimalProduct('9300652815573')).toBeNull();
  });

  it('processCachedProduct releases null for unstamped source=openfoodfacts legacy', async () => {
    const legacy: Product = {
      barcode: '9300652815573',
      product_name: 'Legacy OFF-labelled',
      source: 'openfoodfacts',
      nutriscore_grade: 'b',
    };
    expect(await processCachedProduct(legacy, legacy.barcode)).toBeNull();
  });

  it('processSQLiteProduct releases null for unstamped local row', async () => {
    const legacy: Product = {
      barcode: '9300652815573',
      product_name: 'SQLite Legacy',
      source: 'sqlite',
    };
    expect(await processSQLiteProduct(legacy, legacy.barcode)).toBeNull();
  });

  it('processCachedProduct releases stamped Core Truth product', async () => {
    const stamped = stampCoreTruthAuthority({
      barcode: '9300652815573',
      product_name: 'Authorised',
      source: 'openfoodfacts',
      nutriscore_grade: 'b',
      ingredients_text: 'oats',
    });
    const out = await processCachedProduct(stamped, stamped.barcode!);
    expect(out).not.toBeNull();
    expect(hasCoreTruthAuthority(out)).toBe(true);
  });

  it('unstamped openfoodfacts object cannot become productForScan (Result predicate)', () => {
    const legacy: Product = {
      barcode: '9300652815573',
      product_name: 'Legacy',
      source: 'openfoodfacts',
    };
    expect(authoritativeProductForScan(legacy, '9300652815573')).toBeNull();
  });

  it('stamped product can become productForScan (Result predicate)', () => {
    const stamped = stampCoreTruthAuthority({
      barcode: '9300652815573',
      product_name: 'OK',
      source: 'openfoodfacts',
    });
    expect(authoritativeProductForScan(stamped, '9300652815573')).toBe(stamped);
  });

  it('source=openfoodfacts alone does not grant stamp via applyGovernedProductTransforms', () => {
    const p: Product = {
      barcode: '1',
      product_name: 'X',
      source: 'openfoodfacts',
      nutriscore_grade: 'c',
      ingredients_text: 'water',
    };
    applyGovernedProductTransforms(p, { stampAuthority: false });
    expect(hasCoreTruthAuthority(p)).toBe(false);
    applyGovernedProductTransforms(p, { stampAuthority: true });
    expect(p._rveelCoreTruthAuthority).toBe(CORE_TRUTH_PRODUCT_CACHE_AUTHORITY);
  });
});
